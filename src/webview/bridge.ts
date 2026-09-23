
/** A private presentation transport. It exposes no host capabilities beyond named intents. */
import type { WebviewBridge } from "./types.js";
export type { WebviewBridge } from "./types.js";

export function createWebviewBridge(api: Pick<WebviewBridge, "postMessage">, target: Window = window): WebviewBridge {
  return {
    postMessage: message => api.postMessage(message),
    subscribe(listener) {
      const receive = (event: MessageEvent<unknown>) => listener(event.data);
      target.addEventListener("message", receive);
      return () => target.removeEventListener("message", receive);
    },
  };
}
