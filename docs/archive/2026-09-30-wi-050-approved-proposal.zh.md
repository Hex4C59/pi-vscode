# WI-050：规格命名约束批准范围

[English](2026-09-30-wi-050-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-050-approved-proposal.md](2026-09-30-wi-050-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 创建：2026-09-30
- 权威：历史批准范围，不是新的 Build 授权
- 归档原因：WI-050 实现与自动化证据完成；最终处置归[验收记录](2026-09-30-wi-050-macos-acceptance.zh.md) 与 [ACTIVE](../../ACTIVE.md)。

## 批准与追溯

TOOL-02 在工具链审查后作为条件性 P3 进入停车场。维护者 2026-09-30 要求完成 ACTIVE 剩余任务，即本 Build 授权。纯技术；无 PRD 切片、ADR 或 gate。

## 目标与范围

不允许把 `.spec.tsx` 作为收集的应用规格。该类文件位于已收集 `tests/` 目录时发现失败。不增加 TSX 输出路径映射。

## 方案

`discoverTests` 列出匹配的 `.spec.tsx` 路径并在构建前抛出。收集目录之外的文件仍被忽略。现有 `.spec.ts`／`.spec.mjs` 发现不变。

## 验收

同时含 `.spec.ts` 与已收集 `.spec.tsx` 的树失败，并指出该 TSX 路径。compile／lint／完整 `npm test`。

## 后续限制

允许 TSX 规格、重启逐断言审计、ARCH 盘点、WI-036、gate／ADR 与推送仍在范围外。
