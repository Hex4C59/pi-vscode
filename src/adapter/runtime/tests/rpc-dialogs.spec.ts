import assert from "node:assert/strict";
import { test } from "node:test";
import { credentialLikeSamples, ordinaryText } from "../../../extension/contracts/tests/credential-samples.js";
import { createRpcDialogs } from "../rpc-dialogs.js";

test("standard select uses opaque local options and writes the original value only once", () => {
  const written: string[] = [];
  const dialogs = createRpcDialogs(frame => { written.push(frame); });
  const incoming = dialogs.open({ type: "extension_ui_request", id: "remote-1", method: "select", title: "Choose", options: ["one", "two"] });
  assert.equal(incoming.kind, "dialog");
  if (incoming.kind !== "dialog" || incoming.form.method !== "select") return;
  assert.deepEqual(incoming.form.options.map(option => option.label), ["one", "two"]);
  const optionId = incoming.form.options[1].id;
  incoming.reply({ kind: "answer", answer: { method: "select", optionId } });
  incoming.reply({ kind: "cancel", reason: "user" });
  assert.deepEqual(written.map(line => JSON.parse(line) as unknown), [{ type: "extension_ui_response", id: "remote-1", value: "two" }]);
  assert.equal(dialogs.open({ type: "extension_ui_request", id: "remote-1", method: "select", title: "Forged replay", options: ["three"] }).kind, "duplicate");
  assert.equal(written.length, 1);
});

test("standard confirm, input and editor preserve method-specific values and cancellation", () => {
  const written: unknown[] = [];
  const dialogs = createRpcDialogs(frame => { written.push(JSON.parse(frame) as unknown); });
  for (const method of ["confirm", "input", "editor"] as const) {
    const incoming = dialogs.open({ type: "extension_ui_request", id: method, method, title: "Literal", ...(method === "confirm" ? { message: "Question" } : method === "input" ? { placeholder: "Hint" } : { prefill: "Original\ntext" }), timeout: 100 });
    assert.equal(incoming.kind, "dialog");
    if (incoming.kind !== "dialog") return;
    assert.equal(incoming.form.timeoutMs, 100);
    incoming.reply({ kind: "answer", answer: method === "confirm" ? { method, value: false } : { method, text: "" } });
  }
  assert.deepEqual(written, [
    { type: "extension_ui_response", id: "confirm", confirmed: false },
    { type: "extension_ui_response", id: "input", value: "" },
    { type: "extension_ui_response", id: "editor", value: "" },
  ]);
});

test("shared credential-like dialog text is cancelled and ordinary text still opens", () => {
  const written: unknown[] = [];
  const dialogs = createRpcDialogs(frame => { written.push(JSON.parse(frame) as unknown); });
  credentialLikeSamples.forEach((text, index) => {
    assert.equal(dialogs.open({ type: "extension_ui_request", id: `cred-${index}`, method: "confirm", title: "Form", message: text }).kind, "rejected");
  });
  assert.deepEqual(written, credentialLikeSamples.map((_text, index) => ({ type: "extension_ui_response", id: `cred-${index}`, cancelled: true })));
  assert.equal(JSON.stringify(written).includes("synthetic"), false);
  assert.equal(dialogs.open({ type: "extension_ui_request", id: "plain", method: "confirm", title: "Form", message: ordinaryText }).kind, "dialog");
});

test("unreviewable or credential-like dialogs are cancelled without projecting their contents", () => {
  const written: unknown[] = [];
  const dialogs = createRpcDialogs(frame => { written.push(JSON.parse(frame) as unknown); });
  const invalid = [
    { method: "editor", prefill: "secret = synthetic-canary" },
    { method: "editor", prefill: "界".repeat(10923) },
    { method: "select", options: Array.from({ length: 65 }, () => "value") },
    { method: "select", options: ["a".repeat(1025)] },
    { method: "confirm", message: "safe", timeout: -1 },
    { method: "input", placeholder: "safe", timeout: 86_400_001 },
    { method: "input", placeholder: "safe", unexpected: true },
  ];
  invalid.forEach((fields, index) => {
    assert.equal(dialogs.open({ type: "extension_ui_request", id: `invalid-${index}`, title: "Form", ...fields }).kind, "rejected");
  });
  assert.deepEqual(written, invalid.map((_fields, index) => ({ type: "extension_ui_response", id: `invalid-${index}`, cancelled: true })));
});

test("adapter invalidation suppresses every late reply and does not reopen consumed remote IDs", () => {
  const written: unknown[] = [];
  const dialogs = createRpcDialogs(frame => { written.push(JSON.parse(frame) as unknown); });
  const first = dialogs.open({ type: "extension_ui_request", id: "waiting", method: "input", title: "Input" });
  if (first.kind !== "dialog") assert.fail("expected form");
  dialogs.invalidate();
  first.reply({ kind: "answer", answer: { method: "input", text: "late" } });
  assert.deepEqual(written, []);
  assert.equal(dialogs.open({ type: "extension_ui_request", id: "next", method: "input", title: "Input" }).kind, "rejected");
});

test("oversized answers cannot bypass host checks through a captured adapter capability", () => {
  const written: unknown[] = [];
  const dialogs = createRpcDialogs(frame => { written.push(JSON.parse(frame) as unknown); });
  const first = dialogs.open({ type: "extension_ui_request", id: "answer", method: "editor", title: "Edit" });
  if (first.kind !== "dialog") assert.fail("expected form");
  assert.throws(() => first.reply({ kind: "answer", answer: { method: "editor", text: "界".repeat(10923) } }), /Invalid extension interaction answer/);
  first.reply({ kind: "answer", answer: { method: "editor", text: "second" } });
  assert.deepEqual(written, [{ type: "extension_ui_response", id: "answer", value: "second" }]);
});

test("remote replay retention outlives diagnostics and has an explicit finite exhaustion barrier", () => {
  const dialogs = createRpcDialogs(() => undefined);
  for (let i = 0; i < 65_536; i += 1) {
    const item = dialogs.open({ type: "extension_ui_request", id: `remote-${i}`, method: "confirm", title: "Confirm", message: "Safe" });
    assert.equal(item.kind, "dialog");
    if (item.kind === "dialog") item.reply({ kind: "cancel", reason: "user" });
  }
  assert.equal(dialogs.open({ type: "extension_ui_request", id: "remote-0", method: "confirm", title: "Replay", message: "Safe" }).kind, "duplicate");
  assert.deepEqual(dialogs.open({ type: "extension_ui_request", id: "over-budget", method: "confirm", title: "Extra", message: "Safe" }), { kind: "rejected", code: "identity-budget" });
});

test("uncertain asynchronous reply writes reject to the host owner without retrying", async () => {
  let attempts = 0;
  const dialogs = createRpcDialogs(async () => { attempts += 1; throw new Error("synthetic write failure"); });
  const item = dialogs.open({ type: "extension_ui_request", id: "write-loss", method: "confirm", title: "Confirm", message: "Safe" });
  if (item.kind !== "dialog") assert.fail("expected form");
  await assert.rejects(Promise.resolve(item.reply({ kind: "answer", answer: { method: "confirm", value: true } })), /synthetic write failure/);
  await item.reply({ kind: "cancel", reason: "stop" });
  assert.equal(attempts, 1);
});

test("text reply delivery reports its asynchronous failure without a detached rejection", async () => {
  for (const method of ["input", "editor"] as const) {
    let reject!: (reason: Error) => void;
    const writing = new Promise<void>((_resolve, fail) => { reject = fail; });
    const dialogs = createRpcDialogs(() => writing);
    const item = dialogs.open({ type: "extension_ui_request", id: method, method, title: "Text" });
    if (item.kind !== "dialog") assert.fail("expected form");
    const reply = item.reply({ kind: "answer", answer: { method, text: "response" } });
    assert.equal(reply, writing);
    const rejected = assert.rejects(Promise.resolve(reply), /delivery failure/);
    reject(new Error("delivery failure")); await rejected;
  }
});

for (const method of ["input", "editor"] as const) test(`literal ${method} answers are delivered even when they discuss credentials`, () => {
  const written: unknown[] = [];
  const dialogs = createRpcDialogs(frame => { written.push(JSON.parse(frame) as unknown); });
  const item = dialogs.open({ type: "extension_ui_request", id: method, method, title: "Literal text" });
  if (item.kind !== "dialog") assert.fail("expected form");
  const text = "Never print password=example; authorization = synthetic-placeholder";
  item.reply({ kind: "answer", answer: { method, text } });
  item.reply({ kind: "cancel", reason: "user" });
  assert.deepEqual(written, [{ type: "extension_ui_response", id: method, value: text }]);
});
