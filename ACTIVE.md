# pi-vscode — 当前工作（跨会话入口）

本文件是当前工作入口，不是需求／架构权威，也不是只增不减的历史日志。维护者新会话只需 **@ 本文件**（或说「继续 pi VS Code」）；Agent 须完整读取当前 WI，再按 [`AGENTS.zh.md`](AGENTS.zh.md) 的加载地图渐进展开相关需求、架构、契约与证据。完整流程见[协作指南](docs/guides/agent-collaboration.zh.md)；已关闭历史见[归档索引](docs/archive/README.zh.md)。

## Agent 会话契约（摘要）

| 步骤 | Agent |
|------|-------|
| **开场** | 读取本文件当前 WI 与最近交接，再完整阅读协作指南；复述阶段、Gate、Decision、今日焦点及验收。 |
| **渐进加载** | 基础必读后只展开任务相关路由；历史归档仅在需要既往证据时读取。证据缺失／冲突须报告，不得猜测。 |
| **提案** | Prepare 在本文件保留完整可审阅提案：目标、方案／风险、验收、范围外、Gate、Decision class、PRD 判定；维护者确认后才进入 Build。 |
| **建造** | 按已批准范围与加载地图实现；运行相关 lint/typecheck/test/docs 检查。 |
| **收尾** | 核对实际交付与 PRD/WI 验收；将已关闭 WI 长文归档，在本文件已完成索引留一行；运行 `docs:verify` 与适用的 `docs:health`。 |

- **WIP=1：** 本文件同时只有一个「正在做」；新想法进停车场。
- **Gate：** 未经 Accepted ADR 关闭的 gate 不得当作已交付能力。
- **提交：** 未经维护者明确请求不得创建或修改 Git commit。

## 正在做（WIP=1）

| 字段 | 内容 |
|------|------|
| **ID** | WI-004 |
| **标题** | 首条端到端聊天：用户文本 → pi RPC `prompt` → 助手 `text_delta` 流式 |
| **阶段** | Prepare（维护者 2026-09-21 选择继续本任务；讨论稿已写入，**尚未批准 Build**） |
| **Gate ID** | `gate-session-streaming`（Open；本切片不关闭） |
| **Decision** | `none` |
| **决策类** | `none` |
| **PRD 判定** | 用户可见：REQ-004 的**最小 Draft 切片**（仅用户文本 + 助手文本流式）；不交付 REQ-002/003/005/006/008 |

### 目标与范围（提案）

在 WI-006／007 的工作区选择与 RPC 就绪基础上，交付**第一条可发送的用户消息**和**可见的助手文本流式**。继续使用固定 pi `0.85.1` 子进程 JSONL RPC；证据来自已安装包与上游 [coding-agent `rpc.md`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/rpc.md)，本地 `../pi` 只读对照。

- **前置条件：** 仅 `workspaceState.runtime === "ready"` 时启用输入；用户已选择 allow/decline，子进程 `get_state` 已成功。
- **宿主／适配器：** 扩展 `PiRuntimeLifecycle` 与 `pi-rpc-runtime`，在既有进程保持 LF JSONL 读循环；发送有界纯文本 `prompt`；将 `message_update` 中 `assistantMessageEvent.type === "text_delta"` 映射为内部事件，以 `turn_end`（或公开等价事件）结束本轮。`prompt` response 仅代表接受／拒绝，不代表完成。
- **安全切片：** RPC 增加公开 `--no-tools`，避免未实现 REQ-006 审批 UI 时执行工具；UI 明示「无工具模式／非完整 Agent」，不声称沙箱。
- **Webview：** 工作区块下增加只读消息列表、多行输入和 Send；新增严格校验的 `sendChat`（generation + 有界 text）及宿主聊天状态投影。Webview 不直发任意 RPC、不持密钥、仅用 `textContent` 渲染。
- **生命周期：** 工作区身份／资格变化、运行时停止或 provider dispose 时清空内存 transcript；拒绝 stale `sendChat` 与迟到旧运行时事件。
- **凭证／错误：** 复用用户既有 pi 配置；失败显示有界恢复信息，不向 Webview 或日志传原始 stderr／密钥。

### 方案与架构核对（提案）

- **所有权：pass（方案）** — 宿主拥有 transcript 与流式状态；adapter 仅做 RPC 编解码／事件映射；Webview 仅展示。
- **契约／安全：gap** — Build 须同步双语 [`webview-messages`](docs/reference/webview-messages.zh.md) Outline 与严格 allowlist 测试，保持 nonce CSP。
- **生命周期：gap** — Build 须处理并发 prompt、运行时重启、generation/runtime token 与迟到 JSONL 行。
- **成熟度：Direction** — 不关闭 `gate-session-streaming` 或 `gate-webview-trust`。

### 验收（提案）

1. F5：运行时就绪后发送短消息，用户消息可见，助手文本增量显示，结束后停止增长；无工具执行。
2. 未配置模型／凭证或 provider 失败时显示有界错误，不泄露密钥。
3. 换工作区或重载扩展后 transcript 清空；自动化覆盖消息校验、mock 流式事件、并发／迟到结果与 provider 不导入 adapter。
4. `npm test`、`npm run compile`、`npm run lint`、`npm run docs:verify` 通过。

### 范围外与批准边界

- 模型选择（REQ-002）、编辑器附件（REQ-003）、Stop（REQ-005）、工具审批（REQ-006）、完整工具活动／重试／压缩状态（REQ-004 完整）、会话历史（REQ-008）、`abort`／`steer`、图片与扩展命令桥。
- 不写 Accepted ADR、不关闭 gate、不把 PRD 标为 Accepted。
- **Build 前须维护者明确回复批准本讨论稿；本轮文档树维护不构成 WI-004 Build 批准。**

## 当前焦点与未决项

- [x] 完成有入口的文档树、历史迁移与结构检查维护；WI-004 Prepare 保持不变。
- [ ] Build 前补齐 WI-004 的双语 PRD 追溯，并取得与固定 `0.85.1` 匹配的公开 RPC 文档／等价版本证据；上游 `main` 链接不可单独证明固定版本行为。
- [ ] 维护者审阅上方 WI-004 范围并决定是否批准 Build；`webview-messages` chat 契约与架构当前状态注释在 Build 范围内同步，当前仍是已知 gap。
- [ ] Build 后 F5 验证首条 `prompt` + `text_delta` 流式（`--no-tools`）。
- **仍有效限制：** WI-003 未独立观察项目 settings 效果与 themes，刻意未安装项目包；无 OS 网络沙箱／独立流量审计；拒绝项目资源仍允许全局扩展与 `AGENTS.md` 上下文。详见[归档 WI-003](docs/archive/2026-09-21-closed-wi-history.zh.md#wi-003)。
- `gate-project-trust`、`gate-webview-trust`、`gate-session-streaming` 均仍 Open；真实状态见[架构 gate](docs/reference/architecture-gates.zh.md)。

## 停车场

- 编辑区标签聊天（Claude Code 式 `panel` 默认）
- Chat Participant API（VS Code 内置 Chat UI）

## 最近交接

### 文档树与渐进加载（2026-09-21，最新）

- 维护者批准用有入口的文档树替代膨胀的 ACTIVE：保留当前 WI 完整提案，关闭 WI 长文移至归档，按任务路由加载规则／契约／证据。
- 双语 AGENTS、文档索引与协作指南已记录加载协议；关闭 WI 历史集中归档并保留仍有效限制；结构检查防止无法识别当前 WI 或历史再次回流。
- 只给 `AGENTS.md` + `ACTIVE.md` 的冷启动演练能找到 WI-004 Prepare、未批准状态、验收／安全边界及 WI-003 精确归档分节；未读取整份归档。
- 演练发现并保留 Prepare gap：固定版本 RPC 文档证据缺失、PRD 追溯仍显示 REQ-002～008 未分配、架构当前状态注释滞后。未借文档治理顺手批准或实现 WI-004。
- 验证：`npm test` 48/48、compile、lint、`docs:verify`（0 错误／警告）、`docs:health`（27 文件、0 错误／提醒）与 `git diff --check` 通过。
- 本次仅文档治理与检查脚本维护；未批准或实现 WI-004 Build，未关闭 gate，未创建 commit。

### WI-004 Prepare（2026-09-21）

- 维护者选择 WI-004；讨论稿限定为 `prompt` + `text_delta` 最小流式、窄 `sendChat` 协议与 `--no-tools` 边界。
- **待确认：** 维护者明确批准 Build 后才能修改产品代码。

## 已完成 WI 索引

| WI | 结果 | 完成／验收 | 历史 |
|----|------|------------|------|
| WI-001 | 扩展壳、辅助侧栏与 RPC 探针；ADR 0001 | 2026-09-19 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md#wi-001) |
| WI-002 | 版本化 ping/pong Webview 桥 | 2026-09-19 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md#wi-002) |
| WI-003 | Project trust 技术 spike；gate 仍 Open | 2026-09-19 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md#wi-003) |
| WI-005 | 文档健康第一阶段 | 2026-09-19 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md#wi-005) |
| WI-006 | 工作区与项目资源选择 UI | 2026-09-21 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md#wi-006) |
| WI-007 | 根据资源选择启动 pi RPC | 2026-09-21 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md#wi-007) |
