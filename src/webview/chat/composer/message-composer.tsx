import { useEffect, useRef, useState, type ReactElement, type RefObject } from "react";
import type { AttachmentHistoryEntry, AttachmentStateMessage, CommandCatalogueStateMessage, ExecutionProfileProjection, ProviderConfigProjection, QueuedTextStateMessage, WorkspaceStateMessage } from "../../../extension/contracts/index.js";
import { ModelPickerView, SessionGrants, useChatPreview, useUiText, type AttachmentPreview } from "../../components/index.js";
import { CommandInput } from "./command-input.js";
import { CandidateContext } from "./candidate-context.js";
import { ComposerIcon } from "./composer-icon.js";
import { UsagePanel } from "./usage-panel.js";
import type { SessionUsageStateMessage } from "../../../extension/contracts/index.js";
import { QueuedTextPanel } from "./queued-text-panel.js";
import { ExecutionProfileControls } from "../execution/extension-interactions.js";

type ComposerProps = {
  sessionUsage?: SessionUsageStateMessage | null;
  onRefreshUsage?: () => void;
  text: string;
  error: string | null;
  workspace: WorkspaceStateMessage | null;
  attachments: AttachmentStateMessage | null;
  queuedText: QueuedTextStateMessage | null;
  commandCatalogue: CommandCatalogueStateMessage | null;
  onCompleteCommand: (name: string) => void;
  commandCompletionDisabled: boolean;
  history: AttachmentHistoryEntry[];
  historyOpen: boolean;
  historyPage: number | null;
  preview: AttachmentPreview | null;
  providerConfig: ProviderConfigProjection | null;
  executionProfile: ExecutionProfileProjection | null;
  input: RefObject<HTMLTextAreaElement | null>;
  canPrepare: boolean;
  canBrowse: boolean;
  canCompose: boolean;
  readableRuntimeError: boolean;
  showStop: boolean;
  stopping: boolean;
  sendBlocked: boolean;
  queueDisabled: boolean;
  recallDisabled: boolean;
  attachmentDisabled: boolean;
  settingsDisabled: boolean;
  sessionTransitioning: boolean;
  submit: () => void;
  onEdit: (text: string) => void;
  onStop: () => void;
  onQueueChat: (mode: "steering" | "follow-up") => void;
  onRecallQueuedText: () => void;
  onUseRecoveredText: (id: string) => void;
  onDiscardRecoveredText: (id: string) => void;
  onAddAttachment: () => void;
  onAddSelection: () => void;
  onRemoveAttachment: (attachmentId: string) => void;
  onConfirmAttachment: (attachmentId: string) => void;
  onToggleHistory: () => void;
  onNavigateHistory: (page: number) => void;
  onRequestPreview: (snapshotId: string) => void;
  onClosePreview: () => void;
  onSetDefaultModel: (provider: string, modelId: string) => void;
  onSetDefaultThinking: (provider: string, modelId: string, level: string) => void;
  onSetChatModel: (provider: string, modelId: string) => void;
  onSetThinking: (level: string) => void;
  onChooseExecutionProfile: (profile: "controlled" | "trusted") => void;
  onEndOwnedRuntime: () => void;
  onRecoverControlledRuntime: () => void;
  onRevokeGrant: (id: string) => void;
  onRequireWorkspace?: () => void;
  onSettings: () => void;
};

type ComposerChrome = {
  usageOpen: boolean;
  setUsageOpen: (next: boolean) => void;
  modelOpen: boolean;
  setModelOpen: (next: boolean) => void;
  permissionsOpen: boolean;
  closePopovers: () => void;
  permissions: { readonly current: HTMLDetailsElement | null };
  onPermissionsToggle: (event: { currentTarget: HTMLDetailsElement }) => void;
};

function useComposerChrome(identity: string | null): ComposerChrome {
  const permissions = useRef<HTMLDetailsElement>(null);
  const [modelOpen, setModelOpenState] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [usageOpen, setUsageOpenState] = useState(false);
  const closePopovers = () => {
    setModelOpenState(false); setPermissionsOpen(false); setUsageOpenState(false);
    if (permissions.current) permissions.current.open = false;
  };
  useEffect(closePopovers, [identity]);
  return {
    modelOpen, permissionsOpen, usageOpen, closePopovers, permissions,
    setUsageOpen: next => {
      if (next) closePopovers();
      setUsageOpenState(next);
    },
    setModelOpen: next => {
      if (next) closePopovers();
      setModelOpenState(next);
    },
    onPermissionsToggle: event => {
      setPermissionsOpen(event.currentTarget.open);
      if (event.currentTarget.open) { setModelOpenState(false); setUsageOpenState(false); }
    },
  };
}


type ComposerModelProps = Pick<ComposerProps, "workspace" | "canPrepare" | "providerConfig" | "error" | "settingsDisabled"
  | "onSetDefaultModel" | "onSetDefaultThinking" | "onSetChatModel" | "onSetThinking" | "onSettings"> & { chrome: ComposerChrome };

function ComposerModel({ workspace, canPrepare, providerConfig, error, settingsDisabled,
  onSetDefaultModel, onSetDefaultThinking, onSetChatModel, onSetThinking, onSettings, chrome,
}: ComposerModelProps): ReactElement {
  const { text: t } = useUiText();
  const previewMode = useChatPreview();
  return <div className="candidate__model">
        {canPrepare
          ? <ModelPickerView savedDefault={providerConfig} disabled={!!error || !!workspace?.busy}
              continuousThinkingDrag animatePopover
              open={chrome.modelOpen} onOpenChange={chrome.setModelOpen}
              onModel={onSetDefaultModel}
              onThinking={level => {
                if (providerConfig?.defaultProvider && providerConfig.defaultModelId) onSetDefaultThinking(providerConfig.defaultProvider, providerConfig.defaultModelId, level);
              }}
              onSettings={onSettings} />
          : workspace
          ? <ModelPickerView key={`${workspace.viewId}-${workspace.generation}`} state={workspace} disabled={settingsDisabled} continuousThinkingDrag animatePopover
              open={chrome.modelOpen} onOpenChange={chrome.setModelOpen}
              onModel={onSetChatModel}
              onThinking={onSetThinking} />
          : <button id="model-effort-trigger" className="chip" type="button" disabled
              title={t(previewMode ? "Connecting to the preview…" : "Connecting to the extension host…")}
              aria-label={t("Model and thinking level")}>
              <span className="model-effort-trigger__model">{t("Model not configured")}</span>
              <span className="model-effort-trigger__thinking"> · —</span>
            </button>}
  </div>;
}

/** Layout and input behavior; send, stop, draft and attachment intents are bound by the page. */
export function MessageComposer({
  sessionUsage, onRefreshUsage,
  text, error, workspace, attachments, queuedText, commandCatalogue, onCompleteCommand, commandCompletionDisabled, history, historyOpen, historyPage, preview, providerConfig, executionProfile,
  input, canPrepare, canBrowse, canCompose, readableRuntimeError, showStop, stopping, sendBlocked, queueDisabled, recallDisabled,
  attachmentDisabled, settingsDisabled, sessionTransitioning, submit, onEdit, onStop, onQueueChat, onRecallQueuedText,
  onUseRecoveredText, onDiscardRecoveredText, onAddAttachment, onAddSelection, onRemoveAttachment,
  onConfirmAttachment, onToggleHistory, onNavigateHistory, onRequestPreview, onClosePreview, onSetDefaultModel,
  onSetDefaultThinking, onSetChatModel, onSetThinking, onChooseExecutionProfile, onEndOwnedRuntime,
  onRecoverControlledRuntime, onRevokeGrant, onRequireWorkspace, onSettings,
}: ComposerProps): ReactElement {
  const { text: t } = useUiText();
  const identity = workspace ? workspace.viewId + ":" + workspace.generation : null;
  const chrome = useComposerChrome(identity);
  const taskRunning = !!workspace?.chatBusy;
  return <form className="candidate__composer" onSubmit={event => { event.preventDefault(); if (!taskRunning) submit(); }}>
    <QueuedTextPanel state={queuedText} draftEmpty={!text.trim() && !(attachments?.draft.attachments.length)}
      recallDisabled={recallDisabled} onRecall={onRecallQueuedText} onUse={onUseRecoveredText} onDiscard={onDiscardRecoveredText} />
    <CandidateContext onRequireWorkspace={onRequireWorkspace} historyDisabled={!canBrowse || sessionTransitioning} key={identity} pageSize={16} history={history} historyOpen={historyOpen} historyPage={historyPage} onHistory={onToggleHistory} onHistoryPage={onNavigateHistory} state={attachments} disabled={attachmentDisabled} onAdd={onAddAttachment} onAddSelection={onAddSelection} onRemove={onRemoveAttachment} onConfirm={onConfirmAttachment} onPreview={onRequestPreview} onClosePreview={onClosePreview} preview={preview}>{({ actions, content }) => <>
    {content}
    <CommandInput key={identity} text={text} input={input} catalogue={commandCatalogue}
      readOnly={readableRuntimeError} disabled={!!error || (canPrepare ? !!workspace?.busy : (!canCompose && !readableRuntimeError) || !attachments)}
      blocked={chrome.modelOpen || chrome.permissionsOpen} completionDisabled={commandCompletionDisabled}
      taskRunning={taskRunning} onEdit={onEdit} onComplete={onCompleteCommand} onOpen={chrome.closePopovers} submit={submit} />
    {taskRunning && <div className="candidate__composer-queue" role="group" aria-label={t("Queued text")}>
      <button type="button" disabled={queueDisabled} onClick={() => onQueueChat("steering")}>{t("Steer current task")}</button>
      <button type="button" disabled={queueDisabled} onClick={() => onQueueChat("follow-up")}>{t("Follow up after task")}</button>
    </div>}
    <div className="candidate__composer-actions">
      {actions}
      <ComposerModel workspace={workspace} canPrepare={canPrepare} providerConfig={providerConfig} error={error}
        settingsDisabled={settingsDisabled} chrome={chrome} onSetDefaultModel={onSetDefaultModel}
        onSetDefaultThinking={onSetDefaultThinking} onSetChatModel={onSetChatModel} onSetThinking={onSetThinking} onSettings={onSettings} />
      {(executionProfile || canBrowse) && <details ref={chrome.permissions} className="candidate-permissions" key={`permissions-${identity}`} onToggle={chrome.onPermissionsToggle} onKeyDown={event => {
        if (event.key === "Escape" && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.open = false; event.currentTarget.querySelector("summary")?.focus(); }
      }}>
        <summary aria-label={t("Permissions ({count})", { count: workspace?.grants.length ?? 0 })} title={t("Permissions ({count})", { count: workspace?.grants.length ?? 0 })}>
          <ComposerIcon name="shield-check" />
        </summary>
        <div className="candidate-permissions__content candidate-settings">
          {!executionProfile && workspace && <p>{workspace.controlledExecution ? t("Controlled execution: covered tools ask for approval; this is not a sandbox.") : t("Trusted extension code runs outside covered tool approvals; this is not a sandbox.")}</p>}
          {executionProfile && <ExecutionProfileControls state={executionProfile} density="settings"
            onChoose={onChooseExecutionProfile}
            onEnd={onEndOwnedRuntime} onRecover={onRecoverControlledRuntime} />}
          {canBrowse && workspace && <SessionGrants grants={workspace.grants} disabled={stopping || !!error} onRevoke={onRevokeGrant} />}
        </div>
      </details>}
      <UsagePanel state={sessionUsage ?? null} open={chrome.usageOpen} onOpen={chrome.setUsageOpen}
        busy={taskRunning} disabled={!canCompose || taskRunning || sessionTransitioning || settingsDisabled}
        onRefresh={() => onRefreshUsage?.()} />
      {showStop
        ? <button className="candidate__send candidate__send--stop" type="button" aria-label={t("Stop current task")} disabled={stopping} onClick={onStop}><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="5.5" y="5.5" width="9" height="9" rx="1.5" /></svg></button>
        : <button className="candidate__send" type="submit" aria-label={t("Send message")} disabled={sendBlocked}><ComposerIcon name="arrow-up" /></button>}
    </div>
    </>}</CandidateContext>
  </form>;
}
