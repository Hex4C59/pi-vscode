# WI-054：ARCH-01 盘点批准范围

[English](2026-09-30-wi-054-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-054-approved-proposal.md](2026-09-30-wi-054-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 创建：2026-09-30
- 权威：历史批准范围，不是新的 Build 授权
- 归档原因：WI-054 盘点完成；最终处置归[验收记录](2026-09-30-wi-054-macos-acceptance.zh.md) 与 [ACTIVE](../../ACTIVE.md)。

## 批准与追溯

ARCH-01 要求在拆协调器前先列表准入所有者。维护者 2026-09-30 要求完成 ACTIVE 剩余任务，即本 Build 授权。纯技术；无 PRD 切片、ADR 或 gate。

## 目标与范围

记录发送、模型、Stop、profile、会话与文件夹准入的所有者。不合并 busy 标志，不按文件长度拆分。

## 方案

阅读协调器、ModelSettings、rpc-occupancy 以及草稿／工具注入回调。

## 验收

讨论记录写明所有者、操作门、以及重复与漂移。无应用代码变更时 compile／lint／完整 `npm test` 作为回归。

## 后续限制

合并 busy、按文件长度拆分、实施 ARCH-03／04、WI-036、gate／ADR 与推送仍在范围外。
