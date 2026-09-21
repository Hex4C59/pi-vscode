# pi VS Code 文档索引

[English](README.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[README.md](README.md)
- 原文版本：Uncommitted baseline
- 最近同步：<!-- date -->

- 类型：参考
- 状态：Accepted
- 创建：<!-- date -->
- 权威：本产品仓库文档导航

## 建议阅读顺序

1. [`../README.md`](../README.md)
2. [`../AGENTS.md`](../AGENTS.md)
3. 产品需求：[`product-requirements.md`](product-requirements.md)（首个用户可见 WI 前保持 `Draft`；`Accepted` 后为范围权威）
4. 架构：`architecture/` 主文档；评审清单：[`guides/architecture-governance.zh.md`](guides/architecture-governance.zh.md)
5. 当前工作：[`../ACTIVE.md`](../ACTIVE.md)
6. 仅上下文：[`discussions/`](discussions/)、[`archive/`](archive/)

## Agent：仅提交时

创建、修改或审查 commit message 时阅读 [`git-commit-convention.zh.md`](git-commit-convention.zh.md)（[English](git-commit-convention.md)）；日常编码不必读。

## 文档检查

实质性文档变更后运行 `npm run docs:verify`。手动生命周期检查和基于证据的 Agent 巡检见[文档健康指南](guides/documentation-health.zh.md)，运行 `npm run docs:health`。尚未安装每周调度或自动清理。
