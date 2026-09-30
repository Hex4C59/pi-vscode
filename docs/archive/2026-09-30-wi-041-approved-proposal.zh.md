# WI-041：session-worker 请求关联批准范围

[English](2026-09-30-wi-041-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-041-approved-proposal.md](2026-09-30-wi-041-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 创建：2026-09-30
- 权威：历史批准范围，不是新的 Build 授权
- 归档原因：WI-041 实现与自动化证据完成；最终处置归[验收记录](2026-09-30-wi-041-macos-acceptance.zh.md) 与 [ACTIVE](../../ACTIVE.md)。

## 批准与追溯

CORE-02 在核心边界审查后进入停车场。维护者 2026-09-30 要求完成 ACTIVE 剩余任务，即本 Build 授权。REQ-008；无新 ADR 或 gate。

## 目标与范围

inspect／history／preview 成功响应把会话 id、历史页码与预览 offset 绑定到本次请求。非终态预览必须推进游标；结束标记不得与剩余字符矛盾。保留既有 list 页码对照。解析器反例不构成真实 worker 会发出这些帧、或已错误切换会话的产品结论。

## 方案

`parseSessionWorkerResponse` 对照 inspect 的 `session.id`、history 的 `page` 与 preview 的 `offset`。`isSessionWorkerPreview` 要求 `done === (nextOffset === totalChars)`，且未结束时必须推进。

## 验收

五条合成反例加上 list 错页对照解析为 `ok: false`。既有合法 round-trip 与 worker CLI list 输出仍通过。compile／lint／完整 `npm test`。不要求原生 worker 发出矛盾响应。

## 后续限制

ARCH-08 预览成本、协议版本变更，以及所选会话被错误切换的产品结论仍范围外。
