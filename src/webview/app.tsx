import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { attachmentError, availability } from "./client-state.js";
import { type WebviewClient } from "./webview-client.js";
import {
  WorkspaceSetup, Conversation, ModelPicker, Approvals,
  AttachmentPanel, ChangeReview, Sessions, SavedHistory,
} from "./components/index.js";

const runtimeLabels = { "not-started": "Not running", starting: "Starting…", ready: "Connected", stopping: "Stopping…", error: "Runtime error" };
const executionLabels = { idle: "Ready", waiting: "Waiting for response…", thinking: "Thinking…", "awaiting-approval": "Waiting for tool approval",
  executing: "Executing tool…", replying: "Replying…", stopping: "Stopping… Waiting for task to settle; side effects are not rolled back.", failed: "Task failed / interrupted" };

export function App({ client }: { client: WebviewClient }) {
  const snapshot = useSyncExternalStore(client.subscribe, client.getSnapshot);
  const state = snapshot.workspace;
  const a = availability(snapshot);
  const main = useRef<HTMLElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const follow = useRef(true);
  const scrollPosition = useRef(0);
  const readSavedHistory = () => {
    follow.current = false;
    scrollPosition.current = main.current?.scrollTop ?? 0;
  };
  useLayoutEffect(() => {
    const node = main.current;
    if (node) node.scrollTop = follow.current ? node.scrollHeight : scrollPosition.current;
  }, [state]);
  useLayoutEffect(() => {
    const node = input.current;
    if (node) { node.style.height = "auto"; node.style.height = `${Math.min(node.scrollHeight, 140)}px`; }
  }, [snapshot.text]);
  const chatVisible = !!state && ((state.runtime === "ready" && !state.busy) || state.chatBusy || a.stopping);
  const status = snapshot.synchronizing ? "Synchronizing draft (unacknowledged edits can be lost on view reload)."
    : snapshot.attachments?.result ? attachmentError(snapshot.attachments.result.code, snapshot.attachments.draft.attachments.length === 1 ? snapshot.attachments.draft.attachments[0].kind : undefined)
    : snapshot.attachments?.preparation !== "idle" ? "Preparing attachment… Stop cancels preparation." : "Draft synchronized.";
  return <div className="app-shell">
    <header id="app-header">
      <span id="runtime-dot" data-state={state?.runtime ?? "not-started"} aria-hidden="true" />
      <span id="app-title">pi</span>
      <span id="runtime-hint" className="muted" role="status">{state ? runtimeLabels[state.runtime] : "Connecting…"}</span>
    </header>
    <main id="main" ref={main} onScroll={() => {
      const node = main.current;
      if (node) { follow.current = node.scrollHeight - node.clientHeight - node.scrollTop <= 32; scrollPosition.current = node.scrollTop; }
    }}>
      {snapshot.error && <div className="banner" role="alert">{snapshot.error}</div>}
      {state?.error && <div id="error" className="banner" role="alert">{state.error}</div>}
      {state?.runtimeDetail && <div className="banner" role="alert">{state.runtimeDetail}</div>}
      {!state && !snapshot.error && <p className="empty-state" role="status">Connecting to the extension host…</p>}
      {state && <div key={`${state.viewId}-${state.generation}`}>
        {state.status === "eligible" && state.choice !== null && <Sessions
          state={snapshot.sessions}
          onOpen={client.openSessions}
          onRefresh={() => client.getSavedSessions(0)}
          onPage={client.navigateSessions}
          onNew={client.newConversation}
          onResume={client.resumeConversation}
        />}
        {state.status === "eligible" && state.choice !== null && snapshot.savedHistory && (snapshot.savedHistory.available || snapshot.savedHistory.error) && <SavedHistory
          state={snapshot.savedHistory} pendingPage={snapshot.savedHistoryPendingPage} preview={snapshot.savedHistoryPreview}
          disabled={!!snapshot.error || state.busy || a.sessionTransitioning}
          onPage={client.savedHistory.page} onPreview={client.savedHistory.preview} onPreviewPage={client.savedHistory.navigatePreview}
          onClosePreview={client.savedHistory.closePreview} onInteract={readSavedHistory}
        />}
        {(!chatVisible || state.runtime !== "ready") && <WorkspaceSetup state={state} onAction={client.action} />}
        {(!chatVisible || state.runtime !== "ready") && snapshot.changeReview?.reset && <p id="change-review-reset-notice" className="banner" role="status">Captured change reviews were cleared for this runtime or project. No previous review data is available.</p>}
        {chatVisible && <div id="chat">
           <Conversation messages={state.messages} activities={state.activities} />
           {!state.messages.length && !state.chatBusy && !snapshot.savedHistory?.available && <p className="empty-state">What would you like to work on?</p>}
           <ChangeReview state={snapshot.changeReview} open={snapshot.changeReviewOpen} page={snapshot.changeReviewPage}
             onToggle={client.toggleChangeReview} onPage={client.navigateChangeReview} onDiff={client.openReviewDiff} onSource={client.openReviewSource} />
           <Approvals cards={state.approvals} grants={state.grants} disabled={a.stopping || !!snapshot.error}
            onDecision={(id, decision) => client.action({ type: "decideApproval", id, decision })}
            onRevoke={id => client.action({ type: "revokeGrant", id })} />
          {state.chatError && <div id="chat-error" className="banner" role="alert">{state.chatError}</div>}
        </div>}
      </div>}
    </main>
    {chatVisible && state && <footer id="composer-wrap">
      <div id="composer-context">
      <details id="controlled-disclosure"><summary>Controlled execution · Ask before actions</summary>
        <p>Only the bundled approval extension is loaded. Third-party extensions are disabled. Tools run with your user permissions, not in a sandbox. Stop does not roll back side effects. Tool output may contain sensitive information.</p>
      </details>
      <p id="execution-status" role="status">{a.stopping ? executionLabels.stopping : executionLabels[state.execution]}</p>
      <AttachmentPanel state={snapshot.attachments} history={snapshot.history} historyOpen={snapshot.historyOpen} historyPage={snapshot.historyPage} preview={snapshot.preview}
        disabled={a.attachmentDisabled} status={status} onAdd={client.addAttachment} onAddSelection={client.addSelection} onRemove={client.removeAttachment} onConfirm={client.confirmAttachment}
        onHistory={client.toggleHistory} onHistoryPage={client.navigateHistory} onPreview={client.requestPreview} onClosePreview={client.closePreview} />
      </div>
      <div id="composer">
        <textarea id="chat-input" ref={input} rows={1} placeholder="Message pi…" aria-label="Message" value={snapshot.text}
          disabled={!snapshot.attachments || !!snapshot.error || state.runtime === "error"} onChange={event => client.edit(event.currentTarget.value)}
          onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); client.submit(); } }} />
        <div id="composer-footer">
          <ModelPicker key={`${state.viewId}-${state.generation}`} state={state} disabled={a.settingsDisabled}
            onModel={(provider, modelId) => client.action({ type: "setChatModel", provider, modelId })}
            onThinking={level => client.action({ type: "setThinkingLevel", level })} />
          {a.showStop ? <button id="stop-chat" type="button" aria-label="Stop current task" disabled={a.stopping} onClick={client.stop}>{a.stopping ? "Stopping…" : "Stop"}</button>
            : <button id="send-chat" type="button" aria-label="Send" disabled={a.sendDisabled} onClick={client.submit}>↑</button>}
        </div>
      </div>
    </footer>}
  </div>;
}
