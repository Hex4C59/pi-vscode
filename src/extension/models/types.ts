import type { PiRuntimeLifecycle, WorkspaceStateMessage } from "../contracts/index.js";

/** Applied model settings, pending next-turn selection, and any recoverable error projected to the view. */
export type ModelSettingsSnapshot = Pick<WorkspaceStateMessage,
  "chatModel" | "thinkingLevel" | "thinkingLevels" | "availableModels" | "modelBusy" | "modelError" | "pendingModel" | "pendingThinkingLevel">;

/** Host-owned identity and admission state; stale results must not apply after a generation/session change. */
export type ModelSettingsContext = {
  generation: number; session: number; ready: boolean; disposed: boolean;
  blocked: boolean; chatBusy: boolean; stopping: boolean;
};

export type ModelSettingsSelection =
  | { type: "setChatModel"; provider: string; modelId: string }
  | { type: "setThinkingLevel"; level: string };

export type ModelSettingsRuntime = Pick<PiRuntimeLifecycle, "getModelProjection" | "setModel" | "setThinkingLevel">;
