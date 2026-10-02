import type * as vscode from "vscode";
import { versionReport } from "./versionReport.js";
type Api = Pick<typeof vscode, "workspace" | "window" | "Uri" | "env">;
/** Plain native text only: no Webview, HTML or runtime operation. */
export class VersionInformation {
  private disposed = false;
  private operation: object | undefined;
  private registration: vscode.Disposable | undefined;
  private readonly previews = new Map<string, string>();
  constructor(private readonly api: Api, private readonly root: string, private readonly hostVersion: string | undefined,
    private readonly locale: () => "en" | "zh-CN") {}
  private register(bytes: string): vscode.Uri {
    this.registration ??= this.api.workspace.registerTextDocumentContentProvider("pi-vscode-version", {
      provideTextDocumentContent: uri => this.disposed ? "" : this.previews.get(uri.toString()) ?? (this.locale() === "zh-CN" ? "版本预览已过期，请重新运行命令。\n" : "Version preview expired; run the command again.\n"),
    });
    const uri = this.api.Uri.parse(`pi-vscode-version:/installed-versions-${++sequence}.txt`); this.previews.set(uri.toString(), bytes);
    if (this.previews.size > 4) this.previews.delete(this.previews.keys().next().value!);
    return uri;
  }
  async open(): Promise<void> {
    if (this.disposed || this.operation) return;
    const operation = {}; this.operation = operation; const locale = this.locale();
    try {
      if (this.api.env.remoteName) throw Error("Local only");
      const bytes = await versionReport(this.root, this.hostVersion, locale);
      if (this.disposed || this.operation !== operation) return;
      await this.api.window.showTextDocument(this.register(bytes), { preview: false });
    } catch {
      if (!this.disposed && this.operation === operation) await this.api.window.showWarningMessage(locale === "zh-CN"
        ? "无法打开本地版本信息，仅支持本地宿主。请再次运行命令重试。"
        : "Could not open local version information; local hosts only. Run the command again to retry.");
    } finally { if (this.operation === operation) this.operation = undefined; }
  }
  dispose(): void { this.disposed = true; this.operation = undefined; this.previews.clear(); this.registration?.dispose(); }
}
let sequence = 0;
