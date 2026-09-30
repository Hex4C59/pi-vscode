# WI-060：已批准的宿主插件清单存储

[English](2026-10-01-wi-060-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-060-approved-proposal.md](2026-10-01-wi-060-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01
- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 权威：历史已批准范围，不是后续切片的新 Build 授权
- 归档原因：WI-060 宿主存储已实现并测试；设置 UI 仍停放。

## 批准与追溯

维护者 `/goal` 完成 ACTIVE.md 全部任务，在 WI-059 之后授权本 Build。用户可见：尚无（REQ-010 持久化）。Decision：Draft ADR 0010。无 gate。

## 目标与范围

宿主文件 `plugin-inventory-v1.json` 位于 `globalStorageUri`：绝对路径身份加启用标志。缺失、损坏和过大的文件保持不改写。文件不含密钥。无运行时加载、设置 UI、Webview 消息。

## 方案

`src/extension/extension-loading/plugin-inventory.ts` 负责 load／replace。在边界校验条目。临时文件加 rename 替换。复用受信入口后缀与敏感路径规则。

## 验收

缺失加载为空且不创建文件。往返只存 schemaVersion／entries／path／enabled。重复、相对和敏感路径拒绝且不改写。损坏和过大文件拒绝 replace。compile／lint／完整 `npm test`。不要求原生 F5。

## 后续限制

设置「插件」、移除／启用 UI、运行时应用、消息编辑区收拢、ADR 0010 接受。
