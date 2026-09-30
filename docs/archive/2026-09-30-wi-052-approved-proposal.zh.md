# WI-052：资源与期限测量批准范围

[English](2026-09-30-wi-052-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-052-approved-proposal.md](2026-09-30-wi-052-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 创建：2026-09-30
- 权威：历史批准范围，不是新的 Build 授权
- 归档原因：WI-052 测量完成；最终处置归[验收记录](2026-09-30-wi-052-macos-acceptance.zh.md) 与 [ACTIVE](../../ACTIVE.md)。

## 批准与追溯

停车场项要求与 ARCH-08 分开测量启动设置、诊断 stderr、artifact inflate 以及 test／Git 超时。维护者 2026-09-30 要求完成 ACTIVE 剩余任务，即本 Build 授权。纯技术；无 PRD 切片、ADR 或 gate。

## 目标与范围

记录实际成本与外层约束。仅在测量表明必要时加预算。本切片不实施预算，也不宣称卡顿。

## 方案

阅读四处生产／脚本路径，并在本树上对代表性文件与合成载荷计时。不优化 ARCH-08。

## 验收

讨论记录写明：各路径行为、测得的大小／时间、外层 CI／job 限制、以及是否需要预算。无应用代码变更时 compile／lint／完整 `npm test` 作为回归。

## 后续限制

实施预算、ARCH-08 优化、ARCH 盘点、WI-036、gate／ADR 与推送仍在范围外。
