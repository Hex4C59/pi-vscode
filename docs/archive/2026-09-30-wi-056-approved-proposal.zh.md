# WI-056：ARCH-04 盘点批准范围

[English](2026-09-30-wi-056-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-056-approved-proposal.md](2026-09-30-wi-056-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 创建：2026-09-30
- 权威：历史批准范围，不是新的 Build 授权
- 归档原因：WI-056 盘点完成；最终处置归[验收记录](2026-09-30-wi-056-macos-acceptance.zh.md) 与 [ACTIVE](../../ACTIVE.md)。

## 批准与追溯

ARCH-04 要求在复制类型前核对该共享。维护者 2026-09-30 要求完成 ACTIVE 剩余任务，即本 Build 授权。纯技术；无 PRD 切片、ADR 或 gate。

## 目标与范围

记录共享值对象与仅宿主准入类型。不为假想额外客户端复制 DTO。

## 方案

阅读 `models/types.ts`、`runtimeLifecycle.ts` 与 `webviewProtocol.ts`。

## 验收

讨论记录写明共享字段、传播成本、以及是否需要分离。无应用代码变更时 compile／lint／完整 `npm test` 作为回归。

## 后续限制

复制 DTO、WI-036、gate／ADR 与推送仍在范围外。
