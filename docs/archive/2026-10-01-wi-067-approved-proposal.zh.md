# WI-067：已批准的作曲区选择器互斥

[English](2026-10-01-wi-067-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-067-approved-proposal.md](2026-10-01-wi-067-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01
- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 权威：历史已批准范围，不是后续切片的新 Build 授权
- 归档原因：WI-067 作曲区互斥已实现并测试；其余 ACTIVE 任务独立。

## 批准与追溯

维护者 `/goal` 完成 ACTIVE.md 全部任务，在 WI-066 之后授权本 Build。用户可见：既有 REQ-002 模型选择器与 REQ-006 执行配置。Decision：none。无 gate。

## 目标与范围

打开模型选择器时关闭执行配置；打开执行配置时关闭模型选择器。添加上下文菜单、历史与设置不在本切片。不改身份、Trusted 加载或审批。

## 方案

作曲区本地协调：`ModelPickerView` 可接收 open／onOpenChange；权限 `details` 保持原生，toggle 时关闭选择器。会话身份重置关闭两者。

## 验收

同一时刻最多一张卡片打开。compile／lint／`npm test`。不要求原生 F5。

## 后续限制

REQ-001 拒绝资源提示、REQ-002 同名身份、REQ-009 余项、目录整理。
