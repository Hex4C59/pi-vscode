# ADR 0001：构建与扩展 baseline（WI-001）

[English](0001-build-baseline.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[0001-build-baseline.md](0001-build-baseline.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-23

- 类型：Decision
- 状态：Accepted
- 创建：2026-09-19
- 接受：2026-09-19
- Gate：`gate-extension-host-baseline`、`gate-sidebar-chat-shell`、`gate-runtime-host`
- 取代：无
- 相关：[vscode-extension-architecture](../architecture/vscode-extension-architecture.zh.md)、[归档 WI-001 记录](../archive/2026-09-21-closed-wi-history.zh.md#wi-001)

## 背景

WI-001 要求可 **F5 调试** 的 VS Code 扩展，pi 聊天位于 **辅助侧栏** 且仅为 **占位 UI**，并证明上游 pi runtime 能启动、完成一次 RPC 往返、干净退出——**不是** 面向用户的聊天产品。

维护者于 **2026-09-19** 接受 F5 目视验收与 runtime spike。

## 决策

1. **Extension host baseline**：TypeScript strict（`tsc --noEmit`），**esbuild** 打包至 `dist/extension.js`；`package.json` 的 `"main"` 指向该文件；**VS Code engine** `^1.85.0`；质量脚本 `npm run compile`、`npm run lint`、`npm run docs:verify`；F5 经 `.vscode/launch.json` 与默认 build task。
2. **侧栏聊天壳**：在 `viewsContainers.secondarySidebar` 注册 `WebviewViewProvider`（容器 `pi-vscode`，视图 `pi-vscode.chat`）；占位 HTML、严格 CSP、**无脚本**、**无密钥**、**webview 内无 pi SDK**；WI-001 阶段 `enableScripts: false`。
3. **Runtime host（spike / 后续 adapter 方向）**：WI-001 证据与初始 adapter 方向采用 **子进程 RPC**——启动 `@earendil-works/pi-coding-agent` 的 `dist/bundle/cli.js`，参数 `--mode rpc --no-session`，经 LF-only JSONL 发送一次 **`get_state`**，超时内 **SIGTERM**（见 `src/adapter/runtime/pi-rpc-probe.ts`、`npm run spike:runtime`）。**不得** 在 extension host 内重写 pi agent 循环。
4. **固定依赖**：**`@earendil-works/pi-coding-agent@0.85.1`**（npm  registry；生产构建不得依赖未声明的 `file:` 指向 `../pi`）。
5. **源码布局**：按架构文档 `src/extension/`、`src/webview/`、`src/adapter/`；spike 原入口为 `src/spike-runtime.ts` → `dist/spike-runtime.js`。2026-09-23，维护者将入口迁至 [`scripts/spikes/spike-runtime.mjs`](../../scripts/spikes/spike-runtime.mjs)；esbuild 仍生成 `dist/spike-runtime.js`，供 `npm run spike:runtime` 执行。探针实现与运行行为不变。

## 明确不在范围

关闭上述三个 gate **不** 表示已交付用户聊天、流式 UI、会话列表、模型选择或版本化 webview `postMessage` 产品协议。这些仍由 **`gate-webview-trust`**、**`gate-project-trust`**、**`gate-session-streaming`**（Open）覆盖。

## 后果

- 在产品功能中，密钥与 pi SDK 须留在 **extension host**，直至未来 Accepted ADR 变更信任边界。
- 扩展内长生命周期 pi 会话 **不属于** 本 baseline；WI-002+ 将在本脚手架上增加桥接与流式能力。
- 升级 `@earendil-works/pi-coding-agent` 须重跑 `npm run spike:runtime` 并经维护者评审后再改 `package.json` 中的 pin。

## Spike 证据

WI-001 历史验证摘要，于 2026-09-19 从独立 spike 笔记合并。本次整理未重跑探针，也未改变已接受的决策。

- **日期与包版本**：2026-09-19；`@earendil-works/pi-coding-agent@0.85.1`。
- **目标**：为基线验证运行时启动、一次 RPC 请求／响应及关闭。
- **命令与已记录结果**：`npm run spike:runtime` → **OK**（`get_state succeeded; process exited within timeout`）。
- **已记录机制**：启动 `dist/bundle/cli.js --mode rpc --no-session`，经 LF JSONL 发送 `get_state`，随后在记录的 5 秒超时限制内 SIGTERM。源码入口：[运行时探针](../../src/adapter/runtime/pi-rpc-probe.ts)与 [JSONL 辅助模块](../../src/adapter/runtime/jsonl.ts)；当前源码不是当时运行的不可变快照。
- **已记录范围**：无 LLM/provider 调用。不证明面向用户的聊天、流式、工具审批、项目资源信任或长生命周期会话管理。
- **证据限制**：原笔记仅保留成功摘要，没有原始执行日志或准确的 OS／Node／VS Code 版本。此处不事后重构这些细节，也不据此推断网络隔离保证。
- **维护者验收**：F5 扩展开发宿主的辅助侧栏显示 Pi 占位视图；维护者于 2026-09-19 接受该目视检查与运行时 spike。Gate 关闭由本 ADR 与 [gate 表](../reference/architecture-gates.zh.md)记录。
