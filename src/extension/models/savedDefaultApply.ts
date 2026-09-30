/** Collaborators for applying the Saved default into a Live session. Not a product glossary noun. */
export type SavedDefaultApplyModels = {
  snapshot: { chatModel: string | null };
  load(modelLabel: string | null): Promise<void>;
  applyConfiguredModel(provider: string, modelId: string): Promise<void>;
};
export type SavedDefaultApplyConfig = {
  snapshot: { defaultProvider: string | null; defaultModelId: string | null };
  refresh(): Promise<void>;
};
export type SavedDefaultApplyContext = { ready: boolean; disposed: boolean };

export type SavedDefaultApplyDeps = {
  models: SavedDefaultApplyModels;
  providerConfig: SavedDefaultApplyConfig;
  requestRestart: () => Promise<void>;
};

/**
 * Owns persist → Live session refresh → one restart request when the session still has no model.
 * ProviderConfig and ModelSettings stay separate; the coordinator keeps reconcileRuntime.
 */
export class SavedDefaultApply {
  constructor(
    private readonly deps: SavedDefaultApplyDeps,
    private readonly context: () => SavedDefaultApplyContext,
  ) {}

  /** Runtime-ready load: refresh catalogue and apply the Saved default. Never restarts. */
  async loadAfterReady(token: number, currentToken: () => number, modelLabel: string | null): Promise<void> {
    const { models, providerConfig } = this.deps;
    await Promise.all([models.load(modelLabel), providerConfig.refresh()]);
    if (token !== currentToken() || this.inactive() || models.snapshot.chatModel) return;
    await this.applySavedDefault();
  }

  /** After a Saved-default or credential write: apply, then restart once if still no model. */
  async syncAfterWrite(provider?: string, modelId?: string): Promise<void> {
    if (this.inactive()) return;
    const { models } = this.deps;
    await models.load(models.snapshot.chatModel);
    await this.applySavedDefault(provider, modelId);
    if (models.snapshot.chatModel) return;
    await this.deps.requestRestart();
  }

  private inactive(): boolean {
    const { ready, disposed } = this.context();
    return disposed || !ready;
  }

  private async applySavedDefault(provider?: string, modelId?: string): Promise<void> {
    const snapshot = this.deps.providerConfig.snapshot;
    const targetProvider = provider ?? snapshot.defaultProvider;
    const targetModelId = modelId ?? snapshot.defaultModelId;
    if (targetProvider && targetModelId) {
      await this.deps.models.applyConfiguredModel(targetProvider, targetModelId);
    }
  }
}
