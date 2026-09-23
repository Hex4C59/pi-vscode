/** Pure host-owned contract for the bundled approval gate. No authorization policy or I/O. */
export interface GateCall { runtime: string; cwd: string; request: string; toolCallId: string; tool: string; input: Record<string, unknown> }
const tools = new Set(["read", "write", "edit", "bash", "powershell", "grep", "find", "ls"]);
export function parseGateEnvelope(value: unknown): (GateCall & { kind: "call" }) | { kind: "hello"; runtime: string; cwd: string } | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const e = value as Record<string, unknown>;
  if (e.protocol !== "pi-vscode-approval" || e.version !== 1 || typeof e.runtime !== "string" || typeof e.cwd !== "string") return;
  if (e.kind === "hello") return {kind:"hello", runtime:e.runtime, cwd:e.cwd};
  if(e.kind !== "call" || typeof e.request !== "string" || e.request.length > 100 || typeof e.toolCallId !== "string" || e.toolCallId.length > 200 || typeof e.tool !== "string" || !tools.has(e.tool) || !e.input || typeof e.input !== "object" || Array.isArray(e.input)) return;
  return {kind:"call", runtime:e.runtime,cwd:e.cwd,request:e.request,toolCallId:e.toolCallId,tool:e.tool,input:e.input as Record<string,unknown>};
}
