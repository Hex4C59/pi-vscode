import { createPreviewLanguage } from "./ui-language.js";
import { createHandoffConfirmation } from "./handoff-confirmation.js";
import { mountCandidate } from "./candidate.js";
import { PreviewBridge } from "./preview-bridge.js";
import type { PreviewScenario } from "./scenarios.js";

/** The preview owns its synthetic host as well as the candidate's React/client lifetime. */
export function mountCandidatePreview(container: HTMLElement, scenario: PreviewScenario, language = createPreviewLanguage()): { dispose: () => void; recover: () => void; changeSources: () => void; completeReview: () => void; loseReview: () => void; queueApprovals: () => void; simulateInteraction: () => void; simulateRecoveryRequired: () => void } {
  const confirmation = createHandoffConfirmation(container, language.getSnapshot);
  const bridge = new PreviewBridge(scenario, confirmation.confirm);
  const view = document.createElement("div");
  view.className = "candidate-mount";
  container.append(view);
  try {
    const dispose = mountCandidate(view, bridge, language);
    return { completeReview: () => bridge.completeReview(), loseReview: () => bridge.loseReview(), queueApprovals: () => bridge.queueApprovals(), simulateInteraction: () => bridge.simulateInteraction(), simulateRecoveryRequired: () => bridge.simulateRecoveryRequired(), changeSources: () => bridge.changeSources(), recover: () => { bridge.recover(); confirmation.cancelPending(); }, dispose: () => { dispose(); bridge.dispose(); confirmation.dispose(); view.remove(); } };
  } catch (error) {
    bridge.dispose(); confirmation.dispose(); view.remove();
    throw error;
  }
}
