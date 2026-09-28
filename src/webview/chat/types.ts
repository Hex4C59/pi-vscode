import type { UiLanguage } from "../components/index.js";

/** Mount-local interface language; never persisted or sent to the host. */
export interface UiLanguageState {
  getSnapshot(): UiLanguage;
  subscribe(listener: () => void): () => void;
  select(locale: string): void;
}

/** Presentation configuration; neither option grants host capabilities. */
export interface ChatMountOptions {
  language?: UiLanguageState;
  preview?: boolean;
}
