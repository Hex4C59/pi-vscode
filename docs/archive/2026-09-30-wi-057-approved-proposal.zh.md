# WI-057：已保存默认应用顺序封装范围批准

[English](2026-09-30-wi-057-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-057-approved-proposal.md](2026-09-30-wi-057-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 创建：2026-09-30
- 权威：历史批准范围，不是新的 Build 授权
- 归档原因：WI-057 实现与自动化证据完成；最终处置归[验收记录](2026-09-30-wi-057-macos-acceptance.zh.md) 与 [ACTIVE](../../ACTIVE.md)。

## 批准与追溯

ARCH-02 顺序封装是 2026-09-29 已确认设计。维护者 `/goal` 完成剩余任务，在 WI-036 之后授权本 Build。纯技术；无 PRD 切片、ADR 或 gate。

## 目标与范围

把「刷新 RPC 目录 → 应用已保存默认 → 仍无模型时请求一次重启」收到 `src/extension/models/` 下的模块。用户可见规则冻结。ProviderConfig 与 ModelSettings 仍是分开的协作者。

## 方案

`SavedDefaultApply` 拥有 `loadAfterReady`（不重启）与 `syncAfterWrite`（仍为空则经协调者回调重启一次）。协调者保留 `reconcileRuntime`。`setDefaultThinkingLevel` 仍只持久化。

## 验收

模块测试覆盖就绪加载不重启、写入后无模型则重启、已有模型跳过、未就绪／过期跳过。协调者测试仍证明已提交 `setDefaultModel`／refresh 转发与 WI-048 失败保存。compile／lint／完整 `npm test`。不要求原生 F5。

## 后续限制

不合并目录解析、不改 PreviewBridge、不抽流式／Stop、不改 gate／ADR、不提交 Git。
