import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { WebviewClient } from "../client/webview-client.js";
import { readySettings } from "../../extension/tests/harness.js";
import type { WebviewMessage } from "../../extension/contracts/index.js";

// Failure modes: completed host text immediately reverted by client sync; newer local edit
// overwritten by late completion; old catalogue revision accepted; generation keeps old rows.
test("client and provider complete an acknowledged command without sending or reverting it", async () => {
  const { r, h, v } = await readySettings();
  r.runtime.getCommandCatalogue = () => ({ status: "ready", rows: [{ name: "fix-tests", source: "prompt" }] });
  const sent: WebviewMessage[] = [];
  let held: WebviewMessage | undefined;
  let hold = false;
  const client = new WebviewClient({
    subscribe(listener) { const sub = v.posted.subscribe(listener); return () => sub.dispose(); },
    postMessage(message) {
      sent.push(message);
      if (hold && message.type === "completeCommand") held = message;
      else v.receive.fire(message);
    },
  });
  try {
    client.start();
    client.edit("/fi keep arguments");
    assert.equal(client.getSnapshot().synchronizing, false);
    client.completeCommand("fix-tests");
    assert.equal(client.getSnapshot().text, "/fix-tests keep arguments");
    assert.equal(v.attachments().draft.text, "/fix-tests keep arguments");
    assert.equal(client.getSnapshot().synchronizing, false);
    assert.equal(sent.some(message => message.type === "sendChat" || message.type === "queueChat"), false);

    client.edit("/fi"); hold = true;
    client.completeCommand("fix-tests");
    assert.ok(held);
    v.attachments(); // Same-revision bootstrap must not retire a still-pending completion.
    v.receive.fire(held);
    assert.equal(client.getSnapshot().text, "/fix-tests");
    assert.equal(v.attachments().draft.text, "/fix-tests");

    client.edit("/fi"); hold = true;
    client.completeCommand("fix-tests");
    assert.ok(held);
    client.edit("newer local edit");
    v.receive.fire(held);
    assert.equal(client.getSnapshot().text, "newer local edit");
    assert.equal(v.attachments().draft.text, "newer local edit");
    const catalogue = client.getSnapshot().commandCatalogue;
    assert.ok(catalogue);
    v.posted.fire({ ...catalogue, revision: catalogue.revision - 1, status: "empty", rows: [] });
    assert.equal(client.getSnapshot().commandCatalogue, catalogue);
    r.events.fire({ kind: "runtime_error", session: r.runtime.getSession(), detail: "Synthetic disconnect" });
    assert.equal(client.getSnapshot().commandCatalogue?.status, "unavailable");
    await reportRoundtrip();
  } finally { client.dispose(); h.provider.dispose(); }
});


async function reportRoundtrip(): Promise<void> {
  const output = path.resolve("dist/wi078-command-catalogue");
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, "client-host-roundtrip.json"), JSON.stringify({ schemaVersion: 1,
    status: "passed", evidence: "client-provider-draft-roundtrip", checks: ["completion adopted",
      "no send", "same-revision bootstrap retains completion", "newer edit retained",
      "old revision ignored", "disconnect clears rows"],
    limits: ["runtime and VS Code seams", "not rendered menu, F5 or installed VSIX"] }, null, 2) + "\n");
}
