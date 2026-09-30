# ARCH-04 模型类型与 Webview DTO 共享

[English](2026-09-30-arch-04-dto-coupling.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-arch-04-dto-coupling.md](2026-09-30-arch-04-dto-coupling.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：讨论
- 状态：Closed
- 创建：2026-09-30
- 权威：WI-056 盘点；不是实施批准、ADR 或类型拆分
- 相关：[Webview 协议](../reference/webview-messages.zh.md)

## 问题

把 Webview DTO 与宿主模型设置、运行时 lifecycle 共享，是否造成值得加转换层的维护成本？

## 共享了什么

| 类型 | 定义于 | 使用者 |
|------|--------|--------|
| `ModelCatalogEntry` | `webviewProtocol.ts` | Webview 选择器、经 `Pick` 的 `ModelSettingsSnapshot`、`PiRuntimeLifecycle` 投影／变更结果、`findCatalogEntry`、供应商配置目录 |
| `ActivityItem` | 同上 | 运行时事件与 workspace `activities` |
| `AttachmentDetails` | 同上 | Prompt enrichment 与附件 UI |
| `ChatLine` | 同上 | 实时消息与保存历史概览 |
| `RuntimePhase` | 同上 | Workspace `runtime`，并由 lifecycle 再导出 |

`ModelSettingsSnapshot` 是 `Pick<WorkspaceStateMessage, chatModel | thinkingLevel | thinkingLevels | availableModels | modelBusy | modelError | pendingModel | pendingThinkingLevel>`。宿主准入（`ModelSettingsContext`）已是独立类型：generation、session、ready、disposed、blocked、chatBusy、stopping。

`publish()` 把 `this.state` 与 `this.models.snapshot` 展开。共享字段名就是转换：没有第二套 mapper。

## 传播

仅展示用的 Webview 字段加到 `WorkspaceStateMessage` 不会自动出现在 `ModelSettingsSnapshot`，除非有人把它加入 `Pick`。给 `ModelCatalogEntry` 加字段（例如图标）会同时牵动目录解析、设置快照、供应商配置和选择器。该耦合真实但目前未发生：条目只有 provider、modelId 与 label。

运行时事件使用 `ActivityItem`，因为宿主投影的就是 Webview 渲染的有界 activity。复制该形状会在协调器增加 mapper，却没有第二套前端。

## 结论

共享值对象保留。不为假想的额外客户端复制目录或 activity 类型。若以后出现仅 Webview 的目录字段，转换所有者是宿主 `publish()`／模型快照映射，不是 adapter RPC 层。不据此拆分。
