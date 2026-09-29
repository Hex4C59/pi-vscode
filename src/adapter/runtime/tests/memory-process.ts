import { PassThrough } from "node:stream";
import type { ProcessLaunch, RuntimeLink, RuntimeProcess } from "../process/types.js";

export type MemoryConnection = ReturnType<typeof createMemoryConnection>;
/** Script the public byte transport, including callback/drain order, without a ChildProcess. */
export function createMemoryConnection(write: (frame: string, done: (error?: Error) => void) => boolean) {
  const stdin = new PassThrough();
  const stdout = new PassThrough();
  const listeners = new Set<() => void>();
  // Writable's overloaded encoding form is not used by the RPC string-frame interface.
  stdin.write = ((frame: string, done?: (error?: Error) => void) => write(frame, done ?? (() => undefined))) as typeof stdin.write;
  const lose = () => { for (const listener of [...listeners]) listener(); };
  stdin.on("error", lose);
  const link: RuntimeLink = {
    stdin, stdout,
    onLost(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  };
  return { link, stdin, stdout, lose, frame(value: unknown) { stdout.write(JSON.stringify(value) + "\n"); } };
}

/** In-memory process contract for RPC tests. Native lifecycle policy is tested separately. */
export function createMemoryProcess(connect: (input: ProcessLaunch) => MemoryConnection | Promise<MemoryConnection>) {
  const launches: ProcessLaunch[] = [];
  const releases: ("idle" | "uncertain")[] = [];
  let active: MemoryConnection | undefined;
  let pending = false;
  let generation = 0;
  let blocked = false;
  let endCalls = 0;
  let recoveryCalls = 0;
  const process: RuntimeProcess = {
    async launch(input) {
      if (blocked || pending) return { ok: false, detail: "Runtime recovery required." };
      const token = generation;
      pending = true; launches.push(input);
      try {
        const connection = await connect(input);
        if (token !== generation) return { ok: false, detail: "Runtime start superseded. Recovery required." };
        active = connection;
        return { ok: true, link: connection.link };
      } finally { pending = false; }
    },
    async release(reason) {
      generation++;
      if (pending) blocked = true;
      if (!active) return;
      releases.push(reason);
      active = undefined;
      if (reason === "uncertain") blocked = true;
    },
    async inspect() { return blocked ? "blocked" : active ? "pending" : "none"; },
    async end() { endCalls++; return { ok: true }; },
    async recover() {
      if (pending) return { ok: false, detail: "Launch pending." };
      recoveryCalls++; blocked = false; return { ok: true };
    },
    describeFailure(reason) { return `Runtime ${reason} is unconfirmed. Explicit owned-runtime recovery is required.`; },
  };
  return { process, launches, releases, get endCalls() { return endCalls; }, get recoveryCalls() { return recoveryCalls; } };
}
