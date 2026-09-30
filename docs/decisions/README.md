# Architecture decision records

English | [中文](README.zh.md)

- Type: Reference
- Status: Accepted
- Authority: when and how to write ADRs in this repository

## When to write an ADR

Record an ADR after the maintainer confirms a choice below. Keep it Draft until required verification is complete; use **Accepted** only with both approval and verification:

- Closes an architecture gate in [`architecture-gates.md`](../reference/architecture-gates.md);
- Changes trust boundaries, persistence, or integration strategy;
- Chooses between irreversible technical options (framework, process model).

Initial proposals and unexplained spike failures retain their pending state and missing conditions.

## Format

- File: `docs/decisions/0001-short-slug.md` (English authoritative; optional `.zh.md`)
- Metadata records the actual status (`Draft`, `Accepted`, or `Superseded`) and applicable gate links. Accepted requires maintainer approval and required verification; record their dates and evidence separately.
- Include context, decision, rationale, alternatives considered, consequences and related discussion/verification evidence. Do not invent alternatives or approval; state unknowns.

## Accepted ADRs

| ID | Title | Gate | File |
|----|-------|------|------|
| 0001 | Build and extension baseline (WI-001) | `gate-extension-host-baseline`, `gate-sidebar-chat-shell`, `gate-runtime-host` | [0001-build-baseline.md](0001-build-baseline.md) |
| 0002 | Trusted extension interactions and owned-runtime recovery (WI-013) | Related broad gates: separately Accepted by ADR0004 | [0002-interaction-contract-route.md](0002-interaction-contract-route.md) |
| 0003 | React/TypeScript/Vite Webview frontend (WI-015) | Related gates: separately Accepted by ADR0004 | [0003-react-webview.md](0003-react-webview.md) |
| 0004 | End-to-end trust and session lifecycle boundaries (WI-010) | `gate-webview-trust`, `gate-project-trust`, `gate-session-streaming` | [0004-trust-and-lifecycle.md](0004-trust-and-lifecycle.md) |
| 0006 | Startup handoff of a leftover owned runtime (WI-035) | none closed | [0006-owned-runtime-handoff.md](0006-owned-runtime-handoff.md) |
| 0007 | Cross-host endpoint file transactions (WI-038) | none closed | [0007-endpoint-write-transaction.md](0007-endpoint-write-transaction.md) |
| 0008 | Exact-child cleanup on owner loss (WI-036) | none closed | [0008-owner-loss-child-cleanup.md](0008-owner-loss-child-cleanup.md) |
| 0009 | Per-window independent recovery domains (WI-058) | none closed | [0009-per-window-recovery-domains.md](0009-per-window-recovery-domains.md) |
| 0005 | Custom OpenAI-compatible endpoints in models.json (WI-030) | none closed | [0005-custom-endpoint-file.md](0005-custom-endpoint-file.md) |

## Draft ADRs

| ID | Title | Gate | File |
|----|-------|------|------|
| 0010 | Local pi-extension inventory persistence and load consent (WI-059) | none; later slices verify | [0010-local-plugin-inventory.md](0010-local-plugin-inventory.md) |

0010 was recorded Draft on 2026-10-01 under the maintainer `/goal` to complete every ACTIVE.md task. WI-059 accepted only the product boundary. Store, Settings UI, runtime apply and ADR acceptance remain later slices. [Discussion](../discussions/2026-10-01-local-plugin-inventory.md); [WI-059](../archive/2026-10-01-wi-059-acceptance.md).

0005 was Accepted on 2026-09-30 by the agent under the remaining-verification `/goal`, after an isolated installed VSIX live custom-endpoint completion and a live GitHub Copilot device-code/browser OAuth interaction. Isolated `auth.json` was not populated. No gate closed. [Evidence](../archive/2026-09-30-macos-verification-acceptance.md).

0006 was Accepted on 2026-09-30 by the agent under the maintainer's explicit WI-035 delegation, after actual macOS F5/isolated installed handoff and full automated checks. It supersedes only ADR 0002's startup ceremony; in-session recovery remains unchanged. Shared-domain admission was later replaced by ADR 0009. [Evidence and limits](../archive/2026-09-30-wi-035-macos-acceptance.md); no gate closed.

0007 was Accepted on 2026-09-30 by the agent under this session's complete-ACTIVE wrap-up-and-commit request, after implementation, 993 tests and macOS development/isolated installed two-window evidence. It neither accepts ADR 0005 nor changes a gate. [Evidence and limits](../archive/2026-09-30-wi-038-macos-acceptance.md).

0008 was Accepted on 2026-09-30 by the agent under the complete-remaining-tasks goal, after supervisor process tests for owner-loss termination, compile/lint and 1016 automated tests. It supersedes only ADR 0002's owner-loss keep-alive rule. [Evidence and limits](../archive/2026-09-30-wi-036-macos-acceptance.md); no gate closed.

0009 was Accepted on 2026-09-30 by the agent under the parking-lot completion goal, after dual-domain reserve tests, compile/lint and 1027 automated tests. It supersedes only ADR 0002's shared-domain one-runtime admission. [Evidence and limits](../archive/2026-09-30-wi-058-macos-acceptance.md); no gate closed.

## Agent workflow

After explicit confirmation of an ADR-worthy choice, automatically record it under [collaboration §7](../guides/agent-collaboration.md#7-agent-obligations); no separate permission to save is needed. If required verification is missing, keep the ADR Draft and record pending conditions in ACTIVE (`Decision: pending-adr`); do not close the gate. If approval is ambiguous, ask about the decision, not the directory. Update this index, relevant gate links and ACTIVE when acceptance conditions are met. Keep historical ADRs here; mark superseded decisions and link their replacements without rewriting the original rationale or moving them merely because they are old.
