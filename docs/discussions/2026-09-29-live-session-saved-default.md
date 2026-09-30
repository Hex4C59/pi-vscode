# Live session model and Saved default orchestration

English | [中文](2026-09-29-live-session-saved-default.zh.md)

- Type: Discussion
- Status: Confirmed design; implemented as WI-057 on 2026-09-30
- Created: 2026-09-29
- Authority: **context only** — does not override [`ACTIVE.md`](../../ACTIVE.md), the PRD, or ADRs 0001–0004
- Related: [WI-024 paused proposal](../archive/2026-09-28-wi-024-paused-proposal.md), [WI-025 archive](../archive/2026-09-29-wi-025-active-superseded.md), [CONTEXT.md](../../CONTEXT.md)

## Background

Architecture review (2026-09-29) found a shallow seam between two modules that earn keep:

- ProviderConfig persists the **Saved default** through the in-process SDK.
- ModelSettings applies the **Live session model** through public RPC.

The coordinator (`PiChatViewProvider.loadStartupModels`, `syncSessionModelsAfterProviderConfig`) sequences persist → Live session refresh → one child restart when the session still has no model. WI-024 already documented that settings write via SDK while the composer reads the RPC session. PreviewBridge `setDefaultModel` mutates only `providerConfig` and does not run this sequence.

This is not a product merge. Approved WI-025 copy already treats Saved default and Live session model as distinct and must not present the default as already applied.

## Confirmed (maintainer, 2026-09-29)

1. **Freeze user-visible rules.** Pre-session Saved default changes do not start a session. When a Live session is ready, changing the Saved default still tries to apply it, including one restart if the child has no model. This slice only concentrates that order.
2. **Glossary.** `CONTEXT.md` now defines **Saved default** and **Live session model**. No third glossary noun for the sequencing module.
3. **Timing.** Recorded while WI-026 was Build: design only, no new WI and no application-code change. WI-026 closed on 2026-09-29. Opening the sequencing WI still requires an explicit maintainer request.
4. **Composition.** A new module owns sequencing. ProviderConfig (credentials / Saved default persistence) and ModelSettings (Live session apply) stay separate collaborators, injected into that module.
5. **Restart.** The sequencing module requests one restart through a narrow callback. The coordinator keeps `reconcileRuntime` and workspace eligibility. The sequencing module does not call `runtime.start` / `stop`.
6. **Tests.** New tests hit the sequencing module’s interface. Existing ProviderConfig and ModelSettings tests stay. Coordinator tests only check that intents are forwarded.
7. **Out of this slice.** No catalog-parser merge, PreviewBridge rewrite, bidirectional v3 admit, or Live session stream/Stop extract.
8. **Caller operations.** Two operations with today’s different restart rules: runtime-ready load (no restart) versus after Saved-default or credential write (restart once if still no model). Do not collapse them.
9. **Publish.** The sequencing module signals change. The coordinator still wraps view identity and posts `providerConfigState` plus Live session model fields, as it does for ModelSettings today.
10. **Home.** The module lives in `src/extension/models/`, exported from that directory’s public entry. No new directory.

## Implied receive routing (from 4 and 8; not a new product rule)

- `setDefaultModel`, `refreshProviderConfig`, `openProviderApiKey`, `logoutProvider` go through the sequencing module (persist/refresh, then Live session apply, then optional restart request).
- `setDefaultThinkingLevel` stays persist-only on ProviderConfig: no Live session apply, no restart.
- Coordinator constructs ProviderConfig and ModelSettings, injects both into the sequencing module, and keeps those same instances for publish.

## Evidence

- Glue: `src/extension/piChatViewProvider.ts` `loadStartupModels`, `syncSessionModelsAfterProviderConfig`.
- Startup load does not restart; post-write sync may restart once. `setDefaultThinkingLevel` persists only and does not sync the Live session model.
- Harness tests that currently hit the coordinator: `src/extension/tests/provider-model-sync.spec.ts`.
- Preview drift: `src/webview/preview/preview-bridge.ts` `setDefaultModel` (out of this slice).

## Current leaning (not implementation approval)

Design settled and later implemented as WI-057 (ARCH-02). User-visible rules stay frozen. See the [acceptance record](../archive/2026-09-30-wi-057-macos-acceptance.md).

## Open questions

None. Implemented as WI-057 on 2026-09-30.
