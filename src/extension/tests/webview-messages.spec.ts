import assert from "node:assert/strict";
import { test } from "node:test";
import { handleWebviewMessage, isPingMessage, parseWebviewMessage } from "../webviewMessages.js";

test("strict action allowlist rejects expanded shapes, hostile values and generations", () => {
  for (const type of ["openFolder", "manageTrust", "chooseResources", "sendChat", "setThinkingLevel", "setChatModel"]) {
    const valid = {
      version: 1, type, generation: 1,
      ...(type === "chooseResources" ? { choice: "allow" } : {}),
      ...(type === "sendChat" ? { text: "hello" } : {}),
      ...(type === "setThinkingLevel" ? { level: "high" } : {}),
      ...(type === "setChatModel" ? { provider: "anthropic", modelId: "claude" } : {}),
    };
    assert.ok(parseWebviewMessage(valid));
    for (const generation of [-1, 1.5, Infinity, NaN, "1", Number.MAX_SAFE_INTEGER + 1]) assert.equal(parseWebviewMessage({ ...valid, generation }), undefined);
    for (const extra of [{ path: "/evil" }, { command: "evil" }, { isTrusted: true }, { choice: "invalid" }]) assert.equal(parseWebviewMessage({ ...valid, ...extra }), undefined);
  }
  assert.equal(parseWebviewMessage(Object.create({ version: 1, type: "ping" })), undefined);
  assert.equal(parseWebviewMessage({ version: 1, type: "ping", [Symbol("extra")]: 1 }), undefined);
  assert.equal(parseWebviewMessage({ version: 1, get type() { throw new Error("must not execute"); } }), undefined);
});

test("accepts the single allowlisted ping and returns a pong", () => {
  const ping = { version: 1, type: "ping" };
  assert.equal(isPingMessage(ping), true);
  assert.deepEqual(handleWebviewMessage(ping), { version: 1, type: "pong" });
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
