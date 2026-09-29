# pi-vscode — 当前工作（跨会话入口）

本文件是唯一当前工作入口，不是需求／架构权威或追加日志。规则见 [AGENTS](AGENTS.zh.md)、[内核](AGENTS.kernel.zh.md)与[协作指南](docs/guides/agent-collaboration.zh.md)。更早检查点见 [9月27日](docs/archive/2026-09-27-active-checkpoint-history.zh.md)；WI-010 收尾见 [归档](docs/archive/2026-09-28-wi-010-goal-closure.zh.md)。WI-025 收尾、完整轮次与已替代交接见 [2026-09-29 WI-025 归档](docs/archive/2026-09-29-wi-025-active-superseded.zh.md)。

## Agent 会话契约（摘要）

| 步骤 | Agent |
|---|---|
| 开场 | 必要阅读、Git基线、当前WI／批准／Gate／PRD与验收核对；不把历史提案当当前授权。 |
| 提案 | Prepare保留范围与PRD判定；新增Build范围须批准；WIP最多1。 |
| 建造 | 按批准实现并实际验证；模拟／runtime／F5／安装分别取证，不虚报接受。 |
| 收尾 | 对照批准、记录代理或维护者的实际验收身份；正常ADR／gate、双语归档、检查与资源清理。 |

## 当前无活动 WI（WIP=0）

WI-025 侧栏视觉工艺切片于 2026-09-29 获维护者 F5 视觉验收并关闭；完整范围、审批、逐轮证据与限制见 [收尾归档](docs/archive/2026-09-29-wi-025-active-superseded.zh.md)及 [PRD 追溯](docs/product-requirements.zh.md)。本切片无新 ADR／gate；安装 VSIX、真实模型完整链及原生 forced-colors 等未由此次确认覆盖。

尚未批准下一 WI 或 Build。WI-024 继续暂停，WI-023／024 的 F5 各自待办见停车场；新工作须先按协作指南记录范围与批准。

## 当前焦点与未决项

- [x] WI-025 的实现、自动检查、合成预览和维护者 F5 视觉验收已按各自证据层记录。
- [ ] 下一个 WI 未选定；不从停车场自动开工。

## 最近交接

2026-09-29 — 维护者 F5 视觉验收确认：

维护者明确确认当前焦点中的 WI-025 F5 视觉验收。此前 730/730 全量测试、compile／lint／verify:webview 与合成主题矩阵是原交接的历史证据，本次尚未重跑；本次仅记录维护者验收并完成文档收尾。WI-025 的 F5 视觉切片可接受；安装 VSIX、真实模型／执行完整链、精确原生宽度矩阵与 forced-colors 等仍未由本次确认覆盖，详见第六轮[证据边界](docs/archive/2026-09-29-wi-025-active-superseded.zh.md)。WI-023／024 各自 F5 仍待办；没有新 Build 授权。维护者随后明确请求提交本次收尾文档，不含推送。

2026-09-29 — 启动前强度补齐与维护者确认：

维护者此前反馈“我测试了，可以的”，启动前选择并保留强度切片已获实测确认；该条没有提供 F5／VSIX 方式，后续 F5 视觉确认见上方交接。实现：准备与运行阶段共用 ModelPickerView／三色滑条；`setDefaultThinkingLevel` 绑定默认模型身份；ProviderConfig 使用 SettingsManager 逐模型存储与 pi-ai 0.86.1 能力 API。证据：`npm test` 730/730；隔离 RPC 确认 thinkingLevel=high；Chrome 合成宿主 `settings-review.html?state=pre-session`。详见 [归档](docs/archive/2026-09-29-wi-025-active-superseded.zh.md) 若需完整验证段落。

## 停车场

额外扩展生态、编辑区panel／Chat Participant、remote／multi-root支持、额外平台、无产品依据的delta优化、全局启动默认持久化、跳过审批、图片／PDF／表格／语法高亮、历史回滚、框架更换及发布不属于本次批准队列；不得据此自动新建或实施WI。OAuth 订阅登录与自定义 OpenAI-compatible 端点属 WI-024 后续候选，不自动开工。对照 Claude Code 的侧栏质感见[讨论](docs/discussions/2026-09-28-claude-code-ui-comparison.zh.md)。侧栏视觉规则已收入 skill [pi-sidebar-ui](.agents/skills/pi-sidebar-ui/SKILL.md)，WI-025 已实施并获维护者 F5 视觉确认；依据见[讨论](docs/discussions/2026-09-28-agent-ui-rules.zh.md)。

**WI-024（暂停，未关闭）**：扩展内 API Key＋默认模型已实现并提交，混合布局／模型同步修复已于 2026-09-29 分组提交（`bed0e8d`／`2149560`）；批准边界与交付见[暂停提案](docs/archive/2026-09-28-wi-024-paused-proposal.zh.md)。待办：维护者 F5 确认设置分区（渐进展开）、Add key、模型选择器恢复；WI-023 F5（设置布局／模型选择器可见）另行待办。恢复前不得并入 WI-025 验收。

## 已完成 WI 索引

为兼容当前 Cursor 预览，链接直接打开归档文件。表中早期 gate Open／待决描述是相应验收日期的历史，不是当前状态；当前全部六项 gate Accepted，见 ADR0001／0004。

| WI | 结果 | 完成／验收 | 历史 |
|----|------|------------|------|
| WI-001 | 扩展壳、辅助侧栏与 RPC 探针；ADR 0001 | 2026-09-19 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-002 | 版本化 ping/pong Webview 桥 | 2026-09-19 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-003 | Project trust 技术 spike；gate 仍 Open | 2026-09-19 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-004 | REQ-004 最小流式聊天；gate 仍 Open | 2026-09-21 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-005 | 文档健康第一阶段 | 2026-09-19 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-006 | 工作区与项目资源选择 UI | 2026-09-21 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-007 | 根据资源选择启动 pi RPC | 2026-09-21 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-010 | thinking／受控工具／Stop 四项 F5 已确认；限定切片关闭，ADR pending／gate Open | 2026-09-21 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-011 | 模块内测试迁移、递归 runner 与 scripts 分组；限定技术切片收尾 | 2026-09-22 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-012 | 最小 P1–P3 探针切片关闭；P3／完整兼容缺口保留，不是产品验收 | 2026-09-22 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-020 | 跨模块公共入口与模块类型契约；唯一 P2 已修复，双轴零发现 | 2026-09-26 维护者技术验收；ADR／gate 不变 | [记录](docs/archive/2026-09-26-wi-020-public-entries.zh.md) |
| WI-021 | REQ-004 retry／compaction／可靠终态与必要 focus 回退修复；原生 F5／安装分别验证 | 2026-09-27 UTC 代理按本次委托完成评估；gates 不变 | [记录](docs/archive/2026-09-27-wi-021-execution-closure.zh.md) |
| WI-019 | Q16 委托评估、共享正式 chat、实机浮层／资源修复与独立 F5／安装验收 | 2026-09-27 UTC 代理按本次委托完成评估；ADR／gates 不自动关闭 | [记录](docs/archive/2026-09-27-wi-019-formal-chat.zh.md) |
| WI-015 | React／TypeScript／Vite 迁移验收；ADR 0003 Accepted | 2026-09-27 UTC 代理按本次委托完成评估；广泛 gates 保持 Open | [记录](docs/archive/2026-09-27-wi-015-react-acceptance.zh.md) |
| WI-013 | 受信扩展加载、标准交互、工具审批与自有runtime恢复；ADR0002 Accepted | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；广泛gates保持Open | [记录](docs/archive/2026-09-28-wi-013-acceptance.zh.md) |
| WI-008 | 模型选择／就绪、故障／审批／Stop、认证错误安全与必要实机修复 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；WI-009及广泛gates不自动关闭 | [记录](docs/archive/2026-09-28-wi-008-model-acceptance.zh.md) |
| WI-009 | thinking能力／下一轮意图、审批／Stop／退出恢复、键盘焦点与短窗错误修复 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；完整REQ／广泛gates不自动关闭 | [记录](docs/archive/2026-09-28-wi-009-thinking-acceptance.zh.md) |
| WI-014 | 显式文件／选区混合附件、逐项确认、完整预览／历史／容量恢复与丢失提示 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；审阅／会话及广泛gates不自动关闭 | [记录](docs/archive/2026-09-28-wi-014-attachment-acceptance.zh.md) |
| WI-016 | 受控dirty保护／准确readonly历史diff、分页及丢失恢复；短窗裁切红→绿 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；WI-017与广泛gates仍独立 | [记录](docs/archive/2026-09-28-wi-016-review-acceptance.zh.md) |
| WI-017 | 当前项目／CLI-origin会话、顺序交接、原文历史与异常恢复；trusted默认重置红→绿 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；广泛gates独立 | [记录](docs/archive/2026-09-28-wi-017-session-acceptance.zh.md) |
| WI-010 剩余边界／原Goal | 三项剩余gate、ADR0004、Living契约、实际分层验证与全局收尾 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估 | [记录](docs/archive/2026-09-28-wi-010-goal-closure.zh.md) |
| WI-022 | Windows后台终端闪现；默认CLI `--no-daemon` 规避，维护者确认关闭 | 2026-09-28 维护者确认已解决 | [记录](docs/archive/2026-09-28-wi-022-closure.zh.md) |
| WI-025 | 侧栏视觉工艺、准备阶段修正与启动前强度；维护者 F5 视觉验收 | 2026-09-29 维护者确认；VSIX／真实模型完整链不在本次验收证据内 | [记录](docs/archive/2026-09-29-wi-025-active-superseded.zh.md) |
