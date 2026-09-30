# WI-047：endpoint 写入输出预算批准范围

[English](2026-09-30-wi-047-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-047-approved-proposal.md](2026-09-30-wi-047-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 创建：2026-09-30
- 权威：历史批准范围，不是新的 Build 授权
- 归档原因：WI-047 实现与自动化证据完成；最终处置归[验收记录](2026-09-30-wi-047-macos-acceptance.zh.md) 与 [ACTIVE](../../ACTIVE.md)。

## 批准与追溯

ARCH-06 在架构待办中进入停车场。维护者 2026-09-30 要求完成 ACTIVE 剩余任务，即本 Build 授权。纯技术；无 PRD 切片、ADR 或 gate。ADR 0007 把输出大小预算留在 WI-038 范围外。

## 目标与范围

提交前按 1 MiB 读取预算验证序列化输出。超限保留原文件并报告错误。覆盖仍可读的紧凑 JSON 经 pretty-print 扩大。

## 方案

`changeUnderLock` 在创建临时文件前，若 UTF-8 输出超过 `MAX_MODELS_FILE_BYTES` 则拒绝 `too-large`。`ProviderConfig` 投影固定大小限制错误，不继续登录。

## 验收

超限替换文本不提交。比预算少 1 字节的紧凑文件 pretty-print 添加后原字节不变。compile／lint／完整 `npm test`。

## 后续限制

ADR 0005、ARCH-02 补充、gate 与 ADR 仍范围外。
