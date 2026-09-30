# WI-059：已批准的本机插件清单产品边界

[English](2026-10-01-wi-059-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-059-approved-proposal.md](2026-10-01-wi-059-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01
- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 权威：历史已批准范围，不是后续切片的新 Build 授权
- 归档原因：WI-059 仅文档边界已记录；后续清单切片仍停在 ACTIVE。

## 批准与追溯

维护者 `/goal` 完成 ACTIVE.md 全部任务，授权本仅文档 Prepare 切片。用户可见：REQ-010。Decision：[Draft ADR 0010](../decisions/0010-local-plugin-inventory.zh.md)。无 gate。

## 目标与范围

记录清单 vs 当场加载、配置范围存储、启用含义、与受控／受信的关系、PRD 文本与 ADR 类。无代码、UI、市场或运行时加载。

## 方案

按[讨论](../discussions/2026-10-01-local-plugin-inventory.zh.md)已记录倾向与现有信任规则，关闭停放的未决问题。宿主文件在 `globalStorageUri`。启用是下一次空闲受信资格。原生加载确认保留。只记路径，不拷贝。

## 验收

两种 PRD 语言含 REQ-010 与 WI-059 追溯行。Draft ADR 0010 存在。CONTEXT 区分清单与当场加载。架构标明计划中的宿主所有权。`npm run docs:verify` 与 `npm run docs:health`。应用行为编译不在范围。

## 后续限制

切片 2–7、下载／市场、跳过审批，以及 ADR 0010 接受，仍属后续工作。
