import type { HostEnvelope, SavedHistoryStateMessage, SavedHistoryPreviewMessage } from "../contracts/index.js";

export type SavedHistoryState = Omit<SavedHistoryStateMessage, keyof HostEnvelope>;
export type SavedHistoryResult =
  | Omit<Extract<SavedHistoryPreviewMessage, { code: string }>, keyof HostEnvelope>
  | Omit<Extract<SavedHistoryPreviewMessage, { text: string }>, keyof HostEnvelope>;

/** Host-owned project/session identity and read-settlement barrier; recheck after awaits. */
export type SavedHistoryContext = {
  cwd: string | undefined; key: string; enabled: boolean; startable: boolean; settled: Promise<void>;
};
