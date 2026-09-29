import assert from "node:assert/strict";
import test from "node:test";
import { uiHarness } from "./react-harness.js";

test("workspace guards expose blocked and untrusted actions; fixture no-folder/resource cards retired", async () => {
  const h = await uiHarness(false);
  try {
    await h.render({ status: "no-folder", folder: null, choice: null, runtime: "not-started" });
    assert.ok(h.root.querySelector(".candidate__composer"));
    assert.equal(h.root.querySelector("#setup-blocked") === null, true);
    assert.equal(h.root.querySelector("#manage-trust") === null, true);

    await h.render({ status: "untrusted", choice: null, runtime: "not-started" });
    await h.click("#manage-trust"); assert.equal(h.sent.at(-1)?.type, "manageTrust");
    for (const status of ["multi-root", "remote", "non-file"] as const) {
      await h.render({ status, choice: null, runtime: "not-started" });
      assert.ok(h.get("#setup-blocked").textContent);
      assert.equal(h.root.querySelector("#allow") === null, true);
    }
    await h.render({ status: "eligible", choice: null, runtime: "not-started" });
    await h.input("need resources");
    await h.click('button[aria-label="Send message"]');
    await h.click("#decline"); assert.equal(h.sent.at(-1)?.type, "chooseResources");
    await h.render({ status: "eligible", choice: null, runtime: "starting", busy: true });
    assert.equal(h.root.querySelector("#allow") === null, true);
    await h.render({ status: "eligible", choice: "allow", runtime: "error", runtimeDetail: "<img> launch failed", error: "Try again" });
    // Production prefers workspace error over runtimeDetail when both are set.
    assert.ok(h.root.textContent?.includes("Try again"));
    assert.equal(h.root.querySelector("img") === null, true);
    await h.render({ status: "eligible", choice: "allow", runtime: "error", runtimeDetail: "<img> launch failed", error: null });
    assert.ok(h.root.textContent?.includes("<img> launch failed"));
    assert.equal(h.root.querySelector("img") === null, true);
    assert.equal(h.get<HTMLButtonElement>('button[aria-label="Send message"]').disabled, true);
    assert.ok(h.root.querySelector('textarea[aria-label="Message"]'));
  } finally { await h.close(); }
});
