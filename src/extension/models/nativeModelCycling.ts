import type * as vscode from "vscode";
import type { ModelSettings } from "./modelSettings.js";
import type { ModelCatalogEntry } from "../contracts/index.js";

type CycleContext = { generation: number; session: number; allowed: boolean; locale: "en" | "zh-CN" };
const key = (model: ModelCatalogEntry): string => JSON.stringify([model.provider, model.modelId]);
const identity = (context: CycleContext): string => `${context.generation}:${context.session}`;
const strings = {
  choose: ["Choose a cycling subset first (pi: Choose Model Cycling Subset).", "请先选择轮换子集（pi: Choose Model Cycling Subset）。"],
  unavailable: ["No models in the cycling subset are currently available. Choose the subset again.", "轮换子集中没有当前可用模型，请重新选择子集。"],
  levels: ["No thinking levels are available for the current model.", "当前模型没有可用思考级别。"],
  blocked: ["Model cycling is unavailable during a settings, session or interaction transition. Try again when ready.", "设置、会话或交互切换期间不能轮换，请就绪后重试。"],
  failed: ["Could not apply model settings. Check the model selector error; no requested change is assumed.", "无法应用模型设置，请查看模型选择器错误；不假定请求已生效。"],
  picker: ["Could not choose the cycling subset. The previous subset was kept.", "无法选择轮换子集，已保留原集合。"],
  stale: ["The model state changed or the picker expired. The previous subset was kept; choose again.", "模型状态已变化或选择器超时，已保留原集合；请重新选择。"],
  title: ["Model cycling subset — this runtime session only (expires in 2 minutes)", "模型轮换子集 — 仅当前 runtime 会话（2 分钟后超时）"],
  placeholder: ["Select available models; accepting no selection clears the subset. Escape keeps it.", "选择可用模型；确认空选择清空子集，Escape 保留原集合。"],
} satisfies Record<string, [string, string]>;

/** Native, memory-only convenience intents; ModelSettings remains mutation owner. */
export class NativeModelCycling {
  private subset = new Set<string>();
  private owner = "";
  private picker: AbortController | undefined;
  private disposed = false;
  constructor(private readonly api: Pick<typeof vscode, "window" | "EventEmitter">,
    private readonly models: ModelSettings, private readonly context: () => CycleContext) {}
  private text(name: keyof typeof strings): string { return strings[name][this.context().locale === "zh-CN" ? 1 : 0]; }
  private read(): CycleContext {
    const context = this.context(); const owner = identity(context);
    if (owner !== this.owner) { this.owner = owner; this.subset.clear(); }
    return context;
  }
  private notice(name: keyof typeof strings): Promise<unknown> {
    return this.disposed ? Promise.resolve() : Promise.resolve(this.api.window.showInformationMessage(this.text(name)));
  }
  private admitted(): boolean { return !this.disposed && !this.picker && this.read().allowed; }

  async configure(): Promise<void> {
    if (!this.admitted()) { await this.notice("blocked"); return; }
    const before = this.read(); const value = this.models.snapshot;
    if (!value.availableModels.length) { await this.notice("unavailable"); return; }
    const abort = new AbortController(); this.picker = abort;
    const current = (): boolean => !this.disposed && identity(this.read()) === identity(before)
      && this.context().allowed && this.models.snapshot === value;
    const items = value.availableModels.map(model => ({ label: model.label,
      description: `${model.provider} / ${model.modelId}`, picked: this.subset.has(key(model)), model }));
    try {
      const result = await this.pick(items, abort, current);
      if (!current() || abort.signal.aborted) { await this.notice("stale"); return; }
      if (result) {
        const selected = result.filter(item => items.includes(item));
        if (selected.length !== result.length) { await this.notice("stale"); return; }
        this.subset = new Set(selected.map(item => key(item.model)));
      }
    } catch { await this.notice("picker"); }
    finally { if (this.picker === abort) this.picker = undefined; }
  }

  private async pick<T extends vscode.QuickPickItem>(items: T[], abort: AbortController, current: () => boolean): Promise<T[] | undefined> {
    const emitter = new this.api.EventEmitter<void>();
    let resolveCancelled!: (value: undefined) => void;
    const cancelled = new Promise<undefined>(resolve => { resolveCancelled = resolve; });
    const cancel = () => { emitter.fire(); resolveCancelled(undefined); };
    abort.signal.addEventListener("abort", cancel, { once: true });
    const poll = setInterval(() => { if (!current()) abort.abort(); }, 50);
    const deadline = setTimeout(() => abort.abort(), 120_000);
    const token: vscode.CancellationToken = { get isCancellationRequested() { return abort.signal.aborted; }, onCancellationRequested: emitter.event };
    try {
      return await Promise.race([this.api.window.showQuickPick(items, {
        canPickMany: true, matchOnDescription: true, title: this.text("title"), placeHolder: this.text("placeholder"),
      }, token), cancelled]);
    } finally {
      clearInterval(poll); clearTimeout(deadline);
      abort.signal.removeEventListener("abort", cancel); emitter.dispose();
    }
  }

  async model(direction: 1 | -1): Promise<void> {
    if (!this.admitted()) { await this.notice("blocked"); return; }
    if (!this.subset.size) { await this.notice("choose"); return; }
    const value = this.models.snapshot;
    const models = value.availableModels.filter(model => this.subset.has(key(model)));
    if (!models.length) { await this.notice("unavailable"); return; }
    const anchor = value.pendingModel ? key(value.pendingModel) : null;
    const at = models.findIndex(model => anchor ? key(model) === anchor : value.chatModel === `${model.provider} / ${model.modelId}`);
    const next = models[this.next(at, models.length, direction)];
    if (!next || (at >= 0 && models.length === 1)) return;
    await this.apply({ type: "setChatModel", provider: next.provider, modelId: next.modelId });
  }
  async thinking(direction: 1 | -1): Promise<void> {
    if (!this.admitted()) { await this.notice("blocked"); return; }
    const value = this.models.snapshot; const levels = value.thinkingLevels;
    if (!levels.length) { await this.notice("levels"); return; }
    const at = levels.indexOf(value.pendingThinkingLevel ?? value.thinkingLevel ?? "");
    const next = levels[this.next(at, levels.length, direction)];
    if (!next || (at >= 0 && levels.length === 1)) return;
    await this.apply({ type: "setThinkingLevel", level: next });
  }
  private async apply(selection: Parameters<ModelSettings["select"]>[0]): Promise<void> {
    const before = identity(this.read());
    await this.models.select(selection);
    if (!this.disposed && before === identity(this.read()) && this.models.snapshot.modelError) await this.notice("failed");
  }
  private next(at: number, length: number, direction: 1 | -1): number {
    return at < 0 ? direction === 1 ? 0 : length - 1 : (at + direction + length) % length;
  }
  dispose(): void { this.disposed = true; this.picker?.abort(); this.subset.clear(); }
}
