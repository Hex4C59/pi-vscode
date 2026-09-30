# UI Components Audit: New-File Review

English | [中文](2026-09-30-ui-components-audit.zh.md)

- Type: Discussion
- Status: Draft
- Scope: Additional code review requested by the maintainer; exclude files reviewed in earlier conversation rounds.
- Authority: Findings and candidate follow-up only; no implementation approval, WI creation, ADR acceptance or Git commit.

## Findings

### UI-01 / P2: Display labels are treated as model identity

[ModelPickerView](../../src/webview/components/model-picker.tsx#L201) marks an entry applied when the current model equals either its provider/model-id pair or its display label. The predicate need not identify one entry.

An isolated React render with current model `provider-a / id-a`, entry A identified by that pair, and entry B labelled `provider-a / id-a` produces two `aria-checked="true"` radio items. A separate probe with identical display labels also produces two checked items. This confirms ambiguous presentation, not that the wrong model is sent to the runtime. The model callbacks still carry provider and model-id values.

Candidate follow-up: distinguish stable applied identity from display text; preserve compatibility deliberately rather than guessing identity from labels. A regression should cover duplicate labels and labels that collide with another model's canonical pair. No protocol change is approved here.

### UI-02 / P2: Escape is handled twice and restores focus to the wrong surface

The window-level Escape listener in [ModelPickerView](../../src/webview/components/model-picker.tsx#L52) ignores whether another handler already consumed the event. [CandidateContext](../../src/webview/chat/candidate-context.tsx#L203) uses `preventDefault` for its own preview/history dismissal; its context-menu handling also consumes Escape locally. Neither guarantees that the model listener will abstain.

An isolated mounted composition opens the model popover, then Add context. Escape on the context menu closes that menu, but also closes the model popover and focuses `model-effort-trigger`, overriding the context menu's own focus return. Both components are real; the shared barrel dependency is replaced by a translation-only stub to avoid loading previously reviewed application modules.

Candidate follow-up: define consumed-event ownership consistently, including `defaultPrevented` and composition handling. Test overlapping nonmodal surfaces and focus return. This is a jsdom component reproduction, not real-browser acceptance.

### UI-03 / P3: Missing-path body bypasses localization

[ReviewEntry](../../src/webview/components/change-review.tsx#L49) translates the missing-path tooltip but renders the body fallback as the literal English `Path unavailable`.

An isolated translation provider produces a translated tooltip while visible text remains English. This is a small, confirmed localization inconsistency, not an authorization or file-access issue. Candidate follow-up: route both fallbacks through the same translation function.

## Additional Design Observation

[MessageComposer](../../src/webview/chat/message-composer.tsx#L8) accepts workspace state, several derived eligibility flags, and a large callback set. Its type permits contradictory combinations of state and flags. This increases composition reasoning cost, but this review did not demonstrate a production mismatch. Do not count it as a fourth confirmed bug or justify a large refactor from prop count alone.

## New Coverage Inventory

The previous rounds' files remain excluded even when they were only partially reviewed. This inventory is the next round's exclusion list as well. Inventory listing is not a claim of exhaustive branch coverage; some long tool responses were truncated, and the relevant implementation sections were inspected.

| New file | Coverage |
|---|---|
| [model-picker](../../src/webview/components/model-picker.tsx) | State, selection, keyboard/focus and range controls; targeted sections and probes |
| [saved-history](../../src/webview/components/saved-history.tsx) | Full returned component |
| [message-composer](../../src/webview/chat/message-composer.tsx) | Composition/input sections; long response partially truncated |
| [chat-dialog](../../src/webview/chat/chat-dialog.tsx) | Full returned implementation |
| [ui-language](../../src/webview/chat/ui-language.ts) | Full returned implementation |
| [session-navigation](../../src/webview/chat/session-navigation.tsx) | Full returned component |
| [candidate-context](../../src/webview/chat/candidate-context.tsx) | Attachment/menu/focus sections and isolated composition probe |
| [project-resource-consent](../../src/webview/chat/project-resource-consent.tsx) | Full returned implementation |
| [approvals](../../src/webview/components/approvals.tsx) | Returned approval, timing and grant sections; long response partially truncated |
| [change-review](../../src/webview/components/change-review.tsx) | Returned review sections and localization probe |
| [candidate-sessions](../../src/webview/chat/candidate-sessions.tsx) | Full returned component |
| [select-extension](../../src/extension/extension-loading/select-extension.ts) | Full returned implementation |
| [no-folder-prompt](../../src/webview/chat/no-folder-prompt.tsx) | Full returned component |
| [project-resources-prompt](../../src/webview/chat/project-resources-prompt.tsx) | Full returned component |
| [ui-text](../../src/webview/components/ui-text.tsx) | Translator implementation and partial message-id union |
| [task-status](../../src/webview/chat/task-status.tsx) | Full returned implementation |
| [workspace-setup](../../src/webview/components/workspace-setup.tsx) | Full returned component |
| [session-icon](../../src/webview/chat/session-icon.tsx) | Full returned component |
| [composer-icon](../../src/webview/chat/composer-icon.tsx) | Full returned component |
| [pi-welcome-mark](../../src/webview/chat/pi-welcome-mark.tsx) | Full returned animation implementation |
| [chat-preview](../../src/webview/components/chat-preview.tsx) | Full returned implementation |

## Evidence and Limits

- Four scenarios reproduced: identical model labels, canonical identity/display-label collision, Escape double handling, and untranslated missing-path body.
- esbuild ran with `write: false`. Its metafile was asserted against a strict allowlist of this round's new files; previously reviewed barrels were stubbed, not traversed.
- The first probe attempt lacked DOM globals in its VM context; the next used an incorrect trigger selector. Those harness failures are not application findings. The corrected probe and canonical-identity variant completed with assertions satisfied.
- No application source edits, real pi configuration access, runtime launches, network requests or paid API calls. Mounted roots and jsdom windows were disposed; no on-disk probe fixtures were created.
- Existing tests were not re-reviewed, and the full test suite, browser screenshots and F5/installed-VSIX behavior were not run. These findings do not certify every file or branch.
- Two new discussion translations are the only intended repository edits in this round; the old backlog was not reopened or rewritten. Documentation validation results are reported separately in the handoff.
