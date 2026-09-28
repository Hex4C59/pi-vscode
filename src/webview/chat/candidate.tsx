import type { ChatMountOptions, UiLanguageState } from "./types.js";
import { ExtensionInteractions, RuntimeRecoveryBanner } from "./extension-interactions.js";
import { CandidateReview } from "./candidate-review.js";
import { CandidateContext } from "./candidate-context.js";
import { ProjectResourcesPrompt } from "./project-resources-prompt.js";
import { DefaultModelPicker } from "./default-model-picker.js";
import { NoFolderPrompt } from "./no-folder-prompt.js";
import { PiWelcomeMark } from "./pi-welcome-mark.js";
import { InterfaceSettings } from "./interface-settings.js";
import { createUiLanguage } from "./ui-language.js";
import { ChatPreviewContext, useChatPreview } from "./environment.js";
import { SESSION_PAGE_SIZE, SAVED_HISTORY_PAGE_SIZE } from "../index.js";
import { CandidateSessions } from "./candidate-sessions.js";
import { CandidateConversation } from "./candidate-conversation.js";
import { useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { WebviewClient, availability, type WebviewBridge } from "../index.js";
import { ModelPicker, WorkspaceSetup, SavedHistory, Approvals, SessionGrants, UiTextProvider, useUiText } from "../components/index.js";

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
  const [settingsOpenRequest, setSettingsOpenRequest] = useState(0);
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
  useLayoutEffect(() => {
    const node = input.current;
    if (node) { node.style.height = "auto"; node.style.height = `${Math.min(node.scrollHeight, 140)}px`; }
  }, [snapshot.text]);
  const progress = controls.stopping ? t("Stopping… Waiting for the task to settle.")
    : state?.execution === "retrying" ? t("Retrying…")
    : state?.execution === "compacting" ? t("Compacting context…")
    : state?.execution === "completed" ? t("Task completed")
    : state?.execution === "stopped" ? t("Task stopped · Side effects are not rolled back.")
    : state?.execution === "failed" ? t("Task failed")
    : state?.chatBusy ? state.execution === "replying" ? t("Replying…") : t("Working…") : null;
  return <section lang={locale} className="candidate" aria-label={t(preview ? "Candidate chat" : "Pi chat")} onKeyDown={event => {
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
      <InterfaceSettings
        language={language}
        openRequest={settingsOpenRequest}
        executionProfile={snapshot.executionProfile}
        providerConfig={snapshot.providerConfig}
        onChooseProfile={profile => client.action({ type: "chooseExecutionProfile", profile })}
        onEndRuntime={() => client.action({ type: "endOwnedRuntime" })}
        onRecoverRuntime={() => client.action({ type: "recoverControlledRuntime" })}
        onAddApiKey={providerId => client.action({ type: "openProviderApiKey", providerId })}
        onLogoutProvider={providerId => client.action({ type: "logoutProvider", providerId })}
        onSetDefaultModel={(provider, modelId) => client.action({ type: "setDefaultModel", provider, modelId })}
        onRefreshProviders={() => client.action({ type: "refreshProviderConfig" })}
      />
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
            {!preview && <button type="button" className="candidate__link-button" onClick={() => setSettingsOpenRequest(value => value + 1)}>{t("Open provider settings")}</button>}
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
      {progress && <p className="candidate__progress" role="status" data-active={!!state?.chatBusy || controls.stopping}><span className="candidate__pulse" aria-hidden="true" />{progress}</p>}
      {state?.chatError && state.runtime !== "error" && <p className="candidate__error" role="status">{state.chatError}</p>}
      </div>
      <form className="candidate__composer" onSubmit={event => { event.preventDefault(); submit(); }}>
        <CandidateContext onRequireWorkspace={canPrepare && !state.busy && !snapshot.error ? () => { if (needsResources) setResourcesPrompt(true); else { setContextPrompt(true); setFolderPrompt(true); } } : undefined} historyDisabled={!canBrowse || controls.sessionTransitioning} key={identity} pageSize={16} history={snapshot.history} historyOpen={snapshot.historyOpen} historyPage={snapshot.historyPage} onHistory={client.toggleHistory} onHistoryPage={client.navigateHistory} state={snapshot.attachments} disabled={controls.attachmentDisabled} onAdd={client.addAttachment} onAddSelection={client.addSelection} onRemove={client.removeAttachment} onConfirm={client.confirmAttachment} onPreview={client.requestPreview} onClosePreview={client.closePreview} preview={snapshot.preview} />
        <textarea ref={input} aria-label={t("Message")} placeholder={t("Ask pi anything…")} rows={2} maxLength={8000} value={snapshot.text}
          readOnly={readableRuntimeError}
          disabled={!!snapshot.error || (canPrepare ? !!state.busy : (!canCompose && !readableRuntimeError) || !snapshot.attachments)}
          onChange={event => client.edit(event.currentTarget.value)}
          onKeyDown={event => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit(); }
          }} />
        <div className="candidate__composer-actions">
          <div className="candidate__model">
            {canPrepare
              ? <DefaultModelPicker config={snapshot.providerConfig} disabled={!!snapshot.error || !!state.busy}
                  onSelect={(provider, modelId) => client.action({ type: "setDefaultModel", provider, modelId })}
                  onSettings={() => setSettingsOpenRequest(value => value + 1)} />
              : state
              ? <ModelPicker key={`${state.viewId}-${state.generation}`} state={state} disabled={controls.settingsDisabled} continuousThinkingDrag animatePopover
                  onModel={(provider, modelId) => client.action({ type: "setChatModel", provider, modelId })}
                  onThinking={level => client.action({ type: "setThinkingLevel", level })} />
              : <button id="model-effort-trigger" className="chip" type="button" disabled
                  title={t(preview ? "Connecting to the preview…" : "Connecting to the extension host…")}
                  aria-label={t("Model and thinking level")}>
                  <span className="model-effort-trigger__model">{t("Model not configured")}</span>
                  <span className="model-effort-trigger__thinking"> · —</span>
                </button>}
          </div>
          {canBrowse && state && <details className="candidate-permissions" key={`permissions-${identity}`} onKeyDown={event => {
            if (event.key === "Escape" && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.open = false; event.currentTarget.querySelector("summary")?.focus(); }
          }}>
            <summary aria-label={t("Permissions ({count})", { count: state.grants.length })} title={t("Permissions ({count})", { count: state.grants.length })}>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.5 4 5v4.5c0 3.6 2.5 6.6 6 8 3.5-1.4 6-4.4 6-8V5l-6-2.5Z" /></svg>
            </summary>
            <div className="candidate-permissions__content">
              <p>{state.controlledExecution ? t("Controlled execution: covered tools ask for approval; this is not a sandbox.") : t("Trusted extension code runs outside covered tool approvals; this is not a sandbox.")}</p>
              <SessionGrants grants={state.grants} disabled={controls.stopping || !!snapshot.error} onRevoke={id => client.action({ type: "revokeGrant", id })} />
            </div>
          </details>}
          {controls.showStop
            ? <button className="candidate__send candidate__send--stop" type="button" aria-label={t("Stop current task")} disabled={controls.stopping} onClick={client.stop}><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="5.5" y="5.5" width="9" height="9" rx="1.5" /></svg></button>
            : <button className="candidate__send" type="submit" aria-label={t("Send message")} disabled={canPrepare ? !snapshot.text.trim() || !!state.busy || !!snapshot.error : controls.sendDisabled}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 16V4m-5 5 5-5 5 5" /></svg></button>}
        </div>
      </form>
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
