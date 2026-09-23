import { runPiRuntimeProbe } from "../../src/adapter/pi-rpc-probe.ts";

async function main() {
  const result = await runPiRuntimeProbe();

  if (result.ok) {
    console.log("[pi-vscode spike] OK:", result.detail);
    process.exit(0);
  }

  console.error("[pi-vscode spike] FAIL:", result.detail);
  process.exit(1);
}

void main();
