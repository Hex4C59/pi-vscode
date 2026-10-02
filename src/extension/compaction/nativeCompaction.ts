import type * as vscode from "vscode";
import type { ManualCompactionResult, PiRuntimeLifecycle } from "../contracts/index.js";

type Context = { identity: string; session: number; allowed: boolean; locale: "en" | "zh-CN" };
type Dependencies = { window: typeof vscode.window; runtime: PiRuntimeLifecycle; context(): Context;
  begin(): void; finish(result: ManualCompactionResult): void; stop(): Promise<unknown> };
const MAX_INSTRUCTION_BYTES = 4096;
const NOTIFICATION: vscode.ProgressLocation = 15;

/** Native confirmation/progress owns no persisted instructions or webview capability. */
export class NativeCompaction {
  private operation: object | undefined;
  private disposed = false;
  get running(): boolean { return this.operation !== undefined; }
  constructor(private readonly deps: Dependencies) {}

  private current(expected: Context): boolean {
    const next = this.deps.context();
    return !this.disposed && next.identity === expected.identity && next.session === expected.session;
  }

  async run(): Promise<void> {
    const expected = this.deps.context();
    if (this.running || this.disposed) return;
    const zh = expected.locale === "zh-CN";
    if (!expected.allowed || !this.deps.runtime.compactContext) {
      await this.deps.window.showInformationMessage(zh ? "当前无法压缩；请等待空闲且 runtime 就绪。" : "Compaction unavailable. Wait for an idle, ready runtime."); return;
    }
    const compact = zh ? "压缩" : "Compact"; const custom = zh ? "添加指令" : "Add instructions";
    const choice = await this.deps.window.showWarningMessage(zh
      ? "压缩会有损地摘要较早上下文，并可能产生所选模型的正常费用。继续？"
      : "Compaction is lossy: older context is summarized. Ordinary selected-model charges may apply. Continue?",
    { modal: true }, compact, custom);
    if (choice !== compact && choice !== custom) return;
    const instructions = choice === custom ? await this.instructions(zh) : undefined;
    if (choice === custom && instructions === undefined) return;
    if (instructions !== undefined && Buffer.byteLength(instructions, "utf8") > MAX_INSTRUCTION_BYTES) return;
    if (!this.current(expected) || !this.deps.context().allowed || this.running) return;
    const operation = {}; this.operation = operation;
    this.deps.begin();
    try { await this.execute(expected, instructions, zh); }
    finally { if (this.operation === operation) this.operation = undefined; }
  }

  private async instructions(zh: boolean): Promise<string | undefined> {
    return this.deps.window.showInputBox({ title: zh ? "压缩指令（可选）" : "Compaction instructions (optional)",
      prompt: zh ? "最多 4 KiB UTF-8；取消不会调用模型。" : "At most 4 KiB UTF-8. Cancel makes no model call.",
      validateInput: value => Buffer.byteLength(value, "utf8") > MAX_INSTRUCTION_BYTES
        ? (zh ? "指令超过 4 KiB。" : "Instructions exceed 4 KiB.") : undefined });
  }

  private async execute(expected: Context, instructions: string | undefined, zh: boolean): Promise<void> {
    const result = await this.deps.window.withProgress({ location: NOTIFICATION, cancellable: true,
      title: zh ? "正在压缩上下文…" : "Compacting context…" }, async (_progress, token) => {
      const listener = token.onCancellationRequested(() => { if (this.current(expected)) void this.deps.stop(); });
      try {
        if (token.isCancellationRequested) return { outcome: "cancelled", agentRunning: false } satisfies ManualCompactionResult;
        return await this.deps.runtime.compactContext!(instructions, expected.session);
      }
      catch { return { outcome: "failed", agentRunning: false } satisfies ManualCompactionResult; }
      finally { listener.dispose(); }
    });
    if (!this.current(expected)) return;
    this.operation = undefined;
    this.deps.finish(result);
    const en = { completed: "Context compaction completed.", cancelled: "Context compaction cancelled.", failed: "Context compaction failed. Check runtime status before retrying.", unavailable: "Context compaction unavailable; nothing was compacted." };
    const cn = { completed: "上下文压缩已完成。", cancelled: "上下文压缩已取消。", failed: "上下文压缩失败；重试前检查 runtime 状态。", unavailable: "上下文压缩不可用；未执行压缩。" };
    await this.deps.window.showInformationMessage((zh ? cn : en)[result.outcome]);
  }

  dispose(): void { this.disposed = true; }
}
