# WI-049: macOS Evaluation and Acceptance

English | [中文](2026-09-30-wi-049-macos-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Disposition: Accepted and closed on 2026-09-30 by the agent under this session's complete-ACTIVE-tasks wrap-up-and-commit request
- Authority: historical evidence for this packaging required-asset slice; not whole-PRD, gate or ADR 0005 acceptance
- Scope: [approved proposal](2026-09-30-wi-049-approved-proposal.md), ARCH-07
- Acceptance identity: agent under the maintainer's request to finish remaining ACTIVE tasks; not a claim that the maintainer personally ran these checks

## Approved Behavior and Implementation

`collectPackageFiles` and `verify:package-files` require host JS, webview JS/CSS and the three helper bundles. CI runs those checks after compile. `verify-vsix` remains the unpack-run lane and is not invoked from `package:vsix`.

## Automated Verification

This close reran compile, lint, `verify:webview`, `verify:package-files` and the full suite on the current tree.

| Check | Actual result | Scope |
|---|---|---|
| `npm run compile` / `npm run lint` | pass | Production bundles and static checks |
| `npm run verify:webview` / `npm run verify:package-files` | pass | Local dist assets and the packaging required-file list |
| `npm test` | 1015 pass, 0 fail/skip | Three new cases: JS-only collection fails, CSS without helpers fails, complete synthetic tree passes the disk check |

## Native evidence

Not required. This close did not pack or unpack a production VSIX.

## Failures, Cleanup and Limits

- Does not run `verify-vsix` from `package:vsix`. Does not accept ADR 0005. No gate. No push.

## Final Disposition

The agent accepts and closes WI-049 under this session's complete-ACTIVE-tasks wrap-up-and-commit request. Only the packaging required-asset failure rule is accepted.
