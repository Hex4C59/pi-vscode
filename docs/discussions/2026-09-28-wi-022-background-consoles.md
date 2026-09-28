# WI-022: default CLI workaround (closed)

English | [中文](2026-09-28-wi-022-background-consoles.zh.md)

- Type: Discussion
- Status: Historical
- Created: 2026-09-28
- Authority: historical evidence for the adopted CLI workaround; WI closure is [2026-09-28-wi-022-closure.md](../archive/2026-09-28-wi-022-closure.md)

## Current decision

The user requested a default no-daemon launch that still works with PowerShell -NoProfile and asked whether WI-022 could be archived. Keep NoProfile and do not load or edit private PowerShell profiles. Install local codex.ps1 and codex.cmd in the already-prioritized D:/Users/hex4c59/bin, with codex-local-launcher/launch.cjs forwarding to the unchanged official npm CLI and adding --no-daemon once. No PATH, registry, Codex source/binary, credentials or daemon state changes were made in this follow-up. The installed npm CLI now reports0.158.0; do not confuse it with the previously observed running0.157.1 daemon.

Only launches resolved through these shims are covered. Existing sessions, desktop/IDE clients, explicit codex.exe paths and explicit remote/shared-server use are not converted. --remote and agents are incompatible with this default; intentional shared operation must invoke the original npm launcher explicitly. Do not promise a global client patch.

## Evidence and limits

Evidence: dist/wi022-hidden-process-20260928/default-cli-launcher/. Five argument-preservation assertions pass (including resume, duplicate option and argument terminator); PowerShell5/7 with NoProfile and CMD version checks pass; resume help passes; invalid CLI option preserves exit2. Actual isolated VS Code terminals using NoProfile resolve the local CMD and final PowerShell shims, read back codex-cli0.158.0 and exit0; both owned Code hosts exit0. No model or paid calls were made. This verifies launch resolution and forwarding, not a fresh interactive model turn or every flash in the existing client.

Initial hidden test processes inherited PATHEXT=.CPL, while the machine value includes normal executable extensions. That caused misleading empty native output; those checks were not accepted. Retested with a synthetic environment using normal extensions and in actual terminals. A failed experimental PowerShell wrapper and intermediate path-escaping failure were withdrawn; the final deployed wrapper is the simple forwarding script. No system PATHEXT was changed.

## Retention and rollback

Persistent owned files: D:/Users/hex4c59/bin/codex.ps1, codex.cmd, codex-local-launcher/launch.cjs and OWNERSHIP.json. Keep them while the workaround is wanted. To roll back, verify no launcher depends on them, then remove only these owned files; never remove the user bin directory. The original npm entry becomes available again. Evidence includes failure observations and isolated test profiles; retain until no longer needed or durably archived and recheck owned processes before deletion. Existing larger evidence roots and source references retain their earlier cleanup conditions.

## Archival decision

The [long investigation and abandoned source-repair route](../archive/2026-09-28-wi-022-background-consoles.md) remain archived as diagnostic history. On 2026-09-28 the maintainer confirmed WI-022 is resolved and requested ACTIVE update; the WI is closed under [maintainer-confirmed closure](../archive/2026-09-28-wi-022-closure.md). ACTIVE no longer holds WI-022 as the current item. This discussion retains workaround evidence and limits; it does not claim an upstream Codex root-cause ADR or product-gate change.
