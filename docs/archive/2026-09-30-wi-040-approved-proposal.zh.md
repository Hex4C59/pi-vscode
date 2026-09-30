# WI-040：八张审批卡准入批准范围

[English](2026-09-30-wi-040-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-040-approved-proposal.md](2026-09-30-wi-040-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 创建：2026-09-30
- 权威：历史批准范围，不是新的 Build 授权
- 归档原因：WI-040 实现与自动化证据完成；最终处置归[验收记录](2026-09-30-wi-040-macos-acceptance.zh.md) 与 [ACTIVE](../../ACTIVE.md)。

## 批准与追溯

CORE-01 在核心边界审查后进入停车场。维护者 2026-09-30 要求完成 ACTIVE 剩余任务，即本 Build 授权。REQ-006；无新 ADR 或 gate。

## 目标与范围

同时最多八张在途审批卡。并发预检查不得准入第九张。取消与错误释放槽位。这是本地准入不变量，不是审批绕过，也不宣称已修非法投影、断连或内存耗尽。

## 方案

`ToolApprovals.evaluate` 在异步安全／范围检查之后、写入卡片的位点重检 `pending.size >= 8`。重复 request ID 仍拒绝且不插入。自动允许与既有 session grant 不占用卡片槽。

## 验收

九个并发 custom-tool 预检查停在初始安全 hook 时，只放出八张卡并拒绝一张。取消清空队列后后续请求可再被提供。compile／lint／完整 `npm test`。不要求原生九路审批 UI。

## 后续限制

ARCH-01 状态表、CORE-02 与 Webview 协议变更仍范围外。
