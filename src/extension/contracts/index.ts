/** Shared DTOs remain type-only in browser code; value exports are host-owned. */
export type * from "./webviewProtocol.js";
export type {
  PiRuntimeLifecycle, RuntimeEvent, ProjectTrustFlag, RuntimeStartResult, ExtensionExecutionProfile,
  PromptInput, AttachmentPromptResult, PromptResult,
  RetainedRunState, RetainedRunHandoff,
  ModelProjectionResult, ModelMutationResult,
} from "./runtimeLifecycle.js";
export { noopPiRuntimeLifecycle } from "./runtimeLifecycle.js";
export type {
  SessionBackend, SessionBackendFailure, SavedSession,
  SavedHistoryPage, SavedHistoryPreview,
} from "./sessionBackend.js";
export { unavailableSessionBackend } from "./sessionBackend.js";
export type { GateCall } from "./approvalProtocol.js";
export { parseGateEnvelope } from "./approvalProtocol.js";
export type { ExtensionFeedback, ExtensionInteractionProjection, ExecutionProfileProjection, ExtensionInteractionIntent, InteractionAnswer, InteractionFormProjection } from "./extensionInteractions.js";
export type { ProviderConfigProjection, ProviderConfigEntry, ProviderConfigIntent } from "./providerConfig.js";
export {
  findCatalogEntry,
  isValidModelRef,
  isValidProviderId,
  isValidThinkingLevel,
  isCustomModelId,
  isEndpointDisplayName,
  isPublicHttpUrl,
  endpointProviderId,
  MAX_MODEL_CATALOG_ENTRIES,
  MAX_MODEL_ID_CHARS,
  MAX_MODEL_LABEL_CHARS,
  MAX_MODEL_PROVIDER_CHARS,
  MAX_THINKING_LEVEL_CHARS,
} from "./modelCatalog.js";
export { containsCredentialLikeText, redactCredentialLikeText } from "./credentialText.js";
