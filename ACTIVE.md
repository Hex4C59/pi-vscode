# pi-vscode — 当前工作（跨会话状态）

运维说明：本文件供人与编码 Agent 共享会话状态，**不是**需求或架构权威。完整协作流程见 [Agent 协作指南](docs/guides/agent-collaboration.zh.md)（英文：[`agent-collaboration.md`](docs/guides/agent-collaboration.md)）。

**新会话开场**：只 **@ 本文件** 即可（或说「继续 pi-vscode，先复述 ACTIVE 再提案」）。Agent 须遵守下文 **Agent 会话契约**，并阅读 `docs/guides/agent-collaboration.md`（见 [`AGENTS.zh.md`](AGENTS.zh.md) 中「ACTIVE 会话配对」）。

## Agent 会话契约（摘要）

与 [agent-collaboration](docs/guides/agent-collaboration.zh.md) §5–§8 对齐；**完整权威**以该指南为准。

| 步骤 | Agent |
|------|--------|
| **开场** | 复述当前 WI、阶段（准备/建造）、Gate ID、Decision、Last session；今日建议焦点与验收步骤。 |
| **提案** | 简短计划 + **决策类** `none` \| `spike-only` \| `adr-after-approval`（含 gate ID 若适用）。维护者确认（如「可以」「按 A 做」）前不大规模改代码。 |
| **建造** | 读 [typescript](docs/guides/agent/typescript.zh.md) 与 [pi-integration](docs/guides/agent/pi-integration.zh.md)；实现并跑 lint/typecheck/测试（适用时）。 |
| **收尾** | 更新下文 **Last session**。若须写 ADR：起草 `docs/decisions/000x-….md` 并更新 [architecture-gates](docs/reference/architecture-gates.zh.md)，或 ACTIVE 标 `Decision: pending-adr`。 |

- **WIP=1**：只推进本文件中的一个 WI；新想法进 **停车场**，不插队。
- **Gate**：未 Accepted 的 gate 不得当作已交付能力；spike 未确认前不得写 Accepted ADR（见 [何时写 ADR](docs/decisions/README.zh.md#何时写-adr)）。
- **文档**：改文档后运行 `npm run docs:verify`。

---

## 正在做（WIP=1）

| 字段 | 内容 |
|------|------|
| **ID** | WI-002 |
| **标题** | Webview 信任边界 + 消息提纲 + ping/pong 桥 |
| **阶段** | 准备（待维护者确认 WI-002 提案） |
| **PRD / 架构** | [`vscode-extension-architecture`](docs/architecture/vscode-extension-architecture.zh.md)、[`architecture-gates`](docs/reference/architecture-gates.zh.md) |
| **Gate ID** | `gate-webview-trust` |
| **Decision** | `none` |
| **决策类（提案用）** | `adr-after-approval`（关 gate 时）或 `none`（若仅提纲 + ping/pong 不触 ADR） |

**一句目标**：版本化、允许列表的 webview ↔ host `postMessage`；CSP 与无密钥；最小 ping/pong 证明桥可用——**仍非**端到端 pi 聊天（见 WI-004）。

---

## 已完成（WI-001）

| 字段 | 内容 |
|------|------|
| **ID** | WI-001 |
| **ADR** | Accepted [`0001-build-baseline`](docs/decisions/0001-build-baseline.zh.md) |
| **已关闭 gate** | `gate-extension-host-baseline`、`gate-sidebar-chat-shell`、`gate-runtime-host` |
| **说明** | 脚手架 + 辅助侧栏占位壳 + 子进程 RPC spike；**不**包含用户聊天产品能力。 |

---

## 今天 / 当前焦点（WI-002）

- [ ] 维护者确认 WI-002 计划
- [ ] （准备/建造）`docs/reference/webview-messages` 提纲（Planned → Outline）
- [ ] （建造）host 校验 + webview ping/pong（无密钥）
- [ ] `npm run compile` / `lint` / `docs:verify`

---

## 停车场

- WI-003：`gate-project-trust` + 打开工作区文件夹流程
- WI-004：`gate-session-streaming` + 首条端到端消息流
- 编辑区标签聊天（Claude Code 式 `panel` 默认）
- Chat Participant API（VS Code 内置 Chat UI）

---

## Last session

- **日期：** 2026-09-19
- **变更：** Accepted ADR [`0001-build-baseline`](docs/decisions/0001-build-baseline.zh.md)；三个 WI-001 gate 标 **Accepted**；更新 `architecture-gates`、decisions 索引；WI-001 归档、WIP 切至 WI-002（准备）。
- **验收：** 维护者 F5 + spike 已接受；`npm run docs:verify` 已通过（2026-09-19）
- **下一步：** 维护者确认 WI-002 提案后开始 `gate-webview-trust`（ping/pong + 消息 reference 提纲）。
