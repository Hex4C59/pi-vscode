import type { WebviewBridge } from "../bridge.js";
import type {
  AttachmentHistoryEntry,
  AttachmentPreviewMessage,
  AttachmentStateMessage,
  ChangeReviewStateMessage,
  DraftAttachment,
  HostMessage,
  SavedHistoryPreviewMessage,
  SavedHistoryStateMessage,
  SessionStateMessage,
  WebviewMessage,
  WorkspaceStateMessage,
} from "../../extension/webviewProtocol.js";

export const PREVIEW_SCENARIOS = [
  "ready",
  "streaming",
  "approval",
  "attachment",
  "source-changed",
  "long-history",
  "sessions",
  "change-review",
  "error",
  "no-folder",
  "untrusted",
  "unavailable-model",
  "blocked",
] as const;

export type PreviewScenario = (typeof PREVIEW_SCENARIOS)[number];

type Model = WorkspaceStateMessage["availableModels"][number];
type Timer = ReturnType<typeof setTimeout>;
type InboundAction = Extract<WebviewMessage, { type: string }>;

const MODELS: Model[] = [
  { provider: "anthropic", modelId: "claude-sonnet", label: "Claude Sonnet" },
  { provider: "openai", modelId: "gpt-5", label: "GPT-5" },
  { provider: "google", modelId: "gemini-pro", label: "Gemini Pro" },
];
const THINKING_LEVELS = ["off", "low", "medium", "high"];
const READY_FOLDER = { name: "pi-vscode", path: "/workspace/pi-vscode" };
const PREVIEW_TEXT = [
  "// Literal preview: this text is supplied by the synthetic host.",
  "export function greet(name: string): string {",
  "  return `Hello, ${name}`;",
  "}",
  "",
  "// Long lines wrap in the attachment surface without moving the composer.",
].join("\n");
const STREAM_CHUNKS = [
  "I checked the workspace context. ",
  "The request is ready to review, and ",
  "the next step is intentionally small. ",
  "I would keep the change focused and verify it before proceeding.",
];
const SELECTION_TEXT = "return `Hello, ${name}`;";
const SESSION_PAGE_SIZE = 16;
const SAVED_HISTORY_PAGE_SIZE = 32;
const SAVED_HISTORY_PREVIEW_CHUNK_SIZE = 8192;
const SESSION_LIST_DELAY = 80;
const SESSION_HANDOFF_DELAY = 120;
const SAVED_HISTORY_DELAY = 80;
const SYNTHETIC_SESSION_COUNT = 33;
const SYNTHETIC_HISTORY_COUNT = 65;
const SYNTHETIC_LITERAL_HISTORY_TEXT = [
  '<article data-fixture="synthetic-session">',
  "  <h1>Literal restored HTML snapshot</h1>",
  "  <p>This is retained text from the synthetic browser preview. It is not a file and it is never executed.</p>",
  "</article>",
  "",
  "<!-- " + "literal retained history ".repeat(420) + "-->",
].join("\n");

type SessionEntry = SessionStateMessage["entries"][number];

const SYNTHETIC_SESSION_ENTRIES: SessionEntry[] = Array.from({ length: SYNTHETIC_SESSION_COUNT }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");
  return {
    id: `preview-session-${number}`,
    title: `Synthetic saved session ${number}`,
    excerpt: "Synthetic browser preview catalogue entry; native session state is not used.",
    modified: `2026-09-${String(Math.min(30, index + 1)).padStart(2, "0")}T00:00:00.000Z`,
  };
});

function syntheticHistoryMessages(page: number): SavedHistoryStateMessage["messages"] {
  const end = SYNTHETIC_HISTORY_COUNT - page * SAVED_HISTORY_PAGE_SIZE;
  const start = Math.max(0, end - SAVED_HISTORY_PAGE_SIZE);
  return Array.from({ length: Math.max(0, end - start) }, (_, offset) => {
    const number = start + offset + 1;
    return {
      id: `synthetic-history-${number}`,
      role: number % 2 === 0 ? "assistant" as const : "user" as const,
      text: `Synthetic restored history message ${String(number).padStart(2, "0")}. This bounded row is for browser preview only.`,
    };
  });
}

function syntheticHistoryText(id: string): string | undefined {
  if (id === "synthetic-history-65") return SYNTHETIC_LITERAL_HISTORY_TEXT;
  const match = /^synthetic-history-(\d+)$/.exec(id);
  if (!match || Number(match[1]) < 1 || Number(match[1]) > SYNTHETIC_HISTORY_COUNT) return undefined;
  return `<p data-fixture="synthetic-session">Literal retained text for synthetic history message ${match[1]}.</p>`;
}

let bridgeNumber = 0;

function cloneModels(): Model[] {
  return MODELS.map(model => ({ ...model }));
}

function modelFor(provider: string, modelId: string): Model | undefined {
  return MODELS.find(model => model.provider === provider && model.modelId === modelId);
}

function draftAttachment(state: DraftAttachment["state"] = "attached"): DraftAttachment {
  return {
    attachmentId: "attachment-preview-1",
    snapshotId: "snapshot-preview-1",
    relativePath: "src/preview/example.ts",
    kind: "file",
    utf8Bytes: new TextEncoder().encode(PREVIEW_TEXT).byteLength,
    unsaved: true,
    state,
  };
}

function historyEntry(submissionId: string, snapshotId: string, relativePath: string): AttachmentHistoryEntry {
  return {
    submissionId,
    snapshotId,
    relativePath,
    kind: "file",
    utf8Bytes: 214,
    unsaved: submissionId === "submission-preview-1",
    delivery: "rpc-accepted",
    outcome: "sent in preview fixture",
  };
}

function baseWorkspace(scenario: PreviewScenario): WorkspaceStateMessage {
  const blockedStatus = scenario === "blocked" ? "multi-root" : undefined;
  const unavailable = scenario === "unavailable-model";
  const error = scenario === "error";
  const noFolder = scenario === "no-folder";
  const untrusted = scenario === "untrusted";
  const initialMessages = noFolder || untrusted || blockedStatus
    ? []
    : [
      { role: "user" as const, id: "message-user-1", text: "Inspect the current workspace and outline the next safe step." },
      { role: "assistant" as const, id: "message-assistant-1", text: "The workspace is ready. I can help inspect files, explain a change, or prepare a focused edit." },
    ];
  const streaming = scenario === "streaming";
  const approval = scenario === "approval";
  const status = blockedStatus ?? (noFolder ? "no-folder" : untrusted ? "untrusted" : "eligible");
  const runtime = noFolder || untrusted || blockedStatus ? "not-started" : error ? "error" : "ready";
  const chatModel = unavailable || noFolder || untrusted || blockedStatus ? null : "Claude Sonnet";
  return {
    version: 2,
    type: "workspaceState",
    viewId: "preview-view",
    generation: 1,
    status,
    folder: noFolder ? null : READY_FOLDER,
    choice: noFolder || untrusted || blockedStatus ? null : "allow",
    busy: false,
    error: error ? "The preview runtime reported a recoverable failure." : null,
    runtime,
    runtimeDetail: error ? "Synthetic runtime failure" : null,
    messages: initialMessages,
    chatBusy: streaming || approval,
    chatError: error ? "The task could not be started. Check the runtime and try again." : null,
    chatModel,
    thinkingLevel: unavailable || noFolder || untrusted || blockedStatus ? null : "medium",
    thinkingLevels: unavailable || noFolder || untrusted || blockedStatus ? [] : [...THINKING_LEVELS],
    availableModels: unavailable || noFolder || untrusted || blockedStatus ? [] : cloneModels(),
    pendingModel: null,
    pendingThinkingLevel: null,
    modelBusy: false,
    modelError: unavailable ? "No configured model is available in this preview state." : null,
    activities: streaming ? [{
      id: "activity-thinking-1",
      kind: "thinking",
      messageId: "message-assistant-stream",
      text: "Reviewing the request...",
      status: "thinking",
      truncated: false,
    }] : approval ? [{
      id: "activity-tool-1",
      kind: "tool",
      messageId: "message-assistant-approval",
      toolCallId: "tool-call-preview-1",
      tool: "read",
      text: "Waiting for permission to inspect the selected file.",
      input: '{"path":"src/preview/example.ts"}',
      status: "preparing",
      truncated: false,
    }] : [],
    approvals: approval ? [{
      id: "approval-preview-1",
      toolCallId: "tool-call-preview-1",
      tool: "read",
      input: '{"path":"src/preview/example.ts"}',
      scope: '["read","/workspace/pi-vscode/src/preview/example.ts"]',
      expiresAt: Date.now() + 120000,
    }] : [],
    grants: [],
    execution: streaming ? "replying" : approval ? "awaiting-approval" : error ? "failed" : "idle",
    controlledExecution: true,
  };
}

function baseSessionState(scenario: PreviewScenario, viewId: string, generation = 1): SessionStateMessage {
  return {
    version: 2,
    type: "sessionState",
    viewId,
    generation,
    phase: "idle",
    current: scenario === "sessions" ? { id: "preview-live-session", name: "Synthetic live session" } : null,
    loaded: false,
    entries: [],
    page: 0,
    total: 0,
    error: null,
  };
}

function baseSavedHistoryState(viewId: string, generation = 1): SavedHistoryStateMessage {
  return {
    version: 2,
    type: "savedHistoryState",
    viewId,
    generation,
    available: false,
    phase: "idle",
    messages: [],
    page: 0,
    total: 0,
    error: null,
  };
}

function baseAttachmentState(scenario: PreviewScenario): AttachmentStateMessage {
  const attached = scenario === "attachment" || scenario === "source-changed";
  const attachment = attached ? draftAttachment(scenario === "source-changed" ? "changed" : "attached") : null;
  return {
    version: 2,
    type: "attachmentState",
    viewId: "preview-view",
    generation: 1,
    draft: { revision: 0, text: "", acceptedEditSequence: 0, attachments: attachment ? [attachment] : [] },
    preparation: "idle",
    result: scenario === "source-changed" ? { code: "source-changed" } : null,
    historyCount: attached ? 2 : 0,
    retainedBytes: attached ? 442 : 0,
    lastSubmission: attached ? {
      submissionId: "submission-preview-1",
      draftRevision: 0,
      delivery: "rpc-accepted",
      outcome: "sent in preview fixture",
    } : null,
  };
}

export class PreviewBridge implements WebviewBridge {
  readonly viewId: string;
  private readonly listeners = new Set<(message: unknown) => void>();
  private readonly timers = new Set<Timer>();
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
  private disposed = false;
  private streamText = "";
  private streamIndex = 0;
  private streamToken = 0;
  private preparationToken = 0;
  private snapshotSequence = 1;

  constructor(readonly scenario: PreviewScenario) {
    bridgeNumber += 1;
    this.viewId = `preview-view-${bridgeNumber}`;
    this.workspace = { ...baseWorkspace(scenario), viewId: this.viewId };
    this.attachment = { ...baseAttachmentState(scenario), viewId: this.viewId };
    this.session = baseSessionState(scenario, this.viewId);
    this.savedHistory = baseSavedHistoryState(this.viewId);
    this.history = scenario === "attachment" || scenario === "source-changed"
      ? [
        historyEntry("submission-preview-1", "snapshot-history-1", "src/preview/earlier.ts"),
        historyEntry("submission-preview-2", "snapshot-history-2", "src/preview/checked.ts"),
      ] : [];
    if (scenario === "sessions") {
      for (let index = 1; index <= SYNTHETIC_HISTORY_COUNT; index++) {
        const text = syntheticHistoryText(`synthetic-history-${index}`);
        if (text !== undefined) this.savedHistoryPreviews.set(`synthetic-history-${index}`, text);
      }
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
    if (scenario === "streaming") this.startStream();
  }

  postMessage(message: WebviewMessage): void {
    if (this.disposed) return;
    if (message.type === "ping") {
      this.emit({ version: 2, type: "pong", viewId: this.viewId, generation: this.workspace.generation });
      return;
    }
    if (message.type === "getWorkspaceState") {
      this.emitWorkspace();
      this.emitAttachment();
      this.emitReview();
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
        this.emit({ version: 2, type: "attachmentHistory", viewId: this.viewId, generation: this.workspace.generation, entries: this.history });
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

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.clearTimers(this.timers);
    this.clearTimers(this.streamTimers);
    this.listeners.clear();
  }

  private belongsToCurrentView(message: InboundAction): boolean {
    return "generation" in message && "viewId" in message
      && message.generation === this.workspace.generation && message.viewId === this.viewId;
  }

  private emit(message: HostMessage): void {
    if (this.disposed) return;
    for (const listener of [...this.listeners]) listener(message);
  }

  private emitReview(error: ChangeReviewStateMessage["error"] = null): void {
    const entries: ChangeReviewStateMessage["entries"] = this.scenario === "change-review" ? Array.from({ length: 33 }, (_, index) => ({
      id: "review-preview-" + index, taskId: "task-preview-" + Math.floor(index / 8),
      path: index === 2 ? null : "src/preview/" + (index === 0 ? "long-path-".repeat(12) : "changed-") + index + ".ts",
      source: index % 3 === 1 ? "observed" as const : "tool" as const,
      tool: index % 3 === 1 ? null : "write" as const,
      status: index % 3 === 1 ? "observed" as const : index === 2 ? "failed" as const : "complete" as const,
      diff: index % 3 === 1 || index === 2 ? "unavailable" as const : "ready" as const,
      reason: index === 2 ? "sensitive-source" as const : index % 3 === 1 ? "no-before-snapshot" as const : null,
      sourceChanged: index === 0, overlap: index === 3,
    })) : [];
    this.emit({ version: 2, type: "changeReviewState", viewId: this.viewId, generation: this.workspace.generation,
      entries, retainedBytes: entries.length ? 2048 : 0, limited: false, reset: false, error });
  }

  private emitWorkspace(): void {
    this.emit({ ...this.workspace, viewId: this.viewId });
  }

  private emitAttachment(): void {
    this.emit({ ...this.attachment, viewId: this.viewId });
  }

  private emitSession(): void {
    this.emit({ ...this.session, viewId: this.viewId });
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
    if (this.scenario !== "sessions") return;
    const lastPage = Math.max(0, Math.ceil(SYNTHETIC_SESSION_ENTRIES.length / SESSION_PAGE_SIZE) - 1);
    if (!Number.isSafeInteger(message.page) || message.page < 0 || message.page > lastPage) return;
    const token = ++this.sessionOperationToken;
    const generation = this.workspace.generation;
    this.session = { ...this.session, phase: "listing", error: null };
    this.emitSession();
    this.schedule(() => {
      if (token !== this.sessionOperationToken || generation !== this.workspace.generation) return;
      const start = message.page * SESSION_PAGE_SIZE;
      this.session = {
        ...this.session,
        phase: "idle",
        loaded: true,
        entries: SYNTHETIC_SESSION_ENTRIES.slice(start, start + SESSION_PAGE_SIZE),
        page: message.page,
        total: SYNTHETIC_SESSION_ENTRIES.length,
        error: null,
      };
      this.emitSession();
    }, SESSION_LIST_DELAY);
  }

  private beginSessionSwitch(id?: string): void {
    if (this.scenario !== "sessions" || this.session.phase === "confirming" || this.session.phase === "switching") return;
    const target = id === undefined ? null : SYNTHETIC_SESSION_ENTRIES.find(entry => entry.id === id);
    if (id !== undefined && !target) {
      this.session = { ...this.session, phase: "error", error: "stale" };
      this.emitSession();
      return;
    }
    const token = ++this.sessionOperationToken;
    this.session = { ...this.session, phase: "confirming", error: null };
    this.emitSession();
    this.schedule(() => {
      if (token !== this.sessionOperationToken || this.session.phase !== "confirming") return;
      this.commitSessionSwitch(target ?? null);
    }, SESSION_HANDOFF_DELAY);
  }

  private commitSessionSwitch(target: SessionEntry | null): void {
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
    this.savedHistory = target
      ? { ...baseSavedHistoryState(this.viewId, generation), available: true, messages: syntheticHistoryMessages(0), page: 0, total: SYNTHETIC_HISTORY_COUNT }
      : baseSavedHistoryState(this.viewId, generation);
    this.session = { ...this.session, phase: "idle" };
    this.emitWorkspace();
    this.emitAttachment();
    this.emitSession();
    this.emitSavedHistory();
  }

  private getSavedHistory(message: Extract<WebviewMessage, { type: "getSavedSessions" | "getSavedHistory" }>): void {
    if (this.scenario !== "sessions" || !this.savedHistory.available) return;
    const lastPage = Math.max(0, Math.ceil(SYNTHETIC_HISTORY_COUNT / SAVED_HISTORY_PAGE_SIZE) - 1);
    if (!Number.isSafeInteger(message.page) || message.page < 0 || message.page > lastPage) return;
    const token = ++this.sessionOperationToken;
    const generation = this.workspace.generation;
    this.savedHistory = { ...this.savedHistory, phase: "loading", page: message.page, error: null };
    this.emitSavedHistory();
    this.schedule(() => {
      if (token !== this.sessionOperationToken || generation !== this.workspace.generation || !this.savedHistory.available) return;
      this.savedHistory = { ...this.savedHistory, phase: "idle", messages: syntheticHistoryMessages(message.page), page: message.page, total: SYNTHETIC_HISTORY_COUNT, error: null };
      this.emitSavedHistory();
    }, SAVED_HISTORY_DELAY);
  }

  private sendSavedHistoryPreview(message: Extract<WebviewMessage, { type: "getSavedHistoryPreview" }>): void {
    if (this.scenario !== "sessions" || !this.savedHistory.available || this.savedHistory.phase !== "idle"
      || !this.savedHistory.messages.some(line => line.id === message.id)) return;
    const text = this.savedHistoryPreviews.get(message.id);
    if (text === undefined || message.offset > text.length) {
      this.schedule(() => this.emit({ version: 2, type: "savedHistoryPreview", viewId: this.viewId, generation: this.workspace.generation, id: message.id, requestId: message.requestId, code: "unavailable" }), 0);
      return;
    }
    const nextOffset = Math.min(message.offset + SAVED_HISTORY_PREVIEW_CHUNK_SIZE, text.length);
    const chunk: SavedHistoryPreviewMessage = {
      version: 2,
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
    this.schedule(() => this.emit(chunk), SAVED_HISTORY_DELAY);
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
        const text = PREVIEW_TEXT + "\n// Updated synthetic source.";
        const snapshotId = "snapshot-preview-" + (++this.snapshotSequence);
        this.previews.set(snapshotId, text);
        return { ...attachment, state: "confirmation-required" as const, snapshotId, utf8Bytes: new TextEncoder().encode(text).byteLength };
      });
      this.attachment = { ...this.attachment, draft: { ...this.attachment.draft, revision: this.attachment.draft.revision + 1, attachments: candidates }, result: { code: "source-changed" } };
      this.emitAttachment(); return;
    }
    if (attachments.some(a => a.state === "confirmation-required" || a.state === "unavailable")) return;
    if (this.scenario === "approval") {
      this.startApproval();
      return;
    }
    if (this.history.length + attachments.length > 128) {
      this.attachment = { ...this.attachment, result: { code: "history-full" } };
      this.emitAttachment(); return;
    }
    this.admitSubmission();
    this.startStream();
  }

  private admitSubmission(): void {
    const draft = this.attachment.draft;
    const submissionId = `submission-preview-${this.history.length + 3}`;
    for (const attached of draft.attachments) {
      this.history.push({
        submissionId,
        snapshotId: attached.snapshotId,
        relativePath: attached.relativePath,
        ...(attached.kind === "selection" ? { kind: "selection", originalRange: attached.originalRange, stale: attached.stale } as const : { kind: "file" } as const),
        utf8Bytes: attached.utf8Bytes,
        unsaved: attached.unsaved,
        delivery: "rpc-accepted",
        outcome: "pending",
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
        delivery: "rpc-accepted",
        outcome: "pending",
      },
      result: null,
    };
    this.emitAttachment();
  }

  private startStream(): void {
    this.clearTimers(this.streamTimers);
    const streamToken = ++this.streamToken;
    this.streamText = "";
    this.streamIndex = 0;
    const messages = this.workspace.messages.filter(message => message.id !== "message-assistant-stream");
    messages.push({ role: "assistant", id: "message-assistant-stream", text: "" });
    this.workspace = {
      ...this.workspace,
      messages: messages.slice(-32),
      chatBusy: true,
      chatError: null,
      execution: "thinking",
      approvals: [],
      activities: [{
        id: "activity-thinking-1",
        kind: "thinking",
        messageId: "message-assistant-stream",
        text: "Reviewing the request...",
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
    if (this.streamIndex >= STREAM_CHUNKS.length) {
      this.finishStream();
      return;
    }
    this.streamText += STREAM_CHUNKS[this.streamIndex];
    this.streamIndex += 1;
    const messages = this.workspace.messages.map(message => message.id === "message-assistant-stream"
      ? { ...message, text: this.streamText }
      : message);
    const activities = this.streamIndex > 1 ? [
      { ...this.workspace.activities[0], status: "complete" as const },
      {
        id: "activity-tool-1",
        kind: "tool" as const,
        messageId: "message-assistant-stream",
        toolCallId: "tool-call-stream-1",
        tool: "read",
        text: this.streamIndex >= STREAM_CHUNKS.length ? "Read the preview fixture." : "Reading the preview fixture...",
        input: '{"path":"src/preview/example.ts"}',
        status: this.streamIndex >= STREAM_CHUNKS.length ? "complete" as const : "executing" as const,
        truncated: false,
      },
    ] : this.workspace.activities;
    this.workspace = { ...this.workspace, messages, activities, execution: this.streamIndex >= STREAM_CHUNKS.length ? "replying" : "thinking" };
    this.emitWorkspace();
    this.schedule(() => {
      if (streamToken === this.streamToken) this.streamNext(streamToken);
    }, 420, this.streamTimers);
  }

  private finishStream(): void {
    this.clearTimers(this.streamTimers);
    this.workspace = { ...this.workspace, chatBusy: false, execution: "idle" };
    this.emitWorkspace();
    if (this.workspace.pendingModel || this.workspace.pendingThinkingLevel) this.applyPendingSettings();
  }

  private startApproval(): void {
    this.workspace = {
      ...this.workspace,
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
    if (!this.workspace.approvals.some(approval => approval.id === message.id)) return;
    if (message.decision === "deny") {
      this.workspace = {
        ...this.workspace,
        approvals: [],
        chatBusy: false,
        execution: "failed",
        chatError: "The requested action was declined.",
      };
      this.emitWorkspace();
      return;
    }
    const grants = message.decision === "session"
      ? [{ id: "grant-preview-1", scope: "[\"read\",\"/workspace/pi-vscode/src/preview/example.ts\"]" }]
      : this.workspace.grants;
    this.workspace = { ...this.workspace, approvals: [], grants, execution: "executing" };
    this.emitWorkspace();
    const actionToken = this.streamToken;
    this.schedule(() => {
      if (actionToken === this.streamToken) this.startStream();
    }, 360);
  }

  private stopChat(): void {
    if (!this.workspace.chatBusy && this.attachment.preparation === "idle") return;
    this.clearTimers(this.timers);
    this.clearTimers(this.streamTimers);
    this.streamToken += 1;
    this.preparationToken += 1;
    this.workspace = {
      ...this.workspace,
      chatBusy: false,
      execution: "stopping",
      approvals: [],
      chatError: null,
    };
    this.attachment = { ...this.attachment, draft: { ...this.attachment.draft, revision: this.attachment.draft.revision + (this.attachment.preparation === "idle" ? 0 : 1) }, preparation: "idle" };
    this.emitWorkspace();
    this.emitAttachment();
    this.schedule(() => {
      this.workspace = {
        ...this.workspace,
        execution: "failed",
        chatError: "Task stopped. Completed side effects remain unchanged.",
      };
      this.emitWorkspace();
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
      const sequence = ++this.snapshotSequence;
      const snapshotId = `snapshot-preview-${sequence}`;
      const text = kind === "selection" ? SELECTION_TEXT : PREVIEW_TEXT;
      this.previews.set(snapshotId, text);
      const details = kind === "selection" ? { kind, originalRange: { start: { line: 2, character: 2 }, end: { line: 2, character: 2 + SELECTION_TEXT.length } }, stale: this.scenario === "source-changed" } : { kind };
      const attachment: DraftAttachment = { ...draftAttachment(this.scenario === "source-changed" ? "changed" : "attached"), ...details, attachmentId: `attachment-preview-${sequence}`, snapshotId, utf8Bytes: new TextEncoder().encode(text).byteLength };
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
      this.schedule(() => this.emit({ version: 2, type: "attachmentPreview", viewId: this.viewId, generation: this.workspace.generation, requestId: message.requestId, code: "unavailable" }), 0);
      return;
    }
    let nextOffset = Math.min(message.offset + (this.scenario === "long-history" ? 16384 : 96), text.length);
    if (nextOffset < text.length && /[\uD800-\uDBFF]/.test(text[nextOffset - 1])) nextOffset--;
    const chunk: AttachmentPreviewMessage = {
      version: 2,
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
