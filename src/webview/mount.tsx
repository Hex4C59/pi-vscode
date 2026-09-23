import { createRoot } from "react-dom/client";
import type { WebviewBridge } from "./bridge.js";
import { WebviewClient } from "./client.js";
import { App } from "./app.js";

/** Shared application entry for the packaged Webview and the isolated preview. */
export function mountApp(container: HTMLElement, bridge: WebviewBridge): () => void {
  const client = new WebviewClient(bridge);
  const root = createRoot(container);
  client.start();
  root.render(<App client={client} />);
  let disposed = false;
  return () => { if (!disposed) { disposed = true; client.dispose(); root.unmount(); } };
}
