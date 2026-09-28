import { mountChat } from "./chat/index.js";
import type { WebviewBridge } from "./bridge.js";

/** Shipped mounting seam; the preview shares mountChat with a synthetic bridge. */
export function mountApp(container: HTMLElement, bridge: WebviewBridge): () => void {
  return mountChat(container, bridge);
}
