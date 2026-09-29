import type { ChildProcess } from "node:child_process";
import type { RuntimeLink } from "./types.js";

/** Own the native transport listeners, including harmless late errors after release. */
export function createChildLink(child: ChildProcess): { link: RuntimeLink; detach(): void } {
  if (!child.stdin || !child.stdout) throw new Error("Runtime pipes are unavailable.");
  const listeners = new Set<() => void>();
  let lost = child.exitCode !== null || child.signalCode !== null;
  const notify = () => { lost = true; for (const listener of [...listeners]) listener(); };
  child.on("error", notify);
  child.on("close", notify);
  child.stdin.on("error", notify);
  child.stderr?.resume(); // Never accumulate or project raw stderr.
  return {
    link: {
      stdin: child.stdin, stdout: child.stdout,
      onLost(listener) {
        listeners.add(listener);
        if (lost) queueMicrotask(() => { if (listeners.has(listener)) listener(); });
        return () => { listeners.delete(listener); };
      },
    },
    detach() { listeners.clear(); },
  };
}

/** Detach without closing pi input or treating transport loss as child exit. */
export function abandonChild(child: ChildProcess): void {
  if (child.connected) { try { child.disconnect(); } catch { /* Exit evidence remains required. */ } }
  child.stdout?.resume();
  child.stderr?.resume();
}
