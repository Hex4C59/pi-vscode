# 讨论（非权威）

[English](README.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[README.md](README.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01

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
| [`ACTIVE.md`](../../ACTIVE.md) **Last session** | 是主 agent 总交接；链接的各 WI 团队提案／证据在活动期间可保留于此 |
| [`decisions/`](../decisions/) | 维护者**已确认**符合 ADR 条件的选择（所需验证完成后才标 Accepted） |
| [`product-requirements.md`](../product-requirements.md) | 定义可验收的**用户可见**范围 |
| [`archive/`](../archive/) | 内容**已过时**但需保留 |

## 建议文件名

- `YYYY-MM-DD-topic-slug.md` — 带日期的线程。
- 一主题一文件；出现 ADR 或 WI 时加上链接。

## 按用途查找主题

以下分组只为检索，不代表批准或当前交付状态。各记录保留自身证据日期、版本、未决问题与历史状态。讨论已解决、篇幅长或时间早，都不自动触发归档；仅按授权归档规则处理。当前工作见 [ACTIVE](../../ACTIVE.md)，需求、模块边界和决定见 [PRD](../product-requirements.zh.md)、[架构](../architecture/vscode-extension-architecture.zh.md)、[gate](../reference/architecture-gates.zh.md)与 [ADR 索引](../decisions/README.zh.md)。

[功能差距对照](2026-10-01-pi-feature-gaps.zh.md)仍为候选清单，不授权 Build。本机清单讨论只作背景；现行批准范围由 REQ-010 和 WI 记录说明，不沿用历史停车场措辞或 Draft ADR 0010。审计发现和测量是证据，不授权修复或优化。

### 产品与 UI 探索

- [把 UI 工艺写成 Code Agent 能执行的规则](2026-09-28-agent-ui-rules.zh.md)
- [Claude Code 与 Pi 侧栏：为何对方更有质感](2026-09-28-claude-code-ui-comparison.zh.md)
- [WI-024：供应商设置布局（渐进展开）](2026-09-28-wi-024-provider-settings-layout.zh.md)
- [设置里的本机插件清单](2026-10-01-local-plugin-inventory.zh.md)
- [作曲区模型芯片文案工艺](2026-10-01-model-chip-label.zh.md)
- [pi VS Code 与 pi 0.86.1 的功能差距](2026-10-01-pi-feature-gaps.zh.md)

### 架构与职责边界

- [活跃运行会话模型与已保存默认的顺序](2026-09-29-live-session-saved-default.zh.md)
- [运行时适配层：只留一种托管进程接法](2026-09-29-runtime-owner-seam.zh.md)
- [去掉自有运行时恢复门槛](2026-09-29-drop-runtime-recovery-barrier.zh.md)
- [ARCH-01 准入与状态转换所有者](2026-09-30-arch-01-admission-owners.zh.md)
- [ARCH-03 运行时能力组合](2026-09-30-arch-03-runtime-capabilities.zh.md)
- [ARCH-04 模型类型与 Webview DTO 共享](2026-09-30-arch-04-dto-coupling.zh.md)
- [架构评估 — 2026-10-01](2026-10-01-architecture-assessment.zh.md)

### 技术调研、测量与运行证据

- [WI-004 Prepare — 固定 pi `0.85.1` RPC 证据](2026-09-21-wi-004-rpc-evidence-0.85.1.zh.md)
- [WI-022：默认CLI规避（已关闭）](2026-09-28-wi-022-background-consoles.zh.md)
- [侧栏 UI skill 的组件动效调研](2026-09-29-component-motion-research.zh.md)
- [设置界面重设计调研](2026-09-29-settings-redesign-research.zh.md)
- [ARCH-08 流式与历史预览成本](2026-09-30-arch-08-streaming-history-cost.zh.md)
- [资源与期限测量](2026-09-30-resource-timeout-measurement.zh.md)

### 活动团队任务记录

- [WI-079 用量 — Prepare、证据与交接](2026-10-02-wi-079-team.zh.md)
- [WI-080 当前会话重命名 — Prepare、证据与交接](2026-10-02-wi-080-team.zh.md)
- [WI-081 回复复制 — Prepare、证据与交接](2026-10-02-wi-081-team.zh.md)

各记录描述限定授权切片；ACTIVE 维护当前批准／状态登记，PRD 维护行为。原生验收仍须实际观察后确认。

### 代码审计与核验证据

- [测试有效性审查](2026-09-29-test-relevance-audit.zh.md)
- [核心边界审查：附件、审批与进程控制](2026-09-30-core-boundaries-audit.zh.md)
- [运行时辅助模块审查：仅检查新文件](2026-09-30-runtime-helpers-audit.zh.md)
- [UI 子模块审查：仅检查新文件](2026-09-30-ui-components-audit.zh.md)
- [工具链与配置审查](2026-09-30-tooling-config-audit.zh.md)
- [接口风险核验：Composer 标志与 FileSnapshot 校验器](2026-09-30-interface-risk-verification.zh.md)
- [需求实现核对（2026-09-30）](2026-09-30-requirements-implementation-check.zh.md)

跨主题入口：[供应商布局](2026-09-28-wi-024-provider-settings-layout.zh.md) ↔ [设置调研](2026-09-29-settings-redesign-research.zh.md)；[UI 规则](2026-09-28-agent-ui-rules.zh.md) ↔ [动效调研](2026-09-29-component-motion-research.zh.md)；[架构评估](2026-10-01-architecture-assessment.zh.md) ↔ [边界审计](2026-09-30-core-boundaries-audit.zh.md)。已关闭 WI 的提案与验收见[归档编号索引](../archive/2026-09-29-closed-wi-index.zh.md)。

## Agent 规则

讨论仅作背景。若与 `ACTIVE.md` 或 Accepted 文档冲突，**以权威文件为准**，并在[协作指南 §7](../guides/agent-collaboration.zh.md#7-agent-义务) 的授权内对齐或归档；未解决的决策冲突须明确保留。

讨论形成有意义的阶段性结论时，Agent 主动创建或更新已有主题，不要求维护者选择目录。包含背景、候选方案、依据、当前倾向和未决项，区分建议、已确认决定和已验证结果。普通问答不建文件。从相关 WI 摘要链接主题；形成 ADR 后链接它，不重复维护决定。讨论解决后，须确认已不活跃且有用内容已有现行归属，再考虑移动。
