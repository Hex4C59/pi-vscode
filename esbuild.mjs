import * as esbuild from "esbuild";

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
  entryPoints: ["src/spike-runtime.ts"],
  bundle: true,
  outfile: "dist/spike-runtime.js",
  format: "cjs",
  platform: "node",
  target: "node22",
  sourcemap: true,
  logLevel: "info",
};

if (watch) {
  const ctx = await esbuild.context(extensionBuild);
  await ctx.watch();
  console.log("Watching extension…");
} else {
  await esbuild.build(extensionBuild);
  await esbuild.build(spikeBuild);
}
