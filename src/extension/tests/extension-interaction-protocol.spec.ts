import assert from "node:assert/strict";
import { test } from "node:test";
import { parseWebviewMessage } from "../bridge/index.js";

test("v3 extension intents are named exact capabilities and v2 cannot retain answer authority", () => {
  const envelope = { version: 3, generation: 1, viewId: "view" };
  const valid = [
    { type: "chooseExecutionProfile", profile: "trusted" },
    { type: "chooseExecutionProfile", profile: "controlled" },
    { type: "answerInteraction", id: "interaction-1", answer: { method: "input", text: "" } },
    { type: "answerInteraction", id: "interaction-1", answer: { method: "select", optionId: "option-1" } },
    { type: "answerInteraction", id: "interaction-1", answer: { method: "confirm", value: false } },
    { type: "cancelInteraction", id: "interaction-1" },
    { type: "endOwnedRuntime" }, { type: "recoverControlledRuntime" },
  ];
  for (const intent of valid) {
    const message = { ...envelope, ...intent };
    assert.deepEqual(parseWebviewMessage(message), message);
    assert.equal(parseWebviewMessage({ ...message, version: 2 }), undefined);
    assert.equal(parseWebviewMessage({ ...message, pid: 1234 }), undefined);
  }
  for (const answer of [{ method: "confirm", value: "true" }, { method: "input", text: "界".repeat(10923) }, { method: "editor", text: "ok", command: "run" }, { method: "select", optionId: "../path" }]) {
    assert.equal(parseWebviewMessage({ ...envelope, type: "answerInteraction", id: "interaction-1", answer }), undefined);
  }
});
