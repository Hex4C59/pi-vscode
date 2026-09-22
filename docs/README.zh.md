# pi VS Code 文档索引

[English](README.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[README.md](README.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-22

- 类型：参考
- 状态：Accepted
- 权威：本产品仓库文档导航

## 入口与任务路由

本索引是一棵路由树，不是从头读到底的清单。仓库规则与基础必读以 [`../AGENTS.zh.md`](../AGENTS.zh.md) 及其内核为准。

- **当前会话：** 完整阅读 [`../ACTIVE.md`](../ACTIVE.md) 中唯一的当前 WI、批准状态、仍有效限制与最近交接，再跟随与任务有关的链接。
- **用户可见行为：** 阅读 [`product-requirements.zh.md`](product-requirements.zh.md) 与 [主架构](architecture/vscode-extension-architecture.zh.md)。
- **架构或契约：** 阅读[主架构](architecture/vscode-extension-architecture.zh.md)、[Webview 消息契约](reference/webview-messages.zh.md)及 [`guides/architecture-governance.zh.md`](guides/architecture-governance.zh.md)。
- **实现 playbook：** 按 [`../AGENTS.zh.md`](../AGENTS.zh.md) 或 [`guides/agent/`](guides/agent/) 的匹配路由选择，不默认展开无关指南。
- **WI 收尾与文档维护：** 阅读 [`guides/agent-collaboration.zh.md`](guides/agent-collaboration.zh.md)、[`guides/documentation-health.zh.md`](guides/documentation-health.zh.md) 与 [归档规则](archive/README.zh.md)。
- **仅历史证据：** 当前问题需要既往理由或观察时，才读取 [讨论索引](discussions/README.zh.md)与[归档索引](archive/README.zh.md)；它们不是实现权威。

当前任务的范围、约束、契约及必要证据已明确时停止展开链接。证据缺失或冲突时应报告，不能把“链接可达”当作批准或提高权威。

## Agent：仅提交时

创建、修改或审查 commit message 时阅读 [`git-commit-convention.zh.md`](git-commit-convention.zh.md)（[English](git-commit-convention.md)）；日常编码不必读。

## 文档检查

实质性文档变更后运行 `npm run docs:verify`。手动生命周期检查和基于证据的 Agent 巡检见[文档健康指南](guides/documentation-health.zh.md)，运行 `npm run docs:health`。尚未安装每周调度或自动清理。
