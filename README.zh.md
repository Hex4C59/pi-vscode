# pi VS Code

[English](README.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[README.md](README.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-19

面向 [pi](https://github.com/earendil-works/pi) coding agent 的 VS Code 扩展：**边写代码边在侧栏聊天**。默认 **左侧保留资源管理器**，在支持时于 **右侧辅助侧栏** 打开 Pi——布局对标 Copilot Chat / Codex。

本项目为**开源**（[MIT](LICENSE)），由社区维护，与 Earendil Works 无隶属关系；**pi** 为独立上游产品。

## 当前状态

| 已有 | 尚未 |
|------|------|
| 可 F5 调试的扩展壳 | 面向用户的聊天或流式 UI |
| 辅助侧栏占位 webview | Marketplace / Open VSX 发布 |
| Runtime RPC 探测（`npm run spike:runtime`） | 模型选择、会话列表 |

见 [CHANGELOG.md](CHANGELOG.md) 与 Accepted ADR [`0001-build-baseline`](docs/decisions/0001-build-baseline.zh.md)。

## 安装（从源码）

**尚无已发布 VSIX。** 本地运行：

```bash
git clone https://github.com/Hex4C59/pi-vscode.git
cd pi-vscode
npm install
npm run compile
```

用 VS Code 打开本目录并 **F5**（Run Extension）；在支持 `secondarySidebar` 的构建上于 **辅助侧栏** 打开 **Pi** 视图。

需要 **Node.js 22+** 与 **VS Code 1.85+**（见 `package.json` 的 `engines.vscode`）。

## 开发

```bash
npm install
npm run compile
npm run spike:runtime   # pi RPC get_state probe (no LLM)
```

## 检查

```bash
npm run lint
npm run compile
npm run docs:verify
```

## 文档

- 当前工作：[`ACTIVE.md`](ACTIVE.md)
- 参与贡献：[`CONTRIBUTING.zh.md`](CONTRIBUTING.zh.md)（[English](CONTRIBUTING.md)）
- 安全：[`SECURITY.zh.md`](SECURITY.zh.md)（[English](SECURITY.md)）
- Agent：[`AGENTS.zh.md`](AGENTS.zh.md)
- 架构：[`docs/architecture/vscode-extension-architecture.zh.md`](docs/architecture/vscode-extension-architecture.zh.md)
- 索引：[`docs/README.zh.md`](docs/README.zh.md)

## 布局（产品默认）

```text localized
[ 主侧栏：资源管理器 ]  [ 编辑区：你的文件 ]
                        [ 辅助侧栏：Pi 聊天 webview ]
```

不支持 `secondarySidebar` 的宿主上，同一 webview 可能先出现在主侧栏，用户可拖到右侧（在发布说明中记录）。

## 许可证

[MIT](LICENSE) — Copyright (c) 2026 Hex4C59
