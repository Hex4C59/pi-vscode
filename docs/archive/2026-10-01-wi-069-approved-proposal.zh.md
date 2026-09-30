# WI-069：已批准的规范活跃模型身份

[English](2026-10-01-wi-069-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-069-approved-proposal.md](2026-10-01-wi-069-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01
- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 权威：历史已批准范围，不是后续切片的新 Build 授权
- 归档原因：WI-069 规范活跃模型投影已实现并测试；其余 ACTIVE 任务独立。

## 批准与追溯

维护者 `/goal` 完成 ACTIVE.md 全部任务，在 WI-068 之后授权本 Build。用户可见：既有 REQ-002 在显示名冲突时仍标出唯一已应用模型。Decision：none。无 gate。

## 目标与范围

把活跃模型投影为 `provider / modelId`，不用 `name`。保留目录标签。不把供应商画回芯片。

## 方案

改 start 与 `get_state` 使用的 `formatModelLabel`。目录解析不变。

## 验收

两个同名模型投影为不同身份。compile／lint／`npm test`。不要求原生 F5。

## 后续限制

REQ-009 余项、目录整理。
