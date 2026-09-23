import { open, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type * as vscode from "vscode";
import type { ChangeReviewEntry, ChangeReviewStateMessage, ReviewReason } from "../contracts/index.js";
import type { GateCall } from "../contracts/index.js";
import { unambiguousPath } from "./toolApproval.js";
import { resolveWriteTargetPath } from "./writeProtection.js";

type Host = Pick<typeof vscode, "workspace" | "window" | "commands" | "Uri" | "RelativePattern" | "EventEmitter">;
type ReviewSnapshot = { text: string; bytes: number; exists: boolean; target: string; relative: string; revision: string };
type Capture = { image: ReviewSnapshot } | { reason: ReviewReason };
type ReviewRecord = { entry: ChangeReviewEntry; requested: string; started: number; finished?: number; before?: ReviewSnapshot; after?: ReviewSnapshot; finalizing?: boolean };
const MAX_IMAGE = 262144;
const MAX_BYTES = 8388608;
const SCHEME = "pi-vscode-review";
const samePath = (a: string, b: string) => process.platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b;
const sensitive = (value: string) => value.split(/[\\/]/).some(part => /^(?:\.local-env|\.ssh|\.git|\.env(?:\..*)?|auth\.json|credentials\.json|id_rsa|id_ed25519)$/i.test(part) || /\.(pem|key|p12|pfx)$/i.test(part));
const revision = (info: { dev: number; ino: number; size: number; mtimeMs: number; ctimeMs: number }) => JSON.stringify([info.dev, info.ino, info.size, info.mtimeMs, info.ctimeMs]);
function relativeInside(root: string, target: string): string | undefined {
  const relative = path.relative(root, target);
  return relative && relative !== ".." && !relative.startsWith(".." + path.sep) && !path.isAbsolute(relative) && Buffer.byteLength(relative, "utf8") <= 1024 ? relative : undefined;
}
async function captureDisk(root: string, requested: string): Promise<Capture> {
  if (!unambiguousPath(requested) || /^[\\/]{2}/.test(requested)) return { reason: "unavailable" };
  if (sensitive(requested)) return { reason: "sensitive-source" };
  try {
    const canonicalRoot = await realpath(root);
    let ancestor = requested; const suffix: string[] = []; let target: string;
    for (;;) {
      try { target = path.join(await realpath(ancestor), ...suffix); break; }
      catch (error) {
        if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT" || path.dirname(ancestor) === ancestor) throw error;
        suffix.unshift(path.basename(ancestor)); ancestor = path.dirname(ancestor);
      }
    }
    if (!unambiguousPath(target) || /^[\\/]{2}/.test(target)) return { reason: "unavailable" };
    if (sensitive(target)) return { reason: "sensitive-source" };
    const relative = relativeInside(canonicalRoot, target);
    if (!relative) return { reason: "outside-project" };
    let handle;
    try { handle = await open(target, "r"); }
    catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return { image: { text: "", bytes: 0, exists: false, target, relative, revision: "missing" } };
      throw error;
    }
    try {
      const before = await handle.stat();
      if (!before.isFile()) return { reason: "not-text" };
      if (before.size > MAX_IMAGE) return { reason: "too-large" };
      const buffer = Buffer.alloc(MAX_IMAGE + 1); let length = 0;
      while (length <= MAX_IMAGE) { const result = await handle.read(buffer, length, buffer.length - length, length); if (!result.bytesRead) break; length += result.bytesRead; }
      if (length > MAX_IMAGE) return { reason: "too-large" };
      let text: string;
      try { text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(buffer.subarray(0, length)); } catch { return { reason: "not-text" }; }
      if (text.includes("\0")) return { reason: "not-text" };
      if (/-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/i.test(text) || /["']?(?:api[_ -]?key|authorization|password|secret|access[_ -]?token)["']?\s*[:=]\s*["']?[^\s"',;}]+/i.test(text)) return { reason: "sensitive-source" };
      const after = await handle.stat(); const currentTarget = await realpath(requested);
      if (revision(before) !== revision(after) || !samePath(target, currentTarget) || revision(await stat(target)) !== revision(after)) return { reason: "changed-during-capture" };
      return { image: { text, bytes: length, exists: true, target, relative, revision: revision(after) } };
    } finally { await handle.close(); }
  } catch { return { reason: "unavailable" }; }
}
async function capture(root: string, requested: string): Promise<Capture> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { return await Promise.race([captureDisk(root, requested), new Promise<Capture>(resolve => { timer = setTimeout(() => resolve({ reason: "unavailable" }), 2000); })]); }
  finally { clearTimeout(timer); }
}

/** Live-session review snapshots and named native editor operations; never writes project files. */
export class ChangeReview implements vscode.Disposable {
  private records: ReviewRecord[] = [];
  private calls = new Map<string, ReviewRecord>();
  private epoch = 0;
  private sequence = 0;
  private root = "";
  private task: string | undefined;
  private retainedBytes = 0;
  private limited = false;
  private resetNotice = false;
  private error: "unavailable" | "stale" | null = null;
  private opening: object | undefined;
  private publication: object | undefined;
  private observations = new Map<string, string>();
  private observing: object | undefined;
  private watcherSubscriptions: vscode.Disposable[] = [];
  private readonly contentChanged: vscode.EventEmitter<vscode.Uri>;
  private readonly contentProvider: vscode.Disposable;
  constructor(private readonly api: Host, private readonly changed: () => void) {
    this.contentChanged = new api.EventEmitter<vscode.Uri>();
    this.contentProvider = api.workspace.registerTextDocumentContentProvider(SCHEME, {
      onDidChange: this.contentChanged.event,
      provideTextDocumentContent: uri => {
        const match = /^\/([A-Za-z0-9_-]{1,100})\/(before|after)$/.exec(uri.path);
        const record = match && this.records.find(item => item.entry.id === match[1]);
        return record && (match?.[2] === "before" ? record.before : record.after)?.text !== undefined
          ? (match?.[2] === "before" ? record.before : record.after)?.text ?? ""
          : "This live-session review snapshot is no longer available.";
      },
    });
  }
  snapshot(): Omit<ChangeReviewStateMessage, "version" | "viewId" | "generation" | "type"> {
    return { entries: this.records.map(record => ({ ...record.entry })), retainedBytes: this.retainedBytes, limited: this.limited, reset: this.resetNotice, error: this.error };
  }
  beginTask(root: string, taskId: string): void {
    this.root = root; this.task = taskId; this.error = null;
    if (!this.watcherSubscriptions.length) {
      const watcher = this.api.workspace.createFileSystemWatcher(new this.api.RelativePattern(root, "**/*"));
      const observed = (uri: vscode.Uri) => this.observe(uri);
      this.watcherSubscriptions = [watcher, watcher.onDidCreate(observed), watcher.onDidChange(observed), watcher.onDidDelete(observed)];
    }
  }
  endTask(): void {
    this.task = undefined;
    for (const record of this.records) if (record.entry.status === "pending" && !record.finalizing) { record.entry.status = "interrupted"; record.entry.diff = "unavailable"; record.entry.reason = "unavailable"; }
    this.changed();
  }
  private add(entry: ChangeReviewEntry, requested: string): ReviewRecord | undefined {
    if (this.records.length >= 128) { if (!this.limited) { this.limited = true; this.publishSoon(); } return; }
    const record = { entry, requested, started: ++this.sequence }; this.records.push(record); return record;
  }
  private retain(record: ReviewRecord, side: "before" | "after", result: Capture): void {
    if (!("image" in result)) { record.entry.reason = result.reason; record.entry.diff = "unavailable"; return; }
    const image = result.image;
    record.entry.path = image.relative;
    if (this.retainedBytes + image.bytes > MAX_BYTES) { this.limited = true; record.entry.reason = "retention-limit"; record.entry.diff = "unavailable"; return; }
    record[side] = image; this.retainedBytes += image.bytes;
  }
  async beforeWrite(call: GateCall): Promise<void> {
    if (!this.task || !["write", "edit"].includes(call.tool) || typeof call.input.path !== "string" || this.calls.has(call.toolCallId)) return;
    let requested: string;
    try { requested = resolveWriteTargetPath(call.input.path, call.cwd); } catch { return; }
    const epoch = this.epoch;
    const record = this.add({ id: randomUUID(), taskId: this.task, path: null, source: "tool", tool: call.tool === "write" ? "write" : "edit", status: "pending", diff: "pending", reason: null, sourceChanged: false, overlap: false }, requested);
    if (!record) return;
    this.calls.set(call.toolCallId, record); this.markOverlap(record);
    const result = await capture(this.root, requested);
    if (epoch !== this.epoch || this.calls.get(call.toolCallId) !== record) return;
    this.retain(record, "before", result);
    this.markOverlap(record);
    this.changed();
  }
  private markOverlap(record: ReviewRecord): void {
    for (const other of this.records) if (other !== record && other.entry.source === "tool"
      && (other.finished === undefined || other.finished >= record.started)
      && (record.finished === undefined || record.finished >= other.started)
      && samePath(other.before?.target ?? other.requested, record.before?.target ?? record.requested)) {
      other.entry.overlap = true; record.entry.overlap = true;
    }
  }
  discardWrite(toolCallId: string): void {
    const record = this.calls.get(toolCallId); if (!record) return;
    this.calls.delete(toolCallId); this.records = this.records.filter(item => item !== record);
    this.retainedBytes -= (record.before?.bytes ?? 0) + (record.after?.bytes ?? 0);
    this.changed();
  }
  async finishTool(toolCallId: string, failed: boolean): Promise<void> {
    const record = this.calls.get(toolCallId); if (!record || record.finalizing) return;
    const epoch = this.epoch; record.finalizing = true;
    const result = await capture(this.root, record.requested);
    if (epoch !== this.epoch || this.calls.get(toolCallId) !== record) return;
    this.retain(record, "after", result);
    record.entry.status = failed ? "failed" : "complete";
    if (record.before && record.after) {
      record.entry.diff = record.before.text === record.after.text && record.before.exists === record.after.exists ? "unchanged" : "ready";
      record.entry.reason = null;
    } else { record.entry.diff = "unavailable"; record.entry.reason ??= "no-before-snapshot"; }
    record.finished = ++this.sequence; this.calls.delete(toolCallId); this.changed();
  }
  private publishSoon(): void {
    if (this.publication) return;
    const token = {}; this.publication = token;
    queueMicrotask(() => { if (this.publication !== token) return; this.publication = undefined; this.changed(); });
  }
  private observe(uri: vscode.Uri): void {
    if (uri.scheme !== "file" || !this.root || sensitive(uri.fsPath)) return;
    const relative = relativeInside(this.root, uri.fsPath); if (!relative) return;
    if (this.task && !this.records.some(record => record.entry.source === "observed" && record.entry.taskId === this.task && samePath(record.requested, uri.fsPath))) {
      if (this.add({ id: randomUUID(), taskId: this.task, path: relative, source: "observed", tool: null, status: "observed", diff: "unavailable", reason: "no-before-snapshot", sourceChanged: false, overlap: false }, uri.fsPath)) this.publishSoon();
    }
    if (!this.records.some(record => record.after && !record.entry.sourceChanged && samePath(record.requested, uri.fsPath))) return;
    // Only retained paths enter the queue (at most 128); repeated events coalesce.
    const key = process.platform === "win32" ? uri.fsPath.toLowerCase() : uri.fsPath;
    this.observations.set(key, uri.fsPath);
    if (!this.observing) void this.observeQueued();
  }
  private async observeQueued(): Promise<void> {
    const token = {}; this.observing = token; const epoch = this.epoch;
    try {
      while (epoch === this.epoch && this.observations.size) {
        const [key, requested] = this.observations.entries().next().value as [string, string]; this.observations.delete(key);
        // Stat the current requested path, not an old resolved target after a link retarget.
        const current = await stat(requested).then(revision, () => "missing");
        if (epoch !== this.epoch) return;
        for (const record of this.records) if (record.after && !record.entry.sourceChanged && samePath(record.requested, requested) && current !== record.after.revision) {
          record.entry.sourceChanged = true; this.publishSoon();
        }
      }
    } finally { if (this.observing === token) this.observing = undefined; }
  }
  async open(id: string, operation: "diff" | "source", current: () => boolean): Promise<void> {
    if (this.opening || !current()) return;
    const token = {}; this.opening = token;
    try {
    const record = this.records.find(item => item.entry.id === id); const epoch = this.epoch;
    if (!record) { this.error = "stale"; this.changed(); return; }
    const actual = await capture(this.root, record.requested);
    if (epoch !== this.epoch || !current()) return;
    const baseline = record.after;
    if (baseline && (!("image" in actual) || actual.image.revision !== baseline.revision)) record.entry.sourceChanged = true;
    this.error = null;
    try {
      if (operation === "diff") {
        if (!record.before || !record.after) { this.error = "unavailable"; this.changed(); return; }
        const before = this.api.Uri.parse(SCHEME + ":/" + id + "/before"); const after = this.api.Uri.parse(SCHEME + ":/" + id + "/after");
        await this.api.commands.executeCommand("vscode.diff", before, after, "Captured before → after: " + (record.entry.path ?? "file") + (record.before.exists ? "" : " (created)") + (record.after.exists ? "" : " (deleted)"), { preview: false });
      } else {
        if (!("image" in actual) || !actual.image.exists) { this.error = "unavailable"; this.changed(); return; }
        await this.api.window.showTextDocument(this.api.Uri.file(actual.image.target), { preview: false });
      }
    } catch { if (epoch === this.epoch && current()) this.error = "unavailable"; }
    if (epoch === this.epoch && current()) this.changed();
    } finally { if (this.opening === token) this.opening = undefined; }
  }
  clear(): void {
    const prior = this.records; this.epoch++; this.opening = undefined; this.publication = undefined; this.observing = undefined; this.observations.clear(); this.task = undefined; this.calls.clear(); this.records = []; this.retainedBytes = 0; this.error = null;
    this.resetNotice ||= prior.length > 0 || this.limited; this.limited = false; this.root = "";
    for (const subscription of this.watcherSubscriptions) subscription.dispose(); this.watcherSubscriptions = [];
    for (const record of prior) for (const side of ["before", "after"]) this.contentChanged.fire(this.api.Uri.parse(SCHEME + ":/" + record.entry.id + "/" + side));
    this.changed();
  }
  dispose(): void { this.clear(); this.contentProvider.dispose(); this.contentChanged.dispose(); }
}
