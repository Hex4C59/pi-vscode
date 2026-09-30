# ARCH-01 admission and state-transition owners

English | [中文](2026-09-30-arch-01-admission-owners.zh.md)

- Type: Discussion
- Status: Closed
- Created: 2026-09-30
- Authority: WI-054 inventory; not an implementation approval, ADR or coordinator split
- Related: [architecture](../architecture/vscode-extension-architecture.md)

## Question

Where do send, model, Stop, profile, session and workspace-folder operations get admission, and do those rules duplicate or drift?

## Owners (do not collapse)

| Owner | State it owns | Admission it actually enforces |
|-------|----------------|--------------------------------|
| Webview `availability()` | Derived disable flags | UI only. Not transport or host authority. |
| `PiChatViewProvider` | `busy` (folder/trust UI), `chatBusy`, `stoppingTask`, `profilePhase`, session phase, `runtime` | Composes who may send, switch profile, list sessions, or run folder/trust commands. `busy` is not chat occupancy. |
| `DraftSubmission` (via injected `eligible`) | Draft revision and send | Host callback: profile idle, interactions idle, not session-transition, eligible folder, runtime ready, not `busy`/`chatBusy`/`modelBusy`/`stoppingTask`. |
| `ModelSettings` | `modelBusy`, pending intents | `canSelect`: not disposed, runtime ready, not `blocked`, not `modelBusy`. `applyPending` additionally requires not `stopping` and not `chatBusy`. |
| `createRpcOccupancy` | prompt/ACK/command/agent/abort/dialogs/approvals | `allowsSend`, `allowsModelMutation` (`!promptInFlight`), `allowsRestart` (idle including no dialogs/approvals). Transport truth for the live RPC process. |
| `EditorTools` | Approvals/grants | Uses coordinator `chatBusy` and `execution === "stopping"`. |

`blocked` for models is coordinator: `state.busy` or session transition or interactions not idle or profile not idle.

## Operation map

| Operation | Host gate | Nested owner | Transport |
|-----------|-----------|--------------|-----------|
| Send | Draft `eligible` then `chatBusy = true` | Draft ledger | `allowsSend` |
| Stop | Always accepted in `receive` (even during profile phase); no-op if idle | `stoppingTask` + `execution: "stopping"` | occupancy `beginStopping` inside runtime Stop |
| Model / thinking | `ModelSettings.canSelect` + deferred `applyPending` | `modelBusy` | `allowsModelMutation` |
| Profile switch | `canSwitchProfile` (ready, not busy/chatBusy/stopping/modelBusy/session/interactions; profile idle or error) | `profilePhase` | runtime restart uses `allowsRestart` |
| Session list/switch | `sessionEligible` − `sessionTransitionBusy` − `sessionOperation` | session projection phase | — |
| Folder / trust | `state.busy` serializes the dialog; other intents rejected while busy | `state.busy` | — |

## Duplication versus drift

Independent checks are required: the webview can lie, the host can race, the RPC process can still be in-flight. Occupancy must not be replaced by `chatBusy`.

Possible drift, not a current production bug:

- Tools key Stop on `execution === "stopping"`; models key on `stoppingTask`. The coordinator sets both together in `stopCurrentTask`. A future wait-state that sets only one would desynchronize approvals vs deferred model apply.
- `state.busy`, `chatBusy`, `modelBusy`, `recoveryBusy`, occupancy `aborting` are four different “busy” words. Adding a fifth wait flag needs a row in this table, not a merged boolean.

No rule was found that is the same predicate copied in two owners with conflicting results on the production paths above. Do not merge into one busy. Do not split the coordinator by file length.

## Conclusion

Inventory only. New wait-states should name which owner row they extend. ARCH-03/04 remain separate.
