import type { RuntimeOwner } from "../../ownership/index.js";
import { abandonChild, createChildLink } from "./child-link.js";
import type { ProcessFailure, ProcessResult, RuntimeProcess } from "./types.js";

const failures: Record<ProcessFailure, string> = {
  "prompt-ack": "Prompt acknowledgement was lost. Explicit owned-runtime recovery is required; no task was retried.",
  "prompt-delivery": "Prompt delivery is uncertain. Explicit owned-runtime recovery is required; no retry was made.",
  "reply-delivery": "Extension reply delivery is unconfirmed. Explicit owned-runtime recovery is required; no reply was retried.",
  interaction: "Extension interaction state is unconfirmed. Explicit owned-runtime recovery is required.",
  "stop-unconfirmed": "Stop is not confirmed. End the owned runtime explicitly and recover only after observed exit; no automatic termination occurred.",
  "stop-failed": "Stop failed and runtime work is uncertain. Explicit owned-runtime termination and recovery are required.",
};
const blockedDetail = "Runtime shutdown was not confirmed. Manually end the old process and reload the extension host.";
const pendingDetail = "Runtime ownership startup is still pending. Recovery cannot retire an in-flight launch.";

export function createManagedProcess(owner: RuntimeOwner): RuntimeProcess {
  let active: { child: Awaited<ReturnType<RuntimeOwner["launch"]>> & { ok: true }; transport: ReturnType<typeof createChildLink> } | undefined;
  let launching = false;
  let generation = 0;
  let blocked = false;
  let cleanup: Promise<void> = Promise.resolve();
  const serialize = <T>(action: () => Promise<T>): Promise<T> => {
    const result = cleanup.then(action);
    cleanup = result.then(() => undefined, () => undefined);
    return result;
  };
  const end = async (): Promise<ProcessResult> => {
    try { return (await owner.end()).ok ? { ok: true } : { ok: false, detail: "Owned runtime exit is not confirmed. Recovery remains blocked." }; }
    catch { return { ok: false, detail: "Owned runtime observer is unavailable. Recovery remains blocked." }; }
  };
  const recover = async (): Promise<ProcessResult> => {
    try { return (await owner.recover()).ok ? { ok: true } : { ok: false, detail: "Matching owned-runtime exit evidence is required before recovery." }; }
    catch { return { ok: false, detail: "Runtime recovery could not be recorded. No replacement was started." }; }
  };
  return {
    describeFailure: reason => failures[reason],
    async launch(input) {
      if (launching || active) return { ok: false, detail: pendingDetail };
      const token = generation;
      launching = true;
      try {
        await cleanup;
        if (blocked || token !== generation) return { ok: false, detail: blockedDetail };
        const launched = await owner.launch(input);
        if (!launched.ok) {
          return { ok: false, detail: launched.code === "occupied" ? "Another runtime occupies the shared recovery domain. No replacement was launched." : "Runtime ownership startup failed. Recovery evidence must be checked before another launch." };
        }
        if (token !== generation) {
          blocked = true;
          abandonChild(launched.process);
          return { ok: false, detail: "Runtime start superseded. Explicit owned-runtime recovery is required." };
        }
        try {
          const transport = createChildLink(launched.process);
          active = { child: launched, transport };
          return { ok: true, link: transport.link };
        } catch {
          abandonChild(launched.process);
          blocked = true;
          return { ok: false, detail: "Runtime ownership startup failed. Recovery evidence must be checked before another launch." };
        }
      } catch {
        blocked = true;
        return { ok: false, detail: "Runtime ownership startup failed. Recovery evidence must be checked before another launch." };
      } finally { launching = false; }
    },
    release(reason) {
      generation++;
      if (launching) blocked = true;
      const previous = active;
      active = undefined;
      if (!previous) return cleanup;
      previous.transport.detach();
      if (reason === "uncertain") blocked = true;
      if (blocked) { abandonChild(previous.child.process); return cleanup; }
      return serialize(async () => {
        if (!(await end()).ok || !(await recover()).ok) {
          blocked = true;
          abandonChild(previous.child.process);
        }
      });
    },
    async inspect() {
      try { const state = await owner.inspect(); return state.kind === "empty" ? "none" : state.kind; }
      catch { return "blocked"; }
    },
    end() {
      if (launching) return Promise.resolve({ ok: false, detail: pendingDetail });
      return serialize(end);
    },
    recover() {
      if (launching) return Promise.resolve({ ok: false, detail: pendingDetail });
      const token = generation;
      return serialize(async () => {
        if (launching || token !== generation) return { ok: false, detail: pendingDetail };
        const result = await recover();
        if (result.ok && token === generation) blocked = false;
        return result;
      });
    },
    handoff() {
      // A retained run is handed off only while this instance owns nothing of its own.
      if (launching || active) return Promise.resolve({ ok: false, code: "busy" } as const);
      const token = generation;
      return serialize(async () => {
        if (launching || active || token !== generation) return { ok: false, code: "busy" } as const;
        const result = await owner.handoff();
        // A retired or absent domain is clean again, so a later launch may reserve it.
        if (token === generation && result.ok && (result.outcome === "none" || result.outcome === "retired")) blocked = false;
        return result;
      });
    },
  };
}
