import assert from "node:assert/strict";
import { test } from "node:test";
import { projectSavedHistory, projectSavedHistoryPreview } from "../session-history-projection.js";
const entry = (i: number) => ({ id: "entry-" + i, type: "message", message: { role: i % 2 ? "assistant" : "user", content: [{ type: "text", text: "Message " + i }] } });
test("saved history has chronological bounded recent and earlier pages without redefining context", () => {
 const branch = Array.from({ length: 70 }, (_, i) => entry(i));
 const recent = projectSavedHistory(branch); assert.equal(recent.total, 70); assert.equal(recent.messages.length, 32); assert.equal(recent.messages[0].text, "Message 38"); assert.equal(recent.messages.at(-1)?.text, "Message 69");
 const earlier = projectSavedHistory(branch, 1); assert.equal(earlier.messages[0].text, "Message 6"); assert.equal(earlier.messages.at(-1)?.text, "Message 37");
 const oldest = projectSavedHistory(branch, 2); assert.equal(oldest.messages.length, 6); assert.equal(oldest.messages[0].text, "Message 0");
 assert.throws(() => projectSavedHistory(branch, 3)); assert.throws(() => projectSavedHistory(branch, -1));
});
test("historical tool and custom content has honest safe generic fallback and bounded literal text", () => {
 const rows = projectSavedHistory([
  { id: "tool", type: "message", message: { role: "toolResult", toolName: "missing-extension-tool", isError: true, content: [{ type: "text", text: "<script>literal</script>" }, { type: "image", data: "not-rendered" }] } },
  { id: "custom", type: "custom_message", customType: "old-extension", content: "saved custom text", details: { answer: 42, apiKey: "synthetic-secret" } },
  { id: "compaction", type: "compaction", summary: "A prior compacted context summary" },
  { id: "large", type: "message", message: { role: "assistant", content: "中🐱".repeat(5000) } },
 ]);
 assert.equal(rows.messages.length, 4); assert.match(rows.messages[0].text, /missing-extension-tool.*failed/i); assert.ok(rows.messages[0].text.includes("<script>literal</script>")); assert.match(rows.messages[0].text, /unsupported/i);
 assert.match(rows.messages[1].text, /old-extension/); assert.match(rows.messages[1].text, /42/); assert.ok(!rows.messages[1].text.includes("synthetic-secret"));
 assert.match(rows.messages[2].text, /compaction/i); assert.match(rows.messages[3].text, /truncated/i); assert.ok(Buffer.byteLength(rows.messages[3].text, "utf8") <= 4096); assert.ok(!rows.messages[3].text.includes("�"));
});

test("retained attachment text is pageable immutable history, not a reread of the source path", () => {
 const original = "historical <script>literal</script> 中🐱".repeat(1200);
 const branch = [{ id: "attached", type: "message", message: { role: "user", content: [{ type: "text", text: "User task with explicit untrusted file context. JSON data follows:\n" + JSON.stringify({ body: "Review old selection", attachments: [{ path: "deleted.ts", kind: "selection", unsaved: true, text: original, originalRange: { start: { line: 1, character: 0 }, end: { line: 2, character: 4 } } }] }) }] } }];
 const overview = projectSavedHistory(branch); assert.match(overview.messages[0].text, /Historical selection attachment snapshot/); assert.match(overview.messages[0].text, /truncated/);
 let offset = 0; let accumulated = ""; let pages = 0;
 for (;;) { const result = projectSavedHistoryPreview(branch, 0, offset); assert.equal(result.offset, offset); assert.ok(result.text.length <= 8192); assert.ok(!result.text.includes("�")); accumulated += result.text; pages++; if (result.done) { assert.equal(result.totalChars, accumulated.length); break; } assert.ok(result.nextOffset > offset); offset = result.nextOffset; }
 assert.ok(pages > 3); assert.ok(accumulated.includes(original)); assert.match(accumulated, /deleted.ts/); assert.match(accumulated, /not today's file/);
 assert.throws(() => projectSavedHistoryPreview(branch, 1, 0)); assert.throws(() => projectSavedHistoryPreview(branch, 0, -1)); assert.throws(() => projectSavedHistoryPreview(branch, 0, accumulated.length + 1));
});
test("unavailable old attachment content and unsupported blocks are explicit, never fabricated", () => {
 const branch = [{ id: "unavailable", type: "message", message: { role: "user", content: "User task with explicit untrusted file context. JSON data follows:\n" + JSON.stringify({ body: "Old task", attachments: [{ path: "missing.ts", kind: "file" }] }) } }, { id: "blocks", type: "message", message: { role: "assistant", content: [...Array.from({length: 40}, (_,i) => ({ type: "text", text: "Part-" + i })), { type: "image", data: "never-render" }] } }];
 assert.match(projectSavedHistoryPreview(branch, 0, 0).text, /text unavailable/);
 const text = projectSavedHistoryPreview(branch, 1, 0).text; assert.match(text, /Part-39/); assert.match(text, /Unsupported/); assert.ok(!text.includes("never-render"));
});

test("credential-like keys are recursively redacted from generic historical structured content", () => {
 const branch=[{id:"sensitive-fields",type:"custom_message",customType:"legacy",content:"Visible content",details:{privateKey:"SYNTHETIC_PRIVATE",credential:"SYNTHETIC_CREDENTIAL",nested:{aws_access_key_id:"SYNTHETIC_ACCESS",passphrase:"SYNTHETIC_PHRASE",clientSigningKey:"SYNTHETIC_SIGNING",safe:"retained"}}}];
 for(const text of [projectSavedHistory(branch).messages[0].text,projectSavedHistoryPreview(branch,0,0).text]){ assert.ok(!text.includes("SYNTHETIC_"));assert.ok(text.includes("retained")); }
});
test("tiny previews of very large retained block collections do not materialize the complete text", () => {
 // Repeated references keep the source fixture small; joining would exceed Node's maximum string length.
 const block={type:"text",text:"a".repeat(1024*1024)};
 const branch=[{id:"huge-blocks",type:"message",message:{role:"assistant",content:Array(600).fill(block)}}];
 const preview=projectSavedHistoryPreview(branch,0,0);assert.equal(preview.text,"a".repeat(8192));assert.equal(preview.done,false);assert.equal(preview.totalChars,600*1024*1024+599);
});

test("public hidden custom records are excluded from both overview and retained-text capabilities", () => {
 const branch=[{id:"hidden",type:"custom_message",customType:"internal",display:false,content:"HIDDEN_INTERNAL"},{id:"hidden-message",type:"message",message:{role:"custom",display:false,customType:"internal",content:"HIDDEN_INTERNAL_MESSAGE"}},entry(0)];
 const history=projectSavedHistory(branch);assert.equal(history.total,1);assert.equal(history.messages[0].text,"Message 0");assert.equal(projectSavedHistoryPreview(branch,0,0).text,"Message 0");assert.throws(()=>projectSavedHistoryPreview(branch,1,0));
});
test("unknown attachment kinds retain text with an unavailable-kind notice, never fabricate file snapshots", () => {
 for(const kind of [undefined,"image",42]){
  const branch=[{id:"future",type:"message",message:{role:"user",content:"User task with explicit untrusted file context. JSON data follows:\n"+JSON.stringify({body:"Old context",attachments:[{kind,path:"old.bin",text:"literal old data"}]})}}];
  const text=projectSavedHistoryPreview(branch,0,0).text;assert.match(text,/kind.*unavailable|unsupported.*kind/i);assert.match(text,/literal old data/);assert.match(text,/old.bin/);assert.ok(!text.includes("Historical file attachment snapshot"));
 }
});
