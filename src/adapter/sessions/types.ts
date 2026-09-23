import type { ChildProcess, SpawnOptions } from "node:child_process";
import type { SavedHistoryPage, SavedHistoryPreview } from "../../extension/contracts/index.js";

/** Injected worker process limits and environment; production uses bounded defaults. */
export type PiSessionBackendEnvironment = {
  spawn?: (command: string, args: readonly string[], options: SpawnOptions) => ChildProcess;
  execPath?: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
  terminationGraceMs?: number;
  requestLimitBytes?: number;
  stdoutLimitBytes?: number;
  stderrLimitBytes?: number;
};

/** Public-SDK surface consumed by the isolated session worker; no session-file parsing contract. */
export type SessionInfoLike = {
  id: string;
  path: string;
  cwd: string;
  name?: string;
  modified: Date;
  firstMessage: string;
};
export type SessionManagerHandleLike = {
  getCwd(): string;
  getSessionId(): string;
  getSessionFile(): string | undefined;
  getBranch(): unknown[];
};
export type SessionListProgress = (loaded: number, total: number, partialSessions?: readonly SessionInfoLike[]) => void;
export type SessionManagerApi = {
  list(cwd: string, sessionDir?: string, onProgress?: SessionListProgress, signal?: AbortSignal): Promise<readonly SessionInfoLike[]>;
  findById(cwd: string, id: string, sessionDir?: string): string | undefined;
  open(path: string, sessionDir?: string, cwdOverride?: string): SessionManagerHandleLike;
};
type StatLike = { isDirectory(): boolean; isFile(): boolean };
export type FileSystemApi = { stat(path: string): Promise<StatLike>; realpath(path: string): Promise<string> };
export type HistoryPreviewProjector = (branch: unknown[], index: number, offset: number) => SavedHistoryPreview;
export type SessionWorkerEnvironment = {
  sessionManager?: SessionManagerApi;
  projectHistory?: (branch: unknown[], page?: number) => SavedHistoryPage;
  projectHistoryPreview?: HistoryPreviewProjector;
  fileSystem?: FileSystemApi;
};
