import { createRoot } from "react-dom/client";
import type { WebviewBridge } from "../bridge.js";
import { WebviewClient } from "../webview-client.js";
import { BaselineApp } from "./baseline-app.js";

/** Test-only baseline composition, retained to protect shared control contracts. */
export function mountBaselineApp(container: HTMLElement, bridge: WebviewBridge): () => void {
  const client = new WebviewClient(bridge);
  const root = createRoot(container);
  client.start();
  root.render(<BaselineApp client={client} />);
  let disposed = false;
  return () => { if (!disposed) { disposed = true; client.dispose(); root.unmount(); } };
}
