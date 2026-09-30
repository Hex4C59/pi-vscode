# ARCH-08 streaming and history preview cost

English | [中文](2026-09-30-arch-08-streaming-history-cost.zh.md)

- Type: Discussion
- Status: Closed
- Created: 2026-09-30
- Authority: WI-053 evidence; not an implementation approval, ADR or optimization
- Related: [core-boundaries audit](2026-09-30-core-boundaries-audit.md)
- Environment: Node v25.9.0, this working tree, 2026-09-30. Synthetic in-process CPU only. Not a reproduced UI stall. VS Code `postMessage` IPC was not timed.

## Product bounds already in the hot path

| Bound | Owner |
|-------|--------|
| Last 32 messages | `text_delta` / `message_final` `messages.slice(-32)` |
| Assistant text 65 536 chars | same handlers |
| 64 activities | `activity` handler |
| History preview window 8 192 chars | `projectSavedHistoryPreview` |
| History overview 4 096 bytes | `bounded` |

These are reply/response budgets, not processing-cost budgets.

## Streaming publish and render

Each `text_delta` copies the message array, appends, and `publish()` posts the full workspace object (no JSON fingerprint skip, unlike interaction/profile/provider). The webview stores that object as `workspace` and `CandidateConversation` regroups every activity then maps every row; every assistant body with text calls `Lexer.lex` with no memo.

In-process averages on this machine:

| Workload | Result |
|----------|--------|
| `JSON.stringify` 32 messages × 1 KiB + 64 activities | 52 KiB, 0.06 ms |
| 32 × 8 KiB | 281 KiB, 0.17 ms |
| 32 × 32 KiB | 1.07 MiB, 0.39 ms |
| 32 × 65 536 (product cap) | 2.12 MiB, 0.41 ms |
| One growing 65 536-char message | 66 KiB, 0.03 ms |
| `Lexer.lex` GFM-off markdown 1 KiB / 8 KiB / 32 KiB / 65 536 | 0.28 / 0.29 / 1.07 / 1.99 ms |
| Sixteen 65 536-char assistant lexes (cap of mixed 32-row transcript) | 32 ms |
| Conversation Map regroup 32×64 | 0.007 ms |

The expensive measured step is re-lexing every assistant body on every snapshot, up to ~32 ms at the product cap. Typical single-message streaming is ~2 ms lex plus a ~66 KiB payload. Host-to-webview IPC of a 2 MiB snapshot is unmeasured. Conversation traversal is negligible.

## History preview

`selectSession` always `list`s via the public SessionManager, validates every listed entry, then `open`s the target. This slice did not run a real SDK list against a large session directory (that would be session files; out of scope to parse them). Sorting 1 000 synthetic metadata rows is under 2 ms.

`projectSavedHistoryPreview` walks parts for `totalChars` and keeps an 8 192 window. One 1 MiB string: 0.006 ms. The existing 600 × 1 MiB shared-block fixture (logical ~629 MiB, no join): 0.39 ms, matching the test that this path must not materialize the full text.

## Conclusion

Do not optimize on this evidence. Memoizing `ReplyMarkdown` lex or shrinking delta payloads would only be a later slice if a real host shows jank at the 32×64 KiB cap or if IPC of 2 MiB/delta is measured. History preview already avoids joining huge text; SDK list cost for many sessions remains unmeasured and is not a license to parse session files.
