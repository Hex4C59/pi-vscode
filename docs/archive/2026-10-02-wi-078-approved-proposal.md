# WI-078: approved composer command discovery proposal

English | [中文](2026-10-02-wi-078-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-02
- Authority: historical approved slice, not complete PI-GAP-02 acceptance

## Approval and archival reason

Archived after agent-delegated closure on October 2, 2026 under the continuing product-slice goal. The October 1 authorization covered Prepare→Build and scoped acceptance; the resumed goal approved uniform bare-command completion spacing. User-visible English/Chinese PRD rows preceded Build. Gate none; Decision none. WIP=1; no push, amend, rebase or force. Draft ADR 0010 was not accepted. Current work belongs to [ACTIVE](../../ACTIVE.md); results and limitations belong to the [acceptance record](2026-10-02-wi-078-acceptance.md).

## Goal and scope

A leading `/` opens a bounded composer command menu from the current public `get_commands` snapshot. List extension commands, prompt templates and skills with names, optional sanitized descriptions, source and coarse location. Complete the selected name into the acknowledged draft without sending. Append exactly one space only if there is no suffix; preserve existing argument/whitespace suffixes literally. Do not infer unsupported argument metadata.

Empty, unavailable, filtered-zero and stale generation are distinct. Never promote inventory/disk/marketplace entries to executable catalogue entries. Do not expose absolute paths, nested `sourceInfo`, credentials or AGENTS.md bodies. Actual loaded-context reporting remains parked; this closes only the menu slice.

## Approach and ownership

The pi 0.86.1 public RPC example uses legacy `path/location`, while public `SlashCommandInfo`/`SourceInfo` and observed RPC use `sourceInfo`. The adapter validates both and projects only coarse user/project location, omitting temporary provenance rather than guessing. Host owns generation, validation and catalogue presentation. Runtime-ready and committed replacement refresh the bounded snapshot in both Controlled and Trusted profiles.

`DraftSubmission` remains the sole host draft owner. Completion is one revision-checked mutation; the client anticipates the same acknowledged result. UI filters locally and imports host contracts only as types. Send remains the existing idle prompt admission. WI-077 still refuses leading slash in queues. No new storage, dependency, process policy or trust decision.

## Architecture review and intended evidence

| Dimensions | Prepare conclusion and close evidence |
|---|---|
| 1–5 boundaries, interfaces, dependencies, contracts, ownership | Adapter translates; host validates snapshot and draft admission; UI presents. Paired v3 validators, types and consumers are implemented; current contract remains Living. |
| 6 scope | Approved PRD WI-078 REQ-004/009; no loaded-context or package-management expansion. |
| 7–11 identity, transitions, concurrency, recovery, cleanup | Generation/revision guards drop stale catalogue/completion; empty and failure remain distinguishable. Composition exercises Stop/late replies; four real runtime replacements/exits and native cleanup observed. |
| 12–14 security, data, privacy | No persistence added. Paths and credential-shaped metadata are withheld; browser rejects extra path fields. Native fixture menu contains coarse locations only. This is not arbitrary-secret-removal certification. |
| 15 bounds | At most 512 rows, bounded name/description and draft size; filtering is local. |
| 16–19 testing, packaging, versioning, UX | Compile/lint/tests, browser matrix, actual pi, macOS F5 and installed VSIX separately recorded. Keyboard/mutex and synthetic IME covered; OS IME and extra-host compatibility remain unverified. |

## Failure modes written before implementation

Inventory displayed as executable; filesystem paths forwarded; invented TUI commands; completion sends or queues; slash bypasses queue refusal; replacement shows stale catalogue; empty appears loading; IME Enter selects; competing popovers overlap. Spacing-rule additions: missing delimiter; normalized tabs/newlines; repeated completion appends extra spaces or submits.

## Observable acceptance and exclusions

Observe `/`→sources→filter→acknowledged completion without Send; bare spacing and literal suffix; empty/error/stale/profile cases; keyboard, synthetic IME and mutex. Run compile, lint, npm test and browser English/Chinese narrow/theme cases. Use isolated genuine pi catalogue fixtures plus macOS F5 and installed VSIX; save reproducible reports/screenshots and observed cleanup. Run docs:verify and docs:health at close.

No downloading/marketplace, extra ecosystem, arbitrary extension compatibility, Chat Participant, remote/multi-root, extra platforms, approval bypass or public release. No sibling pi changes. PI-GAP-01 attachments/command expansion and PI-GAP-02 actual-loaded reports remain parked.
