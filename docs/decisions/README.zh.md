# 架构决策记录（ADR）

[English](README.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[README.md](README.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30

- 类型：参考
- 状态：Accepted
- 权威：本仓库何时、如何撰写 ADR

## 何时写 ADR

维护者确认下列选择后记录 ADR；所需验证未完成时保持 Draft，批准与验证齐备后才标 **Accepted**：

- 关闭 [`architecture-gates.md`](../reference/architecture-gates.md) 中的架构 gate；
- 变更信任边界、持久化或集成策略；
- 在不可逆技术选项间做选择（框架、进程模型）。

首次提案及仍有未解释失败的 spike 保留待定状态与缺少条件。

## 格式

- 文件：`docs/decisions/0001-short-slug.md`（英文为权威；可选 `.zh.md`）
- 元数据记录实际状态（`Draft`、`Accepted` 或 `Superseded`）及适用的 gate 链接。Accepted 须满足维护者批准与所需验证，分别记录日期和证据。
- 包含背景、决定、理由、考虑过的替代方案、影响及相关讨论／验证证据。不编造替代方案或批准；未知项明确说明。

## Accepted ADR

| ID | 标题 | Gate | 文件 |
|----|------|------|------|
| 0001 | 构建与扩展 baseline（WI-001） | `gate-extension-host-baseline`、`gate-sidebar-chat-shell`、`gate-runtime-host` | [0001-build-baseline.md](0001-build-baseline.md) |
| 0002 | 受信扩展交互与自有runtime恢复（WI-013） | 关联三项广泛gates另由ADR0004接受 | [0002-interaction-contract-route.zh.md](0002-interaction-contract-route.zh.md) |
| 0003 | React／TypeScript／Vite Webview 前端（WI-015） | 关联gates另由ADR0004接受 | [0003-react-webview.zh.md](0003-react-webview.zh.md) |
| 0004 | 端到端信任与会话生命周期边界（WI-010） | `gate-webview-trust`、`gate-project-trust`、`gate-session-streaming` | [0004-trust-and-lifecycle.zh.md](0004-trust-and-lifecycle.zh.md) |
| 0006 | 遗留自有运行时启动交接（WI-035） | 不关闭 gate | [0006-owned-runtime-handoff.zh.md](0006-owned-runtime-handoff.zh.md) |

## Draft ADR

| ID | 标题 | Gate | 文件 |
|----|------|------|------|
| 0005 | 在 models.json 中保存自定义 OpenAI 兼容端点（WI-030） | 无 | [0005-custom-endpoint-file.zh.md](0005-custom-endpoint-file.zh.md) |
| 0007 | 跨宿主 endpoint 文件事务（WI-038） | 无 | [0007-endpoint-write-transaction.zh.md](0007-endpoint-write-transaction.zh.md) |

0007 记录维护者批准的 WI-038 锁、冲突与遗留锁恢复取舍；实施／验证及最终接受仍待完成，不接受 ADR 0005，也不改 gate。

0005 保持 Draft。维护者在检查设置页控件后关闭了 WI-030。真实浏览器登录和真实端点调用仍未记录，因此本 ADR 不接受任何 gate。

0006 于 2026-09-30 由代理按维护者对 WI-035 的明确委托接受，实际 macOS F5／隔离安装交接与完整自动化检查已完成。只取代 ADR 0002 的启动仪式，共享域准入与会话内恢复不变。[证据与限制](../archive/2026-09-30-wi-035-macos-acceptance.zh.md)；不关闭 gate。

## Agent 流程

符合 ADR 条件的选择获明确确认后，按[协作指南 §7](../guides/agent-collaboration.zh.md#7-agent-义务) 自动记录，无需另问是否保存。所需验证缺失时保持 ADR Draft，并在 ACTIVE 记录待满足条件（`Decision: pending-adr`），不关闭 gate。批准含义不清楚时询问具体决策，不询问目录。满足接受条件后更新本索引、相关 gate 链接及 ACTIVE。历史 ADR 留在此处；被替代时标明状态并链接替代记录，不改写原始理由，不因年代久远而移动。
