import { useEffect, useLayoutEffect, useRef, useState, type ReactElement, type RefObject } from "react";
import type { AttachmentHistoryEntry, AttachmentStateMessage, ExecutionProfileProjection, ProviderConfigProjection, WorkspaceStateMessage } from "../../extension/contracts/index.js";
import { ModelPickerView, SessionGrants, useChatPreview, useUiText, type AttachmentPreview } from "../components/index.js";
import { CandidateContext } from "./candidate-context.js";
import { ComposerIcon } from "./composer-icon.js";
import { ExecutionProfileControls } from "./extension-interactions.js";

type ComposerProps = {
  text: string;
  error: string | null;
  workspace: WorkspaceStateMessage | null;
  attachments: AttachmentStateMessage | null;
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
  attachmentDisabled: boolean;
  settingsDisabled: boolean;
  sessionTransitioning: boolean;
  submit: () => void;
  onEdit: (text: string) => void;
  onStop: () => void;
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
  modelOpen: boolean;
  setModelOpen: (next: boolean) => void;
  permissions: { readonly current: HTMLDetailsElement | null };
  onPermissionsToggle: (event: { currentTarget: HTMLDetailsElement }) => void;
};

function useComposerChrome(identity: string | null): ComposerChrome {
  const permissions = useRef<HTMLDetailsElement>(null);
  const [modelOpen, setModelOpenState] = useState(false);
  useEffect(() => {
    setModelOpenState(false);
    if (permissions.current) permissions.current.open = false;
  }, [identity]);
  return {
    modelOpen,
    permissions,
    setModelOpen: (next: boolean) => {
      if (next && permissions.current) permissions.current.open = false;
      setModelOpenState(next);
    },
    onPermissionsToggle: event => {
      if (event.currentTarget.open) setModelOpenState(false);
    },
  };
}

/** Layout and input behavior; send, stop, draft and attachment intents are bound by the page. */
export function MessageComposer({
  text, error, workspace, attachments, history, historyOpen, historyPage, preview, providerConfig, executionProfile,
  input, canPrepare, canBrowse, canCompose, readableRuntimeError, showStop, stopping, sendBlocked, attachmentDisabled,
  settingsDisabled, sessionTransitioning, submit, onEdit, onStop, onAddAttachment, onAddSelection, onRemoveAttachment,
  onConfirmAttachment, onToggleHistory, onNavigateHistory, onRequestPreview, onClosePreview, onSetDefaultModel,
  onSetDefaultThinking, onSetChatModel, onSetThinking, onChooseExecutionProfile, onEndOwnedRuntime,
  onRecoverControlledRuntime, onRevokeGrant, onRequireWorkspace, onSettings,
}: ComposerProps): ReactElement {
  const { text: t } = useUiText();
  const previewMode = useChatPreview();
  const identity = workspace ? workspace.viewId + ":" + workspace.generation : null;
  const chrome = useComposerChrome(identity);
  useLayoutEffect(() => {
    const node = input.current;
    if (node) { node.style.height = "auto"; node.style.height = `${Math.min(node.scrollHeight, 140)}px`; }
  }, [text, input]);
  return <form className="candidate__composer" onSubmit={event => { event.preventDefault(); submit(); }}>
    <CandidateContext onRequireWorkspace={onRequireWorkspace} historyDisabled={!canBrowse || sessionTransitioning} key={identity} pageSize={16} history={history} historyOpen={historyOpen} historyPage={historyPage} onHistory={onToggleHistory} onHistoryPage={onNavigateHistory} state={attachments} disabled={attachmentDisabled} onAdd={onAddAttachment} onAddSelection={onAddSelection} onRemove={onRemoveAttachment} onConfirm={onConfirmAttachment} onPreview={onRequestPreview} onClosePreview={onClosePreview} preview={preview}>{({ actions, content }) => <>
    {content}
    <textarea ref={input} aria-label={t("Message")} placeholder={t("Ask pi anything…")} rows={2} maxLength={8000} value={text}
      readOnly={readableRuntimeError}
      disabled={!!error || (canPrepare ? !!workspace?.busy : (!canCompose && !readableRuntimeError) || !attachments)}
      onChange={event => onEdit(event.currentTarget.value)}
      onKeyDown={event => {
        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit(); }
      }} />
    <div className="candidate__composer-actions">
      {actions}
      <div className="candidate__model">
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
      </div>
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
      {showStop
        ? <button className="candidate__send candidate__send--stop" type="button" aria-label={t("Stop current task")} disabled={stopping} onClick={onStop}><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="5.5" y="5.5" width="9" height="9" rx="1.5" /></svg></button>
        : <button className="candidate__send" type="submit" aria-label={t("Send message")} disabled={sendBlocked}><ComposerIcon name="arrow-up" /></button>}
    </div>
    </>}</CandidateContext>
  </form>;
}
