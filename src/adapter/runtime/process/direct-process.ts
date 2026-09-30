import { spawn, type ChildProcess } from "node:child_process";
import { createChildLink } from "./child-link.js";
import type { ProcessFailure, RuntimeProcess } from "./types.js";

/** Explicit spike-only strategy. Never selected by the production composition. */
export function createDirectProcess(spawnProcess: typeof spawn = spawn): RuntimeProcess {
  let active: { child: ChildProcess; transport: ReturnType<typeof createChildLink> } | undefined;
  let generation = 0;
  let launching = false;
  let blocked = false;
  let cleanup = Promise.resolve();
  const failures: Record<ProcessFailure, string> = {
    "prompt-ack": "Prompt acknowledgement was lost. Runtime shut down; task was not retried.",
    "prompt-delivery": "Prompt delivery is uncertain. Runtime stopped; no retry was made.",
    "reply-delivery": "Extension reply delivery is unconfirmed. Runtime stopped; no reply was retried.",
    interaction: "Extension interaction state is unconfirmed. Runtime stopped; no task was retried.",
    "stop-unconfirmed": "Stop did not settle; runtime was shut down. Side effects are not rolled back.",
    "stop-failed": "Stop failed; runtime was shut down. Side effects are not rolled back.",
  };
  const unavailable = { ok: false as const, detail: "Owned runtime recovery is unavailable." };
  const release = (): Promise<void> => {
    generation++;
    const previous = active;
    active = undefined;
    if (previous) {
      previous.transport.detach();
      cleanup = cleanup.then(async () => { if (!await stopChildProcess(previous.child)) blocked = true; });
    }
    return cleanup;
  };
  return {
    describeFailure: reason => failures[reason],
    async launch(input) {
      if (launching || active) return { ok: false, detail: "Runtime launch is already in progress." };
      launching = true;
      const token = generation;
      try {
        await cleanup;
        if (blocked) return { ok: false, detail: "Runtime shutdown was not confirmed. Manually end the old process and reload the extension host." };
        if (token !== generation) return { ok: false, detail: "Runtime start superseded" };
        const child = spawnProcess(process.execPath, [input.cliPath, ...input.args], {
          cwd: input.cwd, stdio: ["pipe", "pipe", "pipe"], env: input.env, windowsHide: true,
        });
        try { active = { child, transport: createChildLink(child) }; }
        catch { if (!await stopChildProcess(child)) blocked = true; return { ok: false, detail: "Runtime pipes are unavailable." }; }
        return { ok: true, link: active.transport.link };
      } catch { return { ok: false, detail: "Runtime process could not be started." }; }
      finally { launching = false; }
    },
    release,
    async inspect() { return "none"; },
    async end() { return unavailable; },
    async recover() { return unavailable; },
    // The spike strategy keeps no recovery fence, so no retained run can be handed off.
    async handoff() { return { ok: true, outcome: "none" }; },
  };
}

function stopChildProcess(child: ChildProcess): Promise<boolean> {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve(true);
  return new Promise(resolve => {
    let finished = false;
    const finish = (confirmed: boolean) => {
      if (finished) return; finished = true;
      clearTimeout(escalate); clearTimeout(deadline); child.off("close", closed); resolve(confirmed);
    };
    const closed = () => finish(true);
    const escalate = setTimeout(() => { try { child.kill("SIGKILL"); } catch { /* Observe closure or deadline. */ } }, 5000);
    const deadline = setTimeout(() => finish(false), 10000);
    child.once("close", closed);
    try { child.kill("SIGTERM"); } catch { /* Observe closure or deadline. */ }
  });
}
