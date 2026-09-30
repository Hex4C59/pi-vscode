# WI-063：已批准的清单启用／关闭

[English](2026-10-01-wi-063-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-063-approved-proposal.md](2026-10-01-wi-063-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01
- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 权威：历史已批准范围，不是后续切片的新 Build 授权
- 归档原因：WI-063 启用／关闭已实现并测试；运行时应用仍停放。

## 批准与追溯

维护者 `/goal` 完成 ACTIVE.md 全部任务，在 WI-062 之后授权本 Build。用户可见：REQ-010 切片 5。Decision：Draft ADR 0010。无 gate。

## 目标与范围

设置 **插件** 可开关每项 `enabled`，写入 `plugin-inventory-v1.json`。可见文案披露启用表示下一次空闲受信应用，活 runtime 须空闲重建／切换后才变。不加载、不确认加载、不改写活 runtime。

## 方案

投影含 `enabled: boolean`。`setPluginInventoryEnabled` 携带 `{id, enabled}`。宿主按不透明 id 改写标志。未知 id 报错且不改写。损坏或过大仍 `existing-unusable`。Webview 不接收路径。

## 验收

开关后存储标志与列表变化。活 runtime 与执行配置不变。未知 id 不改写。busy 与 existing-unusable 禁用开关。compile／lint／完整 `npm test`。预览核对开关与披露。不要求原生 F5。

## 后续限制

runtime `-e`、消息编辑区收拢、ADR 0010 接受。
