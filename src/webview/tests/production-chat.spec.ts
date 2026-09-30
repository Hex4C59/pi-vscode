import assert from "node:assert/strict";
import test from "node:test";
import { formatModelId } from "../components/model-display.js";
import { uiHarness } from "./react-harness.js";

test("production mounts the accepted chat design with host recovery and no synthetic instructions", async () => {
  const h = await uiHarness();
  try {
    assert.ok(h.root.querySelector(".candidate"));
    await h.render({ runtime: "error", runtimeDetail: "Owned runtime disconnected", execution: "failed" });
    assert.match(h.root.textContent ?? "", /Reload the VS Code window/);
    assert.doesNotMatch(h.root.textContent ?? "", /Simulate recovery|preview toolbar|Connecting to the preview/);
    assert.equal(h.get<HTMLButtonElement>('button[aria-label="Send message"]').disabled, true);
    await h.unmount();
    assert.equal(h.listeners.size, 0);
  } finally { await h.close(); }
});

test("production model selection restores focus after the host busy transition disables its trigger", async () => {
  const h = await uiHarness();
  try {
    await h.click('#model-effort-trigger');
    await h.click('#model-current');
    await h.click('#model-list button:nth-child(2)');
    assert.deepEqual(h.sent.at(-1), { version: 3, generation: 1, viewId: 'view', type: 'setChatModel', provider: 'B', modelId: 'two' });
    const trigger = h.get<HTMLButtonElement>('#model-effort-trigger');
    assert.equal(h.dom.window.document.activeElement === trigger, true);
    await h.render({ modelBusy: true });
    assert.equal(trigger.disabled, true);
    // Chromium blurs a focused native button when disabled; jsdom does not.
    h.dom.window.document.body.tabIndex = -1;
    h.dom.window.document.body.focus();
    assert.equal(h.dom.window.document.activeElement === h.dom.window.document.body, true);
    await h.render({ chatModel: 'B / two', modelBusy: false });
    assert.equal(h.dom.window.document.activeElement === trigger, true);
  } finally { await h.close(); }
});

test("model application does not steal focus from a newer draft edit", async () => {
  const h = await uiHarness();
  try {
    await h.click('#model-effort-trigger');
    await h.click('#model-current');
    await h.click('#model-list button:nth-child(2)');
    assert.deepEqual(h.sent.at(-1), { version: 3, generation: 1, viewId: 'view', type: 'setChatModel', provider: 'B', modelId: 'two' });
    await h.render({ modelBusy: true });
    const input = h.get<HTMLTextAreaElement>('.candidate__composer textarea');
    input.focus();
    await h.render({ chatModel: 'B / two', modelBusy: false });
    assert.equal(h.dom.window.document.activeElement === input, true);
  } finally { await h.close(); }
});

test("the applied model indicator is a visible checkmark rather than a literal escape", async () => {
  const { readAppStyles } = await import('./react-harness.js');
  const h = await uiHarness();
  try {
    const style = h.dom.window.document.createElement('style');
    style.textContent = readAppStyles();
    h.dom.window.document.head.append(style);
    const rule = [...style.sheet!.cssRules].find(rule => rule instanceof h.dom.window.CSSStyleRule
      && rule.selectorText.includes('.menu-item[aria-checked="true"]::after'));
    assert.ok(rule instanceof h.dom.window.CSSStyleRule);
    assert.equal(rule.style.getPropertyValue('content'), '"✓"');
  } finally { await h.close(); }
});

test("thinking keyboard focus survives its own host application so another level remains operable", async () => {
  const h = await uiHarness();
  try {
    await h.click('#model-effort-trigger');
    const slider=h.get<HTMLInputElement>('#thinking-slider');slider.focus();
    const {act}=await import('react');
    await act(async()=>slider.dispatchEvent(new h.dom.window.KeyboardEvent('keydown',{key:'End',bubbles:true})));
    assert.deepEqual(h.sent.at(-1), { version: 3, generation: 1, viewId: 'view', type: 'setThinkingLevel', level: 'high' });
    await h.render({modelBusy:true});
    h.dom.window.document.body.tabIndex=-1;h.dom.window.document.body.focus();
    await h.render({thinkingLevel:'high',modelBusy:false});
    assert.equal(h.dom.window.document.activeElement===slider,true);
  } finally {await h.close();}
});

for (const destination of ['draft','escape'] as const) test(`thinking application respects newer ${destination} focus ownership`, async () => {
  const h=await uiHarness();
  try {
    await h.click('#model-effort-trigger');const slider=h.get<HTMLInputElement>('#thinking-slider');slider.focus();
    const {act}=await import('react');
    await act(async()=>slider.dispatchEvent(new h.dom.window.KeyboardEvent('keydown',{key:'End',bubbles:true})));
    assert.deepEqual(h.sent.at(-1), { version: 3, generation: 1, viewId: 'view', type: 'setThinkingLevel', level: 'high' });
    await h.render({modelBusy:true});h.dom.window.document.body.tabIndex=-1;h.dom.window.document.body.focus();
    const target=destination==='draft'?h.get<HTMLTextAreaElement>('.candidate__composer textarea'):h.get<HTMLButtonElement>('#model-effort-trigger');
    if(destination==='draft')target.focus();
    else await act(async()=>h.dom.window.dispatchEvent(new h.dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
    await h.render({thinkingLevel:'high',modelBusy:false});
    assert.equal(h.dom.window.document.activeElement===target,true);
    if(destination==='escape')assert.equal(h.get('#model-popover').hidden,true);
  }finally{await h.close();}
});

test("model error has one visible presentation while the popover is open", async () => {
  const h = await uiHarness();
  try {
    await h.render({ modelError: "Requested thinking level is not supported by the selected model. It was not applied." });
    assert.equal(h.get('#model-status-error').hidden, false);
    await h.click('#model-effort-trigger');
    assert.equal(h.get('#model-status-error').hidden, true);
    assert.match(h.get('#model-error').textContent ?? '', /not supported/);
    await h.click('#model-effort-trigger');
    assert.equal(h.get('#model-status-error').hidden, false);
  } finally { await h.close(); }
});

test("long applied model labels retain complete accessible text and separate thinking summary", async () => {
  const h = await uiHarness();
  try {
    const label = "Long model " + "x".repeat(189);
    const formatted = formatModelId(label);
    await h.render({ chatModel: label, thinkingLevel: "medium" });
    const trigger = h.get<HTMLButtonElement>("#model-effort-trigger");
    assert.equal(trigger.textContent, formatted + " · Medium");
    assert.equal(trigger.title, "Applied: " + formatted + " · Medium");
    assert.equal(h.get(".model-effort-trigger__model").textContent, formatted);
    assert.equal(h.get(".model-effort-trigger__thinking").textContent, " · Medium");
    await h.click("#model-effort-trigger");
    assert.equal(h.get("#model-current-label").textContent, formatted + " · Medium");
  } finally { await h.close(); }
});
