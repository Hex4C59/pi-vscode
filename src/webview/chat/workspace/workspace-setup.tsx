import { useUiText, type UiText } from "../../i18n/ui-text.js";
import type { ReactElement } from "react";
import type { WorkspaceStateMessage } from "../../../extension/contracts/index.js";
import type { WorkspaceSetupProps } from "../../components/index.js";
export type { WorkspaceSetupAction, WorkspaceSetupProps } from "../../components/index.js";



const blockedCopy: Partial<Record<WorkspaceStateMessage["status"], readonly [UiText, UiText]>> = {
  "multi-root": ["Single folder only", "Multiple workspace folders are not supported. Open a single local folder."],
  remote: ["Remote not supported", "Remote extension hosts are not supported, including remote file workspaces."],
  "non-file": ["Local folder required", "Non-file workspaces are not supported. Open a local folder."],
};

function actionDisabled(state: WorkspaceStateMessage): boolean {
  return state.busy || state.runtime === "starting" || state.runtime === "stopping";
}

export function WorkspaceSetup({ state, onAction }: WorkspaceSetupProps): ReactElement | null {
  const { text: t } = useUiText();
  const disabled = actionDisabled(state);

  if (state.status === "no-folder") {
    return (
      <section id="setup-no-folder" className="card">
        <h2>{t("No workspace folder")}</h2>
        <p>{t("Open a local folder to start a pi session.")}</p>
        <button id="open-folder" className="btn-primary" type="button" disabled={disabled} onClick={() => onAction({ type: "openFolder" })}>
          {t("Open folder")}
        </button>
      </section>
    );
  }

  const blocked = blockedCopy[state.status];
  if (blocked) {
    return (
      <section id="setup-blocked" className="card">
        <h2 id="blocked-title">{t(blocked[0])}</h2>
        <p id="blocked-detail">{t(blocked[1])}</p>
      </section>
    );
  }

  if (state.status === "untrusted") {
    return (
      <section id="setup-trust" className="card">
        <h2>{t("Workspace not trusted")}</h2>
        <p>{t("Grant workspace trust in VS Code before choosing pi resources.")}</p>
        <button id="manage-trust" className="btn-primary" type="button" disabled={disabled} onClick={() => onAction({ type: "manageTrust" })}>
          {t("Manage workspace trust")}
        </button>
      </section>
    );
  }

  if (state.status !== "eligible") return null;

  const folderName = state.folder?.name;
  const choiceStatus = state.choice === "allow"
    ? "Choice: allow project resources. Changing restarts runtime."
    : state.choice === "decline"
      ? "Choice: continue without project resources. Changing restarts runtime."
      : "Not chosen yet.";

  return (
    <section id="setup-resources" className="card">
      <h2 id="folder-name-heading">{folderName ? t("Project resources — {folder}", { folder: folderName }) : t("Project resources")}</h2>
      <p id="folder-path" className="muted" style={{ overflowWrap: "anywhere" }}>{state.folder?.path ?? ""}</p>
      <p>
        {t("Choose project resource consent. Controlled execution loads only the bundled approval extension; third-party extensions are disabled regardless of this choice. This is not a sandbox or tool authorization.")}
      </p>
      <div>
        <button
          id="allow"
          className="btn-secondary"
          type="button"
          aria-pressed={state.choice === "allow"}
          disabled={disabled}
          onClick={() => onAction({ type: "chooseResources", choice: "allow" })}
        >
          {t("Allow resources")}
        </button>
        <button
          id="decline"
          className="btn-secondary"
          type="button"
          aria-pressed={state.choice === "decline"}
          disabled={disabled}
          onClick={() => onAction({ type: "chooseResources", choice: "decline" })}
        >
          {t("Continue without")}
        </button>
      </div>
      <p id="choice-status" className="muted" role="status" style={{ marginTop: 8 }}>{t(choiceStatus)}</p>
    </section>
  );
}
