/** Shared DTOs remain type-only in browser code; value exports are host-owned. */
export type * from "./webviewProtocol.js";
export type {
  PiRuntimeLifecycle, RuntimeEvent, ProjectTrustFlag, RuntimeStartResult, ExtensionExecutionProfile,
  PromptInput, AttachmentPromptResult, PromptResult, QueuedTextSnapshot, CommandCatalogue, CommandCatalogueRow,
  RetainedRunState, RetainedRunHandoff,
  ModelProjectionResult, ModelMutationResult, ManualCompactionResult,
} from "./runtimeLifecycle.js";
export { noopPiRuntimeLifecycle } from "./runtimeLifecycle.js";
export type {
  SessionBackend, SessionBackendFailure, SessionBackendListFailure, SavedSession,
  SavedHistoryPage, SavedHistoryPreview,
} from "./sessionBackend.js";
export { unavailableSessionBackend } from "./sessionBackend.js";
export type { GateCall } from "./approvalProtocol.js";
export { parseGateEnvelope } from "./approvalProtocol.js";
export type { ExtensionFeedback, ExtensionInteractionProjection, ExecutionProfileProjection, ExtensionInteractionIntent, InteractionAnswer, InteractionFormProjection } from "./extensionInteractions.js";
export type { ProviderConfigProjection, ProviderConfigEntry, ProviderConfigIntent } from "./providerConfig.js";
export type {
  PluginInventoryProjection, PluginInventoryItem, PluginInventoryError, PluginInventoryIntent,
} from "./pluginInventory.js";
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

/** Host-authoritative syntax validator; never grants filesystem access. */
export { fileReferenceToken } from "./fileReference.js";

export { DEFAULT_SESSION_SEARCH, isSavedSessionSearch } from "./sessionSearch.js";
