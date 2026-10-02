import assert from "node:assert/strict";
import test from "node:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { parseHostMessage } from "../../../webview/client/parse-host-message.js";
import { tick, folder } from "../harness.js";
import { renameFixture } from "./rename.test-support.js";

test("transport loss cancels native input ownership immediately and discards its late answer", async () => {
  const f = await renameFixture();
  let answer!: (value: string | undefined) => void;
  const waiting = new Promise<string | undefined>(resolve => { answer = resolve; });
  try {
    let cancelled = false;
    f.h.api.window.showInputBox = async (_options?: import("vscode").InputBoxOptions, token?: import("vscode").CancellationToken) => {
      token?.onCancellationRequested(() => { cancelled = true; }); return waiting;
    };
    f.v.action("renameSession"); await tick(); f.connection.lose(); await tick();
    const projection = f.v.sent.map(parseHostMessage).filter(value => value?.type === "sessionRenameState").at(-1);
    assert.equal(cancelled, true, "transport loss must cancel the actual native input token");
    assert.equal(projection?.status, "unavailable");
    answer("Must not rename"); await tick();
    assert.equal(f.commands.some(value => value.type === "set_session_name"), false);
    const title = f.v.sent.map(parseHostMessage).filter(value => value?.type === "sessionState").at(-1)?.current?.name;
    assert.equal(title, "Original name");
    mkdirSync("dist/wi080", { recursive: true });
    writeFileSync("dist/wi080/transport-loss.json", JSON.stringify({ status: "passed", nativeCancelled: cancelled, title, mutation: false }, null, 2));
  } finally { answer(undefined); await f.close(); }
});

test("workspace replacement cancels native input immediately and cannot rename the old session", async () => {
  const f = await renameFixture();
  let answer!: (value: string | undefined) => void;
  const waiting = new Promise<string | undefined>(resolve => { answer = resolve; });
  try {
    let cancelled = false;
    f.h.api.window.showInputBox = async (_options?: import("vscode").InputBoxOptions, token?: import("vscode").CancellationToken) => {
      token?.onCancellationRequested(() => { cancelled = true; }); return waiting;
    };
    f.v.action("renameSession"); await tick();
    f.h.api.workspace.workspaceFolders = [folder("/new-project")]; f.h.change.fire(); await tick();
    assert.equal(cancelled, true);
    answer("Late old-project name"); await tick();
    assert.equal(f.commands.some(value => value.type === "set_session_name"), false);
    mkdirSync("dist/wi080", { recursive: true });
    writeFileSync("dist/wi080/workspace-replacement.json", JSON.stringify({ status: "passed", nativeCancelled: cancelled, mutation: false }, null, 2));
  } finally { answer(undefined); await f.close(); }
});
