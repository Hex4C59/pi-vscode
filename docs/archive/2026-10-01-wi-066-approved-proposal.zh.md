# WI-066：已批准的作曲区模型芯片展示

[English](2026-10-01-wi-066-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-066-approved-proposal.md](2026-10-01-wi-066-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01
- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 权威：历史已批准范围，不是后续切片的新 Build 授权
- 归档原因：WI-066 作曲区模型芯片工艺已实现并测试；其余 ACTIVE 任务独立。

## 批准与追溯

维护者 `/goal` 完成 ACTIVE.md 全部任务，在 WI-065 之后授权本 Build。用户可见：REQ-002 作曲区模型控件展示。Decision：none。无 gate。

## 目标与范围

关闭芯片、打开选择器标题与列表行不显示供应商，并格式化模型 id（`gpt`→`GPT`，其余字母段 Title Case）。英文思考强度首字母大写（`low`→`Low`，`xhigh`→`Xhigh`）。目标读法 `GPT-6-Sol · Low`。去掉打开面板的 Model／Thinking level／Open provider settings。居中的名称＋强度是同一命中区，点击打开模型列表。滑条只改思考强度。WI-042 radio 身份不变。不关闭 REQ-002 同名缺口。

## 方案

在 Webview 展示层从 `provider / modelId`（或目录 `modelId`）格式化。不改宿主 `chatModel` 身份字符串。专用缩写仅 `gpt`。设置里默认模型共用 `ModelPickerView`，跟同一格式。下一轮待应用文案用同一套格式化。

## 验收

`hellocode / gpt-6-sol` 加 `low` 显示 `GPT-6-Sol · Low`。列表行无供应商。compile／lint／`npm test`。不要求原生 F5。

## 后续限制

模型选择器与执行配置互斥、REQ-001 拒绝资源提示、REQ-002 同名身份、REQ-009 余项、目录整理。
