import type {
  AttachmentHistoryEntry,
  AttachmentStateMessage,
  DraftAttachment,
  SavedHistoryStateMessage,
  SessionStateMessage,
  WorkspaceStateMessage,
} from "../../extension/contracts/webviewProtocol.js";

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

const MODELS: Model[] = [
  { provider: "anthropic", modelId: "claude-sonnet", label: "Claude Sonnet" },
  { provider: "openai", modelId: "gpt-5", label: "GPT-5" },
  { provider: "google", modelId: "gemini-pro", label: "Gemini Pro" },
];
export const THINKING_LEVELS = ["off", "low", "medium", "high"];
export const READY_FOLDER = { name: "pi-vscode", path: "/workspace/pi-vscode" };
export const PREVIEW_TEXT = [
  "// Literal preview: this text is supplied by the synthetic host.",
  "export function greet(name: string): string {",
  "  return `Hello, ${name}`;",
  "}",
  "",
  "// Long lines wrap in the attachment surface without moving the composer.",
].join("\n");
export const STREAM_CHUNKS = [
  "I checked the workspace context. ",
  "The request is ready to review, and ",
  "the next step is intentionally small. ",
  "I would keep the change focused and verify it before proceeding.",
];
export const SELECTION_TEXT = "return `Hello, ${name}`;";
export const SESSION_PAGE_SIZE = 16;
export const SAVED_HISTORY_PAGE_SIZE = 32;
export const SAVED_HISTORY_PREVIEW_CHUNK_SIZE = 8192;
export const SESSION_LIST_DELAY = 80;
export const SESSION_HANDOFF_DELAY = 120;
export const SAVED_HISTORY_DELAY = 80;
const SYNTHETIC_SESSION_COUNT = 33;
export const SYNTHETIC_HISTORY_COUNT = 65;
const SYNTHETIC_LITERAL_HISTORY_TEXT = [
  '<article data-fixture="synthetic-session">',
  "  <h1>Literal restored HTML snapshot</h1>",
  "  <p>This is retained text from the synthetic browser preview. It is not a file and it is never executed.</p>",
  "</article>",
  "",
  "<!-- " + "literal retained history ".repeat(420) + "-->",
].join("\n");

export type SessionEntry = SessionStateMessage["entries"][number];

export const SYNTHETIC_SESSION_ENTRIES: SessionEntry[] = Array.from({ length: SYNTHETIC_SESSION_COUNT }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");
  return {
    id: `preview-session-${number}`,
    title: `Synthetic saved session ${number}`,
    excerpt: "Synthetic browser preview catalogue entry; native session state is not used.",
    modified: `2026-09-${String(Math.min(30, index + 1)).padStart(2, "0")}T00:00:00.000Z`,
  };
});

export function syntheticHistoryMessages(page: number): SavedHistoryStateMessage["messages"] {
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

export function syntheticHistoryText(id: string): string | undefined {
  if (id === "synthetic-history-65") return SYNTHETIC_LITERAL_HISTORY_TEXT;
  const match = /^synthetic-history-(\d+)$/.exec(id);
  if (!match || Number(match[1]) < 1 || Number(match[1]) > SYNTHETIC_HISTORY_COUNT) return undefined;
  return `<p data-fixture="synthetic-session">Literal retained text for synthetic history message ${match[1]}.</p>`;
}


export function cloneModels(): Model[] {
  return MODELS.map(model => ({ ...model }));
}

export function modelFor(provider: string, modelId: string): Model | undefined {
  return MODELS.find(model => model.provider === provider && model.modelId === modelId);
}

export function draftAttachment(state: DraftAttachment["state"] = "attached"): DraftAttachment {
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

export function historyEntry(submissionId: string, snapshotId: string, relativePath: string): AttachmentHistoryEntry {
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

export function baseWorkspace(scenario: PreviewScenario): WorkspaceStateMessage {
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

export function baseSessionState(scenario: PreviewScenario, viewId: string, generation = 1): SessionStateMessage {
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

export function baseSavedHistoryState(viewId: string, generation = 1): SavedHistoryStateMessage {
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

export function baseAttachmentState(scenario: PreviewScenario): AttachmentStateMessage {
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
