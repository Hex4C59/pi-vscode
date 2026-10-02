import type * as vscode from "vscode";
import { containsCredentialLikeText, type PiRuntimeLifecycle } from "../contracts/index.js";

export type RenameContext = {
  generation: number; viewId: string; session: number; ready: boolean; locale: "en" | "zh-CN";
  conversation: { id: string; path: string; name: string | null } | null;
};
type RenameDeps = {
  runtime: PiRuntimeLifecycle;
  context(): RenameContext;
  input(options: vscode.InputBoxOptions, signal: AbortSignal): Promise<string | undefined>;
  changed(): void;
  apply(conversation: NonNullable<RenameContext["conversation"]>): Promise<void>;
  notice(message: string): Promise<unknown>;
};
export function validSessionName(value: string): string | undefined {
  const name = value.trim();
  return name && name.length <= 200 && Array.from(value, character => character.charCodeAt(0)).every(code => code >= 32 && (code < 127 || code > 159)) && !containsCredentialLikeText(name) ? name : undefined;
}
function sameContext(before: RenameContext, after: RenameContext): boolean {
  return after.ready && before.generation === after.generation && before.viewId === after.viewId && before.session === after.session
    && before.conversation?.id === after.conversation?.id && before.conversation?.path === after.conversation?.path;
}

/** Owns the single native-input/mutation flight; the provider owns identity and publication. */
export class SessionRename {
  private operation: { abort: AbortController; committed: boolean } | undefined;
  constructor(private readonly deps: RenameDeps) {}
  get busy(): boolean { return this.operation !== undefined; }
  get status(): "unavailable" | "ready" | "renaming" {
    return this.busy ? "renaming" : this.deps.context().ready && this.deps.runtime.renameSession ? "ready" : "unavailable";
  }
  cancelInput(): void {
    if (!this.operation || this.operation.committed) return;
    this.operation.abort.abort(); this.operation = undefined; this.deps.changed();
  }
  async rename(): Promise<void> {
    const before = this.deps.context();
    if (this.busy || !before.ready || !before.conversation || !this.deps.runtime.renameSession) return;
    const operation = { abort: new AbortController(), committed: false }; this.operation = operation;
    const current = () => this.operation === operation && !operation.abort.signal.aborted && sameContext(before, this.deps.context());
    this.deps.changed();
    try {
      const input = await this.deps.input(this.options(before), operation.abort.signal);
      if (!current() || input === undefined) return;
      const name = validSessionName(input);
      if (!name || name === before.conversation.name?.trim()) return;
      operation.committed = true;
      const result = await this.deps.runtime.renameSession(name, before.session);
      if (!current()) return;
      if (!result.ok || result.conversation.id !== before.conversation.id || result.conversation.path !== before.conversation.path || result.conversation.name !== name) {
        await this.failed(before.locale); return;
      }
      await this.deps.apply(result.conversation);
    } catch { if (current()) await this.failed(before.locale); }
    finally { if (this.operation === operation) { this.operation = undefined; this.deps.changed(); } }
  }
  private options(context: RenameContext): vscode.InputBoxOptions {
    const chinese = context.locale === "zh-CN";
    return { title: chinese ? "重命名当前对话" : "Rename current conversation", value: context.conversation?.name ?? "",
      prompt: chinese ? "当前对话的名称" : "Name for the current conversation", ignoreFocusOut: true,
      validateInput: value => validSessionName(value) ? undefined : chinese ? "请输入不含控制字符或凭据的 1–200 字符名称。" : "Enter a name of 1–200 characters without control characters or credentials." };
  }
  private async failed(locale: RenameContext["locale"]): Promise<void> {
    await this.deps.notice(locale === "zh-CN"
      ? "未能验证对话名称。保留原显示名；pi 可能已修改名称，请先核对再重试。"
      : "The conversation name could not be verified. The visible name was kept; pi may already have changed it. Check pi before retrying.");
  }
}
