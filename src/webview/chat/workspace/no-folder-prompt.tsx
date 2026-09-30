import { ChatDialog } from "../../ui/chat-dialog.js";
import { useId, useRef, type ReactElement } from "react";
import { useUiText } from "../../components/index.js";

/** Presentation-only refusal. Never admits a task or chooses a workspace. */
export function NoFolderPrompt({ onDismiss, onOpenFolder, busy, error, context = false }: { context?: boolean; onDismiss: () => void; onOpenFolder: () => void; busy: boolean; error: string | null }): ReactElement {
  const { text: t } = useUiText();
  const cancel = useRef<HTMLButtonElement>(null);
  const description = useId();
  return <ChatDialog className="candidate-folder-prompt" title={t(context ? "Open folder" : "Unable to send message")}
    closeLabel={t("Close message")} describedBy={description} initialFocus={cancel} onClose={onDismiss}
    footer={
      <div className="candidate-dialog__actions">
        <button id="open-folder" className="candidate-dialog__action is-primary" type="button" disabled={busy} onClick={onOpenFolder}>{t("Open folder")}</button>
        <button ref={cancel} className="candidate-dialog__action is-quiet" type="button" aria-label={t("Keep editing")} onClick={onDismiss}>{t("Keep editing")}</button>
      </div>
    }>
    <div className="candidate-folder-prompt__copy">
      <p id={description}>{t("A folder is required to send a message or add context.")}</p>
      <p>{t("Please open a folder or workspace to continue.")}</p>
      <p className="candidate-folder-prompt__note">{t("Cancel keeps this draft. Nothing is sent or attached.")}</p>
      {error && <p className="candidate-settings__error" role="alert">{error}</p>}
    </div>
  </ChatDialog>;
}
