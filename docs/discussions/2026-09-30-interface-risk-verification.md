# Interface-risk verification: Composer flags and FileSnapshot validators

English | [中文](2026-09-30-interface-risk-verification.zh.md)

- Type: Discussion
- Status: Closed
- Created: 2026-09-30
- Authority: WI-051 evidence; not an implementation approval, ADR or interface redesign
- Related: [UI audit](2026-09-30-ui-components-audit.md), [core-boundaries audit](2026-09-30-core-boundaries-audit.md)

## Question

Do production callers combine Composer eligibility flags independently of workspace, or pair a selection `FileSnapshot` with the whole-file validator?

## Composer flags

Production mounts `MessageComposer` only from `Candidate`. That function derives:

| Flag | Source |
|------|--------|
| `canPrepare` | `needsWorkspacePreparation(state)` from the same workspace snapshot |
| `canBrowse` | `state.status === "eligible"` and a recorded choice, plus no client error |
| `canCompose` | `canBrowse` and `runtime === "ready"` and not busy |
| `sendBlocked` | while preparing: empty text / busy / error; otherwise `availability(snapshot).sendDisabled` |
| `attachmentDisabled` / `showStop` / session transition | `availability(snapshot)` from the same client snapshot |

`ComposerProps` still allows contradictory combinations because it is a flat bag. Preview does not mount a second composer. No production caller supplies flags that disagree with the workspace used in the same render. Propagation cost of tightening the type is every composer test fixture; that cost is not justified without a mismatched caller.

## FileSnapshot validators

`FileSnapshot` is the captured document payload. `DraftAttachment` is a discriminated union: `kind: "file"` versus `kind: "selection"` with `authorized` revision.

| Owner | Pairing |
|-------|---------|
| `captureFile` | wrapped as `kind: "file"` |
| `captureSelection` | wrapped as `kind: "selection"` with `authorized: source` |
| `addAttachment` / `confirmAttachment` / submit revalidation | `a.kind === "file"` → `validateEditorSnapshot` / `revalidateFile`; else `validateSelectionDocument` / `selectionSourceRevision` |

The type of `validateEditorSnapshot` still accepts any `FileSnapshot`, including one whose `text` is a selection. Production never calls it without `kind === "file"`. `SelectionSourceRevision` already exists as the selection-side identity. Branding or splitting `FileSnapshot` would touch capture, draft, and tests without a demonstrated wrong pairing.

## Conclusion

No production combination error is confirmed. Do not tighten Composer props or split `FileSnapshot` on this evidence. ARCH-01–04 owner inventories remain separate.
