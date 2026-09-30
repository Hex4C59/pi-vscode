# WI-046：macOS 评估与验收

[English](2026-09-30-wi-046-macos-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-046-macos-acceptance.md](2026-09-30-wi-046-macos-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 处置：2026-09-30 由代理依据本会话完成 ACTIVE 剩余任务、写收尾并提交的要求接受并关闭
- 权威：本诊断探针切片的历史证据；不接受整份 PRD、gate、生产所有权或扩展宿主崩溃
- 范围：[批准提案](2026-09-30-wi-046-approved-proposal.zh.md)，RUNTIME-03／RUNTIME-04／RUNTIME-05
- 验收身份：代理依据维护者完成 ACTIVE 剩余任务的要求；不是维护者亲自跑过这些检查

## 批准行为与实现

`runPiRuntimeProbe` 拥有 child／pipe 错误、单次结算，要求 boolean `success === true`，仅在观察到进程退出后报告有界关闭成功。spawn ENOENT 与拒绝 kill 且无退出返回 `ok: false`。

## 自动化验证

本次关闭在当前工作树重跑 compile、lint 与完整测试。

| 检查 | 实际结果 | 范围 |
|---|---|---|
| `npm run compile`／`npm run lint` | 通过 | 生产包与静态检查 |
| `npm test` | 1006 通过，0 失败／跳过 | 五项新探针用例：ENOENT、stdout EPIPE、`success: "false"`、拒绝 kill、boolean 成功且退出 |

## 原生证据

不要求。本次不重跑真实 pi CLI 的 `npm run spike:runtime`。

## 失败、清理与限制

- 仅诊断 helper；不是生产 `runtime-owner` 恢复。stderr 累计预算未改。无 gate 或 ADR。不推送。

## 最终处置

代理依据本会话完成 ACTIVE 剩余任务、写收尾并提交的要求，接受并关闭 WI-046。只接受诊断探针结算与成功证据。
