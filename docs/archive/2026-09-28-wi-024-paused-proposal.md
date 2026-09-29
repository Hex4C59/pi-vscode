# WI-024 — Provider/model configuration (paused proposal)

English | [中文](2026-09-28-wi-024-paused-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-28
- Authority: historical proposal, pause-time handoff and the 2026-09-29 maintainer F5 closure; current work is [`ACTIVE.md`](../../ACTIVE.md)

## Closure — 2026-09-29

The maintainer confirmed F5 visual acceptance for the parked checks: WI-024 settings section, Add key and model-picker recovery, and the separate WI-023 check that the settings layout and model picker are visible. They tested the development host and were satisfied. This is personal maintainer inspection. It closes WI-023 and WI-024.

The surface they accepted is the current development host. Its settings page is the WI-026 editor panel, so this confirmation does not re-accept the retired sidebar dialog. OAuth, custom endpoints, ambient cloud credentials, paid calls and installed VSIX stay outside this acceptance. No new ADR, gate, commit or push. The sections below keep the pause-time "F5 pending" wording as history.

## Why archived

On 2026-09-28 the maintainer authorized a separate sidebar visual-craft WI (WI-025) and asked that WI-024's F5 stay in the parking lot rather than be merged into that slice. WIP=1 meant WI-024 left the Current work section. At that date it was paused, not accepted. The closure above is 2026-09-29.

## Approved scope (unchanged)

- **PRD assessment:** user-visible. Narrows D-04 “defer login UI” for this personal-target slice so an API key and default model can be configured inside the extension. Approval semantics unchanged; secrets never reach the Webview.
- **Gate / Decision:** no new gate or ADR; Living contract and ADR 0001/0004 apply; secrets stay host-side. Decision: none.
- **Scope:** provider status in the settings gear, host InputBox writes to `~/.pi/agent/auth.json`, default model written to settings, model list refresh after configuration. **Not** authorized: OAuth, custom `models.json`, parallel SecretStorage, paid probes, commit/push.

### Delivered

1. “Providers and models” section in Interface settings: API-key provider status (ready / not configured, source label), Add key / Remove, default-model dropdown.
2. Keys only through the host's native password InputBox via public `ModelRuntime.login` / `logout`; the Webview only sends a `providerId` intent.
3. Default model persisted through `SettingsManager.setDefaultModelAndProvider`; applied to the running session when ready.
4. The no-model banner opens settings.

Messages: outbound `providerConfigState`; inbound `openProviderApiKey` / `logoutProvider` / `setDefaultModel` / `refreshProviderConfig`.

### Acceptance

| Item | Observable criterion |
|---|---|
| Settings entry | Provider choice, configured summary and default-model control visible in the gear |
| Key path | Add key opens the host password box; no key in Webview or messages afterwards |
| Model recovery | With a folder open and runtime ready, `ModelPicker` shows a real model after configuration |
| Regression | compile / lint / relevant npm test / verify:webview; required F5 visual check |
| Explicitly unaccepted | OAuth, custom endpoints, ambient cloud credentials, paid calls |

## Status when paused

- Done: Prepare/Build approval; implementation and automated checks (`compile` / `lint` / `npm test` 679/679 / `verify:webview` / `docs:verify`); maintainer confirmed the hybrid layout ([discussion](../discussions/2026-09-28-wi-024-provider-settings-layout.md)); implementation commit authorized and made (excluding `.vscode/launch.json`).
- Uncommitted when paused: the hybrid-layout and model-sync repairs in `candidate.css`, `interface-settings.tsx`, `piChatViewProvider.ts`, `modelSettings.ts` and their tests.
- **Pending:** maintainer F5 for the settings section (progressive disclosure), Add key and model-picker recovery. The separate WI-023 F5 (settings layout / model picker visible) is also still pending.

## Superseded handoff

**2026-09-28 — Settings had a model but the composer did not.** Root cause: settings wrote auth/default model through the host SDK while the composer read the RPC session; `setDefaultModel` went through `models.select`, which silently skipped `set_model` when the RPC catalogue was empty. Fix: `applyConfiguredModel` no longer requires the catalogue; configuration syncs the session and restarts the runtime when no model remains. Checks: related model-settings tests passed. Pending maintainer F5.

**2026-09-28 — Composer still had no model (second fix).** Probe: the local `~/.pi/agent` already had hellocode/gpt-6-sol, and pi RPC (including PI_OFFLINE) returned it, so the problem was extension-side sync. Hardening: after runtime ready, await load/refresh and apply the default when no chatModel; provider refresh also syncs; `getWorkspaceState` syncs when ready without a model; apply again after restart. **Later superseded by WI-025:** awaiting the SDK refresh held session switching and disabled "+" and the model selector; the sync now runs in the background after ready is published (see `ACTIVE.md`).
