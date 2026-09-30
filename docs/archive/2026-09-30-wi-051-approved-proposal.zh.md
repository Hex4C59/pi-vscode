# WI-051：接口风险核验批准范围

[English](2026-09-30-wi-051-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-051-approved-proposal.md](2026-09-30-wi-051-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 创建：2026-09-30
- 权威：历史批准范围，不是新的 Build 授权
- 归档原因：WI-051 调用方证据完成；最终处置归[验收记录](2026-09-30-wi-051-macos-acceptance.zh.md) 与 [ACTIVE](../../ACTIVE.md)。

## 批准与追溯

停车场项要求在收紧类型前核验 Composer 标志与 workspace、以及 FileSnapshot 与校验器的配对。维护者 2026-09-30 要求完成 ACTIVE 剩余任务，即本 Build 授权。纯技术；无 PRD 切片、ADR 或 gate。

## 目标与范围

记录生产所有者与调用方。仅在证实可复现的生产错误配对时收紧。否则记录未发现并关闭。

## 方案

阅读 `Candidate` 标志派生、`MessageComposer` 挂载、`DraftAttachment` kind，以及每一处 `validateEditorSnapshot`／`validateSelectionDocument` 调用。不按文件长度或 props 数量拆分模块。

## 验收

讨论记录写明：生产 Composer 标志从何处派生、FileSnapshot 各来源对应哪个 validator、是否确认错误配对。无应用代码变更时 compile／lint／完整 `npm test` 作为回归。

## 后续限制

无生产错误时的类型收紧、ARCH 盘点、资源测量、WI-036、gate／ADR 与推送仍在范围外。
