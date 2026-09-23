import type * as vscode from "vscode";
import type { GateCall } from "../contracts/approvalProtocol.js";
import type { WebviewMessage } from "../bridge/webviewMessages.js";
import type { ApprovalCard, SessionGrant, ChangeReviewStateMessage } from "../contracts/webviewProtocol.js";
import { ToolApprovals } from "./toolApproval.js";
import { checkWriteTarget } from "./writeProtection.js";
import { ChangeReview } from "./changeReview.js";

type ToolContext = Readonly<{
  generation: number; session: number; cwd: string | undefined;
  ready: boolean; chatBusy: boolean; stopping: boolean; disposed: boolean;
}>;
type ToolProjection = { approvals: ApprovalCard[]; grants: SessionGrant[] };
type ReviewProjection = Omit<ChangeReviewStateMessage, "version" | "generation" | "viewId" | "type">;

/** Internal composition options, not a Webview capability or a public extension API. */
export type EditorToolOptions = { changeReview?: boolean };

/** Owns editor-aware execution policy and optional review resources behind pi's approval hook. */
export class EditorTools implements vscode.Disposable {
  private readonly approvals: ToolApprovals;
  private readonly review: ChangeReview | undefined;
  private disposed = false;
  private epoch = 0;

  constructor(
    api: ConstructorParameters<typeof ChangeReview>[0],
    private readonly context: () => ToolContext,
    private readonly changed: (projection: ToolProjection) => void,
    private readonly reviewChanged: (projection: ReviewProjection) => void,
    private readonly failed: (message: string) => void,
    options: EditorToolOptions = {},
  ) {
    this.review = options.changeReview === false ? undefined : new ChangeReview(api, () => this.publishReview());
    this.approvals = new ToolApprovals(() => {
      if (!this.disposed) this.changed({ approvals: this.approvals.cards(), grants: this.approvals.scopes() });
    }, undefined, async (call, phase) => {
      const { generation, session } = this.context();
      const epoch = this.epoch;
      const current = () => {
        const now = this.context();
        return epoch === this.epoch && !this.disposed && !now.disposed && generation === now.generation && session === now.session && !now.stopping;
      };
      let blocked = await checkWriteTarget(call, api.workspace);
      if (!blocked && phase === "final" && current()) {
        await this.review?.beforeWrite(call);
        blocked = await checkWriteTarget(call, api.workspace);
      }
      if (!current()) return false;
      if (blocked) {
        this.failed(blocked === "dirty"
          ? "Write blocked: the target has unsaved editor changes. Handle those changes first, then explicitly retry the task. Nothing was auto-saved."
          : "Write blocked: the editor safety check could not finish reliably. Check the target and open documents, then explicitly retry. Nothing was auto-saved.");
        return false;
      }
      return true;
    }, (call, allowed) => { if (!allowed) this.review?.discardWrite(call.toolCallId); });
  }

  requestApproval = (call: GateCall): Promise<boolean> => {
    const context = this.context();
    return !this.disposed && !context.disposed && context.ready && context.chatBusy && !context.stopping && call.cwd === context.cwd
      ? this.approvals.request(call) : Promise.resolve(false);
  };

  publishReview(): void {
    if (this.disposed || this.context().disposed) return;
    this.reviewChanged(this.review?.snapshot() ?? { entries: [], retainedBytes: 0, limited: false, reset: false, error: null });
  }

  /** Input is already validated and bound to the current view by the host bridge. */
  handle(message: WebviewMessage, current: () => boolean): Promise<void> | undefined {
    if (this.disposed || this.context().disposed || !current()) return undefined;
    switch (message.type) {
      case "getChangeReview": this.publishReview(); return Promise.resolve();
      case "openReviewDiff": case "openReviewSource":
        return this.review?.open(message.id, message.type === "openReviewDiff" ? "diff" : "source", current) ?? Promise.resolve();
      case "decideApproval": this.approvals.decide(message.id, message.decision); return Promise.resolve();
      case "revokeGrant": this.approvals.revoke(message.id); return Promise.resolve();
      default: return undefined;
    }
  }

  beginTask(submissionId: string): void {
    const { cwd } = this.context();
    if (!this.disposed && cwd) this.review?.beginTask(cwd, submissionId);
  }
  endTask(): void { this.review?.endTask(); }
  finishTool(toolCallId: string, failed: boolean): void {
    if (this.disposed || this.context().disposed) return;
    const before = this.context();
    const epoch = this.epoch;
    void this.review?.finishTool(toolCallId, failed).catch(() => {
      const now = this.context();
      if (epoch === this.epoch && !this.disposed && !now.disposed && now.generation === before.generation && now.session === before.session)
        this.failed("Could not finish the change review. Inspect the affected files in the editor.");
    });
  }
  cancelApprovals(resetGrants = false): void { this.epoch++; this.approvals.cancel(resetGrants); }
  reset(): void { this.review?.clear(); this.cancelApprovals(true); }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.cancelApprovals(true);
    this.review?.dispose();
  }
}
