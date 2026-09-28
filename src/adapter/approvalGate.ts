import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";

/** Public ExtensionAPI structural subset; no runtime SDK import is bundled. */
interface GateApi {
  on(event: "session_start", handler: (event: unknown, ctx: GateContext) => Promise<void>): void;
  on(event: "tool_call", handler: (event: { toolName: string; toolCallId: string; input: unknown }, ctx: GateContext) => Promise<{ block: true; reason: string } | undefined>): void;
  setActiveTools(names: string[]): void;
  getAllTools?(): unknown;
  getActiveTools?(): unknown;
}
interface GateContext {
  cwd: string;
  signal?: AbortSignal;
  ui: {
    notify(message: string, level: "info" | "error"): void;
    confirm(title: string, message: string, options: { timeout: number; signal?: AbortSignal }): Promise<boolean>;
  };
}
export const CONTROLLED_TOOLS = ["read", "write", "edit", "bash", "powershell", "grep", "find", "ls"];
export const GATE_PROTOCOL = "pi-vscode-approval";
const MAX_CUSTOM_TOOLS = 64;
const MAX_TOOL_NAME_LENGTH = 64;
const MAX_SOURCE_LENGTH = 128;
const MAX_SOURCE_PATH_LENGTH = 32_768;
const MAX_INPUT_BYTES = 32_768;
const CUSTOM_TOOL_NAME = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;
const TRUSTED_GATE_FAILURE = "Trusted tool approval is unavailable because the tool inventory could not be verified.";

type ToolInputSnapshot = { json: string; value: Record<string, unknown> };
type TrustedInventory = { customTools: string[]; activeControlledTools: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidCustomToolName(name: string): boolean {
  return name.length <= MAX_TOOL_NAME_LENGTH && CUSTOM_TOOL_NAME.test(name) && !CONTROLLED_TOOLS.includes(name);
}

/**
 * Public source metadata is only an inventory classification signal, not authentication.
 * Trusted extension code can still execute effects outside the covered tool_call hook.
 */
function validateTrustedInventory(rawTools: unknown, rawActiveTools: unknown): TrustedInventory | undefined {
  if (!Array.isArray(rawTools) || !Array.isArray(rawActiveTools)) return;
  const names = new Set<string>();
  const customTools: string[] = [];
  for (const rawTool of rawTools) {
    if (!isRecord(rawTool) || typeof rawTool.name !== "string" || !isRecord(rawTool.sourceInfo)) return;
    const name = rawTool.name;
    const source = rawTool.sourceInfo.source;
    const sourcePath = rawTool.sourceInfo.path;
    if (name.length === 0 || name.length > MAX_TOOL_NAME_LENGTH || !CUSTOM_TOOL_NAME.test(name)
      || typeof source !== "string" || source.length === 0 || source.length > MAX_SOURCE_LENGTH
      || typeof sourcePath !== "string" || sourcePath.length === 0 || sourcePath.length > MAX_SOURCE_PATH_LENGTH
      || source.includes("\0") || sourcePath.includes("\0") || names.has(name)) return;

    names.add(name);
    if (CONTROLLED_TOOLS.includes(name)) {
      if (source !== "builtin" || sourcePath !== `<builtin:${name}>`) return;
      continue;
    }
    if (!isValidCustomToolName(name) || source.toLowerCase() === "builtin" || /^<builtin:/i.test(sourcePath)) return;
    customTools.push(name);
    if (customTools.length > MAX_CUSTOM_TOOLS) return;
  }

  const activeNames = new Set<string>();
  for (const rawName of rawActiveTools) {
    if (typeof rawName !== "string" || !names.has(rawName) || activeNames.has(rawName)) return;
    activeNames.add(rawName);
  }

  return {
    customTools,
    activeControlledTools: CONTROLLED_TOOLS.filter((name) => activeNames.has(name)),
  };
}

function snapshotInput(value: unknown): ToolInputSnapshot | undefined {
  if (!isRecord(value)) return;
  try {
    const json = JSON.stringify(value);
    if (typeof json !== "string" || Buffer.byteLength(json, "utf8") > MAX_INPUT_BYTES) return;
    const parsed: unknown = JSON.parse(json);
    if (!isRecord(parsed)) return;
    return { json, value: parsed };
  } catch {
    return;
  }
}

export default function approvalGate(pi: GateApi): void {
  let ready = false;
  let trustedCustomTools = new Set<string>();
  const runtime = process.env.PI_VSCODE_GATE_ID;
  // The host supplies this variable; the Webview cannot select a gate profile.
  const trustedProfile = process.env.PI_VSCODE_EXTENSION_PROFILE === "trusted";
  const timeout = Number(process.env.PI_VSCODE_GATE_TIMEOUT) || 120_000;
  pi.on("session_start", async (_event, ctx) => {
    ready = false;
    trustedCustomTools = new Set();
    // CLI allowlist defines availability; this handler gates every execution.
    if (!runtime) return;
    if (trustedProfile) {
      try {
        if (typeof pi.getAllTools !== "function" || typeof pi.getActiveTools !== "function") throw new Error();
        const inventory = validateTrustedInventory(pi.getAllTools(), pi.getActiveTools());
        if (!inventory) throw new Error();
        pi.setActiveTools([...inventory.activeControlledTools, ...inventory.customTools]);
        trustedCustomTools = new Set(inventory.customTools);
        ctx.ui.notify(JSON.stringify({
          protocol: GATE_PROTOCOL,
          version: 1,
          kind: "hello",
          runtime,
          cwd: ctx.cwd,
          profile: "trusted",
          customTools: inventory.customTools,
        }), "info");
        ready = true;
      } catch {
        ready = false;
        trustedCustomTools = new Set();
        try {
          ctx.ui.notify(TRUSTED_GATE_FAILURE, "error");
        } catch {
          // Readiness remains false even when the fixed failure notice cannot be delivered.
        }
      }
      return;
    }
    ready = true;
    ctx.ui.notify(JSON.stringify({ protocol: GATE_PROTOCOL, version: 1, kind: "hello", runtime, cwd: ctx.cwd }), "info");
  });
  pi.on("tool_call", async (event, ctx) => {
    const denied: { block: true; reason: string } = { block: true, reason: "Tool was not approved." };
    if (!ready || !runtime || ctx.signal?.aborted || typeof event.toolName !== "string"
      || typeof event.toolCallId !== "string" || event.toolCallId.length === 0 || event.toolCallId.length > 200) return denied;
    const isControlledTool = CONTROLLED_TOOLS.includes(event.toolName);
    const isTrustedCustomTool = trustedProfile && trustedCustomTools.has(event.toolName);
    if (!isControlledTool && !isTrustedCustomTool) return denied;
    const snapshot = snapshotInput(event.input);
    if (!snapshot) return denied;
    const call = {
      protocol: GATE_PROTOCOL,
      version: 1,
      kind: "call",
      runtime,
      cwd: ctx.cwd,
      request: randomUUID(),
      toolCallId: event.toolCallId,
      tool: event.toolName,
      input: snapshot.value,
    };
    const message = JSON.stringify(isTrustedCustomTool ? { ...call, category: "custom" } : call);
    const allowed = await ctx.ui.confirm("Tool approval", message, { timeout, signal: ctx.signal });
    const currentSnapshot = snapshotInput(event.input);
    if (!allowed || ctx.signal?.aborted || !currentSnapshot || snapshot.json !== currentSnapshot.json) return denied;
    return undefined;
  });
}
