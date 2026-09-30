# pi-vscode — 当前工作（跨会话入口）

本文件是唯一当前工作入口，不是需求／架构权威或追加日志。规则见 [AGENTS](AGENTS.zh.md)、[内核](AGENTS.kernel.zh.md)与[协作指南](docs/guides/agent-collaboration.zh.md)。已关闭编号查找见 [归档索引](docs/archive/2026-09-29-closed-wi-index.zh.md)。2026-09-30 从本入口移走的已完成焦点、逐 WI 授权表与已关闭停车场项见[压缩归档](docs/archive/2026-09-30-active-completed-compaction.zh.md)。

## Agent 会话契约（摘要）

| 步骤 | Agent |
|---|---|
| 开场 | 必要阅读、Git基线、当前WI／批准／Gate／PRD与验收核对；不把历史提案当当前授权。 |
| 提案 | Prepare保留范围与PRD判定；新增Build范围须批准；WIP最多1。 |
| 建造 | 按批准实现并实际验证；模拟／runtime／F5／安装分别取证，不虚报接受。 |
| 收尾 | 对照批准、记录代理或维护者的实际验收身份；正常ADR／gate、双语归档、检查与资源清理。 |

## 当前无活动 WI（WIP=0）

授权建造队列已空。停车场无未完成实现项。范围外能力记为 standing non-goals，不自动开 WI。

## 验收授权与平台决定

维护者于 2026-09-30 确认 macOS 本机 VS Code 自测；**Windows 实机 F5 与安装版 VSIX 范围外**。停车场实现与剩余 macOS 验证／自用 PRD 验收已由后续 `/goal` 完成。受托接受仍为**代理身份**，不是维护者亲自测试。不改 gate、不提交 Git。逐 WI 授权不是长期通行证。

## 当前焦点与未决项

- 授权建造队列已空（WIP=0）。不为清空待办新增功能开发。
- 剩余 macOS 实机验证与自用 PRD／ADR 0005 验收已完成，见 [macOS 验证记录](docs/archive/2026-09-30-macos-verification-acceptance.zh.md)。
- 实现已提交到本地 `e4a728e`／`bc90bf0`，未推送。本验证会话未重跑 compile／lint／test。

## 最近交接

### 2026-09-30 — macOS 验证与自用验收

维护者 `/goal` 完成全部剩余验证与接收。隔离 VS Code 1.139.1：双窗口 F5／安装版各两个 `recovery-v1/windows/<uuid>/` 自有 `pi` child；SIGKILL 一个扩展宿主后受害域 `child-exited`、兄弟仍 `owned`。新 VSIX 写入无 `apiKey` 的 `live-loopback` 并收到 `live-endpoint-ok`；GitHub Copilot 登录显示设备码并打开浏览器（隔离 `auth.json` 未写入令牌）。[ADR 0005](docs/decisions/0005-custom-endpoint-file.zh.md) Accepted。PRD 作为**自用 macOS 安装版** Accepted；standing non-goals 仍排除。Windows 仍范围外。无 Git 提交。

### 2026-09-30 — 停车场清空

维护者 `/goal` 完成停车场全部任务。WI-058 每窗口恢复域已实现并关闭，ADR 0009 Accepted。侧栏质感讨论按 WI-025／skill 结案，不搬 Claude Code 珊瑚色。审查剩余 11 文件结案（生产文案已在 WI-058 覆盖；其余为预览专用）。范围外队列升格为 standing non-goals。

## 停车场

无未完成实现项。下列能力保持 standing non-goals，不据此自动新建或实施 WI：额外扩展生态、编辑区 Chat Participant、remote／multi-root、额外平台、无产品依据的 delta 优化、全局启动默认持久化、跳过审批、图片／PDF／表格／语法高亮、历史回滚、框架更换、公开发布。自用 PRD 与 ADR 0005 已 Accepted。侧栏质感见已结案[讨论](docs/discussions/2026-09-28-claude-code-ui-comparison.zh.md)。源码审查不重启逐断言扫描。

## 已完成 WI 索引

完整编号索引见 [归档](docs/archive/2026-09-29-closed-wi-index.zh.md)。现行六项 gate Accepted，见 ADR 0001／0004。

| WI | 结果 | 完成／验收 | 历史 |
|----|------|------------|------|
| WI-058 | 每窗口独立恢复域；ADR 0009 Accepted | 2026-09-30 代理接受；双窗口 F5／安装已补录 | [记录](docs/archive/2026-09-30-wi-058-macos-acceptance.zh.md) |
| WI-057 | 已保存默认应用顺序抽出；用户可见规则冻结（ARCH-02） | 2026-09-30 代理按完成剩余任务的 goal 接受；无 gate／ADR | [记录](docs/archive/2026-09-30-wi-057-macos-acceptance.zh.md) |
