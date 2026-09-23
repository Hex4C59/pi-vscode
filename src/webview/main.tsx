import { createWebviewBridge } from "./bridge.js";
import { mountApp } from "./mount.js";
import type { WebviewMessage } from "../extension/contracts/webviewProtocol.js";
import "./styles.css";

declare function acquireVsCodeApi(): { postMessage(message: WebviewMessage): void };
const container = document.getElementById("root");
if (container) {
  try {
    const dispose = mountApp(container, createWebviewBridge(acquireVsCodeApi()));
    window.addEventListener("pagehide", dispose, { once: true });
  } catch {
    container.textContent = "Could not connect to the extension host. Reopen the Pi view to retry.";
    container.setAttribute("role", "alert");
  }
}
