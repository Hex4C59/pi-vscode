# WI-038: macOS Evaluation and Acceptance

English | [中文](2026-09-30-wi-038-macos-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Disposition: Accepted and closed on 2026-09-30 by the agent under this session's complete-ACTIVE-tasks wrap-up-and-commit request; ADR 0007 promoted to Accepted
- Authority: historical evidence for this approved concurrency slice; not whole-PRD, release, gate or ADR 0005 acceptance
- Scope: [approved proposal](2026-09-30-wi-038-approved-proposal.md), REQ-002 / ARCH-05, [ADR 0007](../decisions/0007-endpoint-write-transaction.md)
- Acceptance identity: agent under the maintainer's 2026-09-30 request to finish remaining ACTIVE tasks, write wrap-up records, and commit after each task; not a claim that the maintainer personally reran these checks

## Approved Behavior and Implementation

The host `models` module owns `.models.json.pi-vscode.lock` beside canonical `models.json`. Add/remove acquire it once before reading and hold it through replacement. Contention fails immediately. Only a clean commit continues provider reload/login/logout. A committed cleanup failure reports the saved/removed state and does not continue credential actions or retry the mutation. Leftover locks are not removed by age or PID. No Webview filesystem or unlock capability was added.

Implementation is `d485cc4` (`feat(host): serialize models.json writes across hosts`).

## Automated Verification

Build recorded 990 tests (63 new cases), including independent-process failure/cleanup, native FIFO rejection, the host call-chain result gate and initialization-failure projection. This close reran compile, lint and the full suite on the current tree after WI-039 packaging landed.

| Check | Actual result | Scope |
|---|---|---|
| `npm run compile` / `npm run lint` | pass | Production bundles and static checks |
| `npm test` | 993 pass, 0 fail/skip | Includes the WI-038 transaction suite plus WI-039 packaging regressions |
| Implementation commit | `d485cc4` | `endpointFileTransaction.ts`, ProviderConfig result gating, host call chain |

## Native Environment and Provenance

macOS 27.0.0 (arm64); released pi 0.86.1. Isolated owned root `/private/tmp/pi-w038-4cmFzI` with distinct parent/dev/installed user-data. Synthetic endpoints only; no real login, model or paid call. Installed evidence used the WI-039 archive `pi-vscode-final.vsix` (149,921,300 bytes, SHA-256 `1a70dd777a92fbcf5205d3f927e87482e347835b23130e3caa123b93ab22f6c9`) after the pre-fix package blocked provider loading. Local report: `dist/wi038-native/report-pi-w038-4cmFzI.json`.

## Actual two-window evidence

Fixed lock text observed on both hosts: `The endpoint file is locked. Try again after the other write finishes. If this persists, close writing windows and verify the leftover lock before clearing it.`

| Host | Contention | File during lock | After release |
|---|---|---|---|
| Development F5 | Add and remove both returned the lock error in both windows | `ids: ["fixture-endpoint"]` | Add retry kept `fixture-endpoint`, `development-holder`, `development-add-0`, `development-add-1`; remove retry then kept `development-holder-2` as well |
| Isolated installed | Same add/remove lock errors after `provider-loaded: true` | `ids: ["fixture-endpoint"]` | Add retry kept `fixture-endpoint`, `installed-holder`, `installed-add-0`, `installed-add-1`; remove retry then kept `installed-holder-2` |

`failures` was empty. Owned processes were gone (`cleanupRemaining: []`). The isolated agent directory retained only synthetic endpoints; `auth.json` was `{}`.

Development-host add retry used native password-prompt Escape to cancel login after a clean file commit. That is not a live credential, model or paid-call pass.

## Failures, Cleanup and Limits

- Installed evidence before WI-039 is not a pass.
- Nonparticipating external writers can still race the final check and rename.
- ARCH-06 output budget, ADR 0005 live login/endpoint calls, and automatic stale-lock takeover remain outside.
- No gate closed. No push.

## Final Disposition

The agent accepts and closes WI-038 and promotes ADR 0007 to Accepted under this session's complete-ACTIVE-tasks wrap-up-and-commit request. Implementation, 993 automated tests, and separately captured macOS development plus isolated installed two-window contention/serial-commit evidence satisfy this approved slice. Only the cross-host write exclusion is accepted.
