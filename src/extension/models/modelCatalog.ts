/** Bounds for model / thinking catalog projected to the webview. */
export const MAX_MODEL_CATALOG_ENTRIES = 64;
export const MAX_MODEL_ID_CHARS = 128;
export const MAX_MODEL_PROVIDER_CHARS = 64;
export const MAX_MODEL_LABEL_CHARS = 200;
export const MAX_THINKING_LEVEL_CHARS = 16;

const THINKING_LEVEL_PATTERN = /^[a-z0-9]+$/;
const MODEL_TOKEN_PATTERN = /^[\w.-]+$/;

import type { ModelCatalogEntry } from "../contracts/index.js";
export type { ModelCatalogEntry } from "../contracts/index.js";

export function isValidThinkingLevel(level: string): boolean {
  return level.length > 0
    && level.length <= MAX_THINKING_LEVEL_CHARS
    && THINKING_LEVEL_PATTERN.test(level);
}

export function isValidModelRef(provider: string, modelId: string): boolean {
  return provider.length > 0
    && provider.length <= MAX_MODEL_PROVIDER_CHARS
    && MODEL_TOKEN_PATTERN.test(provider)
    && modelId.length > 0
    && modelId.length <= MAX_MODEL_ID_CHARS
    && MODEL_TOKEN_PATTERN.test(modelId);
}

export function findCatalogEntry(
  models: readonly ModelCatalogEntry[],
  provider: string,
  modelId: string,
): ModelCatalogEntry | undefined {
  return models.find((entry) => entry.provider === provider && entry.modelId === modelId);
}
