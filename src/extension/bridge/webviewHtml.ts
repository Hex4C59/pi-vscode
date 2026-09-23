import type * as vscode from "vscode";

type WebviewResource = Pick<vscode.Webview, "asWebviewUri" | "cspSource">;

function joinPath(uri: vscode.Uri, ...segments: string[]): vscode.Uri {
  const base = uri.path.replace(/\/+$/, "");
  return uri.with({ path: `${base}/${segments.join("/")}` });
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function getWebviewResourceRoot(extensionUri: vscode.Uri): vscode.Uri {
  return joinPath(extensionUri, "dist", "webview");
}

export function getWebviewHtml(webview: WebviewResource, extensionUri: vscode.Uri, nonce: string): string {
  const resourceRoot = getWebviewResourceRoot(extensionUri);
  const scriptUri = webview.asWebviewUri(joinPath(resourceRoot, "webview.js"));
  const styleUri = webview.asWebviewUri(joinPath(resourceRoot, "webview.css"));
  const source = escapeAttribute(webview.cspSource);
  const safeNonce = escapeAttribute(nonce);
  const script = escapeAttribute(scriptUri.toString());
  const stylesheet = escapeAttribute(styleUri.toString());
  const csp = [
    "default-src 'none'",
    `img-src ${source} data:`,
    `style-src ${source}`,
    `script-src 'nonce-${safeNonce}'`,
    "connect-src 'none'",
    `font-src ${source}`,
    "base-uri 'none'",
    "object-src 'none'",
    "frame-src 'none'",
  ].join("; ");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <link rel="stylesheet" href="${stylesheet}">
</head>
<body>
  <div id="root"><p role="alert">Pi interface unavailable until local resources finish loading. Reopen the view to retry if this message remains.</p></div>
  <script type="module" nonce="${safeNonce}" src="${script}"></script>
</body>
</html>`;
}
