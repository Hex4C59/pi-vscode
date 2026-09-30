# pi VS Code feature gaps against pi 0.86.1

English | [中文](2026-10-01-pi-feature-gaps.zh.md)

- Type: Discussion
- Status: Open
- Created: 2026-10-01
- Authority: source/document comparison only; no implementation approval or acceptance

## Baseline and evidence

Compare the declared and installed pi coding-agent **0.86.1**, not moving upstream main. The documented sibling `../pi` is absent in this checkout. Read the installed package README and RPC documentation, and upstream [tagged README](https://github.com/earendil-works/pi/blob/v0.86.1/packages/coding-agent/README.md) and [tagged RPC contract](https://github.com/earendil-works/pi/blob/v0.86.1/packages/coding-agent/docs/rpc.md). No runtime or real-host checks were run for this discussion.

Local evidence: [protocol](../../src/extension/contracts/webviewProtocol.ts), [client admission](../../src/webview/client/client-state.ts), [RPC adapter](../../src/adapter/runtime/pi-rpc-runtime.ts), [session backend](../../src/extension/contracts/sessionBackend.ts), [provider configuration](../../src/extension/contracts/providerConfig.ts), [interactions](../../src/extension/contracts/extensionInteractions.ts), [PRD](../product-requirements.md), and [ACTIVE](../../ACTIVE.md).

## Current comparison

Core prompting, streaming/thinking/tool activity, model selection, Stop, approvals, text attachments, current-project saved-session restore, provider API-key/OAuth operations and custom endpoints already have product surfaces. Do not list them as wholly missing. This is source evidence, not fresh installed-VSIX acceptance.

| Area | Remaining product-surface gap |
|---|---|
| Running-task input | Busy state disables Send; no steering/follow-up queue UI or queue retrieval workflow. Stop/clear_queue is not that workflow. |
| Session exploration | No dedicated tree/fork/clone/bookmark workflow; current backend lists, inspects and previews saved history. Session branching is not file rollback. |
| Context control and accounting | Automatic compaction/retry states exist. No dedicated manual compact action/custom instructions or context/token/cache/cost dashboard in the current protocol. Internal statistics reads are not a dashboard. |
| Input | Whole-file and selection text attachments exist; no image attachment intent or @ fuzzy-file/path completion in the composer. |
| Resource discovery | Trusted extension commands and upstream skills/templates must not be called wholly absent. No composer command/resource discovery menu; compatibility is representative, not arbitrary ecosystem parity. |
| Resource management | Local extension inventory exists; it is not pi's npm/git package install/update/filter management or a marketplace. Extra inventory apply is bounded to one enabled extension. |
| User shell/export | No dedicated user bash action with include/exclude-from-context choices, nor dedicated HTML/JSONL export/import/share surfaces. Agent bash tools are a different capability. |
| Extension UI | Standard bounded dialogs and text feedback exist. Terminal custom components/renderers/shortcuts are not equivalent Webview interfaces; RPC itself limits terminal custom UI. |

## Judgment and unresolved choices

The main gap is exposing more upstream workflows, not rebuilding the agent core. Potential priorities after current acceptance work: steering/follow-up, command/resource discovery, then context accounting/manual compaction. These are suggestions, not a changed queue or approved Build. Session branching and package installation require separately scoped product/trust decisions.

For this pinned version, plan mode, subagents and MCP integration are extension capabilities rather than missing built-in equivalents. Moving upstream main now documents built-in MCP; that is a separate upgrade assessment, not proof for 0.86.1.

README's broad completion wording and a later WI-070 macOS evidence matrix are not interchangeable. This discussion did not run that matrix; WI-070 later recorded current installed-VSIX cells with explicit limits.

## Additional comparison (2026-10-01)

A second command/settings pass found the following independent gaps beyond PI-GAP-01–11 in ACTIVE. These are discussion findings, not newly approved backlog items. Missing product controls do not prove a runtime capability is disabled: applicable upstream configuration may still be consumed, which was not runtime-tested here.

| Area | Additional gap and evidence |
|---|---|
| Session naming | Saved names can be read, but no rename intent or `set_session_name` call exists in the product protocol/adapter. |
| Temporary sessions | No explicit non-persistent session choice; production launch does not select `--no-session`. This would concern pi session persistence, not a promise of no logs/network/provider retention. |
| Scoped-model cycling | No editable quick-cycle subset or cycle-model/cycle-thinking product actions. Existing pickers/defaults are not absent. |
| Resource reload | No dedicated runtime resource/context reload action comparable to terminal `/reload`. Inventory refresh and provider refresh are different. RPC feasibility and trust rechecks require assessment. |
| Advanced runtime settings | No Settings controls for retry/delay/timeouts, provider transport, compaction budgets, thinking budgets or cache warming. This is a settings-surface gap, not evidence these upstream behaviors are disabled. |
| Tool selection | Controlled profile uses its defined allowlist; no user-editable initial tool subset/inspection-only workflow. Omitting write/edit does not constrain shell or trusted extensions into a sandbox. |
| Rich custom model configuration | Endpoint creation writes one OpenAI-compatible model; no editor for multiple model definitions, API dialect, context/output limits, capability/compatibility metadata or headers. External models.json support is not proven absent. |
| Local-model lifecycle | No dedicated llama.cpp router model download/load/unload UI. A local endpoint or provider sign-in is not that lifecycle UI. |
| Interaction/rendering details | No full-answer copy action, Mermaid rendering, extension-contributed shortcut/help map or composer-to-native-editor workflow. Code-block copy already exists; terminal keybindings/themes need not be replicated literally. |

Evidence beyond the first pass: [endpoint writer](../../src/extension/models/customEndpoints.ts), [Settings](../../src/webview/settings/index.tsx), [Markdown renderer](../../src/webview/chat/conversation/reply-markdown.tsx); tagged [settings](https://github.com/earendil-works/pi/blob/v0.86.1/packages/coding-agent/docs/settings.md), [models](https://github.com/earendil-works/pi/blob/v0.86.1/packages/coding-agent/docs/models.md), [llama.cpp](https://github.com/earendil-works/pi/blob/v0.86.1/packages/coding-agent/docs/llama-cpp.md) and [keybindings](https://github.com/earendil-works/pi/blob/v0.86.1/packages/coding-agent/docs/keybindings.md).

Leaning: naming and full-answer copy are small conveniences; advanced configuration is useful when real usage requires it. Tool profiles, temporary persistence, reload and local-model management need explicit boundaries. Do not reorder WI-070 or turn terminal parity into an automatic implementation requirement.

## Final command pass (2026-10-01)

Beyond PI-GAP-01–23, the remaining source-backed differences are narrower:

- Current-project session search, named-session filtering and selectable sorting: upstream session picker supports them; the product catalogue currently paginates a fixed recent-first list. This is not global cross-project discovery.
- Confirmed saved-session deletion: upstream picker supports it, while the product SessionBackend/protocol has no deletion operation. Public-API feasibility must be established; this observation does not authorize direct session-file manipulation or an ADR exception.
- Effective startup-context reporting: terminal pi shows loaded AGENTS.md and resources; the product has resource consent/inventory but no equivalent report of actually loaded context files. This is observability, not a claim AGENTS.md loading is absent. It may fit PI-GAP-02/15 rather than a new WI.
- Diagnostic report workflow: pi offers an optional-transcript bug report and export/upload choices; the product has no dedicated equivalent. An extension report must distinguish plugin versus upstream failures and require deliberate sensitive-data review and destination consent.
- Version/changelog display: no comparable in-product changelog view. This is maintenance convenience, not a missing agent execution capability or authorization for auto-update.

Evidence: tagged session/README documentation above; [current catalogue UI](../../src/webview/chat/sessions/candidate-sessions.tsx), SessionBackend and Webview protocol. Findings are static comparison only, not new runtime acceptance. Do not add arbitrary pinning, archiving, checkpoints, concurrent agents or OS support as built-in pi parity gaps without evidence. Most meaningful workflows are already covered by the 23 recorded candidates; stop expanding the list by splitting their acceptance details.

## Startup/editor follow-up (2026-10-01)

After recording PI-GAP-01–27, two further product-surface differences were confirmed:

- System-prompt customization: pi supports SYSTEM.md / APPEND_SYSTEM.md and explicit replace/append CLI options. The product has no dedicated settings/intents for managing those choices. Existing upstream file loading may already work; it was not tested here, so do not call system customization wholly unsupported. Any future UI needs project/global scope, replace-versus-append clarity, trust and effective-configuration handling; it cannot weaken host approvals or workspace rules.
- Submitted-input recall: pi's editor browses older/newer prompt history; the product composer has no corresponding history state/actions. This differs from viewing saved conversations and from queued-message retrieval in PI-GAP-01. Preserve the unsent draft and make recall explicit; recalling text must not silently reattach files or resend.

Evidence: tagged README / keybindings above; [composer](../../src/webview/chat/composer/message-composer.tsx), [runtime launch](../../src/adapter/runtime/pi-rpc-runtime.ts), and Webview protocol. Static source evidence only. Shortcut bindings can be coordinated with PI-GAP-22; system-prompt configuration may be a separately approved slice under advanced settings. No new ACTIVE rows or Build approval in this discussion.

Do not claim an exhaustive arbitrary-extension compatibility audit. Other remaining terminal/CLI surfaces or previously deferred environments are not automatically plugin requirements, and already recorded feature details should not be counted again.
