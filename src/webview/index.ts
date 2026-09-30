/** Presentation-only entry for the isolated preview. */
export { createWebviewBridge } from "./client/bridge.js";
export { parseHostMessage } from "./client/parse-host-message.js";
export type { WebviewBridge, ClientSnapshot, Intent, Preview, SavedHistoryPreview, SavedHistorySnapshot } from "./types.js";

/** Existing browser state/eligibility reused by the candidate presentation. */
export { WebviewClient } from "./client/webview-client.js";
export { availability, SESSION_PAGE_SIZE } from "./client/client-state.js";
export { SAVED_HISTORY_PAGE_SIZE } from "./client/saved-history-client.js";
