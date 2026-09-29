# Settings redesign research

English | [中文](2026-09-29-settings-redesign-research.zh.md)

- Type: Discussion
- Status: Research and candidate direction; not production acceptance
- Created: 2026-09-29
- Authority: **context only** — does not override [ACTIVE](../../ACTIVE.md), the [PRD](../product-requirements.md), or architecture
- Related: [Live session model and Saved default](2026-09-29-live-session-saved-default.md)

## Maintainer decision — September 29, 2026

The maintainer selected **A, editor-area settings**, superseding the agent's initial B recommendation below. WI-026 authorized a single settings panel, category/detail navigation, a composer execution entry and shared host-memory language. Existing credential/default/runtime semantics remain; no persistent language preference is added. This is the deliberate native-Settings exception described in the study. Choosing the candidate did not itself accept the implementation. The maintainer later confirmed F5 visual acceptance on 2026-09-29; installed VSIX remains separate. This note remains research context.

## Question

The maintainer rejected another small spacing adjustment and requested research followed by a fundamental settings redesign. The supplied screenshot puts language, saved model, provider credentials and execution profiles into one narrow, scrolling modal. Deleting explanatory text reduced copy but retained the same information architecture.

## Primary evidence

Retrieved on 2026-09-29. These are documentation observations, not claims of running the products or visually inspecting their current screenshots.

| Source | Observed guidance or behavior | Implication for pi |
|---|---|---|
| [VS Code Settings UX](https://code.visualstudio.com/api/ux-guidelines/settings), [official source](https://github.com/microsoft/vscode-docs/blob/main/api/ux-guidelines/settings.md) | Recommends defaults, clear descriptions, links for complicated settings and links to specific setting IDs. Explicitly says not to create a custom settings page/webview or long descriptions. | Native Settings is the baseline for persistent extension preferences. A custom surface needs a task-specific reason; competitors do not establish an exemption. |
| [VS Code Webviews UX](https://code.visualstudio.com/api/ux-guidelines/webviews), [official source](https://github.com/microsoft/vscode-docs/blob/main/api/ux-guidelines/webviews.md) | Use webviews only when necessary; avoid repeating existing Settings/configuration functionality. Require theme support, keyboard accessibility and appropriate command actions. | Moving the same form to a large custom editor tab is not automatically a good redesign. |
| [Claude Code in VS Code](https://code.claude.com/docs/en/vs-code), “Use the prompt box” and “Configure settings” | Model and permission-mode entries are at the prompt box. General extension behavior is configured through native VS Code Settings; runtime settings shared with CLI live separately. The documented model picker can also save per-model effort defaults. | Separate entry points by task and frequency. Do not assume every control near a prompt is session-only or copy Claude's persistence semantics into pi. |
| [Cline Anthropic configuration](https://docs.cline.bot/provider-config/anthropic) | Documents opening Cline settings, selecting a provider, entering credentials, then choosing a model. Custom base URL is optional. | Provider setup is a coherent task that can have its own detail flow. This source establishes steps, not visual quality, layout dimensions or a universal design rule. |

The VS Code pages were read from their official repository Markdown. Claude's HTML page was fetched and its readable text inspected; its `.md` endpoint returned HTTP 403. Cline's page was read through its official `.md` endpoint discovered from `llms.txt`; an initially guessed setup URL returned HTTP 404. No conclusions rely on those failed URLs. Separately, the existing [local Codex settings capture](../../.agents/skills/pi-sidebar-ui/assets/references/local-codex-settings.png) was visually inspected: category navigation, a separate main area, and natural-width trailing controls. Its [provenance](../../.agents/skills/pi-sidebar-ui/sources.md) does not establish the pictured version or responsive behavior; it is not a fresh online screenshot.

## Diagnosis and options

The visual problem has a structural cause: unrelated tasks have equal weight, every control is expanded at once, and the overlay sacrifices scarce sidebar width while retaining a full settings form. The screenshot supports this diagnosis; it is our design assessment, not a statement made by the sources.

1. **Native settings plus contextual operations.** Put persistent extension preferences in native Settings; retain model/permission operations near chat and open provider management only when needed. Closest to VS Code guidance, but it can change persistence, command routing and entry points. Requires a separate implementation assessment and approval.
2. **Sidebar settings navigation with focused details.** Replace the modal form with an in-place settings destination. An overview links to Models and providers, Execution, and Language; each detail shows only the controls relevant to that task. Credentials belong in provider detail, not permanently next to the default model. Keep one Back/Close hierarchy. A reversible candidate can test this without host changes. This custom destination remains a deliberate deviation from the native-settings recommendation.
3. **Wide custom settings editor.** More room allows labels and controls in separate columns, but requires another surface and repeats native settings. Current few controls do not establish a need for it; defer unless the focused candidate fails or settings scope grows.

## Current leaning

Prototype option 2 for a direct, reviewable visual comparison, while treating option 1 as the platform-aligned longer-term alternative. The fundamental change is task navigation and progressive disclosure, not different borders on the existing modal. Avoid adding an account dashboard, provider cards or status summaries merely to fill space.

Preserve pi's current semantics: Saved default and Live session model are distinct; selecting a default does not start a session. Credentials remain host-owned, with no secret input in the webview. Execution switching retains idle-only eligibility, pending/error/recovery states and truthful safety information. Critical safety distinctions must be available before choosing a mode, not hidden exclusively in a tooltip. The present WI-026 approval does not by itself authorize changing persistence or host protocols.

## Open questions and evidence still needed

- Does the maintainer prefer the focused navigation candidate after seeing and operating it at 280/320/400px?
- Should persistent preferences eventually use native Settings? Language currently has only page-lifetime persistence; migration must not silently make it durable.
- Candidate interaction and theme checks establish preview evidence only. Production integration, keyboard focus, actual-host behavior and maintainer acceptance remain separate work.

## Reviewable candidates

The isolated [settings structure study](../../.agents/skills/pi-sidebar-ui/assets/settings-redesign-study.html) lives in the existing visual-reference library, outside the production graph. Serve the skill directory with `python3 -m http.server 8769 --bind 127.0.0.1 --directory .agents/skills/pi-sidebar-ui`, then open `/assets/settings-redesign-study.html?variant=B`.

- **A — custom editor settings:** category rail and dedicated model/provider pages; chat remains visible. This is a deliberate counterproposal to native Settings guidance, not an official recommendation.
- **B — sidebar navigation:** full-width destination replaces the modal; overview → models/provider list → provider details. Model and execution operations remain near the composer. Recommended candidate for the current small scope; additional clicks are the tradeoff.
- **Native Settings:** retained as the platform baseline, not simulated as if pi already contributes those settings. Moving page-lifetime language there would require an explicit persistence decision.

Both candidates use fixed sample data and memory-only state. Provider actions never accept a key. The study intentionally does not simulate successful default-to-live-session application, thinking-level capability, real runtime switching or production focus restoration. None of those omissions authorize removing existing behavior. Chinese-only copy and a static editor/chat context are design aids, not a production implementation.

Observed in Chrome: A at 320px dark; B overview at 320px dark, provider list at 280px dark, model detail at 400px light and execution menu at 280px high contrast. Model search and selection, category/detail navigation and return to chat were exercised. These are sampled study checks, not a complete theme/state matrix, system forced-colors, F5 or VSIX evidence.
