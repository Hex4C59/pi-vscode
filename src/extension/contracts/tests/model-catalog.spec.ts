import assert from "node:assert/strict";
import { test } from "node:test";
import {
  findCatalogEntry,
  isValidModelRef,
  isValidThinkingLevel,
  MAX_MODEL_ID_CHARS,
  MAX_MODEL_PROVIDER_CHARS,
} from "../index.js";

test("model catalog validators accept bounded tokens", () => {
  assert.ok(isValidThinkingLevel("high"));
  assert.ok(isValidModelRef("openai", "gpt-4"));
  assert.equal(
    findCatalogEntry(
      [{ provider: "openai", modelId: "gpt-4", label: "GPT-4" }],
      "openai",
      "gpt-4",
    )?.label,
    "GPT-4",
  );
});

test("model catalog validators reject overlong or empty refs", () => {
  assert.equal(isValidThinkingLevel(""), false);
  assert.equal(isValidModelRef("openai", ""), false);
  assert.equal(isValidModelRef("x".repeat(MAX_MODEL_PROVIDER_CHARS + 1), "m"), false);
  assert.equal(isValidModelRef("openai", "m".repeat(MAX_MODEL_ID_CHARS + 1)), false);
});
