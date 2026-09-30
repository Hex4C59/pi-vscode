import assert from "node:assert/strict";
import { test } from "node:test";
import type { PassThrough } from "node:stream";
import path from "node:path";
import { createMemoryConnection, createMemoryProcess } from "../../tests/memory-process.js";
import { createPiRpcRuntime } from "../../pi-rpc-runtime.js";
const identity = { sessionId: "saved-id", sessionFile: "/private-store/saved.jsonl", sessionName: "Saved conversation" };
function fixture(state: unknown = identity, reportedCwd?: string) {
 let output: PassThrough; let gate: { runtime: string; cwd: string }; const replies: Record<string,unknown>[]=[];
 const commands: string[] = []; const launches: string[][] = [];
 const memory = createMemoryProcess(options => {
  launches.push([options.cliPath, ...options.args]); gate={runtime:options.env.PI_VSCODE_GATE_ID!,cwd:reportedCwd??options.cwd};
  const connection = createMemoryConnection((frame, done) => {
   const stdout = connection.stdout;
   const command = JSON.parse(frame); commands.push(command.type); if(command.type==="extension_ui_response")replies.push(command);
   if (command.type === "get_state") queueMicrotask(() => {
    stdout.write(JSON.stringify({ type: "extension_ui_request", method: "notify", message: JSON.stringify({ protocol: "pi-vscode-approval", version: 1, kind: "hello", runtime: options.env.PI_VSCODE_GATE_ID, cwd: reportedCwd ?? options.cwd }) }) + "\n");
    stdout.write(JSON.stringify({ type: "response", id: command.id, command: command.type, success: true, data: state }) + "\n");
   });
   if (command.type === "get_available_models" || command.type === "get_available_thinking_levels") queueMicrotask(() => {
    stdout.write(JSON.stringify({type:"response",id:command.id,command:command.type,success:true,data:command.type === "get_available_models" ? {models:[]} : {levels:[]}})+"\n");
   });
   if (command.type === "clear_queue" || command.type === "abort") queueMicrotask(() => {
    if (command.type === "abort") {
     stdout.write(JSON.stringify({type:"auto_retry_end",success:false,attempt:1,finalError:"Retry cancelled"})+"\n");
     stdout.write(JSON.stringify({type:"agent_settled"})+"\n");
    }
    stdout.write(JSON.stringify({type:"response",id:command.id,command:command.type,success:true})+"\n");
   }); done(); return true;
  });
  output = connection.stdout;
  return connection;
 });
 const runtime = createPiRpcRuntime({ process: memory.process, cliPath: () => "fixture", startupModel: () => undefined, gateAccess: async () => undefined });
 return { runtime, commands, launches, replies, frame(value: unknown) { output.write(JSON.stringify(value) + "\n"); }, gateCall(cwd: string) { output.write(JSON.stringify({type:"extension_ui_request",method:"confirm",id:"gate-call",message:JSON.stringify({protocol:"pi-vscode-approval",version:1,kind:"call",...gate,cwd,request:"request",toolCallId:"tool",tool:"read",input:{path:"sample.ts"}})})+"\n"); }, get releases() { return memory.releases; } };
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
test("malformed or mismatched restored identity releases an uncertain connection before readiness", async () => {
 for (const state of [undefined, { ...identity, sessionId: "different" }, { ...identity, sessionFile: "/other/session.jsonl" }, { ...identity, sessionFile: 42 }]) {
  const f = fixture(state === undefined ? null : state); try {
   const result = await f.runtime.start({ cwd: "/project", projectTrust: "no-approve", resume: { id: identity.sessionId, path: identity.sessionFile } });
   assert.equal(result.ok, false); assert.equal(f.runtime.getSession(), 0); assert.deepEqual(f.releases, ["uncertain"]);
  } finally { await f.runtime.stop(); }
 }
});

test("equivalent Windows drive spelling restores and keeps approved tool scope in the host's spelling", async()=>{
 const owned=process.platform==="win32"?"d:\\Project":"/project";const reported=process.platform==="win32"?"D:\\Project":"/project";
 const f=fixture(identity,reported);const calls:unknown[]=[];f.runtime.setApprovalHandler?.(async call=>{calls.push(call);return true;});
 try{assert.equal((await f.runtime.start({cwd:owned,projectTrust:"no-approve",resume:{id:identity.sessionId,path:identity.sessionFile}})).ok,true);
 f.gateCall(reported);await new Promise<void>(resolve=>setImmediate(resolve));assert.equal((calls[0] as {cwd:string}).cwd,owned);assert.equal(f.replies.length,1);assert.equal(f.replies.at(-1)?.confirmed,true);
 f.gateCall(process.platform==="win32"?"D:\\AnotherProject":"/another-project");await new Promise<void>(resolve=>setImmediate(resolve));assert.equal(calls.length,1);assert.equal(f.replies.length,2);assert.equal(f.replies.at(-1)?.confirmed,false);
 f.gateCall(path.relative(process.cwd(), owned));await new Promise<void>(resolve=>setImmediate(resolve));assert.equal(calls.length,1,"relative gate paths are not identity aliases");assert.equal(f.replies.length,3);assert.equal(f.replies.at(-1)?.confirmed,false);
 if(process.platform==="win32"){f.gateCall("\\Project");await new Promise<void>(resolve=>setImmediate(resolve));assert.equal(calls.length,1,"drive-relative roots cannot inherit the host drive");assert.equal(f.replies.length,4);assert.equal(f.replies.at(-1)?.confirmed,false);}
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
   if (sessionFile === foreign) { assert.equal(f.runtime.getSession(), 0); assert.deepEqual(f.releases, ["uncertain"]); }
  } finally { await f.runtime.stop(); }
 }
});

test("public retry events remain a running phase until agent settlement", async () => {
 const f=fixture(); const events: unknown[]=[]; const unsubscribe=f.runtime.subscribe(event=>events.push(event));
 try {
  assert.equal((await f.runtime.start({cwd:"/project",projectTrust:"no-approve"})).ok,true);
  const session=f.runtime.getSession();
  f.frame({type:"auto_retry_start",attempt:1,maxAttempts:3,delayMs:100,errorMessage:"synthetic retry"});
  assert.deepEqual(events.at(-1),{kind:"workflow",session,phase:"retrying"});
  f.frame({type:"auto_retry_end",success:true,attempt:1});
  assert.deepEqual(events.at(-1),{kind:"workflow",session,phase:"waiting"});
  assert.equal(events.some(event=>(event as {kind:string}).kind==="agent_settled"),false);
  f.frame({type:"agent_settled"});
  assert.deepEqual(events.at(-1),{kind:"agent_settled",session});
 } finally {unsubscribe();await f.runtime.stop();}
});
test("compaction end never invents settlement and a malformed phase fails the connection", async () => {
 const f=fixture(); const events: unknown[]=[]; const unsubscribe=f.runtime.subscribe(event=>events.push(event));
 try {
  assert.equal((await f.runtime.start({cwd:"/project",projectTrust:"no-approve"})).ok,true);
  const session=f.runtime.getSession();
  f.frame({type:"compaction_start",reason:"overflow"});
  assert.deepEqual(events.at(-1),{kind:"workflow",session,phase:"compacting"});
  f.frame({type:"compaction_end",reason:"overflow",aborted:false,willRetry:true,result:{summary:"synthetic"}});
  assert.deepEqual(events.at(-1),{kind:"workflow",session,phase:"waiting"});
  const before=events.length;
  // Other malformed phase fields are independently covered in rpc-frames.spec.ts.
  f.frame({type:"compaction_start",reason:"invented"});
  assert.equal(events.length,before+1);
  assert.equal((events.at(-1) as {kind:string}).kind,"runtime_error");
  assert.equal(f.runtime.getSession(),0);
  assert.equal(events.some(event=>(event as {kind:string}).kind==="agent_settled"),false);
 } finally {unsubscribe();await f.runtime.stop();}
});
test("assistant failure is observable even when automatic retry is disabled", async () => {
 const f=fixture(); const events: unknown[]=[]; const unsubscribe=f.runtime.subscribe(event=>events.push(event));
 try {
  assert.equal((await f.runtime.start({cwd:"/project",projectTrust:"no-approve"})).ok,true);
  f.frame({type:"message_end",message:{role:"assistant",content:[],stopReason:"error",errorMessage:"Synthetic non-retryable provider failure"}});
  assert.deepEqual(events.at(-1),{kind:"stream_error",session:f.runtime.getSession(),detail:"Model request failed. Check the selected model and provider configuration, then try again."});
 } finally {unsubscribe();await f.runtime.stop();}
});

test("Stop cancelling automatic retry does not manufacture a provider failure", async () => {
 const f=fixture(); const events: unknown[]=[]; const unsubscribe=f.runtime.subscribe(event=>events.push(event));
 try {
  assert.equal((await f.runtime.start({cwd:"/project",projectTrust:"no-approve"})).ok,true);
  f.frame({type:"auto_retry_start",attempt:1,maxAttempts:3,delayMs:100,errorMessage:"synthetic"});
  assert.equal((await f.runtime.abortTask?.())?.ok,true);
  assert.equal(events.some(event=>(event as {kind:string}).kind==="stream_error"),false);
  assert.ok(events.some(event=>(event as {kind:string}).kind==="agent_settled"));
 } finally {unsubscribe();await f.runtime.stop();}
});

test("all provider failure event paths suppress untrusted authentication response bodies", async () => {
 const f=fixture(); const events: { kind: string; detail?: string }[]=[];
 const unsubscribe=f.runtime.subscribe(event=>events.push(event));
 try {
  assert.equal((await f.runtime.start({cwd:"/project",projectTrust:"no-approve"})).ok,true);
  const raw='401: {"message":"authorization=synthetic-marker"}';
  f.frame({type:"message_end",message:{role:"assistant",content:[],stopReason:"error",errorMessage:raw}});
  f.frame({type:"compaction_start",reason:"overflow"});
  f.frame({type:"compaction_end",reason:"overflow",aborted:false,willRetry:false,errorMessage:raw});
  f.frame({type:"auto_retry_end",success:false,attempt:1,finalError:raw});
  const failures=events.filter(event=>event.kind==="stream_error");
  assert.equal(failures.length,3);
  for(const event of failures)assert.equal(event.detail,"Model authentication failed. Check pi credentials and provider access, then try again.");
  assert.doesNotMatch(JSON.stringify(events),/synthetic-marker|authorization=/);
 } finally {unsubscribe();await f.runtime.stop();}
});

test("pi's empty-model sentinel is not projected as a configured model", async () => {
 const sentinel={id:"unknown",name:"unknown",api:"unknown",provider:"unknown",baseUrl:"",reasoning:false,input:[],contextWindow:0,maxTokens:0};
 for(const [model, expected] of [[sentinel,null],[{...sentinel,api:"openai-completions",provider:"local",contextWindow:1024,maxTokens:128},"local / unknown"]] as const){
  const f=fixture({...identity,model});
  try {
   const result=await f.runtime.start({cwd:"/project",projectTrust:"no-approve"});
   assert.equal(result.ok,true);
   if(result.ok)assert.equal(result.modelLabel,expected);
   const projection=await f.runtime.getModelProjection();
   assert.equal(projection.ok,true);
   if(projection.ok)assert.equal(projection.modelLabel,expected);
  }finally{await f.runtime.stop();}
 }
});

test("runtime model labels are bounded before startup and refreshed host projections", async () => {
 const cases = [
  { model: { id: "x".repeat(70_000) }, expected: "x".repeat(200) },
  { model: { provider: "p".repeat(70_000) }, expected: "p".repeat(200) },
  { model: { provider: "local", id: "x".repeat(70_000), name: "n".repeat(201) }, expected: "local / " + "x".repeat(192) },
  { model: { provider: "local", id: "short", name: " " }, expected: "local / short" },
 ];
 for (const { model, expected } of cases) {
  const f = fixture({ ...identity, model });
  try {
   const started = await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" });
   assert.equal(started.ok, true); if (started.ok) assert.equal(started.modelLabel, expected);
   const refreshed = await f.runtime.getModelProjection();
   assert.equal(refreshed.ok, true); if (refreshed.ok) assert.equal(refreshed.modelLabel, expected);
  } finally { await f.runtime.stop(); }
 }
});

test("final assistant text stays within the projection budget after redaction expands it", async () => {
 const f = fixture(); const events: import("../../../../extension/contracts/index.js").RuntimeEvent[] = [];
 const unsubscribe = f.runtime.subscribe(event => events.push(event));
 try {
  assert.equal((await f.runtime.start({ cwd: "/project", projectTrust: "no-approve" })).ok, true);
  f.frame({ type: "message_start", message: { role: "assistant" } });
  f.frame({ type: "message_end", message: { role: "assistant", content: [{ type: "text", text: "a".repeat(65_526) + "password=x" }] } });
  const final = events.find(event => event.kind === "message_final");
  assert.ok(final?.kind === "message_final");
  assert.equal(final.text.length, 65_536);
  assert.equal(final.text, "a".repeat(65_526) + "password=[");
 } finally { unsubscribe(); await f.runtime.stop(); }
});
