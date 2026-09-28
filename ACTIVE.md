# pi-vscode — 当前工作（跨会话入口）

本文件是唯一当前工作入口，不是需求／架构权威或追加日志。规则见 [AGENTS](AGENTS.zh.md)、[内核](AGENTS.kernel.zh.md)与[协作指南](docs/guides/agent-collaboration.zh.md)。原起点压缩与长交接保存在[9月27日检查点](docs/archive/2026-09-27-active-checkpoint-history.zh.md)，本次整体收尾见[WI-010归档](docs/archive/2026-09-28-wi-010-goal-closure.zh.md)。

## Agent 会话契约（摘要）

| 步骤 | Agent |
|---|---|
| 开场 | 必要阅读、Git基线、当前WI／批准／Gate／PRD与验收核对；不把历史提案当当前授权。 |
| 提案 | Prepare保留范围与PRD判定；新增Build范围须批准；WIP最多1。 |
| 建造 | 按批准实现并实际验证；模拟／runtime／F5／安装分别取证，不虚报接受。 |
| 收尾 | 对照批准、记录代理或维护者的实际验收身份；正常ADR／gate、双语归档、检查与资源清理。 |

## 正在做（WIP=1）

| 字段 | 内容 |
|---|---|
| **ID** | none |
| **标题** | 无当前 WI |
| **阶段** | Idle；等待维护者指定下一 Prepare／Build |
| **PRD 判定** | 不适用 |
| **Gate ID** | 无新增；既有 Accepted gates／ADR 见已完成索引说明 |
| **Decision** | none |
| **批准范围** | 维护者 2026-09-28 确认 WI-022 已解决并要求更新本文件；不授权新产品实现、探针、付费模型或推送 |

### 目标与范围

当前无活动实现切片。下一工作须经维护者明确选定并写入本区完整提案后再进入 Prepare／Build。

### 方案与架构核对

不适用；无进行中边界变更。

### 验收

不适用。WI-022 按维护者确认关闭，见[收尾记录](docs/archive/2026-09-28-wi-022-closure.zh.md)。

### 范围外与批准边界

不得把停车场想法自动升为当前 WI；不得把已关闭调查当未完成阻塞。本地 CLI `--no-daemon` 规避与证据保留在[讨论记录](docs/discussions/2026-09-28-wi-022-background-consoles.zh.md)；回退仅删除确认自有且无依赖的启动器文件。

## 当前焦点与未决项

- [x] WI-022：维护者确认已解决；默认 CLI 规避收尾并移出当前 WI。
- [ ] 下一工作项未指定；需要时由维护者选定后再进入 Prepare。

## 最近交接

### 2026-09-28 — WI-022 维护者确认关闭

- 维护者明确表示 WI-022 已解决，并要求更新 ACTIVE。
- 按收尾规则：当前 WI 清空为 Idle；提案／限制归档到[WI-022 收尾](docs/archive/2026-09-28-wi-022-closure.zh.md)；完成索引新增一行；讨论标记为已关闭工作项记录。
- 不宣称上游 Codex 根治 ADR／gate 变更；不修改 PATH／注册表／Codex 二进制；不读取秘密、不付费调用、不推送。
- 本轮 `npm run docs:verify` 与 `npm run docs:health` 均通过（0 error／0 warning；health 0 error／0 review notice）。未做 compile／lint／测试（仅文档与 ACTIVE 收尾）。未 Git 提交／推送。

### 2026-09-28 — 累计改动提交授权与验证

- 维护者明确要求提交当前全部改动，取代仅限本轮暂存／本地提交的历史禁令；按实现、侧栏焦点回退、工作区标签边界、后台进程规避、文档归档及ACTIVE记录分开，不授权推送、重写历史或新增产品实施。
- 本轮compile／lint、npm test（673/673，0 skipped）、verify:webview、docs:verify及docs:health通过；文档检查0错误／警告，健康检查0错误／复核提醒。每个提交分别核对完整暂存补丁并运行commit:check。
- 提交准备仅额外清理6个源码与3个归档文件末尾空行，并更新本交接；未扩展应用行为。
- 当时不新增F5／安装版人工验收证据；该边界已由后续维护者确认 WI-022 关闭替代，不再作为当前未决项。

## 停车场

额外扩展生态、编辑区panel／Chat Participant、remote／multi-root支持、额外平台、无产品依据的delta优化、全局启动默认持久化、跳过审批、图片／PDF／表格／语法高亮、历史回滚、框架更换及发布不属于本次批准队列；不得据此自动新建或实施WI。REQ-007／008／009的原批准缺口已关闭，没有移入停车场。

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
