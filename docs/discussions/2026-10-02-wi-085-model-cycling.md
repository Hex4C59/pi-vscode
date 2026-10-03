# WI-085 — available model and thinking cycling

English | [中文](2026-10-02-wi-085-model-cycling.zh.md)

- Type: Discussion
- Status: Draft
- Created: 2026-10-02
- Authority: bounded PI-GAP-14 Prepare and pending evidence
- Related: [ACTIVE](../../ACTIVE.md), [bounded goal](2026-10-03-eight-gap-goal.md), [requirements](../product-requirements.md)

## Prepare and approval

The current bounded goal explicitly approves PI-GAP-14 implementation, verification, delegated evidence-based acceptance and local commits. WI-084 retains its native blocker and is unfinished; this is the sole current WI. Before code, inspect ModelSettings, provider admission, the live catalogue/projection RPC parsing, manifest commands and existing settings composition harness. Current selectors already validate available models/levels and queue a next-turn intent while chat runs; they serialize mutation and read back failures. Actual model identity is provider + modelId, not a pretty label. pi remains the declared 0.86.1; no upstream upgrade or direct provider implementation.

## Proposed bounded behavior and architecture

Five native commands: choose a cycling subset, previous/next model, previous/next thinking level. Commands are bindable through standard VS Code keyboard settings; do not install default shortcuts or change existing selector/defaults. The subset is memory-only, initially empty, scoped to the current workspace generation/runtime session. Native multi-select displays only the actual current available catalogue; user confirmation, including an empty selection, replaces it. Cancellation preserves it. No settings/auth/session-file writes or credential collection. Empty/no-longer-available models and levels produce explicit localized notices; no automatic provider requests or fallback selection. Intersect the subset with each fresh actual catalogue, preserve its catalogue order, wrap previous/next; use pending model/level as the anchor during a running task, otherwise applied identity. Unknown anchor selects first for next, last for previous. Failed application stays truthful through existing ModelSettings projection/error behavior; do not report requested state as applied.

Reuse ModelSettings.select and its exact ready/blocked/modelBusy/chatBusy/stopping semantics; do not bypass busy, session transition, trust or interaction guards. Expose a narrow admission query from that owner rather than duplicating its policy. Native picker has one owner, 2-minute deadline, identity/admission checks at acceptance, and disposal/late invalidation cleanup. Prevent overlapping subset selection/cycling; if runtime/catalogue or pending/applied state changes while choosing, reject the stale result. Host-only command intents, no new Webview resource/execution authority. PI-GAP-22's broader catalogue UI is outside this slice.

## Failure modes before code

Cycling unconfigured or unavailable models; matching a duplicate pretty label instead of identity; empty subset/levels silently failing; same-item wrap treated as mutation; cancel erasing choices; persisted subset leaking between workspaces; stale picker selecting an old runtime; busy/model mutation/interaction/profile/session/Stop races; pending next-turn selection anchored to the old applied value; failed mutation claiming success; model changing level support; overlapping commands; picker errors/deadline/late events/listeners leaking; translated native titles unclear; selectors or saved defaults changed unintentionally.

## Observable acceptance and artifacts

Before application code, prepare provider→ModelSettings→runtime composition checks for confirmed subset and identity, wrapping model/levels, empty/cancel/singleton/unavailable/stale/failure, busy next-turn intent and Stop/settlement, existing selector unchanged, disposal/overlap. Use synthetic catalogue and isolated state, never real credentials or paid calls. Verify public actual pi set_model/set_thinking_level behavior with an isolated synthetic loopback if needed; record runtime versus simulation separately. Run compile, lint, standard behavior and docs checks; review scoped diff, local implementation commit, clean candidate checks and packaging. F5/installed VSIX separately require actual native multi-select, command keyboard interaction and readable English/Chinese controls. Existing isolated-Code binding blocker is retained, not a native pass. Evidence root `dist/goal-eight/wi085/`; no implementation or acceptance at Prepare.


## Development checkpoint

Seven provider-to-ModelSettings-to-runtime composition scenarios were prepared before application code; red showed missing methods. All seven now pass: exact identity/wrap, initial/confirmed empty/cancel/singleton, pending next-turn/settlement, actual levels/empty, failure/readback/removed members, stale/disposed/overlap, replacement/picker error. Corrected the replacement fixture to real chooseResources decline/allow, not an undeclared restart message, and supplied required failure detail. No post-code unit tests were added. Compile, lint, all 1242 standard checks, docs:verify and docs:health passed.

Actual pi 0.86.1 public RPC in isolated HOME/agent/project verified synthetic duplicate-label model mutations/readback, high/off/medium level readback, missing model refusal preserving the old model and observed child close. Zero inference requests, real model calls or credentials. Command: node scripts/spikes/spike-model-cycling.mjs. Artifacts: dist/goal-eight/wi085/ (red.log, green.log, compile.log, lint.log, tests.log, docs.log, docs-health.log, runtime.log, runtime-model-cycling.json). Native F5/installed VSIX remain unverified under the isolated-window binding blocker; no acceptance or closure. Next: scoped local implementation commit and clean candidate checks. This record uses October 2, 2026 UTC; earlier October 3 filenames use the machine's Asia/Shanghai local day, not future evidence.


## Clean candidate and retained blocker

Commit `66ba52b0112bbbf72e98f5db55c6e6ff36c0055b` passed isolated clean compile/lint/1242 checks/docs:verify/docs:health, actual pi public-RPC probe and VSIX packaging. Before/after source status empty. Evidence: dist/goal-eight/wi085/candidate-evidence/ and candidate-identity.json; the checkout may later be reused, so saved identity governs this run. Native multi-select/keyboard/English-Chinese F5 and installed VSIX remain unverified under the existing isolated-Code binding blocker. No delegated acceptance or closure. Retain PI-GAP-14 unfinished; next independent focus WI-086 / PI-GAP-24.


## Resumed native Prepare — October 3 / 恢复原生Prepare

WI084 closed; this is the sole WI. Prior binding blocker is historical/resolved. Reviewed NativeModelCycling public native multi-select, 2-minute identity/pending/catalogue lease; memory subset and actual models/levels, ModelSettings sole mutation owner and busy next-turn anchor. pi0.86.1 synthetic public RPC fixture provides two duplicate-name reasoning models with exact IDs queue-fixture/cycle-second; no provider implementation or upstream upgrade. / WI084关闭，仅本WI；旧绑定阻碍已解。核对native多选／2分钟身份pending catalogue lease／仅内存集合及实际模型级别／ModelSettings忙碌next-turn所有权。pi0.86.1既有合成公开RPC两重名推理模型，以ID区分，不升级上游。

Routine bounded native tool will reuse proven ordinary observer/owned loopback launcher (no extensionTestsPath or API replacement). Fresh empty auth/HOME/agent/user/extension roots, memory SecretStorage and disabled account extensions; only explicit fixture resource consent and actual UI composer seed/release. Ten cases: initial empty notice, native subset multi-select, Escape preserves subset, model previous/next wrap, thinking cycle, busy pending/settlement, explicit empty clear, existing selector retained, English and Chinese native keyboard/visual. Existing composition/RPC empty-unavailable/stale/failure cases remain separate; not falsely native all adversarial cases. / 普通observer与自有loopback，不用testmode或替换API，独立空凭据状态／内存secret／禁账户；明确fixture资源及实际UI输入release。十案为空提示、多选、取消保集合、模型首尾、thinking、busy pending结算、清空、既有选择器、英中键盘视觉。组合RPC失效失败不冒充native。

Failure modes before new tooling: wrong development product in installed lane, duplicate names hiding identity, automatic subset/Send/resource approval, real credentials/account/inference, missing review/cases, nonzero exit or install failure claimed pass, provider/listener leak, pending requested model shown applied, custom catalogue unavailable misclaimed, source/VSIX mismatch. Prewrite subprocess contracts and ordinary observer missing-case contract RED, then Build this verification-only slice under existing Goal authorization. Require clean checks/package, source/identity/request/exit records plus actual independent F5/installed observations before delegated acceptance. No API, architecture, collection/resource/persistence tradeoff changed. / 工具编码前失败方式：安装误用开发产品、重名身份混淆、自动选择Send授权、真实账户凭据调用、缺review案、非零退出安装失败伪通过、provider泄漏、pending伪应用、不可用误报、源码包错。先契约RED后Build，干净候选及两实际lane前不验收；不改API架构收集资源持久化取舍。
