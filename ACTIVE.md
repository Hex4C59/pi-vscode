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

无当前实现工作项。停车场的已确认设计不自动开工。

## 当前焦点与未决项

- [x] WI-031 维护者技术接受。F5／安装 VSIX 不在本切片内。

- [x] WI-030 维护者完成剩余设置页检查。真实浏览器登录、真实端点调用和新的安装包不在本次关闭内。ADR 0005 仍为 Draft。
- [x] WI-029 维护者技术接受；真实 pi／F5／安装 VSIX 不在本次证据内。
- [x] WI-028 维护者技术接受；Linux 隔离 spike／F5／安装 VSIX 不在本次证据内。
- [x] WI-027 维护者接受展示切片；F5／安装 VSIX 不在本切片内。
- [x] WI-026、WI-023、WI-024 的维护者 F5 视觉接受。
- [x] 维护者确认已安装的 VSIX 满意。该接受不追溯为 WI-026／023／024 的原证据。
- [x] 「生产聊天成为唯一组合」：维护者 F5 与安装包（VSIX）验收。

## 最近交接

### 2026-09-29 — WI-031 维护者关闭

Decision：none。维护者确认 WI-031 完成。共用会话报文校验，版本和用户可见行为不变。F5／安装 VSIX 不在本切片内。记录见[归档](docs/archive/2026-09-29-wi-031-session-worker-protocol.zh.md)。无当前 WI。不提交、不推送。

### 2026-09-29 — WI-030 维护者关闭

Decision：pending-adr。维护者确认 WI-030 完成，关闭设置页登录入口和添加端点的剩余检查。真实浏览器登录、真实端点调用和新的安装包没有新证据。ADR 0005 保持 Draft。记录见[归档](docs/archive/2026-09-29-wi-030-oauth-endpoint.zh.md)。WI-031 仍是当前工作。不提交、不推送。

## 停车场

**架构（已确认，未开工）**：把已保存默认应用到活跃运行会话模型的顺序抽取，用户可见规则冻结。维护者 2026-09-29 确认设计。词汇见 [CONTEXT](CONTEXT.zh.md)；讨论见 [2026-09-29](docs/discussions/2026-09-29-live-session-saved-default.zh.md)。WI-026 已关闭。不自动开 WI。

运行时进程接口重构已关闭为 WI-028；不自动开 WI。

额外扩展生态、编辑区聊天／Chat Participant、remote／multi-root支持、额外平台、无产品依据的delta优化、全局启动默认持久化、跳过审批、图片／PDF／表格／语法高亮、历史回滚、框架更换及发布不属于本次批准队列；不得据此自动新建或实施WI。对照 Claude Code 的侧栏质感见[讨论](docs/discussions/2026-09-28-claude-code-ui-comparison.zh.md)。

## 已完成 WI 索引

完整编号索引见 [归档](docs/archive/2026-09-29-closed-wi-index.zh.md)（Cursor 预览直接打开该文件）。表中早期 gate Open 措辞是相应验收日期的历史，不是当前状态；当前全部六项 gate Accepted，见 ADR0001／0004。

| WI | 结果 | 完成／验收 | 历史 |
|----|------|------------|------|
| WI-031 | 会话 worker 报文共用一份校验；协议版本和用户可见行为不变；维护者技术接受 | 2026-09-29 维护者确认；F5／安装 VSIX 不在本切片内 | [记录](docs/archive/2026-09-29-wi-031-session-worker-protocol.zh.md) |
