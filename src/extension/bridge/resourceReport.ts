import type * as vscode from "vscode";
import type { CommandCatalogueStateMessage, PluginInventoryProjection } from "../contracts/index.js";

type Snapshot = {
  locale: "en" | "zh-CN";
  runtime: string;
  catalogue: Pick<CommandCatalogueStateMessage, "status" | "rows">;
  inventory: PluginInventoryProjection | null;
};
type Api = Pick<typeof vscode, "workspace" | "window" | "Uri" | "EventEmitter">;
const SCHEME = "pi-vscode-resources";
const NAME_LIMIT = 100;

function category(snapshot: Snapshot, source: "prompt" | "skill" | "extension"): string {
  const zh = snapshot.locale === "zh-CN";
  const label = source === "prompt" ? (zh ? "模板定义" : "Prompt template definitions")
    : source === "skill" ? (zh ? "Skill 定义" : "Skill definitions") : (zh ? "扩展命令" : "Extension commands");
  const known = snapshot.catalogue.status === "ready" || snapshot.catalogue.status === "empty";
  if (!known) return `${label}: ${zh ? "未知（目录不可用）" : "unknown (catalogue unavailable)"}`;
  const rows = snapshot.catalogue.rows.filter(row => row.source === source);
  const state = source === "extension" ? (zh ? "已登记" : "registered") : (zh ? "已加载" : "loaded");
  const lines = [`${label}: ${rows.length} ${state}`, ...rows.slice(0, NAME_LIMIT).map(row => `  ${row.name}`)];
  if (rows.length > NAME_LIMIT) lines.push(zh ? `  已省略 ${rows.length - NAME_LIMIT} 个名称` : `  ${rows.length - NAME_LIMIT} names omitted`);
  return lines.join("\n");
}

function inventorySummary(snapshot: Snapshot): string {
  const zh = snapshot.locale === "zh-CN";
  const inventory = snapshot.inventory;
  const label = zh ? "本机插件清单" : "Local plugin inventory";
  if (!inventory || inventory.error || inventory.busy) return `${label}: ${zh ? "未知／不可用" : "unknown/unavailable"}`;
  const enabled = inventory.entries.filter(entry => entry.enabled).length;
  return zh ? `${label}: ${inventory.entries.length} 已登记，${enabled} 已启用（供下次空闲 Trusted 应用）；不是 runtime 加载证明。`
    : `${label}: ${inventory.entries.length} registered, ${enabled} enabled for next idle Trusted apply; not proof of runtime loading.`;
}

function content(snapshot: Snapshot): string {
  const zh = snapshot.locale === "zh-CN";
  const loading = snapshot.catalogue.status === "loading";
  const available = snapshot.catalogue.status === "ready" || snapshot.catalogue.status === "empty";
  const catalogue = zh ? (loading ? "正在启动" : available ? "可用" : "不可用") : (loading ? "starting" : available ? "available" : "unavailable");
  return [
    zh ? "Pi · 资源加载报告" : "Pi · Resource Loading Report",
    zh ? "只读实时报告；证据来自当前 runtime 的 get_commands 快照，不重新读取上下文文件。" : "Read-only live report; evidence is the current runtime get_commands snapshot, not a fresh read of context files.",
    `${zh ? "Runtime 状态" : "Runtime state"}: ${snapshot.runtime}; ${zh ? "命令目录" : "command catalogue"}: ${catalogue}`,
    "", zh ? "AGENTS.md：未知（公开 RPC 不枚举实际加载的上下文文件）。" : "AGENTS.md: unknown (public RPC does not enumerate loaded context files).",
    "", category(snapshot, "prompt"), zh ? "定义已加载不代表已调用模板。" : "Loaded definitions do not prove template invocation.",
    "", category(snapshot, "skill"), zh ? "Skill 正文进入上下文：未知；定义可发现不代表正文已读取。" : "Skill bodies in context: unknown; discoverable definitions do not prove body reads.",
    "", category(snapshot, "extension"), zh ? "扩展文件加载：未知；命令登记不能枚举所有扩展，也不能证明任意扩展兼容。" : "Extension files loaded: unknown; registered commands cannot enumerate all extensions or prove arbitrary compatibility.",
    "", inventorySummary(snapshot),
    "", zh ? "报告不包含源路径、正文或凭据。不改变任务、加载权限或清单。" : "No source paths, bodies or credentials. Reading does not change the task, loading permissions or inventory.",
  ].join("\n");
}

/** Native read-only text, with no renderer scripts, file writes or additional runtime calls. */
export class ResourceReport implements vscode.Disposable {
  private readonly uri: vscode.Uri;
  private readonly changed: vscode.EventEmitter<vscode.Uri>;
  private registration: vscode.Disposable | undefined;
  private previous = "";
  private disposed = false;
  constructor(private readonly api: Api, private readonly snapshot: () => Snapshot) {
    this.uri = api.Uri.parse(`${SCHEME}:/resource-loading.txt`);
    this.changed = new api.EventEmitter<vscode.Uri>();
  }
  private register(): void {
    if (this.registration) return;
    this.registration = this.api.workspace.registerTextDocumentContentProvider(SCHEME, {
      onDidChange: this.changed.event,
      provideTextDocumentContent: () => this.disposed ? "" : content(this.snapshot()),
    });
  }
  async open(): Promise<void> {
    if (this.disposed) return;
    this.register();
    this.publish();
    try { await this.api.window.showTextDocument(this.uri, { preview: false }); }
    catch {
      if (!this.disposed) await this.api.window.showWarningMessage(this.snapshot().locale === "zh-CN"
        ? "无法打开资源加载报告。请再次运行该命令重试。" : "Could not open the resource loading report. Run the command again to retry.");
    }
  }
  publish(): void {
    if (this.disposed || !this.registration) return;
    const next = content(this.snapshot());
    if (next === this.previous) return;
    this.previous = next;
    this.changed.fire(this.uri);
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.registration?.dispose();
    this.changed.dispose();
  }
}
