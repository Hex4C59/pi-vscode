# WI-046：诊断探针结算批准范围

[English](2026-09-30-wi-046-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-046-approved-proposal.md](2026-09-30-wi-046-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 创建：2026-09-30
- 权威：历史批准范围，不是新的 Build 授权
- 归档原因：WI-046 实现与自动化证据完成；最终处置归[验收记录](2026-09-30-wi-046-macos-acceptance.zh.md) 与 [ACTIVE](../../ACTIVE.md)。

## 批准与追溯

RUNTIME-03／04／05 在运行时 helper 审查后进入停车场。维护者 2026-09-30 要求完成 ACTIVE 剩余任务，即本诊断批次授权。纯技术；无 PRD 切片、ADR 或 gate。

## 目标与范围

诊断 helper 拥有 child／pipe 异步错误并单次结算；ENOENT 返回失败。区分 RPC 成功、发出终止与观察退出；kill 被拒且无退出证据时不报告有界退出成功。`success` 必须是 boolean。不替代生产所有权／恢复，不把隔离进程崩溃说成扩展宿主崩溃。

## 方案

`pi-rpc-probe.ts` 为测试注入 spawn 与停止超时。监听 child 与 stdio 错误，要求 `success === true`，仅在观察到 `exit`／`close` 或非空退出／信号码后报告 `ok: true`。

## 验收

合成 ENOENT 返回 `ok: false`。拒绝 kill 且无退出时不报告成功。字符串 `"false"` 的 success 不是成功证据。compile／lint／完整 `npm test`。

## 后续限制

stderr 内存预算、生产所有权／恢复、ARCH-06、gate 与 ADR 仍范围外。
