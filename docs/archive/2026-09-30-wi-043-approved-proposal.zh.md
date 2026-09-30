# WI-043：已消费 Escape 批准范围

[English](2026-09-30-wi-043-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-043-approved-proposal.md](2026-09-30-wi-043-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 创建：2026-09-30
- 权威：历史批准范围，不是新的 Build 授权
- 归档原因：WI-043 实现与自动化证据完成；最终处置归[验收记录](2026-09-30-wi-043-macos-acceptance.zh.md) 与 [ACTIVE](../../ACTIVE.md)。

## 批准与追溯

UI-02 在 UI 组件审查后进入停车场。维护者 2026-09-30 要求完成 ACTIVE 剩余任务，即本 Build 授权。REQ-002；无新 ADR、gate 或协议变更。

## 目标与范围

模型弹层的窗口级 Escape 忽略已被消费的事件（`defaultPrevented` 或输入法组合）。重叠的添加上下文菜单与模型弹层：在上下文菜单上按 Escape 只关闭该菜单并恢复其触发器。jsdom 证据，不是 macOS 宿主键盘验收。

## 方案

`ModelPickerView` 在 Escape 处于组合或已被阻止时提前返回。`CandidateContext` 已在菜单 Escape 上 preventDefault。

## 验收

挂载重叠：上下文菜单消失、弹层仍开、焦点在 Add context。组合中的 Escape 不关闭弹层。既有单独关闭弹层的 Escape 仍通过。compile／lint／完整 `npm test`。

## 后续限制

UI-03 本地化与实机宿主键盘验证仍范围外。
