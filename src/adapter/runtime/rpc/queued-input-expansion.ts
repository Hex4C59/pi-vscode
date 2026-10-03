import { execFile } from "node:child_process";
import type { QueuedInputEncoding } from "../../../extension/contracts/index.js";

/** Host-only selection from verified get_commands; never a Webview-supplied path. */
export type QueuedCommandResource = { body: string; name: string; source: "prompt" | "skill"; path: string };

export function expandQueuedCommand(worker: string, resource: QueuedCommandResource, signal?: AbortSignal): Promise<QueuedInputEncoding> {
  return new Promise(resolve => {
    if (!worker || signal?.aborted) { resolve({ ok: false, code: "runtime-unavailable" }); return; }
    const child = execFile(process.execPath, [worker, "--expand-queued-input"], {
      windowsHide: true, timeout: 10000, maxBuffer: 512 * 1024, signal,
      env: { PATH: process.env.PATH, TMPDIR: process.env.TMPDIR, SYSTEMROOT: process.env.SYSTEMROOT,
        LANG: "C.UTF-8", PI_OFFLINE: "1", PI_TELEMETRY: "0", ELECTRON_RUN_AS_NODE: "1" },
    }, (error, stdout) => {
      if (error) { resolve({ ok: false, code: "command-unavailable" }); return; }
      try {
        const result: unknown = JSON.parse(stdout);
        if (!result || typeof result !== "object" || Array.isArray(result)) throw new Error("invalid");
        const value = result as Record<string, unknown>;
        if (value.ok === true && typeof value.text === "string" && value.text.trim() && Buffer.byteLength(value.text, "utf8") <= 128 * 1024) {
          resolve({ ok: true, text: value.text }); return;
        }
        const code = value.code;
        resolve({ ok: false, code: code === "capacity" || code === "source-changed" ? code : "command-unavailable" });
      } catch { resolve({ ok: false, code: "command-unavailable" }); }
    });
    child.stdin?.on("error", () => undefined); // execFile's callback owns process/write failure.
    child.stdin?.end(JSON.stringify(resource));
  });
}
