# WI-053：ARCH-08 测量批准范围

[English](2026-09-30-wi-053-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-053-approved-proposal.md](2026-09-30-wi-053-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 创建：2026-09-30
- 权威：历史批准范围，不是新的 Build 授权
- 归档原因：WI-053 测量完成；最终处置归[验收记录](2026-09-30-wi-053-macos-acceptance.zh.md) 与 [ACTIVE](../../ACTIVE.md)。

## 批准与追溯

ARCH-08 要求在优化前测量流式发布与历史预览成本。维护者 2026-09-30 要求完成 ACTIVE 剩余任务，即本 Build 授权。纯技术；无 PRD 切片、ADR 或 gate。

## 目标与范围

在代表性有界负载上测量发布字节、解析次数与延迟。保留公共 SDK 与身份／anchor 校验。不优化、不解析 session 文件。

## 方案

阅读热路径；进程内计时 `JSON.stringify`、`Lexer.lex`、会话重组与 `projectSavedHistoryPreview`。不宣称 VS Code IPC 或 UI 卡顿。

## 验收

讨论记录写明负载、数字、以及是否值得优化。无应用代码变更时 compile／lint／完整 `npm test` 作为回归。

## 后续限制

流式／历史优化、解析 session 文件、ARCH 盘点、WI-036、gate／ADR 与推送仍在范围外。
