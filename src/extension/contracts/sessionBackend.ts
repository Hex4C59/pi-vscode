import type { ChatLine, SavedSessionSearch } from "./webviewProtocol.js";
/** Host/adapter-only saved-session API. Paths never cross the Webview boundary. */
export type SavedSession = { id: string; path: string; name: string | null; firstMessage: string; modified: string };
export type SessionBackendFailure = { ok: false; code: "unavailable" | "cancelled" | "stale" | "wrong-project" };
export type SessionBackendListFailure = SessionBackendFailure | { ok: false; code: "catalogue-too-large" };
export type SavedHistoryPage = { messages: ChatLine[]; page: number; total: number };
export type SavedHistoryPreview = { text: string; offset: number; nextOffset: number; done: boolean; totalChars: number };
export interface SessionBackend {
  list(cwd: string, page: number, signal: AbortSignal, search?: SavedSessionSearch): Promise<{ ok: true; entries: SavedSession[]; page: number; total: number } | SessionBackendListFailure>;
  inspect(cwd: string, id: string, signal: AbortSignal): Promise<{ ok: true; session: SavedSession; history: SavedHistoryPage; anchor: string | null } | SessionBackendFailure>;
  history(cwd: string, id: string, anchor: string, page: number, signal: AbortSignal): Promise<{ ok: true; history: SavedHistoryPage } | SessionBackendFailure>;
  preview(cwd: string, id: string, anchor: string, index: number, offset: number, signal: AbortSignal): Promise<{ ok: true; preview: SavedHistoryPreview } | SessionBackendFailure>;
}
export const unavailableSessionBackend: SessionBackend = {
  async list() { return { ok: false, code: "unavailable" }; },
  async inspect() { return { ok: false, code: "unavailable" }; },
  async history() { return { ok: false, code: "unavailable" }; },
  async preview() { return { ok: false, code: "unavailable" }; },
};
