import type {
  AttachmentHistoryEntry, AttachmentStateMessage, ChangeReviewStateMessage,
  HostMessage, SavedHistoryStateMessage, SessionStateMessage,
  WebviewMessage, WorkspaceStateMessage,
} from "../extension/contracts/index.js";

/** Presentation-only transport: named intents out, untrusted unknown payloads in. */
export interface WebviewBridge {
  postMessage(message: WebviewMessage): void;
  subscribe(listener: (message: unknown) => void): () => void;
}

/** Correlated, memory-only saved-history state; text is fetched in bounded chunks. */
export type SavedHistoryPreview = {
  id: string; requestId: string; offset: number; nextOffset: number; totalChars: number | null;
  text: string; done: boolean; phase: "loading" | "idle" | "error";
  error: SavedHistoryStateMessage["error"]; previousOffsets: number[];
};

export type SavedHistorySnapshot = {
  savedHistory: SavedHistoryStateMessage | null;
  savedHistoryPendingPage: number | null;
  savedHistoryPreview: SavedHistoryPreview | null;
};
export type HistoryMessage = Extract<HostMessage, { type: "savedHistoryState" | "savedHistoryPreview" }>;
export type HistoryIntent = (Omit<Extract<WebviewMessage, { type: "getSavedSessions" | "getSavedHistory" }>, "version" | "generation" | "viewId"> & { type: "getSavedHistory" })
  | Omit<Extract<WebviewMessage, { type: "getSavedHistoryPreview" }>, "version" | "generation" | "viewId">;

/** UI projection and host intents; host message definitions remain in extension/contracts. */
type WithoutEnvelope<T> = T extends { generation: number; viewId: string } ? Omit<T, "generation" | "viewId" | "version"> : never;
export type Intent = WithoutEnvelope<WebviewMessage>;
export type Preview = { snapshotId: string; requestId: string; offset: number; text: string; error: string | null };
export type ClientSnapshot = SavedHistorySnapshot & {
  workspace: WorkspaceStateMessage | null;
  attachments: AttachmentStateMessage | null;
  sessions: SessionStateMessage | null;
  changeReview: ChangeReviewStateMessage | null;
  changeReviewOpen: boolean;
  changeReviewPage: number;
  text: string;
  synchronizing: boolean;
  submitting: boolean;
  stopRequested: boolean;
  history: AttachmentHistoryEntry[];
  historyOpen: boolean;
  historyPage: number | null;
  preview: Preview | null;
  error: string | null;
};
