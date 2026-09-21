# 归档（非权威历史）

[English](README.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[README.md](README.md)
- 原文版本：Uncommitted baseline
- 最近同步：<!-- date -->

- 类型：参考
- 状态：Accepted
- 创建：<!-- date -->
- 权威：**仅历史上下文**——已替代的 PRD、WI、spike、讨论等

## 用途

内容**不再活跃**但需保留审计轨迹时移入此处：

- 已被替代的 `product-requirements.md` 版本（在当前 PRD 中链接）。
- 过长、不宜留在 `ACTIVE.md` 的已关闭 WI 说明。
- 已放弃但有教训的 spike。

**不要**按归档文件实现。Agent 将 archive 视为只读背景。

## 移入前

1. 在归档文件顶部或 ADR 中写明**为何**替代（一句）。
2. 确认**当前**真相在 PRD（`Accepted`）、架构、gate、ADR 或 `ACTIVE.md`。
3. 建议命名 `docs/archive/YYYY-MM-DD-original-name.md`（扁平或按年分子目录）。

## 已关闭 WI 索引

| 记录 | 内容 |
|------|------|
| [截至 WI-007 的已关闭工作项历史](2026-09-21-closed-wi-history.zh.md) | WI-001/002/003/005/006/007 的范围、验收证据与保留限制 |

## Agent 规则

若归档与当前权威文档冲突，忽略归档并引用现行文件。

WI 收尾或确认文档替代时，Agent 按[协作指南 §7](../guides/agent-collaboration.zh.md#7-agent-义务) 执行受影响材料的归档，不另问是否保存或选择目录。这不授权批量历史清理。记录归档原因、历史状态和替代链接（无替代文档时说明原因）。移动前将仍有效的要求和未决问题保存在活动文档，原入口保留摘要及链接。已有译文成对移动，修复入站链接、相对链接和索引，再运行 `npm run docs:verify`、`npm run docs:health`。ADR 留在 `docs/decisions/`，维护状态与替代链接。年代或长度本身不能作为归档依据。
