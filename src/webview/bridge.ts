import type { WebviewMessage } from "../extension/contracts/webviewProtocol.js";

/** A private presentation transport. It exposes no host capabilities beyond named intents. */
export interface WebviewBridge {
  postMessage(message: WebviewMessage): void;
  subscribe(listener: (message: unknown) => void): () => void;
}

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
