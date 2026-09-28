import { englishUi, formatUiText, type UiLanguage } from "../components/index.js";
import type { UiLanguageState } from "./types.js";
import { chineseUi } from "./ui-zh-cn.js";

/** Add a complete language pack here; controls do not need language-specific branches. */
export const uiLanguages = [
  { label: "English", ...englishUi },
  { label: "简体中文", locale: "zh-CN", text: (message, values) => formatUiText(chineseUi[message], values) },
] satisfies readonly (UiLanguage & { label: string })[];

/** Page-owned presentation state, deliberately independent of client/bridge identity. */
export function createUiLanguage(): UiLanguageState {
  let current: UiLanguage = uiLanguages[0];
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => current,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    select(locale: string) {
      const next = uiLanguages.find(language => language.locale === locale);
      if (!next || next === current) return;
      current = next;
      for (const listener of listeners) listener();
    },
  };
}
