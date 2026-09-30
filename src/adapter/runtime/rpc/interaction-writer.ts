import type { Writable } from "node:stream";

/** Bound reply delivery independently of the time a human spends answering a dialog. */
export function createInteractionWriter(stream: Writable, current: () => boolean): (frame: string) => Promise<void> {
  const observers = new Set<{ lost(): void; drain(): void }>();
  const lostAll = () => { for (const observer of [...observers]) observer.lost(); };
  const drainAll = () => { for (const observer of [...observers]) observer.drain(); };
  return frame => {
    if (!current() || stream.destroyed || stream.writableEnded) return Promise.reject(new Error("Interaction transport is not current."));
    if (observers.size >= 16) return Promise.reject(new Error("Interaction transport capacity exhausted."));
    return new Promise<void>((resolve, reject) => {
      let finished = false; let returned = false; let callback = false; let drained = false;
      const finish = (error?: Error): void => {
        if (finished) return;
        finished = true; clearTimeout(timer); observers.delete(observer);
        if (observers.size === 0) { stream.off("error", lostAll); stream.off("close", lostAll); stream.off("drain", drainAll); }
        if (error) reject(error); else resolve();
      };
      const check = (): void => {
        if (!returned || !callback || !drained) return;
        finish(current() ? undefined : new Error("Interaction transport is not current."));
      };
      const lost = (): void => finish(new Error("Interaction reply delivery was not confirmed."));
      const drain = (): void => { drained = true; check(); };
      const timer = setTimeout(lost, 5000);
      const observer = { lost, drain };
      if (observers.size === 0) { stream.on("error", lostAll); stream.on("close", lostAll); stream.on("drain", drainAll); }
      observers.add(observer);
      try {
        const accepted = stream.write(frame, error => { if (error) lost(); else { callback = true; check(); } });
        drained ||= accepted; returned = true; check();
      } catch { lost(); }
    });
  };
}
