import { useState, type ReactElement } from "react";
import type { SessionError, SessionStateMessage } from "../../extension/webviewProtocol.js";
import { SESSION_PAGE_SIZE } from "../client-state.js";

export interface SessionsProps {
  state: SessionStateMessage | null;
  onOpen: () => void;
  onRefresh: () => void;
  onPage: (page: number) => void;
  onNew: () => void;
  onResume: (id: string) => void;
}

const errorCopy: Record<SessionError, string> = {
  unavailable: "Saved conversations are unavailable. Refresh to try again.",
  cancelled: "The saved-conversation request was cancelled. Refresh to try again.",
  stale: "This saved-conversation page is stale. Refresh before restoring a conversation.",
  "wrong-project": "Saved conversations are not available for this project. Refresh after checking the workspace.",
  "stop-failed": "The current task could not be stopped. No conversation switch was made; try again after it settles.",
  "restore-failed": "The conversation could not be restored. Refresh the catalogue before trying again.",
};

function isBusy(state: SessionStateMessage | null): boolean {
  return state?.phase === "listing" || state?.phase === "confirming" || state?.phase === "switching";
}

function phaseNotice(state: SessionStateMessage | null): string | null {
  if (state?.phase === "confirming") return "Waiting for native confirmation of the sequential handoff…";
  if (state?.phase === "switching") return "Switching conversation…";
  return null;
}

export function Sessions({ state, onOpen, onRefresh, onPage, onNew, onResume }: SessionsProps): ReactElement {
  const [open, setOpen] = useState(false);
  const busy = isBusy(state);
  const currentName = state?.current?.name?.trim() || "New conversation";
  const lastPage = Math.max(0, Math.ceil((state?.total ?? 0) / SESSION_PAGE_SIZE) - 1);
  const loading = state === null || state.phase === "listing" || (!state.loaded && state.error === null);
  const pageReady = !!state && state.loaded;
  const showEntries = pageReady && state.entries.length > 0;
  const phase = phaseNotice(state);

  return (
    <section id="sessions-panel" className="sessions-panel">
      <button
        id="sessions-toggle"
        className="sessions-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="sessions-content"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) onOpen();
        }}
      >
        <span>Sessions</span>
        <span id="sessions-current" className="sessions-current">Current: {currentName}</span>
        <span className="sessions-chevron" aria-hidden="true">{open ? "⌃" : "⌄"}</span>
      </button>
      <div id="sessions-content" className="sessions-content" hidden={!open}>
        <p id="sessions-handoff-notice" className="muted">
          Conversation changes are sequential handoffs, not concurrent ownership. The native host handles confirmation and warns that this is not a lock; unsent drafts and temporary state may be lost. Historical extension state is not loaded automatically.
        </p>
        <div className="sessions-actions">
          <button id="sessions-new" className="btn-secondary" type="button" disabled={busy} onClick={onNew}>New conversation</button>
          <button id="sessions-refresh" className="btn-secondary" type="button" disabled={busy} onClick={onRefresh}>Refresh saved conversations</button>
        </div>
        {phase && <p id="sessions-phase" className="sessions-notice" role="status">{phase}</p>}
        {state?.error && <p id="sessions-error" className="sessions-error" role="alert">{errorCopy[state.error]}</p>}
        {loading && <p id="sessions-notice" className="sessions-notice" role="status">Loading saved conversations…</p>}
        {!loading && !state?.error && !showEntries && <p id="sessions-notice" className="sessions-notice" role="status">No saved conversations in this project.</p>}
        {showEntries && (
          <div className="sessions-entries" aria-label="Saved conversations">
            {state.entries.map(entry => (
              <article key={entry.id} className="sessions-entry" data-session-id={entry.id}>
                <div className="sessions-entry-heading">
                  <h3>{entry.title || "Untitled conversation"}</h3>
                  <button
                    className="btn-secondary sessions-restore"
                    type="button"
                    data-session-action="restore"
                    data-session-id={entry.id}
                    aria-label={`Restore ${entry.title || "untitled conversation"}`}
                    disabled={busy || state.error === "stale"}
                    onClick={() => onResume(entry.id)}
                  >
                    Restore
                  </button>
                </div>
                <p className="sessions-excerpt">{entry.excerpt || "No preview available."}</p>
                <p className="sessions-modified muted">Modified: {entry.modified}</p>
              </article>
            ))}
          </div>
        )}
        {pageReady && state.total > 0 && (
          <>
            <p id="sessions-page-status" className="sessions-page-status" role="status">
              Page {state.page + 1} of {lastPage + 1} · {state.total} saved conversation{state.total === 1 ? "" : "s"}
            </p>
            <nav className="sessions-pagination" aria-label="Saved conversation pages">
              <button id="sessions-previous" className="btn-secondary" type="button" disabled={busy || state.page === 0} onClick={() => onPage(state.page - 1)}>Previous page</button>
              <button id="sessions-next" className="btn-secondary" type="button" disabled={busy || state.page >= lastPage} onClick={() => onPage(state.page + 1)}>Next page</button>
            </nav>
          </>
        )}
      </div>
    </section>
  );
}
