# WI-039: Approved PACKAGE-01 Packaging Scope

English | [中文](2026-09-30-wi-039-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical approved scope, not a new Build authorization
- Archival reason: WI-039 implementation and required evidence are complete; final disposition belongs to the [acceptance record](2026-09-30-wi-039-macos-acceptance.md) and [ACTIVE](../../ACTIVE.md).

## Approval and Traceability

The maintainer approved a new WI after WI-038 installed-host evidence was blocked: fix PACKAGE-01, add packaging regressions, verify the unpacked archive, then finish the isolated installed two-window run. The WI traces REQ-009 delivered-VSIX capability and the already-accepted WI-034 packaging slice; provider settings and endpoint paths remain REQ-002. No new gate or ADR. The whole Draft PRD is not accepted.

This session's maintainer request to complete remaining ACTIVE work, write wrap-up records, and create git commits after each task is the close authorization. Native evidence was captured during Build; this close does not claim the maintainer personally reran those hosts.

## Goal and Scope

An isolated installed VSIX must be able to create a runtime and load provider configuration. Packaging must refuse a delivered bundle that loads a runtime dependency that is not staged in the package.

In scope: host-bundle externals, packaging rejection, unpacked-archive import verification, and installed-host re-evidence. Out of scope: wiring `verify-vsix` into `package:vsix`/CI (ARCH-07), a packaging redesign, ARCH-06, ARCH-02, WI-036, a pi upgrade, public release, and final acceptance of WI-038 or ADR 0007.

## Approach

1. Keep only true runtime externals outside `dist/extension.js`: `vscode` (host-provided) and `@earendil-works/pi-coding-agent` (CLI spawned as a subprocess). Inline declared `@earendil-works/pi-ai` 0.86.1.
2. Scan delivered bundles for `require` / static and dynamic `import` / `export … from` bare specifiers. Every specifier other than `vscode` and Node builtins must map to a staged `node_modules/<package>`.
3. After unpacking, actually `import()` each specifier from the extension root. A pre-fix archive must fail; a post-fix archive must pass.

Inlining pi-ai grew `dist/extension.js` from 307 KB to 982 KB. Staging the full external resolution closure would have added about 824 MB uncompressed / 229 packages on the development tree.

## Acceptance

- Packaging specs cover specifier scanning, a fixed rejection message when a dependency is missing, and a pass when the pinned subtree is staged.
- Fresh packaging plus the unpacked verifier cover archive entries, pinned CLI/RPC/gate, and real imports of every bare specifier.
- `compile` / `lint` / full `npm test` pass.
- Isolated installed two-window settings load provider configuration. The same run also records endpoint contention for WI-038; that WI stays separate until its own close.

## Subsequent Limits

This is a packaging-capability repair, not a new user-visible behavior clause, gate, or module-responsibility change. ARCH-07 remains parked. Windows native F5/install stay outside the current macOS acceptance platform.
