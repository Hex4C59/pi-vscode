import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react";
import { candidateHarness } from "./candidate-harness.js";


const send = 'button[aria-label="Send message"]';
const stop = 'button[aria-label="Stop current task"]';

test("candidate sends one confirmed draft, streams literal text, and Stop preserves a newer draft", async t => {
  const h = await candidateHarness(t);
  assert.match(h.root.textContent ?? "", /What should we work on/);
  assert.equal(h.get<HTMLButtonElement>(send).disabled, true);
  await h.input('<img src=x onerror="throw 1"> inspect this');
  await act(async () => { const button = h.get(send); button.click(); button.click(); });
  assert.equal(h.root.querySelectorAll(".candidate__message--user").length, 1);
  assert.equal(h.root.querySelector("img"), null);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "");
  await h.input("Keep this newer draft");
  await h.advance(360);
  assert.match(h.get(".candidate__message--assistant").textContent ?? "", /I checked the workspace context/);
  await h.click(stop);
  assert.equal(h.get<HTMLButtonElement>(stop).disabled, true);
  assert.match(h.root.textContent ?? "", /Stopping/);
  await h.advance(420);
  assert.equal(h.root.querySelector(stop), null);
  assert.match(h.root.textContent ?? "", /Task stopped/);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Keep this newer draft");
  assert.equal(h.get<HTMLButtonElement>(send).disabled, false);
});

test("candidate distinguishes applied and pending settings until stream settlement without clearing draft or focus", async t => {
  const h = await candidateHarness(t);
  await h.input("Start a reply"); await h.click(send);
  await h.click("#model-effort-trigger"); await h.click("#model-current");
  await h.click('#model-list button:nth-child(2)');
  assert.match(h.get("#model-effort-trigger").textContent ?? "", /Claude Sonnet/);
  assert.match(h.get("#pending-settings").textContent ?? "", /Next turn.*GPT-5/);
  await h.click("#model-effort-trigger");
  await act(async () => {
    const slider = h.get<HTMLInputElement>("#thinking-slider");
    slider.value = "3";
    slider.dispatchEvent(new h.dom.window.Event("input", { bubbles: true }));
    slider.dispatchEvent(new h.dom.window.Event("change", { bubbles: true }));
  });
  assert.match(h.get("#thinking-level-label").textContent ?? "", /Applied: medium.*pending.*high/);
  await act(async () => h.dom.window.dispatchEvent(new h.dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  assert.equal(h.dom.window.document.activeElement, h.get("#model-effort-trigger"));
  await h.input("Draft for later"); h.get("textarea").focus();
  await h.advance(360);
  for (let chunk = 0; chunk < 4; chunk++) await h.advance(420);
  assert.match(h.get("#pending-settings").textContent ?? "", /Applying/);
  assert.equal(h.get<HTMLButtonElement>(send).disabled, true);
  await h.advance(520);
  assert.match(h.get("#model-effort-trigger").textContent ?? "", /GPT-5.*high/);
  assert.equal(h.get("#pending-settings").hidden, true);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Draft for later");
  assert.equal(h.dom.window.document.activeElement, h.get("textarea"));
});

for (const [scenario, copy] of [
  ["error", /Runtime unavailable/], ["blocked", /Single folder only/],
  ["unavailable-model", /No configured model/],
] as const) test(`candidate ${scenario} state cannot send and has synthetic recovery`, async t => {
  const h = await candidateHarness(t, scenario);
  assert.match(h.root.textContent ?? "", copy);
  assert.equal(h.get<HTMLButtonElement>(send).disabled, true);
  await h.recover();
  await h.input("Recovered draft");
  assert.equal(h.get<HTMLButtonElement>(send).disabled, false);
  await h.click(send);
  assert.ok(h.root.querySelector(stop));
});

for (const [scenario, action] of [["no-folder", "#open-folder"], ["untrusted", "#manage-trust"]] as const) {
  test(`candidate ${scenario} uses the existing named workspace recovery and resource choice`, async t => {
    const h = await candidateHarness(t, scenario);
    assert.equal(h.get<HTMLTextAreaElement>("textarea").disabled, scenario !== "no-folder");
    if (scenario === "no-folder") { await h.input("Retain before opening a folder"); await h.click(send); }
    await h.click(action);
    await h.click('button[aria-label="Add context"]');
    await h.click('button[aria-label="Add file"]');
    await h.click("#decline");
    if (scenario === "no-folder") {
      assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Retain before opening a folder");
      assert.equal(h.root.querySelectorAll(".candidate__message--user").length, 0);
      assert.equal(h.root.querySelectorAll(stop).length, 0);
      assert.equal(h.root.querySelectorAll("dialog").length, 0);
    }
    await h.input("Continue without project resources");
    assert.equal(h.get<HTMLButtonElement>(send).disabled, false);
  });
}

test("candidate loading is distinct and becomes ready only after the synthetic projection", async t => {
  const h = await candidateHarness(t, "loading");
  assert.match(h.root.textContent ?? "", /Loading runtime and models/);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").disabled, true);
  await h.advance(899);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").disabled, true);
  await h.advance(1);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").disabled, false);
  assert.match(h.root.textContent ?? "", /What should we work on/);
});

test("candidate reset and repeated disposal release pending work and cannot repopulate the unmounted page", async t => {
  const h = await candidateHarness(t, "streaming");
  const clearTimeout = globalThis.clearTimeout;
  let cleared = 0;
  globalThis.clearTimeout = timer => { cleared++; clearTimeout(timer); };
  try {
    await h.reset();
    assert.ok(cleared > 0, "reset cancels the previous synthetic stream's timer");
    await h.advance(10_000);
    assert.equal(h.root.querySelectorAll(".candidate__message").length, 0);
    await h.input("Start another stream"); await h.click(send);
    const before = cleared;
    await h.dispose(); await h.dispose();
    assert.ok(cleared > before, "unmount cancels the synthetic host's timer");
    await h.advance(10_000);
    await h.recover();
    assert.equal(h.root.childElementCount, 0);
  } finally { globalThis.clearTimeout = clearTimeout; }
});

test("candidate preserves previous turns and applies pending settings after Stop before the next send", async t => {
  const h = await candidateHarness(t);
  await h.input("First turn"); await h.click(send); await h.advance(360);
  // Stop updates the activity status; the previously streamed reply body must not change.
  const firstReply = h.get(".candidate__message--assistant .candidate__text").textContent;
  await h.click("#model-effort-trigger"); await h.click("#model-current");
  await h.click("#model-list button:nth-child(2)");
  await h.input("Second turn"); await h.click(stop); await h.advance(420);
  assert.equal(h.get<HTMLButtonElement>(send).disabled, true, "pending settings apply before another turn is eligible");
  await h.advance(420);
  assert.match(h.get("#model-effort-trigger").textContent ?? "", /Claude Sonnet/);
  await h.advance(100);
  assert.match(h.get("#model-effort-trigger").textContent ?? "", /GPT-5/);
  await h.click(send);
  assert.equal(h.root.querySelectorAll(".candidate__message--user").length, 2);
  assert.equal(h.root.querySelectorAll(".candidate__message--assistant").length, 2);
  assert.equal(h.get(".candidate__message--assistant .candidate__text").textContent, firstReply);
});

test("candidate thinking drag previews continuous positions and commits only a changed supported level on release", async t => {
  const h = await candidateHarness(t);
  await h.input("Keep this draft"); await h.click("#model-effort-trigger");
  const slider = h.get<HTMLInputElement>("#thinking-slider");
  assert.equal(h.root.querySelectorAll(".thinking-control__stop").length, Number(slider.max) + 1, "markers follow model capabilities");
  await act(async () => { slider.value = String(Number(slider.max) - 0.1); slider.dispatchEvent(new h.dom.window.Event("input", { bubbles: true })); });
  assert.equal(h.get(".thinking-control").getAttribute("data-maximum"), "false", "near-maximum drag must not start flow early");
  await act(async () => { slider.value = slider.max; slider.dispatchEvent(new h.dom.window.Event("input", { bubbles: true })); });
  assert.equal(h.get(".thinking-control").getAttribute("data-maximum"), "true");
  await act(async () => { slider.value = "1.4"; slider.dispatchEvent(new h.dom.window.Event("input", { bubbles: true })); });
  assert.equal(h.get(".thinking-control").getAttribute("data-maximum"), "false", "leaving maximum stops flow");
  assert.equal(slider.value, "1.4", "preview follows the pointer between supported levels");
  assert.equal(h.get<HTMLButtonElement>("#model-effort-trigger").disabled, false, "dragging does not apply settings");
  assert.match(h.get("#thinking-level-label").textContent ?? "", /Applied: medium/);
  await act(async () => slider.dispatchEvent(new h.dom.window.Event("change", { bubbles: true })));
  assert.equal(slider.value, "1", "release snaps to the nearest supported level");
  assert.equal(h.get<HTMLButtonElement>("#model-effort-trigger").disabled, true);
  await h.advance(420);
  assert.match(h.get("#thinking-level-label").textContent ?? "", /Applied: low/);
  await act(async () => {
    slider.value = "1.2";
    slider.dispatchEvent(new h.dom.window.Event("input", { bubbles: true }));
    slider.dispatchEvent(new h.dom.window.Event("change", { bubbles: true }));
  });
  assert.equal(slider.value, "1");
  assert.equal(h.get<HTMLButtonElement>("#model-effort-trigger").disabled, false, "the same level does not trigger another apply");
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Keep this draft");
});

test("candidate thinking keyboard selects supported levels while keeping applied and pending settings distinct", async t => {
  const h = await candidateHarness(t, "streaming");
  await h.click("#model-effort-trigger");
  const slider = h.get<HTMLInputElement>("#thinking-slider");
  const key = (value: string) => act(async () => slider.dispatchEvent(new h.dom.window.KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true })));
  await key("ArrowLeft");
  assert.equal(slider.value, "1");
  assert.match(h.get("#thinking-level-label").textContent ?? "", /Applied: medium.*pending.*low/);
  await key("Home"); assert.equal(slider.value, "0");
  assert.match(h.get("#thinking-level-label").textContent ?? "", /pending.*off/);
  await key("End"); await key("ArrowRight"); assert.equal(slider.value, "3");
  assert.match(h.get("#thinking-level-label").textContent ?? "", /Applied: medium.*pending.*high/);
  await h.click(stop);
  assert.equal(slider.disabled, true);
  await key("ArrowLeft"); assert.equal(slider.value, "3", "stopping cannot change the selection");
});


test("candidate reads headings, lists, links and an unfinished code fence through successive stream updates", async t => {
  const h = await candidateHarness(t, "formatted");
  await h.advance(360);
  assert.equal(h.get("h1").textContent, "Formatted reply");
  assert.deepEqual([...h.root.querySelectorAll("ul li")].map(item => item.textContent), ["First step", "Second step"]);
  assert.deepEqual([...h.root.querySelectorAll("ol li")].map(item => item.textContent), ["Inspect", "Verify"]);
  assert.equal(h.get("pre code").textContent, 'const greeting = "<hello>');
  await h.advance(420);
  assert.equal(h.get("pre code").textContent, 'const greeting = "<hello>&";\n  console.log(greeting);');
  await h.advance(420);
  assert.equal(h.get("pre code").textContent, 'const greeting = "<hello>&";\n  console.log(greeting);');
  const link = h.get<HTMLAnchorElement>('a');
  assert.equal(link.textContent, "the guide");
  assert.equal(link.href, "https://example.com/guide");
});

test("candidate copies the exact partial and completed code without copying Markdown fences", async t => {
  const h = await candidateHarness(t, "formatted");
  const copied: string[] = [];
  Object.defineProperty(h.dom.window.navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { copied.push(text); } } });
  await h.advance(360);
  await h.click('button[aria-label="Copy code"]');
  assert.deepEqual(copied, ['const greeting = "<hello>']);
  assert.match(h.root.textContent ?? "", /Code copied/);
  await h.advance(420); await h.advance(420);
  await h.click('button[aria-label="Copy code"]');
  assert.deepEqual(copied, ['const greeting = "<hello>', 'const greeting = "<hello>&";\n  console.log(greeting);']);
});

test("candidate reports clipboard rejection, unavailability and a pending permission timeout without false success", async t => {
  const h = await candidateHarness(t, "formatted");
  await h.advance(360);
  Object.defineProperty(h.dom.window.navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("denied"); } } });
  await h.click('button[aria-label="Copy code"]');
  assert.match(h.root.textContent ?? "", /Copy failed/);
  Object.defineProperty(h.dom.window.navigator, "clipboard", { configurable: true, value: undefined });
  await h.click('button[aria-label="Copy code"]');
  assert.match(h.root.textContent ?? "", /clipboard.*unavailable/i);
  await h.advance(420); await h.advance(420); await h.advance(420);
  let resolveCopy = () => {};
  Object.defineProperty(h.dom.window.navigator, "clipboard", { configurable: true, value: { writeText: () => new Promise<void>(resolve => { resolveCopy = resolve; }) } });
  await h.click('button[aria-label="Copy code"]');
  await h.advance(6000);
  assert.match(h.root.textContent ?? "", /Copy timed out/);
  await act(async () => { resolveCopy(); });
  assert.doesNotMatch(h.root.textContent ?? "", /Code copied/);
  await h.reset();
  assert.doesNotMatch(h.root.textContent ?? "", /Copy failed|Copy timed out|Code copied/);
});

test("candidate keeps hostile HTML, resources and URLs inert and visibly refuses unsafe navigation", async t => {
  const h = await candidateHarness(t, "safe-output");
  assert.equal(h.get(".candidate__message--assistant").querySelectorAll("img,script,iframe,object,embed,video,audio,svg").length, 0);
  const links = [...h.root.querySelectorAll("a")];
  assert.deepEqual(links.map(link => link.href), ["https://example.com/guide"]);
  assert.equal(links[0].target, "_blank");
  assert.match(links[0].rel, /noopener/);
  assert.match(links[0].rel, /noreferrer/);
  assert.match(h.root.textContent ?? "", /<script>alert\(1\)<\/script>/);
  assert.match(h.root.textContent ?? "", /!\[remote image\]/);
  assert.equal(h.root.querySelectorAll('[aria-label="Blocked link"]').length, 7);
  assert.match(h.root.textContent ?? "", /Link blocked/);
});

test("candidate exposes activity before the reply and retains two-level expansion and focus when text and tools arrive", async t => {
  const h = await candidateHarness(t, "activity");
  const activity = h.get<HTMLDetailsElement>('details[aria-label="Message activity"]');
  assert.match(activity.querySelector("summary")?.textContent ?? "", /1 thinking/);
  assert.equal(activity.open, false);
  await h.click('details[aria-label="Message activity"] > summary');
  await h.click('details[aria-label="Thinking details"] > summary');
  const thinking = h.get<HTMLDetailsElement>('details[aria-label="Thinking details"]');
  const summary = thinking.querySelector("summary"); assert.ok(summary);
  await act(async () => summary.focus());
  assert.match(thinking.textContent ?? "", /Observed reasoning line 1/);
  await h.advance(360);
  assert.equal(h.get("h1").textContent, "Activity-first reply");
  assert.equal(activity.open, true);
  assert.equal(thinking.open, true);
  assert.equal(h.dom.window.document.activeElement === summary, true);
  await h.advance(420);
  assert.match(activity.querySelector("summary")?.textContent ?? "", /1 tool.*1 thinking/);
  assert.equal(thinking.open, true);
  assert.equal(h.dom.window.document.activeElement === summary, true);
  await h.click('details[aria-label="Tool details"] > summary');
  assert.match(h.get('details[aria-label="Tool details"]').textContent ?? "", /src\/preview\/example.ts/);
});

test("candidate discloses failed and truncated activity even while details are collapsed", async t => {
  const h = await candidateHarness(t, "activity");
  await h.advance(360); await h.advance(420); await h.advance(420); await h.advance(420);
  const activity = h.get<HTMLDetailsElement>('details[aria-label="Message activity"]');
  assert.equal(activity.open, false);
  const summary = activity.querySelector("summary")?.textContent ?? "";
  assert.match(summary, /failed/i);
  assert.match(summary, /truncated/i);
  assert.doesNotMatch(summary, /success|complete/i);
  await h.click('details[aria-label="Message activity"] > summary');
  await h.click('details[aria-label="Tool details"] > summary');
  assert.match(h.get('[aria-label="Tool output"]').textContent ?? "", /<script>inert output<\/script>/);
  assert.equal(h.root.querySelectorAll("script").length, 0);
  assert.match(h.get('details[aria-label="Tool details"]').textContent ?? "", /only the bounded projection/i);
  assert.match(h.root.textContent ?? "", /not a complete result/);
});

test("candidate keeps interrupted activity and its expanded details when a newer draft starts another reply", async t => {
  const h = await candidateHarness(t);
  await h.input("First task"); await h.click(send); await h.advance(360);
  await h.click('details[aria-label="Message activity"] > summary');
  await h.click('details[aria-label="Thinking details"] > summary');
  const earlier = h.get<HTMLDetailsElement>('details[aria-label="Message activity"]');
  await h.input("Newer draft"); await h.click(stop); await h.advance(420);
  assert.match(earlier.querySelector("summary")?.textContent ?? "", /interrupted/);
  assert.doesNotMatch(earlier.querySelector("summary")?.textContent ?? "", /Working/);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Newer draft");
  await h.click(send);
  assert.equal(h.root.querySelectorAll('details[aria-label="Message activity"]').length, 2);
  assert.equal(earlier.isConnected, true);
  assert.equal(earlier.open, true);
  assert.equal(earlier.querySelector<HTMLDetailsElement>('details[aria-label="Thinking details"]')?.open, true);
  await h.reset(); await h.advance(10000);
  assert.equal(h.root.querySelectorAll('details[aria-label="Message activity"]').length, 0);
  assert.match(h.root.textContent ?? "", /What should we work on/);
});

test("candidate keeps repeated activity-first replies inside the bounded transcript without orphaned old activity", async t => {
  const h = await candidateHarness(t, "activity");
  for (let turn = 0; turn < 16; turn++) {
    await h.advance(360); await h.advance(420); await h.advance(420); await h.advance(420);
    await h.input(`Follow-up ${turn}`);
    assert.equal(h.get<HTMLButtonElement>(send).disabled, false, "bounded projections remain valid and usable");
    if (turn < 15) await h.click(send);
  }
  assert.ok(h.root.querySelectorAll("article").length <= 32, "evicted message activities cannot recreate old rows");
  assert.doesNotMatch(h.root.textContent ?? "", /Earlier preview reply 1/);
});

test("candidate keeps the keyboard-focused code reading surface through incomplete and completed fences", async t => {
  const h = await candidateHarness(t, "formatted");
  await h.advance(360);
  const code = h.get<HTMLPreElement>("pre:has(code)");
  await act(async () => code.focus());
  assert.equal(h.dom.window.document.activeElement === code, true);
  await h.advance(420); await h.advance(420);
  assert.equal(h.dom.window.document.activeElement === code, true);
  assert.equal(code.textContent, 'const greeting = "<hello>&";\n  console.log(greeting);');
});

test("candidate retains a stopped activity-only reply and expanded details when the next task starts", async t => {
  const h = await candidateHarness(t, "activity");
  assert.equal(h.root.querySelectorAll("h1").length, 0, "no body delta has arrived");
  await h.click('details[aria-label="Message activity"] > summary');
  await h.click('details[aria-label="Thinking details"] > summary');
  const earlier = h.get<HTMLDetailsElement>('details[aria-label="Message activity"]');
  await h.input("Continue after an early Stop"); await h.click(stop); await h.advance(420);
  assert.match(earlier.querySelector("summary")?.textContent ?? "", /interrupted/);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Continue after an early Stop");
  await h.click(send);
  assert.equal(earlier.isConnected, true, "the interrupted activity-only message must remain visible");
  assert.doesNotMatch(earlier.closest("article")?.textContent ?? "", /Thinking…/, "an interrupted reply must not look active during the next task");
  assert.equal(earlier.open, true);
  assert.equal(earlier.querySelector<HTMLDetailsElement>('details[aria-label="Thinking details"]')?.open, true);
  assert.equal(h.root.querySelectorAll('details[aria-label="Message activity"]').length, 2);
  await h.advance(360);
  assert.equal(earlier.isConnected, true);
  assert.match(earlier.querySelector("summary")?.textContent ?? "", /interrupted/);
});


test("candidate browses saved conversations without switching or losing the current draft", async t => {
  const h = await candidateHarness(t, "sessions");
  await h.input("Keep this draft while browsing");
  const messages = h.root.querySelectorAll(".candidate__message").length;
  await h.click('button[aria-label="Browse saved conversations"]');
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Keep this draft while browsing");
  assert.match(h.get('[aria-label="Conversation history"]').textContent ?? "", /Loading saved conversations/);
  await h.advance(1000);
  assert.match(h.get('[aria-label="Conversation history"]').textContent ?? "", /Synthetic saved session 33/);
  assert.equal(h.root.querySelector("dialog[open]"), null);
  await h.click('button[aria-label="Back to conversation"]');
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Keep this draft while browsing");
  assert.equal(h.root.querySelectorAll(".candidate__message").length, messages);
});


test("candidate paginates the current project's saved conversations with usable page boundaries", async t => {
  const h = await candidateHarness(t, "sessions");
  await h.click('button[aria-label="Browse saved conversations"]'); await h.advance(1000);
  const previous = 'button[aria-label="Previous conversations"]';
  const next = 'button[aria-label="Next conversations"]';
  assert.equal(h.get<HTMLButtonElement>(previous).disabled, true);
  assert.match(h.get('[aria-label="Conversation history"]').textContent ?? "", /Page 1 of 3/);
  await h.click(next);
  assert.equal(h.get<HTMLButtonElement>(next).disabled, true);
  await h.advance(1000);
  assert.match(h.get('[aria-label="Conversation history"]').textContent ?? "", /Synthetic saved session 17/);
  assert.doesNotMatch(h.get('[aria-label="Conversation history"]').textContent ?? "", /Synthetic saved session 33/);
  await h.click(next); await h.advance(1000);
  assert.match(h.get('[aria-label="Conversation history"]').textContent ?? "", /Page 3 of 3/);
  assert.match(h.get('[aria-label="Conversation history"]').textContent ?? "", /Synthetic saved session 01/);
  assert.equal(h.get<HTMLButtonElement>(next).disabled, true);
  await h.click(previous); await h.advance(1000);
  assert.match(h.get('[aria-label="Conversation history"]').textContent ?? "", /Page 2 of 3/);
});


test("candidate empty page keeps history collapsed until explicitly requested", async t => {
  const h = await candidateHarness(t); await h.input("Keep this empty-page draft"); await h.advance(1000);
  assert.equal(h.root.querySelector('[aria-label="Recent conversations"]') !== null, false);
  assert.equal(h.get('[aria-label="Conversation history"]').hidden, true);
  await h.click('button[aria-label="Browse saved conversations"]');
  assert.match(h.get('[aria-label="Conversation history"]').textContent ?? "", /Loading saved conversations/);
  await h.advance(80);
  assert.match(h.get('[aria-label="Conversation history"]').textContent ?? "", /Synthetic saved session 33/);
  await h.click('button[aria-label="Next conversations"]'); await h.advance(80);
  await h.click('button[aria-label="Back to conversation"]'); await h.advance(1000);
  assert.equal(h.get('[aria-label="Conversation history"]').hidden, true);
  assert.equal(h.root.querySelector('[aria-label="Recent conversations"]') !== null, false);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Keep this empty-page draft");
});

test("candidate shows an empty project catalogue without a false restore or next page", async t => {
  const h = await candidateHarness(t, "sessions-empty");
  await h.click('button[aria-label="Browse saved conversations"]'); await h.advance(1000);
  assert.match(h.get('[aria-label="Conversation history"]').textContent ?? "", /No saved conversations in this project/);
  assert.equal(h.get<HTMLButtonElement>('button[aria-label="Next conversations"]').disabled, true);
  assert.doesNotMatch(h.get('[aria-label="Conversation history"]').textContent ?? "", /Synthetic saved session/);
});


test("candidate catalogue failure is visible and refresh recovers without clearing the draft", async t => {
  const h = await candidateHarness(t, "sessions-error");
  await h.input("Keep after list failure");
  await h.click('button[aria-label="Browse saved conversations"]'); await h.advance(1000);
  assert.match(h.get('[aria-label="Conversation history"] [role="alert"]').textContent ?? "", /unavailable/i);
  assert.doesNotMatch(h.get('[aria-label="Conversation history"]').textContent ?? "", /Loading saved/);
  await h.click('button[aria-label="Refresh saved conversations"]'); await h.advance(1000);
  assert.match(h.get('[aria-label="Conversation history"]').textContent ?? "", /Synthetic saved session 33/);
  assert.equal(h.root.querySelector('[aria-label="Conversation history"] [role="alert"]'), null);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Keep after list failure");
});


test("candidate returns keyboard focus and the transcript reading position after streaming behind history", async t => {
  const h = await candidateHarness(t, "activity");
  const transcript = h.get(".candidate__messages");
  Object.defineProperties(transcript, { scrollHeight: { value: 1000 }, clientHeight: { value: 300 } });
  transcript.scrollTop = 120;
  transcript.dispatchEvent(new h.dom.window.Event("scroll", { bubbles: true }));
  const activity = h.get<HTMLDetailsElement>('details[aria-label="Message activity"]');
  activity.open = true;
  const browse = 'button[aria-label="Browse saved conversations"]';
  h.get(browse).focus(); await h.click(browse);
  assert.equal(h.dom.window.document.activeElement?.getAttribute("aria-label"), "Back to conversation");
  // Hidden panes can report a reset scroll offset; restoration must use the captured reading position.
  transcript.scrollTop = 0;
  await h.click(browse); // The icon closes, then reopens without overwriting the restored position.
  assert.equal(transcript.scrollTop, 120);
  await h.click(browse);
  assert.equal(h.get('[aria-label="Conversation history"]').hidden, false);
  transcript.scrollTop = 0;
  await h.advance(360); await h.advance(420);
  await h.click('button[aria-label="Back to conversation"]');
  assert.equal(transcript.scrollTop, 120);
  assert.equal(activity.open, true);
  assert.equal(h.dom.window.document.activeElement?.getAttribute("aria-label"), "Browse saved conversations");
  assert.match(transcript.textContent ?? "", /Activity-first reply/);
});


test("candidate Stop during catalogue loading preserves navigation and the newer draft", async t => {
  const h = await candidateHarness(t, "streaming");
  await h.input("Newer draft during history");
  await h.click('button[aria-label="Browse saved conversations"]');
  await h.click(stop);
  assert.equal(h.get<HTMLButtonElement>(stop).disabled, true);
  await h.advance(420);
  assert.equal(h.root.querySelector(stop), null);
  assert.match(h.root.textContent ?? "", /Task stopped/);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Newer draft during history");
  assert.doesNotMatch(h.get('[aria-label="Conversation history"]').textContent ?? "", /Loading saved conversations/);
  assert.match(h.get('[aria-label="Conversation history"]').textContent ?? "", /Synthetic saved session 33/);
  await h.click('button[aria-label="Next conversations"]'); await h.advance(1000);
  assert.match(h.get('[aria-label="Conversation history"]').textContent ?? "", /Page 2 of 3/);
});


test("candidate cancels a simulated handoff without stopping the live task or losing the draft", async t => {
  const h = await candidateHarness(t, "streaming");
  await h.input("Keep this draft on cancellation");
  await h.click('button[aria-label="New conversation"]');
  assert.match(h.get('dialog[aria-label="Simulated session handoff"]').textContent ?? "", /not an ownership lock/);
  await h.click('dialog button[aria-label="Cancel simulated handoff"]');
  assert.equal(h.root.querySelector("dialog[open]"), null);
  await h.advance(360);
  assert.ok(h.root.querySelector(stop));
  assert.match(h.root.textContent ?? "", /I checked the workspace context/);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Keep this draft on cancellation");
  assert.equal(h.dom.window.document.activeElement?.getAttribute("aria-label"), "New conversation");
});


test("candidate failed restoration preserves the current conversation and permits a deliberate retry", async t => {
  const h = await candidateHarness(t, "sessions");
  await h.input("Keep this draft after failed restoration");
  await h.click('button[aria-label="Browse saved conversations"]'); await h.advance(1000);
  await h.click('button[aria-label="Restore Synthetic saved session 33"]');
  assert.match(h.get("dialog").textContent ?? "", /leaving the original entry point/);
  await h.click('button[aria-label="Simulate restore failure"]');
  assert.match(h.get('[aria-label="Conversation history"] [role="alert"]').textContent ?? "", /restore-failed/);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Keep this draft after failed restoration");
  assert.match(h.get(".candidate__messages").textContent ?? "", /The workspace is ready/);
  await h.click('button[aria-label="Restore Synthetic saved session 33"]');
  await h.click('button[aria-label="Cancel simulated handoff"]');
  assert.equal(h.root.querySelector("dialog[open]"), null);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Keep this draft after failed restoration");
});


test("candidate confirmed New waits for Stop settlement before clearing work and never replays the old task", async t => {
  const h = await candidateHarness(t, "streaming");
  await h.input("Discard only after committed handoff");
  await h.click('button[aria-label="New conversation"]');
  await h.click('button[aria-label="Confirm simulated handoff"]');
  assert.match(h.root.textContent ?? "", /Stopping/);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Discard only after committed handoff");
  await h.advance(419);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Discard only after committed handoff");
  await h.advance(1);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "");
  assert.equal(h.root.querySelector(stop), null);
  assert.match(h.root.textContent ?? "", /What should we work on/);
  assert.equal(h.dom.window.document.activeElement?.getAttribute("aria-label"), "Message");
  await h.advance(5000);
  assert.equal(h.root.querySelectorAll(".candidate__message").length, 0);
  await h.input("Only this new task"); await h.click(send); await h.advance(360);
  assert.equal(h.root.querySelectorAll(".candidate__message--user").length, 1);
  assert.match(h.root.textContent ?? "", /Only this new task/);
});


test("candidate restores from explicitly opened history into bounded literal history without replay", async t => {
  const h = await candidateHarness(t);
  await h.input("Clear on successful restore only");
  await h.click('button[aria-label="Browse saved conversations"]'); await h.advance(80);
  await h.click('[aria-label="Conversation history"] button[aria-label="Restore Synthetic saved session 33"]');
  await h.click('button[aria-label="Confirm simulated handoff"]'); await h.advance(120);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "");
  assert.match(h.get('[aria-label="Current conversation"]').textContent ?? "", /Synthetic saved session 33/);
  assert.match(h.get("#saved-history-page-status").textContent ?? "", /Entries 34–65 of 65/);
  assert.equal(h.root.querySelectorAll(".candidate__message").length, 0);
  await h.click('[data-saved-history-preview="synthetic-history-65"]'); await h.advance(80);
  assert.match(h.get("#saved-history-preview-text").textContent ?? "", /<article data-fixture="synthetic-session">/);
  assert.equal(h.root.querySelector('[data-fixture="synthetic-session"]'), null);
  assert.equal(h.get<HTMLButtonElement>("#saved-history-preview-next").disabled, false);
  await h.click("#saved-history-preview-next"); await h.advance(80);
  assert.match(h.get("#saved-history-preview").textContent ?? "", /Characters 8193/);
  await h.click("#saved-history-preview-close");
  await h.click("#saved-history-earlier"); await h.advance(80);
  assert.match(h.get("#saved-history-page-status").textContent ?? "", /Entries 2–33 of 65/);
  assert.doesNotMatch(h.get("#saved-history-entries").textContent ?? "", /message 65/);
  await h.click("#saved-history-earlier"); await h.advance(80);
  assert.match(h.get("#saved-history-page-status").textContent ?? "", /Entries 1–1 of 65/);
  assert.equal(h.get<HTMLButtonElement>("#saved-history-earlier").disabled, true);
  await h.advance(5000);
  assert.equal(h.root.querySelectorAll(".candidate__message").length, 0);
});


test("candidate failed Stop during handoff stays in the current task with a visible recoverable error", async t => {
  const h = await candidateHarness(t, "streaming"); await h.input("Keep when Stop fails");
  await h.click('button[aria-label="New conversation"]');
  await h.click('button[aria-label="Simulate Stop failure"]');
  assert.match(h.get('.candidate__footer [role="alert"]').textContent ?? "", /stop-failed/);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Keep when Stop fails");
  await h.advance(360);
  assert.ok(h.root.querySelector(stop));
  assert.match(h.root.textContent ?? "", /I checked the workspace context/);
  await h.click(stop); await h.advance(420);
  await h.click('button[aria-label="New conversation"]');
  await h.click('button[aria-label="Confirm simulated handoff"]'); await h.advance(120);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "");
  assert.equal(h.root.querySelector('.candidate__footer [role="alert"]')?.textContent ?? "", "");
});


test("candidate catalogue navigation cannot strand an in-flight restored-history page", async t => {
  const h = await candidateHarness(t, "sessions");
  await h.click('button[aria-label="Browse saved conversations"]'); await h.advance(80);
  await h.click('button[aria-label="Restore Synthetic saved session 33"]');
  await h.click('button[aria-label="Confirm simulated handoff"]'); await h.advance(120);
  await h.click("#saved-history-earlier");
  await h.click('button[aria-label="Browse saved conversations"]');
  await h.click('button[aria-label="Next conversations"]'); await h.advance(80);
  await h.click('button[aria-label="Back to conversation"]');
  assert.match(h.get("#saved-history-page-status").textContent ?? "", /Entries 2–33 of 65/);
  assert.equal(h.get<HTMLButtonElement>("#saved-history-earlier").disabled, false);
  assert.doesNotMatch(h.get("#saved-history").textContent ?? "", /Loading retained history/);
});


test("candidate restored-history limits and unavailable original text stay explicit and inert", async t => {
  const h = await candidateHarness(t);
  await h.click('button[aria-label="Browse saved conversations"]'); await h.advance(80);
  await h.click('[aria-label="Conversation history"] button[aria-label="Restore Synthetic saved session 33"]');
  await h.click('button[aria-label="Confirm simulated handoff"]'); await h.advance(120);
  const history = h.get("#saved-history");
  assert.match(history.textContent ?? "", /Truncated for display/);
  assert.match(history.textContent ?? "", /Unsupported historical content/);
  assert.match(history.textContent ?? "", /Retained text preview unavailable for this notice/);
  assert.match(history.textContent ?? "", /Model context is owned by pi/);
  assert.equal(history.querySelectorAll("img,script,iframe").length, 0);
});


test("candidate history navigation keeps existing approval decisions reachable outside the replaced transcript", async t => {
  const h = await candidateHarness(t, "approval");
  await h.click('button[aria-label="Browse saved conversations"]'); await h.advance(80);
  const approvals = h.get('[aria-label="Tool approvals"]');
  assert.equal(approvals.closest("[hidden]"), null);
  assert.ok(approvals.textContent?.includes("src/preview/example.ts"));
  const allow = [...approvals.querySelectorAll("button")].find(button => button.textContent === "Allow once");
  assert.ok(allow); await act(async () => allow.click());
  assert.doesNotMatch(h.get(".candidate__footer").textContent ?? "", /Approval required/);
  assert.ok(h.root.querySelector(stop));
  assert.match(h.get('[aria-label="Conversation history"]').textContent ?? "", /Synthetic saved session 33/);
});


test("candidate does not expose a project catalogue before workspace eligibility and consent", async t => {
  const h = await candidateHarness(t, "no-folder");
  assert.equal(h.get<HTMLButtonElement>('button[aria-label="Browse saved conversations"]').disabled, true);
  assert.equal(h.get<HTMLButtonElement>('button[aria-label="New conversation"]').disabled, true);
  await h.recover(); await h.advance(80);
  assert.equal(h.get<HTMLButtonElement>('button[aria-label="Browse saved conversations"]').disabled, false);
  await h.click('button[aria-label="Browse saved conversations"]'); await h.advance(80);
  assert.match(h.get('[aria-label="Conversation history"]').textContent ?? "", /Synthetic saved session 33/);
});


test("candidate empty welcome does not auto-follow to the bottom when workspace readiness changes", async t => {
  const h = await candidateHarness(t, "loading");
  const transcript = h.get(".candidate__messages");
  Object.defineProperties(transcript, { scrollHeight: { value: 900 }, clientHeight: { value: 250 } });
  await h.advance(900); await h.advance(80);
  assert.equal(transcript.scrollTop, 0);
  assert.match(transcript.textContent ?? "", /What should we work on/);
  assert.equal(h.get('[aria-label="Conversation history"]').hidden, true);
});


test("candidate invalidates a handoff confirmation when a newer draft arrives during Stop", async t => {
  const h = await candidateHarness(t, "streaming"); await h.input("Draft covered by confirmation");
  await h.click("#model-effort-trigger"); await h.click("#model-current");
  const model = [...h.get("#model-list").querySelectorAll("button")].find(button => button.textContent?.includes("GPT-5"));
  assert.ok(model); await act(async () => model.click());
  await h.click('button[aria-label="New conversation"]'); await h.click('button[aria-label="Confirm simulated handoff"]');
  await h.advance(200); await h.input("Newer work is not covered by the old confirmation");
  await h.advance(220);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Newer work is not covered by the old confirmation");
  assert.match(h.get('.candidate__footer [role="alert"]').textContent ?? "", /cancelled/);
  assert.ok(h.root.querySelectorAll(".candidate__message").length > 0);
  await h.advance(520);
  assert.match(h.get("#model-effort-trigger").textContent ?? "", /GPT-5/);
  assert.equal(h.get<HTMLButtonElement>('button[aria-label="New conversation"]').disabled, false);
  await h.click('button[aria-label="New conversation"]'); await h.click('button[aria-label="Confirm simulated handoff"]'); await h.advance(120);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "");
  assert.equal(h.root.querySelectorAll(".candidate__message").length, 0);
});


test("candidate confirmed handoff joins an already-running Stop instead of stranding switching", async t => {
  const h = await candidateHarness(t, "streaming"); await h.input("Clear after the existing Stop settles");
  await h.click(stop); await h.advance(100);
  await h.click('button[aria-label="New conversation"]'); await h.click('button[aria-label="Confirm simulated handoff"]');
  await h.advance(319);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Clear after the existing Stop settles");
  await h.advance(1);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "");
  await h.advance(80);
  assert.equal(h.get<HTMLButtonElement>('button[aria-label="New conversation"]').disabled, false);
  assert.equal(h.root.querySelectorAll(".candidate__message").length, 0);
});


test("candidate keeps a failed handoff visible after collapsing history and can recover on reopening", async t => {
  const h = await candidateHarness(t); await h.input("Keep after failed restore");
  await h.click('button[aria-label="Browse saved conversations"]'); await h.advance(80);
  await h.click('button[aria-label="Next conversations"]'); await h.advance(80);
  await h.click('button[aria-label="Restore Synthetic saved session 17"]'); await h.click('button[aria-label="Simulate restore failure"]');
  await h.click('button[aria-label="Back to conversation"]');
  assert.match(h.get('.candidate__footer [role="alert"]').textContent ?? "", /restore-failed/);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Keep after failed restore");
  await h.click('button[aria-label="Browse saved conversations"]');
  const history = h.get('[aria-label="Conversation history"]');
  assert.doesNotMatch(history.textContent ?? "", /Loading saved conversations/);
  const refresh = '[aria-label="Conversation history"] button[aria-label="Refresh saved conversations"]';
  assert.equal(h.get<HTMLButtonElement>(refresh).disabled, false);
  await h.click(refresh); await h.advance(80);
  assert.match(history.textContent ?? "", /Synthetic saved session 33/);
  assert.doesNotMatch(history.textContent ?? "", /restore-failed/);
});

test("candidate explicitly opened history keeps newest-first ordering and full modification details", async t => {
  const h = await candidateHarness(t);
  await h.click('button[aria-label="Browse saved conversations"]'); await h.advance(80);
  const history = h.get('[aria-label="Conversation history"]');
  const names = [...history.querySelectorAll('button[aria-label^="Restore "]')].map(button => button.getAttribute("aria-label"));
  assert.equal(names.length, 16);
  assert.deepEqual(names.slice(0, 3), ["Restore Synthetic saved session 33", "Restore Synthetic saved session 32", "Restore Synthetic saved session 31"]);
  assert.match(h.get('button[aria-label="Restore Synthetic saved session 33"]').title, /Modified: 2026-09-30T00:00:00.000Z/);
  await h.click('button[aria-label="Next conversations"]'); await h.advance(80);
  await h.click('button[aria-label="Next conversations"]'); await h.advance(80);
  assert.match(h.get('[aria-label="Conversation history"]').textContent ?? "", /Synthetic saved session 01/);
});

test("candidate recovery invalidates an uncommitted handoff without stranding navigation or clearing work", async t => {
  const h = await candidateHarness(t, "streaming"); await h.input("Keep work across simulated recovery");
  await h.advance(360);
  const messages = [...h.root.querySelectorAll(".candidate__text")].map(line => line.textContent);
  await h.click('button[aria-label="New conversation"]'); await h.click('button[aria-label="Confirm simulated handoff"]');
  await h.advance(200); await h.recover(); await h.advance(5000);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Keep work across simulated recovery");
  assert.deepEqual([...h.root.querySelectorAll(".candidate__text")].map(line => line.textContent), messages);
  assert.equal(h.get<HTMLButtonElement>('button[aria-label="New conversation"]').disabled, false);
  assert.match(h.get('.candidate__footer [role="alert"]').textContent ?? "", /cancelled/);
  await h.click('button[aria-label="New conversation"]');
  assert.ok(h.root.querySelector('dialog[open]'));
  await h.recover(); await h.advance(5000);
  assert.equal(h.root.querySelector('dialog'), null);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Keep work across simulated recovery");
  await h.click('button[aria-label="New conversation"]'); await h.click('button[aria-label="Confirm simulated handoff"]');
  await h.recover(); await h.advance(5000);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Keep work across simulated recovery");
  assert.deepEqual([...h.root.querySelectorAll(".candidate__text")].map(line => line.textContent), messages);
  await h.click('button[aria-label="New conversation"]'); await h.click('button[aria-label="Confirm simulated handoff"]'); await h.advance(120);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "");
  assert.equal(h.root.querySelectorAll(".candidate__message").length, 0);
});

test("candidate history can be collapsed by its trigger or Escape without losing current work", async t => {
  const h = await candidateHarness(t, "streaming"); await h.input("Keep navigation-only work");
  const browse = 'button[aria-label="Browse saved conversations"]';
  await h.click(browse); await h.advance(80); await h.click(browse);
  assert.equal(h.get('[aria-label="Conversation history"]').hidden, true);
  assert.equal(h.get(browse).getAttribute("aria-expanded"), "false");
  assert.equal(h.dom.window.document.activeElement?.getAttribute("aria-label"), "Browse saved conversations");
  await h.click(browse);
  await act(async () => h.get('button[aria-label="Back to conversation"]').dispatchEvent(new h.dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  assert.equal(h.get('[aria-label="Conversation history"]').hidden, true);
  assert.equal(h.dom.window.document.activeElement?.getAttribute("aria-label"), "Browse saved conversations");
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Keep navigation-only work");
  assert.equal(h.get<HTMLButtonElement>(stop).disabled, false);
  assert.equal(h.root.querySelector("dialog") !== null, false);
});

test("candidate Escape from retained controls closes history but gives the model dialog priority", async t => {
  const h = await candidateHarness(t, "streaming"); await h.input("Keep this composer draft");
  const browse = 'button[aria-label="Browse saved conversations"]';
  const escape = (selector: string) => act(async () => {
    const target = h.get(selector); target.focus();
    target.dispatchEvent(new h.dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  });
  await h.click(browse); await h.advance(80); await escape('textarea[aria-label="Message"]');
  assert.equal(h.get('[aria-label="Conversation history"]').hidden, true);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Keep this composer draft");
  assert.equal(h.get<HTMLButtonElement>(stop).disabled, false);
  assert.equal(h.dom.window.document.activeElement?.getAttribute("aria-label"), "Browse saved conversations");
  await h.click(browse); await h.click("#model-effort-trigger"); await escape("#model-effort-trigger");
  assert.equal(h.get('[aria-label="Model and thinking level"]').hidden, true);
  assert.equal(h.get('[aria-label="Conversation history"]').hidden, false);
  await escape("#model-effort-trigger");
  assert.equal(h.get('[aria-label="Conversation history"]').hidden, true);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Keep this composer draft");
});

test("candidate language settings switch UI immediately without replacing a draft or conversation", async t => {
  const h = await candidateHarness(t);
  await h.input("Keep 原文 exactly");
  const composer = h.get<HTMLTextAreaElement>("textarea");
  await h.click('button[aria-label="Interface settings"]');
  const select = h.get<HTMLSelectElement>('select[aria-label="Language"]');
  await act(async () => { select.value = "zh-CN"; select.dispatchEvent(new h.dom.window.Event("change", { bubbles: true })); });
  assert.match(h.root.textContent ?? "", /今天想做些什么/);
  assert.equal(h.get<HTMLTextAreaElement>('textarea[aria-label="消息"]').value, "Keep 原文 exactly");
  assert.equal(h.get("textarea"), composer);
  assert.ok(h.root.querySelector('button[aria-label="发送消息"]'));
  assert.equal(h.get<HTMLSelectElement>('select[aria-label="语言"]').value, "zh-CN");
  await act(async () => { select.value = "en"; select.dispatchEvent(new h.dom.window.Event("change", { bubbles: true })); });
  assert.match(h.root.textContent ?? "", /What should we work on/);
  assert.equal(h.get("textarea"), composer);
  assert.equal(composer.value, "Keep 原文 exactly");
});

test("candidate language switch preserves a live reply and model settings while translating copy feedback", async t => {
  const h = await candidateHarness(t, "formatted");
  await h.advance(360);
  const code = h.get("pre code").textContent;
  const reply = h.get("pre code").closest(".candidate__message--assistant"); assert.ok(reply);
  await h.input("newer draft");
  await h.click('button[aria-label="Interface settings"]');
  const language = h.get<HTMLSelectElement>('select[aria-label="Language"]');
  await act(async () => { language.value = "zh-CN"; language.dispatchEvent(new h.dom.window.Event("change", { bubbles: true })); });
  await h.click('button[aria-label="关闭设置"]');
  assert.ok(h.root.querySelector('button[aria-label="停止当前任务"]'));
  assert.equal(h.get("pre code").closest(".candidate__message--assistant"), reply);
  assert.equal(h.get("pre code").textContent, code);
  await h.click('button[aria-label="复制代码"]');
  assert.match(h.root.textContent ?? "", /剪贴板不可用/);
  await h.click("#model-effort-trigger");
  assert.equal(h.get("#model-popover").getAttribute("aria-label"), "模型与思考强度");
  assert.match(h.get("#model-popover").textContent ?? "", /思考强度/);
  await h.advance(4000);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "newer draft");
  assert.match(reply.textContent ?? "", /Formatted reply/);
});

test("candidate language switch preserves expanded activity and literal tool input", async t => {
  const h = await candidateHarness(t, "activity");
  await h.advance(360); await h.advance(420); await h.advance(420); await h.advance(420);
  const activity = h.get<HTMLDetailsElement>('details[aria-label="Message activity"]');
  const tool = h.get<HTMLDetailsElement>('details[aria-label="Tool details"]');
  await act(async () => { activity.open = true; tool.open = true; });
  const raw = h.get('pre[aria-label="Tool input"]').textContent;
  await h.click('button[aria-label="Interface settings"]');
  const select = h.get<HTMLSelectElement>('select[aria-label="Language"]');
  await act(async () => { select.value = "zh-CN"; select.dispatchEvent(new h.dom.window.Event("change", { bubbles: true })); });
  assert.equal(h.get('details[aria-label="消息活动"]'), activity);
  assert.equal(activity.open, true); assert.equal(tool.open, true);
  assert.equal(h.get('pre[aria-label="工具输入"]').textContent, raw);
  assert.match(h.root.textContent ?? "", /已截断/);
  assert.match(h.root.textContent ?? "", /失败/);
});

test("candidate language selection covers history, confirmation and retained content without switching on selection", async t => {
  const h = await candidateHarness(t, "sessions");
  await h.input("preserve until confirmation");
  await h.click('button[aria-label="Browse saved conversations"]');
  await h.advance(220);
  const title = h.get(".candidate__session-title").textContent;
  await h.click('button[aria-label="Interface settings"]');
  const select = h.get<HTMLSelectElement>('select[aria-label="Language"]');
  await act(async () => { select.value = "zh-CN"; select.dispatchEvent(new h.dom.window.Event("change", { bubbles: true })); });
  await h.click('button[aria-label="关闭设置"]');
  assert.equal(h.get(".candidate__session-title").textContent, title);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "preserve until confirmation");
  assert.ok(h.root.querySelector('button[aria-label="下一页对话"]'));
  await h.click(".candidate__session");
  assert.ok(h.root.querySelector('dialog[aria-label="模拟对话交接"]'));
  await h.click('button[aria-label="取消模拟交接"]');
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "preserve until confirmation");
  await h.click(".candidate__session");
  await h.click('button[aria-label="确认模拟交接"]');
  await h.advance(220); await h.advance(220);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "");
  assert.equal(h.get("#saved-history-heading").textContent, "已恢复的历史");
  assert.match(h.get("#saved-history-disclosure").textContent ?? "", /模型上下文由 pi 管理/);
  assert.match(h.get("#saved-history-entries").textContent ?? "", /Synthetic/);
});

test("candidate language settings translate the deferred folder prompt and recovery actions", async t => {
  const h = await candidateHarness(t, "no-folder");
  await h.input("保留草稿");
  await h.click('button[aria-label="Interface settings"]');
  const select = h.get<HTMLSelectElement>('select[aria-label="Language"]');
  await act(async () => { select.value = "zh-CN"; select.dispatchEvent(new h.dom.window.Event("change", { bubbles: true })); });
  await h.click('button[aria-label="关闭设置"]');
  assert.equal(h.root.textContent?.includes("没有工作区文件夹"), false);
  assert.match(h.root.textContent ?? "", /今天想做些什么/);
  await h.click('button[aria-label="发送消息"]');
  assert.equal(h.get("#open-folder").textContent?.trim(), "打开文件夹");
  assert.match(h.get("dialog").textContent ?? "", /无法发送消息/);
  await h.click("#open-folder");
  assert.equal(h.root.querySelector("#setup-resources"), null);
  await h.click('button[aria-label="发送消息"]');
  assert.equal(h.get("#allow").textContent?.trim(), "允许项目资源");
  assert.match(h.root.textContent ?? "", /不是沙箱或工具授权/);
});

test("candidate language switch translates approval actions but never approval input or scope", async t => {
  const h = await candidateHarness(t, "approval");
  const rawInput = h.get(".approval-input").textContent;
  const scope = h.get(".grant-scope").textContent;
  await h.click('button[aria-label="Interface settings"]');
  const select = h.get<HTMLSelectElement>('select[aria-label="Language"]');
  await act(async () => { select.value = "zh-CN"; select.dispatchEvent(new h.dom.window.Event("change", { bubbles: true })); });
  await h.click('button[aria-label="关闭设置"]');
  assert.equal(h.get('[data-decision="once"]').textContent?.trim(), "仅允许一次");
  assert.equal(h.get(".approval-input").textContent, rawInput);
  assert.ok(scope?.includes("src/preview"));
  assert.match(h.get(".grant-scope").textContent ?? "", /src\/preview/);
  await h.click('[data-decision="deny"]');
  assert.equal(h.root.querySelectorAll(".approval-input").length, 0);
});

test("candidate page language survives Reset and a fresh preview is isolated after unmount", async t => {
  const h = await candidateHarness(t);
  await h.click('button[aria-label="Interface settings"]');
  const select = h.get<HTMLSelectElement>('select[aria-label="Language"]');
  await act(async () => { select.value = "zh-CN"; select.dispatchEvent(new h.dom.window.Event("change", { bubbles: true })); });
  await h.reset(); await h.advance(10000);
  assert.match(h.root.textContent ?? "", /今天想做些什么/);
  assert.equal(h.root.querySelectorAll("dialog").length, 0);
  await h.click('button[aria-label="界面设置"]');
  assert.equal(h.get<HTMLSelectElement>('select[aria-label="语言"]').value, "zh-CN");
  await h.dispose(); await h.advance(10000);
  assert.equal(h.root.childElementCount, 0);
  const { mountCandidatePreview } = await import("../preview/candidate-preview.js");
  let fresh: ReturnType<typeof mountCandidatePreview> | undefined;
  try {
    await act(async () => { fresh = mountCandidatePreview(h.root, "empty"); });
    assert.match(h.root.textContent ?? "", /What should we work on/);
  } finally { await act(async () => fresh?.dispose()); }
});

test("candidate settings owns Escape without dismissing an underlying model popup or history", async t => {
  const h = await candidateHarness(t);
  await h.click('button[aria-label="Browse saved conversations"]');
  await h.advance(220);
  await h.click("#model-effort-trigger");
  await h.click('button[aria-label="Interface settings"]');
  await act(async () => h.get("dialog").dispatchEvent(new h.dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })));
  assert.equal(h.get("#model-popover").hidden, false);
  assert.equal(h.get('[aria-label="Conversation history"]').hidden, false);
  // jsdom does not implement native Escape dismissal; Chrome verifies that default action.
  await h.click('button[aria-label="Close settings"]');
  assert.equal(h.root.querySelectorAll("dialog").length, 0);
  assert.equal(h.dom.window.document.activeElement?.getAttribute("aria-label"), "Interface settings");
});

test("candidate no-folder welcome accepts a draft and defers the folder explanation until Send", async t => {
  const h = await candidateHarness(t, "no-folder");
  assert.equal(h.get<HTMLTextAreaElement>("textarea").disabled, false);
  assert.ok(h.root.querySelector("#model-effort-trigger"), "model control stays visible without a workspace folder");
  assert.match(h.root.textContent ?? "", /What should we work on/);
  assert.equal(h.root.textContent?.includes("No workspace folder"), false);
  assert.equal(h.root.querySelectorAll("dialog[open]").length, 0);
  assert.equal(h.get<HTMLButtonElement>(send).disabled, true);
  await h.input("Hello without a folder 原文");
  const composer = h.get<HTMLTextAreaElement>("textarea");
  assert.equal(h.get<HTMLButtonElement>(send).disabled, false);
  await h.click(send);
  assert.ok(h.root.querySelector('dialog[aria-label="Unable to send message"]'));
  assert.match(h.get("dialog").textContent ?? "", /Please open a folder or workspace to continue/);
  await h.advance(5000);
  assert.equal(h.root.querySelectorAll(".candidate__message").length, 0);
  assert.equal(h.root.querySelectorAll(stop).length, 0);
  await h.click('button[aria-label="OK"]');
  assert.equal(h.root.querySelectorAll("dialog").length, 0);
  assert.equal(composer.value, "Hello without a folder 原文");
  assert.equal(h.dom.window.document.activeElement, composer);
});

test("candidate no-folder Enter respects whitespace, Shift and IME and never emits a task intent", async t => {
  const { PreviewBridge } = await import("../preview/preview-bridge.js");
  const postMessage = PreviewBridge.prototype.postMessage;
  const intents: string[] = [];
  t.mock.method(PreviewBridge.prototype, "postMessage", function (this: InstanceType<typeof PreviewBridge>, message: Parameters<typeof postMessage>[0]) {
    intents.push(message.type);
    postMessage.call(this, message);
  });
  const h = await candidateHarness(t, "no-folder");
  const enter = (options: KeyboardEventInit = {}) => act(async () => h.get("textarea").dispatchEvent(new h.dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true, ...options })));
  await h.input("   "); await enter();
  assert.equal(h.root.querySelectorAll("dialog").length, 0);
  await h.input("Draft \n原文"); await enter({ shiftKey: true }); await enter({ isComposing: true });
  assert.equal(h.root.querySelectorAll("dialog").length, 0);
  await enter(); await enter();
  assert.equal(h.root.querySelectorAll("dialog").length, 1);
  assert.equal(intents.includes("sendChat"), false);
  assert.equal(intents.includes("newConversation"), false);
  await h.click('button[aria-label="Close message"]');
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Draft \n原文");
  assert.equal(h.dom.window.document.activeElement?.tagName, "TEXTAREA");
});

test("candidate folder recovery transport failure stays visible in the prompt without losing the draft", async t => {
  const { PreviewBridge } = await import("../preview/preview-bridge.js");
  const postMessage = PreviewBridge.prototype.postMessage;
  t.mock.method(PreviewBridge.prototype, "postMessage", function (this: InstanceType<typeof PreviewBridge>, message: Parameters<typeof postMessage>[0]) {
    if (message.type === "openFolder") throw new Error("Synthetic transport refusal");
    postMessage.call(this, message);
  });
  const h = await candidateHarness(t, "no-folder");
  await h.input("Keep recovery failure draft"); await h.click(send); await h.click("#open-folder");
  assert.match(h.get("dialog").textContent ?? "", /Connection to the extension host was lost/);
  assert.equal(h.get<HTMLButtonElement>("#open-folder").disabled, true);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Keep recovery failure draft");
  assert.equal(h.root.querySelectorAll(".candidate__message--user").length, 0);
  await h.click('button[aria-label="OK"]');
  assert.match(h.root.textContent ?? "", /Reopen the view/);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Keep recovery failure draft");
});

test("candidate Reset and unmount dismiss the deferred folder prompt without late work or replay", async t => {
  const h = await candidateHarness(t, "no-folder");
  await h.input("Reset is deliberate"); await h.click(send);
  await h.reset(); await h.advance(10000);
  assert.equal(h.root.querySelectorAll("dialog").length, 0);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "");
  assert.equal(h.root.querySelectorAll(".candidate__message--user").length, 0);
  await h.dispose(); await h.advance(10000);
  assert.equal(h.root.childElementCount, 0);
});

test("candidate adds one file through context menu without losing the body draft", async t => {
  const h = await candidateHarness(t);
  await h.input("Keep my body draft");
  await h.click('button[aria-label="Add context"]');
  await h.click('[role="menuitem"][aria-label="Add file"]');
  await h.advance(420);
  assert.match(h.get('[aria-label="Draft context"]').textContent ?? "", /src\/preview\/example.ts.*whole file/);
  assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Keep my body draft");
  assert.equal(h.root.querySelectorAll('[role="menu"][aria-label="Add context"]').length, 0);
});


test("candidate previews exact literal context and removes only the selected item", async t => {
  const h = await candidateHarness(t);
  await h.input("Keep draft");
  for (let i = 0; i < 2; i++) {
    await h.click('button[aria-label="Add context"]'); await h.click('[role="menuitem"][aria-label="Add file"]'); await h.advance(420);
  }
  await h.click('[aria-label="Draft context"] button[aria-label="Preview complete snapshot"]'); await h.advance(80); await h.advance(80); await h.advance(80);
  const { PREVIEW_TEXT } = await import('../preview/scenarios.js');
  assert.equal(h.get('[aria-label="Literal attachment text"]').textContent, PREVIEW_TEXT);
  await h.click('button[aria-label="Close preview"]');
  await h.click('[aria-label="Draft context"] button[aria-label="Remove"]');
  assert.equal(h.root.querySelectorAll('[aria-label="Draft context"] li').length, 1);
  assert.equal(h.get<HTMLTextAreaElement>('textarea').value, "Keep draft");
});

test("candidate adds a fixed selection with original range and previews its exact text", async t => {
  const h = await candidateHarness(t);
  await h.input("selection draft");
  await h.click('button[aria-label="Add context"]'); await h.click('[role="menuitem"][aria-label="Add selection"]'); await h.advance(420);
  assert.match(h.get('[aria-label="Draft context"]').textContent ?? "", /selection.*original L3:3–L3:27.*24 bytes.*unsaved/);
  await h.click('button[aria-label="Preview complete snapshot"]'); await h.advance(80);
  assert.equal(h.get('[aria-label="Literal attachment text"]').textContent, 'return `Hello, ${name}`;');
  assert.equal(h.get<HTMLTextAreaElement>('textarea').value, "selection draft");
});


test("candidate confirms latest file and old selection individually without sending", async t => {
  const h = await candidateHarness(t, "source-changed");
  await h.input("Mixed confirmed draft");
  await h.click('button[aria-label="Add context"]'); await h.click('[role="menuitem"][aria-label="Add selection"]'); await h.advance(420);
  await h.click(send);
  assert.equal(h.get<HTMLButtonElement>(send).disabled, true);
  await h.click('button[aria-label="Use latest contents"]'); await h.advance(420);
  assert.equal(h.get<HTMLButtonElement>(send).disabled, true);
  await h.click('button[aria-label="Use old snapshot"]'); await h.advance(420);
  assert.equal(h.get<HTMLButtonElement>(send).disabled, false);
  assert.match(h.get('[aria-label="Draft context"]').textContent ?? "", /old snapshot/);
  assert.equal(h.root.querySelectorAll('.candidate__message--user').length, 1); // fixture's existing turn only
  assert.equal(h.get<HTMLTextAreaElement>('textarea').value, "Mixed confirmed draft");
});

test("candidate admits mixed snapshots once and clears only the admitted draft", async t => {
  const h = await candidateHarness(t);
  await h.input("Mixed submission");
  for (const label of ["Add file", "Add selection"]) {
    await h.click('button[aria-label="Add context"]'); await h.click(`[role="menuitem"][aria-label="${label}"]`); await h.advance(420);
  }
  await h.click(send); await h.input("Newer draft");
  assert.equal(h.root.querySelectorAll('[aria-label="Draft context"] li').length, 0);
  assert.equal(h.root.querySelectorAll('.candidate__message--user').length, 1);
  await h.click('button[aria-label="Attachment history"]');
  assert.equal(h.root.querySelectorAll('[aria-label="Retained attachment history"] li').length, 2);
  assert.match(h.get('[aria-label="Retained attachment history"]').textContent ?? "", /Accepted by runtime/);
  await h.advance(360);
  assert.equal(h.get<HTMLTextAreaElement>('textarea').value, "Newer draft");
});

test("candidate cancellation during attachment preparation is visible and keeps body draft", async t => {
  const h = await candidateHarness(t);
  await h.input("Keep cancelled draft");
  await h.click('button[aria-label="Add context"]'); await h.click('[role="menuitem"][aria-label="Add file"]');
  await h.click(stop); await h.advance(1000);
  assert.match(h.root.textContent ?? "", /Preparation cancelled. Draft retained/);
  assert.equal(h.get<HTMLTextAreaElement>('textarea').value, "Keep cancelled draft");
  assert.equal(h.root.querySelectorAll('[aria-label="Draft context"] li').length, 0);
});

test("candidate reads bounded attachment history pages and literal snapshots while streaming", async t => {
  const h = await candidateHarness(t, "long-history");
  await h.input("Start stream"); await h.click(send); await h.input("Newer draft while reading");
  await h.click('button[aria-label="Attachment history"]'); await h.click('button[aria-label="First page"]');
  assert.match(h.get('[aria-label="Retained attachment history"]').textContent ?? "", /Snapshots 1–16 of 128/);
  await h.click('[aria-label="Retained attachment history"] button[aria-label="Preview complete snapshot"]');
  await h.advance(80); await h.advance(80);
  assert.equal(h.get('[aria-label="Literal attachment text"]').textContent, '// retained history 1\n' + '中🐱'.repeat(6000) + '\n');
  await h.click('button[aria-label="Next page"]');
  assert.match(h.get('[aria-label="Retained attachment history"]').textContent ?? "", /Snapshots 17–32 of 128/);
  await h.advance(360);
  assert.equal(h.get<HTMLTextAreaElement>('textarea').value, "Newer draft while reading");
  assert.equal(h.get<HTMLButtonElement>(stop).disabled, false);
});

test("candidate context menu supports arrows, Escape, focus return and leaves draft intact", async t => {
  const h = await candidateHarness(t);
  await h.input("Keyboard draft"); await h.click('button[aria-label="Add context"]');
  assert.equal(h.dom.window.document.activeElement?.getAttribute('aria-label'), 'Add file');
  await act(async () => { h.get('[role="menu"][aria-label="Add context"]').dispatchEvent(new h.dom.window.KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true})); });
  assert.equal(h.dom.window.document.activeElement?.getAttribute('aria-label'), 'Add selection');
  await act(async () => { h.get('[role="menu"][aria-label="Add context"]').dispatchEvent(new h.dom.window.KeyboardEvent('keydown', {key: 'Escape', bubbles: true})); });
  assert.equal(h.dom.window.document.activeElement?.getAttribute('aria-label'), 'Add context');
  assert.equal(h.root.querySelectorAll('[role="menu"][aria-label="Add context"]').length, 0);
  assert.equal(h.get<HTMLTextAreaElement>('textarea').value, 'Keyboard draft');
});

test("candidate exposes preparation failure without silently losing context or body", async t => {
  const h = await candidateHarness(t, "attachment-failure");
  await h.input("Keep failed preparation");
  await h.click('button[aria-label="Add context"]'); await h.click('[role="menuitem"][aria-label="Add file"]'); await h.advance(420);
  assert.match(h.root.textContent ?? "", /Context operation: Context source unavailable/);
  assert.equal(h.get<HTMLTextAreaElement>('textarea').value, "Keep failed preparation");
  assert.equal(h.root.querySelectorAll('[aria-label="Draft context"] li').length, 0);
  assert.equal(h.root.querySelectorAll('.candidate__message--user').length, 0);
});

test("candidate exposes capacity rejection and discoverable unchanged budgets", async t => {
  const h = await candidateHarness(t, "attachment-capacity");
  await h.input("Capacity draft");
  await h.click('button[aria-label="Add context"]'); await h.click('[role="menuitem"][aria-label="Add file"]'); await h.advance(420);
  assert.match(h.root.textContent ?? "", /Total attachment text exceeds 1 MiB/);
  assert.equal(h.get<HTMLTextAreaElement>('textarea').value, "Capacity draft");

});

test("candidate makes uncertain delivery visible and never resends admitted snapshots", async t => {
  const h = await candidateHarness(t, "attachment-uncertain");
  await h.input("Uncertain submission");
  await h.click('button[aria-label="Add context"]'); await h.click('[role="menuitem"][aria-label="Add file"]'); await h.advance(420);
  await h.click(send); await h.input("Newer recovery draft");
  assert.match(h.root.textContent ?? "", /Delivery uncertain. No retry was made/);
  assert.match(h.get(".candidate-context__status").textContent ?? "", /Context delivery: Delivery uncertain; no automatic retry/);
  assert.equal(h.root.querySelectorAll('[aria-label="Draft context"] li').length, 0);
  await h.click('button[aria-label="Attachment history"]');
  assert.match(h.get('[aria-label="Retained attachment history"]').textContent ?? "", /Delivery uncertain; no automatic retry/);
  assert.equal(h.get<HTMLTextAreaElement>('textarea').value, "Newer recovery draft");
  assert.equal(h.get<HTMLButtonElement>(send).disabled, true);
});

test("candidate rechecks a confirmed file after another source edit without changing the selection snapshot", async t => {
  const h = await candidateHarness(t, "source-changed");
  await h.input("Confirm twice");
  await h.click('button[aria-label="Add context"]'); await h.click('[role="menuitem"][aria-label="Add selection"]'); await h.advance(420);
  await h.click(send); await h.click('button[aria-label="Use latest contents"]'); await h.advance(420);
  await h.click('button[aria-label="Use old snapshot"]'); await h.advance(420);
  await h.changeSources(); await h.click(send);
  assert.equal(h.get<HTMLButtonElement>(send).disabled, true);
  assert.equal(h.root.querySelectorAll('button[aria-label="Use latest contents"]').length, 1);
  assert.equal(h.root.querySelectorAll('button[aria-label="Use old snapshot"]').length, 1);
  await h.click('[aria-label="Draft context"] li:last-child button[aria-label="Preview complete snapshot"]'); await h.advance(80);
  assert.equal(h.get('[aria-label="Literal attachment text"]').textContent, 'return `Hello, ${name}`;');
  assert.equal(h.get<HTMLTextAreaElement>('textarea').value, "Confirm twice");
});

test("candidate reading surface takes focus and Escape returns to the selected context action", async t => {
  const h = await candidateHarness(t);
  await h.click('button[aria-label="Add context"]'); await h.click('[role="menuitem"][aria-label="Add file"]'); await h.advance(420);
  await h.click('button[aria-label="Preview complete snapshot"]');
  assert.equal(h.dom.window.document.activeElement?.getAttribute('aria-label'), 'Close preview');
  await act(async () => { h.get('[aria-label="Attachment preview"]').dispatchEvent(new h.dom.window.KeyboardEvent('keydown', {key:'Escape',bubbles:true})); });
  assert.equal(h.root.querySelectorAll('[aria-label="Attachment preview"]').length, 0);
  assert.equal(h.dom.window.document.activeElement?.getAttribute('aria-label'), 'Preview complete snapshot');
});

test("candidate layout fixture presents long relative paths on demand and hostile snapshot literally", async t => {
  const h = await candidateHarness(t, "attachment-layout");
  await h.click('button[aria-label="Add context"]'); await h.click('[role="menuitem"][aria-label="Add file"]'); await h.advance(420);
  assert.match(h.get('[aria-label="Draft context"] summary').textContent ?? "", /long-directory\/long-directory/);
  await h.click('button[aria-label="Preview complete snapshot"]'); await h.advance(80); await h.advance(80);
  assert.equal(h.get('[aria-label="Literal attachment text"]').textContent, '<img src="https://example.com/attachment.png" onerror="throw 1">\n<script>throw 1</script>\n![embedded](https://example.com/image.png)');
  assert.equal(h.root.querySelectorAll('.candidate-context img, .candidate-context script, .candidate-context a').length, 0);
});

test("candidate unavailable source blocks sending but lets user remove exactly that context", async t => {
  const h = await candidateHarness(t, "attachment-unavailable");
  await h.input("Unavailable source draft");
  assert.match(h.get('[aria-label="Draft context"]').textContent ?? "", /unavailable/);
  assert.equal(h.get<HTMLButtonElement>(send).disabled, true);
  await h.click('button[aria-label="Remove"]');
  assert.equal(h.get<HTMLButtonElement>(send).disabled, false);
  assert.equal(h.get<HTMLTextAreaElement>('textarea').value, "Unavailable source draft");
});

test("candidate no-folder context menu offers folder recovery", async t => {
  const h = await candidateHarness(t, "no-folder");
  await h.input("Ordinary no-folder draft");
  assert.equal(h.get<HTMLButtonElement>('button[aria-label="Add context"]').disabled, false);
  await h.click('button[aria-label="Add context"]');
  await h.click('button[aria-label="Add selection"]');
  assert.ok(h.get("#open-folder"));
  assert.equal(h.root.querySelectorAll('[aria-label="Draft context"]').length, 0);
  assert.equal(h.get<HTMLTextAreaElement>('textarea').disabled, false);
});

test("candidate Reset and unmount discard pending context preparation and preview responses", async t => {
  const h = await candidateHarness(t, "attachment");
  await h.click('button[aria-label="Preview complete snapshot"]');
  await h.reset(); await h.advance(10000);
  assert.equal(h.root.querySelectorAll('[aria-label="Attachment preview"], [aria-label="Draft context"]').length, 0);
  await h.click('button[aria-label="Add context"]'); await h.click('[role="menuitem"][aria-label="Add file"]');
  await h.dispose(); await h.advance(10000);
  assert.equal(h.root.childElementCount, 0);
});

test("candidate ignores a confirmation that finishes after another simulated source edit", async t => {
  const h = await candidateHarness(t, "source-changed");
  await h.input("Changed during confirmation"); await h.click(send);
  await h.click('button[aria-label="Use latest contents"]'); await h.changeSources(); await h.advance(420);
  assert.match(h.get('[aria-label="Draft context"]').textContent ?? "", /changed/);
  await h.click(send);
  assert.equal(h.root.querySelectorAll('button[aria-label="Use latest contents"]').length, 1);
  assert.equal(h.get<HTMLTextAreaElement>('textarea').value, "Changed during confirmation");
});

test("candidate plus menu omits privacy explanation and ends on selection", async t => {
  const h = await candidateHarness(t);
  await h.click('button[aria-label="Add context"]');
  assert.equal(h.root.querySelector('[aria-label="Context limits and privacy"]'), null);
  assert.deepEqual(Array.from(h.get('[role="menu"]').querySelectorAll('[role="menuitem"]'), n => n.getAttribute('aria-label')), ["Add file", "Add selection"]);
  await act(async () => { h.get('[role="menu"]').dispatchEvent(new h.dom.window.KeyboardEvent('keydown', {key:'End',bubbles:true})); });
  assert.equal(h.dom.window.document.activeElement?.getAttribute('aria-label'), 'Add selection');
  await act(async () => { h.get('[role="menu"]').dispatchEvent(new h.dom.window.KeyboardEvent('keydown', {key:'Escape',bubbles:true})); });
  assert.equal(h.dom.window.document.activeElement?.getAttribute('aria-label'), 'Add context');
});

test("candidate retained attachment outcomes settle after completion and interruption", async t => {
  const h = await candidateHarness(t);
  await h.input("Outcome draft"); await h.click('button[aria-label="Add context"]'); await h.click('[role="menuitem"][aria-label="Add file"]'); await h.advance(420);
  await h.click(send); await h.click('button[aria-label="Attachment history"]');
  for(let i=0;i<6;i++) await h.advance(420);
  assert.equal(h.root.querySelectorAll(stop).length, 0);
  assert.match(h.get('[aria-label="Retained attachment history"]').textContent ?? "", /Accepted by runtime \/ Task settled/);
  await h.click('button[aria-label="Close attachment history"]');
  await h.input("Interrupt this draft"); await h.click('button[aria-label="Add context"]'); await h.click('[role="menuitem"][aria-label="Add selection"]'); await h.advance(420);
  await h.click(send); await h.click(stop); await h.advance(420); await h.click('button[aria-label="Attachment history"]');
  assert.match(h.get('[aria-label="Retained attachment history"]').textContent ?? "", /Accepted by runtime \/ Task interrupted/);
});


test("candidate Chinese context feedback translates capacity state while preserving the draft", async t => {
  const h = await candidateHarness(t, "attachment-capacity");
  await h.input("中文原始草稿"); await h.click('button[aria-label="Add context"]'); await h.click('[role="menuitem"][aria-label="Add file"]'); await h.advance(420);
  await h.click('button[aria-label="Interface settings"]');
  const select = h.get<HTMLSelectElement>('select[aria-label="Language"]');
  await act(async () => { select.value='zh-CN'; select.dispatchEvent(new h.dom.window.Event('change', {bubbles:true})); });
  await h.click('button[aria-label="关闭设置"]');
  assert.match(h.get('.candidate-context__status').textContent ?? "", /附件总量超过 1 MiB/);
  assert.equal(h.get<HTMLTextAreaElement>('textarea').value, "中文原始草稿");
});

test("candidate plus menu exposes retained history during streaming without enabling attachment mutation", async t => {
  const h = await candidateHarness(t, "long-history");
  await h.input("History menu while streaming"); await h.click(send);
  assert.equal(h.get<HTMLButtonElement>('button[aria-label="Add context"]').disabled, false);
  await h.click('button[aria-label="Add context"]');
  assert.equal(h.get<HTMLButtonElement>('[role="menuitem"][aria-label="Add file"]').disabled, true);
  assert.equal(h.get<HTMLButtonElement>('[role="menuitem"][aria-label="Add selection"]').disabled, true);
  await h.click('[role="menuitem"][aria-label="Attachment history"]');
  assert.match(h.get('[aria-label="Retained attachment history"]').textContent ?? "", /Snapshots 113–128 of 128/);
  assert.equal(h.get<HTMLButtonElement>(stop).disabled, false);
});

test("candidate Chinese uncertain delivery and retained outcome labels preserve literal snapshots", async t => {
  const h = await candidateHarness(t, "attachment-uncertain");
  await h.input("投递原文"); await h.click('button[aria-label="Add context"]'); await h.click('[role="menuitem"][aria-label="Add file"]'); await h.advance(420); await h.click(send);
  await h.click('button[aria-label="Interface settings"]'); const select = h.get<HTMLSelectElement>('select[aria-label="Language"]');
  await act(async () => { select.value='zh-CN'; select.dispatchEvent(new h.dom.window.Event('change', {bubbles:true})); }); await h.click('button[aria-label="关闭设置"]');
  assert.match(h.get('.candidate-context__status').textContent ?? "", /投递不确定，未自动重试/);
  await h.click('button[aria-label="附件历史"]');
  assert.match(h.get('[aria-label="保留附件历史"]').textContent ?? "", /src\/preview\/example.ts.*投递不确定/);
  await h.click('button[aria-label="查看完整快照"]'); await h.advance(80); await h.advance(80); await h.advance(80);
  const { PREVIEW_TEXT } = await import('../preview/scenarios.js'); assert.equal(h.get('[aria-label="附件原文"]').textContent, PREVIEW_TEXT);
});

test("candidate Chinese completed attachment history reports a settled task, not protocol labels", async t => {
  const h = await candidateHarness(t); await h.input("历史原文");
  await h.click('button[aria-label="Add context"]'); await h.click('[role="menuitem"][aria-label="Add file"]'); await h.advance(420); await h.click(send);
  for(let i=0;i<6;i++) await h.advance(420);
  await h.click('button[aria-label="Interface settings"]'); const select=h.get<HTMLSelectElement>('select[aria-label="Language"]');
  await act(async () => { select.value='zh-CN'; select.dispatchEvent(new h.dom.window.Event('change', {bubbles:true})); }); await h.click('button[aria-label="关闭设置"]');
  await h.click('button[aria-label="附件历史"]');
  assert.match(h.get('[aria-label="保留附件历史"]').textContent ?? "", /运行时已接纳 \/ 任务已结束/);
  assert.equal(h.get('[aria-label="保留附件历史"]').textContent?.includes('rpc-accepted'), false);
});

test("candidate plain text submission does not add redundant empty context feedback", async t => {
  const h = await candidateHarness(t); await h.input("Plain body only"); await h.click(send);
  assert.equal(h.root.querySelectorAll('.candidate-context__status').length, 0);
  assert.equal(h.root.querySelectorAll('[aria-label="Draft context"]').length, 0);
  assert.equal(h.root.querySelectorAll('.candidate__message--user').length, 1);
});

test("candidate admits mixed context before the shared approval and preserves its interrupted history", async t => {
  const h = await candidateHarness(t, "approval"); await h.click('[data-decision="deny"]');
  await h.input("Mixed context awaiting approval");
  for(const label of ['Add file','Add selection']) { await h.click('button[aria-label="Add context"]'); await h.click(`[role="menuitem"][aria-label="${label}"]`); await h.advance(420); }
  await h.click(send);
  assert.equal(h.get<HTMLTextAreaElement>('textarea').value, '');
  assert.equal(h.root.querySelectorAll('[aria-label="Draft context"] li').length, 0);
  assert.equal(h.get<HTMLButtonElement>('[data-decision="once"]').disabled, false);
  assert.equal(h.root.textContent?.includes("The requested action was declined."), false);
  await h.click('button[aria-label="Attachment history"]');
  assert.equal(h.root.querySelectorAll('[aria-label="Retained attachment history"] li').length, 2);
  await h.input("Newer approval draft"); await h.click(stop); await h.advance(420);
  assert.equal(h.get<HTMLTextAreaElement>('textarea').value, 'Newer approval draft');
  assert.match(h.get('[aria-label="Retained attachment history"]').textContent ?? "", /Task interrupted/);
});

test("candidate synthetic Deny settles only the admitted context and later sends do not revive its pending outcome", async t => {
  const h = await candidateHarness(t, "approval"); await h.click('[data-decision="deny"]'); await h.input("Decline this mixed draft");
  for(const label of ['Add file','Add selection']) { await h.click('button[aria-label="Add context"]'); await h.click(`[role="menuitem"][aria-label="${label}"]`); await h.advance(420); }
  await h.click(send); await h.click('[data-decision="deny"]'); await h.click('button[aria-label="Attachment history"]');
  const entries = () => Array.from(h.root.querySelectorAll('[aria-label="Retained attachment history"] li'), n=>n.textContent ?? '');
  assert.equal(entries().filter(text=>text.includes('Task interrupted')).length, 2);
  assert.equal(entries().filter(text=>text.includes('Task pending')).length, 0);
  await h.input("Later admitted draft"); await h.click('button[aria-label="Add context"]'); await h.click('[role="menuitem"][aria-label="Add file"]'); await h.advance(420); await h.click(send);
  assert.equal(entries().filter(text=>text.includes('Task interrupted')).length, 2);
  assert.equal(entries().filter(text=>text.includes('Task pending')).length, 1);
});

test("candidate retained fixture metadata describes the actual stored snapshot, not the current file size", async t => {
  const h = await candidateHarness(t, "attachment"); await h.click('button[aria-label="Attachment history"]');
  const rows=Array.from(h.root.querySelectorAll('[aria-label="Retained attachment history"] li'), n=>n.textContent ?? '');
  assert.match(rows[0], /earlier.ts.*84 bytes/); assert.match(rows[1], /checked.ts.*68 bytes/);
  await h.click('[aria-label="Retained attachment history"] button[aria-label="Preview complete snapshot"]'); await h.advance(80);
  assert.equal(h.get('[aria-label="Literal attachment text"]').textContent, '// A retained attachment snapshot from an earlier turn.\nexport const stable = true;\n');
});

 test("candidate single plus offers file and selection from the composer and keeps context before body", async t => {
  const h = await candidateHarness(t);
  await h.input("Keep body under added context");
  const plus = h.get<HTMLButtonElement>('button[aria-label="Add context"]');
  assert.equal(h.root.querySelectorAll('button[aria-haspopup="menu"][aria-label="Add context"]').length, 1);
  assert.ok(plus.closest("form"));
  await h.click('button[aria-label="Add context"]');
  await h.click('button[aria-label="Add file"]');
  await h.advance(420);
  const context = h.get('[aria-label="Draft context"]');
  const body = h.get<HTMLTextAreaElement>("textarea");
  assert.ok(context.compareDocumentPosition(body) & h.dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
  assert.equal(body.value, "Keep body under added context");
  await h.click('button[aria-label="Add context"]');
  await h.click('button[aria-label="Add selection"]');
  await h.advance(420);
  assert.match(context.textContent ?? "", /whole file/);
  assert.match(context.textContent ?? "", /selection/);
  assert.equal(body.value, "Keep body under added context");
});

test("deterministic candidate normal settlement displays the reliable completed terminal", async t => {
  const h = await candidateHarness(t);
  await h.input("Complete this synthetic task"); await h.click(send);
  for (let step = 0; step < 30; step++) await h.advance(420);
  assert.match(h.root.textContent ?? "", /Task completed/);
  assert.equal(h.root.querySelector(stop), null);
});

test("deterministic candidate Stop displays stopped rather than a failed task", async t => {
  const h = await candidateHarness(t);
  await h.input("Stop this synthetic task"); await h.click(send);
  await h.click(stop); await h.advance(420);
  assert.match(h.root.textContent ?? "", /Task stopped · Side effects are not rolled back\./);
  assert.doesNotMatch(h.root.textContent ?? "", /Task failed/);
});

test("candidate runtime loss keeps dialogue and newer draft keyboard-readable without allowing sends", async () => {
  const { uiHarness } = await import("./react-harness.js");
  const h = await uiHarness(true, true);
  try {
    await h.render({ messages: [{ id: "retained", role: "assistant", text: "Retained prior reply" }] });
    await h.input("Unsent draft survives loss", "textarea");
    await h.render({ runtime: "error", execution: "failed", runtimeDetail: "Owned runtime disconnected", messages: [{ id: "retained", role: "assistant", text: "Retained prior reply" }] });
    assert.match(h.root.textContent ?? "", /Retained prior reply/);
    const input = h.get<HTMLTextAreaElement>("textarea");
    assert.equal(input.value, "Unsent draft survives loss");
    assert.equal(input.disabled, false);
    assert.equal(input.readOnly, true);
    input.focus(); input.select();
    assert.equal(h.dom.window.document.activeElement, input);
    assert.equal(input.selectionEnd, input.value.length);
    assert.equal(h.get<HTMLButtonElement>(send).disabled, true);
    const submissions = h.sent.filter(message => message.type === "sendChat").length;
    await act(async () => input.dispatchEvent(new h.dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
    assert.equal(h.sent.filter(message => message.type === "sendChat").length, submissions);
  } finally { await h.close(); }
});

test("candidate runtime loss reveals the recovery error once without overriding subsequent reading", async () => {
  const { uiHarness } = await import("./react-harness.js");
  const h = await uiHarness(true, true);
  try {
    const messages = [{ id: "retained", role: "assistant" as const, text: "Retained prior reply" }];
    await h.render({ messages });
    const main = h.get(".candidate__messages");
    Object.defineProperties(main, { scrollHeight: { configurable: true, value: 1000 }, clientHeight: { configurable: true, value: 300 } });
    main.scrollTop = 700;
    await h.render({ messages, runtime: "error", runtimeDetail: "Owned runtime disconnected", execution: "failed" });
    assert.equal(main.scrollTop, 0);
    main.scrollTop = 180;
    await act(async () => main.dispatchEvent(new h.dom.window.Event("scroll")));
    await h.render({ messages, runtime: "error", runtimeDetail: "Owned runtime disconnected", execution: "failed" });
    assert.equal(main.scrollTop, 180);
  } finally { await h.close(); }
});
