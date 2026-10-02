import type { CommandCatalogueRow } from "./runtimeLifecycle.js";
import type { ExtensionInteractionIntent, ExtensionInteractionProjection, ExecutionProfileProjection } from "./extensionInteractions.js";
import type { PluginInventoryIntent, PluginInventoryProjection } from "./pluginInventory.js";
import type { ProviderConfigIntent, ProviderConfigProjection } from "./providerConfig.js";
/** Canonical browser/host DTOs. Type-only: no Node, VS Code or runtime dependencies. */
export type RuntimePhase = "not-started" | "starting" | "ready" | "stopping" | "error";
export type ActivityItem = { id: string; kind: "thinking" | "tool"; messageId: string; contentIndex?: number; toolCallId?: string; tool?: string; text: string; input?: string; status: "thinking" | "preparing" | "executing" | "complete" | "failed" | "interrupted"; truncated: boolean };
export type ModelCatalogEntry = { provider: string; modelId: string; label: string };
export type ApprovalCard = { category?: "custom"; id: string; toolCallId: string; tool: string; input: string; scope: string | null; expiresAt: number };
export type SessionGrant = { id: string; scope: string };
export type ApprovalDecision = "once" | "session" | "deny";
export type SelectionRange = { start: { line: number; character: number }; end: { line: number; character: number } };
export type AttachmentDetails = { kind: "file" } | { kind: "selection"; originalRange: SelectionRange; stale: boolean };
export type AttachmentCode = "no-editor" | "empty-selection" | "multiple-selections" | "cancelled" | "busy" | "stale" | "ineligible" | "attachment-limit" | "total-too-large" | "invalid-source" | "outside-workspace" | "unavailable" | "not-text" | "source-too-large" | "text-too-large" | "metadata-too-large" | "sensitive-source" | "source-changed" | "history-full" | "frame-too-large" | "preparation-cancelled" | "write-failed" | "ack-timeout" | "rpc-rejected" | "runtime-lost";

export type ResourceChoice = "allow" | "decline";
export type WorkspaceStatus = "no-folder" | "multi-root" | "remote" | "non-file" | "untrusted" | "eligible";
export type ChatRole = "user" | "assistant";
export type ChatLine = { role: ChatRole; text: string; id?: string; bodyCopyEligible?: true };
export type PingMessage = { version: 3; type: "ping" };
export type PongMessage = { version: 3; type: "pong" };
type Action = { version: 3; generation: number; viewId: string };
export type WebviewMessage = PingMessage | { version: 3; type: "getWorkspaceState" }
  | Action & ExtensionInteractionIntent
  | Action & ProviderConfigIntent
  | Action & PluginInventoryIntent
  | Action & (
    | { type: "openSettings" }
    | { type: "setUiLanguage"; locale: "en" | "zh-CN" }
    | { type: "stopChat" | "openFolder" | "manageTrust" | "getAttachmentHistory" | "getChangeReview" | "newConversation" | "refreshSessionUsage" | "renameSession" }
    | { type: "decideApproval"; id: string; decision: ApprovalDecision }
    | { type: "revokeGrant" | "openReviewDiff" | "openReviewSource" | "resumeConversation"; id: string }
    | { type: "getSavedSessions" | "getSavedHistory"; page: number }
    | ({ type: "searchSavedSessions" } & SavedSessionSearch)
    | { type: "getSavedHistoryPreview"; id: string; requestId: string; offset: number }
    | { type: "chooseResources"; choice: ResourceChoice }
    | { type: "sendChat" | "addFileAttachment"; draftRevision: number }
    | { type: "addSelectionAttachment"; draftRevision: number }
    | { type: "completeFileReference"; draftRevision: number; caret: number }
    | { type: "completeCommand"; draftRevision: number; name: string }
    | { type: "queueChat"; draftRevision: number; mode: "steering" | "follow-up" }
    | { type: "recallQueuedText"; queueRevision: number }
    | { type: "useRecoveredText"; id: string; draftRevision: number }
    | { type: "discardRecoveredText"; id: string }
    | { type: "updateDraft"; draftRevision: number; editSequence: number; text: string }
    | { type: "removeAttachment"; draftRevision: number; attachmentId: string }
    | { type: "confirmFileAttachment" | "confirmSelectionAttachment"; draftRevision: number; attachmentId: string; snapshotId: string }
    | { type: "getAttachmentPreview"; requestId: string; snapshotId: string; offset: number }
    | { type: "setThinkingLevel"; level: string }
    | { type: "setChatModel"; provider: string; modelId: string });
export type WorkspaceStateMessage = {
  version: 3;
  type: "workspaceState";
  viewId: string;
  generation: number;
  status: WorkspaceStatus;
  folder: { name: string; path: string } | null;
  choice: ResourceChoice | null;
  busy: boolean;
  error: string | null;
  runtime: RuntimePhase;
  runtimeDetail: string | null;
  messages: ChatLine[];
  chatBusy: boolean;
  chatError: string | null;
  chatModel: string | null;
  thinkingLevel: string | null;
  thinkingLevels: string[];
  availableModels: ModelCatalogEntry[];
  /** Host-owned next-turn intent; never represents applied runtime configuration. */
  pendingModel: ModelCatalogEntry | null;
  pendingThinkingLevel: string | null;
  modelBusy: boolean;
  modelError: string | null;
  activities: ActivityItem[];
  approvals: ApprovalCard[];
  grants: SessionGrant[];
  execution: "idle" | "waiting" | "thinking" | "awaiting-approval" | "executing" | "replying" | "retrying" | "compacting" | "completed" | "stopped" | "stopping" | "failed";
  controlledExecution: boolean;
};

/** Host-owned, bounded attachment projections. Browser consumers import types only. */
export type AttachmentMetadata = {
  attachmentId: string;
  snapshotId: string;
  relativePath: string;
  utf8Bytes: number;
  unsaved: boolean;
} & AttachmentDetails;
export type DraftAttachment = AttachmentMetadata & { state: "attached" | "changed" | "confirmation-required" | "unavailable" };
export type AttachmentHistoryEntry = Omit<AttachmentMetadata, "attachmentId" | "kind"> & AttachmentDetails & { submissionId: string; delivery: string; outcome: string };
export type HostEnvelope = { version: 3; generation: number; viewId: string };
export type AttachmentStateMessage = HostEnvelope & {
  type: "attachmentState";
  draft: { revision: number; text: string; acceptedEditSequence: number; attachments: DraftAttachment[] };
  preparation: "idle" | "picking" | "preparing";
  result: { code: AttachmentCode } | null;
  historyCount: number;
  retainedBytes: number;
  lastSubmission: { submissionId: string; draftRevision: number; delivery: string; outcome: string } | null;
};
export type AttachmentHistoryMessage = HostEnvelope & { type: "attachmentHistory"; entries: AttachmentHistoryEntry[] };
export type AttachmentPreviewMessage = HostEnvelope & { type: "attachmentPreview"; requestId: string } & (
  { code: AttachmentCode } |
  { snapshotId: string; offset: number; nextOffset: number; done: boolean; text: string }
);
export type QueuedTextErrorCode =
  | "busy" | "stale" | "capacity" | "invalid-text" | "attachments"
  | "runtime-unavailable" | "unconfirmed" | "unavailable" | "draft-not-empty";
export type QueuedPendingEntry =
  | { attribution: "local" | "external" | "unknown"; reusable: true; text: string }
  | { attribution: "local" | "external" | "unknown"; reusable: false };
export type QueuedRecoveryEntry =
  | { id: string; mode: "steering" | "follow-up"; status: "recalled"; text: string }
  | { id: string; mode: "steering" | "follow-up"; status: "unavailable" };
export type QueuedTextStateMessage = HostEnvelope & {
  type: "queuedTextState";
  revision: number;
  phase: "idle" | "submitting" | "recalling" | "stopping";
  error: QueuedTextErrorCode | null;
  pending: { steering: QueuedPendingEntry[]; followUp: QueuedPendingEntry[] };
  recovery: QueuedRecoveryEntry[];
};
export type InteractionStateMessage = HostEnvelope & ExtensionInteractionProjection & { type: "interactionState" };
export type ExecutionProfileStateMessage = HostEnvelope & ExecutionProfileProjection & { type: "executionProfileState" };
export type ProviderConfigStateMessage = HostEnvelope & ProviderConfigProjection & { type: "providerConfigState" };
export type PluginInventoryStateMessage = HostEnvelope & PluginInventoryProjection & { type: "pluginInventoryState" };
export type UiLanguageStateMessage = HostEnvelope & { type: "uiLanguageState"; locale: "en" | "zh-CN" };
export type CommandCatalogueStateMessage = Action & {
  type: "commandCatalogueState";
  revision: number;
  status: "loading" | "ready" | "empty" | "unavailable";
  error: "unavailable" | null;
  rows: readonly CommandCatalogueRow[];
};

export type SessionUsage = {
  tokens: { input: number; output: number; cacheRead: number; cacheWrite: number; total: number };
  context: { tokens: number | null; contextWindow: number; percent: number | null } | null;
  cost: number | null;
};
export type SessionUsageStateMessage = HostEnvelope & { type: "sessionUsageState"; revision: number } & (
  | { status: "ready"; usage: SessionUsage }
  | { status: "loading" | "unavailable" | "no-session"; usage: null }
);

export type SessionRenameStateMessage = HostEnvelope & {
  type: "sessionRenameState"; revision: number; status: "unavailable" | "ready" | "renaming";
};

export type HostMessage = SessionRenameStateMessage | SessionUsageStateMessage | CommandCatalogueStateMessage | UiLanguageStateMessage | InteractionStateMessage | ExecutionProfileStateMessage | ProviderConfigStateMessage | PluginInventoryStateMessage | SavedHistoryStateMessage | SavedHistoryPreviewMessage | SessionStateMessage | ChangeReviewStateMessage | WorkspaceStateMessage | AttachmentStateMessage | AttachmentHistoryMessage | AttachmentPreviewMessage | QueuedTextStateMessage
  | HostEnvelope & { type: "pong" };

/** Bounded review metadata only. Before/after text stays in host-owned readonly documents. */
export type ReviewReason = "outside-project" | "sensitive-source" | "not-text" | "too-large" | "unavailable" | "changed-during-capture" | "no-before-snapshot" | "retention-limit" | "not-applied";
export type ChangeReviewEntry = {
  id: string; taskId: string; path: string | null;
  source: "tool" | "observed"; tool: "write" | "edit" | null;
  status: "pending" | "complete" | "failed" | "interrupted" | "observed";
  diff: "pending" | "ready" | "unchanged" | "unavailable";
  reason: ReviewReason | null; sourceChanged: boolean; overlap: boolean;
};
export type ChangeReviewStateMessage = HostEnvelope & {
  type: "changeReviewState"; entries: ChangeReviewEntry[]; retainedBytes: number;
  limited: boolean; reset: boolean; error: "unavailable" | "stale" | null;
};

/** Session catalogue metadata only; storage paths stay in host/adapter. */
export type SavedSessionSearch = { query: string; namedOnly: boolean; sort: "recent" | "oldest" | "name" };
export type SessionError = "unavailable" | "cancelled" | "stale" | "wrong-project" | "stop-failed" | "restore-failed" | "catalogue-too-large";
export type SessionStateMessage = HostEnvelope & {
  type: "sessionState";
  phase: "idle" | "listing" | "confirming" | "switching" | "error";
  current: { id: string; name: string | null } | null;
  loaded: boolean;
  entries: { id: string; title: string; excerpt: string; modified: string }[];
  page: number; total: number; search?: SavedSessionSearch;
  error: SessionError | null;
};

/** Bounded restored active-branch history; storage paths and SDK entry IDs remain host-only. */
export type SavedHistoryStateMessage = HostEnvelope & {
  type: "savedHistoryState"; available: boolean; phase: "idle" | "loading" | "error";
  messages: ChatLine[]; page: number; total: number;
  error: "unavailable" | "stale" | "cancelled" | null;
};
export type SavedHistoryPreviewMessage = HostEnvelope & { type: "savedHistoryPreview"; requestId: string; id: string } & (
  { code: "unavailable" | "stale" | "cancelled" } |
  { text: string; offset: number; nextOffset: number; done: boolean; totalChars: number }
);
