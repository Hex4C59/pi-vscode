import assert from "node:assert/strict";
import test from "node:test";
import { uiHarness } from "./react-harness.js";

test("workspace guards expose native actions and never allow resources from blocked states", async () => {
  const h = await uiHarness(false);
  try {
    await h.render({ status: "no-folder", folder: null, choice: null, runtime: "not-started" });
    await h.click("#open-folder"); assert.equal(h.sent.at(-1)?.type, "openFolder");
    await h.render({ status: "untrusted", choice: null, runtime: "not-started" });
    await h.click("#manage-trust"); assert.equal(h.sent.at(-1)?.type, "manageTrust");
    for (const status of ["multi-root", "remote", "non-file"] as const) {
      await h.render({ status, choice: null, runtime: "not-started" });
      assert.ok(h.get("#setup-blocked").textContent);
      assert.equal(h.root.querySelector("#allow"), null);
      assert.equal(h.root.querySelector("#composer"), null);
    }
    await h.render({ choice: null, runtime: "not-started" });
    await h.click("#decline"); assert.equal(h.sent.at(-1)?.type, "chooseResources");
    await h.render({ choice: null, runtime: "starting", busy: true });
    assert.equal(h.get<HTMLButtonElement>("#allow").disabled, true);
    await h.render({ runtime: "error", runtimeDetail: "<img> launch failed", error: "Try again" });
    assert.ok(h.root.textContent?.includes("<img> launch failed")); assert.equal(h.root.querySelector("img"), null);
    assert.equal(h.root.querySelector("#send-chat") === null, true);
    assert.equal(h.root.querySelector("#chat-input") === null, true);
  } finally { await h.close(); }
});
