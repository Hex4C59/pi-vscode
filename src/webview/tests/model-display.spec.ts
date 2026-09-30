import assert from "node:assert/strict";
import { test } from "node:test";
import { displayModelId, formatModelId, formatThinkingLabel } from "../components/model-display.js";

test("composer chips drop the provider and format hyphenated model ids", () => {
  assert.equal(displayModelId("hellocode / gpt-6-sol"), "GPT-6-Sol");
  assert.equal(formatModelId("gpt-6-sol"), "GPT-6-Sol");
  assert.equal(formatModelId("claude-sonnet-4"), "Claude-Sonnet-4");
  assert.equal(displayModelId(null), null);
});

test("unknown alphabetic tokens are Title Case and English thinking labels are capitalized", () => {
  assert.equal(formatModelId("id-a"), "Id-A");
  assert.equal(formatThinkingLabel("low", "low", "en"), "Low");
  assert.equal(formatThinkingLabel("xhigh", "xhigh", "en"), "Xhigh");
  assert.equal(formatThinkingLabel("low", "低", "zh-CN"), "低");
});
