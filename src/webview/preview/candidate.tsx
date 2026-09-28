import { mountChat, type UiLanguageState } from "../chat/index.js";
import type { WebviewBridge } from "../index.js";

/** Preview facade keeps simulation context outside the production entry. */
export function mountCandidate(container: HTMLElement, bridge: WebviewBridge, language: UiLanguageState): () => void {
  return mountChat(container, bridge, { language, preview: true });
}
