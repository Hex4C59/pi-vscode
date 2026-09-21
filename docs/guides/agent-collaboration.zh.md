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
- 每个活动 WI 在 `ACTIVE.md` 有持久讨论稿，涵盖目标与范围、方案与风险、可操作的验收、明确不做的事、适用时的 gate ID 与决策类、**PRD 判定**以及确认状态。Prepare 阶段可未写全，但进入 Build 前须记录维护者确认。
- 架构 **gate** 未以 Accepted ADR 关闭前，不得当作已交付能力。

## 5. 会话节奏

1. **开场** — 维护者 **只 @ `ACTIVE.md`**（或说「继续 pi VS Code」）。Agent 阅读本指南后复述：当前 WI、Last session、今日焦点、验收步骤。
2. **提案** — Prepare 阶段先将可审阅的 WI 讨论稿写入 `ACTIVE.md`，再给出简短计划与 **决策类** `none` | `spike-only` | `adr-after-approval`（适用时含 gate ID）。**必须做 PRD 判定**：将 WI 归类为用户可见或纯技术，并在 `ACTIVE.md` 记录理由。若涉及用户可见行为，先在 `docs/product-requirements.md` 及译文起草可观察需求（含相关空态／错误态）、验收和 WI 追溯行，进入 Build 前请维护者确认范围；若为纯技术工作，记录不新增 PRD 需求的原因。在当前 WI 的 `PRD 判定` 行写 `用户可见` 或 `纯技术` 并说明理由；仅 Prepare 阶段可留 `待定`。用户可见 Build 的 PRD 追溯行须写 WI 及对应 REQ ID。Draft 不代表已交付；未经维护者明确批准不得将 PRD 标为 `Accepted`。维护者确认（如「可以」「按 A 做」）后，记录确认与选定方案才进入 Build。一句目标或仅聊天中的计划不够。
3. **建造** — 确认后按 `AGENTS.md` load map（边界变更时读 architecture-governance），按已确认的讨论稿实现并运行 `package.json` 中的检查。
4. **收尾** — 对照已批准的 PRD 切片与 WI 验收核对实际交付的用户可见行为；差异须修正或明确延期，才能声称交付。更新 `ACTIVE.md` **Last session**；若已确认关 gate，更新 ADR 与 gate 表，或标 `Decision: pending-adr`。

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

- 根据需求、架构与 `ACTIVE.md` 提议下一步；若缺讨论稿，先在 Prepare 补全，再请求进入建造。
- 脚手架、安全边界、破坏性结构调整及 ADR 所记录的决策须获批准。记录已经批准的决策无需另行许可。
- 会话结束须更新 Last session（未完成也要写）。
- 遵守 [何时写 ADR](../decisions/README.md#when-to-write-an-adr)；提案须标明 gate ID 与决策类。

### 主动沉淀记录

在讨论形成有意义的阶段性结论、维护者确认方案，以及 WI 收尾或受影响文档被替代时执行检查。仅讨论的会话也适用，不等待实施请求或目录指令。

| 触发条件 | Agent 动作 |
|---------|--------------|
| 方案比较、重要取舍、技术调查或未决问题值得跨会话保留 | 在 `docs/discussions/` 创建或更新一个主题：背景、候选方案、依据、当前倾向和未决项。整理摘要，不照搬聊天。 |
| 维护者明确确认符合 ADR 条件的选择 | 在 `docs/decisions/` 创建或更新背景、决定、理由、替代方案、影响和证据。分别记录批准与验证；满足所需批准和验证后才标 Accepted，否则保留待定状态与缺失条件。 |
| WI 收尾或已确认的替代关系产生值得保留的非活动材料 | 将受影响的旧讨论、旧提案或已关闭 WI 长篇记录归入 `docs/archive/`，注明原因、历史状态和替代链接（无替代文档时明确说明）。历史 ADR 留在 `docs/decisions/`，维护状态及替代关系。 |
| 普通问答、小修改或一句未来想法 | 不单独建文档；必要时更新现有交接或停车场。 |

写入前先查找并更新已有主题，避免空文件、重复报告和多处维护同一事实。`ACTIVE.md` 聚焦 §4 要求的当前 WI 提案摘要、批准状态、未决阻塞和简短交接，链接详细讨论、决策及历史。从 ACTIVE 应能方便地审阅已批准范围和验收。

本规则对**已授权讨论或工作范围内**的记录整理与归档提供持续授权，不另问是否保存或放在哪里。它不代表批准提案、扩大实施范围、启动批量历史清理、授权删除或创建 Git 提交。明确的只读请求优先。批准含义不清楚时，只询问具体决策；不得从 Agent 建议或测试成功推断批准。

归档前，将仍有效的要求和未决问题保留在活动文档并加链接，不隐藏阻塞或改写历史决定。已有译文成对移动，修复入站链接、相对链接和索引，在原入口保留摘要及链接。年代或长度本身不是归档触发条件。遵循目录规则与[文档健康指南](documentation-health.zh.md)；运行 `npm run docs:verify`，WI 收尾或归档时另运行 `npm run docs:health`。

最终交接简短说明保存或更新了什么、文件位置，以及仍待确认的决策或验证。没有符合条件的内容就不新建文档。

## 8. ADR 与 gate

- **你拍板**；满足触发条件时由 agent 在批准后撰写 ADR。
- **关闭 gate** 须在 gate 表链接 Accepted ADR。
- `ACTIVE.md` 使用 **Gate ID** 与 **Decision**（`none` | `pending-adr` | `0001-slug`）。

### 文档漂移

每个 WI 收尾时，检查受影响文档中被替代的内容，并运行 `npm run docs:health`；在现有交接记录中说明更新、保留历史或延期的发现。遵循[文档健康指南](documentation-health.zh.md)。这是手动复核义务，不代表已安装每周调度器，仅允许 §7 的范围内记录整理，不授权无关清理或提交。

涉及 gate 或 ADR 的会话结束前运行 `npm run docs:verify`。边界评审见 [`architecture-governance.zh.md`](architecture-governance.zh.md)。

## 9. 阶段（两档）

- **Prepare** — 范围、gate、契约或讨论；将 WI 讨论稿写入 `ACTIVE.md` 并请求维护者确认，尚未做功能实现。
- **Build** — 按 `ACTIVE.md` 中已确认的讨论稿写代码与验证。

更细步骤由 agent 按工作项写入 `ACTIVE.md`。

## 维护

§5–§8 有实质性变更时，同步更新 [`ACTIVE.md`](../../ACTIVE.md) 顶部会话契约表。
