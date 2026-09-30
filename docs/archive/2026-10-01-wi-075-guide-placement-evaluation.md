# WI-075: Guide placement evaluation

English | [中文](2026-10-01-wi-075-guide-placement-evaluation.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Authority: historical scoped record; not new implementation or product authorization

## Conclusion and scope

**Keep both guide pairs at their existing docs-root paths.** Migration to guides/ offers cosmetic category consistency but no demonstrated navigation or authority benefit for this task. This is the permitted no-migration outcome of DOC-ORG-03, not a new policy or architecture decision. Recorded under the scoped October 1 authorization; no product behavior, guide content or authority changes.

## Evidence and migration cost

At tracked baseline `bd6ed12`, a full UTF-8 tracked-file scan (including hidden tracked files) found `git-commit-convention` in 13 files / 25 occurrences and `bilingual-documentation` in 6 files / 11 occurrences. Counts include self-links, Chinese source metadata and ACTIVE; occurrences are not a count of unique inbound links. The union is 15 files: four guide files, ACTIVE and ten other referencing files.

- [AGENTS](../../AGENTS.md) and its [Chinese pair](../../AGENTS.zh.md) already route commits directly to the convention.
- [Documentation entry](../README.md) and its [Chinese pair](../README.zh.md) already provide a commit-specific route, not a general read-all requirement.
- [Contributor entry](../../CONTRIBUTING.md) and its [Chinese pair](../../CONTRIBUTING.zh.md) route both guides.
- [Collaboration](../guides/agent-collaboration.md) and its [Chinese pair](../guides/agent-collaboration.zh.md) own the staging-time route to the Git convention.
- The [PR template](../../.github/pull_request_template.md) also links the Git convention; it must not be missed by a non-hidden glob.
- [Bilingual configuration](../../scripts/docs/docs-i18n-config.mjs) explicitly requires both existing English paths.

A move would rename four files, repair these ten inbound owners plus ACTIVE, retain language switchers/source metadata, rebase the convention's architecture link and update two required-pair configuration entries. The mechanical commit checker does not resolve guide locations; moving them adds no enforcement. The current paths are short and already discoverable. DOC-NAV-01/02 address actual retrieval gaps without this churn.

## Alternatives and bounds

Moving both pairs would place Guide-typed documents beside other guides, but would spend a path migration for consistency alone. Adding aliases/duplicate rule copies would increase maintenance and weaken single-source ownership. Neither is justified here. Revisit only with evidence that the existing routes fail or as part of an independently approved navigation design. No guides, indexes outside WI records, scripts or policy contents were changed for this evaluation.

## Verification

Manual review: both guides, all ten external tracked reference owners, ACTIVE and bilingual config. Reproducible snapshot lookup: use `git grep -n -e git-commit-convention -e bilingual-documentation bd6ed12 --` (snapshot includes the pre-evaluation files, independent of later records). `docs:verify` checks links/pairing; close-time `docs:health` checks structure/lifecycle, not the value judgment. Preserve the two Draft ADR 0010 warnings; no Accepted-state workaround.
