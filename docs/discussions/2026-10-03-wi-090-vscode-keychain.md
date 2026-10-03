# WI-090 — Daily VS Code and isolated keychain diagnosis

English | [中文](2026-10-03-wi-090-vscode-keychain.zh.md)

- Type: Discussion
- Status: Active
- Created: 2026-10-03
- Authority: this user-requested local diagnosis and bounded reversible repair; not OS-security or credential-change approval
- Related: [ACTIVE](../../ACTIVE.md), [collaboration](../guides/agent-collaboration.md), [prior eight-slice handoff](../archive/2026-10-03-eight-gap-goal.md)

## Prepare and approval

The user requests confirmation of daily VS Code version and resolution of repeated “keychain not found”. Scope is actual installation/profile metadata, relevant redacted errors, read-only default-keychain metadata, ordinary blank-window startup and existing isolated-launcher safeguards. No pi feature expansion, package upgrade, daily extension installation, paid call, sign-in/account operation, credential lookup/export, keychain reset/deletion/unlock, persistent security/encryption change or forced application termination is approved. Routine reversible repair is requested; approval for the earlier eight-slice local commits does not cover this new task, so no new commit is made.

PRD assessment: technical diagnosis; no application behavior, requirement, protocol, dependency or trust boundary change. Gate none, decision none. Existing three unstaged user-owned changes remain protected: ACTIVE pending grouping and bilingual feature-gap discussion. One agent, one current WI; prior Goal is complete and is not reopened.

Before any repair: distinguish the exact GUI symptom from nearby errors; confirm which profile/process produced it; use actual VS Code package/product manifests instead of latest-version assumptions; query Security metadata without keychain item access; compare real and fresh empty HOME environments. Failure modes are wrong-profile evidence, confusing absent default keychain with missing credential items, reading secrets into logs, masking daily persistence through global memory/plaintext settings, corrupting keychains, losing unsaved work, and claiming a metadata reproduction proves the historical GUI dialog. Observable acceptance is normal daily startup plus bounded log/native checks, repeatable real-HOME/empty-HOME comparison, current launcher contracts and honest remaining conditions. No production code/test change is proposed unless a reproducible current failing path requires it.

## Actual investigation — October 3, 2026, 20:28–20:35 Asia/Shanghai

Source `ee99df0c81887d6c89112cf628289bb8c2c8b4ba`; actual host macOS27.0.1 arm64. Installed daily VS Code app manifests report1.140.0 stable, commit07f806f999227108933c2e30515b26eecc1fda74. Default extension registration contains no pi-vscode entry; this does not contradict prior isolated VSIX acceptance, which used separate extension directories. No version/update or daily pi installation was performed.

Initially no Code process/window was running. `/usr/bin/security default-keychain -d user` and `list-keychains -d user` resolve the existing login keychain; show-keychain-info reports no-timeout. Read-only public Security calls `SecKeychainCopyDefault` and `SecKeychainGetStatus` return0, status flags7 (unlocked/readable/writable). This proves current default lookup/status, not all credential contents, keychain integrity or the cause of every prior prompt. No item lookup, unlock or system setting was invoked.

Actual read-only A/B/A reproduction: the same `security default-keychain -d user` succeeds with the real user HOME, fails with a newly created empty HOME with “A default keychain could not be found.”, then succeeds again with the real HOME. This is a real metadata failure sensitive to the launch environment, not a mock or a reproduced historical GUI dialog. Reproduction never mutates keychains or reads credential items.

An ordinary blank daily Code window was launched with real HOME, `--new-window --skip-welcome --skip-release-notes`, no secret/password overrides or environment credentials forwarded (PID58328). Native observation confirms an empty workbench, no keychain/password sheet or dialog. Latest daily log20261003T202803 has one ordinary builtin authentication keychain-read message and zero keychain-related errors in the bounded scanned logs. Earlier ten retained daily log directories likewise showed reading-session info, not the exact reported error. Authentication reading its own storage is not an agent credential lookup; no account login action or secret content was captured. Default daily argv/settings have no keychain/password overrides and were left unchanged. The blank daily window remains open, not force-quit or modified.

Current isolated native launchers intentionally have an empty synthetic HOME, so normal default-keychain lookup is unavailable in that environment. Their existing repair (resource launcher585bd06, propagated to subsequent native launchers) supplies memory-only SecretStorage across parent/F5 child/installed CLI/window, with builtin GitHub/Microsoft account extensions disabled in interactive fixtures. This avoids imposing the test's missing-keychain environment on real persistent credentials; it does not repair the system keychain or justify global `password-store=basic`/memory mode. All seven actual-launcher contract suites were rerun:36 passed,0 failed. These are synthetic process/observer contracts, not a fresh seven-lane native UI certification. Prior native verification remains at its recorded source/limits.

## Artifacts, disposition and remaining acceptance

Ignored local `dist/keychain-diagnosis-2026-10-03/` contains default-keychain-metadata.json, daily-start.json, bounded redacted log summary, filtered native-state summary, reproduce-readonly.cjs/read-only A/B/A result,36-contract log and summary.json. Run `node dist/keychain-diagnosis-2026-10-03/reproduce-readonly.cjs` to repeat the read-only environment comparison. Script is an ephemeral diagnostic artifact, not a product change/new test tier. Documentation verification/health must run after recording; compile/lint/full behavior are not required for this documentation-only change.

**Confirmed:** daily1.140.0 currently starts normally; current login keychain exists and default metadata queries succeed; empty test HOME reproduces absent-default-keychain lookup; current isolated safeguards pass36 contracts. **Not confirmed:** exact original dialog/app/source and elimination of every recurring GUI prompt. The known launch-environment trigger is addressed by existing isolated safeguards, not a newly invented OS fix. No system/credential/daily argv/product code change is justified by the current evidence, and no new local commit is authorized.

Keep WI090 unfinished for the original recurring GUI symptom. If that exact prompt is present or recurs, the minimum additional evidence is a redacted screenshot of that dialog (app/title and error, excluding passwords/accounts) and its occurrence time/context (ordinary daily start versus isolated F5/test). Until then, do not run destructive keychain repair or weaken credential persistence to manufacture success. No maintainer personal test or new delegated acceptance is claimed.


Checkpoint: all36 focused launcher contracts passed; docs:verify and docs:health passed with zero errors and the two existing ADR0010 warnings. The first ACTIVE metadata check failed on missing required fields/section headings; corrected only the new record and retained the first failure log. No application code was changed and no commit/staging occurred. A targeted last12h OS log query for keychain-not-found timed out at20s; only metadata was requested/retained, no elevation or broad/private-log fallback. This query is unavailable evidence, not proof that no historical system errors occurred. The exact GUI symptom remains unverified.
