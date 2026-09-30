# 归档（非权威历史）

[English](README.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[README.md](README.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-29
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

按编号查找（仅已关闭项）见 [已关闭 WI 编号索引](2026-09-29-closed-wi-index.zh.md)。下表按归档文件罗列。

下表的gates／待验收描述保留相应记录当时的范围；现行最终状态见WI-010收尾及ACTIVE，不把历史状态当当前阻塞。

| 记录 | 内容 |
|------|------|
| [已关闭 WI 编号索引](2026-09-29-closed-wi-index.zh.md) | 2026-09-29 从 ACTIVE 移出的编号查找表；未关闭／暂停项仍在 ACTIVE |
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
| [WI-026 编辑区设置收尾](2026-09-29-wi-026-active-superseded.zh.md) | 维护者 2026-09-29 F5 视觉验收；方案 A、实现交接与更早检查点 |
| [WI-027 收回 UiText 文案](2026-09-29-wi-027-ui-text.zh.md) | 维护者 2026-09-29 接受；附件预览失败句与交互界面文案；F5／VSIX 不在本切片内 |
| [WI-028 RPC 与进程策略](2026-09-29-wi-028-runtime-process.zh.md) | 维护者 2026-09-29 技术接受；RuntimeProcess 接缝与自动化检查；Linux spike／F5／VSIX 不在本次证据内 |
| [WI-029 RPC 运行时内部模块](2026-09-29-wi-029-rpc-runtime-modules.zh.md) | 维护者 2026-09-29 技术接受；三内部模块与自动化检查；真实 pi／F5／VSIX 不在本次证据内 |
| [WI-030 OAuth 与自定义端点](2026-09-29-wi-030-oauth-endpoint.zh.md) | 维护者 2026-09-29 完成剩余设置页检查；真实登录、真实端点和新安装包不在本次关闭内；ADR 0005 仍为 Draft |
| [WI-031 会话 worker 协议](2026-09-29-wi-031-session-worker-protocol.zh.md) | 维护者 2026-09-29 技术接受；共用报文校验、版本未改；F5／VSIX 不在本切片内 |
| [WI-032 代理受托接受](2026-09-30-wi-032-macos-evaluation.zh.md) | 六入口规则、定向 139 项测试与 macOS smoke；最终委托后关闭，原生敏感交互未验证 |
| [WI-033 代理受托接受](2026-09-30-wi-033-macos-evaluation.zh.md) | 真实 pi 捕获字节经生产 reader／runtime；最终委托后关闭，保留非 JSON 忽略与原生故障路径限制 |
| [WI-034 代理受托接受](2026-09-30-wi-034-macos-evaluation.zh.md) | 组包、解包真实 RPC／gate、原生 F5 与隔离安装渲染；限定关闭，不是完整产品验收 |
| [WI-035 代理受托接受](2026-09-30-wi-035-macos-acceptance.zh.md) | 精确回执交接、实际 F5／隔离安装与活所有者证据；ADR 0006 Accepted，保留失败与范围限制 |
| [WI-037 代理受托接受](2026-09-30-wi-037-macos-acceptance.zh.md) | 有界 thinking 流式与完整引号凭据脱敏；实际 macOS F5／隔离安装 SSE 证据 |
| [WI-039 代理受托接受](2026-09-30-wi-039-macos-acceptance.zh.md) | 安装版 VSIX 运行时依赖闭包（PACKAGE-01）；解包 import 验证与隔离安装版供应商配置加载 |
| [WI-038 代理受托接受](2026-09-30-wi-038-macos-acceptance.zh.md) | 跨宿主 endpoint 写入互斥；双窗口争用／串行提交证据；ADR 0007 Accepted |
| [WI-040 代理受托接受](2026-09-30-wi-040-macos-acceptance.zh.md) | 并发预检查下八张审批卡准入（CORE-01）；写入点重检 |
| [WI-041 代理受托接受](2026-09-30-wi-041-macos-acceptance.zh.md) | session-worker 请求关联与预览游标不变量（CORE-02） |
| [WI-042 代理受托接受](2026-09-30-wi-042-macos-acceptance.zh.md) | 模型选择器已应用 radio 使用稳定身份（UI-01） |
| [WI-038 批准提案](2026-09-30-wi-038-approved-proposal.zh.md) | 完整批准并发范围；历史，不是新的 Build 授权 |
| [WI-039 批准提案](2026-09-30-wi-039-approved-proposal.zh.md) | 完整批准组包范围；历史，不是新的 Build 授权 |
| [WI-040 批准提案](2026-09-30-wi-040-approved-proposal.zh.md) | 完整批准八张卡准入范围；历史，不是新的 Build 授权 |
| [WI-041 批准提案](2026-09-30-wi-041-approved-proposal.zh.md) | 完整批准解析器关联范围；历史，不是新的 Build 授权 |
| [WI-042 批准提案](2026-09-30-wi-042-approved-proposal.zh.md) | 完整批准模型身份范围；历史，不是新的 Build 授权 |
| [WI-035 批准提案](2026-09-30-wi-035-approved-proposal.zh.md) | 完整批准范围与验收；历史，不是新的 Build 授权 |
| [WI-034 批准提案](2026-09-30-wi-034-approved-proposal.md) | 关闭后原样保留的 ACTIVE 单语提案；不是新建造授权 |
| [前端调查与候选提案](2026-09-22-webview-framework.zh.md) | WI-015／019及ADR0003接受后归档；保留访谈、来源与候选切片 |

## 被替代的交接

| 记录 | 内容 |
|------|------|
| [WI-033 已停止审查交接](2026-09-30-wi-033-audit-handoffs.md) | 维护者停止审查后原样保留的 ACTIVE 单语检查点；不是 WI 关闭或恢复审查授权 |
| [WI-032 待接受](2026-09-29-wi-032-pending-acceptance.zh.md) | WI-033 优先后保留的范围与历史检查；待接受措辞仅为历史，已由[最终委托关闭](2026-09-30-wi-032-macos-evaluation.zh.md)替代 |
| [工作区恢复替代的Goal前交接](2026-09-22-pre-goal-handoffs.zh.md) | 历史批准／证据，不是WI关闭或当前账本 |
| [Goal前端与附件检查点](2026-09-22-goal-frontend-attachment-handoffs.zh.md) | 后续Goal切片替代的WI-015／014可执行交接；当时维护者验收／gates仍待 |
| [Goal修改审阅检查点](2026-09-22-goal-change-review-handoff.zh.md) | 会话连续性替代的WI-016代码／可执行交接；当时验收／gates仍待 |
| [Goal会话连续性检查点](2026-09-23-goal-session-handoff.zh.md) | WI-017可执行交付与维护者请求暂停；当时下一实现未开始、验收／gates仍待 |
| [WI-024暂停提案](2026-09-28-wi-024-paused-proposal.zh.md) | 供应商／模型配置范围与暂停时交接；WI-023 与 WI-024 的维护者 F5 关闭见同文件顶部 |
| [ACTIVE候选与验证检查点历史](2026-09-27-active-checkpoint-history.zh.md) | 旧入口过程及原始中文；当时WI-019／021验收、F5阻塞及未决由ACTIVE持有 |
| [WI-025 历史 Build 切片与交接](2026-09-29-wi-025-active-superseded.zh.md) | 第二～五轮完整 Build 记录、第六轮证据与已替代交接；同文件顶部记录关闭结论 |
| [WI-026 已替代文案删除与研究交接](2026-09-29-wi-026-active-superseded.zh.md) | 方案 A 提案、实现交接与更早检查点；关闭结论在同文件顶部 |

## Agent 规则

归档与当前权威文档冲突时忽略归档，引用现行文件。

WI收尾或确认文档替代时，Agent按[协作§7](../guides/agent-collaboration.zh.md#7-agent-义务)归档受影响材料，不另问保存／目录；不授权批量历史清理。记录原因、历史状态、替代链接（或说明无替代）。移动前在活动文档保存仍有效要求／未决问题，原入口留摘要／链接。翻译成对移动，修复入站／相对链接及索引，执行docs:verify和docs:health。ADR留在docs/decisions/并维护状态／替代关系。年代或长度本身不构成归档理由。

## 已解决调查

- [兼容性与旧候选](2026-09-22-pi-compatibility.zh.md)：保留历史CF／Prepare状态；当前范围归已接受WI与ADR0004。
- [代表性扩展调查](2026-09-27-wi-013-target-research.zh.md)：WI-013／ADR0002的公开来源／版本及原始失败。
- [原生F5诊断](2026-09-27-wi-021-native-f5.zh.md)：失败debugger路线与官方隔离宿主选择；WI-021已接受。
