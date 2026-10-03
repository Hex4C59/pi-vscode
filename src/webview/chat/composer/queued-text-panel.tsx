import type { ReactElement } from "react";
import type { QueuedPendingEntry, QueuedRecoveryEntry, QueuedTextStateMessage } from "../../../extension/contracts/index.js";
import { useUiText } from "../../components/index.js";
import type { UiText } from "../../i18n/ui-text.js";

type QueuedTextPanelProps = {
  state: QueuedTextStateMessage | null;
  draftEmpty: boolean;
  recallDisabled: boolean;
  onRecall: () => void;
  onUse: (id: string) => void;
  onDiscard: (id: string) => void;
};

type Translate = (key: UiText, vars?: Readonly<Record<string, string | number>>) => string;

function pendingLabel(entry: QueuedPendingEntry, index: number, t: Translate): string {
  const text = entry.reusable ? entry.text : t("Text unavailable");
  const body = entry.reusable && entry.attachmentCount ? `${text} · ${t("{count} context snapshots", { count: entry.attachmentCount })}` : text;
  if (entry.attribution === "local") return body;
  if (entry.attribution === "external") return t("External: {text}", { text: body });
  return t("Unknown source: {text}", { text: body || `#${index + 1}` });
}

function PendingList({ title, entries, t }: {
  title: UiText;
  entries: QueuedPendingEntry[];
  t: Translate;
}): ReactElement | null {
  if (!entries.length) return null;
  return <section className="queued-text__group" aria-label={t(title)}>
    <h3 className="queued-text__heading">{t(title)}</h3>
    <ol className="queued-text__list">
      {entries.map((entry, index) => (
        <li key={`${entry.attribution}-${index}-${entry.reusable ? entry.text.slice(0, 24) : "hidden"}`} className="queued-text__item">
          {pendingLabel(entry, index, t)}
        </li>
      ))}
    </ol>
  </section>;
}

function RecoveryList({ entries, draftEmpty, onUse, onDiscard, t }: {
  entries: QueuedRecoveryEntry[];
  draftEmpty: boolean;
  onUse: (id: string) => void;
  onDiscard: (id: string) => void;
  t: Translate;
}): ReactElement | null {
  if (!entries.length) return null;
  return <section className="queued-text__group" aria-label={t("Recalled text")}>
    <h3 className="queued-text__heading">{t("Recalled text")}</h3>
    <ul className="queued-text__list queued-text__list--recovery">
      {entries.map(entry => (
        <li key={entry.id} className="queued-text__recovery">
          <p className="queued-text__item">
            {entry.status !== "unavailable" ? entry.text : t("Text unavailable")}
            {entry.status !== "unavailable" && !!entry.attachmentCount && <span className="queued-text__mode"> · {t("{count} context snapshots", { count: entry.attachmentCount })}</span>}
            <span className="queued-text__mode">{entry.status === "uncertain" ? ` · ${t("Delivery uncertain — inspect before resending")}` : ""} · {entry.mode === "steering" ? t("Steer") : t("Follow up")}</span>
          </p>
          <div className="queued-text__recovery-actions">
            {entry.status !== "unavailable" && (
              <button type="button" className="queued-text__action" disabled={!draftEmpty}
                title={draftEmpty ? t("Move into empty draft") : t("Empty the draft before restoring")}
                onClick={() => onUse(entry.id)}>{t("Use in draft")}</button>
            )}
            <button type="button" className="queued-text__action" onClick={() => onDiscard(entry.id)}>{t("Discard")}</button>
          </div>
        </li>
      ))}
    </ul>
  </section>;
}

/** Host-owned pending/recovery projection; intents stay on the page client. */
export function QueuedTextPanel({
  state, draftEmpty, recallDisabled, onRecall, onUse, onDiscard,
}: QueuedTextPanelProps): ReactElement | null {
  const { text: t } = useUiText();
  if (!state) return null;
  const pending = state.pending.steering.length + state.pending.followUp.length;
  const hasRecovery = state.recovery.length > 0;
  if (!pending && !hasRecovery && !state.error && state.phase === "idle") return null;
  return <div className="queued-text" role="region" aria-label={t("Queued text")}>
    {state.error && <p className="queued-text__error" role="status">{t("Queue: {error}", { error: state.error === "command-not-queueable" ? t("This command cannot be queued. Wait for the task to finish.")
      : state.error === "command-unavailable" ? t("Command expansion is unavailable. Your input was kept.")
        : state.error === "source-changed" ? t("Context changed. Confirm or reattach it before queueing.")
          : state.error === "capacity" ? t("Queue capacity exceeded. Reduce context or discard retained inputs.") : state.error })}</p>}
    {state.phase !== "idle" && <p className="queued-text__phase" role="status">
      {state.phase === "submitting" ? t("Submitting to queue…")
        : state.phase === "recalling" ? t("Recalling queued text…")
          : t("Stopping and recalling…")}
    </p>}
    <PendingList title="Steering" entries={state.pending.steering} t={t} />
    <PendingList title="Follow-up" entries={state.pending.followUp} t={t} />
    {pending > 0 && (
      <button type="button" className="queued-text__recall" disabled={recallDisabled} onClick={onRecall}>
        {t("Recall pending text")}
      </button>
    )}
    <RecoveryList entries={state.recovery} draftEmpty={draftEmpty} onUse={onUse} onDiscard={onDiscard} t={t} />
  </div>;
}
