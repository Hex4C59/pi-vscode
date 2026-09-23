import assert from "node:assert/strict";
import { test } from "node:test";
import { boundUserFacingDetail, formatRuntimeError } from "../runtime-errors.js";

test("normalizes provider availability errors without exposing raw JSON", () => {
  assert.equal(formatRuntimeError('503: {"message":"Service temporarily unavailable","type":"api_error"}'),
    "Model service is temporarily unavailable. Check the provider status or switch models, then try again.");
  assert.equal(formatRuntimeError("429 rate limit exceeded"),
    "Model rate limit reached. Wait a moment or switch models, then try again.");
  assert.equal(formatRuntimeError("  generic failure  "), "generic failure");
  assert.ok(boundUserFacingDetail("x".repeat(1000)).length <= 300);
});
