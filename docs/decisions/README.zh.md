# 架构决策记录（ADR）

[English](README.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[README.md](README.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-22

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

## Draft ADR

- [0003 — React 与 TypeScript Webview 前端](0003-react-webview.zh.md)：WI-015 Prepare 的框架方向已确认，需要外观整理与浏览器预览；Build 和必要验证待完成，WI-014 Paused，gate 保持 Open。

- [0002 — 本地交互契约与上游能力提案](0002-interaction-contract-route.zh.md)：文档路线于 2026-09-22 批准，随后修订为优先使用未修改发行版 pi，上游增强可选。详细限定设计、实现及所需验证待完成。WI-013 Paused，未完成；ADR 仍 Draft，gate 保持 Open；不解决 WI-010 遗留 pending ADR。

## Agent 流程

符合 ADR 条件的选择获明确确认后，按[协作指南 §7](../guides/agent-collaboration.zh.md#7-agent-义务) 自动记录，无需另问是否保存。所需验证缺失时保持 ADR Draft，并在 ACTIVE 记录待满足条件（`Decision: pending-adr`），不关闭 gate。批准含义不清楚时询问具体决策，不询问目录。满足接受条件后更新本索引、相关 gate 链接及 ACTIVE。历史 ADR 留在此处；被替代时标明状态并链接替代记录，不改写原始理由，不因年代久远而移动。
