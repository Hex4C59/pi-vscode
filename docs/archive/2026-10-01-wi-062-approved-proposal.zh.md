# WI-062：已批准的从插件清单移除

[English](2026-10-01-wi-062-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-062-approved-proposal.md](2026-10-01-wi-062-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01
- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 权威：历史已批准范围，不是后续切片的新 Build 授权
- 归档原因：WI-062 从清单移除已实现并测试；启用仍停放。

## 批准与追溯

维护者 `/goal` 完成 ACTIVE.md 全部任务，在 WI-061 之后授权本 Build。用户可见：REQ-010 切片 4。Decision：Draft ADR 0010。无 gate。

## 目标与范围

设置 **插件** 每项可移除。宿主从 `plugin-inventory-v1.json` 删掉该条目。可见文案披露磁盘文件仍在。不删除扩展文件、不卸载 pi 全局包、不改写活 runtime、不打开加载确认。

## 方案

投影增加由绝对路径派生的不透明 `id`，不是路径本身。`removePluginInventoryEntry` 携带 `{id}`。宿主映射后 `replacePluginInventory`。未知 id 报错且不改写。损坏或过大仍 `existing-unusable`。Webview 不接收路径。

## 验收

移除多余项后另一行仍在且文件变短。磁盘文件仍在。未知 id 不改写。busy 与 existing-unusable 禁用移除。compile／lint／完整 `npm test`。预览核对移除与磁盘仍在的披露。不要求原生 F5。

## 后续限制

启用 UI、runtime `-e`、消息编辑区收拢、ADR 0010 接受。
