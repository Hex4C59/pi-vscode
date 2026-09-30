# Webview 目录说明

[English](README.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[README.md](README.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01

- Type: Guide
- Status: Draft
- Scope: `src/webview/` 内部的目录组织建议

本文记录建议的 Webview 目录结构，并解释文件应该放在哪里。下方目录树是目标结构，当前文件系统尚未按此整理。本次仅编写说明，没有移动源码或建立新的模块接口。文件归属建议依据现有文件名和架构职责提出，实际移动前还需检查引用关系与复用情况。

[系统架构](../../docs/architecture/vscode-extension-architecture.zh.md#源码目录)负责定义分层、依赖方向和契约归属。本文说明展示层内部的文件组织。

## 建议目录结构

```text
src/webview/
├── README.md
├── README.zh.md
├── main.tsx
├── index.ts
├── styles.css
├── client/
├── chat/
│   ├── index.ts
│   ├── types.ts
│   ├── candidate.tsx
│   ├── candidate.css
│   ├── composer/
│   ├── conversation/
│   ├── sessions/
│   ├── execution/
│   └── workspace/
├── settings/
├── ui/
├── i18n/
├── styles/
├── preview/
└── tests/
```

当前已有 `chat/`、`components/`、`settings/`、`styles/`、`preview/` 和 `tests/`。`client/`、`ui/`、`i18n/` 以及 `chat/` 下的五个功能子目录是建议新增的分组。现有 `components/` 中的文件按功能或实际复用情况归位后，可逐步替代这个宽泛目录。

## 各文件夹的职责

| 文件夹 | 做什么 | 建议放入的现有文件 |
|--------|--------|--------------------|
| `client/` | 负责浏览器侧消息传输、宿主消息解析、投影状态与客户端请求协调。展示模块通过这里提供的能力与宿主通信。 | 当前根目录的 `bridge.ts`、`parse-host-message.ts`、`webview-client.ts`、`client-state.ts`、`saved-history-client.ts`，以及客户端拥有的类型。 |
| `chat/` | 负责聊天页面入口与整体组合：把各功能模块组装成侧栏页面，协调页面级布局。 | `index.ts`、页面挂载类型、`candidate.tsx` 与页面整体的 `candidate.css`。 |
| `chat/composer/` | 负责草稿输入、上下文与附件控件，以及输入区专属展示。 | `message-composer.tsx` / `.css`、`candidate-context.tsx` / `.css`、`composer-icon.tsx`；当前 `styles/` 中属于输入区的专属样式。 |
| `chat/conversation/` | 负责会话消息与回复展示、Markdown 渲染，以及消息区域里的欢迎内容。 | `candidate-conversation.tsx` / `.css`、`reply-markdown.tsx`、`pi-welcome-mark.tsx`。 |
| `chat/sessions/` | 负责会话导航、已保存历史的展示，以及聊天内容与历史视图之间的切换。 | `session-navigation.tsx` / `.css`、`candidate-sessions.tsx` / `.css`、`session-icon.tsx`，以及 `components/saved-history.tsx` / `.css`。 |
| `chat/execution/` | 负责执行状态、工具审批、标准扩展交互与变更审阅的展示。宿主策略和运行时执行仍由原有层负责。 | `task-status.tsx` / `.css`、`extension-interactions.tsx` / `.css`、`components/approvals.tsx`、`components/change-review.tsx` / `.css`，以及聊天专属审批／审阅样式。 |
| `chat/workspace/` | 负责工作区就绪提示与项目资源同意的展示。工作区身份、执行资格和同意状态仍由宿主决定。 | `no-folder-prompt.tsx`、`project-resource-consent.tsx`、`project-resources-prompt.tsx`，以及 `components/workspace-setup.tsx`。 |
| `settings/` | 负责独立设置页面的入口、页面组合和专属样式。 | 现有 `index.tsx`、`settings.css`，以及后续设置页面专属展示。 |
| `ui/` | 放多个功能实际复用的基础展示模块，不拥有聊天、会话或执行状态。 | 若确实跨功能复用，可放 `chat-dialog.tsx` / `.css`，以及共用图标或基础控件。功能专属 UI 留在所属功能目录。 |
| `i18n/` | 负责浏览器展示共用的界面语言状态、文案定义与语言包。 | `chat/ui-language.ts`、`chat/ui-zh-cn.ts`，以及 `components/ui-text.tsx` 中与翻译有关的定义。预览语言夹具仍归预览所有。 |
| `styles/` | 放全局主题变量、基础规则、共用布局与响应式规则。功能专属样式与对应功能放在一起。 | `theme.css`、`base.css`、`layout.css`、`responsive.css`；确认归属后保留 `controls.css` 中的共用规则。 |
| `preview/` | 负责浏览器预览入口、合成场景、模拟宿主消息、审阅页面与开发控件。 | 现有 HTML／TS／TSX 审阅入口、`scenarios.ts`、`preview-bridge.ts` 与预览专属样式。 |
| `tests/` | 放页面组合测试、跨功能交互测试与共用浏览器测试夹具。 | 现有应用／客户端集成测试与 React、candidate 共用夹具。整理源码时，功能独占的测试可放到对应功能目录内部。 |

`chat/execution/` 初期只是相关文件的分组。如果审批、扩展交互或审阅以后需要独立接口，应分别评估模块划分。新建这个目录本身不意味着合并它们的状态或职责。

## Webview 根目录中的文件

- `main.tsx` 根据宿主指定的页面类型，选择并挂载聊天或设置页面。
- `index.ts` 根据现有使用方保留 Webview 层入口。
- `styles.css` 汇总样式加载顺序。移动样式时，需要保留必要的层叠顺序。
- 这两份 README 解释目录归属。模块自己的类型随模块放置；根目录的 `types.ts` 只保留确实属于整个展示层的类型。

## 文件归属原则

1. **按功能放在一起。** 同一功能的 TSX、专属 CSS 和辅助文件相邻。保存历史、审批、变更审阅应归入有具体名称的功能，而不是统一堆入 `components/`。
2. **有实际复用再共享。** 局部 UI 留在功能内部。多个功能复用同一种展示职责时，再放入 `ui/`。如果聊天与设置共用模型选择器，也可以为它建立独立、有具体名称的目录。
3. **集中语言定义。** 共用文案定义和语言包归 `i18n/`，功能行为留在功能目录。拆分现有宽泛的 `types.ts` 前，应确认类型的实际归属。
4. **保留正式页面与预览的分工。** 正式页面和预览通过聊天入口共用展示；合成场景、计时器和开发控件归 `preview/`。名称中的 `candidate` 不代表预览归属，当前正式聊天页面也使用这套组合。
5. **区分目录分组与模块接口。** 功能子目录可以只是内部文件分组。外部调用方需要把它作为整体使用时，再建立公共入口和明确接口；每个文件夹都不必自动增加 `index.ts` 或 `types.ts`。
6. **保留已有架构归属。** 跨层契约继续由 `src/extension/contracts/` 统一拥有，浏览器以类型方式使用。[架构文档](../../docs/architecture/vscode-extension-architecture.zh.md#源码目录)继续负责依赖方向和职责的权威定义。

## 建议整理顺序

1. 先在 `chat/` 下归组会话、输入与执行文件，包括目前分散在 `chat/` 和 `components/` 的专属样式。
2. 把浏览器客户端文件和共用语言文件分别归组到 `client/` 与 `i18n/`。
3. 按功能归属或已确认的复用情况，安排剩余 `components/` 文件。尤其要先检查 `chat-preview.tsx`、`model-picker.tsx` 和宽泛类型文件的使用方，再决定目的地。
4. 归属清楚后，可考虑把正式页面中的 `candidate-*` 改成描述当前用途的名称。目录树保留当前页面组合名称，避免让人误以为已经完成重命名。

以上仅记录目录组织建议。实际移动源码、修改引用、调整样式顺序与构建／测试入口属于后续独立实现任务。
