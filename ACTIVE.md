# pi-vscode — 当前工作（跨会话入口）

本文件是当前工作入口，不是需求／架构权威，也不是只增不减的历史日志。维护者新会话只需 **@ 本文件**（或说「继续 pi VS Code」）；Agent 须读取本文件与 [`AGENTS.zh.md`](AGENTS.zh.md) 加载地图。完整流程见[协作指南](docs/guides/agent-collaboration.zh.md)；已关闭历史见[归档索引](docs/archive/README.zh.md)。

## Agent 会话契约（摘要）

| 步骤 | Agent |
|------|-------|
| **开场** | 读取本文件与最近交接；若无活动 WI，与维护者确认下一 WI 后再展开 PRD／架构。 |
| **渐进加载** | 按任务路由展开；归档仅在需要既往证据时读取。 |
| **提案** | 新 WI 在 Prepare 写入完整讨论稿并取得批准后再 Build。 |
| **建造** | 按批准范围实现并运行检查。 |
| **收尾** | 核对验收；关闭 WI 时长文归档、索引留一行；`docs:verify` 与 `docs:health`。 |

- **WIP=1：** 同时只有一个「正在做」；新想法进停车场。
- **Gate：** 未经 Accepted ADR 关闭的 gate 不得当作已交付能力。
- **提交：** 未经维护者明确请求不得创建或修改 Git commit。

## 当前无活动 WI（WIP=0）

维护者于 **2026-09-21** 验收关闭 [**WI-004**](docs/archive/2026-09-21-closed-wi-history.zh.md#wi-004)（首条 `prompt` + `text_delta` 最小聊天切片）。下一工作项从停车场或新提案选定后，将本段替换为「正在做（WIP=1）」讨论稿。

## 当前焦点与未决项

- [ ] 选择下一 WI（恢复 WIP=1 时重写「正在做」区块）。
- **仍有效限制：** WI-003 与 WI-004 归档中的 gate／模型／信任限制；见 [WI-003](docs/archive/2026-09-21-closed-wi-history.zh.md#wi-003)、[WI-004](docs/archive/2026-09-21-closed-wi-history.zh.md#wi-004)。
- `gate-project-trust`、`gate-webview-trust`、`gate-session-streaming` 仍 Open — [架构 gate](docs/reference/architecture-gates.zh.md)。

## 停车场

- 编辑区标签聊天（Claude Code 式 `panel` 默认）
- Chat Participant API（VS Code 内置 Chat UI）
- 流式 UI 限速／合并 delta（观感优化，非 WI-004 范围）
- REQ-002 扩展内模型选择；provider 错误文案进一步友好化

## 最近交接

### WI-004 关闭（2026-09-21）

- 维护者确认 F5：流式、`Send` 忙碌态、503 有界错误、pi 启动默认模型后可用；声明「可以收 WI-004」。
- 长文与验收证据归档至 [`2026-09-21-closed-wi-history`](docs/archive/2026-09-21-closed-wi-history.zh.md#wi-004)；PRD 追溯已更新；未关闭 gate、PRD 仍为 Draft。
- 验证：`npm test`、`compile`、`lint`、`docs:verify`、`docs:health`（本回合）。

## 已完成 WI 索引

| WI | 结果 | 完成／验收 | 历史 |
|----|------|------------|------|
| WI-001 | 扩展壳、辅助侧栏与 RPC 探针；ADR 0001 | 2026-09-19 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md#wi-001) |
| WI-002 | 版本化 ping/pong Webview 桥 | 2026-09-19 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md#wi-002) |
| WI-003 | Project trust 技术 spike；gate 仍 Open | 2026-09-19 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md#wi-003) |
| WI-004 | REQ-004 最小流式聊天；gate 仍 Open | 2026-09-21 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md#wi-004) |
| WI-005 | 文档健康第一阶段 | 2026-09-19 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md#wi-005) |
| WI-006 | 工作区与项目资源选择 UI | 2026-09-21 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md#wi-006) |
| WI-007 | 根据资源选择启动 pi RPC | 2026-09-21 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md#wi-007) |
