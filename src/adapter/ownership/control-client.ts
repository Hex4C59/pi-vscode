import { connect } from "node:net";
import { runtimeControlPath } from "./control-protocol.js";
import type { RetainedRunState } from "./types.js";

/** Supervisor states the control endpoint may report for the recorded run. */
const STATES: readonly RetainedRunState[] = ["owned", "owner-lost", "exited", "never-spawned", "termination-unconfirmed"];

/**
 * One bounded control round-trip. A response is admission evidence only: callers still
 * require the matching durable exit receipt, and observation never requests termination.
 */
function requestControl(directory: string, runId: string, action: "observe" | "end"): Promise<{ state: RetainedRunState; endRequested: boolean } | undefined> {
  return new Promise(resolve => {
    const socket = connect(runtimeControlPath(directory, runId));
    let buffer = Buffer.alloc(0);
    let finished = false;
    const finish = (value: { state: RetainedRunState; endRequested: boolean } | undefined): void => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      socket.destroy();
      resolve(value);
    };
    const timer = setTimeout(() => finish(undefined), 1500);
    socket.once("connect", () => {
      socket.write(JSON.stringify({ version: 1, runId, action }) + "\n", error => { if (error) finish(undefined); });
    });
    socket.on("error", () => finish(undefined));
    socket.on("close", () => finish(undefined));
    socket.on("data", chunk => {
      if (buffer.length + chunk.length > 4096) { finish(undefined); return; }
      buffer = Buffer.concat([buffer, chunk]);
      const newline = buffer.indexOf(10);
      if (newline < 0) return;
      try {
        const value: unknown = JSON.parse(buffer.subarray(0, newline).toString("utf8"));
        if (!value || typeof value !== "object" || Array.isArray(value)) { finish(undefined); return; }
        const record = value as Record<string, unknown>;
        finish(Object.keys(record).length === 4 && record.version === 1 && record.runId === runId
          && typeof record.state === "string" && STATES.includes(record.state as RetainedRunState)
          && typeof record.endRequested === "boolean"
          ? { state: record.state as RetainedRunState, endRequested: record.endRequested }
          : undefined);
      } catch { finish(undefined); }
    });
  });
}

/** A control ACK is admission only. Callers still require the matching durable exit receipt. */
export async function requestOwnedEnd(directory: string, runId: string): Promise<boolean> {
  const response = await requestControl(directory, runId, "end");
  return response?.endRequested === true;
}

/** Read-only supervision state; it never asks the retained run to end. */
export async function requestOwnedObservation(directory: string, runId: string): Promise<RetainedRunState | undefined> {
  const response = await requestControl(directory, runId, "observe");
  return response?.state;
}
