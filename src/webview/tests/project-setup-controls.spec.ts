import assert from "node:assert/strict";
import test from "node:test";
import { uiHarness } from "./react-harness.js";

for (const target of ['button[aria-label="Add context"]', '#model-effort-trigger', 'textarea']) {
  test(`new folder keeps ${target} usable before resource consent`, async () => {
    const h = await uiHarness();
    try {
      await h.render({ choice: null, runtime: "not-started", chatModel: null, availableModels: [] });
      assert.equal(h.get<HTMLButtonElement>(target).disabled, false);
      assert.equal(h.root.querySelector("#setup-resources") === null, true);
      assert.ok(h.root.querySelector(".candidate__empty"));
      assert.ok(!h.sent.some(m => m.type === "chooseResources"));
    } finally { await h.close(); }
  });
}

for (const choice of ["allow", "decline"] as const) {
  test(`project setup ${choice} is explicit and never replays send or attachment`, async () => {
    const h = await uiHarness();
    try {
      await h.render({ choice: null, runtime: "not-started" });
      await h.input("Keep my draft", "textarea");
      await h.click('button[aria-label="Send message"]');
      assert.ok(h.get<HTMLDialogElement>(".candidate-folder-prompt").open);
      assert.equal(h.get<HTMLDetailsElement>(".candidate-folder-prompt details").open, false);
      await h.click(`#${choice}`);
      assert.equal(h.sent.filter(m => m.type === "chooseResources").length, 1);
      assert.ok(h.sent.some(m => m.type === "chooseResources" && m.choice === choice));
      await h.render({ choice, runtime: "starting" });
      await h.render({ choice, runtime: "ready" });
      assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Keep my draft");
      assert.ok(!h.sent.some(m => ["sendChat", "addFileAttachment", "addSelectionAttachment"].includes(m.type)));
    } finally { await h.close(); }
  });
}

test("project attachment setup cancels without consent and clears on workspace replacement", async () => {
  const h = await uiHarness();
  try {
    await h.render({ choice: null, runtime: "not-started" });
    await h.input("Keep on cancel", "textarea");
    await h.click('button[aria-label="Add context"]');
    await h.click('button[aria-label="Add selection"]');
    const buttons = [...h.root.querySelectorAll<HTMLButtonElement>("dialog button")];
    const cancel = buttons.find(b => b.getAttribute("aria-label") === "Cancel");
    assert.ok(cancel);
    await h.click('dialog button[aria-label="Cancel"]');
    assert.equal(h.root.querySelector("dialog") === null, true);
    assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Keep on cancel");
    assert.ok(!h.sent.some(m => m.type === "chooseResources"));
    await h.click('button[aria-label="Send message"]');
    await h.render({ generation: 2, choice: null, runtime: "not-started", folder: { name: "Other", path: "/other" } });
    assert.equal(h.root.querySelector("dialog") === null, true);
    assert.ok(!h.sent.some(m => m.type === "chooseResources"));
  } finally { await h.close(); }
});

test("project preparation selects a default model without granting resource consent", async () => {
  const h = await uiHarness();
  try {
    await h.render({ choice: null, runtime: "not-started" });
    await h.receive({ version: 3, type: "providerConfigState", viewId: "view", generation: 1,
      busy: false, error: null, defaultProvider: null, defaultModelId: null, defaultThinkingLevel: null, thinkingLevels: [], providers: [],
      catalog: [{ provider: "A", modelId: "one", label: "One" }] });
    await h.click("#model-effort-trigger");
    await h.click("#model-current");
    await h.click('button[role="menuitemradio"]');
    assert.ok(h.sent.some(m => m.type === "setDefaultModel" && m.modelId === "one"));
    assert.ok(!h.sent.some(m => m.type === "chooseResources" || m.type === "setChatModel"));
  } finally { await h.close(); }
});

test("project-resource cancel keeps the draft and never grants consent", async () => {
  const h = await uiHarness();
  try {
    await h.render({ choice: null, runtime: "not-started" });
    await h.input("Keep on cancel", "textarea");
    await h.click('button[aria-label="Send message"]');
    assert.match(h.get(".candidate-folder-prompt").textContent ?? "", /does not grant consent or start a runtime/);
    await h.click('.candidate-dialog__action.is-quiet');
    assert.equal(h.root.querySelector("dialog") === null, true);
    assert.equal(h.get<HTMLTextAreaElement>("textarea").value, "Keep on cancel");
    assert.ok(!h.sent.some(message => message.type === "chooseResources"));
  } finally { await h.close(); }
});
