/** Shared DTOs remain type-only in browser code; value exports are host-owned. */
export type * from "./webviewProtocol.js";
export type {
  PiRuntimeLifecycle, RuntimeEvent, ProjectTrustFlag, RuntimeStartResult, ExtensionExecutionProfile,
  PromptInput, AttachmentPromptResult, PromptResult,
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
