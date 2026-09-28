import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type PiSettings = {
  defaultProvider?: string;
  defaultModel?: string;
};

function agentDir(env: NodeJS.ProcessEnv): string {
  const override = env.PI_CODING_AGENT_DIR?.trim();
  if (override) {
    if (override === "~") return os.homedir();
    if (override.startsWith("~/") || override.startsWith("~\\")) {
      return path.join(os.homedir(), override.slice(2));
    }
    return override;
  }
  return path.join(os.homedir(), ".pi", "agent");
}

/** Maps pi global settings to a `--model` CLI argument when configured. */
export function readPiStartupModelArg(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const settingsPath = path.join(agentDir(env), "settings.json");
  try {
    const raw = fs.readFileSync(settingsPath, "utf8");
    const settings = JSON.parse(raw) as PiSettings;
    if (!settings.defaultModel?.trim()) return undefined;
    const model = settings.defaultModel.trim();
    const provider = settings.defaultProvider?.trim();
    return provider ? `${provider}/${model}` : model;
  } catch {
    return undefined;
  }
}
