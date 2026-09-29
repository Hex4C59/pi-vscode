import type { UiLanguage } from "../components/index.js";

/** Presentation language store; production follows the host's shared in-memory locale. */
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
