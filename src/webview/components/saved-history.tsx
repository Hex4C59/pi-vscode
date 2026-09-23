import { useLayoutEffect, useRef } from "react";
import type { SavedHistoryStateMessage } from "../../extension/webviewProtocol.js";
import { SAVED_HISTORY_PAGE_SIZE, type SavedHistoryPreview } from "../client.js";

interface SavedHistoryProps {
  state: SavedHistoryStateMessage;
  pendingPage: number | null;
  preview: SavedHistoryPreview | null;
  disabled: boolean;
  onPage: (page: number) => void;
  onPreview: (id: string) => void;
  onPreviewPage: (direction: "first" | "previous" | "next" | "retry") => void;
  onClosePreview: () => void;
  onInteract: () => void;
}

const errors = {
  unavailable: "Retained history is unavailable. Retry when the conversation is ready.",
  stale: "This retained history is no longer current. Refresh the history page.",
  cancelled: "Loading retained history was cancelled. You can retry.",
};

export function SavedHistory({ state, pendingPage, preview, disabled, onPage, onPreview, onPreviewPage, onClosePreview, onInteract }: SavedHistoryProps) {
  const text = useRef<HTMLPreElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  useLayoutEffect(() => { if (text.current) text.current.scrollTop = 0; }, [preview?.id, preview?.offset]);
  const loading = state.phase === "loading" || pendingPage !== null;
  const blocked = disabled || loading || !state.available;
  const lastPage = Math.max(0, Math.ceil(state.total / SAVED_HISTORY_PAGE_SIZE) - 1);
  const end = Math.max(0, state.total - state.page * SAVED_HISTORY_PAGE_SIZE);
  const start = Math.max(1, end - state.messages.length + 1);
  const previewBlocked = blocked || preview?.phase === "loading";
  return <section id="saved-history" aria-labelledby="saved-history-heading"
    onFocusCapture={onInteract} onPointerDownCapture={onInteract} onWheelCapture={onInteract} onScrollCapture={onInteract}>
    <h2 id="saved-history-heading">Restored history</h2>
    <p id="saved-history-disclosure" className="muted">One window of up to 32 retained entries is shown, most recent window first; earlier history is not shown until requested. Model context is owned by pi, not this display. Historical tool names do not mean those tools or extensions are loaded or available. Unsupported historical content is marked in the retained entries.</p>
    <p id="saved-history-page-status" role="status">{state.messages.length ? `Entries ${start}–${end} of ${state.total}. ` : `${state.total} retained entries. `}Page {state.page + 1} of {lastPage + 1}.</p>
    <nav className="saved-history-actions" aria-label="Restored history pages">
      <button id="saved-history-earlier" type="button" disabled={blocked || state.page >= lastPage} onClick={() => onPage(state.page + 1)}>Previous / earlier</button>
      <button id="saved-history-newer" type="button" disabled={blocked || state.page === 0} onClick={() => onPage(state.page - 1)}>Newer</button>
      <button id="saved-history-refresh" type="button" disabled={blocked} onClick={() => onPage(state.page)}>Refresh history</button>
    </nav>
    {loading && <p role="status">Loading retained history…</p>}
    {state.error && <p role="alert">{state.available ? errors[state.error] : "Retained history is unavailable. Restore the conversation again from Sessions."}</p>}
    {!loading && !state.error && !state.messages.length && <p>No retained history entries are available.</p>}
    <div id="saved-history-entries" tabIndex={0} role="region" aria-label="Retained history entries" aria-busy={loading}>
      {state.messages.map((line, index) => {
        const id = line.id;
        return <article key={id ?? `${state.page}-${index}`} data-saved-history-row={id ?? "notice"}>
          <strong>{line.role === "user" ? "You (saved)" : "Assistant / activity (saved)"}</strong>
          <pre>{line.text}</pre>
          {id ? <button type="button" data-saved-history-preview={id} disabled={blocked || state.phase !== "idle" || state.error !== null}
            aria-label={`View retained text for entry ${start + index}`} onClick={event => { trigger.current = event.currentTarget; onPreview(id); }}>View retained text</button>
            : <p className="muted">Retained text preview unavailable for this notice.</p>}
        </article>;
      })}
    </div>
    <section id="saved-history-preview" aria-labelledby="saved-history-preview-heading" hidden={!preview}>
      <h3 id="saved-history-preview-heading">Retained text</h3>
      <p id="saved-history-preview-disclosure" className="muted">Literal, immutable retained history snapshot, not the current file. Attachments reflect retained text only. Nothing here opens a file or executes historical content.</p>
      <div className="saved-history-actions">
        <button id="saved-history-preview-close" type="button" onClick={() => { onClosePreview(); trigger.current?.focus(); }}>Close retained text</button>
        <button id="saved-history-preview-first" type="button" disabled={previewBlocked || !preview?.offset} onClick={() => onPreviewPage("first")}>First chunk</button>
        <button id="saved-history-preview-previous" type="button" disabled={previewBlocked || !preview?.previousOffsets.length} onClick={() => onPreviewPage("previous")}>Previous chunk</button>
        <button id="saved-history-preview-next" type="button" disabled={previewBlocked || preview?.phase !== "idle" || preview.done} onClick={() => onPreviewPage("next")}>Next chunk</button>
      </div>
      {preview?.phase === "loading" && <p role="status">Loading retained text…</p>}
      {preview?.phase === "idle" && <p role="status">Characters {preview.totalChars ? preview.offset + 1 : 0}–{preview.nextOffset} of {preview.totalChars}. Only this chunk is held in the view.</p>}
      {preview?.error && <div role="alert"><p>{errors[preview.error]}</p><button id="saved-history-preview-retry" type="button" disabled={blocked} onClick={() => onPreviewPage("retry")}>Retry retained text</button></div>}
      {!!preview?.offset && !preview.previousOffsets.length && <p className="muted">Earlier chunk navigation is bounded. Use First chunk to return to the beginning.</p>}
      <pre id="saved-history-preview-text" ref={text} tabIndex={0} aria-label="Literal retained text">{preview?.text ?? ""}</pre>
    </section>
  </section>;
}
