import { containsCredentialLikeText, type ExtensionFeedback } from "../../extension/contracts/index.js";

type Entry = { feedback: ExtensionFeedback; key?: string };
type Parsed = { kind: ExtensionFeedback["kind"]; level: ExtensionFeedback["level"]; text?: string; key?: string };
const WARNING = "Extension feedback omitted: unsafe or oversized content.";
const FRAME_BYTES = 65_536;
const TEXT_BYTES = 32_768;

// Text is never interpreted as markup or commands.
function safeText(value: string): boolean {
  return !containsCredentialLikeText(value);
}

// Copy only own data properties: no accessors, inherited fields, symbols or toJSON execution.
function plainRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) return;
  const keys = Reflect.ownKeys(value);
  if (keys.length > 7) return;
  const result: Record<string, unknown> = Object.create(null);
  for (const key of keys) {
    if (typeof key !== "string") return;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) return;
    result[key] = descriptor.value;
  }
  return result;
}

function parse(value: unknown): Parsed | "unsafe" | undefined {
  const record = plainRecord(value);
  if (!record || record.type !== "extension_ui_request" || typeof record.id !== "string"
    || !record.id || Buffer.byteLength(record.id) > 200) return;
  const fields: Record<string, string[]> = {
    notify: ["message", "notifyType"], setStatus: ["statusKey", "statusText"],
    setWidget: ["widgetKey", "widgetLines", "widgetPlacement"], setTitle: ["title"], set_editor_text: ["text"],
  };
  if (typeof record.method !== "string" || !Object.hasOwn(fields, record.method)) return;
  const allowed = ["type", "id", "method", ...fields[record.method]];
  if (Object.keys(record).some(key => !allowed.includes(key))) return;
  let parsed: Parsed;
  if (record.method === "notify") {
    if (typeof record.message !== "string" || (record.notifyType !== undefined
      && record.notifyType !== "info" && record.notifyType !== "warning" && record.notifyType !== "error")) return;
    parsed = { kind: "notify", level: record.notifyType ?? "info", text: record.message };
  } else if (record.method === "setStatus") {
    if (typeof record.statusKey !== "string" || Buffer.byteLength(record.statusKey) > 100
      || (record.statusText !== undefined && typeof record.statusText !== "string")) return;
    parsed = { kind: "status", level: "info", key: record.statusKey, text: record.statusText };
  } else if (record.method === "setWidget") {
    if (typeof record.widgetKey !== "string" || Buffer.byteLength(record.widgetKey) > 100
      || (record.widgetPlacement !== undefined && record.widgetPlacement !== "aboveEditor" && record.widgetPlacement !== "belowEditor")) return;
    let text: string | undefined;
    if (record.widgetLines !== undefined) {
      if (!Array.isArray(record.widgetLines)) return;
      // Even empty lines consume JSON bytes; cap iteration before joining/serializing.
      if (record.widgetLines.length > TEXT_BYTES + 1) return "unsafe";
      const lines: string[] = [];
      let bytes = 0;
      for (let index = 0; index < record.widgetLines.length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(record.widgetLines, String(index));
        if (!descriptor || !("value" in descriptor) || typeof descriptor.value !== "string") return;
        bytes += Buffer.byteLength(descriptor.value) + (index ? 1 : 0);
        if (bytes > TEXT_BYTES) return "unsafe";
        lines.push(descriptor.value);
      }
      if (Reflect.ownKeys(record.widgetLines).length !== lines.length + 1) return;
      record.widgetLines = lines;
      text = lines.join("\n");
    }
    parsed = { kind: "widget", level: "info", key: record.widgetKey, text };
  } else {
    const text = record.method === "setTitle" ? record.title : record.text;
    if (typeof text !== "string") return;
    parsed = { kind: record.method === "setTitle" ? "title" : "editor-text", level: "info", text };
  }
  if ((parsed.key !== undefined && !safeText(parsed.key))
    || (parsed.text !== undefined && (Buffer.byteLength(parsed.text) > TEXT_BYTES || !safeText(parsed.text)))) return "unsafe";
  // All remaining fields are bounded primitives or our copied bounded string array.
  if (Buffer.byteLength(JSON.stringify(record)) > FRAME_BYTES) return "unsafe";
  return parsed;
}

/** Bounded lifecycle-local feedback only. No RPC responses, timers, draft or title effects. */
export function createExtensionFeedback(): {
  accept(value: unknown): boolean;
  snapshot(): { feedback: ExtensionFeedback[]; omittedFeedback: number };
  reset(): void;
} {
  const entries: Entry[] = [];
  let sequence = 0;
  let omittedFeedback = 0;
  const omit = () => { omittedFeedback = Math.min(Number.MAX_SAFE_INTEGER, omittedFeedback + 1); };
  function append(parsed: Parsed & { text: string }): boolean {
    // Never wrap/reuse an identity, including across reset. Exhaustion fails closed.
    if (sequence === Number.MAX_SAFE_INTEGER) { omit(); return false; }
    entries.push({ key: parsed.key, feedback: { id: `feedback-${++sequence}`, kind: parsed.kind, level: parsed.level, text: parsed.text } });
    const limit = parsed.kind === "status" ? 8 : parsed.kind === "widget" ? 4 : 16;
    while (entries.filter(entry => entry.feedback.kind === parsed.kind).length > limit) {
      entries.splice(entries.findIndex(entry => entry.feedback.kind === parsed.kind), 1);
      omit();
    }
    while (entries.length > 16 || entries.reduce((sum, entry) => sum + Buffer.byteLength(entry.feedback.text), 0) > FRAME_BYTES) {
      entries.shift();
      omit();
    }
    return true;
  }
  return {
    accept(value) {
      let parsed: ReturnType<typeof parse>;
      try { parsed = parse(value); } catch { return false; }
      if (!parsed) return false;
      if (parsed === "unsafe") {
        omit();
        append({ kind: "notify", level: "warning", text: WARNING });
        return false;
      }
      // Validate fully before replacing/clearing. Keys are retained only with their bounded entry.
      if (parsed.key !== undefined) {
        const index = entries.findIndex(entry => entry.key === parsed.key && entry.feedback.kind === parsed.kind);
        if (index >= 0) entries.splice(index, 1);
      }
      if (parsed.text === undefined) return true;
      return append({ ...parsed, text: parsed.text });
    },
    snapshot: () => ({ feedback: entries.map(entry => ({ ...entry.feedback })), omittedFeedback }),
    reset() { entries.length = 0; omittedFeedback = 0; },
  };
}
