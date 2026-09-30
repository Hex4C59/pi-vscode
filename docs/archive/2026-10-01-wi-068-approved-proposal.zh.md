# WI-068：已批准的拒绝项目资源提示

[English](2026-10-01-wi-068-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-068-approved-proposal.md](2026-10-01-wi-068-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01
- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 权威：历史已批准范围，不是后续切片的新 Build 授权
- 归档原因：WI-068 拒绝资源提示已实现并测试；其余 ACTIVE 任务独立。

## 批准与追溯

维护者 `/goal` 完成 ACTIVE.md 全部任务，在 WI-067 之后授权本 Build。用户可见：既有 REQ-001 拒绝资源后的可见提示。Decision：none。无 gate。

## 目标与范围

settled 且 `choice === "decline"` 时显示持续状态提示。不恢复 `WorkspaceSetup`、不增加改选控件、不改宿主同意协议。允许路径不新增提示。

## 方案

在 `ProjectResourceConsent` 的 Webview 展示层使用已有 `choice`。文案说明未加载项目本地 pi 资源，不把资源信任写成沙箱。

## 验收

拒绝并就绪后有 `#declined-resources`；允许与未选择前没有。compile／lint／`npm test`。不要求原生 F5。

## 后续限制

REQ-002 同名身份、REQ-009 余项、目录整理。
