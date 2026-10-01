import type { QueuedTextSnapshot } from "../../../extension/contracts/index.js";
/** Correlation retains at most the existing plain-chat character budget. */
const MAX_CORRELATED_USER_TEXT_CHARS = 8000;

export const MAX_QUEUED_TEXT_RECORDS = 32;
export const MAX_QUEUED_TEXT_BYTES = 256 * 1024;

/** Shared decoding for public queue_update and clear_queue; never truncate recall data. */
export function parseQueuedTextSnapshot(value: unknown): QueuedTextSnapshot | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const { steering, followUp } = value as Record<string, unknown>;
  if (!Array.isArray(steering) || !Array.isArray(followUp)
    || steering.length + followUp.length > MAX_QUEUED_TEXT_RECORDS) return undefined;
  let bytes = 0;
  const arrays: string[][] = [];
  for (const input of [steering, followUp]) {
    const texts: string[] = [];
    for (const text of input) {
      if (typeof text !== "string") return undefined;
      bytes += Buffer.byteLength(text, "utf8");
      if (bytes > MAX_QUEUED_TEXT_BYTES) return undefined;
      texts.push(text);
    }
    arrays.push(texts);
  }
  return { steering: arrays[0], followUp: arrays[1] };
}

/** Only lossless, bounded, text-only user input can correlate a queue removal. */
export function parseConsumedUserText(value: unknown): { text: string | null } | undefined {
  if (typeof value === "string") return { text: value.length <= MAX_CORRELATED_USER_TEXT_CHARS ? value : null };
  if (!Array.isArray(value)) return undefined;
  let length = 0;
  let plain = true;
  const texts: string[] = [];
  for (const part of value) {
    if (!part || typeof part !== "object" || Array.isArray(part)
      || typeof part.type !== "string" || !part.type) return undefined;
    if (part.type !== "text") { plain = false; continue; }
    if (typeof part.text !== "string") return undefined;
    length += part.text.length;
    if (length <= MAX_CORRELATED_USER_TEXT_CHARS) texts.push(part.text);
  }
  return { text: plain && length <= MAX_CORRELATED_USER_TEXT_CHARS ? texts.join("") : null };
}
