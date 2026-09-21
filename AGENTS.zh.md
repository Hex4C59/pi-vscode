# AGENTS.md

[English](AGENTS.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[AGENTS.md](AGENTS.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-19

**pi VS Code** 的产品叠加层。通用规则见 [`AGENTS.kernel.zh.md`](AGENTS.kernel.zh.md)（英文：[`AGENTS.kernel.md`](AGENTS.kernel.md)）——从 engineering-template 复制该对，内核升级时保持同步。

详细 playbook 在 `docs/guides/agent/`（见 **加载地图**）。

## 权威栈

冲突时：(1) `AGENTS.kernel.md` 与 agent playbook；(2) `Accepted` 后的 `docs/product-requirements.md`；(3) `docs/architecture/vscode-extension-architecture.md` 的结构与所有者；(4) `ACTIVE.md`；(5) `docs/discussions/` 与 `docs/archive/` 仅作上下文。

## 项目事实

- 在用户写代码时，于 **侧栏 Webview** 中呈现 [pi](https://github.com/earendil-works/pi)；默认 **辅助侧栏（右侧）**，**主侧栏（左）保留资源管理器**（对标 Copilot / Codex 布局）。
- 初始化阶段：勿将计划功能描述为已交付（见内核）。
- **目标平台：** VS Code 1.85+（WI-001 中确定 `engines.vscode`）；Cursor/Windsurf 等尽力兼容；`secondarySidebar` 需较新 VS Code——须文档化回退方案。
- **同级仓库（除非用户要求，否则只读）：** 上游 `../pi`；参考客户端 pi-desktop（产品目标与 pi 边界，**不**照搬 Electron IPC）。
- **生产构建**不得依赖未声明的 `file:` / workspace 指向 `../pi`；发布使用 pi 正式 npm 版本。本地 `../pi` 仅 spike 与读源码。
- **上游行为**以 pi 包文档与公开 API 为准——勿臆测会话文件布局或内部模块。

## 不可协商（L0）— 产品安全

- **密钥**仅 extension host（`SecretStorage` 等），不得进入 webview HTML、webview 存储或发往 webview 的 `postMessage`。
- **Webview** 仅展示：无 Node、无 pi SDK、无直连 `fs`/`child_process`。host 校验入站消息；真实聊天前须有允许列表、版本化协议（`gate-webview-trust`）。
- **勿在本仓重实现** pi agent 循环、provider 或压缩——仅通过文档化 SDK/RPC 编排（`docs/guides/agent/pi-integration.md`）。
- **会话存储：** 除非 Accepted ADR 明确允许，会话功能不随意读写 pi 会话文件；用 SDK/RPC 会话 API。
- **沙箱诚实性：** 扩展不是对抗恶意工作区内容的安全边界；工具与 shell 仍由 pi 与用户信任设置决定。

内核 L0（提交、 judgment）仍以 `AGENTS.kernel.md` 为准。

## 分层模型（L1 摘要）

- **UI：** 侧栏 `WebviewView`（优先辅助侧栏）— 聊天 UI、流式展示、临时 UI 状态。
- **Host：** VS Code extension host — 激活、命令、配置、密钥、工作区策略、webview 生命周期、消息桥。
- **Adapter：** pi SDK 或子进程 RPC ↔ 供 host/webview 使用的领域事件。
- **Runtime：** pi coding-agent（上游包或子进程）。

产品流式/生命周期规则：若有 `docs/guides/agent/boundaries.md`。

## ACTIVE 会话配对

维护者可仅 @ **`ACTIVE.md`**（或说「继续 pi VS Code」）。将它视为当前工作入口，而不是自包含历史日志。完整读取其中的当前 WI，再仅按加载地图展开与任务有关的路径；除非当前问题需要历史证据，否则归档链接只作背景。Agent 义务与渐进加载协议见 `AGENTS.kernel.md` § ACTIVE 会话配对及 `docs/guides/agent-collaboration.zh.md`。

## 对话记录

在讨论形成阶段性结论、方案获得确认及 WI 收尾时，遵循[协作指南 §7](docs/guides/agent-collaboration.zh.md#7-agent-义务)，包括仅讨论的会话。Agent 负责分类、记录和范围内归档；维护者负责决策与验收。落盘前阅读该指南，不要求维护者选择目录或重复批准常规记录整理。

## 开始前

遵循 `AGENTS.kernel.md` § 开始前，以及本仓 `package.json` 脚本与测试（WI-001 加入代码后）。

## 加载地图

基础必读由 `AGENTS.kernel.md` 规定；下表增加的是**条件路由**，不是从头读到底的清单。当任务范围、约束、契约与证据已经明确时停止展开链接；证据缺失或冲突时必须报告，不得猜测。

| 若你正在… | 先读 |
|-----------|------|
| 开始实现 | `ACTIVE.md` 当前 WI，再完整阅读 `docs/guides/agent-collaboration.zh.md` |
| TypeScript / 工具链 | `docs/guides/agent/typescript.md` |
| 修改行为／修复回归／添加或移动测试／测试收集 | `docs/guides/agent/testing.zh.md` |
| pi SDK / RPC / spike | `docs/guides/agent/pi-integration.md` |
| 文档健康 / WI 收尾 | [`docs/guides/documentation-health.zh.md`](docs/guides/documentation-health.zh.md) |
| 判断 / 做不做 | `docs/guides/agent/judgment.md` |
| 架构 / 边界 / 新 API 或持久化 | `docs/guides/architecture-governance.md`、`docs/architecture/vscode-extension-architecture.md` |
| 用户可见行为 | `docs/product-requirements.md`、架构文档 |
| Gate | `docs/reference/architecture-gates.md` |
| 创建 commit 或 commit message | [`docs/git-commit-convention.md`](docs/git-commit-convention.md)（message 仅英文） |

索引：`docs/guides/agent/README.md`。

## 任务完成

遵循 `AGENTS.kernel.md` § 任务完成。产品特有：`npm run docs:verify`；有扩展代码后运行 `npm run compile`、`npm run lint`（WI-001）。

## 上游指针

- pi  monorepo（本地只读）：`../pi`
- 集成 playbook：`docs/guides/agent/pi-integration.md`
- 固定 pi 包版本：WI-001 spike 后在 Accepted ADR 中记录（`gate-runtime-host`）
