import { createPiRpcRuntime } from "../pi-rpc-runtime.js";
import { createMemoryConnection, createMemoryProcess, type MemoryConnection } from "./memory-process.js";

export function compactionFixture() {
  let connection: MemoryConnection;
  let compact: { id: string; type: string } | undefined;
  const requests: { id: string; type: string; customInstructions?: string }[] = [];
  let onAbort: (() => void) | undefined;
  const memory = createMemoryProcess(input => {
    connection = createMemoryConnection((line, done) => {
      const request = JSON.parse(line); requests.push(request);
      queueMicrotask(() => {
        if (request.type === "compact") { compact = request; return; }
        if (request.type === "get_state") connection.frame({ type: "extension_ui_request", method: "notify", message: JSON.stringify({ protocol: "pi-vscode-approval", version: 1, kind: "hello", runtime: input.env.PI_VSCODE_GATE_ID, cwd: input.cwd }) });
        if (request.type === "abort") onAbort?.();
        const data = request.type === "get_commands" ? { commands: [] }
          : request.type === "get_available_models" ? { models: [] }
          : request.type === "get_available_thinking_levels" ? { levels: [] }
          : request.type === "get_state" ? { sessionId: "fixture-id", sessionFile: "/fixture/session" }
          : request.type === "clear_queue" ? { steering: [], followUp: [] } : undefined;
        connection.frame({ type: "response", id: request.id, command: request.type, success: true, data });
      });
      done(); return true;
    });
    return connection;
  });
  const runtime = createPiRpcRuntime({ process: memory.process, cliPath: () => "fixture", startupModel: () => undefined, gateAccess: async () => undefined });
  return {
    runtime, requests, memory,
    start: () => runtime.start({ cwd: "/project", projectTrust: "no-approve" }),
    frame: (value: unknown) => connection.frame(value),
    lose: () => connection.lose(),
    onAbort: (handler: () => void) => { onAbort = handler; },
    complete(success = true, aborted = false) {
      if (!compact) throw new Error("No compact request");
      connection.frame({ type: "compaction_end", reason: "manual", aborted, willRetry: false, ...(success || aborted ? {} : { errorMessage: "synthetic failure" }) });
      connection.frame({ type: "response", id: compact.id, command: "compact", success,
        ...(success ? { data: { summary: "BODY_NOT_PROJECTED", firstKeptEntryId: "entry", tokensBefore: 500, estimatedTokensAfter: 100 } } : { error: "synthetic compact error" }) });
      compact = undefined;
    },
  };
}
