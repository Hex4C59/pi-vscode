# WI-035: macOS Evaluation and Acceptance

English | [中文](2026-09-30-wi-035-macos-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Disposition: Accepted and closed on 2026-09-30 by the agent under this delegation
- Authority: historical evidence for this approved slice; not whole-PRD, release or other-WI acceptance
- Scope: [approved proposal](2026-09-30-wi-035-approved-proposal.md), REQ-005/REQ-006 and [ADR 0006](../decisions/0006-owned-runtime-handoff.md)
- Acceptance identity: agent under the maintainer's explicit 2026-09-30 delegation, not a claim that the maintainer personally ran these checks

## Approved Behavior and Implementation

At provider construction, automatically hand off a previous host's lost-owner run before admitting a replacement. Empty/verified retired domains show the normal page without End/Recover. Observe-only control distinguishes another live owner's run; opening or trying to launch there does not end it. Failed/unconfirmed handoff retains the fence and existing explicit recovery. In-session Stop/protocol uncertainty and the shared single-runtime restriction are unchanged.

Ownership validates a bounded exact-run control response, observes the durable exact-child terminal receipt and retires only that run. Managed-process serializes handoff with cleanup and protects active/pending launches and newer generations. Provider startup awaits handoff, revalidates disposal/workspace/resource state and suppresses obsolete recovery controls. Later acquisition clears the elsewhere-owner marker so this host's own subsequent failure still exposes recovery. No Webview DTO, preview fixture, storage schema or pi version changed.

## Automated Verification

| Check | Actual result | Scope |
|---|---|---|
| `npm run compile` | pass | Production bundles and TypeScript |
| `npm run lint` | pass | Static checks |
| `npm test` | 895/895 pass | Complete suite, including ownership decision table, real observe-only supervisor, process serialization and host startup regressions |
| `npm run package:vsix -- --out dist/delegated-macos-20260930/wi-035/pi-vscode.vsix` | pass | Fresh archive used for isolated installation |
| `node scripts/packaging/verify-vsix.mjs dist/delegated-macos-20260930/wi-035/pi-vscode.vsix` | pass; 15,535 entries | Pinned released pi, dependency tree and extracted real RPC readiness/gate handshake |
| `npm run docs:verify`, `npm run docs:i18n:check`, `npm run docs:health`, `git diff --check` | pass; zero errors | Structure, bilingual/link checks, health and whitespace; not behavior evidence |

New regressions cover empty/terminal/live-owner/owner-lost/unreachable/unconfirmed/invalid handoff, wrong run/child evidence, replaced fences and concurrent retirement; handoff versus active/in-flight launch; delayed resource/workspace/disposal changes; cleanup of an obsolete page and later same-host uncertainty. A retirement loser may fail and then observe empty; tests do not claim every concurrent caller succeeds.

## Native Environment and Provenance

macOS 27.0.1 (26A434), arm64; VS Code 1.139.1; released pi 0.86.1. Short owned root `/tmp/pi-w035-jBboSE` held distinct dev/installed user-data, extensions and shared-data directories plus empty agent configuration. The ordinary VS Code profile and its historical recovery fence were not activated or changed. No credentials, prompt, model inference, resource loading, tools or workspace writes were used.

Actual F5 was dispatched from an isolated parent using a scratch launch configuration pointing at this extension's source. The resulting Extension Development Host initially had no folder; positional/folder-URI attempts did not bind the intended scratch folder. The native Open folder flow produced an Untitled Workspace whose recorded folder was the existing `playground`, not the intended scratch B. Resource consent was declined, no attachments or tasks were sent, and no files in that folder were edited. This is real F5 evidence with isolated application/configuration, not a claim that the intended scratch workspace or repository default launch arguments worked unchanged.

The installed run used a newly packaged VSIX and independent isolated installation. Initial `/tmp` alias startup did not reach readiness; the canonical `/private/tmp/pi-w035-jBboSE/B` did. That initial failure is not a pass and no general path-alias fix is claimed. Package SHA-256: `d059140ba451a041a1db85006d8b3addfe872e62b33e55e30fa219f2a849ac83`; archive bytes: 149,812,635.

## Actual Handoff Evidence

| Path | Original run / exact child | Verified owner loss and handoff | Fresh replacement |
|---|---|---|---|
| F5 | `8b3f636c-d64a-4e2c-872b-1192958dc377` / `92bd0dc6-dc45-433a-8335-1d62d9b11392`; owner 8338, supervisor 8458, pi 8460 | Exact isolated owner SIGKILL; observed owner-lost with live child and no end request. Developer host did not automatically restart; native Developer: Reload Window reactivated it. Matching child-exited receipt code 143, retired fence, old child/supervisor absent; empty sidebar had no recovery banner/actions | `f7a08431-80f0-42bb-bc11-17a664aff2ef` / `336e5895-3b31-4d43-abbf-5f392d3d3402`; supervisor 9699, pi 9700; actual ready projection after fresh declined resource choice |
| Installed | `6c4677ea-1626-49f3-9d83-89ceac7952c7` / `87611c88-6661-4e4f-b359-ce5100697317`; owner 7791, supervisor 7948, pi 7954 | Exact isolated owner SIGKILL; observed owner-lost with live child and no end request. VS Code restarted its host; matching child-exited receipt code 143, retired fence, old child/supervisor absent; no recovery banner/actions | `30b604f5-71a6-4c36-81df-04db83f9d815` / `676a9df4-40bd-4712-8146-d09160626030`; supervisor 8374, pi 8375; actual ready projection after fresh choice |

Installed live-owner safety used a second window in the **same installed user-data recovery domain**. It showed no End/Recover. An attempted launch reported the occupied domain; the original fence/run and owner/supervisor/child PIDs remained unchanged and control observation stayed `owned`, `endRequested:false`. This is not evidence for independent per-window domains.

Local raw evidence is retained under [WI-035 evidence](../../dist/delegated-macos-20260930/wi-035/setup.json): `dev-first*.json`, `dev-after-handoff-empty.json`, `dev-replacement*.json`, `installed-canonical*.json`, `installed-after-second-window.json`, `installed-occupied-attempt.json`, `installed-after-occupied-attempt.json`, `installed-after-handoff-empty.json`, `installed-replacement*.json` and `cleanup.json`. These ignored local artifacts are not a claim of checked-in raw evidence; the identifiers, observations and limitations above are the durable summary. Actual screenshots: [F5 empty page](../../dist/delegated-macos-20260930/wi-035/dev-after-handoff.png), [installed live-owner second window](../../dist/delegated-macos-20260930/wi-035/installed-live-owner-second-window.png), [installed after handoff](../../dist/delegated-macos-20260930/wi-035/installed-after-handoff.png).

## Failures, Cleanup and Limits

- Initial native setup/path and evidence-tool assumptions failed; corrected pi process-title identification and dynamic Webview context discovery. Failed assertions are not counted as passes.
- In the empty installed fixture, “Could not load provider configuration” was visible before and after handoff, separately from recovery. The ready runtime later showed no configured model. No provider-configuration fix or entirely error-free installed UI is claimed.
- Browser.close ended the dev application but lost its CDP acknowledgment; a stale installed-target close attempt was not evidence of cleanup. Main-process exits and exact identities were checked instead. The installed application's exact isolated main was stopped after its windows had closed. Cleanup used the production owner handoff API only after the captured owners were gone, with unchanged matching fences. Both replacement domains are empty and all captured owners/supervisors/children are absent; cleanup is not counted as the earlier native UI handoff proof.
- Unreachable/no-receipt/corrupt and same-host protocol/Stop branches have automated regression evidence, not native reproduction. No Windows, fork/remote/multi-root execution, model call, descendant termination or file rollback acceptance.
- WI-036's separate-domain and immediate owner-loss-cleanup choices remain unimplemented. ADR 0005 and the whole Draft PRD retain their existing status. No Git commit or push.

## Final Disposition

The agent accepts and closes WI-035 and promotes ADR 0006 to Accepted under the explicit 2026-09-30 delegation. Implementation, full automated checks, separately captured actual macOS F5/installed handoffs, live-owner safety and owned-resource cleanup satisfy this approved slice. Documentation verification/health and whitespace checks pass. Only ADR 0002's startup ceremony is superseded; other requirements, gates, in-session recovery and WI-036 remain unchanged. No Git commit or push.
