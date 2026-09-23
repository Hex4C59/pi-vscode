import assert from "node:assert/strict";
import { test } from "node:test";
import { parseWebviewMessage } from "../bridge/webviewMessages.js";

test("saved-session intents are bounded named capabilities rather than storage paths", () => {
 const envelope = { version: 2, viewId: "view", generation: 1 };
 assert.ok(parseWebviewMessage({ ...envelope, type: "newConversation" }));
 assert.ok(parseWebviewMessage({ ...envelope, type: "getSavedSessions", page: 0 }));
 assert.ok(parseWebviewMessage({ ...envelope, type: "resumeConversation", id: "saved-1" }));
 for (const page of [-1, 0.5, NaN, Infinity, "0"]) assert.equal(parseWebviewMessage({ ...envelope, type: "getSavedSessions", page }), undefined);
 assert.equal(parseWebviewMessage({ ...envelope, type: "resumeConversation", id: "../session.jsonl" }), undefined);
 assert.equal(parseWebviewMessage({ ...envelope, type: "resumeConversation", id: "saved-1", path: "session.jsonl" }), undefined);
 assert.equal(parseWebviewMessage({ ...envelope, type: "newConversation", force: true }), undefined);
});

import type { SessionBackend, SavedSession } from "../contracts/sessionBackend.js";
import type { SessionStateMessage, SavedHistoryStateMessage } from "../contracts/webviewProtocol.js";
import { folder, harness, settingsRuntime, tick } from "./harness.js";
const saved: SavedSession = { id: "public-pi-id", path: "/private-store/session.jsonl", name: "Saved task", firstMessage: "Earlier question", modified: "2026-09-22T00:00:00.000Z" };
function backend(): SessionBackend { return {
 async list(_cwd, page) { return { ok: true, entries: [saved], page, total: 1 }; },
 async inspect(_cwd, id) { return id === saved.id ? { ok: true, session: saved, anchor: "anchor-initial", history: { messages: [{ role: "user", text: "Earlier question" }, { role: "assistant", text: "Earlier answer" }], page: 0, total: 2 } } : { ok: false, code: "stale" }; },
 async history(_cwd, _id, _anchor, page) { return { ok: true, history: { messages: [{ role: "user", text: "Earlier page" }], page, total: 40 } }; },
 async preview(_cwd, _id, _anchor, _index, offset) { return { ok: true, preview: { text: "Original retained snapshot", offset, nextOffset: offset + 26, done: true, totalChars: offset + 26 } }; },
}; }
const sessionState = (v: ReturnType<ReturnType<typeof harness>["createView"]>): SessionStateMessage => {
 v.state(); const value = [...v.sent].reverse().find(m => (m as { type: string }).type === "sessionState"); assert.ok(value, "host must project session state"); return value as SessionStateMessage;
};

test("current-project session catalogue projects only host IDs and bounded metadata", async () => {
 const r = settingsRuntime(); const store = backend(); const calls: unknown[] = []; const original = store.list;
 store.list = async (...args) => { calls.push(args.slice(0, 2)); return original(...args); };
 const h = harness([folder()], true, undefined, r.runtime, store); const v = h.createView();
 try {
  v.action("chooseResources", { choice: "decline" }); await tick();
  v.action("getSavedSessions", { page: 0 }); await tick();
  const state = sessionState(v); assert.equal(state.loaded, true); assert.equal(state.phase, "idle"); assert.equal(state.entries.length, 1);
  assert.deepEqual(calls, [["/project", 0]]); assert.equal(state.entries[0].title, "Saved task"); assert.notEqual(state.entries[0].id, saved.id);
  assert.ok(!JSON.stringify(state).includes(saved.path)); assert.equal(state.total, 1);
 } finally { h.provider.dispose(); }
});

test("late catalogue work is cancelled and cannot cross a workspace generation", async () => {
 let finish!: (value: Awaited<ReturnType<SessionBackend["list"]>>) => void; let signal: AbortSignal | undefined;
 const store = backend(); store.list = async (_cwd, _page, current) => { signal = current; return new Promise(resolve => { finish = resolve; }); };
 const h = harness([folder()], true, undefined, undefined, store); const v = h.createView();
 try {
  v.action("chooseResources", { choice: "decline" }); await tick(); v.action("getSavedSessions", { page: 0 }); await tick();
  h.api.workspace.workspaceFolders = [folder("/another")]; h.change.fire(); assert.equal(signal?.aborted, true);
  finish({ ok: true, entries: [saved], page: 0, total: 1 }); await tick(); assert.deepEqual(sessionState(v).entries, []);
 } finally { h.provider.dispose(); }
});

test("view recreation aborts a pending catalogue and serializes a fresh view request", async () => {
 const f=await sessionFixture(); let calls=0; let firstSignal:AbortSignal|undefined; let finishFirst!:(value:Awaited<ReturnType<SessionBackend["list"]>>)=>void; let finishSecond!:(value:Awaited<ReturnType<SessionBackend["list"]>>)=>void;
 const fresh={...saved,name:"Fresh catalogue entry"};
 f.store.list=async(_cwd,page,signal)=>{ calls++; if(calls===1){firstSignal=signal;return new Promise(resolve=>{finishFirst=resolve;});} return new Promise(resolve=>{finishSecond=resolve;}); };
 try {
  f.v.action("getSavedSessions",{page:0}); await tick();
  const replacement=f.h.createView(); assert.equal(firstSignal?.aborted,true);
  replacement.action("getSavedSessions",{page:0}); await tick(); assert.equal(calls,1);
  finishFirst({ok:true,entries:[{...saved,name:"Old catalogue result"}],page:0,total:1}); await tick(); await tick();
  assert.equal(calls,2); assert.equal(sessionState(replacement).phase,"listing"); assert.doesNotMatch(JSON.stringify(sessionState(replacement)),/Old catalogue result/);
  finishSecond({ok:true,entries:[fresh],page:0,total:1}); await tick(); await tick(); assert.equal(sessionState(replacement).entries[0].title,"Fresh catalogue entry");
 } finally { finishFirst?.({ok:false,code:"cancelled"}); finishSecond?.({ok:false,code:"cancelled"}); f.h.provider.dispose(); }
});
test("cancelling native new-conversation confirmation preserves the draft and current runtime", async () => {
 const r = settingsRuntime(); let starts = 0; const start = r.runtime.start; r.runtime.start = async options => { starts++; return start(options); };
 const h = harness([folder()], true, undefined, r.runtime, backend()); const v = h.createView(); let confirmations = 0;
 h.api.window.showWarningMessage = async () => { confirmations++; return undefined; };
 try {
  v.action("chooseResources", { choice: "decline" }); await tick(); const draft = v.attachments().draft;
  v.action("updateDraft", { draftRevision: draft.revision, editSequence: draft.acceptedEditSequence + 1, text: "Unsent valuable draft" });
  v.action("newConversation"); await tick(); assert.equal(confirmations, 1); assert.equal(starts, 1);
  assert.equal(v.attachments().draft.text, "Unsent valuable draft"); assert.equal(sessionState(v).error, "cancelled");
 } finally { h.provider.dispose(); }
});

async function sessionFixture() {
 const r = settingsRuntime(); const starts: Parameters<typeof r.runtime.start>[0][] = []; const original = r.runtime.start;
 r.runtime.start = async options => { starts.push(options); const result = await original(options); return result.ok ? { ...result, conversation: { id: options.resume?.id ?? "fresh-" + r.runtime.getSession(), path: options.resume?.path ?? "/private-store/new.jsonl", name: options.resume ? "Saved task" : null } } : result; };
 const store = backend(); const h = harness([folder()], true, undefined, r.runtime, store); const v = h.createView();
 h.api.window.showWarningMessage = async (_message, _options, ...buttons) => buttons[0];
 v.action("chooseResources", { choice: "decline" }); await tick();
 v.action("getSavedSessions", { page: 0 }); await tick();
 return { r, h, v, store, starts, selected: sessionState(v).entries[0].id };
}

test("resume waits for the owned Stop barrier, restores history and rejects old runtime output", async () => {
 const f = await sessionFixture(); let finish!: () => void; let aborts = 0;
 f.r.runtime.abortTask = async () => { aborts++; await new Promise<void>(resolve => { finish = resolve; }); f.r.settled(); return { ok: true }; };
 try {
  f.v.action("sendChat", { text: "Current task" }); await tick(); const oldSession = f.r.runtime.getSession(); const generation = f.v.state().generation;
  f.v.action("stopChat"); await tick(); f.v.action("resumeConversation", { id: f.selected }); await tick();
  assert.equal(aborts, 1); assert.equal(f.starts.length, 1); assert.equal(sessionState(f.v).phase, "switching");
  finish(); await tick(); await tick();
  assert.equal(f.starts.length, 2); assert.deepEqual(f.starts[1].resume, { id: saved.id, path: saved.path });
  assert.equal(f.v.state().runtime, "ready"); assert.ok(f.v.state().generation > generation); assert.equal(sessionState(f.v).current?.id, saved.id);
  assert.deepEqual(historyState(f.v).messages.map(m => m.text), ["Earlier question", "Earlier answer"]);
  assert.deepEqual(f.v.state().messages, [], "restored history is not duplicated in the live transcript");
  f.r.events.fire({ kind: "text_delta", session: oldSession, delta: "Stale old response" });
  assert.ok(!JSON.stringify(f.v.state().messages).includes("Stale old response"));
 } finally { finish?.(); f.h.provider.dispose(); }
});

test("Stop failure does not replace a conversation or discard an unsent draft", async () => {
 const f = await sessionFixture(); f.r.runtime.abortTask = async () => ({ ok: false, detail: "Stop not confirmed" });
 try {
  f.v.action("sendChat", { text: "Current task" }); await tick(); const draft = f.v.attachments().draft;
  f.v.action("updateDraft", { draftRevision: draft.revision, editSequence: draft.acceptedEditSequence + 1, text: "Keep on failure" });
  f.v.action("newConversation"); await tick();
  assert.equal(f.starts.length, 1); assert.equal(sessionState(f.v).error, "stop-failed"); assert.equal(f.v.attachments().draft.text, "Keep on failure");
 } finally { f.h.provider.dispose(); }
});

test("a missing target or stale native confirmation cannot become a new conversation", async () => {
 const f = await sessionFixture();
 try {
  f.store.inspect = async () => ({ ok: false, code: "stale" }); f.v.action("resumeConversation", { id: f.selected }); await tick();
  assert.equal(f.starts.length, 1); assert.equal(sessionState(f.v).error, "stale");
  let answer!: (value: string) => void; let affirmative = "";
  f.h.api.window.showWarningMessage = async (_message, _options, ...buttons) => { affirmative = buttons[0]; return new Promise(resolve => { answer = resolve; }); };
  f.v.action("newConversation"); await tick(); f.h.api.workspace.workspaceFolders = [folder("/changed")]; f.h.change.fire(); answer(affirmative); await tick();
  assert.equal(f.starts.length, 1); assert.equal(f.v.state().choice, null); assert.equal(sessionState(f.v).current, null);
 } finally { f.h.provider.dispose(); }
});

test("a resumed runtime with the wrong public identity is stopped and never presented as ready", async () => {
 const f = await sessionFixture(); let stops = 0; const start = f.r.runtime.start;
 f.r.runtime.stop = async () => { stops++; };
 f.r.runtime.start = async options => { const result = await start(options); return result.ok ? { ...result, conversation: { id: "unexpected", name: null, path: "/unexpected.jsonl" } } : result; };
 try {
  f.v.action("resumeConversation", { id: f.selected }); await tick(); await tick();
  assert.equal(stops, 1); assert.equal(f.v.state().runtime, "error"); assert.equal(sessionState(f.v).error, "restore-failed"); assert.deepEqual(f.v.state().messages, []);
 } finally { f.h.provider.dispose(); }
});

const historyState = (v: ReturnType<ReturnType<typeof harness>["createView"]>): SavedHistoryStateMessage => {
 v.state(); const value = [...v.sent].reverse().find(m => (m as { type: string }).type === "savedHistoryState"); assert.ok(value, "host must project saved history"); return value as SavedHistoryStateMessage;
};
test("restored history uses frozen anchored pages and host-authorized snapshot identities", async () => {
 const f = await sessionFixture(); const calls: unknown[] = []; const original = f.store.inspect;
 f.store.inspect = async (...args) => { const result = await original(...args); return result.ok ? { ...result, history: { ...result.history, total: 40 } } : result; };
 const read = f.store.history; f.store.history = async (...args) => { calls.push(args.slice(0,4)); return read(...args); };
 const preview = f.store.preview; f.store.preview = async (...args) => { calls.push(args.slice(0,5)); return preview(...args); };
 try {
  f.v.action("resumeConversation", { id: f.selected }); await tick(); await tick(); const first = historyState(f.v); assert.equal(first.available, true); assert.equal(first.total, 40); assert.equal(first.page,0); assert.ok(first.messages[0].id);
  f.v.action("getSavedHistoryPreview", { requestId: "preview-1", id: first.messages[0].id, offset: 0 }); await tick();
  assert.deepEqual(calls[0], ["/project", saved.id, "anchor-initial", 8, 0]); assert.ok(JSON.stringify(f.v.sent.at(-1)).includes("Original retained snapshot"));
  f.v.action("getSavedHistory", { page: 1 }); await tick(); assert.deepEqual(calls[1], ["/project", saved.id, "anchor-initial", 1]); assert.equal(historyState(f.v).messages[0].text, "Earlier page");
  f.v.action("getSavedHistoryPreview", { requestId: "stale-preview", id: first.messages[0].id, offset: 0 }); await tick(); assert.equal(calls.length, 2); assert.ok(JSON.stringify(f.v.sent.at(-1)).includes('"code":"stale"'));
  f.v.action("getSavedHistory", { page: 2 }); await tick(); assert.equal(calls.length, 2);
 } finally { f.h.provider.dispose(); }
});
test("historical reads are cancelled by conversation replacement and cannot leak into its new view", async () => {
 const f = await sessionFixture(); let resolve!: (value: Awaited<ReturnType<SessionBackend["preview"]>>) => void; let signal: AbortSignal | undefined;
 f.store.preview = async (_cwd, _id, _anchor, _index, _offset, s) => { signal = s; return new Promise(done => { resolve = done; }); };
 try {
  f.v.action("resumeConversation", { id: f.selected }); await tick(); await tick();
  f.v.action("getSavedHistoryPreview", { id: historyState(f.v).messages[0].id, requestId: "old", offset: 0 }); await tick();
  f.v.action("newConversation"); await tick(); await tick(); assert.equal(signal?.aborted, true); assert.equal(historyState(f.v).available, false);
  resolve({ ok: true, preview: { text: "late saved snapshot", offset: 0, nextOffset: 19, done: true, totalChars: 19 } }); await tick(); assert.ok(!JSON.stringify(f.v.sent).includes("late saved snapshot"));
 } finally { f.h.provider.dispose(); }
});

test("view recreation during committed restoration finishes once without a stuck switch or duplicate task", async () => {
 const f = await sessionFixture(); let ready!: () => void; const start = f.r.runtime.start;
 f.r.runtime.start = async options => { await new Promise<void>(resolve => { ready = resolve; }); return start(options); };
 try {
  f.v.action("resumeConversation", { id: f.selected }); await tick(); assert.equal(sessionState(f.v).phase, "switching");
  const replacement = f.h.createView(); ready(); await tick(); await tick(); assert.equal(f.starts.length, 2); assert.equal(replacement.state().runtime, "ready"); assert.equal(sessionState(replacement).phase, "idle"); assert.equal(historyState(replacement).available, true);
 } finally { ready?.(); f.h.provider.dispose(); }
});
test("view recreation cancels an old snapshot read but preserves its completed history window", async () => {
 const f = await sessionFixture(); let resolve!: (value: Awaited<ReturnType<SessionBackend["preview"]>>) => void; let signal: AbortSignal | undefined;
 f.store.preview = async (_cwd,_id,_anchor,_index,_offset,s) => { signal=s; return new Promise(done=>{resolve=done;}); };
 try {
  f.v.action("resumeConversation",{id:f.selected}); await tick(); await tick(); const original = historyState(f.v);
  f.v.action("getSavedHistoryPreview",{id:original.messages[0].id,requestId:"old-view",offset:0}); await tick();
  const replacement = f.h.createView(); assert.equal(signal?.aborted,true); assert.equal(historyState(replacement).total,original.total);
  resolve({ok:true,preview:{text:"old-view-result",offset:0,nextOffset:15,totalChars:15,done:true}}); await tick(); assert.ok(!JSON.stringify(replacement.sent).includes("old-view-result"));
 } finally { f.h.provider.dispose(); }
});

test("draft edits during Stop are not discarded by an older native handoff confirmation", async () => {
 const f = await sessionFixture(); let finish!: () => void;
 f.r.runtime.abortTask = async () => { await new Promise<void>(done=>{finish=done;}); f.r.settled(); return {ok:true}; };
 try {
  f.v.action("sendChat",{text:"Running task"}); await tick(); f.v.action("newConversation"); await tick();
  const draft=f.v.attachments().draft; f.v.action("updateDraft",{draftRevision:draft.revision,editSequence:draft.acceptedEditSequence+1,text:"Later unconfirmed draft"});
  finish(); await tick(); await tick(); assert.equal(f.starts.length,1); assert.equal(f.v.attachments().draft.text,"Later unconfirmed draft"); assert.equal(sessionState(f.v).error,"cancelled");
 } finally { finish?.(); f.h.provider.dispose(); }
});
test("next-turn model intent is discarded rather than applied across a confirmed restore", async () => {
 const f=await sessionFixture(); f.r.runtime.abortTask=async()=>{f.r.settled();return {ok:true};};
 try {
  f.v.action("sendChat",{text:"Running task"}); await tick(); f.v.action("setChatModel",{provider:"B",modelId:"two"}); assert.equal(f.v.state().pendingModel?.provider,"B");
  f.v.action("resumeConversation",{id:f.selected}); await tick(); await tick(); assert.equal(f.v.state().pendingModel,null); assert.ok(!f.r.calls.includes("model:B/two")); assert.equal(f.starts[1].projectTrust,"no-approve"); assert.deepEqual(f.v.state().grants,[]);
 } finally {f.h.provider.dispose();}
});

test("an obsolete unresolved native confirmation cannot block a recreated view", async () => {
 const f=await sessionFixture();let answer!:(value:string|undefined)=>void;
 f.h.api.window.showWarningMessage=async()=>new Promise(resolve=>{answer=resolve;});
 try {
  f.v.action("newConversation");await tick();assert.equal(sessionState(f.v).phase,"confirming");
  const replacement=f.h.createView();assert.equal(sessionState(replacement).phase,"idle");replacement.action("getSavedSessions",{page:0});await tick();assert.equal(sessionState(replacement).loaded,true);
  answer("Start new conversation");await tick();assert.equal(f.starts.length,1);
 } finally {answer?.(undefined);f.h.provider.dispose();}
});
test("cancelled handoff publishes idle history after aborting a pending page", async () => {
 const f=await sessionFixture();const original=f.store.inspect;f.store.inspect=async(...args)=>{const value=await original(...args);return value.ok?{...value,history:{...value.history,total:40}}:value;};
 let finish!:(value:Awaited<ReturnType<SessionBackend["history"]>>)=>void;f.store.history=async()=>new Promise(resolve=>{finish=resolve;});
 try {
  f.v.action("resumeConversation",{id:f.selected});await tick();await tick();f.v.action("getSavedHistory",{page:1});await tick();assert.equal(historyState(f.v).phase,"loading");
  f.h.api.window.showWarningMessage=async()=>undefined;f.v.action("newConversation");await tick();
  const actual=[...f.v.sent].reverse().find(m=>(m as {type:string}).type==="savedHistoryState") as SavedHistoryStateMessage;assert.equal(actual.phase,"idle");
  finish({ok:false,code:"cancelled"});await tick();
 } finally {finish?.({ok:false,code:"cancelled"});f.h.provider.dispose();}
});

test("superseded history previews and page requests wait for the old owned read to settle", async () => {
 const f=await sessionFixture();const original=f.store.inspect;f.store.inspect=async(...args)=>{const v=await original(...args);return v.ok?{...v,history:{...v.history,total:40}}:v;};
 let finish!:(value:Awaited<ReturnType<SessionBackend["preview"]>>)=>void;let signal:AbortSignal|undefined;let calls=0;
 f.store.preview=async(_cwd,_id,_anchor,_index,_offset,s)=>{calls++;signal=s;return new Promise(resolve=>{finish=resolve;});};
 try{
  f.v.action("resumeConversation",{id:f.selected});await tick();await tick();const ids=historyState(f.v).messages.map(x=>x.id);
  f.v.action("getSavedHistoryPreview",{id:ids[0],requestId:"first",offset:0});await tick();
  f.v.action("getSavedHistoryPreview",{id:ids[1],requestId:"second",offset:0});await tick();assert.equal(signal?.aborted,true);assert.equal(calls,1,"do not overlap helper processes");
  finish({ok:false,code:"cancelled"});await tick();assert.equal(calls,2);
  const oldSignal=signal;f.v.action("getSavedHistory",{page:1});await tick();assert.equal(oldSignal?.aborted,true);
  finish({ok:false,code:"cancelled"});await tick();await tick();assert.equal(historyState(f.v).page,1);assert.equal(historyState(f.v).phase,"idle");
 }finally{finish?.({ok:false,code:"cancelled"});f.h.provider.dispose();}
});

test("session catalogue waits for a cancelled history preview to settle", async () => {
 const f=await sessionFixture(); let finish!:(value:Awaited<ReturnType<SessionBackend["preview"]>>)=>void; let signal:AbortSignal|undefined; let listCalls=0;
 const list=f.store.list; f.store.list=async(...args)=>{listCalls++;return list(...args);};
 f.store.preview=async(_cwd,_id,_anchor,_index,_offset,s)=>{signal=s;return new Promise(resolve=>{finish=resolve;});};
 try {
  f.v.action("resumeConversation",{id:f.selected}); await tick(); await tick();
  f.v.action("getSavedHistoryPreview",{id:historyState(f.v).messages[0].id,requestId:"held",offset:0}); await tick();
  f.v.action("getSavedSessions",{page:0}); await tick();
  assert.equal(signal?.aborted,false); assert.equal(listCalls,0,"catalogue must wait for the active history worker");
  finish({ok:true,preview:{text:"preview before catalogue",offset:0,nextOffset:23,done:true,totalChars:23}}); await tick(); await tick();
  assert.equal(listCalls,1); assert.equal(sessionState(f.v).loaded,true); assert.ok(JSON.stringify(f.v.sent).includes("preview before catalogue"));
 } finally { finish?.({ok:false,code:"cancelled"}); f.h.provider.dispose(); }
});

test("confirmed restore waits for a cancelled history preview before inspection", async () => {
 const f=await sessionFixture(); f.v.action("resumeConversation",{id:f.selected}); await tick(); await tick(); f.v.action("getSavedSessions",{page:0}); await tick();
 let finish!:(value:Awaited<ReturnType<SessionBackend["preview"]>>)=>void; let signal:AbortSignal|undefined; let inspectCalls=0;
 const inspect=f.store.inspect; f.store.inspect=async(...args)=>{inspectCalls++;return inspect(...args);};
 f.store.preview=async(_cwd,_id,_anchor,_index,_offset,s)=>{signal=s;return new Promise(resolve=>{finish=resolve;});};
 try {
  f.v.action("getSavedHistoryPreview",{id:historyState(f.v).messages[0].id,requestId:"held",offset:0}); await tick();
  const starts=f.starts.length; const selected=sessionState(f.v).entries[0].id; f.v.action("resumeConversation",{id:selected}); await tick();
  assert.equal(signal?.aborted,true); assert.equal(inspectCalls,0); assert.equal(f.starts.length,starts);
  finish({ok:false,code:"cancelled"}); await tick(); await tick();
  assert.equal(inspectCalls,1); assert.equal(f.starts.length,starts+1); assert.equal(f.v.state().runtime,"ready");
 } finally { finish?.({ok:false,code:"cancelled"}); f.h.provider.dispose(); }
});

test("a draft change while a confirmed handoff waits makes the handoff stale", async () => {
 const f=await sessionFixture(); f.v.action("resumeConversation",{id:f.selected}); await tick(); await tick(); f.v.action("getSavedSessions",{page:0}); await tick();
 let finish!:(value:Awaited<ReturnType<SessionBackend["preview"]>>)=>void; let inspectCalls=0;
 const inspect=f.store.inspect; f.store.inspect=async(...args)=>{inspectCalls++;return inspect(...args);};
 f.store.preview=async()=>new Promise(resolve=>{finish=resolve;});
 try {
  f.v.action("getSavedHistoryPreview",{id:historyState(f.v).messages[0].id,requestId:"held",offset:0}); await tick();
  const selected=sessionState(f.v).entries[0].id; f.v.action("resumeConversation",{id:selected}); await tick();
  const draft=f.v.attachments().draft; f.v.action("updateDraft",{draftRevision:draft.revision,editSequence:draft.acceptedEditSequence+1,text:"Keep this draft"}); await tick();
  finish({ok:false,code:"cancelled"}); await tick(); await tick();
  assert.equal(inspectCalls,0); assert.equal(f.starts.length,2); assert.equal(f.v.attachments().draft.text,"Keep this draft"); assert.equal(sessionState(f.v).error,"cancelled");
 } finally { finish?.({ok:false,code:"cancelled"}); f.h.provider.dispose(); }
});

test("a cancelled confirmation still serializes the next catalogue read after history settlement", async () => {
 const f=await sessionFixture(); let finish!:(value:Awaited<ReturnType<SessionBackend["preview"]>>)=>void; let signal:AbortSignal|undefined; let listCalls=0;
 const list=f.store.list; f.store.list=async(...args)=>{listCalls++;return list(...args);};
 f.store.preview=async(_cwd,_id,_anchor,_index,_offset,s)=>{signal=s;return new Promise(resolve=>{finish=resolve;});};
 try {
  f.v.action("resumeConversation",{id:f.selected}); await tick(); await tick();
  f.v.action("getSavedHistoryPreview",{id:historyState(f.v).messages[0].id,requestId:"held",offset:0}); await tick();
  f.h.api.window.showWarningMessage=async()=>undefined;
  f.v.action("newConversation"); await tick(); await tick();
  assert.equal(signal?.aborted,true); f.v.action("getSavedSessions",{page:0}); await tick(); assert.equal(listCalls,0);
  finish({ok:false,code:"cancelled"}); await tick(); await tick(); assert.equal(listCalls,1); assert.equal(sessionState(f.v).error,null);
 } finally { finish?.({ok:false,code:"cancelled"}); f.h.provider.dispose(); }
});

test("confirmed New and Restore own attachment-picker cancellation and ignore late picker results", async () => {
 for (const target of ["new", "restore"] as const) {
  const f=await sessionFixture(); let resolvePicker!:(uris:ReturnType<typeof folder>["uri"][]|undefined)=>void;
  f.h.api.window.showOpenDialog=async()=>new Promise(resolve=>{resolvePicker=resolve;});
  try {
   const initial=f.v.state(); const initialDraft=f.v.attachments().draft; f.v.send("addFileAttachment",{generation:initial.generation,viewId:initial.viewId,draftRevision:initialDraft.revision}); await tick(); assert.equal(f.v.attachments().preparation,"picking");
   if (target === "new") f.v.action("newConversation"); else f.v.action("resumeConversation",{id:f.selected});
   await tick(); await tick(); assert.equal(f.starts.length,2,target+" handoff must commit despite host-cancelled preparation");
   resolvePicker([folder("/late-picker-result").uri]); await tick(); await tick();
   assert.deepEqual(f.v.attachments().draft.attachments,[]); assert.equal(f.v.attachments().preparation,"idle");
  } finally { resolvePicker?.([]); f.h.provider.dispose(); }
 }
});

test("cancelled New and Restore confirmations preserve pending attachment preparation", async () => {
 for (const target of ["new", "restore"] as const) {
  const f=await sessionFixture(); let resolvePicker!:(uris:ReturnType<typeof folder>["uri"][]|undefined)=>void; let answer!:(value:string|undefined)=>void;
  f.h.api.window.showOpenDialog=async()=>new Promise(resolve=>{resolvePicker=resolve;});
  f.h.api.window.showWarningMessage=async()=>new Promise(resolve=>{answer=resolve;});
  try {
   const initial=f.v.state(); const initialDraft=f.v.attachments().draft; f.v.send("addFileAttachment",{generation:initial.generation,viewId:initial.viewId,draftRevision:initialDraft.revision}); await tick(); const revision=f.v.attachments().draft.revision; assert.equal(f.v.attachments().preparation,"picking");
   if (target === "new") f.v.action("newConversation"); else f.v.action("resumeConversation",{id:f.selected});
   await tick(); assert.equal(f.v.attachments().preparation,"picking"); answer(undefined); await tick();
   assert.equal(f.v.attachments().preparation,"picking"); assert.equal(f.v.attachments().draft.revision,revision);
   resolvePicker([]); await tick(); assert.equal(f.v.attachments().preparation,"idle");
  } finally { answer?.(undefined); resolvePicker?.([]); f.h.provider.dispose(); }
 }
});
test("committed New and Restore clear a stale zero-item attachment failure", async () => {
 for (const target of ["new", "restore"] as const) {
  const f=await sessionFixture(); f.h.api.window.showOpenDialog=async()=>[];
  try {
   const state=f.v.state(); const draft=f.v.attachments().draft; f.v.send("addFileAttachment",{generation:state.generation,viewId:state.viewId,draftRevision:draft.revision}); await tick(); await tick();
   assert.equal(f.v.attachments().result?.code,"cancelled");
   if(target==="new") f.v.action("newConversation"); else f.v.action("resumeConversation",{id:f.selected});
   await tick(); await tick(); assert.equal(f.starts.length,2); assert.equal(f.v.attachments().result,null);
  } finally { f.h.provider.dispose(); }
 }
});
test("a nonempty restored history without a frozen public anchor fails before replacing the runtime", async () => {
 const f=await sessionFixture();const inspect=f.store.inspect;f.store.inspect=async(...args)=>{const result=await inspect(...args);return result.ok?{...result,anchor:null}:result;};
 try{f.v.action("resumeConversation",{id:f.selected});await tick();await tick();assert.equal(f.starts.length,1);assert.equal(sessionState(f.v).error,"restore-failed");assert.equal(historyState(f.v).available,false);}finally{f.h.provider.dispose();}
});





test("history actions during catalogue work receive recoverable replies instead of hanging", async () => {
 const f=await sessionFixture(); const inspect=f.store.inspect;
 f.store.inspect=async(...args)=>{const r=await inspect(...args);return r.ok?{...r,history:{...r.history,total:40}}:r;};
 let finish!:(value:Awaited<ReturnType<SessionBackend["list"]>>)=>void; let reads=0;
 try {
  f.v.action("resumeConversation",{id:f.selected}); await tick(); await tick(); const row=historyState(f.v).messages[0].id;
  f.store.list=async()=>new Promise(resolve=>{finish=resolve;});
  f.store.preview=async()=>{reads++;return {ok:false,code:"unavailable"};};
  f.store.history=async()=>{reads++;return {ok:false,code:"unavailable"};};
  f.v.action("getSavedSessions",{page:0}); await tick();
  f.v.action("getSavedHistoryPreview",{id:row,requestId:"during-list",offset:0}); await tick();
  assert.ok(f.v.sent.some(m=>{const r=m as {type:string;requestId?:string;code?:string};return r.type==="savedHistoryPreview"&&r.requestId==="during-list"&&r.code==="unavailable";}));
  f.v.action("getSavedHistory",{page:1}); await tick(); assert.equal(historyState(f.v).phase,"error"); assert.equal(historyState(f.v).error,"unavailable"); assert.equal(reads,0);
  finish({ok:true,entries:[saved],page:0,total:1}); await tick(); await tick(); f.v.action("getSavedHistory",{page:1}); await tick(); assert.equal(reads,1);
 } finally {finish?.({ok:false,code:"cancelled"});f.h.provider.dispose();}
});

test("a recreated view waits for an aborted catalogue helper before reading retained text", async () => {
 const f=await sessionFixture();let finish!:(value:Awaited<ReturnType<SessionBackend["list"]>>)=>void;let signal:AbortSignal|undefined;let previews=0;
 try {
  f.v.action("resumeConversation",{id:f.selected});await tick();await tick();
  f.store.list=async(_cwd,_page,s)=>{signal=s;return new Promise(resolve=>{finish=resolve;});};
  f.store.preview=async()=>{previews++;return {ok:true,preview:{text:"Retained",offset:0,nextOffset:8,totalChars:8,done:true}};};
  f.v.action("getSavedSessions",{page:0});await tick();const replacement=f.h.createView();assert.equal(signal?.aborted,true);
  replacement.action("getSavedHistoryPreview",{id:historyState(replacement).messages[0].id,requestId:"new-view",offset:0});await tick();assert.equal(previews,0);
  finish({ok:false,code:"cancelled"});await tick();await tick();assert.equal(previews,1);assert.ok(JSON.stringify(replacement.sent).includes('"text":"Retained"'));
 } finally {finish?.({ok:false,code:"cancelled"});f.h.provider.dispose();}
});

test("view recreation cannot form a cycle between queued history and an obsolete catalogue", async () => {
 const f=await sessionFixture();let finish!:(value:Awaited<ReturnType<SessionBackend["preview"]>>)=>void;let previews=0;let lists=0;
 try {
  f.v.action("resumeConversation",{id:f.selected});await tick();await tick();
  f.store.preview=async()=>{if(++previews===1)return new Promise(resolve=>{finish=resolve;});return {ok:true,preview:{text:"Fresh",offset:0,nextOffset:5,totalChars:5,done:true}};};
  f.store.list=async()=>{lists++;return {ok:true,entries:[saved],page:0,total:1};};
  f.v.action("getSavedHistoryPreview",{id:historyState(f.v).messages[0].id,requestId:"old-read",offset:0});await tick();
  f.v.action("getSavedSessions",{page:0});await tick();assert.equal(lists,0);
  const replacement=f.h.createView();replacement.action("getSavedHistoryPreview",{id:historyState(replacement).messages[0].id,requestId:"fresh-read",offset:0});await tick();
  finish({ok:false,code:"cancelled"});await tick();await tick();assert.equal(previews,2);assert.equal(lists,0);assert.ok(JSON.stringify(replacement.sent).includes('"text":"Fresh"'));
 } finally {finish?.({ok:false,code:"cancelled"});f.h.provider.dispose();}
});
