# ADR 0001：构建与扩展 baseline（WI-001）

[English](0001-build-baseline.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[0001-build-baseline.md](0001-build-baseline.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-19

- 类型：Decision
- 状态：Accepted
- 创建：2026-09-19
- 接受：2026-09-19
- Gate：`gate-extension-host-baseline`、`gate-sidebar-chat-shell`、`gate-runtime-host`
- 取代：无
- 相关：[vscode-extension-architecture](../architecture/vscode-extension-architecture.zh.md)、[WI-001](../../ACTIVE.md)、[wi-001-runtime-spike](../discussions/wi-001-runtime-spike.md)

## 背景

WI-001 要求可 **F5 调试** 的 VS Code 扩展，pi 聊天位于 **辅助侧栏** 且仅为 **占位 UI**，并证明上游 pi runtime 能启动、完成一次 RPC 往返、干净退出——**不是** 面向用户的聊天产品。

维护者于 **2026-09-19** 接受 F5 目视验收与 runtime spike。

## 决策

1. **Extension host baseline**：TypeScript strict（`tsc --noEmit`），**esbuild** 打包至 `dist/extension.js`；`package.json` 的 `"main"` 指向该文件；**VS Code engine** `^1.85.0`；质量脚本 `npm run compile`、`npm run lint`、`npm run docs:verify`；F5 经 `.vscode/launch.json` 与默认 build task。
2. **侧栏聊天壳**：在 `viewsContainers.secondarySidebar` 注册 `WebviewViewProvider`（容器 `pi-vscode`，视图 `pi-vscode.chat`）；占位 HTML、严格 CSP、**无脚本**、**无密钥**、**webview 内无 pi SDK**；WI-001 阶段 `enableScripts: false`。
3. **Runtime host（spike / 后续 adapter 方向）**：WI-001 证据与初始 adapter 方向采用 **子进程 RPC**——启动 `@earendil-works/pi-coding-agent` 的 `dist/bundle/cli.js`，参数 `--mode rpc --no-session`，经 LF-only JSONL 发送一次 **`get_state`**，超时内 **SIGTERM**（见 `src/adapter/pi-rpc-probe.ts`、`npm run spike:runtime`）。**不得** 在 extension host 内重写 pi agent 循环。
4. **固定依赖**：**`@earendil-works/pi-coding-agent@0.85.1`**（npm  registry；生产构建不得依赖未声明的 `file:` 指向 `../pi`）。
5. **源码布局**：按架构文档 `src/extension/`、`src/webview/`、`src/adapter/`；spike 入口 `src/spike-runtime.ts` → `dist/spike-runtime.js`。

## 明确不在范围

关闭上述三个 gate **不** 表示已交付用户聊天、流式 UI、会话列表、模型选择或版本化 webview `postMessage` 产品协议。这些仍由 **`gate-webview-trust`**、**`gate-project-trust`**、**`gate-session-streaming`**（Open）覆盖。

## 后果

- 在产品功能中，密钥与 pi SDK 须留在 **extension host**，直至未来 Accepted ADR 变更信任边界。
- 扩展内长生命周期 pi 会话 **不属于** 本 baseline；WI-002+ 将在本脚手架上增加桥接与流式能力。
- 升级 `@earendil-works/pi-coding-agent` 须重跑 `npm run spike:runtime` 并经维护者评审后再改 `package.json` 中的 pin。

## Spike 证据

- **命令**：`npm run spike:runtime` → OK（`get_state succeeded; process exited within timeout`）。
- **记录**：[wi-001-runtime-spike.md](../discussions/wi-001-runtime-spike.md)。
- **维护者**：F5 扩展开发宿主；辅助侧栏 Pi 视图，仅占位文案。
