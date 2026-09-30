# WI-070：已批准的 macOS REQ-009 五类证据

[English](2026-10-01-wi-070-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-070-approved-proposal.md](2026-10-01-wi-070-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01
- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 权威：历史批准范围，不是后续切片的新 Build 授权
- 归档原因：WI-070 已记录当前 macOS 安装包五类证据；其余 ACTIVE 任务独立。

## 批准与追溯

维护者 `/goal` 完成 ACTIVE.md 全部任务，在 WI-069 之后授权本 Build。用户可见：既有 REQ-009 要求 macOS 五类成功／失败、一次编程回合与恢复，含一个真实扩展。Decision：none。无 gate。

## 目标与范围

为 REQ-009 五类加上发送／流式／完成回合与重启／恢复列出**当前** macOS 证据表。历史 Windows 通过仍是 Windows。jsdom／Vite 不是平台证据。不改产品行为，不把 Draft ADR 0010 改成 Accepted。

## 方案

把当前 HEAD 打成隔离 VSIX。在安装配置下对会捕获 `/chat/completions` 正文的回环供应商跑。允许与拒绝项目资源分配置。原生信任确认后加载已核对的 `pi-system-prompt-manager` 0.1.1，commit `9c8f546b875f929ad5d573fe30e7a7fd6e3ae924`。空 `models.json` 作为模型失败夹具。

## 验收

每格须有当前 macOS 安装包记录路径与主机，否则 WI 不得关闭。

## 后续限制

Webview 与 Runtime 目录整理。docs 目录检索仍停放，除非另行晋升。
