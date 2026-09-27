import type { ReactElement } from "react";
import { ChangeReview, useUiText, type ChangeReviewProps } from "../components/index.js";

export type CandidateReviewProps = ChangeReviewProps;

export function CandidateReview(props: CandidateReviewProps): ReactElement | null {
  const { text: t } = useUiText();
  const { state } = props;
  if (!state || (state.entries.length === 0 && !state.limited && !state.reset && state.error === null)) return null;

  const captured = state.entries.filter(entry => entry.source === "tool" && (entry.diff === "ready" || entry.diff === "unchanged")).length;
  const reported = state.entries.filter(entry => entry.source === "tool").length;
  const observed = state.entries.filter(entry => entry.source === "observed").length;
  const unavailable = state.entries.filter(entry => entry.diff === "unavailable").length;

  return (
    <div className="candidate-review" data-candidate-review>
      {!props.open && state.error && <p className="candidate-review__warning" role="alert">{t(state.error === "unavailable"
        ? "Review data is unavailable; no captured diff can be opened for missing entries."
        : "Review data is stale; the runtime or source changed. Refresh the review before relying on it.")}</p>}
      <ChangeReview {...props} introduction={<>
      <p className="candidate-review__summary" role="status">
        {t("Review summary: {captured} captured · {reported} reported · {observed} observed · {unavailable} unavailable", {
          captured, reported, observed, unavailable,
        })}
      </p>
      {props.open && <p className="candidate-review__simulation" role="note">{t("Preview only: diff and source opening are simulated.")}</p>}
      </>} caption={t("Review changes ({count})", { count: state.entries.length })} />
    </div>
  );
}
