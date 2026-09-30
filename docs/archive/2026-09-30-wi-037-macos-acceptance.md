# WI-037: macOS Evaluation and Acceptance

English | [中文](2026-09-30-wi-037-macos-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Disposition: Accepted and closed on 2026-09-30 by the agent under this explicit native-evidence-and-close delegation
- Authority: historical evidence for this approved slice; not whole-PRD, release, gate or other-WI acceptance
- Scope: RUNTIME-01/02 inside existing WI-032 credential families; REQ-004 display redaction
- Acceptance identity: agent under the maintainer's explicit 2026-09-30 request to gather native evidence and close the task, not a claim that the maintainer personally ran these checks

## Approved Behavior and Implementation

Shared display redaction hides a complete quoted credential value, including whitespace and escaped quotes; an unterminated quoted value hides the remainder. Valid JSON is parsed so only credential values are replaced. Thinking keeps bounded raw context on the host/adapter, separate from `ActivityItem.text`, so later fragments cannot expose the continuation of a recognized Bearer, private-key or credential-field value. Raw context is at most 16,384 UTF-16 units per admitted thinking item. Assistant-body per-delta streaming remains the disclosed out-of-scope issue. No Webview DTO, pi API, gate or ADR changed.

## Automated Verification

Recorded at Build, before this native close. This close did not rerun application compile, lint or `npm test`.

| Check | Actual result | Scope |
|---|---|---|
| `npm run compile` / `npm run lint` / `npm test` | 927 pass, 0 fail/skip; 32 new cases | Thinking-frame and host credential-projection regressions through the production decoder and simulated host `postMessage` |
| Focused credential/thinking specs | 92 pass | Shared rules, thinking redaction and host projection |
| `git diff --check` on the implementation diff | pass | Whitespace; not behavior |

## Native Environment and Provenance

macOS 27.0.1 (26A434), arm64; VS Code 1.139.1; released pi 0.86.1. Isolated owned root `/private/tmp/pi-w037-6Uy3tX` held distinct parent/dev/installed user-data and a dedicated `PI_CODING_AGENT_DIR`. The ordinary VS Code profile was not used. No real credentials, user config, paid calls or uncontrolled network.

An earlier isolated-HOME launch showed macOS **Keychain Not Found / Code Key**. That path was abandoned. The accepted run kept the login `HOME`, launched with `--use-inmemory-secretstorage` and `--password-store=basic`, and would click **Cancel** only if the dialog returned; **Reset To Defaults** was never used. The accepted run did not show the dialog.

A prior F5 attempt under the `/tmp` alias failed gate cwd matching and is not a pass. The accepted run used the canonical `/private/tmp/...` workspace, the same macOS alias lesson recorded for WI-035.

Actual F5 was dispatched from an isolated parent using a scratch `launch.json` (`noDebug`) pointing at this extension's source. The Extension Development Host reused parent remote-debugging port 19470; that is still real F5, not CLI `--extensionDevelopmentPath` as a substitute. Resource consent was **Continue without**.

The installed run used the session VSIX already packed for this WI and an isolated `--extensions-dir` listing `pi-vscode-dev.pi-vscode@0.86.1`. Archive bytes: 149,813,579; SHA-256 `a317981a706d1754208f099e4a5e5139fbb502dd6ade10ff4a78b068b960056f`. This evidence run reused that archive (`WI037_SKIP_PACKAGE=1`); it did not repack. Earlier in the same session `verify-vsix` passed on this archive (15,535 entries, pinned pi 0.86.1).

Loopback OpenAI-compatible SSE supplied synthetic `reasoning_content` chunks `SYNTHETIC_PREFIX` / `SYNTHETIC_TAIL` / `SYNTHETIC_ALPHA` / `SYNTHETIC_BETA` and a final `synthetic-complete`. Two completion requests were observed (one F5, one installed).

## Actual thinking-redaction evidence

Both hosts showed the same incremental thinking projection. No `SYNTHETIC_` text appeared in thinking or body.

| Host | Incremental thinking frames | Final body |
|---|---|---|
| F5 | `""` → `use Bearer [redacted]` → `use Bearer [redacted] later; note password="[redacted]` → `use Bearer [redacted] later; note password="[redacted]" tail` | `synthetic-complete`; leaked false |
| Isolated installed | same four frames | `synthetic-complete`; leaked false |

Workbench screenshots show the collapsed thinking summary `use Bearer [redacted]`. CDP opened the thinking details and recorded the complete redacted string, including the quoted password value. Local raw evidence is retained only in ignored build outputs:

```text
dist/delegated-macos-20260930/wi-037/report.json
dist/delegated-macos-20260930/wi-037/f5-after-stream.png
dist/delegated-macos-20260930/wi-037/installed-after-stream.png
```

Ignored local artifacts are not checked-in proof; the identifiers and observations above are the durable summary.

Owned Code processes matching the accepted root were stopped; `cleanupRemaining` was empty. The leftover `/tmp` directory is local residue, not a live runtime.

## Failures, Cleanup and Limits

- Isolated-HOME keychain dialog and `/tmp` alias gate-cwd failure were corrected in the evidence runner; those attempts are not passes.
- Collapsed thinking chrome does not show the full redacted paragraph until details are opened; the pass is the CDP frames plus the screenshot of the collapsed summary.
- JSON/unstructured quote-edge cases, overflow and reset isolation remain automated, not natively replayed.
- Assistant-body per-delta streaming is still out of scope. WI-036 is still parking. Windows F5/install remains out of scope.
- No whole Draft PRD, gate or ADR status change. No Git commit or push.

## Final Disposition

The agent accepts and closes WI-037 under the explicit 2026-09-30 native-evidence-and-close request. Implementation, 927 automated tests, and separately captured macOS F5 plus isolated installed thinking-redaction streams satisfy this approved slice. Documentation verification/health belong to the close checks in ACTIVE. Only this REQ-004 repair is accepted.
