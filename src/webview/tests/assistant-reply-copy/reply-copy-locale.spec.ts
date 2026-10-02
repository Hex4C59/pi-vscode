import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react";
import { mkdir, writeFile } from "node:fs/promises";
import { uiHarness, readyState } from "../react-harness.js";

// Locale changes must not remount the current reply or erase a draft/observation.
test("locale switching retains draft focus and exact body while copy is pending", async () => {
  const h = await uiHarness();
  let finish = () => {};
  const writes: string[] = [];
  const body = "**Original Markdown**\n";
  try {
    Object.defineProperty(h.dom.window.navigator, "clipboard", { configurable: true,
      value: { writeText: (text: string) => { writes.push(text); return new Promise<void>(resolve => { finish = resolve; }); } } });
    await h.receive({ ...readyState, messages: [{ role: "assistant", id: "reply", text: body, bodyCopyEligible: true }] });
    await h.input("Draft survives locale change");
    const copy = h.get('button[aria-label="Copy reply"]'); copy.focus();
    await h.click('button[aria-label="Copy reply"]');
    await h.receive({ version: 3, type: "uiLanguageState", viewId: "view", generation: 1, locale: "zh-CN" });
    assert.equal(h.get('button[aria-label="复制回复"]'), copy);
    assert.equal(h.dom.window.document.activeElement, copy);
    assert.equal(h.get<HTMLTextAreaElement>('textarea').value, "Draft survives locale change");
    assert.match(h.get('.candidate__reply-copy [role="status"]').textContent ?? "", /正在复制回复/);
    await act(async () => { finish(); });
    assert.deepEqual(writes, [body]);
    assert.equal(h.get('.candidate__reply-copy [role="status"]').textContent, "回复已复制。");
    await mkdir("dist/wi081-copy", { recursive: true });
    await writeFile("dist/wi081-copy/locale-feedback.json", JSON.stringify({ status: "passed", draftPreserved: true, focusPreserved: true, originalMarkdown: true }, null, 2));
  } finally { await h.close(); }
});
