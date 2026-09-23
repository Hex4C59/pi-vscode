import type { ApprovalCard, SessionGrant, ChangeReviewStateMessage } from "../contracts/index.js";

/** Optional host-side review resources; approval and write protection remain mandatory. */
export type EditorToolOptions = { changeReview?: boolean };

/** Host-owned task identity and eligibility used for authorization; no Webview capability is granted. */
export type EditorToolContext = Readonly<{
  generation: number; session: number; cwd: string | undefined;
  ready: boolean; chatBusy: boolean; stopping: boolean; disposed: boolean;
}>;

export type EditorToolProjection = { approvals: ApprovalCard[]; grants: SessionGrant[] };
export type EditorReviewProjection = Omit<ChangeReviewStateMessage, "version" | "generation" | "viewId" | "type">;
