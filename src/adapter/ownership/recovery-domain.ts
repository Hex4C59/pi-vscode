import { readdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createRuntimeOwner } from "./runtime-owner.js";
import type { RetainedRunHandoff } from "../../extension/contracts/index.js";

export const RECOVERY_ROOT_NAME = "recovery-v1";
const WINDOWS_SEGMENT = "windows";
const MAX_WINDOW_DOMAINS = 32;
const WINDOW_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type RecoveryOwnerFactory = (directory: string) => { handoff(): Promise<unknown> };

export function allocateWindowId(): string {
  return randomUUID();
}

export function recoveryRoot(globalStorage: string): string {
  return path.join(globalStorage, RECOVERY_ROOT_NAME);
}

export function windowRecoveryDirectory(globalStorage: string, windowId: string): string {
  return path.join(recoveryRoot(globalStorage), WINDOWS_SEGMENT, windowId);
}

export async function siblingWindowDirectories(globalStorage: string, currentWindowId: string): Promise<string[]> {
  const parent = path.join(recoveryRoot(globalStorage), WINDOWS_SEGMENT);
  try {
    const names = await readdir(parent, { withFileTypes: true });
    const directories: string[] = [];
    for (const entry of names) {
      if (directories.length >= MAX_WINDOW_DOMAINS) break;
      if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
      if (entry.name === currentWindowId || !WINDOW_ID.test(entry.name)) continue;
      directories.push(path.join(parent, entry.name));
    }
    return directories;
  } catch {
    return [];
  }
}

export async function handoffForeignRecoveryDomains(input: {
  globalStorage: string;
  currentWindowId: string;
  workerPath: string;
  createOwner?: RecoveryOwnerFactory;
}): Promise<void> {
  const create = input.createOwner ?? ((directory: string) => createRuntimeOwner({
    directory,
    workerPath: input.workerPath,
  }));
  const tryHandoff = async (directory: string): Promise<void> => {
    try { await create(directory).handoff(); }
    catch { /* Foreign cleanup is best-effort; this window still uses its own domain. */ }
  };
  await tryHandoff(recoveryRoot(input.globalStorage));
  for (const directory of await siblingWindowDirectories(input.globalStorage, input.currentWindowId)) {
    await tryHandoff(directory);
  }
}

export function withForeignHandoff<T extends { handoff(): Promise<RetainedRunHandoff> }>(
  process: T,
  foreign: () => Promise<void>,
): T {
  return {
    ...process,
    async handoff() {
      try { await foreign(); } catch { /* Foreign cleanup is best-effort. */ }
      return process.handoff();
    },
  };
}
