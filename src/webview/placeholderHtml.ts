/** Pre-runtime workspace UI. Workspace text is received as data, never HTML. */
export function getPlaceholderHtml(nonce: string): string {
  const csp = ["default-src 'none'", `script-src 'nonce-${nonce}'`, "style-src 'unsafe-inline'"].join("; ");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); color: var(--vscode-foreground); background: var(--vscode-sideBar-background); margin: 0; padding: 16px; line-height: 1.5; }
    h1 { font-size: 1.1em; } p { margin: 0 0 12px; } #folder-path { overflow-wrap: anywhere; white-space: pre-wrap; }
    button { display: block; margin: 8px 0; padding: 6px 10px; color: var(--vscode-button-foreground); background: var(--vscode-button-background); border: 1px solid var(--vscode-contrastBorder, transparent); cursor: pointer; }
    button:focus-visible { outline: 2px solid var(--vscode-focusBorder); outline-offset: 2px; }
    button:disabled { opacity: .5; cursor: default; } [hidden] { display: none !important; }
    #error { color: var(--vscode-errorForeground); }
  </style>
</head>
<body>
  <h1>pi — workspace setup</h1>
  <p id="folder-name"></p><p id="folder-path"></p>
  <p id="workspace-status" role="status">Reading workspace status…</p>
  <p id="runtime-status">Runtime not started. Chat is not available in this slice.</p>
  <p id="error" role="alert"></p>
  <button id="open-folder" type="button" hidden>Open folder</button>
  <button id="manage-trust" type="button" hidden>Manage workspace trust</button>
  <section id="resources" aria-label="Project resource choice" hidden>
    <p>Allowing project resources at future startup may execute project extensions or trigger project package behavior.</p>
    <p>Continuing without project resources may still read AGENTS.md context and user/global resources. Neither choice is a sandbox or tool authorization.</p>
    <p id="choice-status" role="status">Not chosen yet.</p>
    <button id="allow" type="button" aria-pressed="false">Allow project resources</button>
    <button id="decline" type="button" aria-pressed="false">Continue without project resources</button>
    <p>You can change this memory-only choice before runtime startup. Changing workspace or reloading the extension host clears it.</p>
  </section>
  <p id="connection-status" role="status">Checking connection…</p>
  <script nonce="${nonce}">
    (() => {
      const vscode = acquireVsCodeApi();
      const element = (id) => document.getElementById(id);
      let generation;
      const send = (type, extra = {}) => {
        if (generation !== undefined) vscode.postMessage({ version: 1, type, generation, ...extra });
      };
      element("open-folder").addEventListener("click", () => send("openFolder"));
      element("manage-trust").addEventListener("click", () => send("manageTrust"));
      element("allow").addEventListener("click", () => send("chooseResources", { choice: "allow" }));
      element("decline").addEventListener("click", () => send("chooseResources", { choice: "decline" }));
      const labels = {
        "no-folder": "Open a local folder to choose project resources.",
        "multi-root": "Multiple workspace folders are not supported. Open a single local folder.",
        "remote": "Remote extension hosts are not supported, including remote file workspaces.",
        "non-file": "Non-file workspaces are not supported. Open a local folder.",
        "untrusted": "VS Code has not trusted this workspace. Manage workspace trust before choosing pi resources.",
        "eligible": "Trusted local workspace. Explicitly choose whether future startup may load pi project resources."
      };
      window.addEventListener("message", (event) => {
        const message = event.data;
        if (!message || typeof message !== "object" || Array.isArray(message) || message.version !== 1) return;
        if (message.type === "pong") { element("connection-status").textContent = "Connected to extension host (runtime not started)"; return; }
        if (message.type !== "workspaceState" || !Number.isSafeInteger(message.generation) || message.generation < 0 ||
            !Object.hasOwn(labels, message.status) || (generation !== undefined && message.generation < generation)) return;
        generation = message.generation;
        element("folder-name").textContent = message.folder?.name ?? "No single workspace folder";
        element("folder-path").textContent = message.folder?.path ?? "";
        element("workspace-status").textContent = labels[message.status] + (message.busy ? " Native action in progress…" : "");
        element("error").textContent = message.error ?? "";
        element("open-folder").hidden = message.status !== "no-folder";
        element("manage-trust").hidden = message.status !== "untrusted";
        element("resources").hidden = message.status !== "eligible";
        for (const id of ["open-folder", "manage-trust", "allow", "decline"]) element(id).disabled = message.busy;
        element("choice-status").textContent = message.choice === "allow" ? "Choice recorded: allow project resources. Runtime not started."
          : message.choice === "decline" ? "Choice recorded: continue without project resources. Runtime not started." : "Not chosen yet. Runtime not started.";
        element("allow").setAttribute("aria-pressed", String(message.choice === "allow"));
        element("decline").setAttribute("aria-pressed", String(message.choice === "decline"));
      });
      vscode.postMessage({ version: 1, type: "ping" });
      vscode.postMessage({ version: 1, type: "getWorkspaceState" });
    })();
  </script>
</body>
</html>`;
}
