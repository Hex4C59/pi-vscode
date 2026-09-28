import { connect } from "node:net";
import { runtimeControlPath } from "./control-protocol.js";

/** A control ACK is admission only. Callers still require the matching durable exit receipt. */
export function requestOwnedEnd(directory: string, runId: string): Promise<boolean> {
  return new Promise(resolve => {
    const socket = connect(runtimeControlPath(directory, runId));
    let buffer = Buffer.alloc(0);
    let finished = false;
    const finish = (ok: boolean): void => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      socket.destroy();
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), 1500);
    socket.once("connect", () => {
      socket.write(JSON.stringify({ version: 1, runId, action: "end" }) + "\n", error => { if (error) finish(false); });
    });
    socket.on("error", () => finish(false));
    socket.on("close", () => finish(false));
    socket.on("data", chunk => {
      if (buffer.length + chunk.length > 4096) { finish(false); return; }
      buffer = Buffer.concat([buffer, chunk]);
      const newline = buffer.indexOf(10);
      if (newline < 0) return;
      try {
        const value: unknown = JSON.parse(buffer.subarray(0, newline).toString("utf8"));
        if (!value || typeof value !== "object" || Array.isArray(value)) { finish(false); return; }
        const record = value as Record<string, unknown>;
        finish(Object.keys(record).length === 4 && record.version === 1 && record.runId === runId
          && record.endRequested === true && typeof record.state === "string"
          && ["owned", "owner-lost", "exited", "never-spawned", "termination-unconfirmed"].includes(record.state));
      } catch { finish(false); }
    });
  });
}
