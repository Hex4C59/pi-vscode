# Webview 消息（WI-002 / WI-006 / WI-004 聊天切片）

[English](webview-messages.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[webview-messages.md](webview-messages.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-21

- 类型：Reference
- 状态：Outline
- 创建：2026-09-19
- 契约 ID：`contract-webview-messages`
- 所有者：扩展宿主（`src/extension/`）；UI 发送方位于 `src/webview/`
- Gate：`gate-webview-trust`（Open）

> 连通性、工作区选择、宿主拥有的 pi RPC 子进程（WI-007）及最小纯文本聊天切片（WI-004）。不暴露密钥、Webview 内 pi SDK、文件系统访问或通用宿主操作。信任与会话流式 gate 仍保持开放。

## 消息封装与允许列表

仅普通对象、数字 `version: 1`，且自身字段必须与下列定义完全一致。宿主先校验 `unknown` 再行动。未知类型／版本、多余字段、畸形值及过期代次不能执行操作。

- Webview → 宿主 `ping`：`{ version: 1, type: "ping" }`；回复 `{ version: 1, type: "pong" }`。
- Webview → 宿主 `getWorkspaceState`：`{ version: 1, type: "getWorkspaceState" }`；同步当前宿主投影。
- Webview → 宿主 `openFolder` / `manageTrust`：`{ version: 1, type: "openFolder" | "manageTrust", generation: number }`。
- Webview → 宿主 `chooseResources`：`{ version: 1, type: "chooseResources", generation: number, choice: "allow" | "decline" }`。
- Webview → 宿主 `sendChat`（WI-004）：`{ version: 1, type: "sendChat", generation: number, text: string }`。`text` 去空白后非空且最多 `8000` 字符。仅当 `runtime === "ready"`、代次匹配、工作区动作非 `busy` 且无进行中的聊天回合时允许。
- 宿主 → Webview `workspaceState`：`{ version: 1, type: "workspaceState", generation, status, folder, choice, busy, error, runtime, runtimeDetail, messages, chatBusy, chatError }`。代次为非负安全整数。状态为 `no-folder`、`multi-root`、`remote`、`non-file`、`untrusted` 或 `eligible`。Folder 为 null 或单目录的 `{ name, path }`。Choice 为 null、`allow` 或 `decline`；busy 为布尔值；error 为 null 或固定有界的用户重试提示（从不包含原始异常）。`runtime` 为 `not-started`、`starting`、`ready`、`stopping` 或 `error`；`runtimeDetail` 在 `runtime` 为 `error` 时为有界宿主诊断，否则为 null（从不包含原始异常转储）。`messages` 为宿主拥有的有序 `{ role: "user" | "assistant", text: string }` 数组（流式时助手文本可增长）。`chatBusy` 在 prompt 已接受且回合未结束前为 true。`chatError` 为 null 或有界聊天失败提示（从不包含原始 stderr 或密钥）。

拒绝畸形消息时不回复。过期或不合格的有效操作仅重新同步状态。Ping 无业务副作用。任何动作均不接受 Webview 提供的路径、命令、信任布尔值或运行时请求。

## 信任与生命周期

- `PiChatViewProvider` 拥有内存工作区身份、单调代次、选择和订阅。观察目录变更及信任授予；每次操作重新读取实际工作区目录、`workspace.isTrusted` 和 `env.remoteName`。即使 URI 为 file，远程宿主也阻断。多根和非 file 工作区阻断。仅已信任的单个本地 file 目录可选择资源。
- 工作区或资格变化清空选择并递增代次；重复读取及视图重建保留选择。扩展宿主重载重置全部状态。VS Code 撤销信任会重载窗口；宿主还在每次请求检查信任失效。不使用设置、信任文件、密钥或 Webview 存储。
- `openFolder` 仅空的本地窗口（`no-folder`）可用。打开原生单目录选择器，随后重新检查代次与资格，再使用原生 file URI 调用公开的 `workspace.updateWorkspaceFolders(0, 0, { uri: selected })`。取消不改变状态；返回 false 或异常时显示有界的重试／File > Open Folder 恢复提示。返回 true 后保持忙碌，直到权威工作区变更或宿主重启，以防重复更新；这仅表示请求获受理：UI 不伪造目录或成功状态。添加首个目录可能重启扩展宿主而不触发目录变更事件；新 provider 构造函数读取权威工作区状态，资源选择初始为空。`manageTrust` 仅其他条件符合的未信任目录可用，仅调用 `workbench.trust.manage`，不自行授予信任。
- 编辑器标题导航图标与命令面板命令 `pi-vscode.focusChat` 先显示现有 Pi 容器，再聚焦 `pi-vscode.chat`；不切换可见性，也不创建另一个面板。默认仍为 `secondarySidebar`。编辑器标题入口使用分别适配浅色／深色的 Pi SVG；没有编辑器标题时仍可使用命令面板。
- 原生动作在活动视图中串行。工作区变化、视图替换／释放或 provider 释放使待决工作失效。后续命令或状态更新前再次检查结果。失败显示固定重试提示；取消不是错误。发送失败不会泄露异常；重开视图重新同步。
- 允许／拒绝在工作区身份或资格变化前可修改且仅内存保存。在 eligible 工作区作出选择后，扩展宿主以公开 `--approve` 或 `--no-approve` 与 `--no-tools` 启动 pi RPC（仅当次运行）；更改选择会重启运行时。允许提示项目扩展／包执行；拒绝仍可能按上游文档读取 AGENTS.md 与用户／全局资源。两者均非沙箱或工具授权。
- WI-004 聊天：`runtime === "ready"` 时宿主可通过 RPC 发送有界 `prompt`，将 `text_delta` 投影到 `messages`，直至 `turn_end`。Webview 不导入 pi、不 spawn 进程、不发任意 RPC。Transcript 仅内存；工作区身份／资格变化、运行时停止／重启或 provider dispose 时清空 `messages`，并拒绝陈旧 `sendChat` 与旧运行时会次的迟到 RPC 事件。
- 视图替换／释放清理视图监听；provider 释放清理工作区监听。每页有新脚本 nonce 和限制性 CSP。名称和路径仅随状态消息传输，使用 `textContent` 呈现，不插入 HTML。原生按钮有明确标签、键盘激活和可见焦点；状态／错误使用实时区域。
- 这不代表完整聊天信任验证或 gate 关闭。原生对话框、信任／重载、远程宿主以及键盘／读屏行为仍需在支持的 VS Code／分支中 F5 验证。
