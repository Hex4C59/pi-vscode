import path from "node:path";
import { installedVersions, type PackageVersions } from "../diagnostics/index.js";
import { localVersionNotes, type LocalNotes } from "./localNotes.js";
function notesText(notes: LocalNotes, zh: boolean): string {
  if (notes.status === "available") return notes.text;
  const reasons = { "unknown-version": zh ? "版本未知" : "version unknown", missing: zh ? "本地无精确版本章节" : "no exact local version section",
    ambiguous: zh ? "有界前缀内章节重复" : "duplicate section in bounded prefix", budget: zh ? "超出读取／展示预算或章节不完整" : "read/display budget exceeded or section incomplete",
    unreadable: zh ? "本地说明不可读取" : "local notes unreadable" };
  return `${zh ? "对应说明不可用" : "Corresponding notes unavailable"} (${reasons[notes.reason]}).`;
}
function formatReport(versions: PackageVersions, extension: LocalNotes, runtime: LocalNotes, zh: boolean): string {
  const unknown = zh ? "未知" : "unknown";
  const text = [zh ? "Pi · 实际安装版本与本地说明" : "Pi · Installed Versions and Local Notes",
    zh ? "仅本地包信息，不是最新版检查。不会联网、下载、安装或更新。" : "Local package information only; not a newest-version check. No network, download, install or update.",
    zh ? "说明仅对应精确包版本，不代表未版本化开发改动，也不证明功能验收。" : "Notes correspond only to exact package versions, not unversioned development changes or functional acceptance.", "",
    `${zh ? "插件：" : "Extension: "}${versions.extension ?? unknown}`, `${zh ? "内置 pi：" : "Bundled pi: "}${versions.piRuntime ?? unknown}`,
    `VS Code: ${versions.vscode ?? unknown}`, "", zh ? "插件变更说明（本地）" : "Extension notes (local)", notesText(extension, zh), "",
    zh ? "上游 pi 变更说明（内置本地文档，不表示插件兼容性承诺）" : "Upstream pi notes (bundled local document; not extension compatibility promises)", notesText(runtime, zh),
  ].join("\n") + "\n";
  if (Buffer.byteLength(text) > 20 * 1024) throw Error("Version report budget");
  return text;
}
/** Fixed installation paths, never workspace files, links or remote releases. */
export async function versionReport(root: string, hostVersion: string | undefined, locale: "en" | "zh-CN"): Promise<string> {
  const versions = await installedVersions(root, hostVersion);
  const [extension, runtime] = await Promise.all([
    localVersionNotes(path.join(root, "CHANGELOG.md"), versions.extension),
    localVersionNotes(path.join(root, "node_modules/@earendil-works/pi-coding-agent/CHANGELOG.md"), versions.piRuntime),
  ]);
  return formatReport(versions, extension, runtime, locale === "zh-CN");
}
