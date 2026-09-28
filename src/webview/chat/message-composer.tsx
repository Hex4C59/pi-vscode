import { useLayoutEffect, type ReactElement, type RefObject } from "react";
import { availability, type ClientSnapshot, type WebviewClient } from "../index.js";
import { ModelPicker, SessionGrants, useUiText } from "../components/index.js";
import { CandidateContext } from "./candidate-context.js";
import { DefaultModelPicker } from "./default-model-picker.js";
import { ComposerIcon } from "./composer-icon.js";
import { useChatPreview } from "./environment.js";

type ComposerProps = {
  snapshot: ClientSnapshot;
  client: Pick<WebviewClient, "edit" | "action" | "stop" | "toggleHistory" | "navigateHistory" | "addAttachment" | "addSelection" | "removeAttachment" | "confirmAttachment" | "requestPreview" | "closePreview">;
  input: RefObject<HTMLTextAreaElement | null>;
  canPrepare: boolean;
  canBrowse: boolean;
  canCompose: boolean;
  readableRuntimeError: boolean;
  submit: () => void;
  onRequireWorkspace?: () => void;
  onSettings: () => void;
};

/** One subscription owner upstream; local layout and input behavior live here. */
export function MessageComposer({ snapshot, client, input, canPrepare, canBrowse, canCompose, readableRuntimeError, submit, onRequireWorkspace, onSettings }: ComposerProps): ReactElement {
  const { text: t } = useUiText();
  const preview = useChatPreview();
  const state = snapshot.workspace;
  const controls = availability(snapshot);
  const identity = state ? state.viewId + ":" + state.generation : null;
  useLayoutEffect(() => {
    const node = input.current;
    if (node) { node.style.height = "auto"; node.style.height = `${Math.min(node.scrollHeight, 140)}px`; }
  }, [snapshot.text, input]);
  return <form className="candidate__composer" onSubmit={event => { event.preventDefault(); submit(); }}>
    <CandidateContext onRequireWorkspace={onRequireWorkspace} historyDisabled={!canBrowse || controls.sessionTransitioning} key={identity} pageSize={16} history={snapshot.history} historyOpen={snapshot.historyOpen} historyPage={snapshot.historyPage} onHistory={client.toggleHistory} onHistoryPage={client.navigateHistory} state={snapshot.attachments} disabled={controls.attachmentDisabled} onAdd={client.addAttachment} onAddSelection={client.addSelection} onRemove={client.removeAttachment} onConfirm={client.confirmAttachment} onPreview={client.requestPreview} onClosePreview={client.closePreview} preview={snapshot.preview}>{({ actions, content }) => <>
    {content}
    <textarea ref={input} aria-label={t("Message")} placeholder={t("Ask pi anything…")} rows={2} maxLength={8000} value={snapshot.text}
      readOnly={readableRuntimeError}
      disabled={!!snapshot.error || (canPrepare ? !!state?.busy : (!canCompose && !readableRuntimeError) || !snapshot.attachments)}
      onChange={event => client.edit(event.currentTarget.value)}
      onKeyDown={event => {
        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit(); }
      }} />
    <div className="candidate__composer-actions">
      {actions}
      <div className="candidate__model">
        {canPrepare
          ? <DefaultModelPicker config={snapshot.providerConfig} disabled={!!snapshot.error || !!state?.busy}
              onSelect={(provider, modelId) => client.action({ type: "setDefaultModel", provider, modelId })}
              onSettings={onSettings} />
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
          <ComposerIcon name="shield-check" />
        </summary>
        <div className="candidate-permissions__content">
          <p>{state.controlledExecution ? t("Controlled execution: covered tools ask for approval; this is not a sandbox.") : t("Trusted extension code runs outside covered tool approvals; this is not a sandbox.")}</p>
          <SessionGrants grants={state.grants} disabled={controls.stopping || !!snapshot.error} onRevoke={id => client.action({ type: "revokeGrant", id })} />
        </div>
      </details>}
      {controls.showStop
        ? <button className="candidate__send candidate__send--stop" type="button" aria-label={t("Stop current task")} disabled={controls.stopping} onClick={client.stop}><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="5.5" y="5.5" width="9" height="9" rx="1.5" /></svg></button>
        : <button className="candidate__send" type="submit" aria-label={t("Send message")} disabled={canPrepare ? !snapshot.text.trim() || !!state?.busy || !!snapshot.error : controls.sendDisabled}><ComposerIcon name="arrow-up" /></button>}
    </div>
    </>}</CandidateContext>
  </form>;
}
