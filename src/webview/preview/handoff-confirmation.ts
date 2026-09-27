import { englishUi, type UiLanguage } from "../components/index.js";
export type HandoffOutcome = "confirm" | "cancel" | "restore-failed" | "stop-failed";

/** Browser-only stand-in for native host confirmation. Never sent as a Webview intent. */
export function createHandoffConfirmation(container: HTMLElement, getLanguage: () => UiLanguage = () => englishUi): { confirm: (restoring: boolean) => Promise<HandoffOutcome>; cancelPending: () => void; dispose: () => void } {
  let disposed = false;
  let focusTimer: ReturnType<typeof setTimeout> | undefined;
  let cancel: (() => void) | undefined;
  return {
    confirm(restoring) {
      const { locale, text: t } = getLanguage();
      if (disposed) return Promise.resolve("cancel");
      cancel?.();
      clearTimeout(focusTimer);
      return new Promise(resolve => {
        const trigger = document.activeElement;
        const dialog = document.createElement("dialog");
        dialog.className = "candidate-handoff";
        dialog.lang = locale;
        dialog.setAttribute("aria-label", t("Simulated session handoff"));
        const title = document.createElement("h2"); title.textContent = t("Simulated session handoff");
        const notice = document.createElement("p");
        notice.textContent = t("Synthetic browser preview only. Confirmation is not an ownership lock. A confirmed handoff stops the task and waits for settlement, then clears unsent drafts, attachments and temporary grants/review state. Historical extensions are not loaded automatically.");
        const instruction = document.createElement("p");
        instruction.textContent = restoring ? t("Confirm only after leaving the original entry point. This button simulates that confirmation; no real session is accessed.") : t("Create a new simulated conversation?");
        let settled = false;
        const finish = (result: HandoffOutcome) => {
          if (settled) return;
          settled = true; cancel = undefined;
          if (typeof dialog.close === "function") dialog.close();
          dialog.remove();
          resolve(result);
          if (!disposed) focusTimer = setTimeout(() => {
            focusTimer = undefined;
            if (!disposed && !cancel && trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true });
          }, 0);
        };
        const confirm = document.createElement("button");
        confirm.type = "button"; confirm.textContent = t("Confirm simulated handoff");
        confirm.setAttribute("aria-label", t("Confirm simulated handoff"));
        confirm.addEventListener("click", () => finish("confirm"));
        const decline = document.createElement("button");
        decline.type = "button"; decline.textContent = t("Cancel");
        decline.setAttribute("aria-label", t("Cancel simulated handoff"));
        decline.addEventListener("click", () => finish("cancel"));
        dialog.addEventListener("cancel", event => { event.preventDefault(); finish("cancel"); });
        const failure = document.createElement("button");
        failure.type = "button"; failure.textContent = t("Simulate restore failure");
        failure.setAttribute("aria-label", t("Simulate restore failure"));
        failure.addEventListener("click", () => finish("restore-failed"));
        const stopFailure = document.createElement("button");
        stopFailure.type = "button"; stopFailure.textContent = t("Simulate Stop failure");
        stopFailure.setAttribute("aria-label", t("Simulate Stop failure"));
        stopFailure.addEventListener("click", () => finish("stop-failed"));
        dialog.append(title, notice, instruction, confirm, decline, failure, stopFailure); container.append(dialog);
        cancel = () => finish("cancel");
        if (typeof dialog.showModal === "function") dialog.showModal();
        else dialog.open = true; // jsdom has no native modal implementation; real-browser evidence is separate.
        decline.focus();
      });
    },
    cancelPending() { cancel?.(); },
    dispose() { disposed = true; clearTimeout(focusTimer); cancel?.(); },
  };
}
