import type * as vscode from "vscode";

/** Snapshot of the host/view identity and draft admission state; refreshed after each asynchronous step. */
export type DraftContext = Readonly<{
  generation: number; session: number; viewId: string; view: vscode.WebviewView | undefined;
  cwd: string | undefined; disposed: boolean; ready: boolean; eligible: boolean;
}>;

/** Host coordination callbacks; settled denotes the final runtime task outcome, not prompt acknowledgement. */
export type DraftSubmissionEvents = {
  accepted(body: string): void;
  attempted(submissionId: string): void;
  failed(message: string): void;
  settled(): void;
  changed(): void;
};
