# WI-083: manual context compaction

English | [中文](2026-10-03-wi-083-manual-compaction.zh.md)

- Type: Reference
- Status: Active
- Created: 2026-10-03
- Authority: bounded PI-GAP-04 Prepare/Build record

## Prepare, approval and baseline

This eight-gap `/goal` approves PI-GAP-04 implementation, actual verification, delegated acceptance and isolated local commits within ACTIVE. PRD assessment: user-visible, REQ-004/005/009; Gate ID: none; Decision: none. Prepare complete, Build authorized. WI-082 retains its recorded native-acceptance blocker; selecting this independent item does not remove unfinished scope.

Declared/installed pi is 0.86.1. Public `docs/rpc.md` compact supports optional customInstructions; its response is operation completion, not send acknowledgement. Public abort calls AgentSession.abort, cancels compaction and waits for idle. compact itself first aborts, so host/adapter must admit only fully idle tasks, never use compact to stop a user task incidentally. Existing adapter occupancy owns prompt/command/agent/Stop; host coordinates chatBusy, generation/runtimeSession and model/session/profile rules. compaction_end is not agent_settled; an extension may start more activity after compaction, so idle cannot be invented.

## Approved approach and owners

Native command `pi: Compact Context` first confirms lossy summarization and possible ordinary selected-model charges; optional native custom instructions (4 KiB UTF-8, validated by host and adapter), with no runtime call on dialog cancellation. Actual work projects compacting through existing task state and a cancellable native progress notification. Cancel and existing Stop reuse clear_queue→abort and observed settlement. Completed, failed/unavailable and cancelled outcomes are distinct; do not display/store the full summary. Preserve automatic compaction/retry settings and algorithms; ordinary send/model/session/profile changes retain existing busy rules.

Adapter invokes public compact with independent command occupancy until actual response. Manual compaction_end.aborted is cancellation evidence, not whole-agent settlement. A 180-second deadline with uncertain completion uses existing fail-closed owned-runtime shutdown/recovery, never retry. Results/occupancy are session/connection-bound; subsequent extension activity stays busy until actual agent_settled. Host owns native confirmation/progress lifecycle, projection and Stop coordination; Webview gains no arbitrary RPC or sensitive instruction content. No dependency, persistence, trust/loading change or ADR.

Expected paths: runtimeLifecycle DTO, adapter occupancy/frame/runtime, host native-compaction owner/provider/command registration, pre-code composition checks, isolated actual-runtime script and paired requirements/docs. Architecture 1–5/7–15 retain owners/identity/occupancy/bounds/recovery; 16–19 evidence is pending, not claimed passed.

## Failure modes before code

Busy compact aborts a user's task; identity/model changes during confirmation; cancelled confirmation calls a model; duplicate compaction; oversized/literal instructions; agent_settled releases before compact response; Stop clears queues without observing compaction exit; requested cancellation mistaken for cancellation; success/cancel race misreported; timeout/lost connection releases or retries; extension continuation falsely idle; draft/attachments/pending-model loss; automatic compaction/retry regression; progress-listener leaks; errors/summary leak secrets or full source; old progress overwrites a replacement session.

## Observable acceptance and artifacts

Prepare composition through existing host→adapter→RPC entries before code, not post-code unit tests. Distinguish dialog cancellation, custom instructions, busy refusal, running/completion, observed aborted, failure, Stop order, stale identity, delayed/extension continuation and draft preservation with TAP/JSON. Actual pi uses isolated HOME/agent/project and a local synthetic loopback provider to verify default compaction/cancellation/failure without real accounts or paid models; retain request/event and observed-exit evidence. Separately verify native F5/installed-VSIX entry/lossy disclosure/running/Cancel/Stop/completion/readability, never substituting seam checks for native observation. Run compile/lint/npm test/docs:verify, docs:health at close and committed clean candidate checks.

Artifact root `dist/goal-eight/wi083/`; no implementation or passes yet. Current native-tool binding limitations may affect this acceptance, without lowering standards. Next: pre-code composition→implementation→development/actual-runtime checks→isolated local commits→native acceptance or retained blocker.


## Development implementation and evidence (2026-10-03)

Pre-code host/adapter composition scenarios failed on the missing entry points, then passed (5 scenarios) after implementation. The native command confirms lossiness/cost, bounds literal optional instructions, rechecks identity and idle admission, and owns cancellable progress without submitting/discarding the draft. Adapter command occupancy remains until actual compact response; manual aborted metadata distinguishes cancellation, clear_queue precedes abort, and continuation remains busy until observed settlement. Automatic compaction/retry code and settings are unchanged. A completion/settlement delivery race is handled without inventing idle; uncertain completion shuts down the owned runtime and surfaces explicit recovery.

Development compile, lint, 1229 behavior checks and docs:verify passed (two pre-existing ADR 0010 notices), and the final ownership-refinement rerun also passed. Actual pi 0.86.1 with isolated HOME/agent/project and synthetic loopback responses exercised successful default compaction, cancellation with manual compaction_end.aborted, and too-small failure; every process close was observed, zero real-model calls. Artifacts: dist/goal-eight/wi083/{red.log,green.log,compile.log,lint.log,tests.log,docs.log,runtime.log,runtime-compaction.json}. These are dirty-source development evidence, not committed-candidate or native acceptance.

The first runtime probe assumed custom instructions occur in every summary request. Public upstream source and observed requests show split-turn prefix summarization does not receive them; a two-turn fixture proves literal instructions reach the ordinary history summarizer. We preserve the public upstream behavior rather than replacing its compaction algorithm. Cancellation is supported by the aborted event, not only a requested cancel. F5/installed-VSIX UI, visual/keyboard/progress acceptance and committed clean-candidate checks remain outstanding; WI-082's isolated native-window binding condition still applies. This WI is not accepted, closed or archived.


## Committed candidate and retained blocker

Prepare/records commit `2b46d72`; implementation `77ca3c22015cc731de69aca19a5cf69b6233bb2d`. Task-candidate base `bc1a2d7b9c5174434036445db6c5f85624072a72`, PR head not applicable; an independently clean local checkout ran compile, lint, 1229 tests, docs:verify, the actual-pi compaction probe, existing queue RPC regression and packaging. All passed; wrapper exit 0 and before/after source status empty. Evidence copied to dist/goal-eight/wi083/candidate-evidence/, identity in candidate-identity.json. The owned clean checkout was reused from WI-082; that earlier snapshot's saved evidence retains its original identity, but its path now points to this newer candidate. Historical mounted artifacts are link-validation dependencies only.

Native F5/installed-VSIX interaction, Cancel/Stop/keyboard and visual acceptance remain missing under the same isolated-Code CUA binding blocker recorded in WI-082. No delegated acceptance or closure is claimed. Minimum unlock: safely operate a real isolated Code window and execute the documented native acceptance without real accounts or paid calls. Preserve this unfinished item in ACTIVE; serially proceed to independent PI-GAP-06 / WI-084, with its own complete Prepare before Build.


## Resumed native Prepare after PI02 closure — October 3

Resource-report native F5/installed isolation now verified; old binding-blocker paragraphs are historical. Human normal-quit permission applies only graceful daily-Code exit with no unrelated save/discard/force-kill or passing confirmation. Current WI083 native focus preserves all existing scope, public compact/abort ownership and real-RPC evidence. Native fixture design is still being investigated, not verified: reuse synthetic loopback/provider/session APIs, memory-only isolated Code state and reviewed command/progress workflow. Before harness code, confirm model configuration/idle synthetic history setup and bounded Cancel/Stop/completion observations; record failures, test-first composition and artifact plan. No real model/credential authorization or product change inferred.
