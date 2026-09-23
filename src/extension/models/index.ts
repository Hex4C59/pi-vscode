/** Model selection and catalogue validation for host and adapter consumers. */
export { ModelSettings } from "./modelSettings.js";
export type { ModelSettingsSnapshot, ModelSettingsContext, ModelSettingsSelection, ModelSettingsRuntime } from "./types.js";
export { isValidModelRef, isValidThinkingLevel } from "./modelCatalog.js";
export {
  MAX_MODEL_CATALOG_ENTRIES, MAX_MODEL_ID_CHARS, MAX_MODEL_PROVIDER_CHARS,
  MAX_MODEL_LABEL_CHARS, MAX_THINKING_LEVEL_CHARS,
} from "./modelCatalog.js";
