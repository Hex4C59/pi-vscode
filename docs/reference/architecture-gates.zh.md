# 架构 gate 跟踪表

[English](architecture-gates.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[architecture-gates.md](architecture-gates.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-19

- 类型：Reference
- 状态：Living
- 创建：2026-09-19
- 上次评审：2026-09-19（ADR 0001）
- 权威范围：哪些架构风险须 spike + Accepted ADR 后才视为已交付
- 相关：[`../architecture/vscode-extension-architecture.zh.md`](../architecture/vscode-extension-architecture.zh.md)、[`ACTIVE.md`](../../ACTIVE.md)

状态取值：`Open` | `In spike` | `Accepted`

| Gate ID | 主题 | 状态 | ADR | ACTIVE |
|---------|------|------|-----|--------|
| `gate-extension-host-baseline` | 扩展可激活、F5 调试、打包成功 | `Accepted` | [0001](../decisions/0001-build-baseline.zh.md) | — |
| `gate-sidebar-chat-shell` | 辅助侧栏 Webview View（回退主侧栏）；仅占位 UI | `Accepted` | [0001](../decisions/0001-build-baseline.zh.md) | — |
| `gate-runtime-host` | pi SDK 或子进程：启动、一次 RPC 往返、干净退出 | `Accepted` | [0001](../decisions/0001-build-baseline.zh.md) | — |
| `gate-webview-trust` | 版本化 `postMessage`、CSP、webview 无密钥 | `Open` | — | — |
| `gate-project-trust` | 工作区打开映射到 pi 项目 trust（仅公开 API） | `Open` | — | — |
| `gate-session-streaming` | 经 webview 桥接的端到端聊天流式 | `Open` | — | — |

关闭 gate 须在 ADR 列链接 **Accepted** ADR。见 [`../decisions/README.zh.md`](../decisions/README.zh.md)。

**WI-001：** 已由 Accepted ADR [0001-build-baseline](../decisions/0001-build-baseline.zh.md)（2026-09-19）关闭。面向用户的聊天仍由 `gate-session-streaming` 约束。
