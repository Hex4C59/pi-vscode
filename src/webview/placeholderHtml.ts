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
    * { box-sizing: border-box; }
    body {
      font-family: var(--vscode-font-family); font-size: var(--vscode-font-size);
      color: var(--vscode-foreground); background: var(--vscode-sideBar-background);
      margin: 0; padding: 0; line-height: 1.5;
      display: flex; flex-direction: column; height: 100vh; overflow: hidden;
    }
    button { font: inherit; cursor: pointer; border: none; background: none; color: inherit; padding: 0; }
    button:focus-visible, input:focus-visible, textarea:focus-visible { outline: 1px solid var(--vscode-focusBorder); outline-offset: 1px; }
    button:disabled { opacity: .45; cursor: default; }
    [hidden] { display: none !important; }
    .muted { color: var(--vscode-descriptionForeground); }

    /* Header */
    #app-header {
      display: flex; align-items: center; gap: 8px; padding: 10px 14px 8px;
      border-bottom: 1px solid var(--vscode-panel-border, transparent); flex: none;
    }
    #app-title { font-size: 12px; font-weight: 600; letter-spacing: .04em; }
    #runtime-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--vscode-descriptionForeground); flex: none; }
    #runtime-dot[data-state="ready"] { background: var(--vscode-testing-iconPassed, #3fb950); }
    #runtime-dot[data-state="error"] { background: var(--vscode-errorForeground); }
    #runtime-dot[data-state="starting"], #runtime-dot[data-state="stopping"] { background: var(--vscode-editorWarning-foreground, #e5c07b); animation: pulse 1.2s ease-in-out infinite; }
    @keyframes pulse { 50% { opacity: .35; } }
    #runtime-hint { font-size: 11px; margin-left: auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* Scrollable main region */
    #main { flex: 1 1 auto; overflow-y: auto; padding: 14px; }

    /* Setup empty states */
    .card {
      border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border, transparent));
      border-radius: 8px; padding: 16px; margin: 8px 0 16px;
      background: var(--vscode-editor-background);
    }
    .card h2 { margin: 0 0 6px; font-size: 13px; font-weight: 600; }
    .card p { margin: 0 0 10px; font-size: 12px; color: var(--vscode-descriptionForeground); }
    .btn-primary {
      display: inline-block; padding: 5px 12px; border-radius: 6px; font-size: 12px;
      color: var(--vscode-button-foreground); background: var(--vscode-button-background);
    }
    .btn-primary:hover:not(:disabled) { background: var(--vscode-button-hoverBackground); }
    .btn-secondary {
      display: inline-block; padding: 5px 12px; border-radius: 6px; font-size: 12px; margin-right: 6px;
      color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
      background: var(--vscode-button-secondaryBackground, transparent);
      border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border, transparent));
    }
    .btn-secondary[aria-pressed="true"] { border-color: var(--vscode-focusBorder); }
    .btn-secondary:hover:not(:disabled) { background: var(--vscode-list-hoverBackground); }
    .banner {
      border-radius: 6px; padding: 8px 10px; margin: 0 0 10px; font-size: 12px;
      color: var(--vscode-errorForeground); background: var(--vscode-inputValidation-errorBackground, transparent);
      border: 1px solid var(--vscode-inputValidation-errorBorder, transparent);
    }
    #error:empty, #chat-error:empty, #model-error:empty { display: none; }

    /* Chat messages */
    #messages { display: flex; flex-direction: column; gap: 10px; }
    .msg { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 13px; }
    .msg-user {
      align-self: flex-end; max-width: 85%; padding: 6px 12px; border-radius: 12px 12px 4px 12px;
      background: var(--vscode-editor-inactiveSelectionBackground, var(--vscode-list-hoverBackground));
    }
    .msg-assistant { align-self: stretch; }
    .msg-assistant::before {
      content: "pi"; display: block; font-size: 10px; font-weight: 600; letter-spacing: .06em;
      color: var(--vscode-descriptionForeground); margin-bottom: 2px;
    }

    .activity { white-space: normal; border: 1px solid var(--vscode-panel-border, #555); border-radius: 6px; margin: 6px 0; padding: 6px 8px; }
    .activity summary { cursor: pointer; font-size: 12px; overflow-wrap: anywhere; }
    .activity pre, .approval-input, .grant-scope { white-space: pre-wrap; overflow-wrap: anywhere; font: inherit; font-size: 12px; max-height: 320px; overflow-y: auto; }
    .activity-label, .truncation { font-size: 11px; color: var(--vscode-descriptionForeground); }
    .approval { border-color: var(--vscode-editorWarning-foreground, #e5c07b); }
    .approval-actions { display: flex; flex-wrap: wrap; gap: 6px; }
    #execution-status, #controlled-disclosure { font-size: 11px; margin: 4px 0 8px; }
    #stop-chat { margin-left: auto; padding: 2px 8px; border-radius: 6px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); }

    /* Composer */
    #composer-wrap { flex: none; padding: 8px 14px 12px; position: relative; }
    #composer {
      border: 1px solid var(--vscode-input-border, var(--vscode-widget-border, transparent));
      border-radius: 10px; background: var(--vscode-input-background);
      padding: 8px 10px 6px; display: flex; flex-direction: column; gap: 4px;
    }
    #composer:focus-within { border-color: var(--vscode-focusBorder); }
    #chat-input {
      width: 100%; min-height: 20px; max-height: 140px; resize: none; overflow-y: auto;
      font: inherit; font-size: 13px; color: var(--vscode-input-foreground);
      background: transparent; border: none; outline: none; padding: 2px 0;
    }
    #composer-footer { display: flex; align-items: center; gap: 4px; }
    .chip {
      font-size: 11px; padding: 2px 8px; border-radius: 10px; max-width: 45%;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      color: var(--vscode-descriptionForeground);
    }
    .chip:hover:not(:disabled) { background: var(--vscode-list-hoverBackground); color: var(--vscode-foreground); }
    #send-chat {
      margin-left: auto; width: 24px; height: 24px; border-radius: 50%; flex: none;
      display: flex; align-items: center; justify-content: center;
      color: var(--vscode-button-foreground); background: var(--vscode-button-background);
    }
    #send-chat:hover:not(:disabled) { background: var(--vscode-button-hoverBackground); }
    #send-chat svg { width: 12px; height: 12px; fill: currentColor; }

    /* Popovers (anchored above composer footer) */
    .popover {
      position: absolute; left: 10px; bottom: calc(100% + 6px); z-index: 2;
      min-width: 220px; max-width: calc(100% - 20px); padding: 8px;
      background: var(--vscode-editorWidget-background, var(--vscode-editor-background));
      border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border, transparent));
      border-radius: 8px; box-shadow: 0 4px 14px rgba(0,0,0,.3);
    }
    .popover .popover-title { font-size: 11px; font-weight: 600; color: var(--vscode-descriptionForeground); margin: 2px 2px 6px; }
    .menu-item {
      display: flex; align-items: center; width: 100%; padding: 5px 8px; border-radius: 5px;
      font-size: 12px; text-align: left; gap: 6px;
    }
    .menu-item:hover:not(:disabled) { background: var(--vscode-list-hoverBackground); }
    .menu-item[aria-checked="true"]::after { content: "\\2713"; margin-left: auto; color: var(--vscode-focusBorder); }
    .menu-item .sub { color: var(--vscode-descriptionForeground); font-size: 11px; margin-left: auto; }
    .menu-item[aria-checked="true"] .sub { margin-left: 0; }
    #thinking-level-label { font-size: 11px; margin: 4px 2px 0; }
    #thinking-slider {
      -webkit-appearance: none; appearance: none; width: 100%; height: 32px; margin: 4px 0 2px;
      background: transparent; --fill: 0%;
    }
    #thinking-slider:focus, #thinking-slider:focus-visible { outline: none; box-shadow: none; }
    #thinking-slider[data-keyboard-focus="true"]:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 3px #168BFF66; }
    #thinking-slider[data-keyboard-focus="true"]:focus-visible::-moz-range-thumb { box-shadow: 0 0 0 3px #168BFF66; }
    #thinking-slider::-webkit-slider-runnable-track {
      height: 14px; border-radius: 7px;
      background: linear-gradient(to right,
        #168BFF 0 var(--fill),
        var(--vscode-input-border, var(--vscode-panel-border, #555)) var(--fill) 100%);
    }
    #thinking-slider::-webkit-slider-thumb {
      -webkit-appearance: none; appearance: none; width: 22px; height: 22px; border-radius: 50%;
      margin-top: -4px; border: 2px solid var(--vscode-editorWidget-background, var(--vscode-editor-background));
      background: #168BFF;
    }
    #thinking-slider::-moz-range-track { height: 14px; border-radius: 7px; background: var(--vscode-input-border, var(--vscode-panel-border, #555)); }
    #thinking-slider::-moz-range-progress { height: 14px; border-radius: 7px; background: #168BFF; }
    #thinking-slider::-moz-range-thumb { box-sizing: border-box; width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--vscode-editorWidget-background, var(--vscode-editor-background)); background: #168BFF; }
    #model-current .chevron { margin-left: auto; color: var(--vscode-descriptionForeground); }
    #model-current[aria-expanded="true"] .chevron { transform: rotate(180deg); }
    #model-current .chevron svg { display: block; width: 10px; height: 10px; fill: currentColor; }
  </style>
</head>
<body>
  <header id="app-header">
    <span id="runtime-dot" data-state="not-started" aria-hidden="true"></span>
    <span id="app-title">pi</span>
    <span id="runtime-hint" class="muted" role="status">Connecting…</span>
  </header>

  <main id="main">
    <div id="error" class="banner" role="alert"></div>

    <div id="setup-no-folder" class="card" hidden>
      <h2>No workspace folder</h2>
      <p>Open a local folder to start a pi session.</p>
      <button id="open-folder" class="btn-primary" type="button">Open folder</button>
    </div>

    <div id="setup-blocked" class="card" hidden>
      <h2 id="blocked-title"></h2>
      <p id="blocked-detail"></p>
    </div>

    <div id="setup-trust" class="card" hidden>
      <h2>Workspace not trusted</h2>
      <p>Grant workspace trust in VS Code before choosing pi resources.</p>
      <button id="manage-trust" class="btn-primary" type="button">Manage workspace trust</button>
    </div>

    <div id="setup-resources" class="card" hidden>
      <h2 id="folder-name-heading">Project resources</h2>
      <p id="folder-path" class="muted" style="overflow-wrap: anywhere;"></p>
      <p>Choose project resource consent. Controlled execution loads only the bundled approval extension; third-party extensions are disabled regardless of this choice. This is not a sandbox or tool authorization.</p>
      <div>
        <button id="allow" class="btn-secondary" type="button" aria-pressed="false">Allow resources</button>
        <button id="decline" class="btn-secondary" type="button" aria-pressed="false">Continue without</button>
      </div>
      <p id="choice-status" class="muted" role="status" style="margin-top: 8px;">Not chosen yet.</p>
    </div>

    <div id="chat" hidden>
      <div id="messages" role="log" aria-live="polite" aria-relevant="additions text"></div>
      <div id="orphan-activities"></div>
      <div id="approvals" aria-label="Tool approvals"></div>
      <details id="session-grants"><summary id="grants-summary">Session grants (0)</summary><div id="grants"></div></details>
      <div id="chat-error" class="banner" role="alert"></div>
    </div>
  </main>

  <div id="composer-wrap" hidden>
    <div id="model-popover" class="popover" role="dialog" aria-label="Model and thinking level" hidden>
      <p class="popover-title">Model</p>
      <button id="model-current" class="menu-item" type="button" aria-expanded="false" aria-controls="model-list">
        <span id="model-current-label">Model</span>
        <span class="chevron" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M8 10.5 3.5 6l1-1L8 8.5 11.5 5l1 1z"/></svg></span>
      </button>
      <div id="model-list" role="menu" hidden></div>
      <p class="popover-title" id="thinking-heading">Thinking level</p>
      <input id="thinking-slider" type="range" min="0" max="0" step="1" value="0" aria-labelledby="thinking-heading" />
      <p id="thinking-level-label" class="muted" aria-live="polite"></p>
      <div id="model-error" class="banner" role="alert"></div>
    </div>
    <details id="controlled-disclosure"><summary>Controlled execution · Ask before actions</summary><p>Only the bundled approval extension is loaded. Third-party extensions are disabled. Tools run with your user permissions, not in a sandbox. Stop does not roll back side effects. Tool output may contain sensitive information.</p></details>
    <p id="execution-status" role="status"></p>
    <p id="pending-settings" class="muted" role="status" hidden></p>
    <div id="model-status-error" class="banner" role="alert" hidden></div>
    <div id="composer">
      <textarea id="chat-input" rows="1" placeholder="Message pi…" aria-label="Message"></textarea>
      <div id="composer-footer">
        <button id="model-effort-trigger" class="chip" type="button" aria-expanded="false" aria-controls="model-popover">Model</button>
        <button id="stop-chat" type="button" aria-label="Stop current task" hidden>Stop</button>
        <button id="send-chat" type="button" aria-label="Send">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5 3.5 6l1 1L7 4.6V14h2V4.6L11.5 7l1-1z"/></svg>
        </button>
      </div>
    </div>
  </div>

  <script nonce="${nonce}">
    (() => {
      const vscode = acquireVsCodeApi();
      const element = (id) => document.getElementById(id);
      let generation;
      let popoverOpen = false;
      let modelListOpen = false;
      let thinkingLevels = [];
      let currentModels = [];
      let currentModelLabel = null;

      const send = (type, extra = {}) => {
        if (generation !== undefined) vscode.postMessage({ version: 1, type, generation, ...extra });
      };

      const setModelListOpen = (open) => {
        modelListOpen = open;
        element("model-list").hidden = !open;
        element("model-current").setAttribute("aria-expanded", String(open));
      };
      const setPopoverOpen = (open) => {
        popoverOpen = open;
        element("model-popover").hidden = !open;
        element("model-effort-trigger").setAttribute("aria-expanded", String(open));
        if (!open) setModelListOpen(false);
      };
      element("model-current").addEventListener("click", () => setModelListOpen(!modelListOpen));
      window.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && popoverOpen) {
          event.preventDefault();
          setPopoverOpen(false);
        }
      });
      element("model-effort-trigger").addEventListener("click", () => setPopoverOpen(!popoverOpen));

      const updateSliderFill = () => {
        const slider = element("thinking-slider");
        const max = Number(slider.max) || 0;
        const percent = max > 0 ? (Number(slider.value) / max) * 100 : 0;
        slider.style.setProperty("--fill", percent + "%");
      };
      window.addEventListener("keydown", () => {
        element("thinking-slider").setAttribute("data-keyboard-focus", "true");
      });
      element("thinking-slider").addEventListener("pointerdown", () => {
        element("thinking-slider").setAttribute("data-keyboard-focus", "false");
      });
      element("thinking-slider").addEventListener("input", updateSliderFill);
      element("thinking-slider").addEventListener("change", (event) => {
        const level = thinkingLevels[Number(event.target.value)];
        if (level) send("setThinkingLevel", { level });
      });

      let modelCatalogKey;
      const renderModelList = (models) => {
        const nextModels = Array.isArray(models) ? models : [];
        const key = JSON.stringify(nextModels);
        if (key === modelCatalogKey) {
          for (const [index, item] of Array.from(element("model-list").children).entries()) {
            item.setAttribute("aria-checked", String((currentModels[index].label ?? currentModels[index].modelId) === currentModelLabel));
          }
          return;
        }
        modelCatalogKey = key;
        currentModels = nextModels;
        const container = element("model-list");
        container.replaceChildren();
        for (const entry of currentModels) {
          if (!entry || typeof entry.provider !== "string" || typeof entry.modelId !== "string") continue;
          const label = typeof entry.label === "string" ? entry.label : entry.modelId;
          const item = document.createElement("button");
          item.type = "button";
          item.className = "menu-item";
          item.setAttribute("role", "menuitemradio");
          item.setAttribute("aria-checked", String(label === currentModelLabel));
          const name = document.createElement("span");
          name.textContent = label;
          const sub = document.createElement("span");
          sub.className = "sub";
          sub.textContent = entry.provider;
          item.appendChild(name);
          item.appendChild(sub);
          item.addEventListener("click", () => {
            send("setChatModel", { provider: entry.provider, modelId: entry.modelId });
            setModelListOpen(false);
            setPopoverOpen(false);
          });
          container.appendChild(item);
        }
      };

      let sliderStateKey;
      const syncThinkingSlider = (levels, current) => {
        const key = JSON.stringify([levels, current]);
        if (sliderStateKey === key) return;
        sliderStateKey = key;
        thinkingLevels = Array.isArray(levels) ? levels.filter((level) => typeof level === "string") : [];
        const slider = element("thinking-slider");
        slider.min = "0";
        slider.max = String(Math.max(thinkingLevels.length - 1, 0));
        slider.step = "1";
        const index = Math.max(0, thinkingLevels.indexOf(current));
        slider.value = String(thinkingLevels.length ? index : 0);
        const label = thinkingLevels[index] ?? current ?? "";
        element("thinking-level-label").textContent = label ? "Current: " + label : "";
        slider.disabled = thinkingLevels.length <= 1;
        updateSliderFill();
      };

      const autoGrow = () => {
        const input = element("chat-input");
        input.style.height = "auto";
        input.style.height = Math.min(input.scrollHeight, 140) + "px";
      };
      const submitChat = () => {
        const input = element("chat-input");
        if (element("send-chat").disabled) return;
        const text = (input.value ?? "").trim();
        if (!text) return;
        send("sendChat", { text });
        input.value = "";
        autoGrow();
      };
      element("chat-input").addEventListener("input", autoGrow);
      element("chat-input").addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
          event.preventDefault();
          submitChat();
        }
      });
      element("send-chat").addEventListener("click", submitChat);

      element("open-folder").addEventListener("click", () => send("openFolder"));
      element("manage-trust").addEventListener("click", () => send("manageTrust"));
      element("allow").addEventListener("click", () => send("chooseResources", { choice: "allow" }));
      element("decline").addEventListener("click", () => send("chooseResources", { choice: "decline" }));

      const rows = new Map();
      const activities = new Map();
      const approvalRows = new Map();
      const grantRows = new Map();
      let stopRequested = false;
      const text = (node, value) => { if (node.textContent !== value) node.textContent = value; };
      const node = (tag, parent, className = "") => {
        const child = document.createElement(tag); child.className = className;
        parent.appendChild(child); return child;
      };
      const prune = (cache, ids) => {
        for (const [id, view] of cache) if (!ids.has(id)) { view.root.remove(); cache.delete(id); }
      };
      const renderMessages = (messages, items = []) => {
        const ids = new Set();
        for (const [index, entry] of (messages ?? []).entries()) {
          if (!entry || (entry.role !== "user" && entry.role !== "assistant") || typeof entry.text !== "string") continue;
          const id = entry.id ?? "line-" + index; ids.add(id);
          let view = rows.get(id);
          if (!view) {
            const root = node("div", element("messages"), "msg msg-" + entry.role);
            const steps = node("div", root); const body = node("div", root);
            view = { root, body, steps }; rows.set(id, view);
          }
          text(view.body, entry.text);
        }
        prune(rows, ids);
        const activityIds = new Set();
        for (const item of items) {
          activityIds.add(item.id);
          const parent = rows.get(item.messageId)?.steps ?? element("orphan-activities");
          let view = activities.get(item.id);
          if (!view) {
            const root = node("details", parent, "activity");
            view = { root, parent, summary: node("summary", root), inputLabel: node("div", root, "activity-label"), input: node("pre", root), outputLabel: node("div", root, "activity-label"), output: node("pre", root), notice: node("div", root, "truncation"), started: Date.now(), ended: null };
            activities.set(item.id, view);
          }
          if (view.parent !== parent) { parent.appendChild(view.root); view.parent = parent; }
          const terminal = ["complete", "failed", "interrupted"].includes(item.status);
          if (terminal && view.ended === null) view.ended = Date.now();
          const elapsed = Math.max(0, Math.floor(((view.ended ?? Date.now()) - view.started) / 1000));
          const status = item.status === "preparing" ? "Preparing / checking approval" : item.status;
          text(view.summary, (item.kind === "thinking" ? "Thinking" : item.tool ?? "Tool") + " · " + status + (item.kind === "tool" ? " · ~" + elapsed + "s observed" : ""));
          text(view.inputLabel, "Parameters / command");
          view.inputLabel.hidden = view.input.hidden = item.kind !== "tool";
          text(view.input, item.input ?? "Not provided");
          text(view.outputLabel, item.kind === "thinking" ? "Upstream thinking" : "Output");
          text(view.output, item.text);
          text(view.notice, item.truncated ? "Truncated — only the bounded projection is shown." : "");
          view.notice.hidden = !item.truncated;
        }
        prune(activities, activityIds);
      };
      const renderApprovals = (cards = [], grants = [], stopping = false) => {
        const ids = new Set();
        for (const card of cards) {
          ids.add(card.id);
          let view = approvalRows.get(card.id);
          if (!view) {
            const root = node("section", element("approvals"), "card approval");
            view = { root, title: node("h2", root), input: node("pre", root, "approval-input"), scope: node("pre", root, "grant-scope"), buttons: [], sent: false };
            const actions = node("div", root, "approval-actions");
            for (const [decision, label] of [["once", "Allow once"], ["session", "Allow this session"], ["deny", "Deny"]]) {
              const button = node("button", actions, "btn-secondary"); button.type = "button"; text(button, label);
              button.addEventListener("click", () => {
                if (button.disabled || view.sent) return;
                view.sent = true; for (const action of view.buttons) action.button.disabled = true;
                send("decideApproval", { id: card.id, decision });
              });
              view.buttons.push({ button, decision });
            }
            approvalRows.set(card.id, view);
          }
          text(view.title, "Approval required · " + card.tool);
          text(view.input, card.input);
          text(view.scope, card.scope === null ? "Session authorization unavailable: no reliably matchable scope. Review full input before allowing once." : "Exact session scope (no directory or command-prefix grant): " + card.scope);
          for (const action of view.buttons) action.button.disabled = stopping || view.sent || Date.now() >= card.expiresAt || (action.decision === "session" && card.scope === null);
        }
        prune(approvalRows, ids);
        const grantIds = new Set();
        for (const grant of grants) {
          grantIds.add(grant.id);
          let view = grantRows.get(grant.id);
          if (!view) {
            const root = node("div", element("grants"), "activity");
            view = { root, scope: node("pre", root, "grant-scope"), button: node("button", root, "btn-secondary") };
            view.button.type = "button"; text(view.button, "Revoke");
            view.button.addEventListener("click", () => send("revokeGrant", { id: grant.id }));
            grantRows.set(grant.id, view);
          }
          text(view.scope, grant.scope);
        }
        prune(grantRows, grantIds);
        text(element("grants-summary"), "Session grants (" + grants.length + ") · inspect / revoke");
      };
      element("stop-chat").addEventListener("click", () => {
        if (element("stop-chat").disabled || element("stop-chat").hidden) return;
        stopRequested = true; element("stop-chat").disabled = true;
        text(element("stop-chat"), "Stopping…");
        for (const view of approvalRows.values()) for (const action of view.buttons) action.button.disabled = true;
        send("stopChat");
      });

      const blockedLabels = {
        "multi-root": ["Single folder only", "Multiple workspace folders are not supported. Open a single local folder."],
        "remote": ["Remote not supported", "Remote extension hosts are not supported, including remote file workspaces."],
        "non-file": ["Local folder required", "Non-file workspaces are not supported. Open a local folder."]
      };
      const runtimeHints = {
        "not-started": "Not running",
        "starting": "Starting…",
        "ready": "Connected",
        "stopping": "Stopping…",
        "error": "Runtime error"
      };

      window.addEventListener("message", (event) => {
        const message = event.data;
        if (!message || typeof message !== "object" || Array.isArray(message) || message.version !== 1) return;
        if (message.type === "pong") return;
        if (message.type !== "workspaceState" || !Number.isSafeInteger(message.generation) || message.generation < 0 ||
            !Object.hasOwn({ "no-folder": 1, "multi-root": 1, "remote": 1, "non-file": 1, "untrusted": 1, "eligible": 1 }, message.status) ||
            (generation !== undefined && message.generation < generation)) return;
        if (generation !== message.generation || message.runtime !== "ready") setPopoverOpen(false);
        if (generation !== undefined && generation !== message.generation) {
          for (const cache of [rows, activities, approvalRows, grantRows]) prune(cache, new Set());
          stopRequested = false;
        }
        generation = message.generation;
        if (!message.chatBusy && message.execution !== "stopping") stopRequested = false;
        const stopping = stopRequested || message.execution === "stopping" || message.runtime === "stopping";
        const main = element("main");
        const scrollTop = main.scrollTop;
        const follow = main.scrollHeight - main.clientHeight - main.scrollTop <= 32;

        element("runtime-dot").setAttribute("data-state", message.runtime);
        element("runtime-hint").textContent = (runtimeHints[message.runtime] ?? runtimeHints["not-started"])
          + (message.runtime === "error" && message.runtimeDetail ? " — " + message.runtimeDetail : "");
        element("error").textContent = message.error ?? "";

        const chatReady = (message.runtime === "ready" && !message.busy) || message.chatBusy || stopping;
        const executionLabels = { idle: "Ready", waiting: "Waiting for response…", thinking: "Thinking…", "awaiting-approval": "Waiting for tool approval", executing: "Executing tool…", replying: "Replying…", stopping: "Stopping… Waiting for task to settle; side effects are not rolled back.", failed: "Task failed / interrupted" };
        text(element("execution-status"), stopping ? executionLabels.stopping : executionLabels[message.execution] ?? (message.chatBusy ? executionLabels.waiting : executionLabels.idle));
        element("setup-no-folder").hidden = chatReady || message.status !== "no-folder";
        element("setup-trust").hidden = chatReady || message.status !== "untrusted";
        const blocked = blockedLabels[message.status];
        element("setup-blocked").hidden = chatReady || !blocked;
        if (blocked) {
          element("blocked-title").textContent = blocked[0];
          element("blocked-detail").textContent = blocked[1];
        }
        element("setup-resources").hidden = chatReady || message.status !== "eligible";

        element("chat").hidden = !chatReady;
        element("composer-wrap").hidden = !chatReady;
        if (chatReady) {
          renderMessages(message.messages, message.activities);
          renderApprovals(message.approvals, message.grants, stopping);
          element("chat-error").textContent = message.chatError ?? "";
          currentModelLabel = message.chatModel ?? null;
          const modelLabel = message.chatModel ?? "Model not configured";
          const thinking = message.thinkingLevel ?? "—";
          element("model-effort-trigger").textContent = modelLabel + " · " + thinking;
          element("model-effort-trigger").setAttribute("title", "Applied: " + modelLabel + " · " + thinking);
          const pending = [];
          if (message.pendingModel) pending.push(message.pendingModel.provider + " / " + message.pendingModel.label);
          if (message.pendingThinkingLevel) pending.push("thinking: " + message.pendingThinkingLevel);
          element("pending-settings").textContent = pending.length
            ? (message.modelBusy ? "Applying next turn: " : "Next turn (pending): ") + pending.join(" · ")
            : message.modelBusy ? "Loading model settings…" : "";
          element("pending-settings").hidden = !pending.length && !message.modelBusy;
          element("model-status-error").textContent = message.modelError ?? "";
          element("model-status-error").hidden = !message.modelError;
          element("model-current-label").textContent = modelLabel;
          renderModelList(message.availableModels);
          syncThinkingSlider(message.thinkingLevels, message.pendingThinkingLevel ?? message.thinkingLevel);
          element("thinking-level-label").textContent = "Applied: " + thinking
            + (message.pendingThinkingLevel ? " · Next turn (pending): " + message.pendingThinkingLevel : "");
          element("model-error").textContent = message.modelError ?? "";
          const settingsDisabled = message.busy || message.modelBusy || stopping || message.runtime !== "ready";
          for (const item of element("model-list").children) item.disabled = settingsDisabled;
          element("model-effort-trigger").disabled = settingsDisabled;
          element("model-current").disabled = settingsDisabled || (message.availableModels?.length ?? 0) === 0;
          element("thinking-slider").disabled = settingsDisabled || (message.thinkingLevels?.length ?? 0) <= 1;
        }

        main.scrollTop = follow ? main.scrollHeight : scrollTop;
        element("stop-chat").hidden = !message.chatBusy && !stopping;
        element("stop-chat").disabled = stopping;
        text(element("stop-chat"), stopping ? "Stopping…" : "Stop");
        element("send-chat").hidden = message.chatBusy || stopping;
        const chatDisabled = !chatReady || message.chatBusy || message.busy || message.modelBusy || stopping;
        element("chat-input").disabled = chatDisabled;
        element("send-chat").disabled = chatDisabled;
        element("send-chat").setAttribute("aria-label", message.chatBusy ? "Sending" : "Send");

        const actionDisabled = message.busy || message.runtime === "starting" || message.runtime === "stopping";
        for (const id of ["open-folder", "manage-trust", "allow", "decline"]) element(id).disabled = actionDisabled;
        element("folder-name-heading").textContent = message.folder?.name ? "Project resources — " + message.folder.name : "Project resources";
        element("folder-path").textContent = message.folder?.path ?? "";
        element("choice-status").textContent = message.choice === "allow" ? "Choice: allow project resources. Changing restarts runtime."
          : message.choice === "decline" ? "Choice: continue without project resources. Changing restarts runtime." : "Not chosen yet.";
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
