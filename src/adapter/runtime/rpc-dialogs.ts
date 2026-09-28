import type { InteractionFormInput, InteractionReplyCallback } from "../../extension/interactions/index.js";
import { serializeJsonLine } from "./jsonl.js";

type OpenResult = { kind: "dialog"; form: InteractionFormInput; reply: InteractionReplyCallback } | { kind: "duplicate" } | { kind: "rejected"; code?: "identity-budget"; cancellation?: Promise<void> };
function safeText(value: unknown, limit: number): value is string {
  return typeof value === "string" && Buffer.byteLength(value, "utf8") <= limit
    && !/-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/i.test(value)
    && !/["']?(?:api[_ -]?key|authorization|password|secret|access[_ -]?token)["']?\s*[:=]\s*["']?[^\s"',;}]+/i.test(value)
    && !/\bBearer\s+[\w.+/=-]+/i.test(value);
}
function readForm(record: Record<string, unknown>): InteractionFormInput | undefined {
  if (!safeText(record.title, 512)) return;
  if (record.timeout !== undefined && (typeof record.timeout !== "number" || !Number.isFinite(record.timeout) || record.timeout < 0 || record.timeout > 86_400_000)) return;
  const specific: Record<string, string[]> = { select: ["options"], confirm: ["message"], input: ["placeholder"], editor: ["prefill"] };
  if (typeof record.method !== "string" || !Object.hasOwn(specific, record.method)) return;
  const allowed = ["type", "id", "method", "title", "timeout", ...specific[record.method]];
  if (Object.keys(record).some(key => !allowed.includes(key))) return;
  if (Buffer.byteLength(JSON.stringify(record)) > 65_536) return;
  const common = { title: record.title, ...(typeof record.timeout === "number" ? { timeoutMs: record.timeout } : {}) };
  if (record.method === "select" && Array.isArray(record.options) && record.options.length > 0 && record.options.length <= 64 && record.options.every(option => safeText(option, 1024))) {
    return { ...common, method: "select", options: record.options.map((label: string, index: number) => ({ id: `option-${index}`, label })) };
  }
  if (record.method === "confirm" && safeText(record.message, 32_768)) return { ...common, method: "confirm", message: record.message };
  if (record.method === "input" && (record.placeholder === undefined || safeText(record.placeholder, 32_768))) return { ...common, method: "input", ...(record.placeholder !== undefined ? { placeholder: record.placeholder } : {}) };
  if (record.method === "editor" && (record.prefill === undefined || safeText(record.prefill, 32_768))) return { ...common, method: "editor", ...(record.prefill !== undefined ? { prefill: record.prefill } : {}) };
}
export function createRpcDialogs(write: (frame: string) => void | Promise<void>): { open(value: unknown): OpenResult; invalidate(): void } {
  const seen = new Set<string>();
  let valid = true;
  return {
    invalidate() { valid = false; seen.clear(); },
    open(value) {
      if (!valid) return { kind: "rejected" };
      if (!value || typeof value !== "object" || Array.isArray(value)) return { kind: "rejected" };
      const record = value as Record<string, unknown>;
      if (record.type !== "extension_ui_request" || typeof record.id !== "string" || !record.id || Buffer.byteLength(record.id) > 200) return { kind: "rejected" };
      if (seen.has(record.id)) return { kind: "duplicate" };
      if (seen.size >= 65_536) { valid = false; return { kind: "rejected", code: "identity-budget" }; }
      seen.add(record.id);
      const form = readForm(record);
      if (!form) {
        const cancellation = ["select", "confirm", "input", "editor"].includes(String(record.method))
          ? write(serializeJsonLine({ type: "extension_ui_response", id: record.id, cancelled: true })) : undefined;
        return { kind: "rejected", ...(cancellation ? { cancellation } : {}) };
      }
      let used = false;
      return { kind: "dialog", form, reply(reply) {
        if (used || !valid) return;
        let response: Record<string, unknown> | undefined;
        if (reply.kind === "cancel") response = { type: "extension_ui_response", id: record.id, cancelled: true };
        else {
          const answer = reply.answer;
          if (answer.method === form.method) {
            if (answer.method === "select" && form.method === "select") {
              const option = form.options.find(option => option.id === answer.optionId);
              if (option) response = { type: "extension_ui_response", id: record.id, value: option.label };
            } else if (answer.method === "confirm" && typeof answer.value === "boolean") {
              response = { type: "extension_ui_response", id: record.id, confirmed: answer.value };
            } else if ((answer.method === "input" || answer.method === "editor") && typeof answer.text === "string" && Buffer.byteLength(answer.text, "utf8") <= 32_768) {
              // User-authored answers are literal input, not runtime metadata to project.
              response = { type: "extension_ui_response", id: record.id, value: answer.text };
            }
          }
        }
        if (!response) throw new Error("Invalid extension interaction answer.");
        used = true;
        return write(serializeJsonLine(response));
      } };
    },
  };
}
