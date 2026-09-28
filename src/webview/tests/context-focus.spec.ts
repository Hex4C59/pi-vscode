import assert from "node:assert/strict";
import { test } from "node:test";
import { act } from "react";
import { candidateHarness } from "./candidate-harness.js";

test("attachment preview and history restore their own callers in nested Escape order", async t => {
  const h = await candidateHarness(t, "attachment");
  const historyTrigger = h.get<HTMLButtonElement>('.candidate-context__history-trigger');
  await h.click('.candidate-context__history-trigger');
  const previewTrigger = h.get<HTMLButtonElement>('[aria-label="Retained attachment history"] button[aria-label="Preview complete snapshot"]');
  await act(async () => previewTrigger.click());
  await h.advance(80);
  const escape = () => act(async () => {
    h.dom.window.document.activeElement?.dispatchEvent(new h.dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  });
  await escape();
  assert.equal(h.root.querySelector('[aria-label="Attachment preview"]'), null);
  assert.ok(h.dom.window.document.activeElement === previewTrigger);
  await escape();
  assert.equal(h.root.querySelector('[aria-label="Retained attachment history"]'), null);
  assert.equal(h.dom.window.document.activeElement === historyTrigger, true, 'closing history returns to its original trigger, not the removed preview row');
});

test("Escape inside permissions does not also dismiss attachment preview", async t => {
  const h = await candidateHarness(t, "attachment");
  await h.click('[aria-label="Draft context"] button[aria-label="Preview complete snapshot"]');
  await h.advance(80);
  const permissions = h.get<HTMLDetailsElement>('.candidate-permissions');
  await act(async () => { permissions.open = true; permissions.querySelector('summary')?.focus(); });
  await act(async () => permissions.dispatchEvent(new h.dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })));
  assert.equal(permissions.open, false);
  assert.ok(h.root.querySelector('[aria-label="Attachment preview"]'));
  assert.ok(h.dom.window.document.activeElement === permissions.querySelector('summary'));
});
