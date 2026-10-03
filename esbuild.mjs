import * as esbuild from "esbuild";
import { build as buildWebview } from "vite";

const watch = process.argv.includes("--watch");

/**
 * esbuild replaces `import.meta` with `{}` in cjs output and only warns, so the
 * text never reaches the bundle. Inlining pi-ai brought modules that read
 * `import.meta.url`; fail the host build instead of shipping a bundle that
 * would fail on those code paths.
 */
function assertNoDegradedImportMeta(result) {
  const warning = result.warnings.find((item) => /import\.meta/.test(item.text));
  if (warning) {
    throw new Error(`dist/extension.js inlines a module that reads import.meta: ${warning.text}`);
  }
}

/** @type {esbuild.BuildOptions} */
const extensionBuild = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  // Only true runtime externals stay outside the host bundle. `vscode` comes
  // from the extension host, and the packaged VSIX stages pi-coding-agent
  // because the supervisor spawns its CLI as a subprocess. pi-ai is bundled:
  // the VSIX ships only the pinned pi-coding-agent subtree, so an external
  // pi-ai import does not resolve from an installed extension root (PACKAGE-01).
  external: ["vscode", "@earendil-works/pi-coding-agent"],
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

const queuedInputBuild = { entryPoints: ["src/adapter/runtime/rpc/queued-input-worker.ts"], bundle: true, outfile: "dist/queued-input-worker.mjs", external: ["@earendil-works/pi-coding-agent", "@earendil-works/pi-ai"], format: "esm", platform: "node", target: "node22", logLevel: "info" };
const gateBuild = { entryPoints: ["src/adapter/approvalGate.ts"], bundle: true, outfile: "dist/approval-gate.mjs", format: "esm", platform: "node", target: "node22", logLevel: "info" };
const sessionBuild = { entryPoints: ["src/adapter/sessions/sessionWorker.ts"], bundle: true, outfile: "dist/session-worker.mjs", external: ["@earendil-works/pi-coding-agent"], format: "esm", platform: "node", target: "node22", logLevel: "info" };
const supervisorBuild = { entryPoints: ["src/adapter/ownership/supervisor.ts"], bundle: true, outfile: "dist/runtime-supervisor.mjs", format: "esm", platform: "node", target: "node22", logLevel: "info" };
if (watch) {
  const queueContext = await esbuild.context(queuedInputBuild);
  await queueContext.watch();
  const supervisorContext = await esbuild.context(supervisorBuild);
  await supervisorContext.watch();
  const sessionContext = await esbuild.context(sessionBuild);
  await sessionContext.watch();
  const gateContext = await esbuild.context(gateBuild);
  await gateContext.watch();
  const ctx = await esbuild.context(extensionBuild);
  await ctx.watch();
  await buildWebview({ configFile: "vite.config.mts", build: { watch: {} } });
  console.log("Watching extension and webview…");
} else {
  await esbuild.build(queuedInputBuild);
  await esbuild.build(supervisorBuild);
  await esbuild.build(sessionBuild);
  await esbuild.build(gateBuild);
  const extensionResult = await esbuild.build(extensionBuild);
  assertNoDegradedImportMeta(extensionResult);
  await esbuild.build(spikeBuild);
  await buildWebview({ configFile: "vite.config.mts" });
}
