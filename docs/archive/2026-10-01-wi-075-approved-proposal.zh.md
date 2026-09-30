# WI-075: DOC-ORG-03 approved proposal

[English](2026-10-01-wi-075-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-075-approved-proposal.md](2026-10-01-wi-075-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01

- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 权威：历史切片记录；不构成新的实现或产品授权

## 批准与归档原因

独立文档 WI 关闭后归档；Prepare 核对范围／风险后 Build。2026-10-01 本轮提示明确批准 WI-072 后串行晋升 DOC-NAV-01／02、DOC-ORG-03，WIP=1，不沿用旧全目标授权。本记录只适用 DOC-ORG-03。

## 范围与方法

先评估 Git 约定／双语指南中英对是否值得从 docs 根迁到 guides，核对实际引用、相对链接与 required-pair 配置；收益不足明确允许保留。

纯技术文档维护，不改用户可见行为、不新增 PRD 行；Gate／Decision 均 none。保留历史事实、批准／ADR 状态、六大目录与中英配对。不删除／移动历史，不实施 PI-GAP。修改导航前核对实际目录与全部受影响链接，缺失独立证据须明确。

## 验收与提交边界

两个指南中英对保留原路径。[评估](2026-10-01-wi-075-guide-placement-evaluation.zh.md)记录可复现 bd6ed12 引用快照、十份外部引用所有者、配置成本与替代方案；现有路由已可发现指南，仅目录一致性不值得迁移。未改指南／配置文件。 跑 docs:verify、关闭 docs:health；审完整 cached 内容并跑 commit:check。文档交付先提交，ACTIVE 关闭／晋升另提交。无需无关代码构建或 F5。
