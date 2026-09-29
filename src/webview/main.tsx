import { createWebviewBridge } from "./bridge.js";
import { mountApp } from "./mount.js";
import { mountSettings } from "./settings/index.js";
import type { WebviewMessage } from "../extension/contracts/index.js";
import "./styles.css";

declare function acquireVsCodeApi(): { postMessage(message: WebviewMessage): void };
const container = document.getElementById("root");
if (container) {
  try {
    const mount = document.body.dataset.piSurface === "settings" ? mountSettings : mountApp;
    const dispose = mount(container, createWebviewBridge(acquireVsCodeApi()));
    window.addEventListener("pagehide", dispose, { once: true });
  } catch {
    container.textContent = "Could not connect to the extension host. Reopen the Pi view to retry.";
    container.setAttribute("role", "alert");
  }
}
