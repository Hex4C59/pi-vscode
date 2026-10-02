# WI-085 — available model and thinking cycling

English | [中文](2026-10-03-wi-085-model-cycling.zh.md)

- Type: Discussion
- Status: Active
- Created: 2026-10-03
- Authority: bounded PI-GAP-14 Prepare and pending evidence
- Related: [ACTIVE](../../ACTIVE.md), [bounded goal](2026-10-03-eight-gap-goal.md), [requirements](../product-requirements.md)

## Prepare and approval

The current bounded goal explicitly approves PI-GAP-14 implementation, verification, delegated evidence-based acceptance and local commits. WI-084 retains its native blocker and is unfinished; this is the sole current WI. Before code, inspect ModelSettings, provider admission, the live catalogue/projection RPC parsing, manifest commands and existing settings composition harness. Current selectors already validate available models/levels and queue a next-turn intent while chat runs; they serialize mutation and read back failures. Actual model identity is provider + modelId, not a pretty label. pi remains the declared 0.86.1; no upstream upgrade or direct provider implementation.

## Proposed bounded behavior and architecture

Five native commands: choose a cycling subset, previous/next model, previous/next thinking level. Commands are bindable through standard VS Code keyboard settings; do not install default shortcuts or change existing selector/defaults. The subset is memory-only, initially empty, scoped to the current workspace generation/runtime session. Native multi-select displays only the actual current available catalogue; user confirmation, including an empty selection, replaces it. Cancellation preserves it. No settings/auth/session-file writes or credential collection. Empty/no-longer-available models and levels produce explicit localized notices; no automatic provider requests or fallback selection. Intersect the subset with each fresh actual catalogue, preserve its catalogue order, wrap previous/next; use pending model/level as the anchor during a running task, otherwise applied identity. Unknown anchor selects first for next, last for previous. Failed application stays truthful through existing ModelSettings projection/error behavior; do not report requested state as applied.

Reuse ModelSettings.select and its exact ready/blocked/modelBusy/chatBusy/stopping semantics; do not bypass busy, session transition, trust or interaction guards. Expose a narrow admission query from that owner rather than duplicating its policy. Native picker has one owner, 2-minute deadline, identity/admission checks at acceptance, and disposal/late invalidation cleanup. Prevent overlapping subset selection/cycling; if runtime/catalogue or pending/applied state changes while choosing, reject the stale result. Host-only command intents, no new Webview resource/execution authority. PI-GAP-22's broader catalogue UI is outside this slice.

## Failure modes before code

Cycling unconfigured or unavailable models; matching a duplicate pretty label instead of identity; empty subset/levels silently failing; same-item wrap treated as mutation; cancel erasing choices; persisted subset leaking between workspaces; stale picker selecting an old runtime; busy/model mutation/interaction/profile/session/Stop races; pending next-turn selection anchored to the old applied value; failed mutation claiming success; model changing level support; overlapping commands; picker errors/deadline/late events/listeners leaking; translated native titles unclear; selectors or saved defaults changed unintentionally.

## Observable acceptance and artifacts

Before application code, prepare provider→ModelSettings→runtime composition checks for confirmed subset and identity, wrapping model/levels, empty/cancel/singleton/unavailable/stale/failure, busy next-turn intent and Stop/settlement, existing selector unchanged, disposal/overlap. Use synthetic catalogue and isolated state, never real credentials or paid calls. Verify public actual pi set_model/set_thinking_level behavior with an isolated synthetic loopback if needed; record runtime versus simulation separately. Run compile, lint, standard behavior and docs checks; review scoped diff, local implementation commit, clean candidate checks and packaging. F5/installed VSIX separately require actual native multi-select, command keyboard interaction and readable English/Chinese controls. Existing isolated-Code binding blocker is retained, not a native pass. Evidence root `dist/goal-eight/wi085/`; no implementation or acceptance at Prepare.
