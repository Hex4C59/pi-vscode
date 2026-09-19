# Agent 与维护者协作指南

[English](agent-collaboration.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[agent-collaboration.md](agent-collaboration.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-19

- 类型：指南
- 状态：Accepted
- 创建：2026-09-19
- 适用：日常与 coding agent 协作及产品侧拍板
- 权威范围：协作流程、会话交接、工作项跟踪约定
- 相关：[文档索引](../README.md)、[`ACTIVE.md`](../../ACTIVE.md)、[`AGENTS.md`](../../AGENTS.md)

## 1. 目的

**pi VS Code** 由维护者（产品判断与验收）与 coding agent（技术顺序与实现）讨论推进。新窗口或上下文压缩后，聊天内容会丢失；**仓库里的文件**保存当前工作项与交接信息。

本指南不定义产品行为或系统架构；那些以 `docs/product-requirements.md`（若有）与 `docs/architecture/` 下主架构文档为准。

## 2. 分工

| 维护者 | Coding agent |
|--------|----------------|
| 说明目标、偏好、哪里不对 | 阅读需求、架构、`AGENTS.md`、`ACTIVE.md` |
| 在方案中选「可以 / 不要 / B 方案」 | 提议下一工作项、做法、风险、验收步骤 |
| 像用户一样验收 | 实现、跑检查、说明如何验证 |
| 把新想法放进停车场 | 同时只推进一个工作项（WIP=1） |

维护者不必精通产品技术栈。由 agent **提议下一步**；大范围或难逆转的代码变更前须维护者确认。

Agent 提案可以是**「暂不做了」**、**「本阶段现状足够」**或**「你的前提与仓库不符」**。见 [judgment.zh.md](agent/judgment.zh.md)。

## 3. 权威来源

| 问题 | 权威 |
|------|------|
| 安全与仓库规则 | `AGENTS.md` 内核与 `docs/guides/agent/` playbook |
| 用户可见范围与验收 | `Accepted` 的 `docs/product-requirements.md` |
| 结构、边界、所有权 | `docs/architecture/` 主文档 |
| **当前在做什么** | 根目录 [`ACTIVE.md`](../../ACTIVE.md) |
| 历史决策原因 | `docs/decisions/` 中 Accepted ADR |
| 架构 gate 状态 | [`docs/reference/architecture-gates.md`](../reference/architecture-gates.md) |

聊天与 `ACTIVE.md` 不一致时，对齐后应更新 `ACTIVE.md`。

## 4. 单一进行中项（WIP=1）

- `ACTIVE.md` 中同时只有 **一个** 活动工作项（`WI-xxx`）。
- 新想法写入 **停车场**，不直接插队实现。
- 架构 **gate** 未以 Accepted ADR 关闭前，不得当作已交付能力。

## 5. 会话节奏

1. **开场** — 维护者 **只 @ `ACTIVE.md`**（或说「继续 pi VS Code」）。Agent 阅读本指南后复述：当前 WI、Last session、今日焦点、验收步骤。
2. **提案** — 简短计划 + **决策类** `none` | `spike-only` | `adr-after-approval`（含 gate ID）。维护者确认前不大规模改代码。
3. **建造** — 按 `AGENTS.md` load map（边界变更时读 architecture-governance），实现并运行 `package.json` 中的检查。
4. **收尾** — 更新 `ACTIVE.md` **Last session**；若已确认关 gate，更新 ADR 与 gate 表，或标 `Decision: pending-adr`。

## 6. 维护者提示词（可复制）

**新对话（常规）：**

```text
继续 pi VS Code。只 @ ACTIVE.md。
先复述当前 WI、Last session、建议今天完成什么（含验收）；我确认后再改代码。
```

**验收不通过：**

```text
验收不通过：期望 … / 实际 …。请只修此问题，再给验收步骤，并更新 ACTIVE。
```

**仅记录想法：**

```text
停车场：……。不要实现，只写入 ACTIVE，继续当前 WI。
```

## 7. Agent 义务

- 根据需求、架构与 `ACTIVE.md` 提议下一步。
- 脚手架、ADR、安全边界或破坏性结构调整前须确认。
- 会话结束须更新 Last session（未完成也要写）。
- 遵守 [何时写 ADR](../decisions/README.md#when-to-write-an-adr)；提案须标明 gate ID 与决策类。

## 8. ADR 与 gate

- **你拍板**；满足触发条件时由 agent 在批准后撰写 ADR。
- **关闭 gate** 须在 gate 表链接 Accepted ADR。
- `ACTIVE.md` 使用 **Gate ID** 与 **Decision**（`none` | `pending-adr` | `0001-slug`）。

### 文档漂移

涉及 gate 或 ADR 的会话结束前运行 `npm run docs:verify`。边界评审见 [`architecture-governance.zh.md`](architecture-governance.zh.md)。

## 9. 阶段（两档）

- **Prepare** — 范围、gate、契约或讨论；尚未做功能实现。
- **Build** — 写代码与验证。

更细步骤由 agent 按工作项写入 `ACTIVE.md`。

## 维护

§5–§8 有实质性变更时，同步更新 [`ACTIVE.md`](../../ACTIVE.md) 顶部会话契约表。
