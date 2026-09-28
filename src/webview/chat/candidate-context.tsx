import { useLayoutEffect, useRef, useState, type ReactElement } from "react";
import type { AttachmentDetails } from "../../extension/contracts/index.js";
import { useUiText, type AttachmentPanelProps, type UiTranslator, type UiText } from "../components/index.js";

type ContextProps = Omit<AttachmentPanelProps, "status"> & { historyDisabled: boolean };
type Metadata = AttachmentDetails & { relativePath: string; utf8Bytes: number; unsaved: boolean };

const stateLabels = {
  "no-editor": "Open a workspace text editor.",
  "empty-selection": "Select a nonempty range.",
  "multiple-selections": "Attach one selection at a time.",
  "cancelled": "Cancelled",
  "busy": "Operation in progress",
  "stale": "Draft changed; synchronized",
  "ineligible": "Trusted local workspace required",
  "attachment-limit": "Attachment count limit reached (20)",
  "total-too-large": "Total attachment text exceeds 1 MiB",
  "invalid-source": "Invalid context source",
  "outside-workspace": "Source is outside the workspace",
  "unavailable": "Context source unavailable",
  "not-text": "Text context only",
  "source-too-large": "Context source is too large",
  "text-too-large": "Attachment exceeds 256 KiB",
  "metadata-too-large": "Attachment metadata is too large",
  "sensitive-source": "Secret-like source blocked",
  "source-changed": "Source changed; confirm each snapshot",
  "history-full": "Retained attachment history is full (128 snapshots)",
  "frame-too-large": "Attachment message is too large",
  "preparation-cancelled": "Preparation cancelled. Draft retained.",
  "write-failed": "Delivery uncertain; no automatic retry",
  "ack-timeout": "Acknowledgement timed out; no automatic retry",
  "rpc-rejected": "Submission rejected",
  "runtime-lost": "Runtime connection unavailable; attachment history cleared",
  "host-accepted": "Admitted by host",
  "write-attempted": "Delivery attempted",
  "rpc-accepted": "Accepted by runtime",
  "pending": "Task pending",
  "uncertain": "Delivery uncertain",
  "settled": "Task settled",
  "interrupted": "Task interrupted",
  "failed": "Task failed",
  "unknown": "Unknown delivery"
} satisfies Readonly<Record<string, UiText>>;

function stateLabel(value: string, t: UiTranslator): string {
  // Unknown bounded upstream diagnostics remain literal; only known interface states are localized.
  return Object.hasOwn(stateLabels, value) ? t(stateLabels[value as keyof typeof stateLabels]) : value;
}

function metadata(a: Metadata, t: UiTranslator): string {
  const kind = a.kind === "file" ? t("whole file") : t("selection · original L{startLine}:{startCharacter}–L{endLine}:{endCharacter} (end exclusive)", {
    startLine: a.originalRange.start.line + 1, startCharacter: a.originalRange.start.character + 1,
    endLine: a.originalRange.end.line + 1, endCharacter: a.originalRange.end.character + 1,
  });
  return `${kind} · ${a.utf8Bytes} ${t("bytes")}${a.unsaved ? " · " + t("unsaved snapshot") : ""}${a.kind === "selection" && a.stale ? " · " + t("old snapshot") : ""}`;
}

/** Presentation only. Snapshot mutations, admission and paging cross the existing client Interface. */
export function CandidateContext({ pageSize, state, history, historyOpen, historyPage, preview, disabled,
  onAdd, onAddSelection, onRemove, onConfirm, onHistory, onHistoryPage, onPreview, onClosePreview, historyDisabled }: ContextProps): ReactElement {
  const { text: t } = useUiText();
  const [menu, setMenu] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const items = useRef<HTMLDivElement>(null);
  const previewClose = useRef<HTMLButtonElement>(null);
  const historyClose = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<HTMLButtonElement | null>(null);
  const reader = useRef<HTMLDivElement>(null);
  const closeMenu = () => { setMenu(false); trigger.current?.focus({ preventScroll: true }); };
  const restoreFocus = () => {
    const target = returnTo.current;
    if (target?.isConnected && !target.disabled) target.focus({ preventScroll: true });
    else trigger.current?.focus({ preventScroll: true });
  };
  const closePreview = () => { onClosePreview(); restoreFocus(); };
  const closeHistory = () => { onHistory(); restoreFocus(); };
  const openPreview = (id: string, button: HTMLButtonElement) => {
    returnTo.current = button; onPreview(id);
    previewClose.current?.focus({ preventScroll: true });
    if (reader.current) reader.current.scrollTop = 0;
  };
  const canOpen = !!state && (!disabled || (!historyDisabled && state.historyCount > 0));
  useLayoutEffect(() => {
    if (menu && !canOpen) { setMenu(false); return; }
    if (menu) items.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
  }, [menu, canOpen]);
  // Only a new reading target moves focus/scroll, never a new chunk or stream delta.
  useLayoutEffect(() => {
    if (preview) { previewClose.current?.focus({ preventScroll: true }); if (reader.current) reader.current.scrollTop = 0; }
  }, [preview?.snapshotId]);
  useLayoutEffect(() => { if (historyOpen && !preview) historyClose.current?.focus({ preventScroll: true }); }, [historyOpen]);
  const offset = (historyPage ?? 0) * pageSize;
  const lastPage = Math.max(0, Math.ceil(history.length / pageSize) - 1);
  const attachments = state?.draft.attachments ?? [];
  const budgetReached = attachments.length >= 20;
  const showDelivery = !!state?.lastSubmission && ["write-failed", "ack-timeout", "rpc-rejected", "unknown"].includes(state.lastSubmission.delivery);
  return <div className="candidate-context" onKeyDown={event => {
    if (event.key !== "Escape" || event.defaultPrevented || event.nativeEvent.isComposing) return;
    if (preview) { event.preventDefault(); closePreview(); }
    else if (historyOpen) { event.preventDefault(); closeHistory(); }
  }}>
    <div className="candidate-context__actions">
      <button ref={trigger} type="button" aria-label={t("Add context")} title={t("Add context")} aria-haspopup="menu" aria-expanded={menu}
        disabled={!canOpen} onClick={() => setMenu(!menu)}><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M10 4v12M4 10h12" /></svg></button>
      {menu && <div className="candidate-context__menu"
        onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setMenu(false); }} onKeyDown={event => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === "Escape") { event.preventDefault(); closeMenu(); }
          if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
            const current = buttons.findIndex(button => button === document.activeElement);
            const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (current + (event.key === "ArrowUp" ? -1 : 1) + buttons.length) % buttons.length;
            buttons[next]?.focus();
          }
        }}>
        <div ref={items} role="menu" aria-label={t("Add context")}>
        <button role="menuitem" type="button" aria-label={t("Add file")} disabled={disabled || budgetReached} onClick={() => { closeMenu(); onAdd(); }}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 2h6l4 4v12H5z M11 2v5h4 M8 11h4 M8 14h4" /></svg>{t("Add file")}</button>
        <button role="menuitem" type="button" aria-label={t("Add selection")} disabled={disabled || budgetReached} onClick={() => { closeMenu(); onAddSelection(); }}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 3H3v14h2 M15 3h2v14h-2 M7 7h6 M7 10h6 M7 13h4" /></svg>{t("Add selection")}</button>
        {!!state?.historyCount && <button role="menuitem" type="button" aria-label={t("Attachment history")} disabled={historyDisabled}
          onClick={() => { returnTo.current = trigger.current; closeMenu(); onHistory(); }}>{t("Attachment history")} · {state.historyCount}</button>}
        </div>
      </div>}
      {!!state?.historyCount && <button className="candidate-context__history-trigger" type="button" aria-label={t("Attachment history")} aria-expanded={historyOpen} disabled={historyDisabled}
        onClick={event => { returnTo.current = event.currentTarget; onHistory(); }}>{t("Attachment history")} · {state.historyCount}</button>}
    </div>
    <div className="candidate-context__content">
    {!!attachments.length && <ul className="candidate-context__draft" aria-label={t("Draft context")}>
      {attachments.map(a => <li key={a.attachmentId}>
        <details className="candidate-context__path"><summary title={a.relativePath}>{a.relativePath}</summary><p>{a.relativePath}</p></details>
        <span className="candidate-context__label">{metadata(a, t)}</span>
        <div className="candidate-context__item-actions">
          {a.state !== "attached" && <span>{t(a.state)}</span>}
          {a.state === "confirmation-required" && <button type="button" aria-label={a.kind === "file" ? t("Use latest contents") : t("Use old snapshot")}
            disabled={disabled} onClick={() => onConfirm(a.attachmentId)}>{a.kind === "file" ? t("Use latest contents") : t("Use old snapshot")}</button>}
          <button type="button" aria-label={t("Preview complete snapshot")} onClick={event => openPreview(a.snapshotId, event.currentTarget)}>{t("Preview")}</button>
          <button type="button" aria-label={t("Remove")} disabled={disabled} onClick={() => { onRemove(a.attachmentId); trigger.current?.focus({ preventScroll: true }); }}>{t("Remove")}</button>
        </div>
        {a.state === "changed" && <p>{a.kind === "file" ? t("Send checks the source and asks you to confirm the latest file.") : t("Selection stays fixed. Send checks the source before confirming the old snapshot or reattaching.")}</p>}
      </li>)}
    </ul>}
    {state && (state.preparation !== "idle" || state.result || showDelivery) && <div className="candidate-context__status" role="status">
      {state.preparation !== "idle" && <p>{t("Preparing context… Stop cancels preparation.")}</p>}
      {state.result && <p>{state.result.code === "preparation-cancelled" || state.result.code === "cancelled" ? t("Preparation cancelled. Draft retained.")
        : t("Context operation: {code}. Review the draft before retrying.", { code: stateLabel(state.result.code, t) })}</p>}
      {state.result && !["source-changed", "cancelled", "preparation-cancelled"].includes(state.result.code) && <p>{t("Remove or reattach unavailable context; reduce oversized text. For uncertain delivery, Stop or Reset before retrying. Reset loses the draft and memory-only history.")}</p>}
      {showDelivery && state.lastSubmission && <p>{t("Context delivery: {delivery}", { delivery: stateLabel(state.lastSubmission.delivery, t) })} · {stateLabel(state.lastSubmission.outcome, t)}</p>}
    </div>}
    {(historyOpen || preview) && <div className="candidate-context__reader" ref={reader}>
      {preview && <section aria-label={t("Attachment preview")}>
        <button ref={previewClose} type="button" aria-label={t("Close preview")} onClick={closePreview}>{t("Close preview")}</button>
        <p>{t("Literal retained snapshot, not the current file. Content is never rendered as Markdown or loaded as a resource.")}</p>
        <pre tabIndex={0} aria-label={t("Literal attachment text")}>{preview.error ?? preview.text}</pre>
      </section>}
      {historyOpen && <section aria-label={t("Retained attachment history")}>
        <button ref={historyClose} type="button" aria-label={t("Close attachment history")} onClick={closeHistory}>{t("Close attachment history")}</button>
        <p>{t("Memory-only retained snapshots, not current files or model context. Bounded to 128 snapshots; restarting or changing resources loses this history.")}</p>
        <p role="status">{historyPage === null ? t("Loading retained attachment history…") : history.length ? t("Snapshots {start}–{end} of {total}", {
          start: offset + 1, end: Math.min(offset + pageSize, history.length), total: history.length,
        }) : t("No retained attachment submissions in this live session.")}</p>
        <nav aria-label={t("Attachment history pages")}>
          <button type="button" aria-label={t("First page")} disabled={historyPage === null || historyPage === 0} onClick={() => onHistoryPage(0)}>{t("First page")}</button>
          <button type="button" aria-label={t("Previous page")} disabled={historyPage === null || historyPage === 0} onClick={() => onHistoryPage((historyPage ?? 0) - 1)}>{t("Previous page")}</button>
          <button type="button" aria-label={t("Next page")} disabled={historyPage === null || historyPage === lastPage} onClick={() => onHistoryPage((historyPage ?? 0) + 1)}>{t("Next page")}</button>
          <button type="button" aria-label={t("Latest page")} disabled={historyPage === null || historyPage === lastPage} onClick={() => onHistoryPage(lastPage)}>{t("Latest page")}</button>
        </nav>
        <ul>{(historyPage === null ? [] : history.slice(offset, offset + pageSize)).map(a => <li key={a.submissionId + ":" + a.snapshotId}>
          <details className="candidate-context__path"><summary title={a.relativePath}>{a.relativePath}</summary><p>{a.relativePath}</p></details>
          <span>{metadata(a, t)} · {stateLabel(a.delivery, t)} / {stateLabel(a.outcome, t)}</span>
          <button type="button" aria-label={t("Preview complete snapshot")} onClick={event => openPreview(a.snapshotId, event.currentTarget)}>{t("Preview")}</button>
        </li>)}</ul>
      </section>}
    </div>}
    </div>
  </div>;
}
