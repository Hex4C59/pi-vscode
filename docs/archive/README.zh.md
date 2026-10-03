# 归档（非权威历史）

[English](README.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[README.md](README.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-03
- Type: Reference
- Status: Accepted
- Authority: **仅历史上下文**——被替代的PRD、WI、spike和讨论

## 用途

材料已**不再活跃**但需保留审计轨迹时移入这里：

- 被替代的product-requirements.md修订（由现行PRD链接）。
- 对ACTIVE.md过长的已关闭WI记录。
- 有经验教训的废弃spike。

**不要**依据归档实施。Agent只将它作为只读背景。

## 移动文件前

1. 在归档开头或ADR说明被替代原因。
2. 确保当前事实位于Accepted PRD、架构、gates、ADR或ACTIVE.md。
3. 优先采用docs/archive/下YYYY-MM-DD-original-name.md，可平铺或按年分组。

## 按 WI 查找

[关闭 WI 索引](2026-09-29-closed-wi-index.zh.md)负责按编号查找原验收／关闭、已有独立方案及相关历史。本 README 负责归档规则与记录类别导航，不复制 WI 完整表。未找到独立材料时在该索引标注，不补造。

WI 记录保留旧 pending／open 等历史状态；当前工作与决定见 [ACTIVE](../../ACTIVE.md)、[PRD](../product-requirements.zh.md)、[架构](../architecture/vscode-extension-architecture.zh.md)、[gate](../reference/architecture-gates.zh.md)、[ADR](../decisions/README.zh.md)。

## 契约快照

- [Webview 消息（工作区、聊天、模型设置与受控执行）](2026-09-28-webview-contract-history.zh.md)

## 跨 WI 验收

- [macOS 验证与自用验收（2026-09-30）](2026-09-30-macos-verification-acceptance.zh.md)

## Runtime 前置证据

- [公开队列 RPC 证据 — WI-076](2026-10-01-wi-076-acceptance.zh.md)；合成 provider，不是产品验收。
- [文字队列产品切片 — WI-077](2026-10-02-wi-077-acceptance.zh.md)；F5 与安装 VSIX＋合成 provider；PI-GAP-01 剩余范围停车。
- [作曲区命令发现 — WI-078](2026-10-02-wi-078-acceptance.zh.md)；浏览器、真实 runtime、F5／安装 VSIX；加载报告余量停车。

- [实际安装版本信息 — WI-089](2026-10-02-wi-089-version-information.zh.md)：本次Goal代理验收，F5／安装UI分层证据，当次关闭时其余七项未完成。

- [实际资源加载 — WI-082](2026-10-03-wi-082-resource-report.zh.md)：本次Goal代理验收、实际F5／安装报告；当次关闭时六项未完成。

- [手动上下文压缩 — WI-083](2026-10-03-wi-083-manual-compaction.zh.md)：本次Goal代理验收，独立实际F5／安装英中原生review及合成loopback；五项仍未完成。

## 被替代的方案与调查

- [pi 兼容性调查](2026-09-22-pi-compatibility.zh.md)
- [Webview 前端框架讨论](2026-09-22-webview-framework.zh.md)

## 被替代的交接与共用 WI 历史

- [ACTIVE 同步与待验交接（2026-10-03 归档）](2026-10-03-active-handoff-cleanup.zh.md)

- [已关闭工作项历史 — WI-001～007 与 WI-010～012](2026-09-21-closed-wi-history.zh.md)
- [Goal 修改审查检查点 — WI-016](2026-09-22-goal-change-review-handoff.zh.md)
- [Goal 前端与附件检查点](2026-09-22-goal-frontend-attachment-handoffs.zh.md)
- [工作区恢复所替代的 Goal 前交接](2026-09-22-pre-goal-handoffs.zh.md)
- [Goal 会话连续性检查点 — WI-017](2026-09-23-goal-session-handoff.zh.md)
- [ACTIVE 检查点历史 — 候选交付与验证](2026-09-27-active-checkpoint-history.zh.md)
- [ACTIVE 已完成任务压缩（2026-09-30）](2026-09-30-active-completed-compaction.zh.md)

## WI 记录类别

方案（含被替代／暂停候选）、验收与关闭、调查／交接历史均从编号索引查找；同一文件可能兼任多个角色。WI-022 保留旧控制台调查及关闭记录，采用的 workaround 仍在[讨论](../discussions/2026-09-28-wi-022-background-consoles.zh.md)。WI-032 pending 验收已由最终评估替代，两份均在 WI-032 行链接。旧交接保留当时的证据限制，不继承后来的验收。本次导航整理未移动归档文件。

## Agent 规则

归档与当前权威文档冲突时忽略归档，引用现行文件。

WI收尾或确认文档替代时，Agent按[协作§7](../guides/agent-collaboration.zh.md#7-agent-义务)归档受影响材料，不另问保存／目录；不授权批量历史清理。记录原因、历史状态、替代链接（或说明无替代）。移动前在活动文档保存仍有效要求／未决问题，原入口留摘要／链接；ACTIVE 仅保留通用归档索引链接，完成任务摘要和交接留在本目录。翻译成对移动，修复入站／相对链接及索引，执行docs:verify和docs:health。ADR留在docs/decisions/并维护状态／替代关系。年代或长度本身不构成归档理由。

导航维护：WI-073 — [编号历史](2026-09-29-closed-wi-index.zh.md).

导航维护：WI-074 — [编号历史](2026-09-29-closed-wi-index.zh.md).

导航维护：WI-075 — [编号历史](2026-09-29-closed-wi-index.zh.md).

- [File completion / 文件补全 — WI-084](2026-10-03-wi-084-file-completion.zh.md): bounded delegated actual F5/installed acceptance; four slices unfinished.

- [Model cycling / 模型轮换 — WI-085](2026-10-02-wi-085-model-cycling.zh.md): actual independent native F5/installed Goal-delegated acceptance; three slices unfinished.

- [Session search / 会话搜索 — WI-086](2026-10-02-wi-086-session-search.zh.md): actual independent F5/installed ten cases and eighteen native captures per lane; Goal-delegated acceptance, two slices unfinished.

- [WI-087 有界 Mermaid 验收](2026-10-02-wi-087-mermaid.zh.md)：独立实际F5／安装图表、源码回退及原生视觉；仅Goal委托有界切片。

- [WI-088 本地诊断验收](2026-10-02-wi-088-local-diagnostics.zh.md)：独立实际F5／安装只读review、双取消、冻结bytes相等的0600本地导出；上传未批准。

- [八项有界Goal最终交接](2026-10-03-eight-gap-goal.zh.md)：批准八切片的源码／本地提交／分层实际验收及保留问题；不代表整个ACTIVE完成。
