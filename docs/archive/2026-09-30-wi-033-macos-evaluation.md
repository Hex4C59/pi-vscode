# WI-033 macOS delegated protocol evaluation

English | [中文](2026-09-30-wi-033-macos-evaluation.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical scoped delegated acceptance and closure; current work remains in [ACTIVE](../../ACTIVE.md)

## September 30 final delegated acceptance

After the initial evidence handoff, the maintainer explicitly delegated final judgment for WI-032/033/034 to the agent, saying that no independent maintainer acceptance should be required after agent review. This is **agent-delegated acceptance and closure**, not a claim of maintainer-performed testing. Earlier evaluation-only/pending wording below is retained as capture-time history, not a current blocker. Both language records were archived together because this WI is closed.

Accepted and closed for the approved runtime-frame validation slice. The maintainer explicitly permitted captured real pi bytes through the existing production harness. Original bytes pass; matched command mismatch and nonboolean success revoke the connection. Truncated non-JSON is ignored under the preserved compatibility rule and is not misreported as fail-closed. Native live-host malformed-frame injection was not performed; this remains a disclosed evidence limit, not a pending maintainer sign-off. Making all malformed byte sequences connection-fatal would require a separate scope decision.

Only the approved WI slice is accepted; no whole Draft PRD, gate, ADR or Git commit change follows. Delegation does not convert unverified native behavior into a pass.


## Conclusion and identity

Agent-delegated evaluation under the September 30 macOS authorization, not maintainer acceptance or WI closure. Real pi 0.86.1 bytes pass the production reader/runtime harness. Matched command mismatch and nonboolean success fail closed. Truncated JSON is discarded, **not** a connection-fatal protocol failure: a following valid frame is accepted. This matches the approved WI-033 non-JSON ignore rule in the [preserved proposal](2026-09-30-wi-033-pending-acceptance.md), but does not prove the stronger expectation that every malformed byte sequence must revoke the connection.

## Executed injection

Command: `node dist/delegated-macos-20260930/wi-033/inject.mjs`, exit 0 after correcting the harness startup ID. Real CLI public entry: `node_modules/@earendil-works/pi-coding-agent/dist/bundle/cli.js`, flags `--mode rpc --offline --no-tools --no-extensions --no-approve`. The existing `isolatedFixture` isolates HOME, agent directory, temp and environment. No models, user credentials or project extensions were invoked. `withProcess` awaited actual child close before deleting its fixture.

The real command ID is `pi-vscode-get-state-2`, chosen to match the runtime's actual startup generation after `start()` calls `stop()`. `real-get-state.jsonl` contains the original stdout line bytes without rewriting. Real session identifiers/paths come solely from public `get_state`, not session-file inspection. The raw bytes drive `createMemoryConnection().stdout` into the actual `createPiRpcRuntime` / `attachJsonlLineReader` path. Only transport ownership and gate hello are synthetic; this is captured-real-byte replay, **not** a corrupted live pi subprocess or native-host fault injection.

| Variant | Actual result |
|---|---|
| Original bytes | `start().ok=true`, session 2; no uncertain release |
| Same response, `command=set_model` | `ok=false`, session 0, exactly one `uncertain` release; stdout reader detached; no implicit process End |
| Same response, `success="true"` | Same fail-closed outcome |
| Truncated JSON + LF, then original bytes | Truncated line ignored, original accepted; `ok=true`, session 2, reader remains attached |

Local reproducible artifacts: `dist/delegated-macos-20260930/wi-033/inject.mjs`, `harness.cjs`, `real-get-state.jsonl`, `results.json`. Initial harness attempts failed because capture used generation 1 while runtime issued generation 2; those failures were diagnosed, not counted as product failures or passing checks.

## macOS host evidence and limits

[WI-034](2026-09-30-wi-034-macos-evaluation.md) separately records current-build native F5 and isolated installed activation/rendering with inspected screenshots and activation logs, plus compile/lint/867 tests. Those windows contain current WI-033 code, but no malformed frame was injected into their live host runtime. The automated full suite includes the existing runtime protocol matrices. Do not relabel those native smoke screenshots as native fault-path verification.

Maintainer acceptance remains pending. A requirement to make truncated non-JSON connection-fatal would change the preserved compatibility rule and requires an explicit scope decision; no production behavior was changed in this evaluation. PRD, gates, ADRs and Git commits remain unchanged.
