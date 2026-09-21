# WI-004 Prepare — 固定 pi `0.85.1` RPC 证据

[English](2026-09-21-wi-004-rpc-evidence-0.85.1.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-21-wi-004-rpc-evidence-0.85.1.md](2026-09-21-wi-004-rpc-evidence-0.85.1.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-21

- 类型：讨论
- 状态：Accepted（证据记录）
- 创建：2026-09-21
- 权威：**仅作背景** — 不授权 Build、不关闭 gate，不凌驾于 [`ACTIVE.md`](../../ACTIVE.md) 或 Draft PRD

## 目的

为 WI-004（`prompt` + 助手 `text_delta` 流式、`--no-tools` 启动）记录**与固定版本一致**的公开文档证据。单独引用上游 `main` 链接不能证明已 pin 的 npm 包行为。

## 固定版本与可复现性

| 来源 | 证据 |
|------|------|
| `package.json` / `package-lock.json` | npm registry 的 `@earendil-works/pi-coding-agent@0.85.1` |
| 安装后的包（`npm ci` / `npm install` 之后） | `node_modules/@earendil-works/pi-coding-agent/package.json` 中 `"version": "0.85.1"` |
| Git 标签（只读对照） | [pi `v0.85.1` — `packages/coding-agent/docs/rpc.md`](https://github.com/earendil-works/pi/blob/v0.85.1/packages/coding-agent/docs/rpc.md) |

本记录是对固定版本的**文档调研**，不是 pi-vscode 内 WI-004 聊天的 F5 端到端验证。

## WI-004 相关的 RPC 命令与事件

来自 `0.85.1` 包内 **`rpc.md`**（**Prompting → `prompt`** 与 **Event Types / `message_update`** 等节）：

| 主题 | 文档行为（0.85.1） | WI-004 用途 |
|------|----------------------|-------------|
| `prompt` | 命令响应在 prompt 被接受、入队或处理后发出；接受后事件**异步**继续 | 宿主仅将 `response.success` 视为接受，不代表回合结束 |
| `prompt` 响应 | `success: true` = 已接受/入队/已处理；`success: false` = **接受前**拒绝；接受后失败走事件流 | 有界错误展示；接受后失败不会对同一 request id 再发 response |
| `turn_end` | 回合结束（含助手消息与工具结果） | WI-004 提案中用于停止 UI 流式增长的首选边界 |
| `message_update` | 流式更新；`assistantMessageEvent.type` 含带 `delta` 的 `text_delta` | 映射为宿主拥有的 transcript，再投影到 webview |
| `agent_settled` | 会话级运行完全落定；无自动重试/压缩/排队续跑 | 可选的更严边界；WI-004 提案先采用 `turn_end` — Build 时确认是否两者都需要 |

`text_delta` 示例（摘自 `rpc.md`，略）：

```json
{
  "type": "message_update",
  "assistantMessageEvent": {
    "type": "text_delta",
    "contentIndex": 0,
    "delta": "Hello "
  }
}
```

**Prepare 范围外（延期）：** `steer` / `followUp`、图片、流式中的扩展命令、toolcall delta、压缩/重试事件、`abort`。

## `--no-tools` CLI 标志（0.85.1）

在 REQ-006 审批 UI 未实现前，WI-004 提案在产品 RPC 子进程上增加公开 `--no-tools`。

| 来源 | 说明 |
|------|------|
| [`usage.md` — Tool Options](https://github.com/earendil-works/pi/blob/v0.85.1/packages/coding-agent/docs/usage.md)（`--no-tools`、`-nt`） | 禁用**全部**工具 |
| [`settings.md` — tools 小节](https://github.com/earendil-works/pi/blob/v0.85.1/packages/coding-agent/docs/settings.md) | `--no-tools` 禁用所有工具（与 `--tools` 白名单、`--no-builtin-tools` 并列） |

这是**产品安全切片**，不是沙箱承诺。拒绝项目资源（WI-006/007）与禁用工具仍是不同维度。

## 限制与待验证项

- 本 Prepare 仅核对 **`0.85.1` 公开文档**，未在 pi-vscode 中实发 `prompt` 验证。
- 不关闭 `gate-session-streaming`、`gate-webview-trust`、`gate-runtime-host`。
- Build 仍须按 [`ACTIVE.md`](../../ACTIVE.md) 补齐 [`webview-messages`](../reference/webview-messages.zh.md) 聊天 Outline、严格 allowlist 测试，以及并发/迟到事件处理。

## 链接

- 当前 WI：[`ACTIVE.md`](../../ACTIVE.md)（WI-004 Prepare；未批准 Build）
- PRD 切片：[REQ-004 WI-004 提案切片](../product-requirements.zh.md#req-004--可观察的任务执行)
- 集成 playbook：[pi-integration § pi VS Code](../guides/agent/pi-integration.zh.md#pi-vs-code已选方案与证据)
