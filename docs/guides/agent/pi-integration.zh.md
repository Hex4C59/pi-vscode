# 上游 Agent SDK / RPC 集成

[English](pi-integration.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[pi-integration.md](pi-integration.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-19

- 类型：指南
- 状态：Accepted
- 创建：2026-09-19
- 权威：通过 SDK/RPC 连接上游 coding-agent 运行时的模式

WI 涉及运行时集成时，复制到 `docs/guides/agent/pi-integration.md`。

## 原则

- **Adapter 边界** — SDK/RPC 类型映射到产品领域事件；UI 读领域事件，不绑裸 SDK 流。
- **会话归属** — 除非架构明确允许，勿为产品会话功能读写上游会话文件。
- **不重复 agent 循环** — 勿在应用主机内重写上游 agent 循环；通过文档化 API 编排。

## Spike

- WI-001 spike 应证明：进程启停、一次 RPC 往返、干净退出（无僵尸子进程）。
- 关闭 `gate-build-baseline` 时在架构或 Accepted ADR 记录最低 SDK/包版本。

## 文档

- 合并 channel 列表或 DTO 前，reference 页从 `Planned` → `Outline` → `Living`。
- 新增 IPC 或持久化前，扫描 `docs/guides/architecture-governance.md` 的契约与所有权行。
