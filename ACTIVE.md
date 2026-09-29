# pi-vscode — 当前工作（跨会话入口）

本文件是唯一当前工作入口，不是需求／架构权威或追加日志。规则见 [AGENTS](AGENTS.zh.md)、[内核](AGENTS.kernel.zh.md)与[协作指南](docs/guides/agent-collaboration.zh.md)。已关闭编号查找见 [归档索引](docs/archive/2026-09-29-closed-wi-index.zh.md)。

## Agent 会话契约（摘要）

| 步骤 | Agent |
|---|---|
| 开场 | 必要阅读、Git基线、当前WI／批准／Gate／PRD与验收核对；不把历史提案当当前授权。 |
| 提案 | Prepare保留范围与PRD判定；新增Build范围须批准；WIP最多1。 |
| 建造 | 按批准实现并实际验证；模拟／runtime／F5／安装分别取证，不虚报接受。 |
| 收尾 | 对照批准、记录代理或维护者的实际验收身份；正常ADR／gate、双语归档、检查与资源清理。 |

## 当前无活动 WI（WIP=0）

当前没有进行中的 WI。2026-09-29 维护者在本对话确认三件 F5 视觉接受并关闭：WI-026 方案 A，以及暂停中的 WI-023／024（设置、Add key、模型选择器）。下一件工作须维护者指定。停车场里已确认的顺序抽取设计不自动开工。

## 当前焦点与未决项

- [x] WI-026、WI-023、WI-024 的维护者 F5 视觉接受。
- [x] 「生产聊天成为唯一组合」：维护者 F5 与安装包（VSIX）验收。
- [ ] WI-026／023／024 当时未含安装 VSIX。OAuth 与自定义 OpenAI-compatible 端点仍未开工。

## 最近交接

### 2026-09-29 — 生产聊天成为唯一组合（夹具退役）与维护者验收

无新 WI；Decision：none。删除 baseline 夹具与 Attachment／Sessions／Conversation 历史实现后，默认 `uiHarness` 与正式界面共用 `mountApp`／chat 组合。代理侧：`compile`、`lint`、`npm test`（736/736）、`verify:webview` 通过。`docs:verify` 仍因归档 `docs/archive/2026-09-22-webview-framework.md`（及译文）链接已删的 `baseline-app.tsx` 失败；按该深化计划未改归档。维护者确认 F5 与安装包验收通过。未提交、未推送。无新 ADR 或 gate。PRD 仍为 Draft。

### 2026-09-29 — 维护者 F5 视觉接受：WI-026，以及 WI-023／024

维护者确认 WI-026 与停车场中 WI-023／024 的 F5 视觉。安装 VSIX 不在那三次接受内（见上条夹具退役的安装包证据，范围不同）。实现与关闭细节见 [归档](docs/archive/2026-09-29-wi-026-active-superseded.zh.md)、[暂停提案](docs/archive/2026-09-28-wi-024-paused-proposal.zh.md)。

## 停车场

**架构（已确认，未开工）**：把已保存默认应用到活跃运行会话模型的顺序抽取，用户可见规则冻结。维护者 2026-09-29 确认设计。词汇见 [CONTEXT](CONTEXT.zh.md)；讨论见 [2026-09-29](docs/discussions/2026-09-29-live-session-saved-default.zh.md)。WI-026 已关闭。不自动开 WI。

额外扩展生态、编辑区聊天／Chat Participant、remote／multi-root支持、额外平台、无产品依据的delta优化、全局启动默认持久化、跳过审批、图片／PDF／表格／语法高亮、历史回滚、框架更换及发布不属于本次批准队列；不得据此自动新建或实施WI。OAuth 订阅登录与自定义 OpenAI-compatible 端点属 WI-024 之后的候选，不自动开工。对照 Claude Code 的侧栏质感见[讨论](docs/discussions/2026-09-28-claude-code-ui-comparison.zh.md)。

## 已完成 WI 索引

完整编号索引见 [归档](docs/archive/2026-09-29-closed-wi-index.zh.md)（Cursor 预览直接打开该文件）。表中早期 gate Open 措辞是相应验收日期的历史，不是当前状态；当前全部六项 gate Accepted，见 ADR0001／0004。

| WI | 结果 | 完成／验收 | 历史 |
|----|------|------------|------|
| WI-026 | 编辑区设置页方案 A；维护者 F5 视觉验收 | 2026-09-29 维护者确认；安装 VSIX 不在本次证据内。同日 WI-023／024 的 F5 视觉也已确认 | [记录](docs/archive/2026-09-29-wi-026-active-superseded.zh.md) |
