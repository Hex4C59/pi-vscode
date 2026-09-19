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

## Agent 规则

若归档与当前权威文档冲突，忽略归档并引用现行文件。
