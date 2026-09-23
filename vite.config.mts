import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const repositoryRoot = path.dirname(fileURLToPath(import.meta.url));
const webviewRoot = path.join(repositoryRoot, "src", "webview");

export default defineConfig({
  root: path.join(webviewRoot, "preview"),
  plugins: [react()],
  // The checkout may be edited through Windows while Vite runs in WSL.
  server: { watch: { usePolling: true, interval: 200 } },
  build: {
    outDir: path.join(repositoryRoot, "dist", "webview"),
    emptyOutDir: true,
    target: "chrome114",
    cssCodeSplit: false,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: path.join(webviewRoot, "main.tsx"),
      output: {
        format: "es",
        entryFileNames: "webview.js",
        chunkFileNames: "webview-[name].js",
        assetFileNames: (asset) => asset.name?.endsWith(".css") ? "webview.css" : "webview-[name][extname]",
      },
    },
  },
});
