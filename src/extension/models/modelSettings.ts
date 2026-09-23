import { findCatalogEntry } from "./modelCatalog.js";
import type { ModelSettingsSnapshot, ModelSettingsSelection, ModelSettingsContext, ModelSettingsRuntime } from "./types.js";
export type { ModelSettingsSnapshot } from "./types.js";
const empty = (): ModelSettingsSnapshot => ({
  chatModel: null, thinkingLevel: null, thinkingLevels: [], availableModels: [],
  modelBusy: false, modelError: null, pendingModel: null, pendingThinkingLevel: null,
});

/** Owns applied settings, next-turn intents and invalidation of in-flight mutations. */
export class ModelSettings {
  private value = empty();
  private revision = 0;
  constructor(private readonly runtime: ModelSettingsRuntime, private readonly context: () => ModelSettingsContext, private readonly changed: () => void) {}
  get snapshot(): Readonly<ModelSettingsSnapshot> { return this.value; }

  // The coordinator publishes after the complete cross-feature transition.
  reset(): void { this.revision++; this.value = empty(); }
  cancelPending(): void {
    this.revision++;
    this.value = { ...this.value, modelBusy: false, pendingModel: null, pendingThinkingLevel: null };
  }
  private canSelect(context: ModelSettingsContext): boolean {
    return !context.disposed && context.ready && !context.blocked && !this.value.modelBusy;
  }
  async select(selection: ModelSettingsSelection): Promise<void> {
    if (!this.canSelect(this.context())) return;
    if (selection.type === "setThinkingLevel") {
      if (!this.value.thinkingLevels.includes(selection.level)) return;
      this.value = { ...this.value, pendingThinkingLevel: selection.level, modelError: null };
    } else {
      const model = findCatalogEntry(this.value.availableModels, selection.provider, selection.modelId);
      if (!model) return;
      this.value = { ...this.value, pendingModel: model, modelError: null };
    }
    const applying = this.applyPending();
    this.changed();
    await applying;
  }

  /** Serialize next-turn intent only after the session-level settled event. */
  async applyPending(): Promise<void> {
    const before = this.context();
    if (!this.canSelect(before) || before.stopping || before.chatBusy) return;
    const model = this.value.pendingModel;
    const level = this.value.pendingThinkingLevel;
    if (!model && !level) return;
    const token = ++this.revision;
    const generation = before.generation;
    const session = before.session;
    const current = (): boolean => {
      const now = this.context();
      return token === this.revision && !now.disposed && generation === now.generation
        && session === now.session && now.ready;
    };
    this.value = { ...this.value, modelBusy: true, modelError: null };
    this.changed();
    let error = "Could not apply model settings. Select again to retry.";
    const accept = (result: Awaited<ReturnType<ModelSettingsRuntime["getModelProjection"]>>): boolean => {
      if (!result.ok) return false;
      this.value = { ...this.value, chatModel: result.modelLabel, thinkingLevel: result.thinkingLevel,
        thinkingLevels: result.thinkingLevels, availableModels: result.models };
      return true;
    };
    try {
      if (model) {
        const result = await this.runtime.setModel(model.provider, model.modelId);
        if (!current()) return;
        if (!accept(result)) throw new Error();
        // setModel returns a fresh get_state + available-levels projection.
      }
      if (level) {
        if (!this.value.thinkingLevels.includes(level)) {
          error = "Requested thinking level is not supported by the selected model. It was not applied.";
          throw new Error();
        }
        const result = await this.runtime.setThinkingLevel(level);
        if (!current()) return;
        if (!accept(result)) throw new Error();
        if (this.value.thinkingLevel !== level) {
          error = "Requested thinking level was not applied by the runtime. Select again to retry.";
          throw new Error();
        }
      }
    } catch {
      if (!current()) return;
      // A failed mutation/refresh may have changed upstream state; read back,
      // never retry a mutation or claim that the requested value was applied.
      try {
        const result = await this.runtime.getModelProjection();
        if (!current()) return;
        if (!accept(result)) this.value = { ...this.value, chatModel: null, thinkingLevel: null, thinkingLevels: [] };
      } catch {
        if (!current()) return;
        this.value = { ...this.value, chatModel: null, thinkingLevel: null, thinkingLevels: [] };
      }
      this.value = { ...this.value, modelError: error };
    } finally {
      if (current()) {
        this.value = { ...this.value, modelBusy: false, pendingModel: null, pendingThinkingLevel: null };
        this.changed();
      }
    }
  }

  async load(modelLabel: string | null): Promise<void> {
    const token = ++this.revision;
    const before = this.context();
    if (!before.ready || before.disposed) return;
    this.value = { ...this.value, chatModel: modelLabel, thinkingLevel: null, thinkingLevels: [],
      availableModels: [], modelBusy: true, modelError: null };
    this.changed();
    const result = await this.runtime.getModelProjection().catch(() => ({ ok: false as const }));
    const now = this.context();
    if (token !== this.revision || now.disposed) return;
    if (now.generation !== before.generation || now.session !== before.session || !now.ready) {
      this.value = { ...this.value, modelBusy: false };
    } else if (!result.ok) {
      this.value = { ...this.value, modelBusy: false, modelError: "Could not load model settings. Restart runtime to retry." };
    } else {
      this.value = { ...this.value, modelBusy: false, modelError: null, chatModel: result.modelLabel,
        thinkingLevel: result.thinkingLevel, thinkingLevels: result.thinkingLevels, availableModels: result.models };
    }
    this.changed();
  }
}
