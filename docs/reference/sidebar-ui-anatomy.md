# Pi Chat Sidebar: regions and components

English | [中文](sidebar-ui-anatomy.zh.md)

- Type: Reference
- Status: Living
- Created: 2026-09-29
- Authority: reference for interface introductions, design communication and code navigation; behavior belongs to the [PRD](../product-requirements.md), acceptance to [ACTIVE](../../ACTIVE.md)
- Inspection baseline: production Webview implementation at `bed0e8d`, inspected on 2026-09-29; this does not establish new F5 or installed-package acceptance

## 1. How to use this reference

This document provides stable names for Pi's interface. Use region names when introducing the product, identify the component and state when requesting design changes, and consult the implementation mapping when locating code. English names support design documents, issues and technical discussions; the UI does not need to display every name as a label.

**Overall name: Pi Chat Sidebar.** It appears in VS Code's sidebar, preferably the Secondary Side Bar on the right. VS Code's Activity Bar, editor title bar and window title bar belong to the host. An Open Pi icon there is not part of Pi's session navigation.

A ready-to-use introduction:

> Pi's chat sidebar consists of session navigation, a conversation area, task status and actions, and a message composer at the bottom. The composer toolbar lets users add context, open model and reasoning settings to select a model and adjust effort, and inspect permissions. The session history panel and settings dialog provide conversation management and configuration entry points.

The four regions describe responsibilities, not four permanently bordered rectangles. Task status and actions appear as needed. The welcome state and session history panel are alternative presentations of the middle space.

## 2. Overall structure

This is a position diagram, not a pixel specification. Bracketed contents appear according to state.

```text localized
Pi Chat Sidebar
┌──────────────────────────────────────────────┐
│ ① Session navigation                         │
│ Current title        History / New / Settings │
├──────────────────────────────────────────────┤
│ ② Conversation area                          │
│                                              │
│ Empty: Pi mark + greeting                     │
│ Chat: messages, replies, code, activity        │
│ Browsing history: session history panel       │
│                                              │
├──────────────────────────────────────────────┤
│ ③ Task status and actions (as needed)         │
│ [Interactions / Recovery / Review / Approvals]│
│ [Task status and errors]                      │
├──────────────────────────────────────────────┤
│ ④ Message composer                           │
│ [Context attachments]                        │
│ Message input                                │
│ +  Model/reasoning  Permissions   Send / Stop │
└──────────────────────────────────────────────┘
```

The middle content can scroll; the composer sits at the bottom. Opening history replaces the middle message display rather than switching the entire sidebar to a separate application page. Composer and task controls remain present, with operability still governed by session and task state.

## 3. Four main regions

### ① Session Navigation — 会话导航栏

**Position and purpose:** at the top of Pi's own interface, identifying the current conversation and providing access to session management and settings.

| Component | Current content and responsibility |
|---|---|
| Current conversation title | Shows the current name, constrained by available width |
| Session history button | Opens or closes the session history panel |
| New conversation button | Initiates a new conversation through the existing handoff and confirmation flow |
| Settings button | Opens the interface settings dialog |

“Navigation” is an appropriate shorthand. “Title bar” is ambiguous because VS Code has its own title bars. The settings button belongs to navigation; the dialog it opens is a separate supporting surface.

**Example:** “Use the session navigation at the top to start conversations, browse history and open settings.”

### ② Conversation Area — 会话内容区

**Position and purpose:** the reading space below navigation, presenting exchanges between the user and Pi and activity associated with replies.

Contents include user messages, assistant replies, Markdown code blocks, activity summaries within messages and their expanded details. Activity details can show upstream-provided thinking information, tool parameters and output; they do not promise access to a model's complete internal reasoning. Restored messages are also read here.

Common presentations:

| State | Recommended name | Content |
|---|---|---|
| No messages yet | Welcome State / 欢迎区、欢迎空状态 | Tricolor Pi mark and one greeting; the mark supports animation replay |
| Messages present | Message List / 消息列表 | User and assistant messages in conversation order |
| Generation in progress | Streaming Reply / 流式回复 | Assistant content displayed incrementally as it arrives |
| Message activity expanded | Activity Details / 活动详情 | Associated tools, thinking, execution state and output |
| Connection or runtime problem | Status / Error Notice / 状态提示、错误提示 | Explanation of the current obstacle and available recovery entry points |

**The welcome state belongs to the conversation area; it is not a fifth permanent region.** Call the central Pi graphic the welcome mark or brand mark. Small action glyphs elsewhere are generally icons.

**Example:** “The conversation area presents the exchange, with tool activity details available on demand.”

### ③ Task Status and Actions — 任务状态与操作区

**Position and purpose:** generally above the composer, showing current task feedback and operations requiring user attention. It does not need to reserve blank space when there is nothing to show.

| Component | User activity | Qualification |
|---|---|---|
| Task status indicator | Read working, replying, retrying, compaction, completed, stopped or failed status | State feedback, not an exact percentage progress bar |
| Tool approval card | Inspect the operation and scope, then allow or deny | Approval before execution, distinct from reviewing changes afterwards |
| Change review panel | Read change summaries and open captured before/after comparisons or source files | Does not imply pending patches or automatic rollback |
| Interaction request panel | Respond to extension selection/input requests | Cancelling one interaction is not stopping the entire task |
| Runtime recovery notice | Handle runtime conditions requiring explicit intervention | Distinct from ordinary task Stop |

Message activity and task actions serve different needs: **activity explains what happened; task actions expose what needs the user's attention now.** Global connection/runtime errors can also appear in the conversation area; not every error belongs to a single fixed bottom control.

**Example:** “When approval or recovery is needed, task actions expose the relevant controls so the user can inspect the scope before proceeding.”

### ④ Message Composer — 消息编辑区

**Position and purpose:** the bottom region grouping the draft, attachments and sending controls. Use “消息编辑区” in Chinese product introductions and “Composer” in code/design discussions. Older documentation's “作曲区” refers to this same region, not a separate feature.

| Subregion / component | Chinese name | Purpose |
|---|---|---|
| Context Attachments | 上下文附件区 | Show explicitly attached files/selections and their status; offer removal, confirmation and previews |
| Message Input | 消息输入框 | Edit a multiline task description or question |
| Composer Toolbar | 输入工具栏 | Compact action row below the input |
| Add Context Button | 添加上下文按钮 | The + button opening actions such as adding files/selections |
| Model and Reasoning Settings Trigger | 模型与推理设置入口 | Show model-related information and open the appropriate settings popover |
| Permissions Control | 权限入口 | Inspect permission explanations and existing session grants, with supported revocation actions |
| Send / Stop Button | 发送／停止按钮 | Switch the primary action in the same location according to task state |

“Input” means only the editable text field; “composer” includes attachments and the toolbar. The composer toolbar serves messages/tasks, whereas session navigation serves conversation management.

Send and Stop share a position but have different meanings. Stop requests cancellation of active work and queued continuation; it does not undo completed effects. Before a folder is open or project-resource consent is chosen, users can prepare drafts or choose a global default model. Editable controls do not mean task execution has been admitted.

**Example:** “The bottom composer brings together task input, context selection, model settings and sending controls.”

## 4. Three supporting surface families

### Session History Panel — 历史会话面板

Opened by the history button, this occupies the middle content space. The current production implementation offers saved conversations for the current project, titles, modification dates, current-session marking, refresh and pagination, with loading, empty and error states. Selection enters the existing restore flow; returning resumes reading the current conversation.

**Session history answers which conversation to open; historical messages answer what that conversation previously contained.** These correspond to the session catalogue and conversation content. Attachment history is another kind of context record and should not be called session history. Searchable history exists in the isolated specimen, not as an implemented feature of the current production panel.

### Popovers and Menus — 设置弹层与操作菜单

These open near a trigger for local selection or action, generally without replacing the main interface.

- **Menu / 操作菜单:** a list of actions, such as the Add Context menu opened by +.
- **Popover / 设置弹层:** a container for local settings, such as model and reasoning settings. It can contain options and a slider; calling the whole container a dropdown obscures that structure.
- **Model Selector / 模型选择器:** the control for choosing which model to use.
- **Reasoning Effort Slider / 推理强度滑条:** the control for choosing a supported reasoning level. Its track, thumb and stops are separately nameable parts.

The tricolor gradient and maximum-level flow are visual feedback within the reasoning slider. They express selected intensity, not evidence that the model is currently computing. Supported levels depend on model capabilities, so introductions should not promise exactly five levels. The preparation-stage default-model popover and live-session model/reasoning popover need not expose identical controls.

### Settings and Confirmation Dialogs — 设置与确认对话框

A dialog provides a relatively independent task space for configuration, confirmation or recovery. Current examples:

| Dialog | Contents |
|---|---|
| Interface settings | Language, providers/default model and execution profile |
| Project setup | Explicit choice about project-local pi settings and resources, with expandable scope details |
| Open-folder prompt | Recovery entry when an action needs a folder, preserving the draft |

Describe settings as a configuration entry point, but do not call every item a persistent global setting. For example, the current language choice is view-local and resets on reload. Project-resource consent, tool approval and execution profile have different scopes; precise semantics belong to the [domain glossary](../../CONTEXT.md).

API keys are entered in a **VS Code host password input**, not a Webview credential form. A suitable description is: “Start from provider settings and enter the key through VS Code's password input.”

## 5. Replace vague references with precise names

| Vague phrase | Recommended wording | Use |
|---|---|---|
| Buttons at the top | History / New / Settings in session navigation | Discussing top layout |
| Pi in the middle | Pi brand mark in the welcome state | Size, color, entrance or replay animation |
| The box at the bottom | Message composer; message input if referring only to text entry | Distinguishing container from editable content |
| Row under the input | Composer toolbar | Spacing and alignment |
| Model bar / colored bar | Model selector / reasoning effort slider | Distinguishing model from effort |
| That popup | Model settings popover / interface settings dialog, etc. | Identifying the trigger and task |
| History | Session history panel / restored messages / attachment history | Identifying the record type |
| Where changes are confirmed | Tool approval card or change review panel | Distinguishing authorization before execution from review afterwards |

Describe changes as **region + component + state + desired outcome**. For example:

- “In the composer toolbar at 280px, the model name must not squeeze the Send button.”
- “In the model and reasoning settings popover, play rightward flow only at the slider's maximum level.”
- “When loading session history fails, keep the error explanation and refresh entry visible together.”
- “Clicking the welcome Pi mark replays its animation; clicking during playback does not restart it.”

## 6. Suggested demonstration sequence

Follow one user task rather than listing every button:

1. **Orient:** identify session navigation, the conversation area and the bottom composer; explain that task actions appear as needed.
2. **Prepare:** write a task, use + to select files/selections, then choose a model and inspect supported reasoning levels.
3. **Observe:** after sending, read the streaming reply and activity details; inspect scope and decide when approval is requested.
4. **Review:** read the reply and, when captured changes are available, inspect their differences through change review. Use Stop when interruption is needed.
5. **Manage:** open session history to explain restoration, then settings to explain providers, default model and execution profile.

Demonstrate controls and states actually available in the current implementation. Specimen-only search or candidate layouts are not production features. This vocabulary supports introductions, not product acceptance.

## 7. Mapping interface names to current code

A UI region is not necessarily an independent code module. Production and preview share the composition in [candidate.tsx](../../src/webview/chat/candidate.tsx). `Candidate` is a retained prototype-era name, not evidence that it is preview-only.

| UI region | Current entry points | Decomposition |
|---|---|---|
| Overall sidebar / session navigation | [candidate.tsx](../../src/webview/chat/candidate.tsx), [session-navigation.tsx](../../src/webview/chat/session-navigation.tsx) | Page owns shared state and cross-region focus; navigation owns its controls and settings intents |
| Conversation area | [candidate-conversation.tsx](../../src/webview/chat/candidate-conversation.tsx), [reply-markdown.tsx](../../src/webview/chat/reply-markdown.tsx), [candidate-conversation.css](../../src/webview/chat/candidate-conversation.css) | Messages/activity, Markdown and their styles are separate; scrolling container and empty state remain in the main component. Message rows no longer show speaker labels, and replies without activity no longer show a placeholder note |
| Welcome state | [pi-welcome-mark.tsx](../../src/webview/chat/pi-welcome-mark.tsx) | Mark animation is separate; greeting and welcome layout remain in the main component |
| Task status and actions | [task-status.tsx](../../src/webview/chat/task-status.tsx), [candidate-review.tsx](../../src/webview/chat/candidate-review.tsx), [approvals.tsx](../../src/webview/components/approvals.tsx), [extension-interactions.tsx](../../src/webview/chat/extension-interactions.tsx) | Status line, approvals, review, extension interactions and recovery each live near their logic; regional composition, display conditions and cross-region height budgets remain in the main component |
| Message composer | [message-composer.tsx](../../src/webview/chat/message-composer.tsx) | Owns textarea sizing, input behavior, toolbar, permissions and Send/Stop; receives the page snapshot and client intents |
| Context attachments | [candidate-context.tsx](../../src/webview/chat/candidate-context.tsx) | Owns attachment/menu state and focus; exposes content and actions for composer placement |
| Model and reasoning settings | [model-picker.tsx](../../src/webview/components/model-picker.tsx), [default-model-picker.tsx](../../src/webview/chat/default-model-picker.tsx) | Live-session and preparation states use different components |
| Session history panel | [candidate-sessions.tsx](../../src/webview/chat/candidate-sessions.tsx) | Panel frame, flow-based Back/heading, list, feedback and pagination stay together; visibility, reading-position restoration and cross-region focus remain in the main component |
| Settings and confirmation dialogs | [interface-settings.tsx](../../src/webview/chat/interface-settings.tsx), [project-resources-prompt.tsx](../../src/webview/chat/project-resources-prompt.tsx), [no-folder-prompt.tsx](../../src/webview/chat/no-folder-prompt.tsx), [chat-dialog.tsx](../../src/webview/chat/chat-dialog.tsx) | ChatDialog owns native modal chrome, sticky header/footer and local body scroll; InterfaceSettings owns settings entry, sections and host intents; confirmation prompts own their copy and consent actions |

[styles.css](../../src/webview/styles.css) assembles component styles and region rules concentrated in [candidate.css](../../src/webview/chat/candidate.css). [message-composer.css](../../src/webview/chat/message-composer.css) owns the input, toolbar, context and permissions surfaces; shared height budgets remain with the page. [candidate-conversation.css](../../src/webview/chat/candidate-conversation.css) owns message rows, Markdown, code blocks and tool activity presentation. Task-status-and-operations styles stay near their modules: [task-status.css](../../src/webview/chat/task-status.css) owns the status markers and motion, [candidate-approvals.css](../../src/webview/chat/candidate-approvals.css) owns approval card internals, [candidate-review.css](../../src/webview/chat/candidate-review.css) owns the review panel, and [extension-interactions.css](../../src/webview/chat/extension-interactions.css) owns interaction forms, feedback and the recovery banner; cross-region `:has()` height budgets remain concentrated in candidate.css. Settings and confirmation chrome live in [chat-dialog.css](../../src/webview/chat/chat-dialog.css) and [interface-settings.css](../../src/webview/chat/interface-settings.css). State and host communication belong to files such as [webview-client.ts](../../src/webview/webview-client.ts); they are not a fifth visible region.

[session-navigation.css](../../src/webview/chat/session-navigation.css) owns navigation layout and shared navigation/history icon-button feedback; [candidate-sessions.css](../../src/webview/chat/candidate-sessions.css) owns the history layout and current-row, focus and disabled states. [session-icon.tsx](../../src/webview/chat/session-icon.tsx) embeds official local Lucide geometry; source and license remain in assets/icons/lucide. The current-row check is independent of hover and keyboard focus; full titles remain in accessible names and tooltips.

The preview server’s `/navigation-review.html` and `/settings-review.html` present 280/320/400px together, with theme, English/Chinese and the fixtures needed for those regions. They mount the shared chat with a synthetic host; this is not F5 or installed-package evidence.

Use these region names to discuss the interface, then existing filenames to locate implementation. This document requires no immediate renaming or refactoring. Update it and its code mapping when region ownership or visible functionality changes. Color, spacing and animation parameters remain owned by the [pi-sidebar-ui skill](../../.agents/skills/pi-sidebar-ui/SKILL.md).

Attachment rows, preview and retained-history styles now live in [candidate-context.css](../../src/webview/chat/candidate-context.css). CandidateContext tracks separate preview and history return-focus targets. Rows use hairline separators and official Lucide disclosure/close icons; reader headings stick, with literal content before the full snapshot limitations. Context scrolls locally while input/Stop stay outside it. `/consistency-review.html` provides the round-six three-width synthetic review; it is not real-host acceptance evidence.
