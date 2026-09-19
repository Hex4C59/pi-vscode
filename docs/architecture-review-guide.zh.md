# pi VS Code — 架构评审指南（可选）

[English](architecture-review-guide.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[architecture-review-guide.md](architecture-review-guide.md)
- 原文版本：Uncommitted baseline
- 最近同步：<!-- date -->

- 类型：指南
- 状态：**Draft**
- 创建：<!-- date -->
- 权威：**可选**本产品长篇评审叙述；清单 enforcement 仍在 [`guides/architecture-governance.md`](guides/architecture-governance.md)
- 相关：[`architecture/`](architecture/) 主架构、[`reference/architecture-gates.md`](reference/architecture-gates.md)

> **可选：** 在需要产品专属评审说明（入职评审人、发布审计）前可跳过。Agent 仍须用可移植的 **architecture-governance** 清单做 pass/gap/N/A 表。

## 何时维护本指南

- 每次发布重复讲同一套架构评审说明。
- 需要绑定**本仓库**模块、路径、gate ID 的样例。
- 需要 ADR 之外、给人读的叙述，且不重复清单条文。

## 与其他文档的关系

| 需求 | 使用 |
|------|------|
| Agent 必选清单（维度、证据） | [`guides/architecture-governance.md`](guides/architecture-governance.md) |
| 结构、所有者、信任边界 | [`architecture/`](architecture/) 主文档 |
| 不可逆选择 | [`decisions/`](decisions/) ADR + [`reference/architecture-gates.md`](reference/architecture-gates.md) |
| 当前 WI 与验收 | [`../ACTIVE.md`](../ACTIVE.md) |
| 用户可见范围 | [`product-requirements.md`](product-requirements.md)（`Accepted` 后） |

## 产品评审叙述（Draft）

<!-- 替换为你的叙述：子系统、常见失败模式、PR 评审顺序、runbook 链接。 -->

### 评审顺序（示例）

1. 确认 `ACTIVE.md` 中的 WI 与 gate。
2. 沿权威链走读（见 architecture-governance「权威链」）。
3. 按变更触及模块 / 契约 / 持久化等章节。
4. 在会话中用治理表格式记录 gap；关 gate 前更新文档。

### 本产品样例

<!-- 链接或嵌入短例：「好的 PR 描述」「坏的越界」、本地 gate ID。 -->

## 提升为 `Accepted`

维护者同意本指南为架构评审默认入门路径时，将 **Status** 改为 `Accepted`。运行 `npm run docs:verify`；若用双语，加入 i18n 配置。
