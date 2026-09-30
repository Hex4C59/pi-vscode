import type { UiLanguageState } from "../i18n/ui-language.js";
export type { UiLanguageState } from "../i18n/ui-language.js";

/** Presentation configuration; neither option grants host capabilities. */
export interface ChatMountOptions {
  language?: UiLanguageState;
  preview?: boolean;
}
