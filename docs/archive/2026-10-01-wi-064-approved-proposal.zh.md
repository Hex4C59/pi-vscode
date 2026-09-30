# WI-064：已批准的空闲受信清单应用

[English](2026-10-01-wi-064-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-064-approved-proposal.md](2026-10-01-wi-064-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01
- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 权威：历史已批准范围，不是后续切片的新 Build 授权
- 归档原因：WI-064 空闲受信应用已实现并测试；消息编辑区收拢仍停放。

## 批准与追溯

维护者 `/goal` 完成 ACTIVE.md 全部任务，在 WI-063 之后授权本 Build。用户可见：REQ-010 切片 6。Decision：Draft ADR 0010。无 gate。

## 目标与范围

空闲受信启动或切换执行配置时，经公开额外 `-e` 加载当时已启用的清单项。受控从不加载清单。原生覆盖确认保留。若需要多于一个额外 `-e`，可见失败。失败恢复规则不变。不跳过审批、不自动发现。

## 方案

`trustedInventoryApply` 读取宿主文件。零启用项保留消息编辑区选择器。一项已启用则跳过选择器，仍确认后用该规范路径启动。多余已启用项设 `too-many-enabled` 并保持受控。损坏存储设 `inventory-unusable`，不把清单当成空。

## 验收

受控启动不带清单 `-e`。一项已启用经确认且无选择器后加载。多余已启用项可见失败且不启动 Trusted。compile／lint／`npm test`。不要求原生 F5。

## 后续限制

消息编辑区收拢、下载／市场、ADR 0010 Accepted。
