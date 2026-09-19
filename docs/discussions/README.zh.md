# 讨论（非权威）

[English](README.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[README.md](README.md)
- 原文版本：Uncommitted baseline
- 最近同步：<!-- date -->

- 类型：参考
- 状态：Accepted
- 创建：<!-- date -->
- 权威：**仅作上下文**——不覆盖 `AGENTS.md`、`docs/product-requirements.md`（`Accepted` 后）、架构、`ACTIVE.md` 或 ADR

## 用途

`docs/discussions/` 存放**探索性笔记**，尚不构成决策或需求：

- spike 前的 brainstorm 与方案对比。
- 会话导出或会议记录（粘贴或链接）。
- 不宜只留在聊天里的维护者问答。

## 不应放在此处的内容

| 应放在… | 而非 discussions，当… |
|---------|----------------------|
| [`ACTIVE.md`](../../ACTIVE.md) **停车场** | 只是一句未来 WI 想法 |
| [`ACTIVE.md`](../../ACTIVE.md) **Last session** | 是当前 WI 的交接 |
| [`decisions/`](../decisions/) | 维护者**已确认**不可逆选择（写 Accepted ADR） |
| [`product-requirements.md`](../product-requirements.md) | 定义可验收的**用户可见**范围 |
| [`archive/`](../archive/) | 内容**已过时**但需保留 |

## 建议文件名

- `YYYY-MM-DD-topic-slug.md` — 带日期的线程。
- 一主题一文件；出现 ADR 或 WI 时加上链接。

## Agent 规则

讨论仅作背景。若与 `ACTIVE.md` 或 Accepted 文档冲突，**以权威文件为准**，并提议对齐或归档该讨论。
