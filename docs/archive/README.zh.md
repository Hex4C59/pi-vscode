# 归档（非权威历史）

[English](README.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[README.md](README.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-28
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

## 契约历史

- [旧Webview契约快照](2026-09-28-webview-contract-history.zh.md)：v1／v2、单文件首片与旧验收文字保留为历史；现行v3-only Living契约仍在reference。

## WI-022调查历史

- [后台控制台调查](2026-09-28-wi-022-background-consoles.zh.md)：已替代的诊断历史与放弃的源码构建路线；已采用CLI规避证据见[讨论文档](../discussions/2026-09-28-wi-022-background-consoles.zh.md)。2026-09-28 维护者确认关闭，见[WI-022收尾](2026-09-28-wi-022-closure.zh.md)。

## 已关闭 WI 索引

下表的gates／待验收描述保留相应记录当时的范围；现行最终状态见WI-010收尾及ACTIVE，不把历史状态当当前阻塞。

| 记录 | 内容 |
|------|------|
| [WI-022后台终端闪现收尾](2026-09-28-wi-022-closure.zh.md) | 维护者确认关闭默认CLI `--no-daemon`规避；不是上游Codex ADR／gate变更 |
| [WI-010剩余边界／原Goal收尾](2026-09-28-wi-010-goal-closure.zh.md) | ADR0004及三gate接受、原队列映射、671测试与分层实际证据、文档／资源处置 |
| [WI-008模型／就绪验收](2026-09-28-wi-008-model-acceptance.zh.md) | 委托接受、修复、分层宿主证据与范围限制 |
| [WI-009 thinking验收](2026-09-28-wi-009-thinking-acceptance.zh.md) | 委托评估、659实际矩阵与660实机修复；后续WI及广泛gates独立 |
| [WI-014附件验收](2026-09-28-wi-014-attachment-acceptance.zh.md) | 实际F5／安装确认、容量、UTF-8边界与短窗交互；后续WI／gates独立 |
| [WI-016审阅验收](2026-09-28-wi-016-review-acceptance.zh.md) | dirty／readonly捕获／归因／生命周期接受；真实短窗修复与两域重跑；WI-017／gates独立 |
| [WI-017会话验收](2026-09-28-wi-017-session-acceptance.zh.md) | 会话／历史／恢复接受；trusted默认重置修复、663新包与分层宿主证据 |
| [WI-013委托验收](2026-09-28-wi-013-acceptance.zh.md) | 限定实现、分层实测、ADR0002接受及保留边界 |
| [WI-013已替代候选](2026-09-28-wi-013-superseded-candidates.zh.md) | 历史路线与拟议契约，不是现行实施权威 |
| [已关闭WI历史—WI-001～007及WI-010～012](2026-09-21-closed-wi-history.zh.md) | 关闭范围、验收及限制；WI-008／009后来由各自独立记录关闭 |
| [WI-020公共入口与类型契约](2026-09-26-wi-020-public-entries.zh.md) | 9月26日技术验收；P2修复及证据，其他验收／gates不变 |
| [WI-021执行与原生F5收尾](2026-09-27-wi-021-execution-closure.zh.md) | 9月27日UTC委托限定接受；F5／安装分别验证，gates不变 |
| [WI-019正式chat收尾](2026-09-27-wi-019-formal-chat.zh.md) | Q16委托评估、共享正式展示、独立F5／安装；其他WI／ADR／gates不变 |
| [WI-015 React／Vite验收](2026-09-27-wi-015-react-acceptance.zh.md) | 委托迁移／ADR0003接受、新安装生命周期证据；当时gates仍Open |
| [WI-025 侧栏视觉工艺收尾](2026-09-29-wi-025-active-superseded.zh.md) | 维护者 2026-09-29 F5 视觉验收；批准范围、分层证据与安装／完整执行未验边界 |
| [前端调查与候选提案](2026-09-22-webview-framework.zh.md) | WI-015／019及ADR0003接受后归档；保留访谈、来源与候选切片 |

## 被替代的交接

| 记录 | 内容 |
|------|------|
| [工作区恢复替代的Goal前交接](2026-09-22-pre-goal-handoffs.zh.md) | 历史批准／证据，不是WI关闭或当前账本 |
| [Goal前端与附件检查点](2026-09-22-goal-frontend-attachment-handoffs.zh.md) | 后续Goal切片替代的WI-015／014可执行交接；当时维护者验收／gates仍待 |
| [Goal修改审阅检查点](2026-09-22-goal-change-review-handoff.zh.md) | 会话连续性替代的WI-016代码／可执行交接；当时验收／gates仍待 |
| [Goal会话连续性检查点](2026-09-23-goal-session-handoff.zh.md) | WI-017可执行交付与维护者请求暂停；当时下一实现未开始、验收／gates仍待 |
| [WI-024暂停提案](2026-09-28-wi-024-paused-proposal.zh.md) | 为WI-025移出ACTIVE的供应商／模型配置范围、交付与被替代交接；WI-024暂停而非关闭，维护者F5仍在ACTIVE停车场待办 |
| [ACTIVE候选与验证检查点历史](2026-09-27-active-checkpoint-history.zh.md) | 旧入口过程及原始中文；当时WI-019／021验收、F5阻塞及未决由ACTIVE持有 |
| [WI-025 历史 Build 切片与交接](2026-09-29-wi-025-active-superseded.zh.md) | 第二～五轮完整 Build 记录、第六轮证据与已替代交接；同文件顶部记录关闭结论 |

## Agent 规则

归档与当前权威文档冲突时忽略归档，引用现行文件。

WI收尾或确认文档替代时，Agent按[协作§7](../guides/agent-collaboration.zh.md#7-agent-义务)归档受影响材料，不另问保存／目录；不授权批量历史清理。记录原因、历史状态、替代链接（或说明无替代）。移动前在活动文档保存仍有效要求／未决问题，原入口留摘要／链接。翻译成对移动，修复入站／相对链接及索引，执行docs:verify和docs:health。ADR留在docs/decisions/并维护状态／替代关系。年代或长度本身不构成归档理由。

## 已解决调查

- [兼容性与旧候选](2026-09-22-pi-compatibility.zh.md)：保留历史CF／Prepare状态；当前范围归已接受WI与ADR0004。
- [代表性扩展调查](2026-09-27-wi-013-target-research.zh.md)：WI-013／ADR0002的公开来源／版本及原始失败。
- [原生F5诊断](2026-09-27-wi-021-native-f5.zh.md)：失败debugger路线与官方隔离宿主选择；WI-021已接受。
