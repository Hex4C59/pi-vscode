/**
 * Placeholder sidebar webview (WI-001). No scripts, no secrets, no pi SDK.
 */
export function getPlaceholderHtml(): string {
  const csp = [
    "default-src 'none'",
    "style-src 'unsafe-inline'",
    "font-src https://*.vscode-cdn.net",
  ].join("; ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      margin: 0;
      padding: 16px;
      line-height: 1.5;
    }
    h1 {
      font-size: 1.1em;
      font-weight: 600;
      margin: 0 0 8px;
    }
    p { margin: 0 0 12px; opacity: 0.9; }
    .hint {
      font-size: 0.9em;
      opacity: 0.75;
    }
  </style>
</head>
<body>
  <h1>pi</h1>
  <p>Chat shell placeholder (WI-001). Real streaming chat arrives in a later work item.</p>
  <p class="hint">Default layout: Explorer on the left, pi here in the Secondary Side Bar when your VS Code build supports it.</p>
</body>
</html>`;
}
