# WI-075: Guide placement evaluation

[English](2026-10-01-wi-075-guide-placement-evaluation.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-075-guide-placement-evaluation.md](2026-10-01-wi-075-guide-placement-evaluation.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01

- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 权威：历史切片记录；不构成新的实现或产品授权

## 结论与范围

**两个指南中英对保留在 docs 根目录原路径。** 迁到 guides/ 只能取得目录类别一致，未证明能改善本任务的导航或权威性。这是 DOC-ORG-03 允许的“不迁移”结论，不是新规则或架构决定。依 2026-10-01 切片授权记录；产品行为、指南内容与权威均不变。

## 证据与迁移成本

在已跟踪基线 `bd6ed12`，完整 UTF-8 tracked 文件扫描（含隐藏 tracked 文件）发现 git-commit-convention 出现在 13 个文件／25 次，bilingual-documentation 出现在 6 个文件／11 次。计数包含自链接、中文原文元数据与 ACTIVE，不是独立入站链接数。并集 15 文件：四份指南、ACTIVE 及十份其他引用文件。

- [AGENTS](../../AGENTS.md) 与[中文对](../../AGENTS.zh.md)已有提交任务直达约定的路由。
- [文档入口](../README.md)与[中文对](../README.zh.md)已有提交专属入口，不要求全量阅读。
- [贡献入口](../../CONTRIBUTING.md)与[中文对](../../CONTRIBUTING.zh.md)路由两个指南。
- [协作指南](../guides/agent-collaboration.md)与[中文对](../guides/agent-collaboration.zh.md)拥有暂存时 Git 约定路由。
- [PR 模板](../../.github/pull_request_template.md)也链接 Git 约定，不能因隐藏目录而漏查。
- [双语配置](../../scripts/docs/docs-i18n-config.mjs)明确要求两个现有英文路径。

迁移需移动四文件，修复十份入站所有者和 ACTIVE，保持语言切换／原文元数据，重定位提交约定的架构链接，并改两条 required-pair 配置。机械 commit checker 不解析指南位置，迁移不增加执行保障。现路径短且可发现；DOC-NAV-01／02 已修复实际检索缺口，无须这些迁移成本。

## 替代方案与边界

成对迁移可让 Guide 类别与其他指南同目录，但只是为一致性付路径迁移成本。别名／重复规则会增加维护并削弱单一来源，均不值得。本路径仅在实际路由失败有证据或另行批准导航设计时再评估。本次只写 WI 评估记录，未改指南、WI 记录外索引、脚本或规则正文。

## 验证

人工检查两个指南、全部十份 tracked 外部引用所有者、ACTIVE 与双语配置。可复现基线查询：`git grep -n -e git-commit-convention -e bilingual-documentation bd6ed12 --`；快照只含评估前文件，不受后续记录影响。docs:verify 验证链接／配对，关闭 docs:health 检查结构／生命周期，不代替收益判断。保留 Draft ADR 0010 两条警告，不以改 Accepted 消除。
