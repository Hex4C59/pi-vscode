# WI-074: DOC-NAV-02 approved proposal

[English](2026-10-01-wi-074-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-074-approved-proposal.md](2026-10-01-wi-074-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01

- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 权威：历史切片记录；不构成新的实现或产品授权

## 批准与归档原因

独立文档 WI 关闭后归档；Prepare 核对范围／风险后 Build。2026-10-01 本轮提示明确批准 WI-072 后串行晋升 DOC-NAV-01／02、DOC-ORG-03，WIP=1，不沿用旧全目标授权。本记录只适用 DOC-NAV-02。

## 范围与方法

只改 discussions/README 中英索引，按产品／UI、架构、技术调研与审计证据归组，加跨主题入口，不新建目录或隐式归档，保留背景权限与未决问题。

纯技术文档维护，不改用户可见行为、不新增 PRD 行；Gate／Decision 均 none。保留历史事实、批准／ADR 状态、六大目录与中英配对。不删除／移动历史，不实施 PI-GAP。修改导航前核对实际目录与全部受影响链接，缺失独立证据须明确。

## 验收与提交边界

26 份现有英文讨论及对应中文均按用途索引，增加交叉链接、当前权威与归档入口；不改讨论正文、状态、未决问题、文件或目录。 跑 docs:verify、关闭 docs:health；审完整 cached 内容并跑 commit:check。文档交付先提交，ACTIVE 关闭／晋升另提交。无需无关代码构建或 F5。
