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
| 0007 | 跨宿主 endpoint 文件事务（WI-038） | 不关闭 gate | [0007-endpoint-write-transaction.zh.md](0007-endpoint-write-transaction.zh.md) |
| 0008 | 宿主丢失时清理精确自有子进程（WI-036） | 不关闭 gate | [0008-owner-loss-child-cleanup.zh.md](0008-owner-loss-child-cleanup.zh.md) |
| 0009 | 每窗口独立恢复域（WI-058） | 不关闭 gate | [0009-per-window-recovery-domains.zh.md](0009-per-window-recovery-domains.zh.md) |
| 0005 | 在 models.json 中保存自定义 OpenAI 兼容端点（WI-030） | 不关闭 gate | [0005-custom-endpoint-file.zh.md](0005-custom-endpoint-file.zh.md) |

## Draft ADR

| ID | 标题 | Gate | 文件 |
|----|------|------|------|
| 0010 | 本机 pi 扩展清单的持久化与加载同意（WI-059） | 无；后续切片验证 | [0010-local-plugin-inventory.zh.md](0010-local-plugin-inventory.zh.md) |

0010 于 2026-10-01 由完成 ACTIVE.md 全部任务的 `/goal` 记为 Draft。WI-059 只接受产品边界。存储、设置 UI、运行时应用与 ADR 接受仍属后续切片。[讨论](../discussions/2026-10-01-local-plugin-inventory.zh.md)；[WI-059](../archive/2026-10-01-wi-059-acceptance.zh.md)。

0005 于 2026-09-30 由代理依据剩余验证 `/goal` 接受：隔离安装版真实自定义端点补全，以及 GitHub Copilot 设备码／浏览器 OAuth 交互。隔离 `auth.json` 未写入。不关闭 gate。[证据](../archive/2026-09-30-macos-verification-acceptance.zh.md)。

0006 于 2026-09-30 由代理按维护者对 WI-035 的明确委托接受，实际 macOS F5／隔离安装交接与完整自动化检查已完成。只取代 ADR 0002 的启动仪式，会话内恢复不变。共享域准入后来由 ADR 0009 取代。[证据与限制](../archive/2026-09-30-wi-035-macos-acceptance.zh.md)；不关闭 gate。

0007 于 2026-09-30 由代理依据本会话完成 ACTIVE 收尾并提交的要求接受，实现、993 项测试与 macOS 开发／隔离安装双窗口证据已齐。不接受 ADR 0005，也不改 gate。[证据与限制](../archive/2026-09-30-wi-038-macos-acceptance.zh.md)。

0008 于 2026-09-30 由代理依据完成剩余任务的 goal 接受，owner-loss 终止的 supervisor 进程测试、compile／lint 与 1016 项自动化测试已齐。只取代 ADR 0002 在宿主丢失时保留 child 存活的规则。[证据与限制](../archive/2026-09-30-wi-036-macos-acceptance.zh.md)；不关闭 gate。

0009 于 2026-09-30 由代理依据完成停车场任务的 goal 接受，双域 reserve 测试、compile／lint 与 1027 项自动化测试已齐。只取代 ADR 0002 的共享域单运行时准入。[证据与限制](../archive/2026-09-30-wi-058-macos-acceptance.zh.md)；不关闭 gate。

## Agent 流程

符合 ADR 条件的选择获明确确认后，按[协作指南 §7](../guides/agent-collaboration.zh.md#7-agent-义务) 自动记录，无需另问是否保存。所需验证缺失时保持 ADR Draft，并在 ACTIVE 记录待满足条件（`Decision: pending-adr`），不关闭 gate。批准含义不清楚时询问具体决策，不询问目录。满足接受条件后更新本索引、相关 gate 链接及 ACTIVE。历史 ADR 留在此处；被替代时标明状态并链接替代记录，不改写原始理由，不因年代久远而移动。
