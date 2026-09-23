import type * as vscode from "vscode";
import { randomBytes } from "node:crypto";
import type { PiRuntimeLifecycle } from "../contracts/runtimeLifecycle.js";
import type { WebviewMessage, AttachmentStateMessage, AttachmentHistoryEntry, AttachmentDetails, SelectionRange } from "../bridge/webviewMessages.js";
import { AttachmentFailure, captureFile, captureSelection, revalidateFile, validateEditorSnapshot, selectionSourceRevision, sameSelectionSource, validateSelectionDocument, type SelectionSourceRevision, type AttachmentCode, type FileSnapshot } from "./fileAttachment.js";

type DraftContext = Readonly<{
  generation: number; session: number; viewId: string; view: vscode.WebviewView | undefined;
  cwd: string | undefined; disposed: boolean; ready: boolean; eligible: boolean;
}>;
type SubmissionEvents = {
  accepted(body: string): void;
  attempted(submissionId: string): void;
  failed(message: string): void;
  settled(): void;
  changed(): void;
};

type DraftAttachment = { attachmentId: string; snapshotId: string; source: FileSnapshot; state: "attached" | "changed" | "confirmation-required" | "unavailable" } & (
  { kind: "file" } | { kind: "selection"; originalRange: SelectionRange; stale: boolean; authorized: SelectionSourceRevision; observed?: SelectionSourceRevision }
);
type Submission = AttachmentHistoryEntry & { text: string; body: string; draftRevision: number };
function attachmentDetails(attachment: AttachmentDetails): AttachmentDetails {
  return attachment.kind === "selection" ? { kind: "selection", originalRange: attachment.originalRange, stale: attachment.stale } : { kind: "file" };
}
const opaqueId = () => randomBytes(16).toString("hex");

/** Owns the editor draft, atomic submission ledger and view-bound preparation/preview work. */
export class DraftSubmission implements vscode.Disposable {
  private draftRevision = 0;
  private draftText = "";
  private acceptedEditSequence = 0;
  private attachments: DraftAttachment[] = [];
  private preparation: "idle" | "picking" | "preparing" = "idle";
  private attachmentToken: object = {};
  private attachmentResult: AttachmentCode | null = null;
  private history: Submission[] = [];
  private retainedBytes = 0;
  private lastSubmission: { submissionId: string; draftRevision: number; delivery: string; outcome: string } | null = null;
  private awaitingAck = false;
  private submissionEpoch = 0;
  private previewOperation: object | undefined;
  private disposed = false;
  private readonly subscriptions: vscode.Disposable[];
  constructor(
    private readonly api: Pick<typeof vscode, "workspace" | "window">,
    private readonly runtime: Pick<PiRuntimeLifecycle, "preparePrompt">,
    private readonly context: (refresh?: boolean) => DraftContext,
    private readonly send: (message: unknown) => void,
    private readonly events: SubmissionEvents,
  ) {
    this.subscriptions = [
      api.workspace.onDidChangeTextDocument(event => {
        const matching = this.attachments.filter(a => a.source.document === event.document);
        for (const a of matching) { a.state = "changed"; if (a.kind === "selection") { a.stale = true; a.observed = undefined; } }
        if (matching.length) this.publish();
      }),
      api.workspace.onDidCloseTextDocument(document => {
        const matching = this.attachments.filter(a => a.source.document === document);
        for (const a of matching) a.state = "unavailable";
        if (matching.length) this.publish();
      }),
    ];
  }
  get revision(): number { return this.draftRevision; }
  get awaitingAcknowledgement(): boolean { return this.awaitingAck; }
  private attachmentEligible(): boolean { const context = this.context(); return !this.disposed && !context.disposed && context.eligible && !!context.cwd && !this.awaitingAck; }
  private attachmentEnvelope<T extends string>(type: T) {
    const { generation, viewId } = this.context();
    return { version: 2 as const, type, generation, viewId };
  }
  rejectStale(): void { this.attachmentResult = "stale"; this.publish(); }
  openView(): void { this.acceptedEditSequence = 0; }
  closeView(): void { this.previewOperation = undefined; this.attachmentToken = {}; this.preparation = "idle"; }
  clearText(): void { this.draftText = ""; }
  reset(clearResult = false): void {
    this.submissionEpoch++;
    this.closeView();
    if (clearResult) this.attachmentResult = null;
    else if (this.attachments.length || this.history.length) this.attachmentResult = "runtime-lost";
    this.attachments = []; this.history = []; this.retainedBytes = 0; this.lastSubmission = null;
    this.awaitingAck = false; this.draftRevision = Math.min(Number.MAX_SAFE_INTEGER, this.draftRevision + 1);
  }
  runtimeLost(): void {
    this.submissionEpoch++;
    this.closeView(); this.attachments = []; this.draftRevision = Math.min(Number.MAX_SAFE_INTEGER, this.draftRevision + 1);
    this.history = []; this.retainedBytes = 0; this.awaitingAck = false; this.attachmentResult = "runtime-lost";
    if (this.lastSubmission) { this.lastSubmission.delivery = "unknown"; this.lastSubmission.outcome = "interrupted"; }
    this.publish();
  }
  cancelPreparation(): number | undefined {
    if (this.preparation === "idle") return;
    this.attachmentToken = {}; this.preparation = "idle";
    this.draftRevision = Math.min(Number.MAX_SAFE_INTEGER, this.draftRevision + 1);
    this.attachmentResult = "preparation-cancelled"; this.publish();
    return this.draftRevision;
  }
  /** Settlement and RPC acknowledgement are independent; admit no new task until both finish. */
  settle(interrupted: boolean): boolean {
    if (this.lastSubmission) {
      this.lastSubmission.outcome = interrupted ? "interrupted" : "settled";
      for (const record of this.history.filter(item => item.submissionId === this.lastSubmission?.submissionId)) record.outcome = this.lastSubmission.outcome;
      this.publish();
    }
    return !this.awaitingAck;
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true; this.reset(); this.clearText();
    for (const subscription of this.subscriptions) subscription.dispose();
  }
  handle(view: vscode.WebviewView, message: WebviewMessage): Promise<boolean> | undefined {
    switch (message.type) {
      case "updateDraft": case "confirmSelectionAttachment": case "confirmFileAttachment":
      case "addSelectionAttachment": case "addFileAttachment": case "removeAttachment":
      case "getAttachmentHistory": case "getAttachmentPreview": case "sendChat":
        return this.receive(view, message);
      default: return undefined;
    }
  }
  private async receive(view: vscode.WebviewView, message: WebviewMessage): Promise<boolean> {
    if (this.disposed) return false;
    if ("draftRevision" in message && (this.draftRevision === Number.MAX_SAFE_INTEGER || message.draftRevision !== this.draftRevision)) {
      this.rejectStale(); return true;
    }
    if (message.type === "updateDraft") {
      if (message.editSequence <= this.acceptedEditSequence || this.draftRevision >= Number.MAX_SAFE_INTEGER) { this.attachmentResult = "stale"; this.publish(); return true; }
      this.attachmentToken = {}; this.preparation = "idle"; this.draftText = message.text; this.draftRevision = Math.min(Number.MAX_SAFE_INTEGER, this.draftRevision + 1); this.acceptedEditSequence = message.editSequence; this.attachmentResult = null; this.publish(); return true;
    }
    if (message.type === "confirmSelectionAttachment") { await this.confirmAttachment(view, message.attachmentId, message.snapshotId, "selection"); return true; }
    if (message.type === "confirmFileAttachment") { await this.confirmAttachment(view, message.attachmentId, message.snapshotId, "file"); return true; }
    if (message.type === "addSelectionAttachment") { await this.addAttachment(view, "selection"); return true; }
    if (message.type === "addFileAttachment") { await this.addAttachment(view); return true; }
    if (message.type === "removeAttachment") {
      if (!this.attachments.some(a => a.attachmentId === message.attachmentId)) this.attachmentResult = "stale";
      else { this.attachmentToken = {}; this.preparation = "idle"; this.attachments = this.attachments.filter(a => a.attachmentId !== message.attachmentId); this.draftRevision = Math.min(Number.MAX_SAFE_INTEGER, this.draftRevision + 1); this.attachmentResult = null; }
      this.publish(); return true;
    }
    if (message.type === "getAttachmentHistory") { this.send({ ...this.attachmentEnvelope("attachmentHistory"), entries: this.history.map(record => this.historyMetadata(record)) }); return true; }
    if (message.type === "getAttachmentPreview") {
      if (this.previewOperation) { this.send({ ...this.attachmentEnvelope("attachmentPreview"), requestId: message.requestId, code: "busy" }); return true; }
      const snapshot = this.attachments.find(a => a.snapshotId === message.snapshotId)?.source ?? this.history.find(record => record.snapshotId === message.snapshotId);
      const text = snapshot?.text; const offset = message.offset;
      if (text === undefined || offset > text.length || (offset > 0 && /[\uDC00-\uDFFF]/.test(text[offset] ?? "") && /[\uD800-\uDBFF]/.test(text[offset - 1]))) {
        this.send({ ...this.attachmentEnvelope("attachmentPreview"), requestId: message.requestId, code: "stale" }); return true;
      }
      let end = Math.min(text.length, offset + 16384);
      if (end < text.length && /[\uD800-\uDBFF]/.test(text[end - 1]) && /[\uDC00-\uDFFF]/.test(text[end])) end--;
      const response = { ...this.attachmentEnvelope("attachmentPreview"), requestId: message.requestId, snapshotId: message.snapshotId, offset, nextOffset: end, done: end === text.length, text: text.slice(offset, end) };
      if (Buffer.byteLength(JSON.stringify(response), "utf8") <= 131072) {
        const operation = {}; this.previewOperation = operation;
        try { await view.webview.postMessage(response); } catch { /* View teardown; never log text. */ }
        finally { if (this.previewOperation === operation) this.previewOperation = undefined; }
      }
      return true;
    }
    if (message.type === "sendChat") { await this.submitDraft(view); return true; }
    return false;
  }

  publish(): void {
    if (!this.context().view || this.disposed || this.context().disposed) return;
    this.send({ ...this.attachmentEnvelope("attachmentState"),
      draft: { revision: this.draftRevision, text: this.draftText, acceptedEditSequence: this.acceptedEditSequence,
        attachments: this.attachments.map(a => ({ attachmentId: a.attachmentId, snapshotId: a.snapshotId, relativePath: a.source.relativePath, ...attachmentDetails(a), utf8Bytes: a.source.utf8Bytes, unsaved: a.source.unsaved, state: a.state })) },
      preparation: this.preparation, result: this.attachmentResult ? { code: this.attachmentResult } : null,
      historyCount: this.history.length, retainedBytes: this.retainedBytes, lastSubmission: this.lastSubmission } satisfies AttachmentStateMessage);
  }

  private checkAttachmentBounds(attachments: DraftAttachment[]): void {
    if (attachments.length > 20) throw new AttachmentFailure("attachment-limit");
    if (attachments.reduce((bytes, a) => bytes + a.source.utf8Bytes, 0) > 1048576) throw new AttachmentFailure("total-too-large");
  }

  private async addAttachment(view: vscode.WebviewView, kind: "file" | "selection" = "file"): Promise<void> {
    if (this.attachments.length >= 20) { this.attachmentResult = "attachment-limit"; this.publish(); return; }
    if (this.preparation !== "idle") { this.attachmentResult = "busy"; this.publish(); return; }
    if (!this.attachmentEligible()) { this.attachmentResult = "ineligible"; this.publish(); return; }
    const token = this.attachmentToken = {}; const revision = this.draftRevision;
    const generation = this.context().generation; const session = this.context().session;
    const current = () => { this.context(true); return !this.disposed && this.context().view === view && token === this.attachmentToken && revision === this.draftRevision && generation === this.context().generation && session === this.context().session && this.attachmentEligible(); };
    this.preparation = kind === "file" ? "picking" : "preparing"; this.attachmentResult = null; this.publish();
    try {
      const added: DraftAttachment[] = [];
      if (kind === "selection") {
        const { source, originalRange } = await captureSelection(this.api.workspace, this.context().cwd!, this.api.window.activeTextEditor, current);
        if (!current()) return;
        added.push({ attachmentId: opaqueId(), snapshotId: opaqueId(), kind, originalRange, stale: false, authorized: source, source, state: "attached" });
      } else {
        const selected = await this.api.window.showOpenDialog({ canSelectFiles: true, canSelectFolders: false, canSelectMany: true, defaultUri: this.api.workspace.workspaceFolders?.[0]?.uri, openLabel: "Attach nonsecret text files" });
        if (!current()) return;
        if (!selected?.length) throw new AttachmentFailure("cancelled");
        if (this.attachments.length + selected.length > 20) throw new AttachmentFailure("attachment-limit");
        this.preparation = "preparing"; this.publish();
        for (const uri of selected) {
          const source = await captureFile(this.api.workspace, this.context().cwd!, uri, current);
          if (!current()) return;
          added.push({ attachmentId: opaqueId(), snapshotId: opaqueId(), kind, source, state: "attached" });
          this.checkAttachmentBounds([...this.attachments, ...added]);
        }
      }
      for (const a of added) {
        if (a.kind === "file") await revalidateFile(a.source, this.api.workspace, this.context().cwd!, current);
        else {
          const actual = await selectionSourceRevision(a.source, this.api.workspace, this.context().cwd!, current);
          if (!sameSelectionSource(actual, a.authorized)) throw new AttachmentFailure("source-changed");
        }
        if (!current()) return;
      }
      for (const a of added) {
        if (a.kind === "file") validateEditorSnapshot(a.source, this.api.workspace);
        else validateSelectionDocument(a.source, this.api.workspace, a.authorized);
      }
      const next = [...this.attachments, ...added]; this.checkAttachmentBounds(next);
      if (!current()) return;
      this.attachments = next;
      this.draftRevision = Math.min(Number.MAX_SAFE_INTEGER, this.draftRevision + 1);
    } catch (error) { if (token === this.attachmentToken) this.attachmentResult = error instanceof AttachmentFailure ? error.code : "unavailable"; }
    finally { if (token === this.attachmentToken) { this.preparation = "idle"; this.publish(); } }
  }

  private async confirmAttachment(view: vscode.WebviewView, attachmentId: string, snapshotId: string, kind: "file" | "selection"): Promise<void> {
    const a = this.attachments.find(item => item.attachmentId === attachmentId);
    if (!a || a.kind !== kind || a.attachmentId !== attachmentId || a.snapshotId !== snapshotId || a.state !== "confirmation-required") {
      this.attachmentResult = "stale"; this.publish(); return;
    }
    if (!this.attachmentEligible() || this.preparation !== "idle") { this.attachmentResult = "busy"; this.publish(); return; }
    const token = this.attachmentToken = {}; const revision = this.draftRevision;
    const generation = this.context().generation; const session = this.context().session;
    const current = () => { this.context(true); return !this.disposed && this.context().view === view && token === this.attachmentToken && revision === this.draftRevision && generation === this.context().generation && session === this.context().session && this.attachmentEligible(); };
    this.preparation = "preparing"; this.attachmentResult = null; this.publish();
    try {
      if (a.kind === "selection") {
        const observed = a.observed;
        if (!observed) throw new AttachmentFailure("stale");
        const actual = await selectionSourceRevision(a.source, this.api.workspace, this.context().cwd!, current);
        if (!current()) return;
        if (!sameSelectionSource(actual, observed) || a.state !== "confirmation-required") throw new AttachmentFailure("source-changed");
        validateSelectionDocument(a.source, this.api.workspace, actual);
        a.authorized = actual; a.observed = undefined;
      } else {
        await revalidateFile(a.source, this.api.workspace, this.context().cwd!, current);
        if (!current()) return;
        validateEditorSnapshot(a.source, this.api.workspace);
      }
      a.state = "attached"; this.attachmentResult = null;
      this.draftRevision = Math.min(Number.MAX_SAFE_INTEGER, this.draftRevision + 1);
    } catch (error) {
      if (token === this.attachmentToken) {
        this.attachmentResult = error instanceof AttachmentFailure ? error.code : "unavailable";
        a.state = this.attachmentResult === "unavailable" ? "unavailable" : "changed";
      }
    } finally { if (token === this.attachmentToken) { this.preparation = "idle"; this.publish(); } }
  }

  private async submitDraft(view: vscode.WebviewView): Promise<void> {
    const submissionEpoch = this.submissionEpoch;
    if (!this.attachmentEligible() || this.preparation !== "idle" || !this.draftText.trim()) { this.attachmentResult = "busy"; this.publish(); return; }
    const token = this.attachmentToken = {}; const revision = this.draftRevision;
    const generation = this.context().generation; const session = this.context().session;
    const current = () => { this.context(true); return !this.disposed && this.context().view === view && token === this.attachmentToken && revision === this.draftRevision && generation === this.context().generation && session === this.context().session && this.attachmentEligible(); };
    let checking: DraftAttachment | undefined;
    this.preparation = "preparing"; this.attachmentResult = null; this.publish();
    try {
      const candidates: DraftAttachment[] = [];
      const selectionRevisions = new Map<string, SelectionSourceRevision>();
      for (const a of this.attachments) {
        checking = a;
        if (a.kind === "file") {
          if (a.source.document.isClosed || !this.api.workspace.textDocuments.includes(a.source.document)) throw new AttachmentFailure("unavailable");
          const latest = await captureFile(this.api.workspace, this.context().cwd!, a.source.uri, current);
          if (!current()) return;
          if (latest.root !== a.source.root || latest.target !== a.source.target || latest.document !== a.source.document) throw new AttachmentFailure("unavailable");
          const changed = latest.identity !== a.source.identity || latest.version !== a.source.version || latest.unsaved !== a.source.unsaved || latest.text !== a.source.text;
          candidates.push(changed || a.state !== "attached" ? { ...a, source: latest, snapshotId: opaqueId(), state: "confirmation-required" } : a);
        } else {
          const actual = await selectionSourceRevision(a.source, this.api.workspace, this.context().cwd!, current);
          if (!current()) return;
          selectionRevisions.set(a.attachmentId, actual);
          candidates.push(!sameSelectionSource(actual, a.authorized) || a.state !== "attached"
            ? { ...a, observed: actual, stale: true, state: "confirmation-required" } : a);
        }
      }
      if (!current()) return;
      // Later captures may outlive an earlier source: recheck the complete set.
      for (const a of candidates) {
        checking = this.attachments.find(item => item.attachmentId === a.attachmentId);
        if (a.kind === "file") await revalidateFile(a.source, this.api.workspace, this.context().cwd!, current);
        else {
          const actual = await selectionSourceRevision(a.source, this.api.workspace, this.context().cwd!, current);
          if (!sameSelectionSource(actual, selectionRevisions.get(a.attachmentId)!)) throw new AttachmentFailure("source-changed");
        }
        if (!current()) return;
      }
      // No await after this document-version barrier before atomic admission.
      for (const a of candidates) {
        checking = this.attachments.find(item => item.attachmentId === a.attachmentId);
        if (a.kind === "file") validateEditorSnapshot(a.source, this.api.workspace);
        else validateSelectionDocument(a.source, this.api.workspace, selectionRevisions.get(a.attachmentId)!);
      }
      checking = undefined;
      this.checkAttachmentBounds(candidates);
      if (candidates.some(a => a.state !== "attached")) {
        this.attachments = candidates;
        this.draftRevision = Math.min(Number.MAX_SAFE_INTEGER, this.draftRevision + 1);
        this.attachmentResult = "source-changed"; return;
      }
      const body = this.draftText;
      const input = candidates.length ? { kind: "enriched" as const, body, attachments: candidates.map(a => ({ path: a.source.relativePath, ...attachmentDetails(a), unsaved: a.source.unsaved, text: a.source.text })) } : { kind: "plain" as const, body };
      const prepared = this.runtime.preparePrompt(input, session);
      if (!current()) return;
      const submissionId = opaqueId();
      const records: Submission[] = candidates.map(a => ({ submissionId, snapshotId: a.snapshotId, relativePath: a.source.relativePath, ...attachmentDetails(a), utf8Bytes: a.source.utf8Bytes, unsaved: a.source.unsaved, text: a.source.text, body, draftRevision: revision, delivery: "host-accepted", outcome: "pending" }));
      let charge = records.length ? Buffer.byteLength(body, "utf8") : 0;
      for (const record of records) {
        const metadata = { submissionId: record.submissionId, snapshotId: record.snapshotId, relativePath: record.relativePath, ...attachmentDetails(record), utf8Bytes: record.utf8Bytes, unsaved: record.unsaved };
        const metadataBytes = Buffer.byteLength(JSON.stringify(metadata), "utf8");
        if (metadataBytes > 2048) throw new AttachmentFailure("metadata-too-large");
        charge += record.utf8Bytes + metadataBytes;
      }
      if (records.length && (this.history.length + records.length > 128 || this.retainedBytes + charge > 8388608)) throw new AttachmentFailure("history-full");
      this.history.push(...records); this.retainedBytes += charge;
      this.lastSubmission = { submissionId, draftRevision: revision, delivery: "host-accepted", outcome: "pending" };
      this.draftText = ""; this.attachments = []; this.draftRevision = Math.min(Number.MAX_SAFE_INTEGER, this.draftRevision + 1); this.preparation = "idle"; this.awaitingAck = true;
      this.events.accepted(body);
      const updateDelivery = (delivery: string) => { for (const record of records) record.delivery = delivery; if (this.lastSubmission?.submissionId === submissionId) this.lastSubmission.delivery = delivery; this.publish(); };
      const waiting = prepared.send(() => { this.events.attempted(submissionId); updateDelivery("write-attempted"); });
      this.events.changed(); this.publish();
      const result = await waiting;
      if (submissionEpoch !== this.submissionEpoch || this.disposed || this.context().disposed || generation !== this.context().generation || session !== this.context().session || !this.context().ready) return;
      this.awaitingAck = false; updateDelivery(result.delivery);
      if (result.code) this.attachmentResult = result.code;
      if (result.delivery !== "rpc-accepted") {
        for (const record of records) if (record.outcome === "pending") record.outcome = "failed";
        if (this.lastSubmission?.outcome === "pending") this.lastSubmission.outcome = "failed";
        const chatError = result.delivery === "rpc-rejected"
          ? "Runtime rejected the prompt. Check model/provider configuration before deliberately sending again; no retry was made."
          : "Prompt delivery was not confirmed. Inspect delivery status and restart the runtime before retrying; no retry was made.";
        this.events.failed(chatError);
      } else if (this.lastSubmission && ["settled", "interrupted"].includes(this.lastSubmission.outcome)) { this.events.settled(); }
      this.events.changed(); this.publish();
    } catch (error) {
      if (token === this.attachmentToken) {
        this.attachmentResult = error instanceof AttachmentFailure ? error.code : "frame-too-large";
        if (checking && ["source-changed", "unavailable"].includes(this.attachmentResult)) checking.state = this.attachmentResult === "unavailable" ? "unavailable" : "changed";
      }
    } finally { if (token === this.attachmentToken) { this.preparation = "idle"; this.publish(); } }
  }

  private historyMetadata(record: Submission): AttachmentHistoryEntry {
    return { submissionId: record.submissionId, snapshotId: record.snapshotId, relativePath: record.relativePath, ...attachmentDetails(record), utf8Bytes: record.utf8Bytes, unsaved: record.unsaved, delivery: record.delivery, outcome: record.outcome };
  }

}
