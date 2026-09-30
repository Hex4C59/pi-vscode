# WI-065：已批准的消息编辑区执行配置收拢

[English](2026-10-01-wi-065-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-065-approved-proposal.md](2026-10-01-wi-065-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01
- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 权威：历史已批准范围，不是后续切片的新 Build 授权
- 归档原因：WI-065 消息编辑区收拢已实现并测试；其余 ACTIVE 任务独立。

## 批准与追溯

维护者 `/goal` 完成 ACTIVE.md 全部任务，在 WI-064 之后授权本 Build。用户可见：REQ-010 切片 7。Decision：Draft ADR 0010。无 gate。

## 目标与范围

消息编辑区权限只显示执行配置状态和恢复。添加／移除／启用留在设置「插件」。切到 Trusted 不再打开文件选择器；零启用项可见失败并指向设置。加载语义、覆盖警告与受控默认不变。

## 方案

`selectTrustedApply` 需要恰好一条已启用清单路径。空、损坏和多余启用集合用固定错误码失败，从不调用 `showOpenDialog`。作曲区文案说明添加在设置。

## 验收

一项已启用仍确认后加载。零启用项不打开选择器、不启动 Trusted。恢复控件仍在。compile／lint／`npm test`。不要求原生 F5。

## 后续限制

下载／市场、ADR 0010 Accepted。
