# Goal frontend and attachment checkpoints

English | [中文](2026-09-22-goal-frontend-attachment-handoffs.zh.md)

- Type: Reference
- Status: Superseded
- Created: 2026-09-22
- Superseded by: [Current work](../../ACTIVE.md)
- Authority: historical evidence only; not implementation authorization or maintainer acceptance

## Why this record was retained

The Goal completed the executable frontend migration and WI-014 attachment slices and advanced its sole Build item to WI-016. This replaces their former Build/progress handoffs, **not** their pending maintainer acceptance, Draft ADRs or Open gates. Current requirements, scope and unresolved decisions remain in ACTIVE and its authoritative links. Dates below are September 22 UTC; the test machine's +08:00 clock was September 23.

## Shared evidence boundary

All Goal checks used native Windows Node 24.12.0, npm 11.6.2 and native esbuild, with declared pi 0.86.1. The repository HEAD remained `4bbf9ec923f2499a88f52a29b8439fb9d9d5396c`, index empty, existing user changes retained. No user credentials or .local-env were read, no paid provider was used, no adjacent repository was modified and no commit/publication occurred. Genuine pi evidence used an isolated loopback synthetic provider; it is not real-model quality or maintainer acceptance.

The ignored evidence root is `dist/goal-evidence-20260923/`. It contains fixed-file review baselines, red/green logs, package hashes, browser/native screenshots, isolated profiles/configuration and owned fixtures. Retain unique evidence until acceptance and the agreed retention period ends; do not delete a path merely because it looks temporary. Earlier retained paths `dist/wi015-evidence/`, `dist/component-check/` and `D:/DevCaches/pi-vscode-ui-20260922` retain their original review purpose and cleanup conditions.

## Verified checkpoints

| Checkpoint | Current executable evidence at that checkpoint | Retained scope and limits |
|---|---|---|
| WI-015 frontend | 149/149 tests; compile, lint, docs and diff checks; 90 browser combinations, actual F5 and ordinary installed VSIX; separate Standards/Spec reviews with no unresolved findings | React/Vite migration integrated; not whole-product delivery; ADR 0003 and maintainer experience acceptance pending |
| T014-02 latest whole file | 157/157; browser, actual F5 and installed synthetic inference; two edits/two confirmations, native keyboard, exact Unicode, immutable history/no save | Whole-file refresh/confirmation, no automatic send; changed source, Stop and late-answer protection |
| T014-03 fixed selection | 173/173; 18 browser flows plus compact viewport; final code repeated in actual F5 and installed VSIX after fixes | Original selection bytes/range retained; old-snapshot choice after changes; pre-read document validity and independent composer scroll fixes |
| T014-04 mixed vector | 189/189; 9 browser combinations with 20 items; F5 and installed mixed confirmation, native 20/21 and 1 MiB boundaries; genuine pi worst-escaped frame | One ordered atomic vector, no prefix admission/send; 128 snapshot records/8 MiB retained payload, body charged once; 1 MiB NUL text produced a 7,340,524-byte frame and exactly one prompt |
| T014-05 history | 197/197; compile/typecheck/lint; 9 browser combinations plus 480px viewport and streaming; separate final F5 and installed long-history/capacity/reset flows | Local 16-record pages, submission continuation, exact optional previews, no persistence/automatic reset; old history after more than 32 chat rows; 128-record overflow preserves full unsent draft |

Each checkpoint's passing tests are historical, not a later run's passes. Browser, actual F5, installed package and synthetic-runtime evidence are distinct. The root checkpoint's original package hash was `e964ae4729ff546732373d4e2dc95d4fbd815652b25a26eb6e1d99b8d32014a2`; subsequent packages below supersede it for their slices.

| Package in its slice directory | SHA-256 | Bytes |
|---|---|---|
| `wi014-t02/pi-vscode-t01402.vsix` | `43c54fce4fef1f8845814dd6803eaf39e27aed5642544f39d5e77b454caecb24` | 146580792 |
| `wi014-t03/pi-vscode-t01403.vsix` | `1e93469c722ed93a6fe2bd92205edcc00e08d67f44035406feac586934a3ef59` | 146582328 |
| `wi014-t04/pi-vscode-t01404.vsix` | `343720223b6818ff93e997027183f33375c6183666fea56ec838962356a1cb42` | 146583104 |
| `wi014-t05/pi-vscode-t01405.vsix` | `8294095c52efa3e961732c84cc87b24b0eb7d90b170ebf02a0e5def96fbb42a0` | 146583653 |

Each attachment checkpoint package has 14,082 entries. Its package-content verification matches local/archive/installed host, bundled gate, Webview JS/CSS and the installed manifest (excluding installer metadata). VSCE rewrites README links; byte-identical packaged README was not claimed. Preview servers, evidence directories and secret configuration are excluded. Production assets do not rely on Vite.

## Fixes and evidence navigation

- WI-015 corrected strict host/approval projections, runtime rejection, settlement-before-ACK and loss/late-ACK handling, Stop resynchronization, approval expiry refresh, missing startup/error UI, high-contrast user messages and fixture/process timing. Root `tests-final.log`, `browser-check.json`, `browser-hmr.json`, `f5-evidence.json` and installed evidence own the exact observations.
- T014-02 `wi014-t02/` retains whole-file changed-source evidence and the Stop preparation revision/replay fix. Its final README-only repack is distinguished from native executable verification.
- T014-03 `wi014-t03/` retains `capture-boundary-red.log`, final 173-test logs, `browser-preview.json`, `browser-compact.json`, `f5-final-evidence.json`, `installed-final-evidence.json` and `package-content.json`. Earlier provisional evidence remains labeled; final native verification was repeated after the document-validity and composer-layout fixes. Selection example `中🐱 chosen\nsecond selected` retained 30 UTF-8 bytes and original zero-based range 1:0→2:15. Synthetic preview selection and exact-intent behavior are tested, not model evidence.
- T014-04 `wi014-t04/` retains atomic capture/send deletion-race reds, mixed-vector/budget tests and `review-unrelated-final-green.log`. Standards P2 was fixed: unrelated document changes no longer broadcast attachment state/history, while all matching entries invalidate together. `runtime-vector-evidence.json`, `browser-mixed.json`, separate `*-mixed-evidence.json`, `*-count-evidence.json`, `*-aggregate-evidence.json` and package hashes are the complete evidence chain. Native dialog automation uses only allowlisted owned fixtures and exact filename-control readback; no host intents are fabricated.
- T014-05 `wi014-t05/` retains pagination/preview/guidance reds, `tests-preview-green.log` (197), `host-long-history-green.log` (37), `browser-history.json`, compact and stream checks, and `f5-evidence.json` / `installed-evidence.json`. Browser geometry exposed flex-shrunk history cards (14px client height for 193px content); a scoped no-shrink rule fixed them. Long synthetic previews use 16,384-unit surrogate-safe chunks; synthetic streaming now retains the 32-message projection bound. These fixture fixes are not production-runtime claims. Both native modes exercised 33 records after old chat rows left the 32-message window, keyboard navigation, exact preview after owned source deletion/restoration, streaming page/focus/scroll, Stop preserving draft, 128-record overflow, and explicit warned Reload Window loss/recovery.
- Native **Reload Webviews** restores the renderer while retaining the same host viewId; it is not a new provider instance or extension-host restart. New provider-view identity and stale-view rejection are covered by the host regression. Explicit **Reload Window** separately demonstrated fresh resource consent, empty chat/history/draft and a new viewId. Do not conflate these proofs.

## Environment failures, review and cleanup

F5 startup intermittently crashed with code 134 before extension-host logging. T03 retained three failed starts and later succeeded after narrowing isolated outFiles; T04 retained three and succeeded with sourceMaps disabled; T05 still failed twice with that setting and succeeded on its third traced start. Root cause is **unknown**; neither workaround is a proven cure or proof of the repository's original launch configuration. Failures and isolated launch copies remain in each evidence directory; original temporary launch configuration was restored.

T02 recorded 34 owned native descendants plus its provider cleanup; T03 recorded 112 processes across repeated rounds; T04 and T05 each recorded 45 final owned processes. Their cleanup records verify no survivors or owned port listeners, reverted/restored fixtures and restored temporary configuration. T05's attempted Luna/max UI delegation produced no edits/checks and was stopped; root implemented and integrated it. Terra/high Standards and Spec reviews ended with no unresolved findings; their own focused runs are separated from root's full/native checks.

Maintainer acceptance, Draft ADRs/Open gates and the rest of REQ-001–009 are not closed by this archive. The Goal remains incomplete; follow ACTIVE for the next authorized slice.
