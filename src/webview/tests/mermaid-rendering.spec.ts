import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react";
import { readFileSync } from "node:fs";
import { createMermaidRenderer, mermaidRenderer, type SafeSvgNode } from "../diagrams/index.js";
import { uiHarness } from "./react-harness.js";

// Before code: do not render partial/unsafe/oversize source; retain source/copy,
// allow explicit bounded diagrams only; reject resource SVG and late work.
const source = "flowchart LR\n A[Start] --> B[Done]";
const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><defs><marker id="arrow"><path d="M0 0L10 5L0 10z"/></marker></defs><path marker-end="url(#arrow)" d="M0 0L100 50"/><text x="20" y="40">Synthetic graph</text></svg>';
function body(text: string) { return { messages: [{ role: "assistant" as const, text }], chatBusy: false }; }
const fence = (text: string, close = true) => "```mermaid\n" + text + (close ? "\n```" : "");
function nodes(tree: SafeSvgNode): SafeSvgNode[] { return [tree, ...(tree.children ?? []).flatMap(nodes)]; }

// Exercise production body -> Markdown -> graph control -> rendering boundary.
test("mounted Mermaid requires a closed fence and explicit render while keeping literal source and Copy", async t => {
  const h = await uiHarness(); let calls = 0;
  t.mock.method(mermaidRenderer, "render", async () => { calls++; return { ok: true, svg: { tag: "svg", attrs: { viewBox: "0 0 200 100" }, children: [{ tag: "text", attrs: { x: "20", y: "40" }, text: "Synthetic graph", children: [] }] } }; });
  try {
    await h.render(body(fence(source, false))); assert.equal(calls, 0); assert.equal(h.root.querySelector('[aria-label="Render Mermaid diagram"]'), null);
    assert.equal(h.get("pre code").textContent, source);
    await h.render(body(fence(source))); assert.equal(calls, 0);
    await h.click('[aria-label="Render Mermaid diagram"]'); assert.equal(calls, 1);
    assert.ok(h.root.querySelector('svg[role="img"]')); assert.equal(h.get("pre code").textContent, source);
    assert.ok(h.root.querySelector('[aria-label="Copy code"]'));
    assert.equal(h.sent.some(value => value.type === "sendChat" || value.type === "resumeConversation"), false);
  } finally { await h.close(); }
});

test("production Mermaid boundary refuses unsafe, unsupported and over-budget input before upstream", async () => {
  const h = await uiHarness(); let calls = 0;
  const renderer = createMermaidRenderer({ initialize() {}, async render() { calls++; return { svg }; } });
  try {
    const cases = ['%%{init: {"securityLevel":"loose"}}%%\n'+source, 'flowchart LR\n A@{img:"https://example.invalid/sentinel"}',
      'flowchart LR\n A[<img src=x onerror=alert(1)>]', 'flowchart LR\n click A callback', 'flowchart LR\n style A fill:url(https://example.invalid/sentinel)',
      'flowchart LR\n A[&#60;script&#62;]', 'flowchart LR\n A & B --> C', 'pie\n "slice": 10', 'flowchart LR\n A['+'x'.repeat(4097)+']',
      'flowchart LR\n'+Array.from({length:41},()=> 'A-->B').join('\n'), 'flowchart LR\n'+Array.from({length:70},(_,i)=>'N'+i).join(';')];
    for (const input of cases) assert.equal((await renderer.render(input, new AbortController().signal)).ok, false, input.slice(0,80));
    assert.equal(calls, 0);
    const accepted = await renderer.render(source, new AbortController().signal); assert.equal(accepted.ok,true); assert.equal(calls,1);
    if (!accepted.ok) throw new Error("Expected safe SVG");
    const all = nodes(accepted.svg); const ids = all.flatMap(n=>n.attrs.id ? [n.attrs.id] : []);
    assert.ok(ids.length > 0); assert.ok(!ids.includes("arrow"));
    assert.ok(all.some(n=>Object.values(n.attrs).includes(`url(#${ids[0]})`)));
  } finally { await h.close(); }
});

test("production renderer rejects resources, invalid geometry and oversized SVG without installing HTML or callbacks", async () => {
  const h = await uiHarness(); let output = svg; let bound = 0;
  const renderer = createMermaidRenderer({ initialize() {}, async render() { return { svg: output, bindFunctions() { bound++; } }; } });
  try {
    const unsafe = ['<image href="https://example.invalid/sentinel"/>','<foreignObject><img src="https://example.invalid/sentinel"/></foreignObject>',
      '<script>alert(1)</script>', '<use href="https://example.invalid/sentinel#x"/>', '<a href="javascript:alert(1)"><text>bad</text></a>', '<path onclick="alert(1)" d="M0 0"/>', '<path marker-end="url(https://example.invalid/sentinel)" d="M0 0"/>'];
    for (const extra of unsafe) { output = svg.replace('</svg>',extra+'</svg>'); assert.equal((await renderer.render(source,new AbortController().signal)).ok,false); }
    for (const malformed of [svg.replace('0 0 200 100','0 0 Infinity 100'), svg.replace('0 0 200 100','0 0 999999 100'),
      svg.replace('</svg>','<text>'+'x'.repeat(262145)+'</text></svg>'), svg.replace('</svg>','<g>'.repeat(20)+'<text>x</text>'+'</g>'.repeat(20)+'</svg>')]) {
      output=malformed; assert.equal((await renderer.render(source,new AbortController().signal)).ok,false);
    }
    assert.equal(bound,0); assert.equal(h.root.querySelector('image,foreignObject,script,use'),null);
  } finally { await h.close(); }
});

test("renderer serializes active work, limits waiting work, cancels queued work and discards late results", async () => {
  const h = await uiHarness(); let calls=0; const finish: ((value:{svg:string})=>void)[]=[];
  const renderer = createMermaidRenderer({ initialize() {}, render() { calls++; return new Promise(resolve=>finish.push(resolve)); } });
  const active=new AbortController(), queued=new AbortController();
  try {
    const first=renderer.render(source,active.signal); const second=renderer.render(source,queued.signal);
    const excess=await renderer.render(source,new AbortController().signal); assert.equal(excess.ok,false); assert.equal(calls,1);
    queued.abort(); assert.equal((await second).ok,false); active.abort();
    finish[0]!({svg}); assert.equal((await first).ok,false); assert.equal(calls,1);
    const later=renderer.render(source,new AbortController().signal); assert.equal(calls,2); finish[1]!({svg}); assert.equal((await later).ok,true);
  } finally { await h.close(); }
});

test("mounted source replacement and cancellation retain code and ignore late graph results", async t => {
  const h=await uiHarness(); let finish!: (value:unknown)=>void;
  t.mock.method(mermaidRenderer,"render",()=>new Promise(resolve=>{finish=resolve;}));
  const safe={ok:true,svg:{tag:"svg",attrs:{viewBox:"0 0 200 100"},children:[{tag:"text",attrs:{},text:"Late unwanted diagram",children:[]}]}};
  try {
    await h.render(body(fence(source))); await h.click('[aria-label="Render Mermaid diagram"]');
    await h.click('[aria-label="Cancel diagram rendering"]'); await act(async()=>{finish(safe);});
    assert.equal(h.root.querySelector('svg[role="img"]'),null); assert.equal(h.get("pre code").textContent,source);
    await h.click('[aria-label="Render Mermaid diagram"]');
    const replacement="flowchart LR\n C[Replacement] --> D[End]"; await h.render(body(fence(replacement)));
    await act(async()=>{finish(safe);}); assert.doesNotMatch(h.root.textContent??'',/Late unwanted diagram/); assert.equal(h.get("pre code").textContent,replacement);
    await h.click('[aria-label="Render Mermaid diagram"]'); await h.unmount(); await act(async()=>{finish(safe);}); assert.equal(h.root.querySelector("svg"),null);
  } finally { await h.close(); }
});

test("failed explicit rendering preserves source with visible recovery and production policy stays strict", async t => {
  const h=await uiHarness(); t.mock.method(mermaidRenderer,"render",async()=>({ok:false,code:"invalid"}));
  try {
    await h.render(body(fence(source))); await h.click('[aria-label="Render Mermaid diagram"]');
    assert.match(h.root.textContent??'',/Diagram unavailable/); assert.equal(h.get('pre code').textContent,source); assert.ok(h.root.querySelector('[aria-label="Copy code"]'));
    const policy=readFileSync('src/extension/bridge/webviewHtml.ts','utf8');
    assert.match(policy,/connect-src 'none'/); assert.match(policy,/frame-src 'none'/); assert.doesNotMatch(policy,/unsafe-inline|unsafe-eval|https:/);
  } finally { await h.close(); }
});

test("result deadline discards late work without claiming synchronous interruption or freeing the active slot", async t => {
  const h=await uiHarness(); t.mock.timers.enable({apis:["setTimeout"]}); let calls=0;
  const finish: ((value:{svg:string})=>void)[]=[];
  const renderer=createMermaidRenderer({initialize(){},render(){calls++;return new Promise(resolve=>finish.push(resolve));}});
  try {
    const first=renderer.render(source,new AbortController().signal); t.mock.timers.tick(5001);
    assert.equal((await first).ok,false); const next=renderer.render(source,new AbortController().signal); assert.equal(calls,1);
    finish[0]!({svg}); await act(async()=>{}); assert.equal(calls,2); finish[1]!({svg}); assert.equal((await next).ok,true);
  } finally { await h.close(); }
});
