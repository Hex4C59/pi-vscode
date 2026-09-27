import { useRef, useState, useLayoutEffect, type ReactElement } from "react";
import { useUiText } from "../components/index.js";
import { previewLanguages, type PreviewLanguage } from "./ui-language.js";

/** Native modal owns focus containment/Escape; no document listeners or host settings. */
export function InterfaceSettings({ language }: { language: PreviewLanguage }): ReactElement {
  const { locale, text: t } = useUiText();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const node = dialog.current;
    if (!open || !node) return;
    if (typeof node.showModal === "function") node.showModal();
    else node.open = true; // jsdom; native modal behavior is verified in Chrome.
  }, [open]);
  const finishClose = () => { setOpen(false); trigger.current?.focus({ preventScroll: true }); };
  const close = () => {
    if (typeof dialog.current?.close === "function") dialog.current.close();
    else finishClose();
  };
  return <>
    <button ref={trigger} className="candidate__icon" type="button" aria-label={t("Interface settings")} title={t("Interface settings")}
      onClick={() => setOpen(true)}>
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m8 2-.5 2-2 .9-1.8-.6-2 3.4 1.5 1.4v2l-1.5 1.4 2 3.4 1.8-.6 2 .9.5 2h4l.5-2 2-.9 1.8.6 2-3.4-1.5-1.4v-2l1.5-1.4-2-3.4-1.8.6-2-.9L12 2Z"/><circle cx="10" cy="10" r="3"/></svg>
    </button>
    {open && <dialog ref={dialog} className="candidate-settings" aria-label={t("Interface settings")} onClose={finishClose}
      onKeyDown={event => { if (event.key === "Escape") event.stopPropagation(); }}>
      <header><h2>{t("Interface settings")}</h2>
        <button className="candidate__icon" type="button" aria-label={t("Close settings")} title={t("Close settings")}
          onClick={close}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M5 15 15 5"/></svg>
        </button>
      </header>
      <label><span>{t("Language")}</span><select aria-label={t("Language")} value={locale} onChange={event => language.select(event.currentTarget.value)}>
        {previewLanguages.map(item => <option key={item.locale} value={item.locale}>{item.label}</option>)}
      </select></label>
      <p>{t("For this preview only. Reloading the page restores English.")}</p>
    </dialog>}
  </>;
}
