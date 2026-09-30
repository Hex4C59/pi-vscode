import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PluginInventoryEntry, PluginInventoryLoad, PluginInventoryWrite } from "./types.js";

export const PLUGIN_INVENTORY_FILE = "plugin-inventory-v1.json";
export const PLUGIN_INVENTORY_MAX_BYTES = 65_536;
export const PLUGIN_INVENTORY_MAX_ENTRIES = 64;
const SCHEMA_VERSION = 1;
const ENTRY_SUFFIX = /\.(?:ts|js|mjs|cjs)$/i;

export function pluginInventoryPath(globalStorage: string): string {
  return path.join(globalStorage, PLUGIN_INVENTORY_FILE);
}

export async function loadPluginInventory(globalStorage: string): Promise<PluginInventoryLoad> {
  const file = pluginInventoryPath(globalStorage);
  try {
    const info = await stat(file);
    if (!info.isFile()) return { ok: false, reason: "damaged" };
    if (info.size > PLUGIN_INVENTORY_MAX_BYTES) return { ok: false, reason: "too-large" };
    const text = await readFile(file, "utf8");
    if (Buffer.byteLength(text, "utf8") > PLUGIN_INVENTORY_MAX_BYTES) return { ok: false, reason: "too-large" };
    return parseInventoryText(text);
  } catch (error) {
    return isMissing(error) ? { ok: true, entries: [], source: "missing" } : { ok: false, reason: "damaged" };
  }
}

export async function replacePluginInventory(
  globalStorage: string,
  entries: PluginInventoryEntry[],
): Promise<PluginInventoryWrite> {
  const existing = await loadPluginInventory(globalStorage);
  if (!existing.ok) return { ok: false, reason: "existing-unusable" };
  const prepared = prepareEntries(entries);
  if (!prepared.ok) return prepared;
  const body = `${JSON.stringify({ schemaVersion: SCHEMA_VERSION, entries: prepared.entries })}\n`;
  if (Buffer.byteLength(body, "utf8") > PLUGIN_INVENTORY_MAX_BYTES) return { ok: false, reason: "too-large" };
  try {
    await mkdir(globalStorage, { recursive: true });
    const file = pluginInventoryPath(globalStorage);
    const temporary = `${file}.${process.pid}.tmp`;
    await writeFile(temporary, body, "utf8");
    await rename(temporary, file);
    return { ok: true };
  } catch {
    return { ok: false, reason: "write-failed" };
  }
}

function parseInventoryText(text: string): PluginInventoryLoad {
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { return { ok: false, reason: "damaged" }; }
  if (!isObject(parsed) || parsed.schemaVersion !== SCHEMA_VERSION || !Array.isArray(parsed.entries)) {
    return parsed && isObject(parsed) && "schemaVersion" in parsed && parsed.schemaVersion !== SCHEMA_VERSION
      ? { ok: false, reason: "unsupported-schema" }
      : { ok: false, reason: "damaged" };
  }
  if (Object.keys(parsed).some((key) => key !== "schemaVersion" && key !== "entries")) return { ok: false, reason: "damaged" };
  const prepared = prepareEntries(parsed.entries);
  return prepared.ok ? { ok: true, entries: prepared.entries, source: "file" } : { ok: false, reason: "damaged" };
}

function prepareEntries(
  input: unknown,
): { ok: true; entries: PluginInventoryEntry[] } | Extract<PluginInventoryWrite, { ok: false }> {
  if (!Array.isArray(input)) return { ok: false, reason: "invalid-entry" };
  if (input.length > PLUGIN_INVENTORY_MAX_ENTRIES) return { ok: false, reason: "too-many" };
  const entries: PluginInventoryEntry[] = [];
  const seen = new Set<string>();
  for (const item of input) {
    const entry = asStoredEntry(item);
    if (!entry) return { ok: false, reason: "invalid-entry" };
    if (seen.has(entry.path)) return { ok: false, reason: "duplicate-path" };
    seen.add(entry.path);
    entries.push(entry);
  }
  return { ok: true, entries };
}

function asStoredEntry(item: unknown): PluginInventoryEntry | undefined {
  if (!isObject(item) || typeof item.path !== "string" || typeof item.enabled !== "boolean") return undefined;
  if (Object.keys(item).some((key) => key !== "path" && key !== "enabled")) return undefined;
  if (!path.isAbsolute(item.path) || item.path.includes("\0") || Buffer.byteLength(item.path, "utf8") > 32_768) return undefined;
  if (!ENTRY_SUFFIX.test(item.path) || isSensitive(item.path)) return undefined;
  const resolved = path.resolve(item.path);
  if (!path.isAbsolute(resolved) || isSensitive(resolved) || !ENTRY_SUFFIX.test(resolved)) return undefined;
  return { path: resolved, enabled: item.enabled };
}

function isSensitive(value: string): boolean {
  return value.split(/[\\/]/).some((part) => (
    /^(?:\.local-env|\.ssh|\.env(?:\..*)?|auth\.json|credentials\.json|id_rsa|id_ed25519)$/i.test(part)
    || /\.(pem|key|p12|pfx)$/i.test(part)
  ));
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMissing(error: unknown): boolean {
  return error instanceof Error && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT";
}
