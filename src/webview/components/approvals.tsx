import { useEffect, useState, type ReactElement } from "react";
import type { ApprovalDecision, ApprovalCard, SessionGrant } from "../../extension/contracts/index.js";
import type { ApprovalsProps } from "./types.js";
export type { ApprovalsProps } from "./types.js";


const decisions: readonly [ApprovalDecision, string][] = [
  ["once", "Allow once"],
  ["session", "Allow this session"],
  ["deny", "Deny"],
];

function scopeText(card: ApprovalCard): string {
  return card.scope === null
    ? "Session authorization unavailable: no reliably matchable scope. Review full input before allowing once."
    : `Exact session scope (no directory or command-prefix grant): ${card.scope}`;
}

export function Approvals({ cards, grants, disabled, onDecision, onRevoke }: ApprovalsProps): ReactElement {
  const [decided, setDecided] = useState<ReadonlySet<string>>(() => new Set());
  const [clock, setClock] = useState(() => Date.now());

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
      <div id="approvals" aria-label="Tool approvals">
        {cards.map(card => {
          const expired = clock >= card.expiresAt;
          const sent = decided.has(card.id);
          return (
            <section key={card.id} className="card approval" data-approval-id={card.id}>
              <h2>Approval required · {card.tool}</h2>
              <div className="activity-label">Full input</div>
              <pre className="approval-input">{card.input}</pre>
              <div className="activity-label">Session scope</div>
              <pre className="grant-scope">{scopeText(card)}</pre>
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
                      {label}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      <details id="session-grants">
        <summary id="grants-summary">Session grants ({grants.length}) · inspect / revoke</summary>
        <div id="grants">
          {grants.map((grant: SessionGrant) => (
            <div key={grant.id} className="activity" data-grant-id={grant.id}>
              <pre className="grant-scope">{grant.scope}</pre>
              <button className="btn-secondary" type="button" data-grant-action="revoke" disabled={disabled} onClick={() => onRevoke(grant.id)}>Revoke</button>
            </div>
          ))}
        </div>
      </details>
    </>
  );
}
