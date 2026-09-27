import type {
  AttachmentHistoryEntry,
  AttachmentStateMessage,
  DraftAttachment,
  SavedHistoryStateMessage,
  SessionStateMessage,
  WorkspaceStateMessage,
} from "../../extension/contracts/index.js";

export const PREVIEW_SCENARIOS = [
  "ready",
  "empty",
  "loading",
  "streaming",
  "formatted",
  "safe-output",
  "activity",
  "approval",
  "approval-queue",
  "attachment",
  "attachment-failure",
  "attachment-capacity",
  "attachment-uncertain",
  "attachment-layout",
  "attachment-unavailable",
  "source-changed",
  "long-history",
  "sessions",
  "sessions-empty",
  "sessions-error",
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
export const FORMATTED_STREAM_CHUNKS = [
  '# Formatted reply\n\n- First step\n- Second step\n\n1. Inspect\n2. Verify\n\n```ts\nconst greeting = "<hello>',
  '&";\n  console.log(greeting);',
  '\n```\n\nRead [the guide](https://example.com/guide).',
];
export const ACTIVITY_STREAM_CHUNKS = [
  '# Activity-first reply\n\nThe tool details remain available while this reply streams.',
  '\n\nThis is a deterministic preview, not a model-generated activity summary.',
  '\n\nThe bounded output below must not be mistaken for a complete successful result.',
];
export const ACTIVITY_THINKING = Array.from({ length: 60 }, (_, index) => `Observed reasoning line ${index + 1}: checking the preview fixture, not workspace files.`).join('\n');
export const SAFETY_REPLY = [
  '# Untrusted reply',
  '<img src="https://example.com/tracker" onerror="alert(1)">',
  '<script>alert(1)</script>',
  '![remote image](https://example.com/image.png)',
  '[script](javascript:alert%281%29)',
  '[encoded](java&#x73;cript:alert%281%29)',
  '[data](data:text/html,unsafe)',
  '[command](command:workbench.action.files.openFile)',
  '[file](file:///etc/passwd)',
  '[relative](/local-path)',
  '[credentials](https://user:pass@example.com/)',
  '[safe guide](https://example.com/guide)',
  '```text\n' + 'long preview token '.repeat(40) + '\n```',
].join('\n\n');
export const LAYOUT_PATH = "src/" + "long-directory/".repeat(35) + "example.ts";
export const LITERAL_ATTACHMENT_TEXT = '<img src="https://example.com/attachment.png" onerror="throw 1">\n<script>throw 1</script>\n![embedded](https://example.com/image.png)';
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
}).sort((left, right) => right.modified.localeCompare(left.modified) || right.id.localeCompare(left.id));

export function syntheticHistoryMessages(page: number): SavedHistoryStateMessage["messages"] {
  const end = SYNTHETIC_HISTORY_COUNT - page * SAVED_HISTORY_PAGE_SIZE;
  const start = Math.max(0, end - SAVED_HISTORY_PAGE_SIZE);
  return Array.from({ length: Math.max(0, end - start) }, (_, offset) => {
    const number = start + offset + 1;
    return {
      ...(number === 63 ? {} : { id: `synthetic-history-${number}` }),
      role: number % 2 === 0 ? "assistant" as const : "user" as const,
      text: `Synthetic restored history message ${String(number).padStart(2, "0")}. This bounded row is for browser preview only.`
        + (number === 64 ? "\n[Truncated for display. Open retained text for the available original.]" : "")
        + (number === 63 ? '\n[Unsupported historical content; original attachment text is unavailable.] <img src="https://example.com/history.png">' : ""),
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
  const initialMessages = (scenario === "empty" || scenario === "attachment-failure" || scenario === "attachment-capacity" || scenario === "attachment-uncertain" || scenario === "attachment-layout") || scenario === "loading" || noFolder || untrusted || blockedStatus
    ? []
    : [
      { role: "user" as const, id: "message-user-1", text: "Inspect the current workspace and outline the next safe step." },
      { role: "assistant" as const, id: "message-assistant-1", text: scenario === "safe-output" ? SAFETY_REPLY : "The workspace is ready. I can help inspect files, explain a change, or prepare a focused edit." },
    ];
  if (scenario === "activity") {
    for (let index = 0; index < 6; index++) initialMessages.push({ role: "assistant", id: `prior-${index}`, text: `Earlier preview reply ${index + 1}\n\n${"Retained conversation context. ".repeat(12)}` });
  }
  const streaming = scenario === "streaming";
  const approval = scenario === "approval" || scenario === "approval-queue";
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
    busy: scenario === "loading",
    error: error ? "The preview runtime reported a recoverable failure." : null,
    runtime: scenario === "loading" ? "starting" : runtime,
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
    approvals: scenario === "approval-queue" ? Array.from({ length: 8 }, (_, index) => ({
      id: `approval-preview-${index + 1}`, toolCallId: `tool-call-preview-${index + 1}`, tool: "bash",
      input: JSON.stringify({ command: `echo request-${index + 1} <literal>`, cwd: "/workspace/pi-vscode" }),
      scope: index === 7 ? null : JSON.stringify(["bash", "/workspace/pi-vscode", `echo request-${index + 1} <literal>`]),
      expiresAt: Date.now() + (index === 0 ? 20000 : 120000),
    })) : approval ? [{
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
  const attached = scenario === "attachment" || scenario === "source-changed" || scenario === "attachment-unavailable";
  const attachment = attached ? draftAttachment(scenario === "source-changed" ? "changed" : scenario === "attachment-unavailable" ? "unavailable" : "attached") : null;
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
