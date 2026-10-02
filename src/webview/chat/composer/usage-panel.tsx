import { useEffect, useRef, type ReactElement } from "react";
import type { SessionUsageStateMessage } from "../../../extension/contracts/index.js";
import { useUiText } from "../../components/index.js";

function UsageNumbers({ state }: { state: Extract<SessionUsageStateMessage, { status: "ready" }> }): ReactElement {
  const { text: t, locale } = useUiText();
  const count = (value: number | null | undefined) => value == null ? t("Unknown") : value.toLocaleString(locale);
  const usage = state.usage;
  return <>
    <h3>{t("Current context")}</h3>
    <dl><dt>{t("Context tokens")}</dt><dd>{count(usage.context?.tokens)}</dd>
      <dt>{t("Context capacity")}</dt><dd>{count(usage.context?.contextWindow)}</dd>
      <dt>{t("Context used")}</dt><dd>{usage.context?.percent == null ? t("Unknown") : `${usage.context.percent.toFixed(1)}%`}</dd></dl>
    <h3>{t("Session total")}</h3>
    <dl>{(["input", "output", "cacheRead", "cacheWrite", "total"] as const).map(key => <div key={key}>
      <dt>{t(({ input: "Input tokens", output: "Output tokens", cacheRead: "Cache read tokens", cacheWrite: "Cache write tokens", total: "Total tokens" } as const)[key])}</dt>
      <dd>{count(usage.tokens[key])}</dd></div>)}
      <dt>{t("Estimated cost (USD)")}</dt><dd>{usage.cost === null ? t("Unknown") : `$${usage.cost.toLocaleString(undefined, { maximumSignificantDigits: 6 })}`}</dd></dl>
  </>;
}

/** Presentation only; statistics refresh is an exact host intent and never submits the draft. */
export function UsagePanel({ state, open, busy, disabled, onOpen, onRefresh }: {
  state: SessionUsageStateMessage | null; open: boolean; busy: boolean; disabled: boolean;
  onOpen(open: boolean): void; onRefresh(): void;
}): ReactElement {
  const { text: t } = useUiText();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => { if (open) panel.current?.focus(); }, [open]);
  const close = () => { onOpen(false); trigger.current?.focus(); };
  return <div className="session-usage">
    <button ref={trigger} type="button" className="chip" aria-label={t("Usage")} aria-expanded={open}
      onClick={() => { onOpen(!open); if (!open) onRefresh(); }}>{t("Usage")}</button>
    {open && <div ref={panel} tabIndex={-1} role="dialog" aria-label={t("Usage")} className="session-usage__panel"
      onKeyDown={event => { if (event.key === "Escape" && !event.nativeEvent.isComposing) { event.preventDefault(); close(); } }}>
      <header><strong>{t("Usage")}</strong><button type="button" aria-label={t("Close usage")} onClick={close}>{t("Close")}</button></header>
      {busy && state?.status === "ready" && <p role="status">{t("Previous snapshot while the task is running.")}</p>}
      {state?.status === "ready" ? <UsageNumbers state={state} />
        : <p role="status">{t(state?.status === "loading" ? "Loading usage…" : state?.status === "unavailable" ? "Usage unavailable. Refresh to retry." : "No active session.")}</p>}
      <button type="button" aria-label={t("Refresh usage")} disabled={disabled || state?.status === "loading"} onClick={onRefresh}>{t("Refresh")}</button>
    </div>}
  </div>;
}
