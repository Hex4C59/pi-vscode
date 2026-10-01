# WI-077: text steering, follow-up and recall acceptance

English | [中文](2026-10-02-wi-077-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-02
- Authority: scoped historical evidence; not whole PI-GAP-01 or whole-PRD acceptance

## Disposition

Closed October 2 by the agent under the continuing scoped product-slice goal, not maintainer personal testing. Implementation commits include `fc9e0ab`, `6ade3e7`, `d2f39d3`, `2f27b83`, `1fdd692`, `14be1cc`, `3d24f3b` and `65498d9` (ACTIVE excluded). [Approved proposal](2026-10-02-wi-077-approved-proposal.md). No gate closed. PI-GAP-01 remainder stays parked.

## Evidence and reproduction

Pinned pi **0.86.1**, VS Code **1.139.1**, Darwin arm64. Isolated synthetic OpenAI-completions loopback; resources declined. VSIX SHA-256 `98d240bf127d84b84af1894552751ae706382545ce79a3bbaef01ad5ebcf7557` (gitignored `dist/wi077-queued-host/pi-vscode.vsix`).

| Tier | What was observed | Record |
|------|-------------------|--------|
| jsdom / mounted composer | Steer/Follow-up while busy; Enter does not send; keyboard reachability | `src/webview/tests/queued-text-mounted.spec.ts`; `65498d9` |
| Browser preview | en/zh-CN, 280 px, dark/light, high-contrast; Steer pending, Stop→Use in draft | gitignored `dist/wi077-queued-ui/` |
| Installed VSIX | Working… → Steering `WI077_STEER_from_installed` → Stop Recalled → Use in draft restores composer | `installed-steer.png`, `installed-recall.png`, `installed-use-in-draft.png`, `report.json` |
| macOS F5 | Extension Development Host; Steering `WI077_STEER_from_f5`; Recalled text; Use in draft restores exact composer text | `f5-steer.png`, `f5-recall.png`, `f5-use-in-draft.png`, `report.json` (`phase: queue-f5`, `ok: true`) |

F5 reproduction (gitignored runner): `ACCEPT_PHASE=queue-f5 node dist/wi077-queued-host/run.mjs` after `npm run compile` and a packaged VSIX in that evidence directory. Installed lane uses `ACCEPT_PHASE=queue`. Reports are regenerated, not committed.

## Checks and semantic review

- `npm run compile`: passed before F5 (esbuild + tsc host/webview/tests).
- `npm run lint`: passed at close (`eslint src`).
- `npm test`: 1140 passed, zero failed/cancelled/skipped at close.
- `npm run docs:verify` / `npm run docs:health`: zero errors; two existing Draft ADR 0010 notices retained; bilingual zero warnings/stale notices.

The F5 window title is `[Extension Development Host] A`. Pending UI showed Steering plus `WI077_STEER_from_f5` with Recall pending text; after Stop, Recalled text plus Use in draft; composer restored `WI077_STEER_from_f5`. A host toast “Extensions have been modified on disk” did not interrupt the queue loop.

## Limits and next item

Synthetic provider, not a paid/real-model run. Follow-up was not separately clicked on F5/installed hosts. Live disconnect, 320/400 composer widths, and PI-GAP-01 attachments/commands were not accepted. No secrets, push, session-file product operations or excluded scope. Next WI is composer `/` discovery (PI-GAP-02).
