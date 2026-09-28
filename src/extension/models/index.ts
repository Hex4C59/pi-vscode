/** Model selection and catalogue validation for host and adapter consumers. */
export { ModelSettings } from "./modelSettings.js";
export type { ModelSettingsSnapshot, ModelSettingsContext, ModelSettingsSelection, ModelSettingsRuntime } from "./types.js";
export { ProviderConfig, createDefaultProviderConfigDeps, resolvePiAgentDir } from "./providerConfig.js";
export type { ProviderConfigDeps, ProviderConfigPromptUi } from "./providerConfig.js";
export { isValidModelRef, isValidProviderId, isValidThinkingLevel } from "./modelCatalog.js";
export {
  MAX_MODEL_CATALOG_ENTRIES, MAX_MODEL_ID_CHARS, MAX_MODEL_PROVIDER_CHARS,
  MAX_MODEL_LABEL_CHARS, MAX_THINKING_LEVEL_CHARS,
} from "./modelCatalog.js";
