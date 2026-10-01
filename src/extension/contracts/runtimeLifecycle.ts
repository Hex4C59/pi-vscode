import type { ExtensionFeedback } from "./extensionInteractions.js";
import type { InteractionFormInput, InteractionReplyCallback } from "../interactions/index.js";
import type { GateCall } from "./approvalProtocol.js";
import type { ActivityItem, AttachmentDetails, ModelCatalogEntry } from "./webviewProtocol.js";
export type { ActivityItem, ModelCatalogEntry, RuntimePhase } from "./webviewProtocol.js";

export type ExtensionExecutionProfile = { kind: "controlled" } | { kind: "trusted"; entryPath: string };

export type ProjectTrustFlag = "approve" | "no-approve";

export type RuntimeStartResult =
  | { ok: true; modelLabel: string | null; conversation?: { id: string; name: string | null; path: string } }
  | { ok: false; detail: string };

export type PromptInput =
  | { kind: "plain"; body: string }
  | { kind: "enriched"; body: string; attachments: ({ path: string; unsaved: boolean; text: string } & AttachmentDetails)[] };

export type AttachmentPromptResult = { rejection?: "authentication"; delivery: "rpc-accepted" | "rpc-rejected" | "not-sent" | "unknown"; code?: "write-failed" | "ack-timeout" | "rpc-rejected" | "runtime-lost" };
export type PromptResult = { ok: true } | { ok: false; detail: string };

/** Supervision state of the run recorded in this window's recovery domain. */
export type RetainedRunState = "owned" | "owner-lost" | "exited" | "never-spawned" | "termination-unconfirmed";

/**
 * Host-start handoff for a run left behind by a previous host. `retired` means the
 * matching terminal receipt was observed before the fence was retired; `live-owner`
 * means another live host still holds the run, so this host must not touch it.
 */
export type RetainedRunHandoff =
  | { ok: true; outcome: "none" | "retired" | "live-owner" }
  | { ok: false; code: "exit-unconfirmed" | "owner-unavailable" | "busy" }
  | { ok: false; code: "blocked"; reason: "storage-unavailable" | "invalid-record" };

export type ModelProjectionResult =
  | {
    ok: true;
    modelLabel: string | null;
    thinkingLevel: string | null;
    thinkingLevels: string[];
    models: ModelCatalogEntry[];
  }
  | { ok: false; detail: string };

export type ModelMutationResult =
  | {
    ok: true;
    modelLabel: string | null;
    thinkingLevel: string | null;
    thinkingLevels: string[];
    models: ModelCatalogEntry[];
  }
  | { ok: false; detail: string };

/** Public upstream pending text, host-only until the host creates a safe UI projection. */
export type QueuedTextSnapshot = { steering: string[]; followUp: string[] };

export type RuntimeEvent =
  | ({ kind: "queue_updated"; session: number } & QueuedTextSnapshot)
  /** null means valid user input that cannot be losslessly correlated as bounded plain text. */
  | { kind: "user_message_started"; session: number; text: string | null }
  | { kind: "workflow"; session: number; phase: "retrying" | "compacting" | "waiting" }
  | { kind: "tool_finished"; session: number; toolCallId: string; failed: boolean }
  | { kind: "activity"; session: number; item: ActivityItem }
  | { kind: "message_final"; session: number; messageId: string; text: string }
  | { kind: "runtime_error"; session: number; detail: string }

  | { kind: "text_delta"; session: number; delta: string; messageId?: string }
  | { kind: "stream_error"; session: number; detail: string }
  | { kind: "agent_settled"; session: number }
  | { kind: "command_handled"; session: number; agentRunning: boolean };

/** Host-owned pi subprocess lifecycle; implemented in adapter, injected from extension entry. */
export interface PiRuntimeLifecycle {
  start(options: { cwd: string; projectTrust: ProjectTrustFlag; profile?: ExtensionExecutionProfile; resume?: { id: string; path: string } }): Promise<RuntimeStartResult>;
  stop(): Promise<void>;
  /** Public-RPC checkpoint before profile replacement; unavailable must leave the runtime intact. */
  checkpointRestart?(expected: { id: string; path: string }): Promise<
    { kind: "empty" } | { kind: "resume"; conversation: { id: string; path: string } } | { kind: "unavailable" }
  >;
  getOwnershipState?(): Promise<"none" | "pending" | "terminal" | "blocked">;
  endOwnedRuntime?(): Promise<PromptResult>;
  recoverOwnedRuntime?(): Promise<PromptResult>;
  /** Startup handoff for a run a previous host left behind; never touches a live owner. */
  handoffRetainedRuntime?(): Promise<RetainedRunHandoff>;
  /** Host must reserve recovery capacity first. Clear both queues without aborting the task; no implicit retry. */
  recallQueuedText?(expectedSession: number, onQueueCleared: (snapshot: QueuedTextSnapshot) => void): Promise<PromptResult>;
  /** Stop current task; deliver validated clear text synchronously before abort, even if abort later fails. */
  abortTask?(onQueueCleared?: (snapshot: QueuedTextSnapshot) => void): Promise<PromptResult>;
  /** Fail closed without treating transport revocation as child termination. */
  invalidateInteractions?(): void;
  setFeedbackHandler?(handler: (snapshot: { feedback: ExtensionFeedback[]; omittedFeedback: number }) => void): void;
  setInteractionHandler?(handler: (form: InteractionFormInput, reply: InteractionReplyCallback) => void): void;
  setApprovalHandler?(handler: (call: GateCall) => Promise<boolean>): void;
  /** Increments when a new subprocess session becomes active; used to drop stale RPC events. */
  getSession(): number;
  subscribe(listener: (event: RuntimeEvent) => void): () => void;
  preparePrompt(input: PromptInput, expectedSession: number): { send(onAttempt: () => void): Promise<AttachmentPromptResult> };
  prompt(text: string): Promise<PromptResult>;
  getModelProjection(): Promise<ModelProjectionResult>;
  /** Mutations return a fresh applied projection, including current supported levels. */
  setThinkingLevel(level: string): Promise<ModelMutationResult>;
  /** Refreshes get_state and available thinking levels after set_model succeeds. */
  setModel(provider: string, modelId: string): Promise<ModelMutationResult>;
}

export const noopPiRuntimeLifecycle: PiRuntimeLifecycle = {
  async start() {
    return { ok: true, modelLabel: null };
  },
  async handoffRetainedRuntime() {
    return { ok: true, outcome: "none" };
  },
  async stop() {
    /* WI-006 tests: no subprocess */
  },
  getSession() {
    return 0;
  },
  subscribe() {
    return () => undefined;
  },
  preparePrompt() { return { async send() { return { delivery: "not-sent", code: "runtime-lost" }; } }; },
  async prompt() {
    return { ok: false, detail: "Runtime not available." };
  },
  async getModelProjection() {
    return { ok: true, modelLabel: null, thinkingLevel: null, thinkingLevels: [], models: [] };
  },
  async setThinkingLevel() {
    return { ok: false, detail: "Runtime not available." };
  },
  async setModel() {
    return { ok: false, detail: "Runtime not available." };
  },
};
