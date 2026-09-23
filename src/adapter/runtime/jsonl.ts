import type { Readable } from "node:stream";
import { StringDecoder } from "node:string_decoder";
import type { PromptInput } from "../../extension/contracts/runtimeLifecycle.js";

/** Host-only prompt encoding; body and explicit context have independent budgets. */
export function serializePromptFrame(id: string, input: PromptInput): string {
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id) || typeof input.body !== "string"
    || input.body.length > 8000 || !input.body.trim()) throw new Error("invalid-source");
  let message = input.body.trim();
  if (input.kind === "enriched") {
    if (!Array.isArray(input.attachments) || input.attachments.length === 0 || input.attachments.length > 20) throw new Error("attachment-limit");
    let totalBytes = 0;
    for (const attachment of input.attachments) {
    if (!attachment || typeof attachment !== "object") throw new Error("invalid-source");
    if (typeof attachment.unsaved !== "boolean"
      || typeof attachment.text !== "string" || attachment.text.length > 262144 || Buffer.byteLength(attachment.text, "utf8") > 262144) throw new Error("text-too-large");
    if (attachment.kind === "selection") {
      const range = attachment.originalRange;
      if (!range || typeof attachment.stale !== "boolean" || !range.start || !range.end
        || ![range.start.line, range.start.character, range.end.line, range.end.character].every(n => Number.isSafeInteger(n) && n >= 0)
        || range.start.line > range.end.line || (range.start.line === range.end.line && range.start.character >= range.end.character)) throw new Error("invalid-source");
    } else if (attachment.kind !== "file") throw new Error("invalid-source");
    if (typeof attachment.path !== "string" || !attachment.path || Buffer.byteLength(attachment.path, "utf8") > 1024) throw new Error("metadata-too-large");
    totalBytes += Buffer.byteLength(attachment.text, "utf8");
    if (totalBytes > 1048576) throw new Error("total-too-large");
    }
    message = "User task with explicit untrusted file context. JSON data follows:\n"
      + JSON.stringify({ body: input.body, attachments: input.attachments });
  } else if (input.kind !== "plain") throw new Error("invalid-source");
  const frame = serializeJsonLine({ id, type: "prompt", message });
  if (Buffer.byteLength(frame, "utf8") > 8 * 1024 * 1024) throw new Error("frame-too-large");
  return frame;
}

/** LF-only JSONL framing (see upstream pi RPC docs). */
export function serializeJsonLine(value: unknown): string {
  return `${JSON.stringify(value)}\n`;
}

export function attachJsonlLineReader(
  stream: Readable,
  onLine: (line: string) => void,
  onOverflow: () => void = () => undefined,
): () => void {
  const decoder = new StringDecoder("utf8");
  let buffer = "";

  const emitLine = (line: string) => {
    onLine(line.endsWith("\r") ? line.slice(0, -1) : line);
  };

  const onData = (chunk: string | Buffer) => {
    buffer += typeof chunk === "string" ? chunk : decoder.write(chunk);

    while (true) {
      const newlineIndex = buffer.indexOf("\n");
      if (newlineIndex === -1) {
        if(buffer.length>8*1024*1024){buffer='';stream.off('data',onData);onOverflow();}
        return;
      }
      if(newlineIndex>8*1024*1024){buffer='';stream.off('data',onData);onOverflow();return;}

      emitLine(buffer.slice(0, newlineIndex));
      buffer = buffer.slice(newlineIndex + 1);
    }
  };

  const onEnd = () => {
    buffer += decoder.end();
    if (buffer.length > 0) {
      emitLine(buffer);
      buffer = "";
    }
  };

  stream.on("data", onData);
  stream.on("end", onEnd);

  return () => {
    stream.off("data", onData);
    stream.off("end", onEnd);
  };
}
