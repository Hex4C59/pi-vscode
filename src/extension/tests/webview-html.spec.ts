import assert from "node:assert/strict";
import { test } from "node:test";
import type * as vscode from "vscode";
import { getWebviewHtml, getWebviewResourceRoot } from "../webviewHtml.js";
import { harness } from "./harness.js";

function uri(path: string, scheme = "file") {
  return {
    scheme,
    path,
    fsPath: path,
    with(changes: { path?: string; scheme?: string }) {
      return uri(changes.path ?? path, changes.scheme ?? scheme);
    },
    toString: () => `${scheme}://${path}`,
  };
}

test("webview shell points at packaged local assets with a strict CSP", () => {
  const extensionUri = uri("/extension") as unknown as vscode.Uri;
  const webview = {
    cspSource: "vscode-webview://test",
    asWebviewUri: (resource: vscode.Uri) => resource.with({ scheme: "vscode-webview-resource" }),
  };
  const html = getWebviewHtml(webview, extensionUri, "nonce-value");

  assert.match(html, /<link rel="stylesheet" href="vscode-webview-resource:\/\/\/extension\/dist\/webview\/webview\.css">/);
  assert.match(html, /<script type="module" nonce="nonce-value" src="vscode-webview-resource:\/\/\/extension\/dist\/webview\/webview\.js"><\/script>/);
  assert.match(html, /<div id="root"><p role="alert">Pi interface unavailable[\s\S]*Reopen the view[\s\S]*<\/p><\/div>/);
  assert.match(html, /default-src 'none'/);
  assert.match(html, /style-src vscode-webview:\/\/test/);
  assert.match(html, /script-src 'nonce-nonce-value'/);
  assert.match(html, /connect-src 'none'/);
  assert.doesNotMatch(html, /unsafe-inline/);
  assert.doesNotMatch(html, /<script(?! type="module" nonce="nonce-value")/);
  assert.equal(getWebviewResourceRoot(extensionUri).path, "/extension/dist/webview");
});

test("provider limits local resources to the packaged webview directory", () => {
  const view = harness().createView();
  const options = view.view.webview.options as { localResourceRoots?: Array<{ path?: string }> };
  assert.deepEqual(options.localResourceRoots?.map((root) => root.path), ["/extension/dist/webview"]);
  assert.match(view.view.webview.html, /webview-resource:\/\/\/extension\/dist\/webview\/webview\.js/);
  assert.match(view.view.webview.html, /webview-resource:\/\/\/extension\/dist\/webview\/webview\.css/);
});
