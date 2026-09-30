# pi-vscode — 当前工作（跨会话入口）

本文件维护当前任务与交接。规则见 [AGENTS](AGENTS.zh.md)、[内核](AGENTS.kernel.zh.md)与[协作指南](docs/guides/agent-collaboration.zh.md)。

## Agent 会话契约（摘要）

| 步骤 | Agent |
|---|---|
| 开场 | 必要阅读、Git 基线、当前 WI／批准／Gate／PRD 与验收核对。 |
| 提案 | Prepare 记录范围与 PRD 判定；Build 须批准；WIP 最多 1。 |
| 建造 | 按批准实现并实际验证；模拟／runtime／F5／安装分别取证。 |
| 收尾 | 记录验收身份、检查结果与未决项；按规则归档并清理资源。 |

## 当前无活动 WI（WIP=0）

已批准的实现与验收任务均已完成。新增工作须按协作指南记录范围与批准；历史授权仅适用于原切片。

## 当前焦点与未决项

无待处理项。[PRD](docs/product-requirements.zh.md) 已作为 **macOS 本机 VS Code 自用安装版 VSIX** Accepted；验收为代理受托身份，不是维护者亲自测试。范围、证据与限制见 [macOS 验证记录](docs/archive/2026-09-30-macos-verification-acceptance.zh.md)。

## 停车场

无待办。以下保持 standing non-goals，不自动开 WI：额外扩展生态、编辑区 Chat Participant、remote／multi-root、额外平台（含 Windows 实机 F5／安装版 VSIX 与 Cursor 验收）、无产品依据的 delta 优化、全局启动默认持久化、跳过审批、图片／PDF／表格／语法高亮、历史回滚、框架更换、公开发布。已停止的逐断言审查不自动重启。

## 最近交接

### 2026-09-30 — 文档同步与入口清理

中英文 README 已同步自用 macOS Accepted 状态；本入口合并重复状态说明，移出 Git 快照、详细验收交接与重复 WI 表。历史补入既有[压缩归档](docs/archive/2026-09-30-active-completed-compaction.zh.md)。本次仅改文档，未重跑 compile／lint／test，未提交或推送。`npm run docs:verify`、`npm run docs:health` 与 `git diff --check` 均通过（0 错误／提示）。

## 已完成 WI 索引

编号、验收记录与历史限制见[已关闭 WI 索引](docs/archive/2026-09-29-closed-wi-index.zh.md)；现行架构 gate 状态见 [gate 表](docs/reference/architecture-gates.zh.md)。
