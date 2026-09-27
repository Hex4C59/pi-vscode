import { CandidateContext } from "./candidate-context.js";
import { NoFolderPrompt } from "./no-folder-prompt.js";
import { InterfaceSettings } from "./interface-settings.js";
import type { PreviewLanguage } from "./ui-language.js";
import { SESSION_PAGE_SIZE, SAVED_HISTORY_PAGE_SIZE } from "./scenarios.js";
import { CandidateSessions } from "./candidate-sessions.js";
import { CandidateConversation } from "./candidate-conversation.js";
import { useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { WebviewClient, availability, type WebviewBridge } from "../index.js";
import { ModelPicker, WorkspaceSetup, SavedHistory, Approvals, UiTextProvider, useUiText } from "../components/index.js";

/** Candidate-only composition. Host eligibility, draft identity and intents stay in the real client. */
function Candidate({ client, language }: { client: WebviewClient; language: PreviewLanguage }): ReactElement {
  const { locale, text: t } = useUiText();
  const snapshot = useSyncExternalStore(client.subscribe, client.getSnapshot);
  const state = snapshot.workspace;
  const controls = availability(snapshot);
  const noFolder = state?.status === "no-folder";
  const [folderPrompt, setFolderPrompt] = useState(false);
  const promptVisible = folderPrompt && noFolder;
  const wasPromptVisible = useRef(false);
  const messages = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const follow = useRef(true);
  const browse = useRef<HTMLButtonElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const readingPosition = useRef(0);
  const wasBrowsing = useRef(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const historyId = useId();
  useLayoutEffect(() => {
    if (!promptVisible && wasPromptVisible.current) {
      setFolderPrompt(false);
      const target = input.current && !input.current.disabled ? input.current : messages.current;
      target?.focus({ preventScroll: true });
    }
    wasPromptVisible.current = promptVisible;
  }, [promptVisible]);
  useLayoutEffect(() => {
    if (historyOpen) back.current?.focus({ preventScroll: true });
    else if (wasBrowsing.current) {
      const node = messages.current;
      if (node) {
        node.scrollTop = readingPosition.current;
        follow.current = node.scrollHeight - node.clientHeight - node.scrollTop <= 32;
      }
      browse.current?.focus({ preventScroll: true });
    }
    wasBrowsing.current = historyOpen;
  }, [historyOpen]);
  const identity = state ? state.viewId + ":" + state.generation : null;
  const priorIdentity = useRef(identity);
  useLayoutEffect(() => {
    if (priorIdentity.current && identity !== priorIdentity.current) {
      readingPosition.current = 0; follow.current = true; wasBrowsing.current = false;
      setHistoryOpen(false); input.current?.focus({ preventScroll: true });
    }
    priorIdentity.current = identity;
  }, [identity]);
  const canBrowse = !!state && state.status === "eligible" && state.choice !== null && !snapshot.error;
  const canCompose = canBrowse && state.runtime === "ready" && !state.busy;
  const empty = noFolder || (canCompose && !state.messages.length && !snapshot.savedHistory?.available);
  const submit = () => {
    if (noFolder) {
      if (!state.busy && !snapshot.error && snapshot.text.trim()) setFolderPrompt(true);
      return;
    }
    client.submit();
  };
  useLayoutEffect(() => {
    const node = messages.current;
    if (node && !empty && !historyOpen && follow.current) node.scrollTop = node.scrollHeight;
  }, [state, historyOpen, empty]);
  useLayoutEffect(() => {
    const node = input.current;
    if (node) { node.style.height = "auto"; node.style.height = `${Math.min(node.scrollHeight, 140)}px`; }
  }, [snapshot.text]);
  const progress = controls.stopping ? t("Stopping… Waiting for the task to settle.")
    : state?.chatBusy ? state.execution === "replying" ? t("Replying…") : t("Working…") : null;
  return <section lang={locale} className="candidate" aria-label={t("Candidate chat")} onKeyDown={event => {
    if (!historyOpen || event.key !== "Escape" || event.defaultPrevented || event.nativeEvent.isComposing) return;
    // Existing nested dialogs own Escape first, even when focus remains on their trigger.
    if (event.currentTarget.querySelector('[role="dialog"]:not([hidden]), dialog[open]')) return;
    event.preventDefault(); setHistoryOpen(false);
  }}>
    <nav className="candidate__navigation" aria-label={t("Conversation navigation")}>
      <span className="candidate__current" aria-label={t("Current conversation")} title={snapshot.sessions?.current?.name ?? undefined}>{snapshot.sessions?.current?.name}</span>
      <button className="candidate__icon" type="button" aria-label={t("Browse saved conversations")} title={t("Chat history")} disabled={!canBrowse} ref={browse} aria-expanded={historyOpen} aria-controls={historyId}
        onClick={() => { if (historyOpen) { setHistoryOpen(false); return; } readingPosition.current = messages.current?.scrollTop ?? 0; setHistoryOpen(true); client.openSessions(); }}>
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 8a7 7 0 1 1 0 4M3 3v5h5M10 6v4l3 2" /></svg>
      </button>
      <button className="candidate__icon" type="button" aria-label={t("New conversation")} title={t("New conversation")} disabled={!canCompose || controls.sessionTransitioning || snapshot.sessions?.phase === "listing"}
        onClick={event => { event.currentTarget.focus(); client.newConversation(); }}>
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M9 4H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-4M11 10l6-6-2-2-6 6-1 4 3-2Z" /></svg>
      </button>
      <InterfaceSettings language={language} />
    </nav>
    <div className="candidate__history" id={historyId} aria-label={t("Conversation history")} role="region" hidden={!historyOpen}>
      <button className="candidate__icon candidate__history-back" type="button" aria-label={t("Back to conversation")} title={t("Back to conversation")} ref={back} onClick={() => setHistoryOpen(false)}>
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m10 5-5 5 5 5M5 10h11" /></svg>
      </button>
      <CandidateSessions state={snapshot.sessions} pageSize={SESSION_PAGE_SIZE} onResume={client.resumeConversation} onPage={client.navigateSessions} onRefresh={() => client.getSavedSessions(0)} />
    </div>
    <div className="candidate__messages" tabIndex={-1} hidden={historyOpen} ref={messages} onScroll={() => {
      const node = messages.current;
      if (node && !historyOpen) follow.current = node.scrollHeight - node.clientHeight - node.scrollTop <= 32;
    }}>
      {noFolder && state.error && !promptVisible && <p className="candidate__error" role="alert">{state.error}</p>}
      {snapshot.error && <p className="candidate__error" role="alert">{snapshot.error}</p>}
      {!state && <p role="status">{t("Connecting to the preview…")}</p>}
      {state && <>
        {!noFolder && (state.status !== "eligible" || state.choice === null) && <WorkspaceSetup state={state} onAction={client.action} />}
        {(state.runtime === "starting" || state.busy) && <p role="status">{t("Loading runtime and models…")}</p>}
        {state.runtime === "error" && <div className="candidate__error" role="alert">
          <strong>{t("Runtime unavailable")}</strong><p>{state.error ?? state.runtimeDetail}</p>
          <p>{t("Use Simulate recovery in the preview toolbar to try again.")}</p>
        </div>}
        {empty && <div className="candidate__empty">
          <span className="candidate__mark" aria-hidden="true" />
          <h1>{t("What should we work on?")}</h1>
          <p>{t("Ask a question or describe a change.")}</p>
        </div>}
        {canCompose && <>
          {!state.chatModel && <p className="candidate__error" role="alert">{t("No configured model is available. Use Simulate recovery in the preview toolbar.")}</p>}
          {snapshot.savedHistory && (snapshot.savedHistory.available || snapshot.savedHistory.error) && <SavedHistory
            pageSize={SAVED_HISTORY_PAGE_SIZE} state={snapshot.savedHistory} pendingPage={snapshot.savedHistoryPendingPage} preview={snapshot.savedHistoryPreview}
            disabled={!!snapshot.error || state.busy || controls.sessionTransitioning}
            onPage={client.savedHistory.page} onPreview={client.savedHistory.preview} onPreviewPage={client.savedHistory.navigatePreview}
            onClosePreview={client.savedHistory.closePreview} onInteract={() => { follow.current = false; }} />}
          <CandidateConversation messages={state.messages} activities={state.activities} chatBusy={state.chatBusy} />
        </>}
      </>}
    </div>
    <footer className="candidate__footer">
      {state && (state.approvals.length > 0 || state.grants.length > 0) && <div className="candidate__shared-operations">
        <Approvals key={identity} cards={state.approvals} grants={state.grants} disabled={controls.stopping || !!snapshot.error}
          onDecision={(id, decision) => client.action({ type: "decideApproval", id, decision })}
          onRevoke={id => client.action({ type: "revokeGrant", id })} />
      </div>}
      {!historyOpen && snapshot.sessions?.error && <p className="candidate__error" role="alert">{t("Conversation handoff: {error}. No conversation switch was made. Retry or browse history.", { error: snapshot.sessions.error })}</p>}
      {progress && <p className="candidate__progress" role="status"><span className="candidate__pulse" aria-hidden="true" />{progress}</p>}
      {state?.chatError && state.runtime !== "error" && <p className="candidate__error" role="status">{state.chatError}</p>}
      <form className="candidate__composer" onSubmit={event => { event.preventDefault(); submit(); }}>
        <CandidateContext historyDisabled={!canBrowse || controls.sessionTransitioning} key={identity} pageSize={16} history={snapshot.history} historyOpen={snapshot.historyOpen} historyPage={snapshot.historyPage} onHistory={client.toggleHistory} onHistoryPage={client.navigateHistory} state={snapshot.attachments} disabled={controls.attachmentDisabled} onAdd={client.addAttachment} onAddSelection={client.addSelection} onRemove={client.removeAttachment} onConfirm={client.confirmAttachment} onPreview={client.requestPreview} onClosePreview={client.closePreview} preview={snapshot.preview} />
        <textarea ref={input} aria-label={t("Message")} placeholder={t("Ask pi anything…")} rows={2} maxLength={8000} value={snapshot.text}
          disabled={!!snapshot.error || (noFolder ? !!state.busy : !canCompose || !snapshot.attachments)}
          onChange={event => client.edit(event.currentTarget.value)}
          onKeyDown={event => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit(); }
          }} />
        <div className="candidate__composer-actions">
          <div className="candidate__model">{state && !noFolder && <ModelPicker key={`${state.viewId}-${state.generation}`} state={state} disabled={controls.settingsDisabled} continuousThinkingDrag animatePopover
            onModel={(provider, modelId) => client.action({ type: "setChatModel", provider, modelId })}
            onThinking={level => client.action({ type: "setThinkingLevel", level })} />}</div>
          {controls.showStop
            ? <button className="candidate__send" type="button" aria-label={t("Stop current task")} disabled={controls.stopping} onClick={client.stop}><span aria-hidden="true">■</span></button>
            : <button className="candidate__send" type="submit" aria-label={t("Send message")} disabled={noFolder ? !snapshot.text.trim() || !!state.busy || !!snapshot.error : controls.sendDisabled}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 16V4m-5 5 5-5 5 5" /></svg></button>}
        </div>
      </form>
      {snapshot.synchronizing && snapshot.text && <p className="candidate__sync" role="status">{t("Synchronizing draft…")}</p>}
    </footer>
    {promptVisible && <NoFolderPrompt onDismiss={() => setFolderPrompt(false)} busy={!!state.busy || !!snapshot.error} error={snapshot.error ?? state.error}
      onOpenFolder={() => client.action({ type: "openFolder" })} />}
  </section>;
}

/** Mount seam shared by the preview controller and mounted behavior tests, never the packaged entry. */
export function mountCandidate(container: HTMLElement, bridge: WebviewBridge, language: PreviewLanguage): () => void {
  const client = new WebviewClient(bridge);
  const root = createRoot(container);
  client.start();
  root.render(<LocalizedCandidate client={client} language={language} />);
  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    client.dispose();
    root.unmount();
  };
}

function LocalizedCandidate({ client, language }: { client: WebviewClient; language: PreviewLanguage }): ReactElement {
  const value = useSyncExternalStore(language.subscribe, language.getSnapshot);
  return <UiTextProvider value={value}><Candidate client={client} language={language} /></UiTextProvider>;
}
