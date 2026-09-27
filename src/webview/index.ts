/** Presentation-only entry for the isolated preview. */
export { mountApp } from "./mount.js";
export { createWebviewBridge } from "./bridge.js";
export type { WebviewBridge, ClientSnapshot, Intent, Preview, SavedHistoryPreview, SavedHistorySnapshot } from "./types.js";

/** Existing browser state/eligibility reused by the candidate presentation. */
export { WebviewClient } from "./webview-client.js";
export { availability } from "./client-state.js";
