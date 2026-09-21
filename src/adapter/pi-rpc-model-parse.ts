import {
  MAX_MODEL_CATALOG_ENTRIES,
  MAX_MODEL_ID_CHARS,
  MAX_MODEL_LABEL_CHARS,
  MAX_MODEL_PROVIDER_CHARS,
  type ModelCatalogEntry,
  isValidThinkingLevel,
} from "../extension/modelCatalog.js";

export function formatModelLabel(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const model = (data as Record<string, unknown>).model ?? data;
  if (!model || typeof model !== "object") return null;
  const entry = model as Record<string, unknown>;
  const id = typeof entry.id === "string" ? entry.id : typeof entry.modelId === "string" ? entry.modelId : null;
  const provider = typeof entry.provider === "string" ? entry.provider : null;
  const name = typeof entry.name === "string" ? entry.name.trim() : null;
  if (name && name.length <= MAX_MODEL_LABEL_CHARS) return name;
  if (id && provider) return `${provider} / ${id}`;
  return id ?? provider;
}

export function readThinkingLevel(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const level = (data as Record<string, unknown>).thinkingLevel;
  return typeof level === "string" && isValidThinkingLevel(level) ? level : null;
}

export function parseThinkingLevels(data: unknown): string[] {
  if (!data || typeof data !== "object") return [];
  const levels = (data as Record<string, unknown>).levels;
  if (!Array.isArray(levels)) return [];
  const out: string[] = [];
  for (const level of levels) {
    if (typeof level !== "string" || !isValidThinkingLevel(level)) continue;
    if (out.includes(level)) continue;
    if (out.length >= 16) break;
    out.push(level);
  }
  return out;
}

export function parseModelCatalog(data: unknown): ModelCatalogEntry[] {
  if (!data || typeof data !== "object") return [];
  const models = (data as Record<string, unknown>).models;
  if (!Array.isArray(models)) return [];
  const out: ModelCatalogEntry[] = [];
  for (const raw of models) {
    if (out.length >= MAX_MODEL_CATALOG_ENTRIES) break;
    if (!raw || typeof raw !== "object") continue;
    const entry = raw as Record<string, unknown>;
    const provider = typeof entry.provider === "string" ? entry.provider.trim() : "";
    const modelId = typeof entry.id === "string"
      ? entry.id.trim()
      : typeof entry.modelId === "string"
        ? entry.modelId.trim()
        : "";
    if (!provider || provider.length > MAX_MODEL_PROVIDER_CHARS) continue;
    if (!modelId || modelId.length > MAX_MODEL_ID_CHARS) continue;
    const name = typeof entry.name === "string" ? entry.name.trim() : "";
    const label = name && name.length <= MAX_MODEL_LABEL_CHARS
      ? name
      : `${provider} / ${modelId}`.slice(0, MAX_MODEL_LABEL_CHARS);
    out.push({ provider, modelId, label });
  }
  return out;
}
