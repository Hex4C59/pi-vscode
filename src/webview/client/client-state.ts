import type { ClientSnapshot } from "./types.js";
export type { ClientSnapshot, Intent, Preview } from "./types.js";
export const ATTACHMENT_HISTORY_PAGE_SIZE = 16;
export const CHANGE_REVIEW_PAGE_SIZE = 16;
export const SESSION_PAGE_SIZE = 16;
export function availability(s: ClientSnapshot) {
  const w = s.workspace;
  const stopping = s.stopRequested || w?.execution === "stopping" || w?.runtime === "stopping";
  const extensionBlocked = s.interactions?.phase === "blocked" || s.interactions?.active != null
    || (!!s.executionProfile && s.executionProfile.phase !== "idle");
  const ready = !!w && w.runtime === "ready" && !w.busy && !extensionBlocked;
  const sessionTransitioning = s.sessionRename?.status === "renaming" || s.sessions?.phase === "confirming" || s.sessions?.phase === "switching";
  const chatDisabled = !ready || !!w?.chatBusy || !!w?.modelBusy || stopping || !!s.error || sessionTransitioning;
  const draftBlocked = s.synchronizing || s.submitting || s.attachments?.preparation !== "idle"
    || !!s.attachments?.draft.attachments.some(a => ["unavailable", "confirmation-required"].includes(a.state)) || !s.text.trim();
  const queuePhaseBusy = !!s.queuedText && s.queuedText.phase !== "idle";
  const pendingCount = (s.queuedText?.pending.steering.length ?? 0) + (s.queuedText?.pending.followUp.length ?? 0);
  return {
    stopping,
    sessionTransitioning,
    settingsDisabled: !ready || !!w?.modelBusy || stopping || !!s.error || sessionTransitioning,
    sendDisabled: chatDisabled || !w?.chatModel || !!s.attachments?.draft.attachments.some(a => ["unavailable", "confirmation-required"].includes(a.state)) || s.synchronizing || s.submitting || s.attachments?.preparation !== "idle" || !s.text.trim(),
    attachmentDisabled: !ready || !!w?.modelBusy || stopping || !!s.error || sessionTransitioning || s.synchronizing || s.submitting || s.attachments?.preparation !== "idle",
    showStop: !!w?.chatBusy || stopping || (!!s.attachments && s.attachments.preparation !== "idle"),
    queueDisabled: !ready || !w?.chatBusy || !!w?.modelBusy || stopping || !!s.error || sessionTransitioning || draftBlocked || queuePhaseBusy,
    recallDisabled: !ready || stopping || !!s.error || sessionTransitioning || queuePhaseBusy || pendingCount === 0 || !s.queuedText,
  };
}
