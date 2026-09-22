# 讨论（非权威）

[English](README.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[README.md](README.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-22

- 类型：参考
- 状态：Accepted
- 权威：**仅作上下文**——不覆盖 `AGENTS.md`、`docs/product-requirements.md`（`Accepted` 后）、架构、`ACTIVE.md` 或 ADR

## 用途

`docs/discussions/` 存放**探索性笔记**，尚不构成决策或需求：

- spike 前的 brainstorm 与方案对比。
- 有实质内容的会话或会议摘要，可附来源链接。
- 不宜只留在聊天里的维护者问答。

## 不应放在此处的内容

| 应放在… | 而非 discussions，当… |
|---------|----------------------|
| [`ACTIVE.md`](../../ACTIVE.md) **停车场** | 只是一句未来 WI 想法 |
| [`ACTIVE.md`](../../ACTIVE.md) **Last session** | 是当前 WI 的交接 |
| [`decisions/`](../decisions/) | 维护者**已确认**符合 ADR 条件的选择（所需验证完成后才标 Accepted） |
| [`product-requirements.md`](../product-requirements.md) | 定义可验收的**用户可见**范围 |
| [`archive/`](../archive/) | 内容**已过时**但需保留 |

## 建议文件名

- `YYYY-MM-DD-topic-slug.md` — 带日期的线程。
- 一主题一文件；出现 ADR 或 WI 时加上链接。

## Agent 规则

讨论仅作背景。若与 `ACTIVE.md` 或 Accepted 文档冲突，**以权威文件为准**，并在[协作指南 §7](../guides/agent-collaboration.zh.md#7-agent-义务) 的授权内对齐或归档；未解决的决策冲突须明确保留。

讨论形成有意义的阶段性结论时，Agent 主动创建或更新已有主题，不要求维护者选择目录。包含背景、候选方案、依据、当前倾向和未决项，区分建议、已确认决定和已验证结果。普通问答不建文件。从相关 WI 摘要链接主题；形成 ADR 后链接它，不重复维护决定。讨论解决后，须确认已不活跃且有用内容已有现行归属，再考虑移动。
