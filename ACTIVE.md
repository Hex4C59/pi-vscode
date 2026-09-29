# pi-vscode — 当前工作（跨会话入口）

本文件是唯一当前工作入口，不是需求／架构权威或追加日志。规则见 [AGENTS](AGENTS.zh.md)、[内核](AGENTS.kernel.zh.md)与[协作指南](docs/guides/agent-collaboration.zh.md)。已关闭编号查找见 [归档索引](docs/archive/2026-09-29-closed-wi-index.zh.md)。

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
| **ID** | WI-030 |
| **标题** | OAuth 登录与自定义 OpenAI 兼容端点 |
| **阶段** | 建造（维护者确认 2026-09-29 计划） |
| **PRD 判定** | 用户可见：REQ-002。收窄 D-04，在 WI-026 设置页增加订阅登录与一个不含密钥的自定义端点；无新 REQ。 |
| **Gate ID** | 无新 gate。 |
| **Decision** | pending-adr。 |

### 目标与范围

在现有编辑区设置页完成两件事：对带公开 OAuth `login` 的供应商发起订阅登录；添加或删除一个 OpenAI 兼容端点。Webview 只发送意图。密钥和令牌只经过宿主密码框与 `ModelRuntime.login`，进入 pi 的 auth 存储。`models.json` 只合并不含密钥的 `openai-completions` 条目。维护者已确认此前安装包满意。

### 方案与架构核对

设置详情在供应商公开 `auth.oauth.login` 时显示登录。宿主打开不含用户信息的 http(s) 链接，在原生提示中显示设备码，取消不报成硬错误。自定义端点为名称、Base URL 和一个模型 id；确认后宿主再要 API key。宿主是 `models.json` 里这类条目的唯一写入者：合并其他供应商，损坏或无法安全解析的文件保持不变，不删除内置供应商。保存或登录成功且侧栏已有就绪会话时，沿用 `applyConfiguredModel`；没有会话不启动运行时。不升级 pi，不做付费探测。见 [ADR 0005](docs/decisions/0005-custom-endpoint-file.md)。

### 验收

compile、lint、相关 npm test、verify:webview、docs:verify。测试覆盖取消登录、URL 与设备码不进 Webview、坏 `models.json` 不被覆盖、端点合并与删除、密钥不进消息。维护者再看设置页的登录入口和添加端点。自动化不代替真实浏览器登录、真实端点推理或新的安装包验收。

### 范围外与批准边界

本计划已由维护者确认实施。不提交、不推送、不调用付费模型。不做多模型编辑器、Anthropic／Google 自定义 API、请求头、compat、SecretStorage 平行存储或环境云凭证。

## 当前焦点与未决项

- [ ] WI-030 OAuth 登录、自定义端点与自动化回归。
- [ ] WI-030 维护者查看设置页登录入口和添加端点。

- [x] 维护者确认已安装的 VSIX 满意。该接受不追溯为 WI-026／023／024 的原证据。
- [x] WI-029 维护者技术接受；真实 pi／F5／安装 VSIX 不在本次证据内。
- [x] WI-028 维护者技术接受；Linux 隔离 spike／F5／安装 VSIX 不在本次证据内。
- [x] WI-027 维护者接受展示切片；F5／安装 VSIX 不在本切片内。
- [x] WI-026、WI-023、WI-024 的维护者 F5 视觉接受。
- [x] 「生产聊天成为唯一组合」：维护者 F5 与安装包（VSIX）验收。

## 最近交接

### 2026-09-29 — WI-030 OAuth 与自定义端点

Decision：pending-adr。维护者确认计划并要求实施。安装包满意已记录。Draft ADR 0005。代理侧：compile、lint、npm test（771/771）、verify:webview、docs:verify（0 error，Draft ADR 两条 warning）通过。未做设置页 F5、真实浏览器登录、真实端点推理或新的安装包验收。未提交、未推送。

### 2026-09-29 — WI-028 维护者接受并关闭

Decision：none。维护者在本会话确认 WI-028 结果。RPC 与进程策略分离关闭；提案与交接已归档。关闭覆盖实现时自动化检查与本次技术接受，不表示 Linux 隔离 spike、F5 或安装 VSIX，不授权提交或推送。

## 停车场

**架构（已确认，未开工）**：把已保存默认应用到活跃运行会话模型的顺序抽取，用户可见规则冻结。维护者 2026-09-29 确认设计。词汇见 [CONTEXT](CONTEXT.zh.md)；讨论见 [2026-09-29](docs/discussions/2026-09-29-live-session-saved-default.zh.md)。WI-026 已关闭。不自动开 WI。

运行时进程接口重构已关闭为 WI-028；不自动开 WI。

额外扩展生态、编辑区聊天／Chat Participant、remote／multi-root支持、额外平台、无产品依据的delta优化、全局启动默认持久化、跳过审批、图片／PDF／表格／语法高亮、历史回滚、框架更换及发布不属于本次批准队列；不得据此自动新建或实施WI。OAuth 订阅登录与自定义 OpenAI 兼容端点已由维护者确认为 WI-030，不再作为未开工候选。对照 Claude Code 的侧栏质感见[讨论](docs/discussions/2026-09-28-claude-code-ui-comparison.zh.md)。

## 已完成 WI 索引

完整编号索引见 [归档](docs/archive/2026-09-29-closed-wi-index.zh.md)（Cursor 预览直接打开该文件）。表中早期 gate Open 措辞是相应验收日期的历史，不是当前状态；当前全部六项 gate Accepted，见 ADR0001／0004。

| WI | 结果 | 完成／验收 | 历史 |
|----|------|------------|------|
| WI-027 | 收回附件预览失败句与交互文案到 UiText；维护者接受该展示切片 | 2026-09-29 维护者确认；F5／安装 VSIX 不在本切片内 | [记录](docs/archive/2026-09-29-wi-027-ui-text.zh.md) |
