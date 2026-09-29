import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react";
import { candidateHarness } from "./candidate-harness.js";

/** The synthetic host drives extension requests and runtime recovery without real side effects. */
test("simulated extension request renders, settles into the queued form, then clears with feedback retained", async t => {
  const h = await candidateHarness(t, "ready");
  await h.simulateInteraction();
  const panel = h.get<HTMLDetailsElement>("details.extension-interactions");
  assert.equal(panel.open, true, "an active request opens the panel");
  assert.match(panel.textContent ?? "", /Choose how the synthetic extension should continue/);
  assert.match(panel.textContent ?? "", /1 interaction queued\./);
  const warning = h.get(".extension-interactions__feedback-entry.is-warning");
  assert.match(warning.textContent ?? "", /Warning/);
  assert.match(warning.textContent ?? "", /truncated/);

  await act(async () => {
    const select = h.get<HTMLSelectElement>(".extension-interactions__form select");
    Object.getOwnPropertyDescriptor(h.dom.window.HTMLSelectElement.prototype, "value")?.set?.call(select, "once");
    select.dispatchEvent(new h.dom.window.Event("change", { bubbles: true }));
  });
  await h.click('.extension-interactions__form [data-action="answer"]');
  assert.match(h.get(".extension-interactions__form").textContent ?? "", /Queued synthetic follow-up/, "the queued request is promoted");
  assert.equal(h.root.querySelector(".extension-interactions__queue") === null, true, "nothing remains queued");

  await act(async () => { h.get<HTMLInputElement>('.extension-interactions__form input[type="radio"][value="false"]').click(); });
  await h.click('.extension-interactions__form [data-action="answer"]');
  assert.equal(h.root.querySelector(".extension-interactions__form") === null, true, "settling the last request clears the form");
  assert.ok(h.root.querySelectorAll(".extension-interactions__feedback-entry").length >= 2, "feedback survives the settled forms");
});

test("preview recovery waits for simulated exit and a separate recovery action", async t => {
  const h = await candidateHarness(t, "ready");
  await h.simulateRecoveryRequired();
  const banner = h.get(".candidate__runtime-recovery");
  assert.equal(banner.getAttribute("role"), "alert");
  assert.equal(h.get<HTMLButtonElement>('[data-action="recover-controlled-runtime"]').disabled, true);
  assert.equal(h.get<HTMLButtonElement>('[data-action="end-owned-runtime"]').disabled, false);
  await h.click('[data-action="recover-controlled-runtime"]');
  assert.ok(h.root.querySelector(".candidate__runtime-recovery"), "recovery is unavailable before exit");

  await h.click('[data-action="end-owned-runtime"]');
  assert.ok(h.root.querySelector(".candidate__runtime-recovery"), "simulated exit alone does not recover");
  assert.equal(h.get<HTMLButtonElement>('[data-action="end-owned-runtime"]').disabled, true);
  assert.equal(h.get<HTMLButtonElement>('[data-action="recover-controlled-runtime"]').disabled, false);
  await h.click('[data-action="recover-controlled-runtime"]');
  assert.equal(h.root.querySelector(".candidate__runtime-recovery"), null);
});

test("preview recovery resets a pending extension request together with the runtime state", async t => {
  const h = await candidateHarness(t, "ready");
  await h.simulateInteraction();
  await h.simulateRecoveryRequired();
  assert.ok(h.root.querySelector(".extension-interactions__form"));
  assert.ok(h.root.querySelector(".candidate__runtime-recovery"));
  await h.click('[data-action="end-owned-runtime"]');
  assert.ok(h.root.querySelector(".extension-interactions__form"), "exit alone does not reset interactions");
  await h.click('[data-action="recover-controlled-runtime"]');
  assert.equal(h.root.querySelector(".extension-interactions") === null, true);
  assert.equal(h.root.querySelector(".candidate__runtime-recovery") === null, true);
});
