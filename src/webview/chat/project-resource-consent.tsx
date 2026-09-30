import { useLayoutEffect, useRef, useState, type ReactElement, type ReactNode, type RefObject } from "react";
import type { WorkspaceStateMessage } from "../../extension/contracts/index.js";
import { useUiText, type UiText } from "../components/index.js";
import { NoFolderPrompt } from "./no-folder-prompt.js";
import { ProjectResourcesPrompt } from "./project-resources-prompt.js";

/** Host intents this surface may emit. Execution and policy stay in the extension host. */
export type ProjectResourceIntent =
  | { type: "openFolder" }
  | { type: "manageTrust" }
  | { type: "chooseResources"; choice: "allow" | "decline" };

/** One ask from Send or Add context. The module decides whether a dialog opens. */
export type ProjectResourceAttempt = { nonce: number; source: "send" | "context" };

type Phase = "absent" | "no-folder" | "needs-resources" | "untrusted" | "blocked" | "settled";
type OpenPrompt = { kind: "resources" } | { kind: "folder"; context: boolean };

const blockedCopy: Record<"multi-root" | "remote" | "non-file", readonly [UiText, UiText]> = {
  "multi-root": ["Single folder only", "Multiple workspace folders are not supported. Open a single local folder."],
  remote: ["Remote not supported", "Remote extension hosts are not supported, including remote file workspaces."],
  "non-file": ["Local folder required", "Non-file workspaces are not supported. Open a local folder."],
};

function phaseOf(workspace: WorkspaceStateMessage | null): Phase {
  if (!workspace) return "absent";
  switch (workspace.status) {
    case "no-folder":
      return "no-folder";
    case "untrusted":
      return "untrusted";
    case "multi-root":
    case "remote":
    case "non-file":
      return "blocked";
    case "eligible":
      return workspace.choice === null && workspace.runtime === "not-started" ? "needs-resources" : "settled";
    default: {
      const unreachable: never = workspace.status;
      return unreachable;
    }
  }
}

/** Send stays local until a folder exists or a resource choice is recorded. */
export function needsWorkspacePreparation(workspace: WorkspaceStateMessage | null): boolean {
  const phase = phaseOf(workspace);
  return phase === "no-folder" || phase === "needs-resources";
}

function showsPrompt(prompt: OpenPrompt, phase: Phase): boolean {
  return (prompt.kind === "resources" && phase === "needs-resources")
    || (prompt.kind === "folder" && phase === "no-folder");
}

function openedBy(workspace: WorkspaceStateMessage, source: ProjectResourceAttempt["source"], draft: string, clientError: string | null): OpenPrompt | null {
  if (workspace.busy || clientError) return null;
  if (source === "send" && !draft.trim()) return null;
  const phase = phaseOf(workspace);
  if (phase === "needs-resources") return { kind: "resources" };
  if (phase === "no-folder") return { kind: "folder", context: source === "context" };
  return null;
}

function settlePrompt(
  open: OpenPrompt | null,
  workspace: WorkspaceStateMessage | null,
  attempt: ProjectResourceAttempt | null,
  seen: { nonce: number; identity: string },
  draft: string,
  clientError: string | null,
): { open: OpenPrompt | null; nonce: number; identity: string } {
  const identity = workspace ? `${workspace.viewId}:${workspace.generation}` : "";
  const phase = phaseOf(workspace);
  let next = open;
  let nonce = seen.nonce;
  if (identity !== seen.identity && next?.kind === "resources") next = null;
  if (next && !showsPrompt(next, phase)) next = null;
  if (attempt && attempt.nonce !== nonce) {
    nonce = attempt.nonce;
    next = workspace ? openedBy(workspace, attempt.source, draft, clientError) : null;
  }
  return { open: next, nonce, identity };
}

function actionDisabled(workspace: WorkspaceStateMessage): boolean {
  return workspace.busy || workspace.runtime === "starting" || workspace.runtime === "stopping";
}

/** Decides when a folder dialog, resource dialog, or blocked/untrusted notice is shown. */
export function ProjectResourceConsent({
  workspace, clientError, draft, attempt, onIntent, composer, transcript, children,
}: {
  workspace: WorkspaceStateMessage | null;
  clientError: string | null;
  draft: string;
  attempt: ProjectResourceAttempt | null;
  onIntent: (intent: ProjectResourceIntent) => void;
  composer: RefObject<HTMLTextAreaElement | null>;
  transcript: RefObject<HTMLDivElement | null>;
  children?: ReactNode;
}): ReactElement {
  const { text: t } = useUiText();
  const identity = workspace ? `${workspace.viewId}:${workspace.generation}` : "";
  const [prompt, setPrompt] = useState<OpenPrompt | null>(null);
  const [seenNonce, setSeenNonce] = useState(0);
  const [seenIdentity, setSeenIdentity] = useState(identity);
  const settled = settlePrompt(prompt, workspace, attempt, { nonce: seenNonce, identity: seenIdentity }, draft, clientError);
  if (settled.open !== prompt) setPrompt(settled.open);
  if (settled.nonce !== seenNonce) setSeenNonce(settled.nonce);
  if (settled.identity !== seenIdentity) setSeenIdentity(settled.identity);
  const open = settled.open;
  const phase = phaseOf(workspace);
  const kind = open?.kind ?? null;
  const previousKind = useRef<OpenPrompt["kind"] | null>(null);
  useLayoutEffect(() => {
    const previous = previousKind.current;
    if (previous && !kind) {
      if (previous === "folder") {
        const field = composer.current;
        const target = field && !field.disabled ? field : transcript.current;
        target?.focus({ preventScroll: true });
      } else composer.current?.focus({ preventScroll: true });
    }
    previousKind.current = kind;
  }, [kind, composer, transcript]);
  const dismiss = () => setPrompt(null);
  const preparing = phase === "no-folder" || phase === "needs-resources";
  const blocked = workspace && (workspace.status === "multi-root" || workspace.status === "remote" || workspace.status === "non-file")
    ? blockedCopy[workspace.status]
    : null;
  return <>
    {preparing && workspace?.error && !open && <p className="candidate__error" role="alert">{workspace.error}</p>}
    {children}
    {blocked && <section id="setup-blocked" className="card">
      <h2 id="blocked-title">{t(blocked[0])}</h2>
      <p id="blocked-detail">{t(blocked[1])}</p>
    </section>}
    {workspace?.status === "untrusted" && <section id="setup-trust" className="card">
      <h2>{t("Workspace not trusted")}</h2>
      <p>{t("Grant workspace trust in VS Code before choosing pi resources.")}</p>
      <button id="manage-trust" className="btn-primary" type="button" disabled={actionDisabled(workspace)} onClick={() => onIntent({ type: "manageTrust" })}>
        {t("Manage workspace trust")}
      </button>
    </section>}
    {workspace && open?.kind === "resources" && <ProjectResourcesPrompt state={workspace} onDismiss={dismiss}
      onChoose={choice => onIntent({ type: "chooseResources", choice })} />}
    {workspace && open?.kind === "folder" && <NoFolderPrompt context={open.context} onDismiss={dismiss}
      busy={!!workspace.busy || !!clientError} error={clientError ?? workspace.error}
      onOpenFolder={() => onIntent({ type: "openFolder" })} />}
    {phase === "settled" && workspace?.choice === "decline" && <p id="declined-resources" className="candidate__notice" role="status">
      {t("Project-local pi resources are not loaded.")}
    </p>}
  </>;
}
