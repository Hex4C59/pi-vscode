import { randomUUID } from "node:crypto";

/** Public ExtensionAPI structural subset; no runtime SDK import is bundled. */
interface GateApi {
  on(event: "session_start", handler: (event: unknown, ctx: GateContext) => Promise<void>): void;
  on(event: "tool_call", handler: (event: { toolName: string; toolCallId: string; input: unknown }, ctx: GateContext) => Promise<{ block: true; reason: string } | undefined>): void;
  setActiveTools(names: string[]): void;
}
interface GateContext {
  cwd: string;
  signal?: AbortSignal;
  ui: { notify(message: string, level: "info"): void; confirm(title: string, message: string, options: { timeout: number; signal?: AbortSignal }): Promise<boolean> };
}
export const CONTROLLED_TOOLS = ["read", "write", "edit", "bash", "powershell", "grep", "find", "ls"];
export const GATE_PROTOCOL = "pi-vscode-approval";
export default function approvalGate(pi: GateApi): void {
  let ready = false;
  const runtime = process.env.PI_VSCODE_GATE_ID;
  const timeout = Number(process.env.PI_VSCODE_GATE_TIMEOUT) || 120_000;
  pi.on("session_start", async (_event, ctx) => {
    ready = false;
    // CLI allowlist defines availability; this handler gates every execution.
    if (!runtime) return;
    ready = true;
    ctx.ui.notify(JSON.stringify({ protocol: GATE_PROTOCOL, version: 1, kind: "hello", runtime, cwd: ctx.cwd }), "info");
  });
  pi.on("tool_call", async (event, ctx) => {
    const denied = { block: true as const, reason: "Tool was not approved." };
    if (!ready || !runtime || ctx.signal?.aborted || !CONTROLLED_TOOLS.includes(event.toolName)) return denied;
    const snapshot = JSON.stringify(event.input);
    if (snapshot.length > 32_768) return denied;
    const allowed = await ctx.ui.confirm("Tool approval", JSON.stringify({ protocol: GATE_PROTOCOL, version: 1, kind: "call", runtime, cwd: ctx.cwd, request: randomUUID(), toolCallId: event.toolCallId, tool: event.toolName, input: event.input }), { timeout, signal: ctx.signal });
    if (!allowed || ctx.signal?.aborted || snapshot !== JSON.stringify(event.input)) return denied;
    return undefined;
  });
}
