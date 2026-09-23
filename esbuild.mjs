import * as esbuild from "esbuild";
import { build as buildWebview } from "vite";

const watch = process.argv.includes("--watch");

/** @type {esbuild.BuildOptions} */
const extensionBuild = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  target: "node22",
  sourcemap: true,
  logLevel: "info",
};

/** @type {esbuild.BuildOptions} */
const spikeBuild = {
  entryPoints: ["scripts/spikes/spike-runtime.mjs"],
  bundle: true,
  outfile: "dist/spike-runtime.js",
  format: "cjs",
  platform: "node",
  target: "node22",
  sourcemap: true,
  logLevel: "info",
};

const gateBuild = { entryPoints: ["src/adapter/approvalGate.ts"], bundle: true, outfile: "dist/approval-gate.mjs", format: "esm", platform: "node", target: "node22", logLevel: "info" };
const sessionBuild = { entryPoints: ["src/adapter/sessionWorker.ts"], bundle: true, outfile: "dist/session-worker.mjs", external: ["@earendil-works/pi-coding-agent"], format: "esm", platform: "node", target: "node22", logLevel: "info" };
if (watch) {
  const sessionContext = await esbuild.context(sessionBuild);
  await sessionContext.watch();
  const gateContext = await esbuild.context(gateBuild);
  await gateContext.watch();
  const ctx = await esbuild.context(extensionBuild);
  await ctx.watch();
  await buildWebview({ configFile: "vite.config.mts", build: { watch: {} } });
  console.log("Watching extension and webview…");
} else {
  await esbuild.build(sessionBuild);
  await esbuild.build(gateBuild);
  await esbuild.build(extensionBuild);
  await esbuild.build(spikeBuild);
  await buildWebview({ configFile: "vite.config.mts" });
}
