# WI-024：供应商设置布局（渐进展开）

[English](2026-09-28-wi-024-provider-settings-layout.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-28-wi-024-provider-settings-layout.md](2026-09-28-wi-024-provider-settings-layout.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-28
- Type: Discussion
- Status: Accepted (layout choice)
- Created: 2026-09-28
- Authority: **仅作上下文** — 不覆盖 [`ACTIVE.md`](../../ACTIVE.md) 验收或宿主契约

## 背景

WI-024 首版在齿轮设置中把每个 API Key 供应商竖排列出（`src/webview/chat/interface-settings.tsx`）。宿主仍投影完整的无密钥 `providers` 数组，以及跨供应商的默认模型 `catalog`。F5 后维护者反馈侧栏对话框过长，并提议用供应商候选框，一次只展开一个供应商的 API 操作。

## 决定（维护者，2026-09-28）

采用**方案 3（混合）**：

1. **默认模型**仍作为顶层控件，使用现有跨供应商目录。
2. 用一行摘要显示**已配置供应商**。
3. 用 **供应商** `<select>`；添加／更新／移除只作用于当前选中供应商。
4. 不改宿主消息、密钥路径或 `setDefaultModelAndProvider` 语义。

## 依据

- 已在 `interface-settings.tsx`、UI 文案／CSS 与 `provider-config-ui.spec.ts` 实现。
- 宿主契约仍为 `providerConfigState` 与既有意图；API 密钥仍仅经宿主 InputBox 收集。

## 视觉打磨（2026-09-28）

维护者认为混合布局仍不规则（左右混排、按钮不齐、刷新孤立）。按 VS Code 窄面板表单惯例重排设置对话框：

- 单列堆叠字段（标签在上、控件全宽）
- 凭证状态与操作收入同一边框面板，按钮等宽网格
- 刷新改为次要虚线控件
- 与执行配置分区共用同一节奏

行为与宿主契约不变。
