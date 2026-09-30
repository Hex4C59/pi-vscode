# Webview 目录说明

[English](README.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[README.md](README.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01

- Type: Guide
- Status: Accepted
- Scope: `src/webview/` 当前的目录组织

本文记录展示层内部文件的当前位置。下方目录树与当前文件系统一致。功能子目录默认只是内部分组，除非该目录已有公共 `index.ts`。

[系统架构](../../docs/architecture/vscode-extension-architecture.zh.md#源码目录)负责定义分层、依赖方向和契约归属。本文说明展示层内部的文件组织。

## 当前目录结构

```text
src/webview/
├── README.md
├── README.zh.md
├── main.tsx
├── index.ts
├── types.ts
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
├── components/
├── styles/
├── preview/
└── tests/
```

`components/` 仍是展示层公共入口（`index.ts` 与 `types.ts`）。功能实现放在各自归属目录。

## 各文件夹的职责

| 文件夹 | 做什么 | 当前内容 |
|--------|--------|----------|
| `client/` | 负责浏览器侧消息传输、宿主消息解析、投影状态与客户端请求协调。展示模块通过这里提供的能力与宿主通信。 | `bridge.ts`、`parse-host-message.ts`、`webview-client.ts`、`client-state.ts`、`saved-history-client.ts`，以及客户端拥有的 `types.ts`。Webview 层入口再导出该契约。 |
| `chat/` | 负责聊天页面入口与整体组合：把各功能模块组装成侧栏页面，协调页面级布局。 | `index.ts`、页面挂载类型、`candidate.tsx` 与页面整体的 `candidate.css`。 |
| `chat/composer/` | 负责草稿输入、上下文与附件控件，以及输入区专属展示。 | `message-composer`、`candidate-context`、`composer-icon`、`model-picker`、`model-display` 及输入区 CSS。设置页不使用该选择器。 |
| `chat/conversation/` | 负责会话消息与回复展示、Markdown 渲染，以及消息区域里的欢迎内容。 | `candidate-conversation`、`reply-markdown`、`pi-welcome-mark`。 |
| `chat/sessions/` | 负责会话导航、已保存历史的展示，以及聊天内容与历史视图之间的切换。 | `session-navigation`、`candidate-sessions`、`session-icon`、`saved-history`。 |
| `chat/execution/` | 负责执行状态、工具审批、标准扩展交互与变更审阅的展示。宿主策略和运行时执行仍由原有层负责。 | `task-status`、`extension-interactions`、`approvals`、`change-review`，以及包含原 `styles/activity.css` 的专属样式。 |
| `chat/workspace/` | 负责工作区就绪提示与项目资源同意的展示。工作区身份、执行资格和同意状态仍由宿主决定。 | `no-folder-prompt`、`project-resource-consent`、`project-resources-prompt`、`workspace-setup`。 |
| `settings/` | 负责独立设置页面的入口、页面组合和专属样式。 | `index.tsx`、`plugins.tsx`、`settings.css`。 |
| `ui/` | 放多个功能实际复用的基础展示模块，不拥有聊天、会话或执行状态。 | `chat-dialog`（工作区提示）和 `chat-preview`（会话与审阅）。 |
| `i18n/` | 负责浏览器展示共用的界面语言状态、文案定义与语言包。 | `ui-language.ts`、`ui-zh-cn.ts`、`ui-text.tsx`。预览语言夹具仍归预览所有。 |
| `components/` | 聊天组合使用的展示层公共入口，不是功能文件堆。 | `index.ts` 再导出各功能实现；`types.ts` 仍是展示契约。 |
| `styles/` | 放全局主题变量、基础规则、共用布局与响应式规则。功能专属样式与对应功能放在一起。 | `theme.css`、`base.css`、`layout.css`、`controls.css`、`responsive.css`。 |
| `preview/` | 负责浏览器预览入口、合成场景、模拟宿主消息、审阅页面与开发控件。 | 现有 HTML／TS／TSX 审阅入口、`scenarios.ts`、`preview-bridge.ts` 与预览专属样式。 |
| `tests/` | 放页面组合测试、跨功能交互测试与共用浏览器测试夹具。 | 现有应用／客户端集成测试与 React、candidate 共用夹具。 |

`chat/execution/` 是相关文件的分组。如果审批、扩展交互或审阅以后需要独立接口，应分别评估模块划分。这个目录本身不合并它们的状态或职责。

## Webview 根目录中的文件

- `main.tsx` 根据宿主指定的页面类型，选择并挂载聊天或设置页面。
- `index.ts` 根据现有使用方保留 Webview 层入口。
- `types.ts` 为 Webview 层入口再导出客户端契约。
- `styles.css` 汇总样式加载顺序。移动样式时，需要保留必要的层叠顺序。
- 这两份 README 解释目录归属。

## 文件归属原则

1. **按功能放在一起。** 同一功能的 TSX、专属 CSS 和辅助文件相邻。保存历史、审批、变更审阅应归入有具体名称的功能，而不是统一堆入 `components/`。
2. **有实际复用再共享。** 局部 UI 留在功能内部。多个功能复用同一种展示职责时，再放入 `ui/`。
3. **集中语言定义。** 共用文案定义和语言包归 `i18n/`，功能行为留在功能目录。
4. **保留正式页面与预览的分工。** 正式页面和预览通过聊天入口共用展示；合成场景、计时器和开发控件归 `preview/`。名称中的 `candidate` 不代表预览归属，当前正式聊天页面也使用这套组合。
5. **区分目录分组与模块接口。** 功能子目录可以只是内部文件分组。外部调用方需要把它作为整体使用时，再建立公共入口和明确接口；每个文件夹都不必自动增加 `index.ts` 或 `types.ts`。
6. **保留已有架构归属。** 跨层契约继续由 `src/extension/contracts/` 统一拥有，浏览器以类型方式使用。[架构文档](../../docs/architecture/vscode-extension-architecture.zh.md#源码目录)继续负责依赖方向和职责的权威定义。

把正式页面中的 `candidate-*` 改成描述当前用途的名称，仍可作为归属清楚后的后续可选步骤。
