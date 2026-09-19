# pi VS Code

[English](README.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[README.md](README.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-19

- 类型：指南
- 状态：Accepted
- 创建：2026-09-19
- 权威：本产品仓库入口

面向 [pi](https://github.com/earendil-works/pi) coding agent 的 VS Code 扩展：**边写代码边在侧栏聊天**。默认 **左侧保留资源管理器**，在支持时于 **右侧辅助侧栏** 打开 pi——布局对标 Copilot Chat / Codex。

> **状态：** WI-001 脚手架——可 F5 调试的扩展与辅助侧栏占位 UI；runtime RPC 探测见 `npm run spike:runtime`。

## 文档

- 当前工作：[`ACTIVE.md`](ACTIVE.md)
- Agent：[`AGENTS.md`](AGENTS.md)
- 架构：[`docs/architecture/vscode-extension-architecture.zh.md`](docs/architecture/vscode-extension-architecture.zh.md)
- 索引：[`docs/README.zh.md`](docs/README.zh.md)

## 开发

```bash
npm install
npm run compile
npm run spike:runtime   # pi RPC get_state probe (no LLM)
```

**F5**（Run Extension）启动扩展开发宿主；在支持 `secondarySidebar` 的 VS Code 上于 **辅助侧栏（右）** 打开 **pi** 视图。

## 检查

```bash
npm run lint
npm run compile
npm run docs:verify
```

## 布局（产品默认）

```text localized
[ 主侧栏：资源管理器 ]  [ 编辑区：你的文件 ]
                        [ 辅助侧栏：pi 聊天 webview ]
```

不支持 `secondarySidebar` 的宿主上，同一 webview 可能先出现在主侧栏，用户可拖到右侧（在发布说明中记录）。
