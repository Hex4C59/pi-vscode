# WI-030 — OAuth sign-in and one OpenAI-compatible endpoint

English | [中文](2026-09-29-wi-030-oauth-endpoint.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-29
- Authority: historical WI-030 scope and the maintainer's close; current work is [`ACTIVE.md`](../../ACTIVE.md)

## Closure — 2026-09-29

The maintainer said WI-030 is complete. That closes the remaining check: the settings sign-in entry and the add-endpoint control. It is personal maintainer confirmation of that slice. It does not record a live browser sign-in, a live endpoint call, a paid probe, or a new installed VSIX. ADR 0005 stays Draft. No new gate, commit, or push is authorized by this close. WI-031 remains the current work.

The approved behavior stays the WI-026 editor settings page. A provider with public OAuth login starts that login on the host. The host opens only http(s) URLs without userinfo and shows a device code in a native prompt. One custom OpenAI-compatible endpoint is a display name, base URL and model id; the API key is still the host password prompt through `ModelRuntime.login`. `models.json` receives no API key, headers, shell command or environment interpolation. A damaged file is left unchanged. Removal is limited to a non-built-in provider in that file.

Agent checks recorded before the pause: `compile`, `lint`, `npm test` (771/771), `verify:webview`, `docs:verify` (0 errors; two Draft-ADR warnings). This close did not rerun them.

## Follow-up — 2026-09-30

Isolated installed VSIX live custom-endpoint completion and GitHub Copilot device-code/browser OAuth were recorded. [ADR 0005](../decisions/0005-custom-endpoint-file.md) is Accepted. [Evidence](2026-09-30-macos-verification-acceptance.md).

## Replacement reason

ACTIVE keeps WI-031 as the current item. The paused WI-030 proposal and handoff move here.
