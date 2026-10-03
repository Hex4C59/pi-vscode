import type * as vscode from "vscode";

/** Snapshot of the host/view identity and draft admission state; refreshed after each asynchronous step. */
export type DraftContext = Readonly<{
  generation: number; session: number; viewId: string; view: vscode.WebviewView | undefined;
  queueEligible?: boolean; cwd: string | undefined; disposed: boolean; ready: boolean; eligible: boolean;
}>;

/** Host coordination callbacks; settled denotes the final runtime task outcome, not prompt acknowledgement. */
export type DraftSubmissionEvents = {
  accepted(body: string): void;
  attempted(submissionId: string): void;
  failed(message: string): void;
  settled(): void;
  changed(): void;
};

/** Host-only retention capability: captures immutable native snapshots, never crosses the bridge. */
export type QueuedDraftRetention = {
  text: string;
  bytes: number;
  attachmentCount?: number;
  restore(revision: number): { kind: "ok" } | { kind: "refused"; reason: "stale" | "busy" | "draft-not-empty" | "invalid-text" };
};
export type QueuedDraftAdmission =
  | { kind: "ok"; text: string; retention: QueuedDraftRetention; isCurrent(): boolean; commitAttempt(): void }
  | { kind: "refused"; reason: "stale" | "busy" | "invalid-text" | "attachments" | "source-changed" | "capacity" | "command-unavailable" | "command-not-queueable" | "runtime-unavailable" };
