import assert from "node:assert/strict";
import { test } from "node:test";
import { getPlaceholderHtml } from "../placeholderHtml.js";

test("placeholder uses a nonce-restricted script and contains no runtime capabilities", () => {
  const html = getPlaceholderHtml("test-nonce");
  assert.match(html, /script-src 'nonce-test-nonce'/);
  assert.match(html, /<script nonce="test-nonce">/);
  assert.match(html, /default-src 'none'/);
  assert.match(html, /postMessage\(\{ version: 1, type: "ping" \}\)/);
  assert.doesNotMatch(html, /require\(|child_process|SecretStorage|pi-coding-agent/);
});

test("redesigned layout: header status dot, cards, composer with chips and icon send", () => {
  const html = getPlaceholderHtml("test-nonce");
  for (const marker of ["id=\"app-header\"", "id=\"runtime-dot\"", "id=\"composer\"", "id=\"model-effort-trigger\"",
    "id=\"model-popover\"", "id=\"model-current\"", "id=\"thinking-slider\"", "id=\"model-list\"", "id=\"messages\"", "id=\"send-chat\""]) {
    assert.match(html, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(html, /<svg viewBox="0 0 16 16"/); // icon send button, no text label
  assert.match(html, /id="model-list" role="menu" hidden/); // model list collapsed behind current-model row
  assert.match(html, /::-webkit-slider-thumb/); // styled rounded slider thumb
  assert.match(html, /msg-user/); // right-aligned user pill style
  assert.match(html, /aria-live="polite"/);
  assert.doesNotMatch(html, /<h1>/); // no page-style headings
});
