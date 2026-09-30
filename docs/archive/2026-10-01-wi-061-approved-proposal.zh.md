# WI-061：已批准的设置「插件」空列表与从磁盘添加

[English](2026-10-01-wi-061-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-061-approved-proposal.md](2026-10-01-wi-061-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01
- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 权威：历史已批准范围，不是后续切片的新 Build 授权
- 归档原因：WI-061 设置「插件」空列表与从磁盘添加已实现并测试；移除／启用仍停放。

## 批准与追溯

维护者 `/goal` 完成 ACTIVE.md 全部任务，在 WI-060 之后授权本 Build。用户可见：REQ-010 切片 3。Decision：Draft ADR 0010。无 gate。

## 目标与范围

设置增加 **插件** 分类。空清单可见。**从磁盘添加** 打开原生文件选择器，把通过身份检查的绝对入口路径写入 `plugin-inventory-v1.json`（默认 `enabled: true`）。Webview 投影只有 `{displayName}`（basename，≤512 UTF-8）。空／重复／无效路径有可见状态。添加不启动、停止或改写活 runtime，不打开加载确认。

## 方案

新 `pluginInventoryState` 与无载荷 `addPluginInventoryEntry`。设置面板白名单收入该意图。复用 pick 加 realpath／后缀／常规文件／非符号链接／非敏感路径检查；不调用 `confirm`。损坏或过大清单保持不改写并报 `existing-unusable`。宿主拥有路径；Webview 只渲染投影。

## 验收

空列表。成功添加后列表出现 basename 且文件多一条。取消不写。重复／无效路径不写并报错。添加后 runtime 与执行配置不变。compile／lint／完整 `npm test`。预览核对 Plugins 分类。不要求原生 F5。

## 后续限制

移除、启用 UI、runtime `-e`、消息编辑区收拢、ADR 0010 接受。
