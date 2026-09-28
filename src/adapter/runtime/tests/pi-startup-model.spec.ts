import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { readPiStartupModelArg } from "../piStartupModel.js";

test("readPiStartupModelArg reads defaults from PI_CODING_AGENT_DIR", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "pi-startup-model-"));
  try {
    await writeFile(path.join(root, "settings.json"), JSON.stringify({
      defaultProvider: "anthropic",
      defaultModel: "claude-test",
    }));
    assert.equal(readPiStartupModelArg({ PI_CODING_AGENT_DIR: root }), "anthropic/claude-test");
    assert.equal(readPiStartupModelArg({ PI_CODING_AGENT_DIR: path.join(root, "missing") }), undefined);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
