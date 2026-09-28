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
| **ID** | WI-024 |
| **标题** | 扩展内供应商／模型配置（API Key 首切片） |
| **阶段** | Build；维护者 2026-09-28 确认计划并授权实现（「Implement the plan」） |
| **PRD 判定** | 用户可见：收窄 D-04「延后登录 UI」对本个人目标切片，允许扩展内 API Key／默认模型配置；不改审批语义、不把密钥送入 Webview |
| **Gate ID** | 无新 gate／ADR；沿用 Living 契约与 ADR0001／0004；密钥仍宿主侧 |
| **Decision** | none（产品收窄已确认；不升格整份 Draft PRD） |
| **批准范围** | 齿轮设置内供应商状态、宿主 InputBox 写入 `~/.pi/agent/auth.json`、默认模型写入 settings、配置后刷新模型列表；**不**授权 OAuth、自定义 models.json、平行 SecretStorage、付费探针、提交／推送 |

### 目标与范围

维护者希望在**扩展界面**配置供应商与模型，而不是手改 `settings.json`。本切片交付：

1. **齿轮「界面设置」新增「供应商与模型」分区**：列出支持 API Key 的供应商状态（ready／未配置、来源标签）；Add key／Remove；默认模型下拉。
2. **密钥仅经宿主原生 InputBox（password）**：经公开 `ModelRuntime.login`／`logout` 写入标准 `auth.json`；Webview 只发 `providerId` 意图，永不承载密钥。
3. **默认模型**经 `SettingsManager.setDefaultModelAndProvider` 持久化；runtime 就绪时刷新／应用既有 `set_model` 投影。
4. **无模型 banner**引导打开设置配置供应商，替代仅「改 JSON 再 reload」。

### 方案与架构核对

- 宿主编排 `@earendil-works/pi-coding-agent` 的 `ModelRuntime`／`SettingsManager`；扩展 build 将包标为 external，不经 RPC 写凭证。
- 新消息：`providerConfigState` 出站；入站 `openProviderApiKey`／`logoutProvider`／`setDefaultModel`／`refreshProviderConfig`。
- L0：密钥不进 HTML、webview storage、消息体、日志；不重新实现 provider 栈。
- WI-023 F5 目视仍独立待办，不混验收本 WI。

### 验收

| 项 | 可观察标准 |
|---|---|
| 设置入口 | 齿轮内可见供应商列表与默认模型控件 |
| 密钥路径 | Add key 弹出宿主密码框；成功后 Webview／消息中无密钥 |
| 模型恢复 | 已开文件夹且 runtime 就绪时，配置后 `ModelPicker` 可出现真实模型 |
| 回归 | compile／lint／相关 npm test／verify:webview；必要 F5 目视 |
| 明确未验收 | OAuth、自定义端点、ambient 云凭证、付费调用 |

### 范围外与批准边界

不做 OAuth／device-code／PKCE；不做完整 `models.json` 编辑器；不平行 SecretStorage 凭证库；不在 Webview 嵌 API Key 输入框；不付费模型；不提交／推送除非另批。不关闭 WI-023 的 F5 待办。

## 当前焦点与未决项

- [x] WI-024 Prepare／Build 授权：扩展内 API Key＋默认模型。
- [x] 实现与自动化检查：`compile`／`lint`／`npm test`（679/679）／`verify:webview`／`docs:verify`。
- [ ] 维护者 F5：设置分区、Add key、模型选择器恢复。
- [ ] WI-023 遗留：维护者 F5 确认设置布局／模型选择器可见（与本 WI 分开）。
- [x] 实现提交：维护者授权（不含 `.vscode/launch.json`）。

## 最近交接

### 2026-09-28 — WI-024 Build 实现

- 齿轮「界面设置」新增「供应商与模型」：状态列表、Add/Update API key（宿主密码框）、Remove、默认模型、Refresh。
- 宿主 `ProviderConfig` 经 `ModelRuntime`／`SettingsManager` 写标准 `~/.pi/agent`；消息 `providerConfigState`／`openProviderApiKey`／`logoutProvider`／`setDefaultModel`／`refreshProviderConfig`；密钥永不进 webview。
- 无模型 banner 可打开设置；`piStartupModel` 尊重 `PI_CODING_AGENT_DIR`；扩展 build external 化 `pi-coding-agent`。
- 检查：compile／lint／679 tests／verify:webview／docs:verify。未 F5、未提交。

### 2026-09-28 — WI-023 Build 实现（未关）

- 执行配置迁入齿轮设置；作曲区模型控件始终渲染。检查曾通过；F5／提交未做。

## 停车场

额外扩展生态、编辑区panel／Chat Participant、remote／multi-root支持、额外平台、无产品依据的delta优化、全局启动默认持久化、跳过审批、图片／PDF／表格／语法高亮、历史回滚、框架更换及发布不属于本次批准队列；不得据此自动新建或实施WI。OAuth 订阅登录与自定义 OpenAI-compatible 端点属 WI-024 后续候选，不自动开工。

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
