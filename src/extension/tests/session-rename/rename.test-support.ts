import type { SessionBackend } from "../../contracts/index.js";
import { createPiRpcRuntime } from "../../../adapter/runtime/pi-rpc-runtime.js";
import { createMemoryConnection, createMemoryProcess, type MemoryConnection } from "../../../adapter/runtime/tests/memory-process.js";
import { folder, harness, tick } from "../harness.js";

/** External pi byte transport + native host APIs; provider/adapter/parser stay real. */
export async function renameFixture(initialName = "Original name") {
  const state = { sessionId: "opened-session", sessionFile: "/host-only/opened.jsonl", sessionName: initialName,
    isStreaming: false, isCompacting: false, pendingMessageCount: 0, messageCount: 2,
    model: { provider: "fixture", id: "synthetic", name: "Synthetic model" } };
  let connection!: MemoryConnection;
  const commands: Record<string, unknown>[] = [];
  const held = new Set<string>();
  let override: ((type: string) => Record<string, unknown> | undefined) | undefined;
  const memory = createMemoryProcess(options => {
    const transport = createMemoryConnection((line, done) => {
      const request = JSON.parse(line); commands.push(request);
      queueMicrotask(() => {
        if (held.has(request.type)) return;
        if (request.type === "get_state") transport.frame({ type: "extension_ui_request", method: "notify",
          message: JSON.stringify({ protocol: "pi-vscode-approval", version: 1, kind: "hello", runtime: options.env.PI_VSCODE_GATE_ID, cwd: options.cwd }) });
        const patched = override?.(request.type);
        if (request.type === "set_session_name" && patched?.success !== false) state.sessionName = request.name;
        const data = request.type === "get_state" ? { ...state }
          : request.type === "get_commands" ? { commands: [] }
          : request.type === "get_available_models" ? { models: [] }
          : request.type === "get_available_thinking_levels" ? { levels: [] }
          : request.type === "clear_queue" ? { steering: [], followUp: [] } : undefined;
        transport.frame({ type: "response", id: request.id, command: request.type, success: true, data, ...patched });
      });
      done(); return true;
    });
    connection = transport; return transport;
  });
  const runtime = createPiRpcRuntime({ process: memory.process, cliPath: () => "fixture", startupModel: () => undefined, gateAccess: async () => undefined });
  let lists = 0; let catalogueFails = false;
  const backend: SessionBackend = {
    async list(_cwd, page) { lists++; if (catalogueFails) return { ok: false, code: "unavailable" }; return { ok: true, page, total: 1, entries: [{ id: state.sessionId, path: state.sessionFile, name: state.sessionName, firstMessage: "Historical literal body", modified: "2026-10-02" }] }; },
    async inspect() { return { ok: false, code: "unavailable" }; },
    async history() { return { ok: false, code: "unavailable" }; },
    async preview() { return { ok: false, code: "unavailable" }; },
  };
  const h = harness([folder()], true, undefined, runtime, backend);
  const v = h.createView(); v.action("chooseResources", { choice: "decline" }); await tick(); await tick();
  if (v.state().runtime !== "ready") { h.provider.dispose(); throw new Error("Real provider/adapter fixture did not become ready."); }
  return { h, v, runtime, state, commands, memory, get connection() { return connection; }, get lists() { return lists; },
    hold(type: string) { held.add(type); }, release(type: string) { held.delete(type); },
    override(value: typeof override) { override = value; },
    failCatalogue() { catalogueFails = true; },
    async close() { h.provider.dispose(); await runtime.stop(); },
  };
}
