import { ChatDialog } from "../../ui/chat-dialog.js";
import { useRef, type ReactElement } from "react";
import type { WorkspaceStateMessage } from "../../../extension/contracts/index.js";
import { useUiText } from "../../components/index.js";

/** Defers the existing resource choice until an action needs a live project session. */
export function ProjectResourcesPrompt({ state, onDismiss, onChoose }: {
  state: WorkspaceStateMessage; onDismiss(): void; onChoose(choice: "allow" | "decline"): void;
}): ReactElement {
  const { text: t } = useUiText();
  const cancel = useRef<HTMLButtonElement>(null);
  const submitted = useRef(false);
  const choose = (choice: "allow" | "decline") => {
    if (submitted.current || state.busy) return;
    submitted.current = true;
    onChoose(choice);
    onDismiss();
  };
  return <ChatDialog className="candidate-folder-prompt" title={t("Set up this project")} closeLabel={t("Cancel")}
    initialFocus={cancel} onClose={onDismiss} footer={
      <div className="candidate-dialog__actions">
        <button id="allow" className="candidate-dialog__action" type="button" disabled={state.busy} onClick={() => choose("allow")}>{t("Allow resources")}</button>
        <button id="decline" className="candidate-dialog__action" type="button" disabled={state.busy} onClick={() => choose("decline")}>{t("Continue without")}</button>
        <button ref={cancel} className="candidate-dialog__action is-quiet" type="button" aria-label={t("Keep editing")} onClick={onDismiss}>{t("Keep editing")}</button>
      </div>
    }>
    <div className="candidate-folder-prompt__copy">
      <p>{t("Use this project's pi settings and resources?")}</p>
      <p className="candidate-folder-prompt__note">{t("A project session needs an explicit resource choice before it can start.")}</p>
      <details>
        <summary>{t("What does this choice affect?")}</summary>
        <p className="candidate-folder-prompt__path">{state.folder?.path}</p>
        <p>{t("Choose project resource consent. Controlled execution loads only the bundled approval extension; third-party extensions are disabled regardless of this choice. This is not a sandbox or tool authorization.")}</p>
      </details>
      <p className="candidate-folder-prompt__note">{t("Cancel keeps this draft and does not grant consent or start a runtime.")}</p>
      {state.error && <p className="candidate-settings__error" role="alert">{state.error}</p>}
    </div>
  </ChatDialog>;
}
