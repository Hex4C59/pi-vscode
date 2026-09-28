/** Pure host-owned contract for the bundled approval gate. No authorization policy or I/O. */
export interface GateCall {
  runtime: string;
  cwd: string;
  request: string;
  toolCallId: string;
  tool: string;
  input: Record<string, unknown>;
  category?: "custom";
}
export interface GateHello {
  kind: "hello";
  runtime: string;
  cwd: string;
  profile?: "trusted";
  customTools?: string[];
}
const tools = new Set(["read", "write", "edit", "bash", "powershell", "grep", "find", "ls"]);
const MAX_CUSTOM_TOOLS = 64;
const CUSTOM_TOOL_NAME = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidCustomToolName(value: unknown): value is string {
  return typeof value === "string" && CUSTOM_TOOL_NAME.test(value) && !tools.has(value);
}

function validCustomTools(value: unknown): value is string[] {
  if (!Array.isArray(value) || value.length > MAX_CUSTOM_TOOLS) return false;
  const names = new Set<string>();
  for (const name of value) {
    if (!isValidCustomToolName(name) || names.has(name)) return false;
    names.add(name);
  }
  return true;
}

export function parseGateEnvelope(value: unknown): (GateCall & { kind: "call" }) | GateHello | undefined {
  if (!isRecord(value)) return;
  const e = value;
  if (e.protocol !== "pi-vscode-approval" || e.version !== 1 || typeof e.runtime !== "string" || typeof e.cwd !== "string") return;
  if (e.kind === "hello") {
    const hasProfile = Object.prototype.hasOwnProperty.call(e, "profile");
    const hasCustomTools = Object.prototype.hasOwnProperty.call(e, "customTools");
    if (!hasProfile && !hasCustomTools) return { kind: "hello", runtime: e.runtime, cwd: e.cwd };
    if (e.profile !== "trusted" || !hasCustomTools || !validCustomTools(e.customTools)) return;
    return { kind: "hello", runtime: e.runtime, cwd: e.cwd, profile: "trusted", customTools: e.customTools };
  }
  if (e.kind !== "call" || typeof e.request !== "string" || e.request.length > 100
    || typeof e.toolCallId !== "string" || e.toolCallId.length > 200
    || typeof e.tool !== "string" || !isRecord(e.input)) return;
  const hasCategory = Object.prototype.hasOwnProperty.call(e, "category");
  if (tools.has(e.tool)) {
    if (hasCategory) return;
  } else if (e.category !== "custom" || !isValidCustomToolName(e.tool)) {
    return;
  }
  return {
    kind: "call",
    runtime: e.runtime,
    cwd: e.cwd,
    request: e.request,
    toolCallId: e.toolCallId,
    tool: e.tool,
    ...(e.category === "custom" ? { category: "custom" } : {}),
    input: e.input,
  };
}
