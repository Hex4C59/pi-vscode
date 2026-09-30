# WI-048：默认保存失败范围批准

[English](2026-09-30-wi-048-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-048-approved-proposal.md](2026-09-30-wi-048-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 创建：2026-09-30
- 权威：历史批准范围，不是新的 Build 授权
- 归档原因：WI-048 实现与自动化证据完成；最终处置归[验收记录](2026-09-30-wi-048-macos-acceptance.zh.md) 与 [ACTIVE](../../ACTIVE.md)。

## 批准与追溯

ARCH-02 补充在架构待办中进入停车场。维护者 2026-09-30 要求完成 ACTIVE 剩余任务，即本 Build 授权。纯技术；无 PRD 切片、ADR 或 gate。原 ARCH-02 顺序封装仍在范围外。

## 目标与范围

未提交的默认模型保存不得把请求中的模型应用到实时会话。保存结果区分已提交、失败、未执行与过期；后续实时会话动作只使用已提交结果。

## 方案

`ProviderConfig.setDefaultModel` 返回可判别保存结果。`configureProvider` 仅在 `kind` 为 `committed` 时，用已保存身份调用 `syncSessionModelsAfterProviderConfig`。

## 验收

注入 settings flush 失败：默认投影保留旧模型并报告保存错误；实时 `applyConfiguredModel` 收不到新模型。compile／lint／完整 `npm test`。

## 后续限制

原 ARCH-02 顺序封装、ARCH-07、ADR 0005、gate 与 ADR 仍在范围外。
