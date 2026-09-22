# Webview 消息（工作区、聊天、模型设置与受控执行）

[English](webview-messages.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[webview-messages.md](webview-messages.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-22

- 类型：Reference
- 状态：Outline
- 创建：2026-09-19
- 契约 ID：`contract-webview-messages`
- 所有者：扩展宿主（`src/extension/`）；UI 发送方位于 `src/webview/`
- Gate：`gate-webview-trust`（Open）

> 连通性、工作区选择、宿主拥有的 pi RPC 子进程（WI-007）、纯文本聊天（WI-004）、模型／thinking 设置（WI-008／WI-009）及受控执行（WI-010）。不暴露密钥、Webview 内 pi SDK、文件系统访问或通用宿主操作。信任与会话流式 gate 仍保持开放。

## 消息封装与允许列表

仅普通对象、数字 `version: 1`，且自身字段必须与下列定义完全一致。宿主先校验 `unknown` 再行动。未知类型／版本、多余字段、畸形值及过期代次不能执行操作。

- Webview → 宿主 `ping`：`{ version: 1, type: "ping" }`；回复 `{ version: 1, type: "pong" }`。
- Webview → 宿主 `getWorkspaceState`：`{ version: 1, type: "getWorkspaceState" }`；同步当前宿主投影。
- Webview → 宿主 `openFolder` / `manageTrust`：`{ version: 1, type: "openFolder" | "manageTrust", generation: number }`。
- Webview → 宿主 `chooseResources`：`{ version: 1, type: "chooseResources", generation: number, choice: "allow" | "decline" }`。
- Webview → 宿主 `sendChat`（WI-004）：`{ version: 1, type: "sendChat", generation: number, text: string }`。`text` 去空白后非空且最多 `8000` 字符。仅当 `runtime === "ready"`、代次匹配、工作区动作非 `busy`、`modelBusy` 为 false 且无进行中的聊天回合时允许。
- Webview → 宿主 `setThinkingLevel`（WI-008）：`{ version: 1, type: "setThinkingLevel", generation: number, level: string }`。`level` 须属于宿主投影的 `thinkingLevels` 且为有界 token 形状。仅当 `runtime === "ready"`、代次匹配、工作区非 `busy` 且 `modelBusy` 为 false 时允许。`chatBusy` 不禁止选择：流式期间只记录下一轮意图，不修改正在运行的模型／thinking 设置。
- Webview → 宿主 `setChatModel`（WI-008）：`{ version: 1, type: "setChatModel", generation: number, provider: string, modelId: string }`。`provider`／`modelId` 须为有界 token 且匹配宿主投影的 `availableModels` 项。资格同 `setThinkingLevel`。

拒绝畸形消息时不回复。过期或不合格的有效操作仅重新同步状态。Ping 无业务副作用。任何动作均不接受 Webview 提供的路径、命令、信任布尔值或运行时请求。

## 宿主状态投影

宿主发送 `version: 1, type: "workspaceState"`。完整字段／类型以 [`WorkspaceStateMessage`](../../src/extension/webviewMessages.ts) 为准；下表定义语义分组。UI 渲染此投影，不自行构造权威状态。

| 字段 | 语义与限制 |
|------|------------|
| `generation`, `status`, `folder` | 代次为非负安全整数；状态为 `no-folder`、`multi-root`、`remote`、`non-file`、`untrusted` 或 `eligible`；单目录为 `{ name, path }`，否则 folder 为 null。 |
| `choice`, `busy`, `error` | 选择为 null／`allow`／`decline`；busy 表示工作区动作未完成；error 为 null 或固定有界恢复提示，不含原始异常。 |
| `runtime`, `runtimeDetail` | 阶段为 `not-started`／`starting`／`ready`／`stopping`／`error`；失败详情为有界宿主诊断或 null，不含原始异常转储。 |
| `messages`, `chatBusy`, `chatError` | 宿主有序对话项 `{ role: "user" \| "assistant", text, id? }`，id 用于关联；提交期间起至会话结束／失败保持 busy。聊天错误有界，不直接转发 stderr 或凭证。 |
| `chatModel`, `thinkingLevel`, `thinkingLevels`, `availableModels` | 已应用模型展示名／档位可为 null；能力列表有界，模型最多 64 项 `{ provider, modelId, label }`。 |
| `pendingModel`, `pendingThinkingLevel` | null 或待应用模型目录项／有效档位；仅宿主内存意图，与已应用值区分。 |
| `modelBusy`, `modelError` | 加载目录、串行应用或恢复期间阻止发送和进一步选择；失败提示有界或为 null。 |
| `activities`, `approvals`, `grants`, `execution`, `controlledExecution` | 下节定义的执行投影；`controlledExecution: true` 描述所选配置，不证明就绪或 Gate 关闭。 |

## 受控执行契约

执行操作沿用上方消息封装规则，入站形状如下：

- `stopChat`：`{ version: 1, type: "stopChat", generation: number }`；仅聊天活动且尚未停止中时执行。
- `decideApproval`：`{ version: 1, type: "decideApproval", generation: number, id: string, decision: "once" | "session" | "deny" }`。
- `revokeGrant`：`{ version: 1, type: "revokeGrant", generation: number, id: string }`。

ID 非空且最多 100 字符。沿用精确自身字段校验、活动视图、代次及工作区 busy 检查。ID 只选择宿主已有待决请求／授权，不接受 Webview 提供的命令或路径。未知／过期决定不能复活已移除请求。仅当存在非 null 的可靠 scope 时，`session` 才创建授权；无 scope 不产生复用授权，UI 须仅提供允许一次。

执行投影中的字段：

- `activities`：最多 64 个宿主拥有的 `ActivityItem`：`{ id, kind: "thinking" | "tool", messageId, contentIndex?, toolCallId?, tool?, text, input?, status, truncated }`。Status 为 `thinking`、`preparing`、`executing`、`complete`、`failed` 或 `interrupted`。Thinking 按消息／内容索引关联，工具按 tool-call ID 关联。每项文本和展示参数最多 16,384 字符（项数限制同时约束总量）。文本或参数超限设置 `truncated`，工具更新保留该标记。64 项上限内预留稳定 `activity-overflow` 提示：额外活动只省略展示，不跳过执行／审批检查。UI 展示截断提示并按稳定 ID 增量更新 details，保留展开／焦点／滚动。`tool_execution_start` 投影为 `preparing`，不是副作用确认。`partialResult` 替换累计输出。`message_end` 校正最终正文／thinking；没有 thinking 时不合成。
- `approvals`：最多 8 个 `{ id, toolCallId, tool, input, scope: string | null, expiresAt }` 卡片。`input` 是完整 JSON 参数快照，最多 32,768 字符；过大或含凭证类字段在投影前拒绝。宿主／gate 默认超时 120 秒。拒绝、过期、取消及迟到回复均不授予权限。
- `grants`：最多 64 个 `{ id, scope }`。既有普通文件范围编码为 `[tool, canonicalPath]`；shell 为 `[tool, canonicalCwd, completeInput]`。精确匹配，不隐式授权目录／命令前缀。不存在／无法解析目标的 scope 为 null。查看／撤销影响后续调用，不撤销过去副作用。
- `execution`：`idle`、`waiting`、`thinking`、`awaiting-approval`、`executing`、`replying`、`stopping` 或 `failed`；这是展示状态，不是沙箱证据。`controlledExecution` 表示所选配置，不证明运行时就绪或 gate 已关闭。

`toolApproval.ts` 仅自动允许 canonical 路径位于工作区内的普通文件 `read`。搜索／列目录、编辑／写入、shell、外部路径仍询问；未知工具失败关闭。Windows 歧义路径不自动授权；realpath 检查覆盖符号链接／junction 越界，但不能消除检查与使用之间的竞态。同一运行会话的授权跨视图重建、普通 settled 与成功 Stop 保留；工作区／资格变化、运行时替换／断开、provider 释放取消请求并清空授权。

宿主在 `abortTask` 前取消待审批；adapter 取消未完成的对话等待，以有界超时先 `clear_queue` 后 `abort`。成功要求 settled；失败或未 settled 则关闭运行时并报错。宿主在取消完成前保持 `stopping`，之后才应用待选设置。运行时丢失将未完成活动标为 interrupted，不自动重放任务。Stop 不撤销副作用，也不保证所有后代进程取消。

Adapter 仅接受自带 gate 的产品封装 `protocol: "pi-vscode-approval", version: 1`，runtime／cwd 须匹配当前子进程，就绪前通过 notify 收到 `kind: "hello"`。Call 包含 `request`、`toolCallId`、`tool`、`input`；自带异步 `tool_call` handler 通过公开 `ctx.ui.confirm` 等待，确认后再次检查完整参数快照。RPC 对话 ID 关联 `extension_ui_response`；标题文字不是授权依据。这不是通用 `approve_tool_call` RPC。受控工具 allowlist 为 `read,write,edit,bash,powershell,grep,find,ls`，使用 `--no-extensions -e <bundled gate>`；两种项目资源选择均禁用第三方扩展发现。自带文件缺失阻止启动；缺少 hello／就绪则终止，不承诺可用的无工具回退。离线加载失败夹具单独使用 `--no-tools`。

仅转发有界展示字段，不发送原始 RPC 对象／stderr、签名或凭证存储。模式过滤尽力而为，不能保证任意 thinking／工具输出无敏感信息。运行权限及环境覆盖见[架构 §7](../architecture/vscode-extension-architecture.zh.md)；验证记录见下方证据边界。

## 延后模型／thinking 设置（WI-008 / WI-009）

- 空闲时有效选择立即应用。`chatBusy` 期间仅覆盖对应待应用字段（模型与 thinking 分别保留最后一次选择）；活动的会话级运行期间不发送设置 RPC。合并 chip 始终展示已应用值；独立状态展示 `Next turn (pending)`／`Applying next turn`，Popover 关闭后仍可见。
- 当前 runtime session 的 `agent_settled` 到达后，`applyPendingSettings` 在允许 UI 发送前设置 `modelBusy`，先执行 `set_model`，接受其刷新后的状态／目录／能力，再重新校验待应用档位并执行 `set_thinking_level`。不支持或未应用的档位显示有界错误，不静默钳制或降级。此时模型可能已改变；这不是原子回滚事务。
- 失败后只回读一次投影，不重试修改。回读失败时清空已应用模型／档位与可用档位，不猜测成功。当前应用结束时清空 pending 字段并释放 `modelBusy`；模型错误在 Popover 外仍可见。Prompt 被拒绝时清空待应用意图。
- 工作区身份／资格变化、运行时重启（含资源选择变化）及 provider 释放使待应用工作失效。代次、runtime session 与目录 token 防止迟到结果覆盖替代运行时。视图替换保留宿主拥有的 pending／进行中的设置，并同步到新视图；旧视图操作被拒绝。
- 会话完成使用 `agent_settled`：无剩余自动重试、压缩重试或排队续跑；`turn_end` 或低层 `agent_end` 不足以证明此边界。当前版本及升级验证遵循 [pi 集成指南](../guides/agent/pi-integration.zh.md)，历史 WI-004 证据仅适用于记录的版本。

## 信任与生命周期

- `PiChatViewProvider` 拥有内存工作区身份、单调代次、选择和订阅。观察目录变更及信任授予；每次操作重新读取实际工作区目录、`workspace.isTrusted` 和 `env.remoteName`。即使 URI 为 file，远程宿主也阻断。多根和非 file 工作区阻断。仅已信任的单个本地 file 目录可选择资源。
- 工作区或资格变化清空选择并递增代次；重复读取及视图重建保留选择。扩展宿主重载重置全部状态。VS Code 撤销信任会重载窗口；宿主还在每次请求检查信任失效。不使用设置、信任文件、密钥或 Webview 存储。
- `openFolder` 仅空的本地窗口（`no-folder`）可用。打开原生单目录选择器，随后重新检查代次与资格，再使用原生 file URI 调用公开的 `workspace.updateWorkspaceFolders(0, 0, { uri: selected })`。取消不改变状态；返回 false 或异常时显示有界的重试／File > Open Folder 恢复提示。返回 true 后保持忙碌，直到权威工作区变更或宿主重启，以防重复更新；这仅表示请求获受理：UI 不伪造目录或成功状态。添加首个目录可能重启扩展宿主而不触发目录变更事件；新 provider 构造函数读取权威工作区状态，资源选择初始为空。`manageTrust` 仅其他条件符合的未信任目录可用，仅调用 `workbench.trust.manage`，不自行授予信任。
- 编辑器标题导航图标与命令面板命令 `pi-vscode.focusChat` 先显示现有 Pi 容器，再聚焦 `pi-vscode.chat`；不切换可见性，也不创建另一个面板。默认仍为 `secondarySidebar`。编辑器标题入口使用分别适配浅色／深色的 Pi SVG；没有编辑器标题时仍可使用命令面板。
- 原生动作在活动视图中串行。工作区变化、视图替换／释放或 provider 释放使待决工作失效。后续命令或状态更新前再次检查结果。失败显示固定重试提示；取消不是错误。发送失败不会泄露异常；重开视图重新同步。
- 允许／拒绝在工作区身份或资格变化前可修改且仅内存保存。在 eligible 工作区作出选择后，扩展宿主以公开 `--approve` 或 `--no-approve` 启动 pi RPC（仅当次运行）；更改选择会重启运行时。WI-010 以上述受控 allowlist 与独占自带 gate 替代历史 `--no-tools` 启动。两种选择均禁用第三方扩展发现；资源同意不能覆盖此限制。拒绝仍可能按上游文档读取 AGENTS.md 与其他用户／全局资源。两者均非沙箱或工具授权。
- WI-004 聊天：`runtime === "ready"` 时宿主可通过 RPC 发送有界 `prompt`，将 `text_delta` 投影到 `messages`，直至会话级 `agent_settled`。Webview 不导入 pi、不 spawn 进程、不发任意 RPC。Transcript 仅内存；工作区身份／资格变化、运行时停止／重启或 provider dispose 时清空 `messages`，并拒绝陈旧 `sendChat` 与旧运行时会次的迟到 RPC 事件。
- 视图替换／释放清理视图监听；provider 释放清理工作区监听。每页有新脚本 nonce 和限制性 CSP。名称和路径仅随状态消息传输，使用 `textContent` 呈现，不插入 HTML。原生按钮有明确标签、键盘激活和可见焦点；状态／错误使用实时区域。

## 证据边界

[WI-010 收尾](../archive/2026-09-21-closed-wi-history.zh.md#wi-010)保存四项开发态 F5 及历史自动化／集成／解压包结果。WI-008／WI-009 的延后选择主路径已于 2026-09-21 19:44 确认，当前交接见 [ACTIVE](../../ACTIVE.md)；审批／Stop 交错、失败恢复及完整授权／生命周期／无障碍矩阵不因此视为已独立手测。

原生对话、信任／重载及宿主／兼容编辑器行为按具体验收范围核对已有 F5 记录；未覆盖场景和已安装 VSIX 仍需独立验证。契约保持 Outline，三个 Gate 保持 Open。
