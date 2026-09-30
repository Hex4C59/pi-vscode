# WI-032 macOS delegated credential-rule evaluation

English | [中文](2026-09-30-wi-032-macos-evaluation.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical scoped delegated acceptance and closure; current work remains in [ACTIVE](../../ACTIVE.md)

## September 30 final delegated acceptance

After the initial evidence handoff, the maintainer explicitly delegated final judgment for WI-032/033/034 to the agent, saying that no independent maintainer acceptance should be required after agent review. This is **agent-delegated acceptance and closure**, not a claim of maintainer-performed testing. Earlier evaluation-only/pending wording below is retained as capture-time history, not a current blocker. Both language records were archived together because this WI is closed.

Accepted and closed for the approved six-entry credential-rule consolidation. Source tracing, 139 focused tests, the current 867-test suite and macOS F5/installed smoke evidence support this technical slice. Native sensitive interaction replay for each entry was not performed; it remains a disclosed evidence limit, not a claimed pass or a pending maintainer sign-off. Universal secret detection and historical-session sanitization remain outside scope.

Only the approved WI slice is accepted; no whole Draft PRD, gate, ADR or Git commit change follows. Delegation does not convert unverified native behavior into a pass.


## Conclusion

Agent-delegated evaluation, not maintainer acceptance or WI closure. Source tracing confirms all six host entries consume the same host-owned pure rules exported from [contracts](../../src/extension/contracts/index.ts). The focused current-build suite passed 139 tests with zero failures/skips. No production code or tests were changed for this assessment, and the stopped general assertion audit was not resumed.

The three shared synthetic families are private-key markers, credential-field assignments and Bearer values. Empty assignment and Authorization/Bearer overlap have contract coverage. Ordinary text stays unchanged; private-key display hides the whole string, while field/Bearer display retains ordinary context. Filtering remains best-effort, not proof of universal secret detection.

## Six-entry trace and evidence

| Entry | Source / current tested outcome |
|---|---|
| RPC dialogs | [rpc-dialogs](../../src/adapter/runtime/rpc/rpc-dialogs.ts): safe metadata consumes `containsCredentialLikeText`; all three samples cancel without a form, ordinary text opens; [tests](../../src/adapter/runtime/rpc/tests/rpc-dialogs.spec.ts) also preserve literal user-authored input/editor answers and 32 KiB answer bounds |
| Extension feedback | [extension-feedback](../../src/adapter/runtime/extension-feedback.ts): shared refusal rule rejects text/keys; [tests](../../src/adapter/runtime/tests/extension-feedback.spec.ts) verify only the fixed safety warning is projected, keyed state does not mutate on rejection, and UTF-8/frame limits remain |
| Activity and final text | [activityProjection](../../src/adapter/runtime/activityProjection.ts): `displayText` delegates to `redactCredentialLikeText`; [activity tests](../../src/adapter/runtime/tests/activity-projection.spec.ts) cover all families and 16,384-character post-redaction truncation; [RPC frame tests](../../src/adapter/runtime/rpc/tests/rpc-frames.spec.ts) cover final/delta post-redaction bounds and whole-answer private-key hiding |
| Tool approvals | [toolApproval](../../src/extension/editor-tools/toolApproval.ts): checks serialized input before policy/card creation; [tests](../../src/extension/editor-tools/tests/tool-approval.spec.ts) deny each family with zero cards, then prove ordinary input can offer a card; existing size/lifecycle checks pass |
| Change review | [changeReview](../../src/extension/editor-tools/changeReview.ts): decoded bounded disk text uses the shared refusal rule; [tests](../../src/extension/editor-tools/tests/change-review.spec.ts) mark each family `sensitive-source` / diff unavailable, retain zero unsafe bytes, and preserve ordinary unchanged review; path rules remain separate |
| File/selection attachments | [fileAttachment](../../src/extension/draft/fileAttachment.ts): `checkedText` calls shared refusal; [tests](../../src/extension/draft/tests/file-attachment.spec.ts) verify each family for file and selection yields `sensitive-source`, no attachment/no runtime writes, then admit ordinary text; source identity and size policies stay intact |

Executed after the current full `npm test` rebuilt the exact source-relative test inventory:

```bash
node --test dist/tests/extension/contracts/tests/credential-text.spec.js dist/tests/adapter/runtime/tests/rpc-dialogs.spec.js dist/tests/adapter/runtime/tests/extension-feedback.spec.js dist/tests/adapter/runtime/tests/activity-projection.spec.js dist/tests/adapter/runtime/tests/rpc-frames.spec.js dist/tests/extension/editor-tools/tests/tool-approval.spec.js dist/tests/extension/editor-tools/tests/change-review.spec.js dist/tests/extension/draft/tests/file-attachment.spec.js
```

## Host evidence and limits

[WI-034 evidence](2026-09-30-wi-034-macos-evaluation.md) proves current-build macOS native F5 and separate isolated installed-VSIX activation/rendering, with inspected screenshots and actual host activation logs. Those hosts include WI-032 code; they are smoke evidence, not a native interactive replay of all six sensitive-input paths. The six-entry checks above use the production functions and synthetic host/transport fixtures with real temporary filesystem cases where applicable.

Compile/lint and the full 867-test suite passed in the current session. Historical session redaction, authentication classification, model settings and universal secret detection remain outside this WI. Windows is outside acceptance scope. Maintainer acceptance and any additional native six-entry interaction evidence remain separate; no PRD/ADR/gate/commit change follows.
