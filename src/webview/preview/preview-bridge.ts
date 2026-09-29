import type { HandoffOutcome } from "./handoff-confirmation.js";
import type { WebviewBridge } from "../index.js";
import type {
  AttachmentHistoryEntry,
  AttachmentPreviewMessage,
  AttachmentStateMessage,
  ChangeReviewStateMessage,
  DraftAttachment,
  ExecutionProfileProjection,
  ExtensionInteractionProjection,
  HostMessage,
  ProviderConfigProjection,
  SavedHistoryPreviewMessage,
  SavedHistoryStateMessage,
  SessionStateMessage,
  WebviewMessage,
  WorkspaceStateMessage,
} from "../../extension/contracts/index.js";
import {
  type PreviewScenario,
  THINKING_LEVELS,
  READY_FOLDER,
  PREVIEW_TEXT,
  STREAM_CHUNKS,
  FORMATTED_STREAM_CHUNKS,
  ACTIVITY_STREAM_CHUNKS,
  ACTIVITY_THINKING,
  SELECTION_TEXT, LAYOUT_PATH, LITERAL_ATTACHMENT_TEXT,
  SESSION_PAGE_SIZE,
  SAVED_HISTORY_PAGE_SIZE,
  SAVED_HISTORY_PREVIEW_CHUNK_SIZE,
  SESSION_LIST_DELAY,
  SESSION_HANDOFF_DELAY,
  SAVED_HISTORY_DELAY,
  SYNTHETIC_HISTORY_COUNT,
  type SessionEntry,
  SYNTHETIC_SESSION_ENTRIES,
  syntheticHistoryMessages,
  syntheticHistoryText,
  cloneModels,
  modelFor,
  draftAttachment,
  historyEntry,
  baseWorkspace,
  baseSessionState,
  baseSavedHistoryState,
  baseAttachmentState,
} from "./scenarios.js";

type Timer = ReturnType<typeof setTimeout>;
type InboundAction = Extract<WebviewMessage, { type: string }>;
let bridgeNumber = 0;

export type SettingsFixture = "ready" | "loading" | "error" | "empty" | "unconfigured" | "mismatch" | "switching" | "long";
export type PreviewBridgeOptions = {
  title?: string;
  loading?: boolean;
  settings?: SettingsFixture;
  resourcesPending?: boolean;
  locale?: "en" | "zh-CN";
  openSettings?: () => void;
};

function providerConfigFor(fixture?: SettingsFixture): ProviderConfigProjection {
  const ready: ProviderConfigProjection = {
    busy: false, error: null,
    defaultProvider: "synthetic", defaultModelId: "sonnet", defaultThinkingLevel: "medium", thinkingLevels: ["off", "minimal", "low", "medium", "high"],
    providers: [
      { providerId: "synthetic", displayName: "Synthetic provider", configured: true, authLabel: "stored", canAddApiKey: true, canLogout: true, canSignIn: true, canRemoveEndpoint: false },
      { providerId: "other", displayName: "Other provider", configured: false, authLabel: null, canAddApiKey: true, canLogout: false, canSignIn: false, canRemoveEndpoint: true },
    ],
    catalog: [
      { provider: "synthetic", modelId: "sonnet", label: "Claude Sonnet" },
      { provider: "synthetic", modelId: "haiku", label: "Claude Haiku" },
    ],
  };
  if (fixture === "loading") return { ...ready, busy: true };
  if (fixture === "error") return { ...ready, error: "Could not refresh provider configuration." };
  if (fixture === "empty") return { busy: false, error: null, defaultProvider: null, defaultModelId: null, defaultThinkingLevel: null, thinkingLevels: [], providers: [], catalog: [] };
  if (fixture === "unconfigured") {
    return {
      ...ready, defaultProvider: null, defaultModelId: null, defaultThinkingLevel: null, thinkingLevels: [], catalog: [],
      providers: ready.providers.map(provider => ({ ...provider, configured: false, authLabel: null, canLogout: false })),
    };
  }
  if (fixture === "mismatch") return { ...ready, defaultModelId: "haiku" };
  if (fixture === "long") {
    return {
      ...ready,
      providers: [
        { providerId: "synthetic", displayName: "Synthetic Anthropic Messages API With An Unreasonably Long Provider Title", configured: true, authLabel: "stored", canAddApiKey: true, canLogout: true, canSignIn: true, canRemoveEndpoint: false },
        { providerId: "other", displayName: "Other Extremely Verbose Compatibility Provider", configured: false, authLabel: null, canAddApiKey: true, canLogout: false, canSignIn: false, canRemoveEndpoint: true },
      ],
      catalog: [
        { provider: "synthetic", modelId: "sonnet", label: "claude-opus-4-thinking-preview-unreasonably-long-model-name" },
        { provider: "synthetic", modelId: "haiku", label: "Claude Haiku" },
      ],
    };
  }
  return ready;
}

export class PreviewBridge implements WebviewBridge {
  readonly viewId: string;
  private readonly listeners = new Set<(message: unknown) => void>();
  private readonly timers = new Set<Timer>();
  private readonly sessionTimers = new Set<Timer>();
  private readonly streamTimers = new Set<Timer>();
  private readonly previews = new Map<string, string>([
    ["snapshot-preview-1", PREVIEW_TEXT],
    ["snapshot-history-1", "// A retained attachment snapshot from an earlier turn.\nexport const stable = true;\n"],
    ["snapshot-history-2", "// A second retained literal snapshot.\nexport const checked = true;\n"],
  ]);
  private readonly history: AttachmentHistoryEntry[];
  private readonly savedHistoryPreviews = new Map<string, string>();
  private workspace: WorkspaceStateMessage;
  private attachment: AttachmentStateMessage;
  private session: SessionStateMessage;
  private savedHistory: SavedHistoryStateMessage;
  private sessionOperationToken = 0;
  private historyOperationToken = 0;
  private catalogueFailed = false;
  private disposed = false;
  private streamText = "";
  private streamIndex = 0;
  private streamToken = 0;
  private afterStop: (() => void) | undefined;
  private preparationToken = 0;
  private snapshotSequence = 1;
  private submittedMessages = 0;
  private approvalSequence = 0;
  private reviewCaptured = false;
  private reviewLost = false;
  private interactionSequence = 0;
  private interactions: ExtensionInteractionProjection = { active: null, queuedCount: 0, phase: "idle", errorCode: null, feedback: [], omittedFeedback: 0 };
  private executionProfile: ExecutionProfileProjection = { profile: "controlled", displayName: null, phase: "idle", errorCode: null, canSwitch: true, canEnd: false, canRecover: false };
  private providerConfig: ProviderConfigProjection;

  constructor(readonly scenario: PreviewScenario, private readonly confirmHandoff?: (restoring: boolean) => Promise<HandoffOutcome>, private readonly previewOptions?: PreviewBridgeOptions) {
    bridgeNumber += 1;
    this.viewId = `preview-view-${bridgeNumber}`;
    this.workspace = { ...baseWorkspace(scenario), viewId: this.viewId };
    this.providerConfig = providerConfigFor(previewOptions?.settings);
    if (previewOptions?.resourcesPending) {
      this.workspace = { ...this.workspace, status: "eligible", folder: READY_FOLDER, choice: null, runtime: "not-started", chatModel: null, availableModels: [], thinkingLevel: null, thinkingLevels: [], messages: [] };
    }
    if (previewOptions?.settings === "switching") {
      this.executionProfile = { ...this.executionProfile, phase: "switching", canSwitch: false };
    }
    this.reviewCaptured = scenario === "change-review";
    this.attachment = { ...baseAttachmentState(scenario), viewId: this.viewId };
    this.session = baseSessionState(scenario, this.viewId);
    this.savedHistory = baseSavedHistoryState(this.viewId);
    this.history = scenario === "attachment" || scenario === "source-changed" || scenario === "attachment-unavailable"
      ? [
        historyEntry("submission-preview-1", "snapshot-history-1", "src/preview/earlier.ts"),
        historyEntry("submission-preview-2", "snapshot-history-2", "src/preview/checked.ts"),
      ] : [];
    for (const entry of this.history) {
      const text = this.previews.get(entry.snapshotId);
      if (text !== undefined) entry.utf8Bytes = new TextEncoder().encode(text).byteLength;
    }
    if (scenario === "long-history") {
      for (let index = 0; index < 128; index++) {
        const text = index === 0 ? "// retained history 1\n" + "中🐱".repeat(6000) + "\n" : "// retained history " + (index + 1) + "\n";
        const snapshotId = "snapshot-long-" + (index + 1);
        this.previews.set(snapshotId, text);
        this.history.push({
          submissionId: "submission-long-" + (Math.floor(index / 20) + 1), snapshotId,
          relativePath: "src/preview/history-" + (index + 1) + ".ts",
          ...(index % 2 ? { kind: "selection" as const, originalRange: { start: { line: index, character: 0 }, end: { line: index, character: 4 } }, stale: true } : { kind: "file" as const }),
          utf8Bytes: new TextEncoder().encode(text).byteLength, unsaved: true, delivery: "rpc-accepted", outcome: "settled",
        });
      }
      this.attachment = { ...this.attachment, historyCount: this.history.length,
        retainedBytes: this.history.reduce((bytes, entry) => bytes + entry.utf8Bytes + new TextEncoder().encode(JSON.stringify(entry)).byteLength, 0),
        draft: { ...this.attachment.draft, text: "Keep this current draft while browsing retained history." } };
      this.workspace = { ...this.workspace, messages: Array.from({ length: 32 }, (_, index) => ({ role: index % 2 ? "assistant" as const : "user" as const, text: "Synthetic recent message " + (index + 33) })) };
    }
    if (scenario === "streaming" || scenario === "formatted" || scenario === "activity") this.startStream();
    if (scenario === "approval-queue") this.scheduleApprovalExpiry();
    if (scenario === "loading") this.schedule(() => this.recover(), 900);
  }

  postMessage(message: WebviewMessage): void {
    if (this.disposed) return;
    if (message.type === "ping") {
      this.emit({ version: 3, type: "pong", viewId: this.viewId, generation: this.workspace.generation });
      return;
    }
    if (message.type === "getWorkspaceState") {
      this.emitWorkspace();
      this.emitAttachment();
      this.emitReview();
      this.emitSettings();
      if (this.previewOptions?.locale) this.emit({ version: 3, type: "uiLanguageState", viewId: this.viewId, generation: this.workspace.generation, locale: this.previewOptions.locale });
      this.emitInteractions();
      if (this.scenario === "sessions") {
        this.emitSession();
        this.emitSavedHistory();
      }
      return;
    }
    if (!this.belongsToCurrentView(message)) return;
    if ("draftRevision" in message && message.draftRevision !== this.attachment.draft.revision) {
      this.attachment = { ...this.attachment, result: { code: "stale" } }; this.emitAttachment(); return;
    }
    switch (message.type) {
      case "openSettings": this.previewOptions?.openSettings?.(); return;
      case "setUiLanguage":
        if (this.previewOptions) this.previewOptions.locale = message.locale;
        this.emit({ version: 3, type: "uiLanguageState", viewId: this.viewId, generation: this.workspace.generation, locale: message.locale });
        return;
      case "openFolder":
        this.openFolder();
        break;
      case "manageTrust":
        this.manageTrust();
        break;
      case "chooseResources":
        this.chooseResources(message);
        break;
      case "updateDraft":
        this.updateDraft(message);
        break;
      case "sendChat":
        this.sendChat(message);
        break;
      case "stopChat":
        this.stopChat();
        break;
      case "setChatModel":
        this.setChatModel(message);
        break;
      case "setThinkingLevel":
        this.setThinkingLevel(message);
        break;
      case "decideApproval":
        this.decideApproval(message);
        break;
      case "revokeGrant":
        this.workspace = { ...this.workspace, grants: this.workspace.grants.filter(grant => grant.id !== message.id) };
        this.emitWorkspace();
        break;
      case "answerInteraction":
        this.settleInteraction(message.id, "Synthetic answer recorded.");
        break;
      case "cancelInteraction":
        this.settleInteraction(message.id, "Synthetic request cancelled.");
        break;
      case "chooseExecutionProfile":
        this.executionProfile = { ...this.executionProfile, profile: message.profile, phase: "idle", canSwitch: true };
        this.emitProfile();
        break;
      case "setDefaultThinkingLevel":
        if (message.provider === this.providerConfig.defaultProvider && message.modelId === this.providerConfig.defaultModelId
          && this.providerConfig.thinkingLevels.includes(message.level)) {
          this.providerConfig = { ...this.providerConfig, defaultThinkingLevel: message.level };
          this.emitSettings();
        }
        break;
      case "setDefaultModel":
        this.providerConfig = { ...this.providerConfig, defaultProvider: message.provider, defaultModelId: message.modelId };
        this.emitSettings();
        break;
      case "refreshProviderConfig":
        if (this.providerConfig.busy) break;
        this.providerConfig = { ...this.providerConfig, busy: true };
        this.emitSettings();
        this.schedule(() => {
          this.providerConfig = { ...this.providerConfig, busy: false };
          this.emitSettings();
        }, 400);
        break;
      case "openProviderOAuth":
        this.providerConfig = {
          ...this.providerConfig,
          providers: this.providerConfig.providers.map(provider => provider.providerId === message.providerId
            ? { ...provider, configured: true, authLabel: "subscription", canLogout: true }
            : provider),
        };
        this.emitSettings();
        break;
      case "addCustomEndpoint":
        this.providerConfig = {
          ...this.providerConfig,
          providers: [...this.providerConfig.providers, {
            providerId: "custom-endpoint", displayName: message.displayName, configured: true, authLabel: "stored",
            canAddApiKey: true, canLogout: true, canSignIn: false, canRemoveEndpoint: true,
          }],
        };
        this.emitSettings();
        break;
      case "removeCustomEndpoint":
        this.providerConfig = {
          ...this.providerConfig,
          providers: this.providerConfig.providers.filter(provider => provider.providerId !== message.providerId),
        };
        this.emitSettings();
        break;
      case "openProviderApiKey":
        this.providerConfig = {
          ...this.providerConfig,
          providers: this.providerConfig.providers.map(provider => provider.providerId === message.providerId
            ? { ...provider, configured: true, authLabel: "stored", canLogout: true }
            : provider),
        };
        this.emitSettings();
        break;
      case "logoutProvider":
        this.providerConfig = {
          ...this.providerConfig,
          defaultProvider: this.providerConfig.defaultProvider === message.providerId ? null : this.providerConfig.defaultProvider,
          defaultModelId: this.providerConfig.defaultProvider === message.providerId ? null : this.providerConfig.defaultModelId,
          providers: this.providerConfig.providers.map(provider => provider.providerId === message.providerId
            ? { ...provider, configured: false, authLabel: null, canLogout: false }
            : provider),
        };
        this.emitSettings();
        break;
      case "endOwnedRuntime":
      case "recoverControlledRuntime":
        this.executionProfile = { profile: "controlled", displayName: null, phase: "idle", errorCode: null, canSwitch: true, canEnd: false, canRecover: false };
        this.emitProfile();
        break;
      case "addFileAttachment":
        this.addAttachment("file");
        break;
      case "addSelectionAttachment":
        this.addAttachment("selection");
        break;
      case "confirmFileAttachment":
      case "confirmSelectionAttachment":
        this.confirmAttachment(message);
        break;
      case "removeAttachment":
        this.removeAttachment(message);
        break;
      case "getChangeReview":
        this.emitReview();
        break;
      case "openReviewDiff":
      case "openReviewSource":
        this.emitReview("unavailable"); // Browser fixture has no native editor or filesystem authority.
        break;
      case "getAttachmentHistory":
        this.emit({ version: 3, type: "attachmentHistory", viewId: this.viewId, generation: this.workspace.generation, entries: this.history });
        break;
      case "getAttachmentPreview":
        this.sendPreview(message);
        break;
      case "getSavedSessions":
        this.getSavedSessions(message);
        break;
      case "newConversation":
        this.beginSessionSwitch();
        break;
      case "resumeConversation":
        this.beginSessionSwitch(message.id);
        break;
      case "getSavedHistory":
        this.getSavedHistory(message);
        break;
      case "getSavedHistoryPreview":
        this.sendSavedHistoryPreview(message);
        break;
      default:
        break;
    }
  }

  subscribe(listener: (message: unknown) => void): () => void {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Developer controls inject deterministic projections, never actual editor/tool effects. */
  completeReview(): void {
    if (this.disposed) return;
    this.reviewCaptured = true; this.reviewLost = false; this.emitReview();
  }

  loseReview(): void {
    if (this.disposed) return;
    this.reviewCaptured = false; this.reviewLost = true; this.emitReview("unavailable");
  }

  queueApprovals(): void {
    if (this.disposed || this.workspace.runtime !== "ready" || this.workspace.execution === "stopping" || this.workspace.approvals.length) return;
    this.clearTimers(this.streamTimers);
    this.streamToken++; // A replaced pending queue also revokes its old delayed continuation.
    this.approvalSequence++;
    const approvals = baseWorkspace("approval-queue").approvals.map((card, index) => ({ ...card,
      id: `approval-synthetic-${this.approvalSequence}-${index + 1}`, toolCallId: `tool-synthetic-${this.approvalSequence}-${index + 1}` }));
    this.workspace = { ...this.workspace, chatBusy: true, execution: "awaiting-approval", approvals };
    this.scheduleApprovalExpiry(); this.emitWorkspace();
  }

  /** Synthetic extension request: one active form, one queued behind it, one warning feedback entry. */
  simulateInteraction(): void {
    if (this.disposed || this.workspace.runtime !== "ready") return;
    const sequence = ++this.interactionSequence;
    this.interactions = {
      active: {
        id: `interaction-preview-${sequence}`,
        method: "select",
        title: "Choose how the synthetic extension should continue",
        origin: "trusted runtime extension; not authenticated",
        options: [
          { id: "once", label: "Run the synthetic step once" },
          { id: "skip", label: "Skip it for this task" },
        ],
      },
      queuedCount: 1,
      phase: "waiting",
      errorCode: null,
      feedback: [{ id: `feedback-preview-${sequence}`, kind: "notify", level: "warning", text: "Synthetic extension warning: an earlier step's output was truncated." }],
      omittedFeedback: 0,
    };
    this.emitInteractions();
  }

  /** Synthetic recovery banner: no real runtime is ended or recovered in the preview. */
  simulateRecoveryRequired(): void {
    if (this.disposed) return;
    this.executionProfile = { ...this.executionProfile, phase: "recovery-required", errorCode: "stop-unconfirmed", canSwitch: false, canEnd: true, canRecover: true };
    this.emitProfile();
  }

  private settleInteraction(id: string, note: string): void {
    const active = this.interactions.active;
    if (!active || active.id !== id) return;
    const hadQueued = this.interactions.queuedCount > 0;
    this.interactions = {
      ...this.interactions,
      active: hadQueued
        ? { id: `interaction-preview-queued-${++this.interactionSequence}`, method: "confirm", title: "Queued synthetic follow-up", message: "This request was queued behind the one just settled.", origin: "trusted runtime extension; not authenticated" }
        : null,
      queuedCount: hadQueued ? this.interactions.queuedCount - 1 : 0,
      phase: hadQueued ? "waiting" : "idle",
      feedback: [...this.interactions.feedback, { id: `feedback-settled-${active.id}`, kind: "status" as const, level: "info" as const, text: note }].slice(-8),
    };
    this.emitInteractions();
  }

  private scheduleApprovalExpiry(): void {
    const generation = this.workspace.generation;
    for (const card of this.workspace.approvals) this.schedule(() => {
      if (generation !== this.workspace.generation || !this.workspace.approvals.some(item => item.id === card.id)) return;
      this.workspace = { ...this.workspace, approvals: this.workspace.approvals.filter(item => item.id !== card.id),
        ...(this.workspace.approvals.length === 1 ? { chatBusy: false, execution: "failed", chatError: "The simulated approval expired. No action was allowed." } : {}) };
      this.emitWorkspace();
      if (!this.workspace.approvals.length) this.settleSubmission("failed");
    }, Math.max(0, card.expiresAt - Date.now()));
  }

  /** A synthetic editor edit: no native document, filesystem or automatic save. */
  changeSources(): void {
    if (this.disposed || !this.attachment.draft.attachments.length) return;
    const interrupted = this.attachment.preparation !== "idle";
    if (interrupted) this.preparationToken++;
    this.attachment = { ...this.attachment, preparation: "idle", result: { code: "source-changed" }, draft: { ...this.attachment.draft, revision: this.attachment.draft.revision + (interrupted ? 1 : 0), attachments: this.attachment.draft.attachments.map(a => a.kind === "selection" ? { ...a, state: "changed", stale: true } : { ...a, state: "changed" }) } };
    this.emitAttachment();
  }

  /** Developer-only recovery fixture, not a Webview or native-host capability. */
  recover(): void {
    if (this.disposed) return;
    // Recovery abandons a handoff, not read-only requests for the unchanged identity.
    if (this.session.phase === "confirming" || this.session.phase === "switching") {
      this.sessionOperationToken++;
      this.session = { ...this.session, phase: "idle", error: "cancelled" };
      this.emitSession();
    }
    this.afterStop = undefined;
    this.clearTimers(this.timers);
    this.clearTimers(this.streamTimers);
    this.streamToken++;
    this.preparationToken++;
    this.workspace = { ...baseWorkspace("empty"), viewId: this.viewId, generation: this.workspace.generation, messages: this.workspace.messages };
    this.attachment = { ...this.attachment, preparation: "idle", result: null };
    this.interactions = { active: null, queuedCount: 0, phase: "idle", errorCode: null, feedback: [], omittedFeedback: 0 };
    this.executionProfile = { profile: "controlled", displayName: null, phase: "idle", errorCode: null, canSwitch: true, canEnd: false, canRecover: false };
    this.emitWorkspace();
    this.emitAttachment();
    this.emitInteractions();
    this.emitProfile();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.afterStop = undefined;
    this.clearTimers(this.timers);
    this.clearTimers(this.sessionTimers);
    this.clearTimers(this.streamTimers);
    this.listeners.clear();
  }

  private belongsToCurrentView(message: InboundAction): boolean {
    return "generation" in message && "viewId" in message
      && message.generation === this.workspace.generation && message.viewId === this.viewId;
  }

  /** Synthetic settings so the dialog can be reviewed; no credential or host state exists in the preview. */
  private emitSettings(): void {
    this.emitProfile();
    this.emit({ version: 3, type: "providerConfigState", viewId: this.viewId, generation: this.workspace.generation, ...this.providerConfig });
  }

  private emitInteractions(): void {
    this.emit({ version: 3, type: "interactionState", viewId: this.viewId, generation: this.workspace.generation, ...this.interactions });
  }

  private emitProfile(): void {
    this.emit({ version: 3, type: "executionProfileState", viewId: this.viewId, generation: this.workspace.generation, ...this.executionProfile });
  }

  private emit(message: HostMessage): void {
    if (this.disposed) return;
    for (const listener of [...this.listeners]) listener(message);
  }

  private emitReview(error: ChangeReviewStateMessage["error"] = null): void {
    const entries: ChangeReviewStateMessage["entries"] = this.reviewCaptured ? Array.from({ length: 33 }, (_, index) => ({
      id: "review-preview-" + index, taskId: "task-preview-" + Math.floor(index / 8),
      path: index === 2 ? null : "src/preview/" + (index === 0 ? "long-path-".repeat(12) : "changed-") + index + ".ts",
      source: index % 3 === 1 ? "observed" as const : "tool" as const,
      tool: index % 3 === 1 ? null : "write" as const,
      status: index % 3 === 1 ? "observed" as const : index === 2 ? "failed" as const : "complete" as const,
      diff: index % 3 === 1 || index === 2 ? "unavailable" as const : "ready" as const,
      reason: index === 2 ? "sensitive-source" as const : index % 3 === 1 ? "no-before-snapshot" as const : null,
      sourceChanged: index === 0, overlap: index === 3,
    })) : [];
    this.emit({ version: 3, type: "changeReviewState", viewId: this.viewId, generation: this.workspace.generation,
      entries, retainedBytes: entries.length ? 2048 : 0, limited: false, reset: this.reviewLost, error: this.reviewLost ? "unavailable" : error });
  }

  private emitWorkspace(): void {
    this.emit({ ...this.workspace, viewId: this.viewId });
  }

  private emitAttachment(): void {
    this.emit({ ...this.attachment, viewId: this.viewId });
  }

  private emitSession(): void {
    const title = this.previewOptions?.title;
    this.emit({ ...this.session, viewId: this.viewId,
      ...(title ? {
        current: this.session.current ? { ...this.session.current, name: title } : null,
        entries: this.previewOptions?.loading ? [] : this.session.entries.map((entry, index) => ({ ...entry, title: index === 0 ? title : entry.title })),
        ...(this.previewOptions?.loading ? { phase: "listing" as const, loaded: false } : {}),
      } : {}),
    });
  }

  private emitSavedHistory(): void {
    this.emit({ ...this.savedHistory, viewId: this.viewId });
  }

  private schedule(task: () => void, delay: number, bucket = this.timers): void {
    const timer = setTimeout(() => {
      bucket.delete(timer);
      if (!this.disposed) task();
    }, delay);
    bucket.add(timer);
  }

  private clearTimers(bucket: Set<Timer>): void {
    for (const timer of bucket) clearTimeout(timer);
    bucket.clear();
  }

  private getSavedSessions(message: Extract<WebviewMessage, { type: "getSavedSessions" | "getSavedHistory" }>): void {
    const entries = this.scenario === "sessions-empty" ? [] : SYNTHETIC_SESSION_ENTRIES;
    const lastPage = Math.max(0, Math.ceil(entries.length / SESSION_PAGE_SIZE) - 1);
    if (!Number.isSafeInteger(message.page) || message.page < 0 || message.page > lastPage) return;
    const token = ++this.sessionOperationToken;
    const generation = this.workspace.generation;
    this.session = { ...this.session, phase: "listing", error: null };
    this.emitSession();
    this.schedule(() => {
      if (token !== this.sessionOperationToken || generation !== this.workspace.generation) return;
      if (this.scenario === "sessions-error" && !this.catalogueFailed) {
        this.catalogueFailed = true;
        this.session = { ...this.session, phase: "error", error: "unavailable" };
        this.emitSession();
        return;
      }
      const start = message.page * SESSION_PAGE_SIZE;
      this.session = {
        ...this.session,
        phase: "idle",
        loaded: true,
        entries: entries.slice(start, start + SESSION_PAGE_SIZE),
        page: message.page,
        total: entries.length,
        error: null,
      };
      this.emitSession();
    }, SESSION_LIST_DELAY, this.sessionTimers);
  }

  private beginSessionSwitch(id?: string): void {
    if (this.session.phase === "confirming" || this.session.phase === "switching") return;
    const target = id === undefined ? null : SYNTHETIC_SESSION_ENTRIES.find(entry => entry.id === id);
    if (id !== undefined && !target) {
      this.session = { ...this.session, phase: "error", error: "stale" };
      this.emitSession();
      return;
    }
    let revision = this.attachment.draft.revision;
    const token = ++this.sessionOperationToken;
    this.session = { ...this.session, phase: "confirming", error: null };
    this.emitSession();
    const generation = this.workspace.generation;
    const current = () => !this.disposed && token === this.sessionOperationToken && generation === this.workspace.generation;
    const finish = () => {
      if (!current()) return;
      if (revision !== this.attachment.draft.revision) {
        this.session = { ...this.session, phase: "idle", error: "cancelled" }; this.emitSession();
        if (!this.workspace.chatBusy && this.workspace.execution !== "stopping") this.applyPendingSettings();
        return;
      }
      this.commitSessionSwitch(target ?? null);
    };
    const commit = () => {
      if (revision !== this.attachment.draft.revision) { finish(); return; }
      if (this.confirmHandoff && (this.workspace.chatBusy || this.workspace.execution === "stopping" || this.attachment.preparation !== "idle")) {
        this.session = { ...this.session, phase: "switching" }; this.emitSession();
        // Adopt only Stop's own preparation-cancellation bump, never a later user edit.
        if (this.attachment.preparation !== "idle") revision += 1;
        this.stopChat(finish);
      } else this.schedule(() => {
        if (current() && this.session.phase === "confirming") finish();
      }, SESSION_HANDOFF_DELAY, this.sessionTimers);
    };
    if (!this.confirmHandoff) commit();
    else void this.confirmHandoff(id !== undefined).then(result => {
      if (!current()) return;
      if (result === "confirm") commit();
      else { this.session = { ...this.session, phase: result === "cancel" ? "idle" : "error", error: result === "cancel" ? null : result }; this.emitSession(); }
    }).catch(() => {
      if (!current()) return;
      this.session = { ...this.session, phase: "error", error: "unavailable" }; this.emitSession();
    });
  }

  private commitSessionSwitch(target: SessionEntry | null): void {
    this.clearTimers(this.sessionTimers);
    this.clearTimers(this.timers);
    this.clearTimers(this.streamTimers);
    this.streamToken += 1;
    this.preparationToken += 1;
    const generation = this.workspace.generation + 1;
    const current = target ? { id: target.id, name: target.title } : null;
    const page = this.session.loaded ? this.session.page : 0;
    const entries = this.session.loaded
      ? this.session.entries
      : SYNTHETIC_SESSION_ENTRIES.slice(0, SESSION_PAGE_SIZE);

    // The client commits draft loss only from this real protocol switching envelope.
    this.session = { ...this.session, generation, phase: "switching", current, loaded: true, entries, page, total: SYNTHETIC_SESSION_ENTRIES.length, error: null };
    this.emitSession();

    this.workspace = {
      ...this.workspace,
      generation,
      messages: [],
      chatBusy: false,
      chatError: null,
      activities: [],
      approvals: [],
      grants: [],
      execution: "idle",
      pendingModel: null,
      pendingThinkingLevel: null,
      modelBusy: false,
      modelError: null,
    };
    this.attachment = {
      ...this.attachment,
      generation,
      draft: { revision: this.attachment.draft.revision + 1, text: "", acceptedEditSequence: 0, attachments: [] },
      preparation: "idle",
      result: null,
      historyCount: 0,
      retainedBytes: 0,
      lastSubmission: null,
    };
    this.reviewCaptured = false; this.reviewLost = false;
    this.savedHistoryPreviews.clear();
    if (target) {
      for (let index = 1; index <= SYNTHETIC_HISTORY_COUNT; index++) {
        const text = syntheticHistoryText(`synthetic-history-${index}`);
        if (text !== undefined) this.savedHistoryPreviews.set(`synthetic-history-${index}`, text);
      }
    }
    this.savedHistory = target
      ? { ...baseSavedHistoryState(this.viewId, generation), available: true, messages: syntheticHistoryMessages(0), page: 0, total: SYNTHETIC_HISTORY_COUNT }
      : baseSavedHistoryState(this.viewId, generation);
    this.session = { ...this.session, phase: "idle" };
    this.emitWorkspace();
    this.emitAttachment();
    this.emitSession();
    this.emitSavedHistory();
    this.emitReview();
  }

  private getSavedHistory(message: Extract<WebviewMessage, { type: "getSavedSessions" | "getSavedHistory" }>): void {
    if (!this.savedHistory.available) return;
    const lastPage = Math.max(0, Math.ceil(SYNTHETIC_HISTORY_COUNT / SAVED_HISTORY_PAGE_SIZE) - 1);
    if (!Number.isSafeInteger(message.page) || message.page < 0 || message.page > lastPage) return;
    const token = ++this.historyOperationToken;
    const generation = this.workspace.generation;
    this.savedHistory = { ...this.savedHistory, phase: "loading", page: message.page, error: null };
    this.emitSavedHistory();
    this.schedule(() => {
      if (token !== this.historyOperationToken || generation !== this.workspace.generation || !this.savedHistory.available) return;
      this.savedHistory = { ...this.savedHistory, phase: "idle", messages: syntheticHistoryMessages(message.page), page: message.page, total: SYNTHETIC_HISTORY_COUNT, error: null };
      this.emitSavedHistory();
    }, SAVED_HISTORY_DELAY, this.sessionTimers);
  }

  private sendSavedHistoryPreview(message: Extract<WebviewMessage, { type: "getSavedHistoryPreview" }>): void {
    if (!this.savedHistory.available || this.savedHistory.phase !== "idle"
      || !this.savedHistory.messages.some(line => line.id === message.id)) return;
    const text = this.savedHistoryPreviews.get(message.id);
    if (text === undefined || message.offset > text.length) {
      this.schedule(() => this.emit({ version: 3, type: "savedHistoryPreview", viewId: this.viewId, generation: this.workspace.generation, id: message.id, requestId: message.requestId, code: "unavailable" }), 0);
      return;
    }
    const nextOffset = Math.min(message.offset + SAVED_HISTORY_PREVIEW_CHUNK_SIZE, text.length);
    const chunk: SavedHistoryPreviewMessage = {
      version: 3,
      type: "savedHistoryPreview",
      viewId: this.viewId,
      generation: this.workspace.generation,
      id: message.id,
      requestId: message.requestId,
      text: text.slice(message.offset, nextOffset),
      offset: message.offset,
      nextOffset,
      done: nextOffset === text.length,
      totalChars: text.length,
    };
    this.schedule(() => this.emit(chunk), SAVED_HISTORY_DELAY, this.sessionTimers);
  }

  private openFolder(): void {
    if (this.workspace.status !== "no-folder") return;
    this.workspace = {
      ...this.workspace,
      status: "eligible",
      folder: READY_FOLDER,
      error: null,
      runtimeDetail: null,
    };
    this.emitWorkspace();
  }

  private manageTrust(): void {
    if (this.workspace.status !== "untrusted") return;
    this.workspace = { ...this.workspace, status: "eligible", error: null, runtimeDetail: null };
    this.emitWorkspace();
  }

  private chooseResources(message: Extract<WebviewMessage, { type: "chooseResources" }>): void {
    if (this.workspace.status !== "eligible") return;
    this.workspace = {
      ...this.workspace,
      choice: message.choice,
      runtime: "ready",
      chatModel: "Claude Sonnet",
      thinkingLevel: "medium",
      thinkingLevels: [...THINKING_LEVELS],
      availableModels: cloneModels(),
      messages: [{ role: "assistant", id: "message-ready-1", text: "Resources are ready. What should we work on?" }],
    };
    this.emitWorkspace();
  }

  private updateDraft(message: Extract<WebviewMessage, { type: "updateDraft" }>): void {
    if (message.draftRevision !== this.attachment.draft.revision
      || message.editSequence <= this.attachment.draft.acceptedEditSequence) return;
    this.preparationToken++;
    this.attachment = {
      ...this.attachment,
      draft: {
        ...this.attachment.draft,
        revision: this.attachment.draft.revision + 1,
        text: message.text,
        acceptedEditSequence: message.editSequence,
      },
      preparation: "idle",
      result: null,
    };
    this.emitAttachment();
  }

  private sendChat(message: WebviewMessage & { type: "sendChat" | "addFileAttachment" }): void {
    if (message.draftRevision !== this.attachment.draft.revision) {
      this.attachment = { ...this.attachment, result: { code: "stale" } };
      this.emitAttachment();
      return;
    }
    if (this.workspace.runtime !== "ready" || this.workspace.chatBusy || this.attachment.preparation !== "idle") return;
    if (!this.workspace.chatModel) {
      this.workspace = { ...this.workspace, chatError: "No configured model is available in this preview state." };
      this.attachment = { ...this.attachment, result: { code: "unavailable" } };
      this.emitWorkspace();
      this.emitAttachment();
      return;
    }
    if (!this.attachment.draft.text.trim()) {
      this.workspace = { ...this.workspace, chatError: "Enter a message before sending." };
      this.emitWorkspace();
      return;
    }
    const attachments = this.attachment.draft.attachments;
    if (attachments.some(a => a.state === "changed")) {
      const candidates = attachments.map(attachment => {
        if (attachment.state !== "changed") return attachment;
        if (attachment.kind === "selection") return { ...attachment, state: "confirmation-required" as const };
        const text = (this.previews.get(attachment.snapshotId) ?? PREVIEW_TEXT) + "\n// Updated synthetic source.";
        const snapshotId = "snapshot-preview-" + (++this.snapshotSequence);
        this.previews.set(snapshotId, text);
        return { ...attachment, state: "confirmation-required" as const, snapshotId, utf8Bytes: new TextEncoder().encode(text).byteLength };
      });
      this.attachment = { ...this.attachment, draft: { ...this.attachment.draft, revision: this.attachment.draft.revision + 1, attachments: candidates }, result: { code: "source-changed" } };
      this.emitAttachment(); return;
    }
    if (attachments.some(a => a.state === "confirmation-required" || a.state === "unavailable")) return;
    if (this.history.length + attachments.length > 128) {
      this.attachment = { ...this.attachment, result: { code: "history-full" } };
      this.emitAttachment(); return;
    }
    if (this.scenario === "attachment-uncertain") {
      this.admitSubmission("write-failed");
      this.workspace = { ...this.workspace, modelBusy: true, chatError: "Delivery uncertain. No retry was made. Reset the preview before retrying." };
      this.emitWorkspace(); return;
    }
    this.admitSubmission();
    if (this.scenario === "approval") { this.startApproval(); return; }
    this.startStream();
  }

  private admitSubmission(delivery = "rpc-accepted"): void {
    const draft = this.attachment.draft;
    this.workspace = { ...this.workspace, messages: [...this.workspace.messages, { role: "user" as const, id: `message-user-preview-${++this.submittedMessages}`, text: draft.text }].slice(-32) };
    const submissionId = `submission-preview-${this.history.length + 3}`;
    for (const attached of draft.attachments) {
      this.history.push({
        submissionId,
        snapshotId: attached.snapshotId,
        relativePath: attached.relativePath,
        ...(attached.kind === "selection" ? { kind: "selection", originalRange: attached.originalRange, stale: attached.stale } as const : { kind: "file" } as const),
        utf8Bytes: attached.utf8Bytes,
        unsaved: attached.unsaved,
        delivery,
        outcome: delivery === "write-failed" ? "uncertain" : "pending",
      });
    }
    this.attachment = {
      ...this.attachment,
      draft: { ...draft, revision: draft.revision + 1, text: "", attachments: [] },
      historyCount: this.history.length,
      retainedBytes: this.history.length ? 442 : this.attachment.retainedBytes,
      lastSubmission: {
        submissionId,
        draftRevision: draft.revision,
        delivery,
        outcome: delivery === "write-failed" ? "uncertain" : "pending",
      },
      result: delivery === "write-failed" ? { code: "write-failed" } : null,
    };
    this.emitAttachment();
  }

  private startStream(): void {
    this.clearTimers(this.streamTimers);
    const streamToken = ++this.streamToken;
    this.streamText = "";
    this.streamIndex = 0;
    const messages = [...this.workspace.messages];
    if (this.scenario !== "activity") messages.push({ role: "assistant", id: `message-assistant-stream-${this.streamToken}`, text: "" });
    this.workspace = {
      ...this.workspace,
      messages: messages.slice(-32),
      chatBusy: true,
      chatError: null,
      execution: "thinking",
      approvals: [],
      activities: [...this.workspace.activities.filter(item => messages.slice(-32).some(message => message.id === item.messageId)), {
        id: `activity-thinking-${streamToken}`,
        kind: "thinking",
        messageId: `message-assistant-stream-${this.streamToken}`,
        text: this.scenario === "activity" ? ACTIVITY_THINKING : "Reviewing the request...",
        status: "thinking",
        truncated: false,
      }],
    };
    this.emitWorkspace();
    this.schedule(() => {
      if (streamToken === this.streamToken) this.streamNext(streamToken);
    }, 360, this.streamTimers);
  }

  private streamNext(streamToken: number): void {
    if (!this.workspace.chatBusy || streamToken !== this.streamToken) return;
    const chunks = this.scenario === "formatted" ? FORMATTED_STREAM_CHUNKS : this.scenario === "activity" ? ACTIVITY_STREAM_CHUNKS : STREAM_CHUNKS;
    if (this.streamIndex >= chunks.length) {
      this.finishStream();
      return;
    }
    this.streamText += chunks[this.streamIndex];
    this.streamIndex += 1;
    const messages = this.workspace.messages.map(message => message.id === `message-assistant-stream-${this.streamToken}`
      ? { ...message, text: this.streamText }
      : message);
    if (!messages.some(message => message.id === `message-assistant-stream-${this.streamToken}`)) messages.push({ role: "assistant", id: `message-assistant-stream-${this.streamToken}`, text: this.streamText });
    const boundedMessages = messages.slice(-32);
    const currentActivities = this.workspace.activities.filter(item => item.messageId === `message-assistant-stream-${streamToken}`);
    const previousActivities = this.workspace.activities.filter(item => item.messageId !== `message-assistant-stream-${streamToken}` && boundedMessages.some(message => message.id === item.messageId));
    const activities = this.streamIndex > 1 ? [
      ...currentActivities.filter(item => item.kind === "thinking").map(item => ({ ...item, status: "complete" as const })),
      {
        id: `activity-tool-${streamToken}`,
        kind: "tool" as const,
        messageId: `message-assistant-stream-${this.streamToken}`,
        toolCallId: "tool-call-stream-1",
        tool: "read",
        text: this.streamIndex >= chunks.length ? this.scenario === "activity" ? "Preview tool failed. <script>inert output</script>" : "Read the preview fixture." : "Reading the preview fixture...",
        input: '{"path":"src/preview/example.ts"}',
        status: this.streamIndex >= chunks.length ? this.scenario === "activity" ? "failed" as const : "complete" as const : "executing" as const,
        truncated: this.scenario === "activity" && this.streamIndex >= chunks.length,
      },
    ] : currentActivities;
    this.workspace = { ...this.workspace, messages: boundedMessages, activities: [...previousActivities, ...activities], execution: this.streamIndex >= chunks.length ? "replying" : "thinking" };
    this.emitWorkspace();
    this.schedule(() => {
      if (streamToken === this.streamToken) this.streamNext(streamToken);
    }, 420, this.streamTimers);
  }

  private settleSubmission(outcome: "settled" | "interrupted" | "failed"): void {
    const submission = this.attachment.lastSubmission;
    if (!submission || submission.outcome !== "pending") return;
    for (const entry of this.history) if (entry.submissionId === submission.submissionId) entry.outcome = outcome;
    this.attachment = { ...this.attachment, lastSubmission: { ...submission, outcome } };
    this.emitAttachment();
  }

  private finishStream(): void {
    this.settleSubmission(this.scenario === "activity" ? "failed" : "settled");
    this.clearTimers(this.streamTimers);
    this.workspace = { ...this.workspace, chatBusy: false, execution: this.scenario === "activity" ? "failed" : "completed", chatError: this.scenario === "activity" ? "Preview tool failed. Output was truncated; this is not a complete result." : null };
    this.emitWorkspace();
    if (this.workspace.pendingModel || this.workspace.pendingThinkingLevel) this.applyPendingSettings();
  }

  private startApproval(): void {
    this.workspace = {
      ...this.workspace,
      chatError: null,
      chatBusy: true,
      execution: "awaiting-approval",
      approvals: [{
        id: "approval-preview-1",
        toolCallId: "tool-call-preview-1",
        tool: "read",
        input: '{"path":"src/preview/example.ts"}',
        scope: '["read","/workspace/pi-vscode/src/preview/example.ts"]',
        expiresAt: Date.now() + 120000,
      }],
      activities: [{
        id: "activity-tool-1",
        kind: "tool",
        messageId: "message-assistant-approval",
        toolCallId: "tool-call-preview-1",
        tool: "read",
        text: "Waiting for permission to inspect the selected file.",
        input: '{"path":"src/preview/example.ts"}',
        status: "preparing",
        truncated: false,
      }],
    };
    this.emitWorkspace();
  }

  private decideApproval(message: Extract<WebviewMessage, { type: "decideApproval" }>): void {
    const card = this.workspace.approvals.find(approval => approval.id === message.id);
    if (!card || card.expiresAt <= Date.now() || this.workspace.execution === "stopping"
      || (message.decision === "session" && card.scope === null)) return;
    const approvals = this.workspace.approvals.filter(item => item.id !== card.id);
    const grants = message.decision === "session" && card.scope !== null
      ? [...this.workspace.grants, { id: "grant-" + card.id, scope: card.scope }]
      : this.workspace.grants;
    if (approvals.length) {
      this.workspace = { ...this.workspace, approvals, grants, execution: "awaiting-approval" };
      this.emitWorkspace();
      return;
    }
    if (message.decision === "deny") {
      this.workspace = { ...this.workspace, approvals, grants, chatBusy: false, execution: "failed", chatError: "The requested action was declined." };
      this.emitWorkspace();
      // This deterministic fixture ends its task on final Deny; real pi may continue after refusal.
      this.settleSubmission("interrupted");
      return;
    }
    this.workspace = { ...this.workspace, approvals, grants, execution: "executing" };
    this.emitWorkspace();
    const actionToken = this.streamToken;
    this.schedule(() => {
      if (actionToken === this.streamToken) this.startStream();
    }, 360);
  }

  private stopChat(afterSettlement?: () => void): void {
    if (this.workspace.execution === "stopping") {
      if (afterSettlement) this.afterStop = afterSettlement;
      return;
    }
    this.afterStop = afterSettlement;
    if (!this.workspace.chatBusy && this.attachment.preparation === "idle") return;
    this.clearTimers(this.timers);
    this.clearTimers(this.streamTimers);
    this.streamToken += 1;
    this.preparationToken += 1;
    // Preserve a reply that stopped before its first text delta; activity still belongs to that message.
    const messages = [...this.workspace.messages];
    for (const { messageId } of this.workspace.activities) {
      if (!messages.some(message => message.id === messageId)) messages.push({ id: messageId, role: "assistant", text: "" });
    }
    const retainedMessages = messages.slice(-32);
    this.workspace = {
      ...this.workspace,
      messages: retainedMessages,
      activities: this.workspace.activities.filter(item => retainedMessages.some(message => message.id === item.messageId)),
      chatBusy: false,
      execution: "stopping",
      approvals: [],
      chatError: null,
    };
    this.attachment = { ...this.attachment, result: this.attachment.preparation === "idle" ? this.attachment.result : { code: "preparation-cancelled" }, draft: { ...this.attachment.draft, revision: this.attachment.draft.revision + (this.attachment.preparation === "idle" ? 0 : 1) }, preparation: "idle" };
    this.emitWorkspace();
    this.emitAttachment();
    this.schedule(() => {
      this.workspace = {
        ...this.workspace,
        execution: "stopped",
        chatError: "Task stopped. Completed side effects remain unchanged.",
        activities: this.workspace.activities.map(item => item.status === "thinking" || item.status === "preparing" || item.status === "executing" ? { ...item, status: "interrupted" } : item),
      };
      this.emitWorkspace();
      this.settleSubmission("interrupted");
      const settled = this.afterStop; this.afterStop = undefined;
      if (settled) settled();
      else this.applyPendingSettings();
    }, 420);
  }

  private setChatModel(message: Extract<WebviewMessage, { type: "setChatModel" }>): void {
    const model = modelFor(message.provider, message.modelId);
    if (!model || this.workspace.modelBusy || !this.workspace.availableModels.length) return;
    if (this.workspace.chatBusy) {
      this.workspace = { ...this.workspace, pendingModel: { ...model }, modelError: null };
      this.emitWorkspace();
      return;
    }
    this.workspace = { ...this.workspace, pendingModel: { ...model }, modelBusy: true, modelError: null };
    this.emitWorkspace();
    this.schedule(() => {
      this.workspace = { ...this.workspace, chatModel: model.label, pendingModel: null, modelBusy: false };
      this.emitWorkspace();
    }, 420);
  }

  private setThinkingLevel(message: Extract<WebviewMessage, { type: "setThinkingLevel" }>): void {
    if (!THINKING_LEVELS.includes(message.level) || this.workspace.modelBusy || !this.workspace.thinkingLevels.length) return;
    if (this.workspace.chatBusy) {
      this.workspace = { ...this.workspace, pendingThinkingLevel: message.level, modelError: null };
      this.emitWorkspace();
      return;
    }
    this.workspace = { ...this.workspace, pendingThinkingLevel: message.level, modelBusy: true, modelError: null };
    this.emitWorkspace();
    this.schedule(() => {
      this.workspace = { ...this.workspace, thinkingLevel: message.level, pendingThinkingLevel: null, modelBusy: false };
      this.emitWorkspace();
    }, 420);
  }

  private applyPendingSettings(): void {
    if (this.workspace.modelBusy || (!this.workspace.pendingModel && !this.workspace.pendingThinkingLevel)) return;
    const pendingModel = this.workspace.pendingModel;
    const pendingThinking = this.workspace.pendingThinkingLevel;
    this.workspace = { ...this.workspace, modelBusy: true };
    this.emitWorkspace();
    this.schedule(() => {
      this.workspace = {
        ...this.workspace,
        chatModel: pendingModel?.label ?? this.workspace.chatModel,
        pendingModel: null,
        thinkingLevel: pendingThinking ?? this.workspace.thinkingLevel,
        pendingThinkingLevel: null,
        modelBusy: false,
      };
      this.emitWorkspace();
    }, 520);
  }

  private addAttachment(kind: "file" | "selection"): void {
    if (this.workspace.runtime !== "ready" || this.workspace.chatBusy || this.attachment.preparation !== "idle" || this.attachment.draft.attachments.length >= 20) return;
    const preparationToken = ++this.preparationToken;
    this.attachment = { ...this.attachment, preparation: "preparing", result: null };
    this.emitAttachment();
    this.schedule(() => {
      if (preparationToken !== this.preparationToken) return;
      if (this.scenario === "attachment-capacity") { this.attachment = { ...this.attachment, preparation: "idle", result: { code: "total-too-large" } }; this.emitAttachment(); return; }
      if (this.scenario === "attachment-failure") { this.attachment = { ...this.attachment, preparation: "idle", result: { code: "unavailable" } }; this.emitAttachment(); return; }
      const sequence = ++this.snapshotSequence;
      const snapshotId = `snapshot-preview-${sequence}`;
      const text = kind === "selection" ? SELECTION_TEXT : this.scenario === "attachment-layout" ? LITERAL_ATTACHMENT_TEXT : PREVIEW_TEXT;
      this.previews.set(snapshotId, text);
      const details = kind === "selection" ? { kind, originalRange: { start: { line: 2, character: 2 }, end: { line: 2, character: 2 + SELECTION_TEXT.length } }, stale: this.scenario === "source-changed" } : { kind };
      const attachment: DraftAttachment = { ...draftAttachment(this.scenario === "source-changed" ? "changed" : "attached"), ...details, ...(this.scenario === "attachment-layout" ? { relativePath: LAYOUT_PATH } : {}), attachmentId: `attachment-preview-${sequence}`, snapshotId, utf8Bytes: new TextEncoder().encode(text).byteLength };
      this.attachment = {
        ...this.attachment,
        preparation: "idle",
        draft: { ...this.attachment.draft, revision: this.attachment.draft.revision + 1, attachments: [...this.attachment.draft.attachments, attachment] },
        historyCount: this.history.length,
        retainedBytes: 442,
      };
      this.emitAttachment();
    }, 420);
  }

  private confirmAttachment(message: Extract<WebviewMessage, { type: "confirmFileAttachment" | "confirmSelectionAttachment" }>): void {
    const attachment = this.attachment.draft.attachments.find(a => a.attachmentId === message.attachmentId);
    if (!attachment || attachment.attachmentId !== message.attachmentId || attachment.snapshotId !== message.snapshotId
      || attachment.state !== "confirmation-required" || message.type !== (attachment.kind === "selection" ? "confirmSelectionAttachment" : "confirmFileAttachment")) {
      this.attachment = { ...this.attachment, result: { code: "stale" } }; this.emitAttachment(); return;
    }
    if (this.workspace.runtime !== "ready" || this.workspace.chatBusy || this.attachment.preparation !== "idle") return;
    const token = ++this.preparationToken;
    this.attachment = { ...this.attachment, preparation: "preparing", result: null }; this.emitAttachment();
    this.schedule(() => {
      if (token !== this.preparationToken) return;
      this.attachment = { ...this.attachment, preparation: "idle", draft: { ...this.attachment.draft, revision: this.attachment.draft.revision + 1, attachments: this.attachment.draft.attachments.map(a => a.attachmentId === attachment.attachmentId ? { ...attachment, state: "attached" } : a) } };
      this.emitAttachment();
    }, 420);
  }

  private removeAttachment(message: Extract<WebviewMessage, { type: "removeAttachment" }>): void {
    if (message.draftRevision !== this.attachment.draft.revision
      || !this.attachment.draft.attachments.some(a => a.attachmentId === message.attachmentId)) return;
    this.preparationToken++;
    this.attachment = {
      ...this.attachment,
      draft: { ...this.attachment.draft, revision: this.attachment.draft.revision + 1, attachments: this.attachment.draft.attachments.filter(a => a.attachmentId !== message.attachmentId) },
      preparation: "idle",
      result: null,
    };
    this.emitAttachment();
  }

  private sendPreview(message: Extract<WebviewMessage, { type: "getAttachmentPreview" }>): void {
    const text = this.previews.get(message.snapshotId);
    if (text === undefined || message.offset > text.length) {
      this.schedule(() => this.emit({ version: 3, type: "attachmentPreview", viewId: this.viewId, generation: this.workspace.generation, requestId: message.requestId, code: "unavailable" }), 0);
      return;
    }
    let nextOffset = Math.min(message.offset + (this.scenario === "long-history" ? 16384 : 96), text.length);
    if (nextOffset < text.length && /[\uD800-\uDBFF]/.test(text[nextOffset - 1])) nextOffset--;
    const chunk: AttachmentPreviewMessage = {
      version: 3,
      type: "attachmentPreview",
      viewId: this.viewId,
      generation: this.workspace.generation,
      requestId: message.requestId,
      snapshotId: message.snapshotId,
      offset: message.offset,
      nextOffset,
      done: nextOffset >= text.length,
      text: text.slice(message.offset, nextOffset),
    };
    this.schedule(() => this.emit(chunk), 80);
  }
}
