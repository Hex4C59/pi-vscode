import type { GateCall } from "./approvalProtocol.js";
import type { ActivityItem, AttachmentDetails, ModelCatalogEntry } from "./webviewProtocol.js";
export type { ActivityItem, ModelCatalogEntry, RuntimePhase } from "./webviewProtocol.js";

export type ProjectTrustFlag = "approve" | "no-approve";

export type RuntimeStartResult =
  | { ok: true; modelLabel: string | null; conversation?: { id: string; name: string | null; path: string } }
  | { ok: false; detail: string };

export type PromptInput =
  | { kind: "plain"; body: string }
  | { kind: "enriched"; body: string; attachments: ({ path: string; unsaved: boolean; text: string } & AttachmentDetails)[] };

export type AttachmentPromptResult = { delivery: "rpc-accepted" | "rpc-rejected" | "not-sent" | "unknown"; code?: "write-failed" | "ack-timeout" | "rpc-rejected" | "runtime-lost" };
export type PromptResult = { ok: true } | { ok: false; detail: string };

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

export type RuntimeEvent =
  | { kind: "tool_finished"; session: number; toolCallId: string; failed: boolean }
  | { kind: "activity"; session: number; item: ActivityItem }
  | { kind: "message_final"; session: number; messageId: string; text: string }
  | { kind: "runtime_error"; session: number; detail: string }

  | { kind: "text_delta"; session: number; delta: string; messageId?: string }
  | { kind: "stream_error"; session: number; detail: string }
  | { kind: "agent_settled"; session: number };

/** Host-owned pi subprocess lifecycle; implemented in adapter, injected from extension entry. */
export interface PiRuntimeLifecycle {
  start(options: { cwd: string; projectTrust: ProjectTrustFlag; resume?: { id: string; path: string } }): Promise<RuntimeStartResult>;
  stop(): Promise<void>;
  /** Stop current task without clearing live-session grants. */
  abortTask?(): Promise<PromptResult>;
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
