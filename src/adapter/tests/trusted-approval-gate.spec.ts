import assert from "node:assert/strict";
import { test } from "node:test";
import approvalGate from "../approvalGate.js";
import { parseGateEnvelope } from "../../extension/contracts/approvalProtocol.js";

const controlledTools = ["read", "write", "edit", "bash", "powershell", "grep", "find", "ls"];
const cwd = "C:/workspace";
const runtime = "runtime-fixture";

type GateContext = {
  cwd: string;
  signal?: AbortSignal;
  ui: {
    notify(message: string, level: "info" | "error"): void;
    confirm(title: string, message: string, options: { timeout: number; signal?: AbortSignal }): Promise<boolean>;
  };
};
type SessionStartHandler = (event: unknown, context: GateContext) => Promise<void>;
type ToolCallHandler = (
  event: { toolName: string; toolCallId: string; input: unknown },
  context: GateContext,
) => Promise<{ block: true; reason: string } | undefined>;
type Registration = ["session_start", SessionStartHandler] | ["tool_call", ToolCallHandler];

interface GateFixtureOptions {
  inventory?: unknown;
  activeTools?: unknown;
  inventoryApi?: "all" | "getAllTools" | "getActiveTools" | "none";
  confirmation?: (message: string) => Promise<boolean>;
}

class GateFixture {
  private sessionStartHandler: SessionStartHandler | undefined;
  private toolCallHandler: ToolCallHandler | undefined;
  private readonly inventory: unknown;
  private readonly activeToolNames: unknown;
  private readonly confirmation: (message: string) => Promise<boolean>;
  readonly notices: Array<{ message: string; level: "info" | "error" }> = [];
  readonly confirmations: Array<{ title: string; message: string; options: { timeout: number; signal?: AbortSignal } }> = [];
  readonly activeToolUpdates: string[][] = [];
  getAllTools?: () => unknown;
  getActiveTools?: () => unknown;

  constructor(options: GateFixtureOptions = {}) {
    this.inventory = Object.prototype.hasOwnProperty.call(options, "inventory")
      ? options.inventory
      : [...controlledTools.map(builtinTool), extensionTool("fixture_tool")];
    this.activeToolNames = Object.prototype.hasOwnProperty.call(options, "activeTools")
      ? options.activeTools
      : [...controlledTools];
    this.confirmation = options.confirmation ?? (async () => false);
    if (options.inventoryApi !== "none" && options.inventoryApi !== "getAllTools") this.getAllTools = () => this.inventory;
    if (options.inventoryApi !== "none" && options.inventoryApi !== "getActiveTools") this.getActiveTools = () => this.activeToolNames;
  }
  on(event: "session_start", handler: SessionStartHandler): void;
  on(event: "tool_call", handler: ToolCallHandler): void;
  on(...registration: Registration): void {
    const [event, handler] = registration;
    if (event === "session_start") this.sessionStartHandler = handler;
    else this.toolCallHandler = handler;
  }

  setActiveTools(names: string[]): void {
    this.activeToolUpdates.push(names);
  }

  context(signal?: AbortSignal): GateContext {
    return {
      cwd,
      signal,
      ui: {
        notify: (message, level) => this.notices.push({ message, level }),
        confirm: async (title, message, options) => {
          this.confirmations.push({ title, message, options });
          return this.confirmation(message);
        },
      },
    };
  }

  async start(context = this.context()): Promise<void> {
    const handler = this.sessionStartHandler;
    assert.ok(handler, "gate registers session_start");
    await handler({}, context);
  }

  async call(
    event: { toolName: string; toolCallId: string; input: unknown },
    context = this.context(),
  ): Promise<{ block: true; reason: string } | undefined> {
    const handler = this.toolCallHandler;
    assert.ok(handler, "gate registers tool_call");
    return handler(event, context);
  }
}

interface ToolMetadata { name: string; sourceInfo: { source: string; path: string } }

function builtinTool(name: string): ToolMetadata {
  return { name, sourceInfo: { source: "builtin", path: `<builtin:${name}>` } };
}

function extensionTool(name: string, source = "local", path = `C:/extensions/example/${name}.ts`): ToolMetadata {
  return { name, sourceInfo: { source, path } };
}

async function withProfile(profile: string | undefined, run: () => Promise<void>): Promise<void> {
  const previous = {
    gateId: process.env.PI_VSCODE_GATE_ID,
    timeout: process.env.PI_VSCODE_GATE_TIMEOUT,
    profile: process.env.PI_VSCODE_EXTENSION_PROFILE,
  };
  process.env.PI_VSCODE_GATE_ID = runtime;
  process.env.PI_VSCODE_GATE_TIMEOUT = "60000";
  if (profile === undefined) delete process.env.PI_VSCODE_EXTENSION_PROFILE;
  else process.env.PI_VSCODE_EXTENSION_PROFILE = profile;
  try {
    await run();
  } finally {
    restoreEnvironment("PI_VSCODE_GATE_ID", previous.gateId);
    restoreEnvironment("PI_VSCODE_GATE_TIMEOUT", previous.timeout);
    restoreEnvironment("PI_VSCODE_EXTENSION_PROFILE", previous.profile);
  }
}

function restoreEnvironment(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

function parseMessage(message: string): unknown {
  return JSON.parse(message);
}

test("trusted profile announces its custom inventory and asks for each custom call", async () => {
  await withProfile("trusted", async () => {
    const fixture = new GateFixture({ confirmation: async () => true });
    approvalGate(fixture);

    await fixture.start();

    assert.deepEqual(fixture.activeToolUpdates, [[...controlledTools, "fixture_tool"]]);
    assert.equal(fixture.notices.length, 1);
    assert.deepEqual(parseGateEnvelope(parseMessage(fixture.notices[0].message)), {
      kind: "hello",
      runtime,
      cwd,
      profile: "trusted",
      customTools: ["fixture_tool"],
    });

    const firstResult = await fixture.call({
      toolName: "fixture_tool",
      toolCallId: "custom-call-1",
      input: { text: "complete custom input" },
    });
    assert.equal(firstResult, undefined);
    assert.equal(fixture.confirmations.length, 1);
    const parsedCall = parseGateEnvelope(parseMessage(fixture.confirmations[0].message));
    assert.ok(parsedCall?.kind === "call");
    assert.equal(parsedCall.request.length, 36);
    assert.deepEqual({ ...parsedCall, request: "request-id" }, {
      kind: "call",
      runtime,
      cwd,
      request: "request-id",
      toolCallId: "custom-call-1",
      tool: "fixture_tool",
      category: "custom",
      input: { text: "complete custom input" },
    });

    await fixture.call({ toolName: "fixture_tool", toolCallId: "custom-call-2", input: { text: "again" } });
    assert.equal(fixture.confirmations.length, 2, "Allow is once per custom call, not a session grant");

    assert.equal(await fixture.call({ toolName: "read", toolCallId: "trusted-builtin-call", input: { path: "file.txt" } }), undefined);
    const builtinApproval = parseGateEnvelope(parseMessage(fixture.confirmations[2].message));
    assert.ok(builtinApproval?.kind === "call");
    assert.equal(builtinApproval.category, undefined);
  });
});




test("controlled remains the default profile and keeps its original hello and built-in calls", async () => {
  await withProfile(undefined, async () => {
    const fixture = new GateFixture({ inventoryApi: "none", confirmation: async () => true });
    approvalGate(fixture);

    await fixture.start();

    assert.deepEqual(fixture.activeToolUpdates, []);
    assert.deepEqual(parseGateEnvelope(parseMessage(fixture.notices[0].message)), {
      kind: "hello",
      runtime,
      cwd,
    });
    assert.equal(await fixture.call({ toolName: "read", toolCallId: "read-call", input: { path: "file.txt" } }), undefined);
    assert.equal(fixture.confirmations.length, 1);
    assert.equal(parseGateEnvelope(parseMessage(fixture.confirmations[0].message))?.kind, "call");
    assert.deepEqual(await fixture.call({ toolName: "unregistered_tool", toolCallId: "unknown-call", input: {} }), {
      block: true,
      reason: "Tool was not approved.",
    });
    assert.equal(fixture.confirmations.length, 1);
  });
});


test("trusted readiness fails closed when either public inventory method is missing", async (t) => {
  const missingApis: Array<"getAllTools" | "getActiveTools"> = ["getAllTools", "getActiveTools"];
  for (const missingApi of missingApis) {
    await t.test(`${missingApi} missing`, async () => {
      await withProfile("trusted", async () => {
        const fixture = new GateFixture({ inventoryApi: missingApi });
        approvalGate(fixture);
        await fixture.start();

        assert.equal(fixture.notices.length, 1);
        assert.deepEqual(fixture.notices[0], {
          message: "Trusted tool approval is unavailable because the tool inventory could not be verified.",
          level: "error",
        });
        assert.deepEqual(fixture.activeToolUpdates, []);
        assert.deepEqual(await fixture.call({ toolName: "fixture_tool", toolCallId: "custom-call", input: {} }), {
          block: true,
          reason: "Tool was not approved.",
        });
        assert.equal(fixture.confirmations.length, 0);
      });
    });
  }
});

test("trusted readiness rejects malformed, duplicate, oversized, or built-in-override inventories", async (t) => {
  const builtins = controlledTools.map(builtinTool);
  const invalidInventories: Array<{ label: string; inventory: unknown; activeTools?: unknown }> = [
    { label: "invalid custom name", inventory: [...builtins, extensionTool("bad name")] },
    { label: "custom name over 64 characters", inventory: [...builtins, extensionTool("a".repeat(65))] },
    { label: "duplicate custom name", inventory: [...builtins, extensionTool("fixture_tool"), extensionTool("fixture_tool")] },
    { label: "built-in name claimed by extension metadata", inventory: [...builtins.filter((tool) => tool.name !== "read"), extensionTool("read")] },
    { label: "built-in metadata with a user path", inventory: [...builtins.filter((tool) => tool.name !== "read"), { name: "read", sourceInfo: { source: "builtin", path: "C:/extensions/fake-read.ts" } }] },
    { label: "custom metadata claims built-in source", inventory: [...builtins, extensionTool("fixture_tool", "builtin", "<builtin:fixture_tool>")] },
    { label: "case-variant built-in source claim", inventory: [...builtins, extensionTool("fixture_tool", "Builtin")] },
    { label: "custom metadata lacks source path", inventory: [...builtins, { name: "fixture_tool", sourceInfo: { source: "local" } }] },
    { label: "more than 64 custom tools", inventory: [...builtins, ...Array.from({ length: 65 }, (_, index) => extensionTool(`fixture_${index}`))] },
    { label: "active name has no inventory entry", inventory: [...builtins, extensionTool("fixture_tool")], activeTools: [...controlledTools, "unregistered_tool"] },
  ];

  for (const invalid of invalidInventories) {
    await t.test(invalid.label, async () => {
      await withProfile("trusted", async () => {
        const options: GateFixtureOptions = { inventory: invalid.inventory };
        if (invalid.activeTools !== undefined) options.activeTools = invalid.activeTools;
        const fixture = new GateFixture(options);
        approvalGate(fixture);
        await fixture.start();

        assert.equal(fixture.notices.length, 1);
        assert.equal(fixture.notices[0].level, "error");
        assert.equal(fixture.notices[0].message, "Trusted tool approval is unavailable because the tool inventory could not be verified.");
        assert.deepEqual(fixture.activeToolUpdates, []);
        assert.deepEqual(await fixture.call({ toolName: "read", toolCallId: "built-in-call", input: { path: "file.txt" } }), {
          block: true,
          reason: "Tool was not approved.",
        });
        assert.equal(fixture.confirmations.length, 0);
      });
    });
  }
});

test("trusted inventory accepts the selected maximum of 64 custom tools", async () => {
  await withProfile("trusted", async () => {
    const customTools = Array.from({ length: 64 }, (_, index) => `fixture_${index}`);
    const fixture = new GateFixture({
      inventory: [...controlledTools.map(builtinTool), ...customTools.map((name) => extensionTool(name))],
    });
    approvalGate(fixture);
    await fixture.start();

    const hello = parseGateEnvelope(parseMessage(fixture.notices[0].message));
    assert.ok(hello?.kind === "hello" && hello.profile === "trusted");
    assert.equal(hello.customTools?.length, 64);
    assert.equal(fixture.activeToolUpdates[0].length, controlledTools.length + 64);
  });
});



test("trusted custom calls are denied on a negative answer and unregistered names never prompt", async () => {
  await withProfile("trusted", async () => {
    const fixture = new GateFixture({ confirmation: async () => false });
    approvalGate(fixture);
    await fixture.start();

    assert.deepEqual(await fixture.call({ toolName: "fixture_tool", toolCallId: "custom-call", input: { safe: true } }), {
      block: true,
      reason: "Tool was not approved.",
    });
    assert.equal(parseGateEnvelope(parseMessage(fixture.confirmations[0].message))?.kind, "call");
    assert.deepEqual(await fixture.call({ toolName: "unknown_tool", toolCallId: "unknown-call", input: {} }), {
      block: true,
      reason: "Tool was not approved.",
    });
    assert.equal(fixture.confirmations.length, 1);
  });
});

test("trusted approval displays the captured full JSON and denies a late-mutated input", async () => {
  await withProfile("trusted", async () => {
    let resolveApproval: ((allowed: boolean) => void) | undefined;
    const pendingApproval = new Promise<boolean>((resolve) => { resolveApproval = resolve; });
    const fixture = new GateFixture({ confirmation: async () => pendingApproval });
    approvalGate(fixture);
    await fixture.start();

    const input = { text: "before", nested: { value: 7 } };
    const pendingCall = fixture.call({ toolName: "fixture_tool", toolCallId: "mutating-call", input });
    assert.equal(fixture.confirmations.length, 1);
    const displayed = parseGateEnvelope(parseMessage(fixture.confirmations[0].message));
    assert.ok(displayed?.kind === "call" && displayed.category === "custom");
    assert.deepEqual(displayed.input, { text: "before", nested: { value: 7 } });
    input.text = "after";
    assert.ok(resolveApproval);
    resolveApproval(true);

    assert.deepEqual(await pendingCall, { block: true, reason: "Tool was not approved." });
  });
});

test("trusted approval rechecks cancellation after the user answers", async () => {
  await withProfile("trusted", async () => {
    let resolveApproval: ((allowed: boolean) => void) | undefined;
    const pendingApproval = new Promise<boolean>((resolve) => { resolveApproval = resolve; });
    const fixture = new GateFixture({ confirmation: async () => pendingApproval });
    approvalGate(fixture);
    await fixture.start();

    const controller = new AbortController();
    const pendingCall = fixture.call(
      { toolName: "fixture_tool", toolCallId: "cancelled-call", input: { text: "unchanged" } },
      fixture.context(controller.signal),
    );
    assert.equal(fixture.confirmations[0].options.signal, controller.signal);
    controller.abort();
    assert.ok(resolveApproval);
    resolveApproval(true);

    assert.deepEqual(await pendingCall, { block: true, reason: "Tool was not approved." });
  });
});

test("trusted approval rejects a JSON input above its byte bound without truncating it", async () => {
  await withProfile("trusted", async () => {
    const fixture = new GateFixture({ confirmation: async () => true });
    approvalGate(fixture);
    await fixture.start();

    assert.deepEqual(await fixture.call({
      toolName: "fixture_tool",
      toolCallId: "oversized-call",
      input: { text: "你".repeat(10_920) },
    }), { block: true, reason: "Tool was not approved." });
    assert.equal(fixture.confirmations.length, 0);
  });
});

test("approval protocol accepts only the selected trusted hello extension and custom-call category", () => {
  const base = { protocol: "pi-vscode-approval", version: 1, runtime, cwd };
  assert.deepEqual(parseGateEnvelope({ ...base, kind: "hello" }), { kind: "hello", runtime, cwd });
  assert.deepEqual(parseGateEnvelope({ ...base, kind: "hello", profile: "trusted", customTools: ["fixture_tool"] }), {
    kind: "hello",
    runtime,
    cwd,
    profile: "trusted",
    customTools: ["fixture_tool"],
  });

  const invalidHellos: unknown[] = [
    { ...base, kind: "hello", profile: "trusted" },
    { ...base, kind: "hello", customTools: ["fixture_tool"] },
    { ...base, kind: "hello", profile: "controlled", customTools: [] },
    { ...base, kind: "hello", profile: "trusted", customTools: ["read"] },
    { ...base, kind: "hello", profile: "trusted", customTools: ["bad name"] },
    { ...base, kind: "hello", profile: "trusted", customTools: ["fixture_tool", "fixture_tool"] },
    { ...base, kind: "hello", profile: "trusted", customTools: Array.from({ length: 65 }, (_, index) => `tool_${index}`) },
  ];
  for (const hello of invalidHellos) assert.equal(parseGateEnvelope(hello), undefined);

  const customCall = {
    ...base,
    kind: "call",
    request: "request-1",
    toolCallId: "custom-call-1",
    tool: "fixture_tool",
    category: "custom",
    input: { value: 1 },
  };
  assert.deepEqual(parseGateEnvelope(customCall), {
    kind: "call",
    runtime,
    cwd,
    request: "request-1",
    toolCallId: "custom-call-1",
    tool: "fixture_tool",
    category: "custom",
    input: { value: 1 },
  });
  assert.deepEqual(parseGateEnvelope({ ...customCall, tool: "read", category: undefined }), undefined);
  assert.equal(parseGateEnvelope({ ...customCall, tool: "read" }), undefined);
  assert.equal(parseGateEnvelope({ ...customCall, category: undefined }), undefined);
  assert.equal(parseGateEnvelope({ ...customCall, tool: "bad.name" }), undefined);
  assert.deepEqual(parseGateEnvelope({ ...customCall, tool: "read", category: "builtin" }), undefined);

  const controlledCall = {
    ...base,
    kind: "call",
    request: "request-1",
    toolCallId: "custom-call-1",
    tool: "read",
    input: { value: 1 },
  };
  assert.deepEqual(parseGateEnvelope(controlledCall), {
    kind: "call",
    runtime,
    cwd,
    request: "request-1",
    toolCallId: "custom-call-1",
    tool: "read",
    input: { value: 1 },
  });
});


test("trusted confirmation preserves a full bounded Unicode JSON input", async () => {
  await withProfile("trusted", async () => {
    const text = "你".repeat(10_900);
    const fixture = new GateFixture({ confirmation: async () => true });
    approvalGate(fixture);
    await fixture.start();

    assert.equal(await fixture.call({
      toolName: "fixture_tool",
      toolCallId: "large-input-call",
      input: { text },
    }), undefined);
    const parsed = parseGateEnvelope(parseMessage(fixture.confirmations[0].message));
    assert.ok(parsed?.kind === "call" && parsed.category === "custom");
    assert.deepEqual(parsed.input, { text });
  });
});
