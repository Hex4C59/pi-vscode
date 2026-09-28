import { useId, useLayoutEffect, useRef, type ReactElement } from "react";
import { useUiText } from "../components/index.js";

/** Presentation-only refusal. Never admits a task or chooses a workspace. */
export function NoFolderPrompt({ onDismiss, onOpenFolder, busy, error, context = false }: { context?: boolean; onDismiss: () => void; onOpenFolder: () => void; busy: boolean; error: string | null }): ReactElement {
  const { text: t } = useUiText();
  const dialog = useRef<HTMLDialogElement>(null);
  const ok = useRef<HTMLButtonElement>(null);
  const description = useId();
  useLayoutEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (typeof node.showModal === "function") node.showModal();
    else node.open = true; // jsdom; native keyboard/focus behavior has separate browser evidence.
    ok.current?.focus();
    return () => { if (node.open && typeof node.close === "function") node.close(); };
  }, []);
  const close = () => {
    if (typeof dialog.current?.close === "function") dialog.current.close();
    else onDismiss();
  };
  return <dialog ref={dialog} className="candidate-settings candidate-folder-prompt" aria-label={t(context ? "Open folder" : "Unable to send message")} aria-describedby={description}
    onClose={onDismiss} onKeyDown={event => { if (event.key === "Escape") event.stopPropagation(); }}>
    <header><h2>{t(context ? "Open folder" : "Unable to send message")}</h2>
      <button className="candidate__icon" type="button" aria-label={t("Close message")} title={t("Close message")} onClick={close}>
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M5 15 15 5" /></svg>
      </button>
    </header>
    <p id={description}>{t("Please open a folder or workspace to continue.")}</p>
    {error && <p role="alert">{error}</p>}
    <div className="candidate-folder-prompt__actions">
      <button id="open-folder" className="btn-secondary" type="button" disabled={busy} onClick={onOpenFolder}>{t("Open folder")}</button>
      <button ref={ok} className="btn-primary" type="button" aria-label={t("OK")} onClick={close}>{t("OK")}</button>
    </div>
  </dialog>;
}
