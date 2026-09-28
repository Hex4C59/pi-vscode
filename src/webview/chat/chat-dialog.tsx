import { SessionIcon } from "./session-icon.js";
import { useLayoutEffect, useId, useRef, type ReactElement, type ReactNode } from "react";

type ChatDialogProps = {
  title: string;
  closeLabel: string;
  className?: string;
  describedBy?: string;
  initialFocus?: { readonly current: HTMLElement | null };
  footer?: ReactNode;
  children: ReactNode;
  onClose(): void;
};

/** Native modal chrome: focus containment, Escape, sticky header, local body scroll. */
export function ChatDialog({ title, closeLabel, className = "", describedBy, initialFocus, footer, children, onClose }: ChatDialogProps): ReactElement {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useLayoutEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (typeof node.showModal === "function") node.showModal();
    else node.open = true; // jsdom; native Tab/Escape/backdrop are verified in the browser.
    initialFocus?.current?.focus({ preventScroll: true });
    return () => { if (node.open && typeof node.close === "function") node.close(); };
  }, []);
  const requestClose = () => {
    if (typeof dialog.current?.close === "function") dialog.current.close();
    else onClose();
  };
  return <dialog ref={dialog} className={`candidate-dialog ${className}`.trim()} aria-label={title} aria-labelledby={titleId} aria-describedby={describedBy}
    onClose={onClose} onCancel={event => event.stopPropagation()}
    onKeyDown={event => { if (event.key === "Escape") event.stopPropagation(); }}>
    <header className="candidate-dialog__header">
      <h2 id={titleId}>{title}</h2>
      <button className="candidate__icon candidate-dialog__close" type="button" aria-label={closeLabel} title={closeLabel} onClick={requestClose}>
        <SessionIcon name="x" />
      </button>
    </header>
    <div className="candidate-dialog__body">{children}</div>
    {footer && <div className="candidate-dialog__footer">{footer}</div>}
  </dialog>;
}
