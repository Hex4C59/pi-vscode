# 架构决策记录（ADR）

[English](README.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[README.md](README.md)
- 原文版本：Uncommitted baseline
- 最近同步：<!-- date -->

- 类型：参考
- 状态：Accepted
- 创建：<!-- date -->
- 权威：本仓库何时、如何撰写 ADR

## 何时写 ADR

在维护者确认以下决策后撰写 **Accepted** ADR：

- 关闭 [`architecture-gates.md`](../reference/architecture-gates.md) 中的架构 gate；
- 变更信任边界、持久化或集成策略；
- 在不可逆技术选项间做选择（框架、进程模型）。

勿在首次提案时或失败 spike 未理清前写 Accepted ADR。

## 格式

- 文件：`docs/decisions/0001-short-slug.md`（英文为权威；可选 `.zh.md`）
- 元数据含 `Status: Accepted` 并链接 gate ID。

## Accepted ADR

| ID | 标题 | Gate | 文件 |
|----|------|------|------|
| 0001 | 构建与扩展 baseline（WI-001） | `gate-extension-host-baseline`、`gate-sidebar-chat-shell`、`gate-runtime-host` | [0001-build-baseline.md](0001-build-baseline.md) |
