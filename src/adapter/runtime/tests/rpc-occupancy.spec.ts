import assert from "node:assert/strict";
import test from "node:test";
import { createRpcOccupancy } from "../rpc-occupancy.js";

test("ACK arrival and task end occupy send independently", () => {
  const occupancy = createRpcOccupancy();
  occupancy.bind({ connection: {}, session: 1 });
  occupancy.beginSend({ command: false });
  assert.equal(occupancy.allowsSend(), false);
  occupancy.clearAck(1);
  assert.equal(occupancy.allowsSend(), false);
  assert.equal(occupancy.sending(), true);
  occupancy.noteAgentSettled();
  assert.equal(occupancy.allowsSend(), true);

  occupancy.beginSend({ command: false });
  occupancy.noteAgentSettled();
  assert.equal(occupancy.allowsSend(), false);
  assert.equal(occupancy.sending(), false);
  occupancy.clearAck(1);
  assert.equal(occupancy.allowsSend(), true);
});

test("command occupancy can outlive or precede agent occupancy", () => {
  const connection = {};
  const occupancy = createRpcOccupancy();
  occupancy.bind({ connection, session: 1 });
  occupancy.beginSend({ command: true });
  occupancy.noteAgentStarted();
  occupancy.clearAck(1);
  occupancy.finishCommand(connection);
  assert.equal(occupancy.allowsSend(), false);
  assert.equal(occupancy.allowsRestart(), false);
  occupancy.noteAgentSettled();
  assert.equal(occupancy.allowsSend(), true);

  occupancy.beginSend({ command: true });
  occupancy.noteAgentStarted();
  occupancy.clearAck(1);
  occupancy.noteAgentSettled();
  assert.equal(occupancy.allowsSend(), false);
  assert.equal(occupancy.sending(), true);
  occupancy.finishCommand(connection);
  assert.equal(occupancy.allowsSend(), true);
  assert.equal(occupancy.agentRunning(), false);
});

test("dialogs and approvals occupy restart and release without blocking send admission", () => {
  const connection = {};
  const occupancy = createRpcOccupancy();
  occupancy.bind({ connection, session: 1 });
  occupancy.openDialog();
  assert.equal(occupancy.allowsSend(), true);
  assert.equal(occupancy.allowsRestart(), false);
  assert.equal(occupancy.classifyRelease({ sessionActive: true }), "uncertain");
  occupancy.closeDialog(connection);
  occupancy.addApproval("call-1");
  assert.equal(occupancy.allowsSend(), true);
  assert.equal(occupancy.allowsRestart(), false);
  assert.equal(occupancy.classifyRelease({ sessionActive: true }), "uncertain");
  occupancy.removeApproval("call-1");
  assert.equal(occupancy.allowsRestart(), true);
  assert.equal(occupancy.classifyRelease({ sessionActive: true }), "idle");
});

test("Stop and release classification keep distinct conditions", () => {
  const occupancy = createRpcOccupancy();
  occupancy.bind({ connection: {}, session: 1 });
  occupancy.beginStopping();
  assert.equal(occupancy.allowsSend(), false);
  assert.equal(occupancy.allowsRestart(), false);
  assert.equal(occupancy.classifyRelease({ sessionActive: true }), "idle");
  occupancy.clearStopping();
  occupancy.beginSend({ command: false });
  occupancy.beginStopping();
  assert.equal(occupancy.sending(), true);
  assert.equal(occupancy.classifyRelease({ sessionActive: true }), "uncertain");
  occupancy.clearAck(1);
  occupancy.noteAgentSettled();
  assert.equal(occupancy.sending(), false);
  assert.equal(occupancy.classifyRelease({ forcedUncertain: true, sessionActive: true }), "uncertain");
  assert.equal(occupancy.classifyRelease({ sessionActive: false }), "uncertain");
});

test("stale connection or session completions do not mutate current occupancy", () => {
  const live = {};
  const occupancy = createRpcOccupancy();
  occupancy.bind({ connection: live, session: 2 });
  occupancy.beginSend({ command: true });
  occupancy.openDialog();
  occupancy.finishCommand({});
  occupancy.rejectSend({});
  occupancy.clearAck(1);
  occupancy.closeDialog({});
  assert.equal(occupancy.allowsSend(), false);
  assert.equal(occupancy.sending(), true);
  assert.equal(occupancy.dialogs(), 1);
  occupancy.finishCommand(live);
  occupancy.clearAck(2);
  occupancy.closeDialog(live);
  occupancy.noteAgentSettled();
  assert.equal(occupancy.allowsSend(), true);
  assert.equal(occupancy.dialogs(), 0);
});
