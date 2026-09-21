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
    #error, #chat-error { color: var(--vscode-errorForeground); }
    #chat { margin-top: 16px; border-top: 1px solid var(--vscode-panel-border, #444); padding-top: 12px; }
    #messages { max-height: 240px; overflow-y: auto; margin: 8px 0; }
    .msg { margin: 6px 0; white-space: pre-wrap; overflow-wrap: anywhere; }
    .msg-user { opacity: .9; } .msg-assistant { }
    #chat-input { width: 100%; min-height: 64px; box-sizing: border-box; font: inherit; color: inherit; background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border, transparent); padding: 6px; }
  </style>
</head>
<body>
  <h1>pi — workspace setup</h1>
  <p id="folder-name"></p><p id="folder-path"></p>
  <p id="workspace-status" role="status">Reading workspace status…</p>
  <p id="runtime-status">Runtime not started.</p>
  <p id="error" role="alert"></p>
  <button id="open-folder" type="button" hidden>Open folder</button>
  <button id="manage-trust" type="button" hidden>Manage workspace trust</button>
  <section id="resources" aria-label="Project resource choice" hidden>
    <p>Allowing project resources at future startup may execute project extensions or trigger project package behavior.</p>
    <p>Continuing without project resources may still read AGENTS.md context and user/global resources. Neither choice is a sandbox or tool authorization.</p>
    <p id="choice-status" role="status">Not chosen yet.</p>
    <button id="allow" type="button" aria-pressed="false">Allow project resources</button>
    <button id="decline" type="button" aria-pressed="false">Continue without project resources</button>
    <p>After you choose, the extension host starts pi in RPC mode with your selection. Changing choice restarts runtime. Changing workspace or reloading the extension host clears the choice and stops runtime.</p>
  </section>
  <section id="chat" aria-label="Chat" hidden>
    <p><strong>No-tools mode.</strong> This is not a full agent and is not a sandbox. Tools are disabled for this runtime.</p>
    <p id="chat-model" role="status"></p>
    <div id="messages" role="log" aria-live="polite" aria-relevant="additions text"></div>
    <p id="chat-error" role="alert"></p>
    <label for="chat-input">Message</label>
    <textarea id="chat-input" rows="3"></textarea>
    <button id="send-chat" type="button">Send</button>
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
      element("send-chat").addEventListener("click", () => {
        const input = element("chat-input");
        const text = (input.value ?? "").trim();
        if (!text) return;
        send("sendChat", { text });
        input.value = "";
      });
      const renderMessages = (messages) => {
        const container = element("messages");
        container.replaceChildren();
        for (const entry of messages ?? []) {
          if (!entry || (entry.role !== "user" && entry.role !== "assistant") || typeof entry.text !== "string") continue;
          const row = document.createElement("p");
          row.className = "msg " + (entry.role === "user" ? "msg-user" : "msg-assistant");
          row.textContent = (entry.role === "user" ? "You: " : "pi: ") + entry.text;
          container.appendChild(row);
        }
      };
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
        if (message.type === "pong") { element("connection-status").textContent = "Connected to extension host."; return; }
        if (message.type !== "workspaceState" || !Number.isSafeInteger(message.generation) || message.generation < 0 ||
            !Object.hasOwn(labels, message.status) || (generation !== undefined && message.generation < generation)) return;
        generation = message.generation;
        const runtimeLabels = {
          "not-started": "Runtime not started.",
          "starting": "Starting pi runtime (RPC)…",
          "ready": "Runtime connected (RPC). You can send a message below.",
          "stopping": "Stopping pi runtime…",
          "error": "Runtime failed to start."
        };
        element("folder-name").textContent = message.folder?.name ?? "No single workspace folder";
        element("folder-path").textContent = message.folder?.path ?? "";
        element("workspace-status").textContent = labels[message.status] + (message.busy ? " Native action in progress…" : "");
        element("runtime-status").textContent = (runtimeLabels[message.runtime] ?? runtimeLabels["not-started"])
          + (message.runtime === "error" && message.runtimeDetail ? " " + message.runtimeDetail : "");
        element("error").textContent = message.error ?? "";
        element("open-folder").hidden = message.status !== "no-folder";
        element("manage-trust").hidden = message.status !== "untrusted";
        element("resources").hidden = message.status !== "eligible";
        const chatReady = message.runtime === "ready" && !message.busy;
        element("chat").hidden = !chatReady;
        if (chatReady) renderMessages(message.messages);
        element("chat-model").textContent = message.chatModel ? "Model: " + message.chatModel : "Model not configured. Set pi startup default with /model and Ctrl+S.";
        element("chat-error").textContent = message.chatError ?? "";
        const chatDisabled = !chatReady || message.chatBusy || message.busy;
        element("chat-input").disabled = chatDisabled;
        element("send-chat").disabled = chatDisabled;
        element("send-chat").textContent = message.chatBusy ? "Sending…" : "Send";
        for (const id of ["open-folder", "manage-trust", "allow", "decline"]) element(id).disabled = message.busy || message.runtime === "starting" || message.runtime === "stopping";
        const choiceBase = message.choice === "allow" ? "Choice recorded: allow project resources."
          : message.choice === "decline" ? "Choice recorded: continue without project resources." : "Not chosen yet.";
        element("choice-status").textContent = choiceBase;
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
