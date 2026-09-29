# WI-025 — Superseded ACTIVE rounds and handoffs

English | [中文](2026-09-29-wi-025-active-superseded.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-29
- Authority: historical WI-025 scope, Build slices, verification and handoff evidence; current status is in [`ACTIVE.md`](../../ACTIVE.md)

## Closure — 2026-09-29

The maintainer explicitly confirmed F5 visual acceptance for the WI-025 current focus on 2026-09-29. This closes the approved sidebar visual craft slice, including the separately authorized no-folder/setup corrections and pre-session thinking-level control. It is a maintainer acceptance, distinct from the agent's earlier synthetic-browser and isolated native F5 checks. No new ADR or architecture gate was involved; the PRD remains Draft, with this slice individually accepted.

The approved work covered the shared token scale, welcome and composer, session navigation/history, conversation and activity, task actions, settings/confirmation dialogs, attachment presentation/focus, and the bounded startup corrections recorded in the [PRD](../product-requirements.md). Existing trust, permission, secret, runtime and session contracts remained in force. The detailed rounds and previous handoffs below remain historical evidence, including their then-pending F5 wording. The final pre-session handoff recorded 730/730 tests, compile, lint and webview verification, plus an isolated RPC startup check; these were not rerun by the acceptance-recording task.

The confirmation covers WI-025's F5 visual acceptance only. This WI did not establish installed-VSIX behavior, full real-model/tool/approval/Stop flows, exact native width and short-window matrices, or native forced-colors and animation timing. WI-023 and paused WI-024 retain their own F5 items in ACTIVE; no new Build work, commit or push follows from this confirmation.

## Why archived

On 2026-09-29 the maintainer authorized compressing the ACTIVE entry point. At that checkpoint WI-025 remained Build / WIP=1; the maintainer's later F5 visual confirmation and closure are recorded above. Full text for Build rounds 2–5, the long round-6 evidence table, and superseded handoffs moved to the Chinese file below. The statements of pending F5 and installed VSIX in those older entries are dated snapshots, not live acceptance status.

## Preview entry points

| Topic | Synthetic preview |
|-------|---------------------|
| Navigation / history | `/navigation-review.html` |
| Settings / confirm dialogs | `/settings-review.html` |
| Round-6 consistency / attachments | `/consistency-review.html` |

Skill prototypes and reference-library work live under [pi-sidebar-ui](../../.agents/skills/pi-sidebar-ui/SKILL.md) and [UI rules discussion](../discussions/2026-09-28-agent-ui-rules.md).

## Rounds 2–5 full record (moved from ACTIVE)

Verbatim proposals, results and verification are in the Chinese file. Summary:

### Round 2: Session navigation and history panel (2026-09-29)

SessionNavigation, CandidateSessions history shell, Lucide chrome, motion contract; `/navigation-review.html`.

### Round 3: Conversation content (2026-09-29)

`candidate-conversation.css`, message/Markdown/code/activity craft; craft and mount tests through 708/708 at delivery.

### Round 4: Task status and operations (2026-09-29)

TaskStatus module, approvals/review/interaction/recovery presentation; preview fixtures `simulateInteraction` / `simulateRecoveryRequired`; 719/719 at delivery.

### Round 5: Settings and confirm dialogs (2026-09-29)

ChatDialog shell, InterfaceSettings density, folder/project confirm copy; `/settings-review.html`; 724/724 at delivery.

## Superseded handoffs and early Build notes (moved from ACTIVE)

Chronological handoffs, commit authorizations (`ca5b001`, `03e1271`), round-6 evidence matrix (synthetic + isolated F5), test-fix 21→0, composer/navigation deliveries, skill lab iterations — preserved verbatim in Chinese.

### 2026-09-29 — First-open-folder preparation interaction

Short project-resource dialog on first send/attach; welcome canvas stays editable; tests and PRD sync.

#### 2026-09-28 — Title-bar icon, no-folder controls, settings pass

Grayscale brand, settings layout, runtime-ready publishing fix for composer/model picker.

### 2026-09-28 — WI-025 first Build slice, pending maintainer F5

Token/empty/composer baseline; Critique checklist; preview matrix; WI-024 hunk isolation noted.
