export type RuntimePhase = "not-started" | "starting" | "ready" | "stopping" | "error";

export type ProjectTrustFlag = "approve" | "no-approve";

export type RuntimeStartResult =
  | { ok: true; modelLabel: string | null }
  | { ok: false; detail: string };

export type PromptResult = { ok: true } | { ok: false; detail: string };

import type { ModelCatalogEntry } from "./modelCatalog.js";

export type { ModelCatalogEntry };

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

import type { GateCall } from "./toolApproval.js";
export type ActivityItem = { id: string; kind: "thinking" | "tool"; messageId: string; contentIndex?: number; toolCallId?: string; tool?: string; text: string; input?: string; status: "thinking" | "preparing" | "executing" | "complete" | "failed" | "interrupted"; truncated: boolean };

export type RuntimeEvent =
  | { kind: "activity"; session: number; item: ActivityItem }
  | { kind: "message_final"; session: number; messageId: string; text: string }
  | { kind: "runtime_error"; session: number; detail: string }

  | { kind: "text_delta"; session: number; delta: string; messageId?: string }
  | { kind: "stream_error"; session: number; detail: string }
  | { kind: "agent_settled"; session: number };

/** Host-owned pi subprocess lifecycle; implemented in adapter, injected from extension entry. */
export interface PiRuntimeLifecycle {
  start(options: { cwd: string; projectTrust: ProjectTrustFlag }): Promise<RuntimeStartResult>;
  stop(): Promise<void>;
  /** Stop current task without clearing live-session grants. */
  abortTask?(): Promise<PromptResult>;
  setApprovalHandler?(handler: (call: GateCall) => Promise<boolean>): void;
  /** Increments when a new subprocess session becomes active; used to drop stale RPC events. */
  getSession(): number;
  subscribe(listener: (event: RuntimeEvent) => void): () => void;
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
