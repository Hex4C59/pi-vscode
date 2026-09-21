import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type PiSettings = {
  defaultProvider?: string;
  defaultModel?: string;
};

/** Maps pi global settings to a `--model` CLI argument when configured. */
export function readPiStartupModelArg(): string | undefined {
  const home = process.env.USERPROFILE || process.env.HOME || os.homedir();
  const settingsPath = path.join(home, ".pi", "agent", "settings.json");
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
