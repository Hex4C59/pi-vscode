import assert from "node:assert/strict";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { Writable } from "node:stream";
import { createPiRpcRuntime, type PiRpcRuntimeEnvironment } from "../../src/adapter/runtime/index.js";
type RuntimeProcess = PiRpcRuntimeEnvironment["process"];
type ProcessLaunch = Parameters<RuntimeProcess["launch"]>[0];

async function observedClose(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return;
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => { child.kill("SIGKILL"); reject(new Error("Child close was not observed within five seconds.")); }, 5000);
    child.once("close", () => { clearTimeout(timer); resolve(); }); child.kill("SIGTERM");
  });
}
function isolatedProcess(config: string, commands: string[], exits: object[]): RuntimeProcess {
  let child: ChildProcess | undefined;
  const unsupported = async (): Promise<never> => { throw new Error("Ownership commands are outside this isolated process probe."); };
  return { inspect: unsupported, end: unsupported, recover: unsupported, handoff: unsupported,
    describeFailure: () => "Isolated transport failed.", async launch(input: ProcessLaunch) {
    const owned = spawn(process.execPath, [input.cliPath, ...input.args], { cwd: input.cwd, windowsHide: true, stdio: ["pipe", "pipe", "ignore"],
      env: { PATH: process.env.PATH, PI_CODING_AGENT_DIR: config, PI_OFFLINE: "1", PI_TELEMETRY: "0", PI_VSCODE_GATE_ID: input.env.PI_VSCODE_GATE_ID, PI_VSCODE_EXTENSION_PROFILE: "controlled" } });
    child = owned;
    const stdin = owned.stdin; assert.ok(stdin);
    const writer = new Writable({ write(frame, _encoding, done) { commands.push(JSON.parse(frame.toString()).type); stdin.write(frame, done); } });
    owned.once("close", (code, signal) => exits.push({ observedClose: true, code, signal }));
    assert.ok(owned.stdout);
    return { ok: true, link: { stdin: writer, stdout: owned.stdout, onLost(listener) { owned.on("close", listener); owned.on("error", listener);
      return () => { owned.off("close", listener); owned.off("error", listener); }; } } };
  }, async release() { const owned = child; child = undefined; if (owned) await observedClose(owned); } };
}

async function main(): Promise<void> {
  const output = path.resolve("dist/wi080"); await mkdir(output, { recursive: true });
  const version: string = JSON.parse(await readFile("node_modules/@earendil-works/pi-coding-agent/package.json", "utf8")).version;
  assert.equal(version, "0.86.1");
  const isolated = await mkdtemp(path.join(output, "isolated-pi-"));
  const cwd = path.join(isolated, "project"), config = path.join(isolated, "config");
  await Promise.all([mkdir(cwd), mkdir(config)]);
  process.env.PI_CODING_AGENT_DIR = config;
  const { SessionManager } = await import("@earendil-works/pi-coding-agent");
  const session = SessionManager.create(cwd);
  session.appendMessage({ role: "user", content: "Literal stored user body", timestamp: Date.now() });
  session.appendMessage({ role: "assistant", content: [{ type: "text", text: "Literal stored assistant body" }], api: "openai-responses", provider: "fixture", model: "fixture",
    usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } }, stopReason: "stop", timestamp: Date.now() });
  session.appendSessionInfo("Original name");
  const sessionFile = session.getSessionFile(); assert.ok(sessionFile);
  const before = session.buildSessionContext().messages;
  const commands: string[] = [], exits: object[] = [];
  const runtime = createPiRpcRuntime({ process: isolatedProcess(config, commands, exits), startupModel: () => undefined,
    cliPath: () => path.resolve("node_modules/@earendil-works/pi-coding-agent/dist/bundle/cli.js") });
  const name = "名".repeat(200);
  try {
    const started = await runtime.start({ cwd, projectTrust: "no-approve", resume: { id: session.getSessionId(), path: sessionFile } }); assert.equal(started.ok, true);
    const identity = runtime.getSession(); const commandStart = commands.length;
    const renamed = await runtime.renameSession?.(name, identity); assert.equal(renamed?.ok, true);
    if (!renamed?.ok) throw new Error("Verified rename was unavailable.");
    assert.equal(renamed.conversation.name, name); assert.equal(runtime.getSession(), identity);
    assert.deepEqual(commands.slice(commandStart), ["get_state", "set_session_name", "get_state"]);
    const catalogue = await SessionManager.list(cwd); const row = catalogue.find(value => value.id === session.getSessionId()); assert.equal(row?.name, name);
    await runtime.stop();
    const reopened = SessionManager.open(sessionFile); assert.deepEqual(reopened.buildSessionContext().messages, before);
    const fresh = await runtime.start({ cwd, projectTrust: "no-approve" }); assert.equal(fresh.ok, true);
    const freshRename = await runtime.renameSession?.("Fresh display name", runtime.getSession()); assert.equal(freshRename?.ok, true);
    await runtime.stop(); assert.equal(exits.length, 2);
    await writeFile(path.join(output, "real-pi.json"), JSON.stringify({ schemaVersion: 1, status: "passed", piVersion: version, nameUtf16Units: name.length,
      exactNameReadback: true, stableRuntimeIdentity: true, catalogueExactName: true, literalBodiesUnchanged: true, freshSessionRename: true,
      commands, exits, isolation: "New local project/config/session directory; public SDK fixture setup; public RPC mutation; no model request", limits: ["Not F5", "Not installed VSIX"] }, null, 2));
  } finally { await runtime.stop(); }
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
