import { useLayoutEffect, useRef, type ReactElement } from "react";
import type { WorkspaceStateMessage } from "../../extension/contracts/index.js";
import { useUiText } from "../components/index.js";

/** Defers the existing resource choice until an action needs a live project session. */
export function ProjectResourcesPrompt({ state, onDismiss, onChoose }: {
  state: WorkspaceStateMessage; onDismiss(): void; onChoose(choice: "allow" | "decline"): void;
}): ReactElement {
  const { text: t } = useUiText();
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const submitted = useRef(false);
  useLayoutEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (typeof node.showModal === "function") node.showModal(); else node.open = true;
    cancel.current?.focus();
    return () => { if (node.open && typeof node.close === "function") node.close(); };
  }, []);
  const choose = (choice: "allow" | "decline") => {
    if (submitted.current || state.busy) return;
    submitted.current = true;
    onChoose(choice);
    onDismiss();
  };
  return <dialog ref={dialog} className="candidate-settings candidate-folder-prompt" aria-label={t("Set up this project")}
    onClose={onDismiss} onKeyDown={event => { if (event.key === "Escape") event.stopPropagation(); }}>
    <header><h2>{t("Set up this project")}</h2>
      <button ref={cancel} className="candidate__icon" type="button" aria-label={t("Cancel")} onClick={onDismiss}>
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M5 15 15 5" /></svg>
      </button>
    </header>
    <section className="candidate-settings__section candidate-project-setup">
    <p>{t("Use this project's pi settings and resources?")}</p>
    <details>
      <summary>{t("What does this choice affect?")}</summary>
      <p style={{ overflowWrap: "anywhere" }}>{state.folder?.path}</p>
      <p>{t("Choose project resource consent. Controlled execution loads only the bundled approval extension; third-party extensions are disabled regardless of this choice. This is not a sandbox or tool authorization.")}</p>
    </details>
    {state.error && <p role="alert">{state.error}</p>}
    <div className="candidate-folder-prompt__actions">
      <button id="allow" className="btn-secondary" type="button" disabled={state.busy} onClick={() => choose("allow")}>{t("Allow resources")}</button>
      <button id="decline" className="btn-secondary" type="button" disabled={state.busy} onClick={() => choose("decline")}>{t("Continue without")}</button>
    </div>
    </section>
  </dialog>;
}
