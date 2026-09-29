import { SessionNavigation } from "./session-navigation.js";
import { MessageComposer } from "./message-composer.js";
import { TaskStatus } from "./task-status.js";
import type { ChatMountOptions, UiLanguageState } from "./types.js";
import { ExtensionInteractions, RuntimeRecoveryBanner } from "./extension-interactions.js";
import { CandidateReview } from "./candidate-review.js";
import { ProjectResourcesPrompt } from "./project-resources-prompt.js";
import { NoFolderPrompt } from "./no-folder-prompt.js";
import { PiWelcomeMark } from "./pi-welcome-mark.js";
import { createUiLanguage } from "./ui-language.js";
import { ChatPreviewContext, useChatPreview } from "./environment.js";
import { SESSION_PAGE_SIZE, SAVED_HISTORY_PAGE_SIZE } from "../index.js";
import { CandidateSessions } from "./candidate-sessions.js";
import { CandidateConversation } from "./candidate-conversation.js";
import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { WebviewClient, availability, type WebviewBridge } from "../index.js";
import { WorkspaceSetup, SavedHistory, Approvals, UiTextProvider, useUiText } from "../components/index.js";

function subscribeViewport(listener: () => void): () => void {
  window.addEventListener("resize", listener);
  return () => window.removeEventListener("resize", listener);
}
function shortViewport(): boolean { return window.innerHeight <= 540; }

/** Shared production and preview composition. Host eligibility, draft identity and intents stay in the real client. */
function Candidate({ client, language }: { client: WebviewClient; language: UiLanguageState }): ReactElement {
  const { locale, text: t } = useUiText();
  const preview = useChatPreview();
  const snapshot = useSyncExternalStore(client.subscribe, client.getSnapshot);
  useEffect(() => { if (snapshot.uiLocale) language.select(snapshot.uiLocale); }, [snapshot.uiLocale, language]);
  const state = snapshot.workspace;
  const controls = availability(snapshot);
  const short = useSyncExternalStore(subscribeViewport, shortViewport);
  const prioritizeApprovals = short && !!state?.approvals.length;
  const priorPriority = useRef(false);
  const footer = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (prioritizeApprovals && !priorPriority.current && snapshot.changeReviewOpen) {
      const content = footer.current?.querySelector("#change-review-content");
      const hidesFocus = !!content?.contains(content.ownerDocument.activeElement);
      client.toggleChangeReview();
      if (hidesFocus) footer.current?.querySelector<HTMLButtonElement>("#change-review-toggle")?.focus({ preventScroll: true });
    }
    priorPriority.current = prioritizeApprovals;
  }, [prioritizeApprovals, snapshot.changeReviewOpen, client]);
  const input = useRef<HTMLTextAreaElement>(null);
  const noFolder = state?.status === "no-folder";
  const needsResources = state?.status === "eligible" && state.choice === null && state.runtime === "not-started";
  const canPrepare = noFolder || needsResources;
  const [resourcesPrompt, setResourcesPrompt] = useState(false);
  const resourcesVisible = resourcesPrompt && needsResources;
  const wasResourcesVisible = useRef(false);
  useLayoutEffect(() => {
    if (!resourcesVisible && wasResourcesVisible.current) {
      setResourcesPrompt(false);
      input.current?.focus({ preventScroll: true });
    }
    wasResourcesVisible.current = resourcesVisible;
  }, [resourcesVisible]);
  const [folderPrompt, setFolderPrompt] = useState(false);
  const [contextPrompt, setContextPrompt] = useState(false);
  const promptVisible = folderPrompt && noFolder;
  const wasPromptVisible = useRef(false);
  const messages = useRef<HTMLDivElement>(null);
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
      setResourcesPrompt(false); setHistoryOpen(false); input.current?.focus({ preventScroll: true });
    }
    priorIdentity.current = identity;
  }, [identity]);
  const canBrowse = !!state && state.status === "eligible" && state.choice !== null && !snapshot.error;
  const canCompose = canBrowse && state.runtime === "ready" && !state.busy;
  const readableRuntimeError = canBrowse && state.runtime === "error";
  const empty = canPrepare || (canCompose && !state.messages.length && !snapshot.savedHistory?.available);
  const submit = () => {
    if (needsResources) {
      if (!state.busy && !snapshot.error && snapshot.text.trim()) setResourcesPrompt(true);
      return;
    }
    if (noFolder) {
      if (!state.busy && !snapshot.error && snapshot.text.trim()) { setContextPrompt(false); setFolderPrompt(true); }
      return;
    }
    client.submit();
  };
  const priorRuntimeError = useRef(false);
  useLayoutEffect(() => {
    const node = messages.current;
    if (node && readableRuntimeError && !priorRuntimeError.current) {
      node.scrollTop = 0; follow.current = false;
    } else if (node && !empty && !historyOpen && follow.current) node.scrollTop = node.scrollHeight;
    priorRuntimeError.current = readableRuntimeError;
  }, [state, historyOpen, empty, readableRuntimeError]);
  return <section lang={locale} className="candidate" aria-label={t(preview ? "Candidate chat" : "Pi chat")} onKeyDown={event => {
    if (!historyOpen || event.key !== "Escape" || event.defaultPrevented || event.nativeEvent.isComposing) return;
    // Existing nested dialogs own Escape first, even when focus remains on their trigger.
    if (event.currentTarget.querySelector('[role="dialog"]:not([hidden]), dialog[open]')) return;
    event.preventDefault(); setHistoryOpen(false);
  }}>
    <SessionNavigation snapshot={snapshot} client={client} canBrowse={canBrowse} canCompose={canCompose}
      historyOpen={historyOpen} historyId={historyId} browse={browse}
      onBrowse={() => { if (historyOpen) { setHistoryOpen(false); return; } readingPosition.current = messages.current?.scrollTop ?? 0; setHistoryOpen(true); client.openSessions(); }} />
    <CandidateSessions open={historyOpen} id={historyId} back={back} onBack={() => setHistoryOpen(false)}
      state={snapshot.sessions} pageSize={SESSION_PAGE_SIZE} onResume={client.resumeConversation} onPage={client.navigateSessions} onRefresh={() => client.getSavedSessions(0)} />
    <div className="candidate__messages" tabIndex={-1} hidden={historyOpen} ref={messages} onScroll={() => {
      const node = messages.current;
      if (node && !historyOpen) follow.current = node.scrollHeight - node.clientHeight - node.scrollTop <= 32;
    }}>
      {canPrepare && state.error && !promptVisible && !resourcesVisible && <p className="candidate__error" role="alert">{state.error}</p>}
      {snapshot.error && <p className="candidate__error" role="alert">{snapshot.error}</p>}
      {!state && <p role="status">{t(preview ? "Connecting to the preview…" : "Connecting to the extension host…")}</p>}
      {state && <>
        {!noFolder && state.status !== "eligible" && <WorkspaceSetup state={state} onAction={client.action} />}
        {(state.runtime === "starting" || state.busy) && <p role="status">{t("Loading runtime and models…")}</p>}
        {state.runtime === "error" && <div className="candidate__error" role="alert">
          <strong>{t("Runtime unavailable")}</strong><p>{state.error ?? state.runtimeDetail}</p>
          <p>{t(snapshot.executionProfile?.phase === "recovery-required" ? "Use the runtime recovery controls below. Reloading does not clear uncertain work; no task will be replayed." : preview ? "Use Simulate recovery in the preview toolbar to try again." : "Reload the VS Code window to restart controlled execution. Unsent drafts are not persisted; copy them before reloading.")}</p>
        </div>}
        {empty && <div className="candidate__empty">
          <PiWelcomeMark label={t("Replay Pi logo animation")} />
          <h1>{t("What should we work on?")}</h1>
        </div>}
        {(canCompose || readableRuntimeError) && <>
          {!state.chatModel && <div className="candidate__error" role="alert">
            <p>{t(preview ? "No configured model is available. Use Simulate recovery in the preview toolbar." : "No configured model is available. Open Interface settings to configure a provider API key.")}</p>
            {!preview && <button type="button" className="candidate__link-button" onClick={() => client.action({ type: "openSettings" })}>{t("Open provider settings")}</button>}
          </div>}
          {snapshot.savedHistory && (snapshot.savedHistory.available || snapshot.savedHistory.error) && <SavedHistory
            pageSize={SAVED_HISTORY_PAGE_SIZE} state={snapshot.savedHistory} pendingPage={snapshot.savedHistoryPendingPage} preview={snapshot.savedHistoryPreview}
            disabled={!!snapshot.error || state.busy || controls.sessionTransitioning}
            onPage={client.savedHistory.page} onPreview={client.savedHistory.preview} onPreviewPage={client.savedHistory.navigatePreview}
            onClosePreview={client.savedHistory.closePreview} onInteract={() => { follow.current = false; }} />}
          <CandidateConversation messages={state.messages} activities={state.activities} chatBusy={state.chatBusy} />
        </>}
      </>}
    </div>
    <footer ref={footer} className="candidate__footer">
      <div className="candidate__operations">
      {snapshot.interactions && (snapshot.interactions.active || snapshot.interactions.phase === "blocked" || snapshot.interactions.feedback.length > 0) && <ExtensionInteractions
        state={snapshot.interactions} language={locale === "zh-CN" ? "zh-CN" : "en"}
        onAnswer={(id, answer) => client.action({ type: "answerInteraction", id, answer })}
        onCancel={id => client.action({ type: "cancelInteraction", id })} />}
      {snapshot.executionProfile && <RuntimeRecoveryBanner
        state={snapshot.executionProfile}
        language={locale === "zh-CN" ? "zh-CN" : "en"}
        onEnd={() => client.action({ type: "endOwnedRuntime" })}
        onRecover={() => client.action({ type: "recoverControlledRuntime" })} />}
      {state && <CandidateReview key={`review-${identity}`} pageSize={16} state={snapshot.changeReview} open={snapshot.changeReviewOpen} page={snapshot.changeReviewPage}
        onToggle={client.toggleChangeReview} onPage={client.navigateChangeReview} onDiff={client.openReviewDiff} onSource={client.openReviewSource} />}
      {state && state.approvals.length > 0 && <div className="candidate__shared-operations">
        <Approvals compact showGrants={false} key={identity} cards={state.approvals} grants={state.grants} disabled={controls.stopping || !!snapshot.error}
          onDecision={(id, decision) => client.action({ type: "decideApproval", id, decision })}
          onRevoke={id => client.action({ type: "revokeGrant", id })} />
      </div>}
      {!historyOpen && snapshot.sessions?.error && <p className="candidate__error" role="alert">{t("Conversation handoff: {error}. No conversation switch was made. Retry or browse history.", { error: snapshot.sessions.error })}</p>}
      <TaskStatus execution={state?.execution} chatBusy={!!state?.chatBusy} stopping={controls.stopping} />
      {state?.chatError && state.runtime !== "error" && <p className="candidate__error" role="status">{state.chatError}</p>}
      </div>
      <MessageComposer snapshot={snapshot} client={client} input={input} canPrepare={canPrepare} canBrowse={canBrowse}
        canCompose={canCompose} readableRuntimeError={readableRuntimeError} submit={submit}
        onSettings={() => client.action({ type: "openSettings" })}
        onRequireWorkspace={canPrepare && !state.busy && !snapshot.error ? () => { if (needsResources) setResourcesPrompt(true); else { setContextPrompt(true); setFolderPrompt(true); } } : undefined} />
      {snapshot.synchronizing && snapshot.text && <p className="candidate__sync" role="status">{t("Synchronizing draft…")}</p>}
    </footer>
    {resourcesVisible && <ProjectResourcesPrompt state={state} onDismiss={() => setResourcesPrompt(false)}
      onChoose={choice => client.action({ type: "chooseResources", choice })} />}
    {promptVisible && <NoFolderPrompt context={contextPrompt} onDismiss={() => setFolderPrompt(false)} busy={!!state.busy || !!snapshot.error} error={snapshot.error ?? state.error}
      onOpenFolder={() => client.action({ type: "openFolder" })} />}
  </section>;
}

/** Public mount seam; production and preview substitute only their host bridge. */
export function mountChat(container: HTMLElement, bridge: WebviewBridge, options: ChatMountOptions = {}): () => void {
  const language = options.language ?? createUiLanguage();
  const client = new WebviewClient(bridge);
  const root = createRoot(container);
  client.start();
  root.render(<ChatPreviewContext value={options.preview ?? false}><LocalizedCandidate client={client} language={language} /></ChatPreviewContext>);
  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    client.dispose();
    root.unmount();
  };
}

function LocalizedCandidate({ client, language }: { client: WebviewClient; language: UiLanguageState }): ReactElement {
  const value = useSyncExternalStore(language.subscribe, language.getSnapshot);
  return <UiTextProvider value={value}><Candidate client={client} language={language} /></UiTextProvider>;
}
