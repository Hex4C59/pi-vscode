import assert from "node:assert/strict";
import { test } from "node:test";

import { getPlaceholderHtml } from "../webview/placeholderHtml.js";
import { handleWebviewMessage, isPingMessage } from "./webviewMessages.js";

test("accepts the single allowlisted ping and returns a pong", () => {
  const ping = { version: 1, type: "ping" };
  assert.equal(isPingMessage(ping), true);
  assert.deepEqual(handleWebviewMessage(ping), { version: 1, type: "pong" });
});

test("placeholder uses a nonce-restricted script and contains no runtime capabilities", () => {
  const html = getPlaceholderHtml("test-nonce");
  assert.match(html, /script-src 'nonce-test-nonce'/);
  assert.match(html, /<script nonce="test-nonce">/);
  assert.match(html, /default-src 'none'/);
  assert.match(html, /postMessage\(\{ version: 1, type: "ping" \}\)/);
  assert.doesNotMatch(html, /require\(|child_process|SecretStorage|pi-coding-agent/);
});

test("ignores malformed, unsupported, and expanded messages", () => {
  const rejected: unknown[] = [
    null,
    [],
    "ping",
    1,
    {},
    { version: "1", type: "ping" },
    { version: 2, type: "ping" },
    { version: 1, type: "prompt" },
    { version: 1, type: "ping", command: "execute" },
    { version: 1, type: "ping", constructor: "unexpected" },
  ];
  for (const message of rejected) {
    assert.equal(isPingMessage(message), false);
    assert.equal(handleWebviewMessage(message), undefined);
  }
});
