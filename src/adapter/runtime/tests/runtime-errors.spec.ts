import assert from "node:assert/strict";
import { test } from "node:test";
import { boundUserFacingDetail, formatRuntimeError } from "../runtime-errors.js";

test("normalizes provider availability errors without exposing raw JSON", () => {
  assert.equal(formatRuntimeError('503: {"message":"Service temporarily unavailable","type":"api_error"}'),
    "Model service is temporarily unavailable. Check the provider status or switch models, then try again.");
  assert.equal(formatRuntimeError("429 rate limit exceeded"),
    "Model rate limit reached. Wait a moment or switch models, then try again.");
  assert.equal(formatRuntimeError("  generic failure  "), "Model request failed. Check the selected model and provider configuration, then try again.");
  assert.equal(boundUserFacingDetail(" x "), "x");
  assert.equal(boundUserFacingDetail("x".repeat(300)), "x".repeat(300));
  assert.equal(boundUserFacingDetail("x".repeat(1000)), `${"x".repeat(297)}...`);
});

test("provider errors expose recovery guidance rather than untrusted response bodies", () => {
  const auth = 'Model authentication failed. Check pi credentials and provider access, then try again.';
  for (const raw of ['401: {"message":"authorization=synthetic-marker"}', '403 forbidden synthetic-marker', 'No API key found for synthetic-marker']) {
    assert.equal(formatRuntimeError(raw), auth);
  }
  for (const raw of ['400: private synthetic-marker', 'private arbitrary detail synthetic-marker']) {
    assert.equal(formatRuntimeError(raw), 'Model request failed. Check the selected model and provider configuration, then try again.');
  }
});
