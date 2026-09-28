import { useUiText, type UiText, type UiTranslator } from "./ui-text.js";
import { useEffect, useLayoutEffect, useRef, useState, type ReactElement } from "react";
import type { ApprovalDecision, ApprovalCard, SessionGrant } from "../../extension/contracts/index.js";
import type { ApprovalsProps } from "./types.js";
export type { ApprovalsProps } from "./types.js";


const decisions: readonly [ApprovalDecision, UiText][] = [
  ["once", "Allow once"],
  ["session", "Allow this session"],
  ["deny", "Deny"],
];

function scopeText(card: ApprovalCard, t: UiTranslator): string {
  return card.scope === null
    ? t("Session authorization unavailable: no reliably matchable scope. Review full input before allowing once.")
    : t("Exact session scope (no directory or command-prefix grant): {scope}", { scope: card.scope });
}

/** Display requested target/command without interpreting it as an authorization policy. */
function RequestedOperation({ card }: { card: ApprovalCard }): ReactElement {
  const { text: t } = useUiText();
  let input: unknown;
  try { input = JSON.parse(card.input); } catch { /* Preserve unstructured complete input below. */ }
  const fields = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : null;
  const command = (card.tool === "bash" || card.tool === "powershell") && typeof fields?.command === "string" ? fields.command : null;
  const target = typeof fields?.path === "string" ? fields.path : typeof fields?.cwd === "string" ? fields.cwd : null;
  return <>
    <div className="approval-critical"><span className="activity-label">{t("Requested target")}</span>
    <pre className="approval-target">{target ?? t("Target unavailable — inspect full input before deciding.")}</pre></div>
    {command !== null && <div className="approval-critical"><span className="activity-label">{t("Complete command")}</span><pre className="approval-command">{command}</pre></div>}
    {fields === null && <pre className="approval-command">{card.input}</pre>}
  </>;
}

export function Approvals({ cards, grants, disabled, onDecision, onRevoke, compact = false, showGrants = true }: ApprovalsProps): ReactElement {
  const { text: t } = useUiText();
  const [decided, setDecided] = useState<ReadonlySet<string>>(() => new Set());
  const [clock, setClock] = useState(() => Date.now());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const now = Math.max(clock, Date.now());
  const pending = cards.filter(card => card.expiresAt > now);
  const selected = pending.find(card => card.id === selectedId) ?? pending[0];
  const priorSelection = useRef(selected?.id);
  const root = useRef<HTMLDivElement>(null);
  const selectionButtons = useRef(new Map<string, HTMLButtonElement>());
  const focusedCard = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (compact && priorSelection.current !== selected?.id && focusedCard.current === priorSelection.current) {
      // Never transfer a focused decision button onto a replacement request.
      const target = selected ? selectionButtons.current.get(selected.id) : root.current;
      target?.focus({ preventScroll: true });
    }
    priorSelection.current = selected?.id;
  }, [compact, selected?.id]);

  useEffect(() => {
    const activeIds = new Set(cards.map(card => card.id));
    setDecided(previous => {
      const next = new Set([...previous].filter(id => activeIds.has(id)));
      return next.size === previous.size ? previous : next;
    });
  }, [cards]);

  useEffect(() => {
    const nextExpiry = cards.reduce<number | undefined>((earliest, card) => {
      if (card.expiresAt <= Date.now()) return earliest;
      return earliest === undefined ? card.expiresAt : Math.min(earliest, card.expiresAt);
    }, undefined);
    if (nextExpiry === undefined) return undefined;
    const timer = setTimeout(() => setClock(Date.now()), Math.max(0, nextExpiry - Date.now()) + 1);
    return () => clearTimeout(timer);
  }, [cards, clock]);

  return (
    <>
      <div ref={root} id="approvals" tabIndex={-1} aria-label={t("Tool approvals")} onBlurCapture={event => {
        if (event.relatedTarget instanceof HTMLElement && !event.currentTarget.contains(event.relatedTarget)) focusedCard.current = null;
      }} onFocusCapture={event => {
        focusedCard.current = event.target.closest<HTMLElement>('[data-approval-id]')?.dataset.approvalId ?? null;
      }}>
        {compact && pending.length > 1 && <nav className="approval-selector" aria-label={t("Pending approvals")}>
          <span role="status">{t("Pending actions ({count})", { count: pending.length })}</span>
          <div className="approval-selector__list">
            {pending.map((card, index) => <button key={card.id} type="button" className="btn-secondary" data-select-approval={card.id}
              ref={node => { if (node) selectionButtons.current.set(card.id, node); else selectionButtons.current.delete(card.id); }}
              aria-pressed={selected?.id === card.id} onClick={() => setSelectedId(card.id)}>{index + 1} · {card.tool}</button>)}
          </div>
        </nav>}
        {cards.map(card => {
          const expired = now >= card.expiresAt;
          const sent = decided.has(card.id);
          return (
            <section key={card.id} className="card approval" data-approval-id={card.id} hidden={compact && selected?.id !== card.id}>
              <h2>{t("Approval required · {tool}", { tool: card.tool })}</h2>
              {!compact && card.category === "custom" && <p className="muted">{t("Custom extension tool. This approval covers this call only; extension-internal execution is outside this approval and built-in file safeguards.")}</p>}
              {compact ? <div className="approval-details">
                {card.category === "custom" && <p className="muted">{t("Custom extension tool. This approval covers this call only; extension-internal execution is outside this approval and built-in file safeguards.")}</p>}
                <RequestedOperation card={card} />
                <div className="approval-critical"><span className="activity-label">{t("Session scope")}</span>
                <pre className="grant-scope">{card.scope ?? scopeText(card, t)}</pre></div>
                <details><summary>{t("Full input")}</summary><pre className="approval-input">{card.input}</pre></details>
              </div> : <>
                <div className="activity-label">{t("Full input")}</div>
                <pre className="approval-input">{card.input}</pre>
                <div className="activity-label">{t("Session scope")}</div>
                <pre className="grant-scope">{scopeText(card, t)}</pre>
              </>}
              {expired && <p className="approval-expired" role="status">{t("This request has expired.")}</p>}
              <div className="approval-actions">
                {decisions.map(([decision, label]) => {
                  const unavailableSession = decision === "session" && card.scope === null;
                  return (
                    <button
                      key={decision}
                      className="btn-secondary"
                      type="button"
                      data-decision={decision}
                      disabled={disabled || sent || expired || unavailableSession}
                      onClick={() => {
                        if (disabled || sent || expired || unavailableSession) return;
                        setDecided(previous => new Set(previous).add(card.id));
                        onDecision(card.id, decision);
                      }}
                    >
                      {t(label)}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      {showGrants && <SessionGrants grants={grants} disabled={disabled} onRevoke={onRevoke} />}
    </>
  );
}

export function SessionGrants({ grants, disabled, onRevoke }: Pick<ApprovalsProps, "grants" | "disabled" | "onRevoke">): ReactElement {
  const { text: t } = useUiText();
  return (<details id="session-grants">
        <summary id="grants-summary">{t("Session grants ({count}) · inspect / revoke", { count: grants.length })}</summary>
        <div id="grants">
          {grants.map((grant: SessionGrant) => (
            <div key={grant.id} className="activity" data-grant-id={grant.id}>
              <pre className="grant-scope">{grant.scope}</pre>
              <button className="btn-secondary" type="button" data-grant-action="revoke" disabled={disabled} onClick={() => onRevoke(grant.id)}>{t("Revoke")}</button>
            </div>
          ))}
        </div>
      </details>);
}
