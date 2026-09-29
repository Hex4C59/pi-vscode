import type { ModelCatalogEntry } from "../contracts/index.js";

/** Non-secret provider auth projection for the webview. */
export type ProviderConfigEntry = {
  providerId: string;
  displayName: string;
  configured: boolean;
  authLabel: string | null;
  canAddApiKey: boolean;
  canLogout: boolean;
  canSignIn: boolean;
  canRemoveEndpoint: boolean;
};

/** Host-owned provider/default-model snapshot; never includes secrets. */
export type ProviderConfigProjection = {
  busy: boolean;
  error: string | null;
  defaultProvider: string | null;
  defaultModelId: string | null;
  defaultThinkingLevel: string | null;
  thinkingLevels: string[];
  providers: ProviderConfigEntry[];
  catalog: ModelCatalogEntry[];
};

export type ProviderConfigIntent =
  | { type: "openProviderApiKey"; providerId: string }
  | { type: "openProviderOAuth"; providerId: string }
  | { type: "addCustomEndpoint"; displayName: string; baseUrl: string; modelId: string }
  | { type: "removeCustomEndpoint"; providerId: string }
  | { type: "logoutProvider"; providerId: string }
  | { type: "setDefaultModel"; provider: string; modelId: string }
  | { type: "setDefaultThinkingLevel"; provider: string; modelId: string; level: string }
  | { type: "refreshProviderConfig" };
