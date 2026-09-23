import { StringDecoder } from "node:string_decoder";
import type { ChatLine } from "../../extension/contracts/webviewProtocol.js";
import type { SavedHistoryPage, SavedHistoryPreview } from "../../extension/contracts/sessionBackend.js";

function record(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Object.values(descriptors).some(field => !Object.hasOwn(field, "value"))) return;
  return value as Record<string, unknown>;
}
function bounded(text: string): string {
  const bytes = Buffer.from(text.slice(0, 4096), "utf8"); if (text.length <= 4096 && bytes.length <= 4096) return text;
  const notice = "\n[Historical text truncated — full content is not shown here.]";
  return new StringDecoder("utf8").write(bytes.subarray(0, 4096 - Buffer.byteLength(notice))) + notice;
}
function structured(value: unknown, depth = 0): unknown {
  if (value === null || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) return value;
  if (typeof value === "string") return value.length <= 256 ? value : value.slice(0, 256) + " [truncated]";
  if (depth >= 3) return "[Unsupported or deeper structured content omitted]";
  if (Array.isArray(value)) return [...value.slice(0, 16).map(item => structured(item, depth + 1)), ...(value.length > 16 ? ["[Additional values omitted]"] : [])];
  const object = record(value); if (!object) return "[Unsupported structured content]";
  const entries = Object.entries(object);
  return Object.fromEntries([...entries.slice(0, 16).map(([key, item]) => [key.slice(0, 80), sensitiveKey(key) ? "[redacted]" : structured(item, depth + 1)]), ...(entries.length > 16 ? [["omitted", "Additional fields omitted"]] : [])]);
}
function sensitiveKey(key: string): boolean {
  return /apikey|authorization|password|secret|token|cookie|privatekey|accesskey|credential|passphrase|signingkey|clientkey/.test(key.replace(/[^a-z0-9]/gi, "").toLowerCase());
}
function* contentParts(value: unknown, expanded: boolean, user: boolean): Generator<string> {
  if (typeof value === "string") { if (user) yield* retainedContextParts(value); else yield value; return; }
  if (!Array.isArray(value)) { yield "[Unsupported historical content]"; return; }
  const count = expanded ? value.length : Math.min(32, value.length);
  for (let i = 0; i < count; i++) {
    if (i) yield "\n";
    const part = record(value[i]);
    if (!part) { yield "[Unsupported historical content]"; continue; }
    if (part.type === "text" && typeof part.text === "string") { if (user) yield* retainedContextParts(part.text); else yield part.text; }
    else if (part.type === "thinking" && typeof part.thinking === "string") { yield "[Historical thinking]\n"; yield part.thinking; }
    else if (part.type === "toolCall") { yield "[Historical tool call: " + (typeof part.name === "string" ? part.name.slice(0,80) : "unknown") + "]\n"; yield JSON.stringify(structured(part.arguments)); }
    else yield "[Unsupported historical content omitted]";
  }
  if (count < value.length) yield "\n[Additional historical content blocks omitted]";
}
function* messageParts(entry: Record<string, unknown>, expanded: boolean): Generator<string> {
  const message = record(entry.message);
  if (entry.type === "message" && message) {
    if (message.role === "toolResult") yield "[Historical tool " + (typeof message.toolName === "string" ? message.toolName.slice(0,80) : "unknown") + " · " + (message.isError === true ? "failed" : message.isError === false ? "complete" : "outcome unknown") + "]\n";
    else if (message.role !== "user" && message.role !== "assistant") yield "[Historical " + (typeof message.role === "string" ? message.role.slice(0,80) : "unsupported message") + "]\n";
    yield* contentParts(message.content, expanded, message.role === "user");
  } else if (entry.type === "custom_message") {
    yield "[Historical custom message: " + (typeof entry.customType === "string" ? entry.customType.slice(0,80) : "unknown") + "]\n";
    yield* contentParts(entry.content, expanded, false);
    if (entry.details !== undefined) { yield "\n"; yield JSON.stringify(structured(entry.details)); }
  } else if (entry.type === "compaction" || entry.type === "branch_summary") {
    yield "[Historical " + entry.type + " summary]\n";
    yield typeof entry.summary === "string" ? entry.summary : "[Summary unavailable]";
  } else yield "[Unsupported historical message]";
}
function line(entry: Record<string, unknown>, index: number): ChatLine {
  let text = "";
  // Consume only enough text to decide the bounded overview; never join whole tool outputs.
  for (const part of messageParts(entry, false)) { text += part.slice(0, 4097-text.length); if (text.length >= 4097) break; }
  const message = record(entry.message);
  const id = typeof entry.id === "string" && /^[A-Za-z0-9_-]{1,90}$/.test(entry.id) ? "saved-" + entry.id : "saved-entry-" + index;
  return { id, role: message?.role === "user" ? "user" : "assistant", text: bounded(text) };
}
function presentationEntries(branch: unknown[]): Record<string, unknown>[] {
  return branch.map(record).filter((entry): entry is Record<string, unknown> => {
    if (!entry || typeof entry.type !== "string" || !["message", "custom_message", "compaction", "branch_summary"].includes(entry.type)) return false;
    if (entry.type === "custom_message" && entry.display === false) return false;
    const message = record(entry.message);
    return !(entry.type === "message" && message?.role === "custom" && message.display === false);
  });
}
/** Render-only window over the public SDK active branch; never edits pi/model context. */
export function projectSavedHistory(branch: unknown[], page = 0): SavedHistoryPage {
  if (!Number.isSafeInteger(page) || page < 0) throw new Error("Invalid history page");
  const entries = presentationEntries(branch), total = entries.length;
  if (page > Math.max(0, Math.ceil(total / 32) - 1)) throw new Error("Stale history page");
  const end = Math.max(0, total - page * 32), start = Math.max(0, end - 32);
  return { messages: entries.slice(start,end).map((entry,index) => line(entry,start+index)), page, total };
}
/** Decode only our bounded public prompt text, not a session-file format or file capability. */
function* retainedContextParts(text: string): Generator<string> {
  const prefix = "User task with explicit untrusted file context. JSON data follows:\n";
  if (!text.startsWith(prefix)) { yield text; return; }
  let payload: Record<string,unknown> | undefined;
  if (text.length <= 8*1024*1024) { try { payload = record(JSON.parse(text.slice(prefix.length)) as unknown); } catch { /* Literal fallback below. */ } }
  if (!payload || typeof payload.body !== "string" || !Array.isArray(payload.attachments) || payload.attachments.length > 20) {
    yield "[Historical attachment information unavailable; original retained text follows]\n"; yield text; return;
  }
  yield payload.body;
  for (const value of payload.attachments) {
    yield "\n\n";
    const attachment = record(value);
    if (!attachment) { yield "[Historical attachment text unavailable; not today's file]"; continue; }
    const kind = attachment.kind === "selection" || attachment.kind === "file" ? attachment.kind : null;
    const name = typeof attachment.path === "string" ? attachment.path.slice(0,1024) : "source name unavailable";
    yield kind ? "[Historical " + kind + " attachment snapshot: " + name + " — retained text, not today's file]" : "[Historical attachment kind unavailable or unsupported; source: " + name + " — retained literal text, not today's file]";
    if (attachment.kind === "selection" && attachment.originalRange) yield "\nRecorded range: " + JSON.stringify(structured(attachment.originalRange));
    yield "\n"; yield typeof attachment.text === "string" ? attachment.text : "[Historical attachment text unavailable]";
  }
}
/** Offset-aware traversal retains only the requested chunk, not the complete historical text. */
export function projectSavedHistoryPreview(branch: unknown[], index: number, offset: number): SavedHistoryPreview {
  const entries = presentationEntries(branch);
  if (!Number.isSafeInteger(index) || index < 0 || index >= entries.length || !Number.isSafeInteger(offset) || offset < 0) throw new Error("Invalid historical text request");
  let totalChars = 0; const chunks: string[] = []; const from = Math.max(0, offset-1), until = Math.min(Number.MAX_SAFE_INTEGER,offset+8193);
  for (const part of messageParts(entries[index], true)) {
    const end = totalChars + part.length;
    if (!Number.isSafeInteger(end)) throw new Error("Historical text size unavailable");
    if (end > from && totalChars < until) chunks.push(part.slice(Math.max(0,from-totalChars),Math.min(part.length,until-totalChars)));
    totalChars = end;
  }
  if (offset > totalChars) throw new Error("Stale historical text offset");
  const window = chunks.join(""), prefix = offset > 0 ? 1 : 0;
  if (prefix && /[\uDC00-\uDFFF]/.test(window.charAt(prefix)) && /[\uD800-\uDBFF]/.test(window.charAt(prefix-1))) throw new Error("Stale historical text offset");
  let text = window.slice(prefix,prefix+8192);
  if (offset+text.length < totalChars && /[\uD800-\uDBFF]/.test(text.charAt(text.length-1)) && /[\uDC00-\uDFFF]/.test(window.charAt(prefix+text.length))) text = text.slice(0,-1);
  return { text, offset, nextOffset: offset+text.length, done: offset+text.length === totalChars, totalChars };
}
