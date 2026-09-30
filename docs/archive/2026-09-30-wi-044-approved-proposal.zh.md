# WI-044：Vite 提交检查批准范围

[English](2026-09-30-wi-044-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-044-approved-proposal.md](2026-09-30-wi-044-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 创建：2026-09-30
- 权威：历史批准范围，不是新的 Build 授权
- 归档原因：WI-044 实现与自动化证据完成；最终处置归[验收记录](2026-09-30-wi-044-macos-acceptance.zh.md) 与 [ACTIVE](../../ACTIVE.md)。

## 批准与追溯

TOOL-01 在工具链审查后进入停车场。维护者 2026-09-30 要求完成 ACTIVE 剩余任务，即本 Build 授权。纯技术；无 PRD 切片、ADR 或 gate。

## 目标与范围

提交检查把仓库实际 Vite 配置归入实现／构建输入。覆盖新增、修改、删除与重命名。保留 ACTIVE 与普通文档配对。不替代人工语义审查。

## 方案

`isImplementationPath` 把根目录 `vite.config.*` 与 esbuild、tsconfig、ESLint 配置同等对待。

## 验收

ACTIVE 与 Vite 配置的新增／修改／删除／重命名同暂存失败。ACTIVE 加普通文档仍通过。compile／lint／完整 `npm test`。

## 后续限制

TOOL-02 TSX 规格发现仍范围外。
