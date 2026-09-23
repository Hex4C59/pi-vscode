import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyWebviewAssets } from "./verify-webview-assets-lib.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
try {
  const result = await verifyWebviewAssets({ rootDir, archivePath: process.argv[2] });
  const archiveDetail = result.archive ? ` and ${result.archive.entries} VSIX entries` : "";
  console.log(`PASS Webview assets: dist/webview/webview.js + webview.css${archiveDetail}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
