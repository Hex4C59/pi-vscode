# WI-055：ARCH-03 盘点批准范围

[English](2026-09-30-wi-055-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-055-approved-proposal.md](2026-09-30-wi-055-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 创建：2026-09-30
- 权威：历史批准范围，不是新的 Build 授权
- 归档原因：WI-055 盘点完成；最终处置归[验收记录](2026-09-30-wi-055-macos-acceptance.zh.md) 与 [ACTIVE](../../ACTIVE.md)。

## 批准与追溯

ARCH-03 要求在拆接口前列出运行时能力组合。维护者 2026-09-30 要求完成 ACTIVE 剩余任务，即本 Build 授权。纯技术；无 PRD 切片、ADR 或 gate。

## 目标与范围

记录 `PiRuntimeLifecycle` 必需与可选方法及各实现覆盖。不拆成大量接口。

## 方案

阅读契约、生产工厂、noop、探针与测试 harness。

## 验收

讨论记录写明组合以及可选项是否仍必要。无应用代码变更时 compile／lint／完整 `npm test` 作为回归。

## 后续限制

拆接口、实施 ARCH-04、WI-036、gate／ADR 与推送仍在范围外。
