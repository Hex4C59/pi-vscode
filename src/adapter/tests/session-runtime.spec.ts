import assert from "node:assert/strict";
import { test } from "node:test";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import path from "node:path";
import type { ChildProcess, spawn } from "node:child_process";
import { createPiRpcRuntime } from "../pi-rpc-runtime.js";
const identity = { sessionId: "saved-id", sessionFile: "/private-store/saved.jsonl", sessionName: "Saved conversation" };
function fixture(state: unknown = identity, reportedCwd?: string) {
 let output: PassThrough; let gate: { runtime: string; cwd: string }; const replies: Record<string,unknown>[]=[];
 const commands: string[] = []; const launches: string[][] = []; let kills = 0;
 const fakeSpawn = ((_command: string, args: string[], options: { cwd: string; env: Record<string, string> }) => {
  launches.push(args); const stdout = new PassThrough(); output=stdout; gate={runtime:options.env.PI_VSCODE_GATE_ID,cwd:reportedCwd??options.cwd};
  const child: EventEmitter & { exitCode: number | null; signalCode: null; kill(): boolean } = Object.assign(new EventEmitter(), { exitCode: null, signalCode: null, kill: () => { kills++; child.exitCode = 0; queueMicrotask(() => child.emit("close")); return true; } });
  const stdin = Object.assign(new EventEmitter(), { destroyed: false, writableEnded: false, write(frame: string) {
   const command = JSON.parse(frame); commands.push(command.type); if(command.type==="extension_ui_response")replies.push(command);
   if (command.type === "get_state") queueMicrotask(() => {
    stdout.write(JSON.stringify({ type: "extension_ui_request", method: "notify", message: JSON.stringify({ protocol: "pi-vscode-approval", version: 1, kind: "hello", runtime: options.env.PI_VSCODE_GATE_ID, cwd: reportedCwd ?? options.cwd }) }) + "\n");
    stdout.write(JSON.stringify({ type: "response", id: command.id, command: command.type, success: true, data: state }) + "\n");
   }); return true;
  } });
  return Object.assign(child, { stdout, stdin, stderr: new PassThrough() }) as unknown as ChildProcess;
 }) as unknown as typeof spawn;
 const runtime = createPiRpcRuntime({ spawn: fakeSpawn, cliPath: () => "fixture", startupModel: () => undefined, gateAccess: async () => undefined });
 return { runtime, commands, launches, replies, gateCall(cwd: string) { output.write(JSON.stringify({type:"extension_ui_request",method:"confirm",id:"gate-call",message:JSON.stringify({protocol:"pi-vscode-approval",version:1,kind:"call",...gate,cwd,request:"request",toolCallId:"tool",tool:"read",input:{path:"sample.ts"}})})+"\n"); }, get kills() { return kills; } };
}
test("new runtime uses pi persistence and exposes only validated conversation identity", async () => {
 const f = fixture(); try {
  const result = await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" }); assert.equal(result.ok, true);
  assert.equal(f.launches[0].includes("--no-session"), false); assert.equal(f.launches[0].includes("--session"), false);
  assert.ok(f.launches[0].includes("--no-extensions")); assert.ok(f.launches[0].includes("--no-approve"));
  if (result.ok) assert.deepEqual(result.conversation, { id: identity.sessionId, name: identity.sessionName, path: identity.sessionFile });
 } finally { await f.runtime.stop(); }
});
test("resume passes a host-selected opaque path and verifies identity without unbounded RPC history", async () => {
 const f = fixture(); try {
  const result = await f.runtime.start({ cwd: "/project", projectTrust: "no-approve", resume: { id: identity.sessionId, path: identity.sessionFile } }); assert.equal(result.ok, true);
  const index = f.launches[0].indexOf("--session"); assert.ok(index >= 0); assert.equal(f.launches[0][index + 1], identity.sessionFile);
  assert.deepEqual(f.commands, ["get_state"]);
 } finally { await f.runtime.stop(); }
});
test("malformed or mismatched restored identity stops the owned process before readiness", async () => {
 for (const state of [undefined, { ...identity, sessionId: "different" }, { ...identity, sessionFile: "/other/session.jsonl" }, { ...identity, sessionFile: 42 }]) {
  const f = fixture(state === undefined ? null : state); try {
   const result = await f.runtime.start({ cwd: "/project", projectTrust: "no-approve", resume: { id: identity.sessionId, path: identity.sessionFile } });
   assert.equal(result.ok, false); assert.equal(f.runtime.getSession(), 0); assert.equal(f.kills, 1);
  } finally { await f.runtime.stop(); }
 }
});

test("equivalent Windows drive spelling restores and keeps approved tool scope in the host's spelling", async()=>{
 const owned=process.platform==="win32"?"d:\\Project":"/project";const reported=process.platform==="win32"?"D:\\Project":"/project";
 const f=fixture(identity,reported);const calls:unknown[]=[];f.runtime.setApprovalHandler?.(async call=>{calls.push(call);return true;});
 try{assert.equal((await f.runtime.start({cwd:owned,projectTrust:"no-approve",resume:{id:identity.sessionId,path:identity.sessionFile}})).ok,true);
 f.gateCall(reported);await new Promise<void>(resolve=>setImmediate(resolve));assert.equal((calls[0] as {cwd:string}).cwd,owned);assert.equal(f.replies.at(-1)?.confirmed,true);
 f.gateCall(process.platform==="win32"?"D:\\AnotherProject":"/another-project");await new Promise<void>(resolve=>setImmediate(resolve));assert.equal(calls.length,1);assert.equal(f.replies.at(-1)?.confirmed,false);
 f.gateCall(path.relative(process.cwd(), owned));await new Promise<void>(resolve=>setImmediate(resolve));assert.equal(calls.length,1,"relative gate paths are not identity aliases");assert.equal(f.replies.at(-1)?.confirmed,false);
 if(process.platform==="win32"){f.gateCall("\\Project");await new Promise<void>(resolve=>setImmediate(resolve));assert.equal(calls.length,1,"drive-relative roots cannot inherit the host drive");assert.equal(f.replies.at(-1)?.confirmed,false);}
 }finally{await f.runtime.stop();}
});

test("restoration rejects a different session-file component case but permits Windows drive spelling", async () => {
 const selected = process.platform === "win32" ? "d:\\Sessions\\selected.jsonl" : "/Sessions/selected.jsonl";
 const same = process.platform === "win32" ? "D:\\Sessions\\selected.jsonl" : selected;
 const foreign = process.platform === "win32" ? "D:\\sessions\\selected.jsonl" : "/sessions/selected.jsonl";
 for (const sessionFile of [same, foreign]) {
  const f = fixture({ ...identity, sessionFile });
  try {
   const result = await f.runtime.start({ cwd: "/project", projectTrust: "no-approve", resume: { id: identity.sessionId, path: selected } });
   assert.equal(result.ok, sessionFile === same, `selected session file ${sessionFile}`);
   if (sessionFile === foreign) { assert.equal(f.runtime.getSession(), 0); assert.equal(f.kills, 1); }
  } finally { await f.runtime.stop(); }
 }
});
