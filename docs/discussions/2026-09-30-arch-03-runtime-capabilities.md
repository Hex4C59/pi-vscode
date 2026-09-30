# ARCH-03 runtime capability combinations

English | [中文](2026-09-30-arch-03-runtime-capabilities.zh.md)

- Type: Discussion
- Status: Closed
- Created: 2026-09-30
- Authority: WI-055 inventory; not an implementation approval, ADR or interface split
- Related: [runtimeLifecycle](../architecture/vscode-extension-architecture.md)

## Question

Which `PiRuntimeLifecycle` methods are required versus optional, which implementations provide them, and do optionals still have a production reason?

## Surface

Required: `start`, `stop`, `getSession`, `subscribe`, `preparePrompt`, `prompt`, `getModelProjection`, `setThinkingLevel`, `setModel`.

Optional (host always uses `?.`): `checkpointRestart`, `getOwnershipState`, `endOwnedRuntime`, `recoverOwnedRuntime`, `handoffRetainedRuntime`, `abortTask`, `invalidateInteractions`, `setFeedbackHandler`, `setInteractionHandler`, `setApprovalHandler`.

## Implementations

| Implementation | Required | Optionals |
|----------------|----------|-----------|
| `createPiRpcRuntime` (production) | all | all, including ownership, Stop, handlers, checkpoint |
| `noopPiRuntimeLifecycle` | all (start succeeds with null model; prompt/mutations fail closed) | only `handoffRetainedRuntime` → `{ ok: true, outcome: "none" }` |
| Diagnostic `runPiRuntimeProbe` | not a lifecycle | one `get_state` then stop |
| Host harness `settingsRuntime` | all | none until a test assigns them |
| Feature tests | usually start from harness/noop | attach `abortTask`, `checkpointRestart`, `handoffRetainedRuntime`, `getOwnershipState`, `endOwnedRuntime`, `setApprovalHandler`, `setInteractionHandler` only when that slice is under test |

Host production paths that need optionals: Stop (`abortTask`), profile replace (`checkpointRestart`), startup (`handoffRetainedRuntime`), recovery banner (`getOwnershipState` / `endOwnedRuntime` / `recoverOwnedRuntime`), tools (`setApprovalHandler`), trusted forms (`setInteractionHandler`), extension feedback (`setFeedbackHandler`), disconnect (`invalidateInteractions`).

## Are optionals still necessary?

Yes for production RPC: those methods are implemented and the coordinator calls them. They stay optional so noop and narrow tests can omit them. That is also the risk: a test without `abortTask` makes `abortTask?.()` undefined and Stop follows the unconfirmed/failure branch instead of a successful abort. Tests that assert Stop attach the method.

Assembly is runtime `?.` plus the production factory returning a full object. TypeScript does not require a test double to implement Stop or ownership.

## Conclusion

Do not split the interface into many capability types on this evidence. Production needs one subprocess object. Test doubles that skip a method are acceptable when that method is out of the case; they must not be used to claim Stop or ownership coverage. ARCH-04 remains separate.
