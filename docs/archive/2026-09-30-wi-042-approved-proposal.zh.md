# WI-042：模型选择器稳定身份批准范围

[English](2026-09-30-wi-042-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-042-approved-proposal.md](2026-09-30-wi-042-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 创建：2026-09-30
- 权威：历史批准范围，不是新的 Build 授权
- 归档原因：WI-042 实现与自动化证据完成；最终处置归[验收记录](2026-09-30-wi-042-macos-acceptance.zh.md) 与 [ACTIVE](../../ACTIVE.md)。

## 批准与追溯

UI-01 在 UI 组件审查后进入停车场。维护者 2026-09-30 要求完成 ACTIVE 剩余任务，即本 Build 授权。REQ-002；无新 ADR、gate 或协议变更。

## 目标与范围

模型列表用稳定的供应商／模型 id 标记已应用 radio。同名显示标签、以及标签与另一模型 canonical 组合碰撞时仍最多选中一个。这是展示唯一性，不宣称运行时收到了错误模型。

## 方案

`appliedCatalogIdentity` 优先唯一的 `provider / modelId` 匹配，其次唯一显示标签。重复标签不走标签路径。

## 验收

挂载的碰撞与同名标签目录只显示一个 `aria-checked="true"`。唯一标签与 canonical `provider / id` 的 chatModel 仍标记对应项。compile／lint／完整 `npm test`。不要求 macOS 宿主模型选择实机。

## 后续限制

UI-02 Escape／焦点、协议变更与运行时选错结论仍范围外。
