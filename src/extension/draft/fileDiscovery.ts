import type * as vscode from "vscode";
import { AttachmentFailure, discoverableAttachmentPath } from "./fileAttachment.js";

type Api = Pick<typeof vscode, "workspace" | "window" | "RelativePattern" | "EventEmitter">;
type Item = vscode.QuickPickItem & { uri: vscode.Uri };
const PATH_LIMIT = 3000;
const SEARCH_DEADLINE_MS = 15000;
const PICKER_DEADLINE_MS = 120000;

/** Ephemeral native metadata discovery; only DraftSubmission may capture a chosen source. */
export class FileDiscovery {
  constructor(private readonly api: Api, private readonly locale: () => "en" | "zh-CN") {}

  async pick(root: string, query: string, current: () => boolean): Promise<readonly vscode.Uri[] | undefined> {
    const cancellation = new this.api.EventEmitter<void>();
    let cancelled = false;
    const token: vscode.CancellationToken = { get isCancellationRequested() { return cancelled; }, onCancellationRequested: cancellation.event };
    const stop = () => { cancelled = true; cancellation.fire(); };
    const timer = setTimeout(stop, SEARCH_DEADLINE_MS);
    const watcher = setInterval(() => { if (!current()) stop(); }, 50);
    try {
      const search = this.api.workspace.findFiles(new this.api.RelativePattern(root, "**/*"), undefined, PATH_LIMIT + 1, token);
      const deadline = new Promise<never>((_resolve, reject) => token.onCancellationRequested(() => reject(new AttachmentFailure("preparation-cancelled"))));
      const paths = await Promise.race([search, deadline]);
      clearTimeout(timer);
      if (!current() || cancelled) throw new AttachmentFailure("preparation-cancelled");
      const items = this.items(root, paths);
      return await this.choose(items, query, paths.length > PATH_LIMIT, current);
    } finally { clearTimeout(timer); clearInterval(watcher); cancellation.dispose(); }
  }

  private items(root: string, paths: readonly vscode.Uri[]): Item[] {
    const unique = new Map<string, Item>();
    for (const uri of paths.slice(0, PATH_LIMIT + 1)) {
      const label = discoverableAttachmentPath(root, uri);
      if (label && !unique.has(label)) unique.set(label, { label, uri });
    }
    return [...unique.values()].sort((a, b) => a.label.localeCompare(b.label)).slice(0, PATH_LIMIT);
  }

  private choose(items: Item[], query: string, truncated: boolean, current: () => boolean): Promise<readonly vscode.Uri[] | undefined> {
    const zh = this.locale() === "zh-CN";
    if (!items.length) throw new AttachmentFailure("unavailable");
    const picker = this.api.window.createQuickPick<Item>();
    picker.items = items; picker.value = query; picker.matchOnDescription = true; picker.matchOnDetail = true;
    picker.title = truncated ? (zh ? "前 3000 个工作区文件（列表不完整）" : "First 3000 workspace files (limited list)") : (zh ? "附加工作区文件" : "Attach workspace file");
    picker.placeholder = zh ? "模糊搜索名称／路径；选择后检查内容。Esc 取消；2 分钟后过期。" : "Fuzzy name/path search; content checked after selection. Esc cancels; expires in 2 minutes.";
    return new Promise(resolve => {
      let finished = false;
      const finish = (selected?: vscode.Uri) => {
        if (finished) return; finished = true;
        clearInterval(watcher); clearTimeout(timer);
        accepted.dispose(); hidden.dispose(); picker.dispose();
        resolve(selected && current() ? [selected] : undefined);
      };
      const accepted = picker.onDidAccept(() => { const item = picker.selectedItems[0]; finish(item && items.includes(item) ? item.uri : undefined); });
      const hidden = picker.onDidHide(() => finish());
      const watcher = setInterval(() => { if (!current()) finish(); }, 50);
      const timer = setTimeout(() => finish(), PICKER_DEADLINE_MS);
      try { picker.show(); } catch { finish(); }
    });
  }
}
