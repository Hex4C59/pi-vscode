import { SessionNavigation } from "./sessions/session-navigation.js";
import { MessageComposer } from "./composer/message-composer.js";
import { TaskStatus } from "./execution/task-status.js";
import type { ChatMountOptions, UiLanguageState } from "./types.js";
import { ExtensionInteractions, RuntimeRecoveryBanner } from "./execution/extension-interactions.js";
import { PiWelcomeMark } from "./conversation/pi-welcome-mark.js";
import { ProjectResourceConsent, needsWorkspacePreparation, type ProjectResourceAttempt } from "./workspace/project-resource-consent.js";
import { createUiLanguage } from "../i18n/ui-language.js";
import { SESSION_PAGE_SIZE, SAVED_HISTORY_PAGE_SIZE } from "../index.js";
import { CandidateSessions } from "./sessions/candidate-sessions.js";
import { CandidateConversation } from "./conversation/candidate-conversation.js";
import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactElement, type RefObject } from "react";
import { createRoot } from "react-dom/client";
import { WebviewClient, availability, type WebviewBridge } from "../index.js";
import { SavedHistory, Approvals, ChangeReview, ChatPreviewContext, useChatPreview, UiTextProvider, useUiText } from "../components/index.js";

function subscribeViewport(listener: () => void): () => void {
  window.addEventListener("resize", listener);
  return () => window.removeEventListener("resize", listener);
}
function shortViewport(): boolean { return window.innerHeight <= 540; }

function useCandidateWorkspace(client: WebviewClient, language: UiLanguageState) {
  const { locale, text: t } = useUiText();
  const preview = useChatPreview();
  const snapshot = useSyncExternalStore(client.subscribe, client.getSnapshot);
  useEffect(() => { if (snapshot.uiLocale) language.select(snapshot.uiLocale); }, [snapshot.uiLocale, language]);
  const state = snapshot.workspace;
  const controls = availability(snapshot);
  const short = useSyncExternalStore(subscribeViewport, shortViewport);
  const prioritizeApprovals = short && !!state?.approvals.length;
  return { locale, t, preview, snapshot, state, controls, prioritizeApprovals };
}

function useApprovalPriority(client: WebviewClient, snapshot: ReturnType<WebviewClient["getSnapshot"]>, prioritizeApprovals: boolean) {
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
  return footer;
}

function useWorkspaceAttempt(state: ReturnType<typeof useCandidateWorkspace>["state"]) {
  const canPrepare = needsWorkspacePreparation(state);
  const [attempt, setAttempt] = useState<ProjectResourceAttempt | null>(null);
  const requestConsent = (source: ProjectResourceAttempt["source"]) => {
    setAttempt(current => ({ nonce: (current?.nonce ?? 0) + 1, source }));
  };
  return { canPrepare, attempt, requestConsent };
}

function useCandidateBrowsing(state: ReturnType<typeof useCandidateWorkspace>["state"], input: RefObject<HTMLTextAreaElement | null>) {
  const messages = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const browse = useRef<HTMLButtonElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const readingPosition = useRef(0);
  const wasBrowsing = useRef(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const historyId = useId();
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
  return { messages, follow, browse, back, readingPosition, historyOpen, setHistoryOpen, historyId, identity };
}

function useTranscriptFollowing(browsing: ReturnType<typeof useCandidateBrowsing>, state: ReturnType<typeof useCandidateWorkspace>["state"], empty: boolean, readableRuntimeError: boolean): void {
  const { messages, follow, historyOpen } = browsing;
  const priorRuntimeError = useRef(false);
  useLayoutEffect(() => {
    const node = messages.current;
    if (node && readableRuntimeError && !priorRuntimeError.current) {
      node.scrollTop = 0; follow.current = false;
    } else if (node && !empty && !historyOpen && follow.current) node.scrollTop = node.scrollHeight;
    priorRuntimeError.current = readableRuntimeError;
  }, [state, historyOpen, empty, readableRuntimeError]);
}

/** These consecutive hooks keep the original order, refs, effects and state in Candidate's fiber. */
function useCandidateView(client: WebviewClient, language: UiLanguageState) {
  const workspace = useCandidateWorkspace(client, language);
  const { snapshot, state, controls } = workspace;
  const footer = useApprovalPriority(client, snapshot, workspace.prioritizeApprovals);
  const input = useRef<HTMLTextAreaElement>(null);
  const consent = useWorkspaceAttempt(state);
  const { canPrepare, requestConsent } = consent;
  const browsing = useCandidateBrowsing(state, input);
  const canBrowse = !!state && state.status === "eligible" && state.choice !== null && !snapshot.error;
  const canCompose = canBrowse && state.runtime === "ready" && !state.busy;
  const readableRuntimeError = canBrowse && state.runtime === "error";
  const empty = canPrepare || (canCompose && !state.messages.length && !snapshot.savedHistory?.available);
  const sendBlocked = canPrepare ? !snapshot.text.trim() || !!state?.busy || !!snapshot.error : controls.sendDisabled;
  const newConversationDisabled = !canCompose || controls.sessionTransitioning || snapshot.sessions?.phase === "listing";
  const openSettings = () => client.action({ type: "openSettings" });
  const submit = () => {
    if (canPrepare) {
      requestConsent("send");
      return;
    }
    client.submit();
  };
  useTranscriptFollowing(browsing, state, empty, readableRuntimeError);
  return { client, ...workspace, footer, input, ...consent, ...browsing, canBrowse, canCompose, readableRuntimeError, empty, sendBlocked, newConversationDisabled, openSettings, submit };
}

type CandidateView = ReturnType<typeof useCandidateView>;

function renderCandidateNavigation(view: CandidateView): ReactElement {
  const { client, snapshot, t, state, canBrowse, newConversationDisabled, historyOpen, historyId, browse, setHistoryOpen, readingPosition, messages, openSettings } = view;
  return <SessionNavigation conversationName={snapshot.sessions?.current ? snapshot.sessions.current.name ?? t("Untitled conversation") : undefined} canBrowse={canBrowse}
    renameDisabled={snapshot.sessionRename?.status !== "ready" || !snapshot.sessions?.current} onRename={() => client.action({ type: "renameSession" })}
    newConversationDisabled={newConversationDisabled} settingsDisabled={!state}
    historyOpen={historyOpen} historyId={historyId} browse={browse}
    onBrowse={() => { if (historyOpen) { setHistoryOpen(false); return; } readingPosition.current = messages.current?.scrollTop ?? 0; setHistoryOpen(true); client.openSessions(); }}
    onNewConversation={client.newConversation} onOpenSettings={openSettings} />;
}

function renderCandidateSessions(view: CandidateView): ReactElement {
  const { client, snapshot, historyOpen, historyId, back, setHistoryOpen } = view;
  return <CandidateSessions open={historyOpen} id={historyId} back={back} onBack={() => setHistoryOpen(false)}
    state={snapshot.sessions} pageSize={SESSION_PAGE_SIZE} onResume={client.resumeConversation} onPage={client.navigateSessions} onRefresh={() => client.getSavedSessions(0)} />;
}

function renderCandidateTranscript(view: CandidateView): ReactElement {
  const { client, snapshot, state, t, preview, historyOpen, messages, follow, attempt, input, empty, canCompose, readableRuntimeError, controls, openSettings } = view;
  return <div className="candidate__messages" tabIndex={-1} hidden={historyOpen} ref={messages} onScroll={() => {
    const node = messages.current;
    if (node && !historyOpen) follow.current = node.scrollHeight - node.clientHeight - node.scrollTop <= 32;
  }}>
    <ProjectResourceConsent workspace={state} clientError={snapshot.error} draft={snapshot.text} attempt={attempt}
      onIntent={client.action} composer={input} transcript={messages}>
      {snapshot.error && <p className="candidate__error" role="alert">{snapshot.error}</p>}
      {!state && <p role="status">{t(preview ? "Connecting to the preview…" : "Connecting to the extension host…")}</p>}
    </ProjectResourceConsent>
    {state && <>
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
          {!preview && <button type="button" className="candidate__link-button" onClick={openSettings}>{t("Open provider settings")}</button>}
        </div>}
        {snapshot.savedHistory && (snapshot.savedHistory.available || snapshot.savedHistory.error) && <SavedHistory
          pageSize={SAVED_HISTORY_PAGE_SIZE} state={snapshot.savedHistory} pendingPage={snapshot.savedHistoryPendingPage} preview={snapshot.savedHistoryPreview}
          disabled={!!snapshot.error || state.busy || controls.sessionTransitioning}
          onPage={client.savedHistory.page} onPreview={client.savedHistory.preview} onPreviewPage={client.savedHistory.navigatePreview}
          onClosePreview={client.savedHistory.closePreview} onInteract={() => { follow.current = false; }} />}
        <CandidateConversation messages={state.messages} activities={state.activities} chatBusy={state.chatBusy} generation={state.generation} viewId={state.viewId} conversationId={snapshot.sessions?.current?.id ?? null} />
      </>}
    </>}
  </div>;
}

function renderCandidateOperations(view: CandidateView): ReactElement {
  const { client, snapshot, state, t, identity, controls, historyOpen } = view;
  return <div className="candidate__operations">
    {snapshot.interactions && (snapshot.interactions.active || snapshot.interactions.phase === "blocked" || snapshot.interactions.feedback.length > 0) && <ExtensionInteractions
      state={snapshot.interactions}
      onAnswer={(id, answer) => client.action({ type: "answerInteraction", id, answer })}
      onCancel={id => client.action({ type: "cancelInteraction", id })} />}
    {snapshot.executionProfile && <RuntimeRecoveryBanner
      state={snapshot.executionProfile}
      onEnd={() => client.action({ type: "endOwnedRuntime" })}
      onRecover={() => client.action({ type: "recoverControlledRuntime" })} />}
    {state && <ChangeReview key={`review-${identity}`} pageSize={16} state={snapshot.changeReview} open={snapshot.changeReviewOpen} page={snapshot.changeReviewPage}
      onToggle={client.toggleChangeReview} onPage={client.navigateChangeReview} onDiff={client.openReviewDiff} onSource={client.openReviewSource} />}
    {state && state.approvals.length > 0 && <div className="candidate__shared-operations">
      <Approvals compact showGrants={false} key={identity} cards={state.approvals} grants={state.grants} disabled={controls.stopping || !!snapshot.error}
        onDecision={(id, decision) => client.action({ type: "decideApproval", id, decision })}
        onRevoke={id => client.action({ type: "revokeGrant", id })} />
    </div>}
    {!historyOpen && snapshot.sessions?.error && <p className="candidate__error" role="alert">{t("Conversation handoff: {error}. No conversation switch was made. Retry or browse history.", { error: snapshot.sessions.error })}</p>}
    <TaskStatus execution={state?.execution} chatBusy={!!state?.chatBusy} stopping={controls.stopping} />
    {state?.chatError && state.runtime !== "error" && <p className="candidate__error" role="status">{state.chatError}</p>}
  </div>;
}

function renderCandidateComposer(view: CandidateView): ReactElement {
  const { client, snapshot, state, input, canPrepare, canBrowse, canCompose, readableRuntimeError, controls, sendBlocked, submit, openSettings, requestConsent } = view;
  return <MessageComposer sessionUsage={snapshot.sessionUsage} onRefreshUsage={() => client.action({ type: "refreshSessionUsage" })}
    text={snapshot.text} error={snapshot.error} workspace={state} attachments={snapshot.attachments}
    queuedText={snapshot.queuedText} commandCatalogue={snapshot.commandCatalogue}
    onCompleteCommand={client.completeCommand} commandCompletionDisabled={snapshot.synchronizing || snapshot.submitting || !!snapshot.error || controls.stopping || !!controls.sessionTransitioning || snapshot.attachments?.preparation !== "idle"}
    history={snapshot.history} historyOpen={snapshot.historyOpen} historyPage={snapshot.historyPage} preview={snapshot.preview}
    providerConfig={snapshot.providerConfig} executionProfile={snapshot.executionProfile} input={input}
    canPrepare={canPrepare} canBrowse={canBrowse} canCompose={canCompose} readableRuntimeError={readableRuntimeError}
    showStop={controls.showStop} stopping={controls.stopping} sendBlocked={sendBlocked}
    queueDisabled={controls.queueDisabled} recallDisabled={controls.recallDisabled}
    attachmentDisabled={controls.attachmentDisabled} settingsDisabled={controls.settingsDisabled}
    sessionTransitioning={controls.sessionTransitioning} submit={submit} onEdit={client.edit} onStop={client.stop}
    onQueueChat={client.queueChat} onRecallQueuedText={client.recallQueuedText}
    onUseRecoveredText={client.useRecoveredText} onDiscardRecoveredText={client.discardRecoveredText}
    onAddAttachment={client.addAttachment} onAddSelection={client.addSelection} onRemoveAttachment={client.removeAttachment}
    onConfirmAttachment={client.confirmAttachment} onToggleHistory={client.toggleHistory} onNavigateHistory={client.navigateHistory}
    onRequestPreview={client.requestPreview} onClosePreview={client.closePreview}
    onSetDefaultModel={(provider, modelId) => client.action({ type: "setDefaultModel", provider, modelId })}
    onSetDefaultThinking={(provider, modelId, level) => client.action({ type: "setDefaultThinkingLevel", provider, modelId, level })}
    onSetChatModel={(provider, modelId) => client.action({ type: "setChatModel", provider, modelId })}
    onSetThinking={level => client.action({ type: "setThinkingLevel", level })}
    onChooseExecutionProfile={profile => client.action({ type: "chooseExecutionProfile", profile })}
    onEndOwnedRuntime={() => client.action({ type: "endOwnedRuntime" })}
    onRecoverControlledRuntime={() => client.action({ type: "recoverControlledRuntime" })}
    onRevokeGrant={id => client.action({ type: "revokeGrant", id })}
    onSettings={openSettings}
    onRequireWorkspace={canPrepare && state && !state.busy && !snapshot.error ? () => requestConsent("context") : undefined} />;
}

function renderCandidateFooter(view: CandidateView): ReactElement {
  const { footer, snapshot, t } = view;
  return <footer ref={footer} className="candidate__footer">
    {renderCandidateOperations(view)}
    {renderCandidateComposer(view)}
    {snapshot.synchronizing && snapshot.text && <p className="candidate__sync" role="status">{t("Synchronizing draft…")}</p>}
  </footer>;
}

/** Shared production and preview composition. Host eligibility, draft identity and intents stay in the real client. */
function Candidate({ client, language }: { client: WebviewClient; language: UiLanguageState }): ReactElement {
  const view = useCandidateView(client, language);
  const { locale, t, preview, historyOpen, setHistoryOpen } = view;
  return <section lang={locale} className="candidate" aria-label={t(preview ? "Candidate chat" : "Pi chat")} onKeyDown={event => {
    if (!historyOpen || event.key !== "Escape" || event.defaultPrevented || event.nativeEvent.isComposing) return;
    // Existing nested dialogs own Escape first, even when focus remains on their trigger.
    if (event.currentTarget.querySelector('[role="dialog"]:not([hidden]), dialog[open]')) return;
    event.preventDefault(); setHistoryOpen(false);
  }}>
    {renderCandidateNavigation(view)}
    {renderCandidateSessions(view)}
    {renderCandidateTranscript(view)}
    {renderCandidateFooter(view)}
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
