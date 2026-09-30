# WI-045：缺失路径本地化批准范围

[English](2026-09-30-wi-045-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-045-approved-proposal.md](2026-09-30-wi-045-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 创建：2026-09-30
- 权威：历史批准范围，不是新的 Build 授权
- 归档原因：WI-045 实现与自动化证据完成；最终处置归[验收记录](2026-09-30-wi-045-macos-acceptance.zh.md) 与 [ACTIVE](../../ACTIVE.md)。

## 批准与追溯

UI-03 在 UI 组件审查后进入停车场。维护者 2026-09-30 要求完成 ACTIVE 剩余任务，即本 Build 授权。REQ-007；无新 ADR 或 gate。

## 目标与范围

缺失审阅路径的正文与 tooltip 共用同一翻译入口。英文与中文都覆盖。这是本地化一致性，不是文件访问或授权。

## 方案

`ReviewEntry` 的正文与 `title` 都使用 `entry.path ?? t("Path unavailable")`。

## 验收

null path 条目的英文、中文正文与 tooltip 一致。compile／lint／完整 `npm test`。不要求原生审阅 UI。

## 后续限制

RUNTIME-03 诊断工具仍范围外。
