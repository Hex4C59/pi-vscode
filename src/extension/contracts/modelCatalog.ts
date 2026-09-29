/** Bounds and validators for model / thinking catalog projected to the webview. */
import type { ModelCatalogEntry } from "./webviewProtocol.js";

export const MAX_MODEL_CATALOG_ENTRIES = 64;
export const MAX_MODEL_ID_CHARS = 128;
export const MAX_MODEL_PROVIDER_CHARS = 64;
export const MAX_MODEL_LABEL_CHARS = 200;
export const MAX_THINKING_LEVEL_CHARS = 16;

const THINKING_LEVEL_PATTERN = /^[a-z0-9]+$/;
const MODEL_TOKEN_PATTERN = /^[\w.-]+$/;

export function isValidThinkingLevel(level: string): boolean {
  return level.length > 0
    && level.length <= MAX_THINKING_LEVEL_CHARS
    && THINKING_LEVEL_PATTERN.test(level);
}

export function isValidProviderId(provider: string): boolean {
  return provider.length > 0
    && provider.length <= MAX_MODEL_PROVIDER_CHARS
    && MODEL_TOKEN_PATTERN.test(provider);
}

export function isValidModelRef(provider: string, modelId: string): boolean {
  return isValidProviderId(provider) && isCustomModelId(modelId);
}

export function findCatalogEntry(
  models: readonly ModelCatalogEntry[],
  provider: string,
  modelId: string,
): ModelCatalogEntry | undefined {
  return models.find((entry) => entry.provider === provider && entry.modelId === modelId);
}

const MAX_ENDPOINT_URL_CHARS = 512;
const MAX_ENDPOINT_NAME_CHARS = 200;

function hasUnsafeMarker(value: string): boolean {
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code <= 31 || char === "!" || char === "$") return true;
  }
  return false;
}

function endpointSlug(displayName: string): string {
  return displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
}

/** Provider id derived from a display name. Empty when the name cannot be a pi provider id. */
export function endpointProviderId(displayName: string): string | undefined {
  if (!isEndpointDisplayName(displayName)) return undefined;
  if (isValidProviderId(displayName)) return displayName;
  const slug = endpointSlug(displayName);
  return isValidProviderId(slug) ? slug : undefined;
}

export function isEndpointDisplayName(value: string): boolean {
  return value.length > 0
    && value.length <= MAX_ENDPOINT_NAME_CHARS
    && value === value.trim()
    && !hasUnsafeMarker(value)
    && (isValidProviderId(value) || isValidProviderId(endpointSlug(value)));
}

/** http(s) URL with a host and no embedded userinfo, shell prefix or environment marker. */
export function isPublicHttpUrl(value: string): boolean {
  if (value.length === 0 || value.length > MAX_ENDPOINT_URL_CHARS || value !== value.trim() || /\s/.test(value) || hasUnsafeMarker(value)) return false;
  let url: URL;
  try { url = new URL(value); } catch { return false; }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (url.username !== "" || url.password !== "") return false;
  return url.hostname.length > 0;
}

export function isCustomModelId(value: string): boolean {
  return value.length > 0
    && value.length <= MAX_MODEL_ID_CHARS
    && /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/.test(value)
    && !value.includes("..");
}
