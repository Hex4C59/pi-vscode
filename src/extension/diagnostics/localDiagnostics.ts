import type * as vscode from "vscode";
import { installedVersions } from "./packageVersions.js";
import { diagnosticSnapshot, type DiagnosticState } from "./diagnosticSnapshot.js";
import { publishLocalReport, DiagnosticCleanupError } from "./publishLocalReport.js";
type Api = Pick<typeof vscode, "workspace" | "window" | "Uri" | "env">;
/** An exact read-only preview is frozen until explicit native review/save or cancellation. */
export class LocalDiagnostics {
  private disposed = false;
  private operation: object | undefined;
  private registration: vscode.Disposable | undefined;
  private readonly previews = new Map<string, string>();
  constructor(private readonly api: Api, private readonly root: string, private readonly hostVersion: string | undefined,
    private readonly snapshot: () => DiagnosticState) {}
  private current(operation: object): boolean { return !this.disposed && this.operation === operation; }
  private register(bytes: string): vscode.Uri {
    this.registration ??= this.api.workspace.registerTextDocumentContentProvider("pi-vscode-diagnostics", { provideTextDocumentContent: uri => this.disposed ? "" : this.previews.get(uri.toString()) ?? '{"unavailable":"Run the export command for a fresh snapshot."}\n' });
    // A unique URI avoids VS Code reusing cached bytes from an earlier report.
    const uri = this.api.Uri.parse(`pi-vscode-diagnostics:/diagnostic-${++sequence}.json`);
    this.previews.set(uri.toString(), bytes);
    if (this.previews.size > 8) this.previews.delete(this.previews.keys().next().value!);
    return uri;
  }
  async open(): Promise<void> {
    if (this.disposed || this.operation) return;
    const operation = {}; this.operation = operation; const state = { ...this.snapshot() }; const zh = state.locale === "zh-CN";
    const exportLabel = zh ? "导出已审查快照" : "Export reviewed snapshot";
    try {
      if (this.api.env.remoteName) throw Error("Local only");
      const versions = await installedVersions(this.root, this.hostVersion);
      if (!this.current(operation)) return;
      const frozen = diagnosticSnapshot(versions, state);
      await this.api.window.showTextDocument(this.register(frozen), { preview: false });
      if (!this.current(operation)) return;
      const consent = await this.api.window.showInformationMessage(zh
        ? "请审查只读诊断 JSON。仅含版本及状态标记，不含源码、会话、凭据、路径或错误正文；不会上传。可先阅读编辑器，再导出或取消。"
        : "Review the read-only diagnostic JSON. Versions and state flags only; no source, sessions, credentials, paths or error bodies. No upload. Read the editor before exporting or cancelling.", exportLabel, zh ? "取消" : "Cancel");
      if (!this.current(operation) || consent !== exportLabel) return;
      const destination = await this.api.window.showSaveDialog({ title: zh ? "导出本地诊断（须新文件）" : "Export local diagnostics (new file required)", filters: { JSON: ["json"] }, saveLabel: exportLabel });
      if (!destination || !this.current(operation)) return;
      if (destination.scheme !== "file") throw Error("Local only");
      const published = await publishLocalReport(destination.fsPath, frozen, () => this.current(operation));
      if (published && this.current(operation)) await this.api.window.showInformationMessage(zh ? "本地诊断已导出；未上传。" : "Local diagnostics exported; nothing uploaded.");
    } catch (error) {
      if (this.current(operation) && error instanceof DiagnosticCleanupError && error.published) {
        await this.api.window.showWarningMessage(zh ? "诊断文件已导出，但自有临时数据清理未完成；未上传。" : "Diagnostics were exported, but owned temporary cleanup was incomplete; nothing uploaded.");
        return;
      }
      if (this.current(operation)) await this.api.window.showWarningMessage(zh
        ? "无法预览或导出本地诊断。仅支持本地新文件；不会覆盖已有文件。请再次运行命令重试。"
        : "Could not preview or export local diagnostics. Choose a new local file; existing files are never overwritten. Run the command again to retry.");
    } finally { if (this.operation === operation) this.operation = undefined; }
  }
  dispose(): void { this.disposed = true; this.operation = undefined; this.previews.clear(); this.registration?.dispose(); }
}
let sequence = 0;
