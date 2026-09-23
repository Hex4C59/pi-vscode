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

**迁移说明（T014-01 Build）：** 下列 v1 形状保留早期受控聊天契约供历史对照。当前源码拒绝 v1，使用 v2 加 `viewId`；`sendChat` 改为引用 host 草稿 revision。下方 T014-01 节拥有替代字段。独立审批 gate envelope 仍为 v1。

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

宿主发送 `version: 1, type: "workspaceState"`。完整字段／类型以 [`WorkspaceStateMessage`](../../src/extension/bridge/webviewMessages.ts) 为准；下表定义语义分组。UI 渲染此投影，不自行构造权威状态。

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

## Planned T014-01 单文件附件契约

**T014-01 基线已实现并取得可执行验证；维护者验收仍在 ACTIVE 单列。** Host 捕获／草稿／接纳／历史、v2 UI 与 adapter 有界写是已有基线。下方 T014-02 仅替代本基线的变化后须重附规则，其他约束保持。 本节冻结 [REQ-003](../product-requirements.zh.md#req-003--显式编辑器上下文) 首片建议。[ACTIVE](../../ACTIVE.md) 拥有批准记录；既有[候选顺序](../discussions/2026-09-22-pi-compatibility.zh.md#wi-014-本地候选切片2026-09-22)不变。包含一个工作区整文件、可选完整预览、移除、一次提交及可访问的不可变活跃会话历史。来源变化须重附；最新内容确认、选区、多附件和高级历史导航仍属 T014-02–05。下方名称描述已实现的基线字段。

### 所有权、资格与有界捕获

`DraftSubmission` 拥有 host 草稿、附件准备与提交账本；`PiChatViewProvider` 提供执行资格并协调运行时／Stop／会话切换。`runtimeLifecycle.ts` 拥有窄内部 prompt／结果契约；adapter 负责编码、关联及有界写；Webview 仅展示。使用 VS Code 公开 document／picker API 与仅宿主侧 Node `fs/promises`／`path`，不提供 Webview 文件访问、通用 bridge 或 pi 会话文件访问。不新增依赖、框架、进程模型或持久化。

- 添加使用 `window.showOpenDialog`，仅文件、单选、当前工作区默认目录。取消为 `cancelled`，不是错误，保留草稿。单槽已占用时禁用添加；须先移除再显式重附。要求当前可信单本地 file 工作区及 ready 受控 runtime；每个 await 后复核资格。不推断附加已打开文件。
- 加载文档前拒绝非 `file` URI、authority／query／fragment、非绝对或 Windows 歧义路径（device／extended 前缀、UNC、drive-relative、ADS、控制字符、保留设备名组件、尾点／空格）。root／target 经 `realpath`，要求普通文件并用按路径段的 `path.relative` 判断归属，不用字符串前缀或一律转小写比较。原始与解析路径均检查；symlink／junction 指向 root 外则拒绝。记录 canonical root／target 和 stat 身份（`dev`、`ino`、size、mtime／ctime）；复查必须匹配。身份不支持／不可解析时失败关闭。这不是文件系统原子锁或恶意工作区沙箱。
- **加载前**阻止已知凭证来源：任意 `.local-env`／`.ssh` 组件、`.env`／`.env.*`、`auth.json`、`credentials.json`、`id_rsa`、`id_ed25519` 及 `.pem`／`.key`／`.p12`／`.pfx` 文件（组件大小写不敏感，原始／canonical 均检查）。绝不从 SecretStorage、进程环境或 pi 凭证库取附件。捕获后拒绝可识别私钥块或凭证赋值，沿用现有凭证类键词汇（`api_key`、`authorization`、`password`、`secret`、`access_token`，含大小写／分隔符变体）；无覆盖开关，错误不含原文。这是保守防御，不保证识别任意代码中的全部秘密；UI 提醒只附加非敏感代码。夹具只用 dummy 标记，不用私有文件／密钥。
- `openTextDocument` 前检查 `stat`：未打开磁盘文件超过 **1 MiB** 则 `source-too-large`，本功能不打开／读取。该捕获上限为 256 KiB 文本快照留出常见 UTF-16／UTF-8 解码开销，不是附件预算。已打开且匹配的 TextDocument（含 dirty 文本）即使磁盘较大也复用，但仍要求现有普通文件／归属。`getText()` 前通过末行末尾的 `offsetAt` 检查，超过 **262,144 UTF-16 code units** 时不分配全文；捕获后再限制 **262,144 UTF-8 bytes**。未打开文件由 VS Code 负责解码／加载，其公开 API 不提供抵抗并发文件增长的硬读取限额。完成后 re-stat，变化／超限拒绝；诚实披露残余竞态，不宣称有界 OS 读取。无原始读取回退、自动保存或旧磁盘替代。
- 文本资格指支持的文件成功作为 VS Code TextDocument 打开；被拒绝／二进制／不支持的打开结果为 `not-text`。不是按扩展名嗅探二进制，也不保证任意 bytes 都是文本。空文本文件可配非空正文发送。记录实际编辑器文本、document 对象／URI、version、dirty。变化／关闭重开、重命名／删除、canonical／stat 身份变化或最终文本不同，使已附 revision 持续无效直至移除／重附，即使后来恢复原文也一样。监听文档变化／关闭并在发送时复核；`DraftSubmission` 拥有并清理其文档监听。预览始终展示已捕获快照，不静默更新。

### 版本化意图与安全投影

本片同步把**整个 Webview envelope 迁到数字 version 2**：validator、全部现有 UI sender／host 投影及测试。既有动作除下方草稿式 `sendChat` 外保留 payload 语义；拒绝所有 version-1 动作，避免旧页面绕过附件接纳。HTML 与 host 同包，旧页须重开／重载，不做兼容 shim。每个 v2 动作除 bootstrap `ping`／`getWorkspaceState` 外，在既有 `generation` 旁增加 `viewId`（host 签发 opaque ID）；host 仍检查实际 view 实例。Bootstrap 回复绑定当前 `viewId`。这**不改变**独立 `pi-vscode-approval` gate protocol v1 或上游 RPC。

所有对象使用精确自身数据字段／无 accessor。ID 为 `[A-Za-z0-9_-]{1,100}`；revision／offset 为非负安全整数，不回绕／复用。公共动作 envelope 为 `{ version: 2, type, generation, viewId }`；下方列出**全部额外字段**：

- `updateDraft`：`{ draftRevision, editSequence, text }`；text 在 trim 前最多 **8,000 UTF-16 code units**，编辑允许空值。一个更新 in flight，等待时 UI 只保留最新本地编辑。Host 要求 base revision 匹配及 view-local `editSequence` 递增，保存 text、推进 revision、返回 accepted sequence。Send 等最新编辑确认。不接受 UI 附件正文／路径。
- `addFileAttachment`：`{ draftRevision }`；`removeAttachment`：`{ draftRevision, attachmentId }`；`sendChat`：`{ draftRevision }`。Host 自取正文／附件；正文 trim 后非空且独立限 8k。纯文本保持 trim 正文及上游命令语义；附加发送使用下方编码。每次修改推进 host revision；迟到／重复 base revision 仅重同步。
- `getAttachmentPreview`：`{ requestId, snapshotId, offset }`；offset 为当前草稿或保留提交快照中的 UTF-16 边界。每 view 一个活动预览响应，无等待队列；额外有效请求返回 `busy`。固定 chunk 最多 **16,384 UTF-16 units**、最多 **49,152 UTF-8 bytes**，不拆 surrogate pair；下一 offset 由 host 提供。完整预览可选，顺序组装 UI 中最多一个 256 KiB 快照。
- `getAttachmentHistory`：无额外字段。返回完整有界 metadata 列表，不带正文；聊天行离开 32 条投影后，每个保留快照仍可访问。本片不做分页子系统。

独立 `attachmentState`（v2、当前 generation／viewId）包含 `draft: { revision, text, acceptedEditSequence, attachment }`、`preparation: "idle" | "picking" | "preparing"`、`result: null | { code }`、`historyCount`、`retainedBytes` 和 `lastSubmission: null | { submissionId, draftRevision, delivery, outcome }`。`attachment` 为 null 或 `{ attachmentId, snapshotId, relativePath, kind: "file", utf8Bytes, unsaved, state: "attached" | "changed" | "unavailable" }`。附件 DTO 不含绝对来源路径／document 对象／stat。Metadata path 最多 **1,024 UTF-8 bytes**，超限拒绝捕获，不静默截断。

`attachmentHistory` 增加 `entries`，每项为 `{ submissionId, snapshotId, relativePath, kind: "file", utf8Bytes, unsaved, delivery, outcome }`；最多 **128 项**，单项序列化 metadata 对象最多 **2 KiB UTF-8**。`attachmentPreview` 含 `{ requestId, snapshotId, offset, nextOffset, done, text }` 或 `{ requestId, code }`（以 `code` 是否存在判别）；含 envelope 的完整序列化响应最多 **128 KiB UTF-8**。安全文本 DTO 仅用 `textContent` 渲染，不用 HTML、Markdown 或可执行链接。view／snapshot／request 不匹配则丢弃回复。状态／历史仅在相关变化／请求／重建时同步，不随每个 streaming delta 重发；仅保留一个组装预览，替换／关闭释放文本。

错误码精确为 `cancelled`、`busy`、`stale`、`ineligible`、`slot-full`、`invalid-source`、`outside-workspace`、`unavailable`、`not-text`、`source-too-large`、`text-too-large`、`metadata-too-large`、`sensitive-source`、`source-changed`、`history-full`、`frame-too-large`、`preparation-cancelled`、`write-failed`、`ack-timeout`、`rpc-rejected`、`runtime-lost`。畸形 envelope 仍无响应／无作用；有效过期动作以 `stale` 返回当前状态。UI 将 code 映射到最多 300 字符固定恢复文案，不含异常／正文。来源／预算失败保留草稿，提供移除／重附／缩小；history-full 提供查看历史或明确结束／重启活跃会话并警告丢失；传输不确定提供 Stop／重启指引，不自动重试。

### 草稿事务、投递与生命周期

1. Host 拥有跨视图重建的已确认正文／附件。新 view 先取得新 `viewId` 与当前 revision 再编辑；旧 ACK 不覆盖本地较新未确认文本。仅当 `lastSubmission.draftRevision` 匹配提交 revision **且**本地 edit sequence 未变化，UI 才清空；较新编辑随后作为新 revision 同步。准备期间编辑使其 token 失效并保留新草稿。Host 未收到的编辑不能承诺跨 view 丢失保留；UI 显示同步中／未同步状态，不虚报已保存。
2. 串行一个 picker／preparation 及一个 submission。捕获 preparation token、draft revision、workspace generation、runtime session、当前 view。执行有界 async 来源检查，每个 await 后复核身份。最终同步边界检查 document 对象／version／open／text／dirty、正文／附件预算、metadata、资格及 cancellation token；预留历史容量，构建一个不可变提交，序列化并检查实际出站 frame，**之后才接纳**。冻结后不再异步重读文件。保证 host／editor 一致，不保证未来 runtime 工具读取或 check/use 原子性。
3. 接纳原子提交不可变快照与正文，只推进／清空该草稿 revision，标记 delivery `host-accepted`；历史与 prompt 使用同一冻结数据。同一同步 turn 立即调用 adapter；adapter 检查 expected session，并在交给 stdin 前消费一次尝试 token。该边界发布 `write-attempted`；仅匹配成功响应才 `rpc-accepted`，明确负响应才 `rpc-rejected`；仅未尝试 write 才 `not-sent`；尝试后的 write／ACK／loss 不确定为 `unknown`。不重新插入可能已发送草稿，不自动重发。拒绝／不确定提交也保留供检查并准确标记，不一律称“发送成功”。
4. Task outcome 独立为 `pending | settled | failed | interrupted`；匹配的 `agent_settled` 是既有稳定结束边界，不是 prompt ACK。ACK 前 streaming／settlement 不可倒退 outcome，也不能在 ACK 未解决时允许第二次接纳。Host 接纳或 write／drain 不等于远端受理／完成。
5. Picking／preparing 期间 Stop 使 token 失效、返回 `preparation-cancelled`、保留草稿并保证零 prompt writes。Write handoff 后沿用受控 Stop／clear_queue／abort；远端效果可能已存在。Stop 不发送草稿、不恢复不确定提交、不重放。View dispose 取消未提交 picker／preparation／preview，但保留已确认草稿／已接纳历史；已提交尝试继续由 host 拥有。旧 view 事件不能修改新 view。
6. 工作区／信任／资格或 runtime 替换使附件资格／async 工作失效；保留正文及失效提示、移除来源能力、要求主动重附，不静默把上下文携带到另一项目／runtime。Live history 随所属 session 结束：主动重启／资源选择变化前说明内存历史丢失；故障丢失说明历史结束，不声称持久化。Host reload／provider dispose 释放全部快照、监听、timer、预览引用。同会话成功 Stop 保留历史。不新增会话持久化或自动 reset。

**投递／结算恢复：** 明确 RPC 拒绝将等待执行状态结束为 failed，提示检查配置后主动重新提交，而不是要求一个已不可用的 Stop。若结算先于 ACK，ACK 解决前仍阻止新接纳，之后通过同一结算投影结束回合。迟到 ACK 不能覆盖 runtime failure／interrupted 状态。合法 Stop 在任务已结算后仍回传当前状态，防止 renderer 本地卡在 stopping。

### 编码、传输与内存预算

已安装与声明 pi 均为 **0.86.1**（只读检查，不是 runtime 证据）。其公开 `docs/rpc.md` 与 `dist/modes/rpc/rpc-types.d.ts` 定义 `prompt.message`、images、streaming behavior，**没有** RPC `expandPromptTemplates` 选项。不从 SDK 选项推造该 RPC 字段，不在 runtime 导入私有类型。附件提交的 `message` 为固定非 slash ASCII 前缀 `User task with explicit untrusted file context. JSON data follows:\n` 加 `JSON.stringify({ body, attachment: { path, kind: "file", unsaved, text } })`。整个 prompt 不以前导命令开头；正文／文件 slash／template 文本保留为 JSON data，分隔符／控制字符被转义。后续另批真实 runtime 检查须验证 literal template／skill-command 夹具；不声称标记能防提示注入。无附件 prompt 保持现有语义。

- 正文原始长度 ≤8,000 UTF-16 units，附件正文 ≤262,144 UTF-8 bytes，path ≤1,024 UTF-8 bytes。固定 prefix／JSON keys、boolean、标点及 RPC envelope／ID 在转义前最多 **1 KiB**。非正文／非附件文本 metadata 加 framing 在序列化输出复查；最终**出站 prompt JSONL frame ≤4 MiB UTF-8，含 LF**。不放大其他入站／投影预算。Adapter 接收仅 host 可用的 plain／enriched 判别 prompt input，独立检查正文／附件及序列化 frame 上限；不以任意大 `prompt(string)` 路径绕过 8k 正文 validator。
- 保守解析上界，不是已运行测试：JSON 可把一个单字节 ASCII control 扩到六个 ASCII bytes；将该 JSON 嵌套 RPC 最多再翻倍。附件贡献 ≤`12 × 262144 = 3,145,728`；正文 ≤`12 × 8000 = 96,000`（lone surrogate 转义也覆盖）；path ≤`12 × 1024 = 12,288`；固定开销预留 `12 × 1024 = 12,288`。合计 **3,266,304 bytes < 4,194,304**。每次实际写仍须先测 `Buffer.byteLength(serializedFrame, "utf8")`；该证明仅单文件，不是最终 1 MiB 多文件目标。既有 8 Mi characters 接收上限无关。
- 无附件写队列：一个 prepared frame、一次 write 尝试。写前登记 response／stream error／close handler；调用前缺失／关闭 stdin 或序列化失败为 not-sent；一旦调用 `write` 后的 throw／error（含 callback error）保守标为 unknown。等待 write callback 成功，若 `write()` 返回 false 还等待 `drain`；允许提前关联 ACK，但不得泄漏 listener 或乱序后续 prompt。Local write／drain **5 秒**；从 write 调用起 ACK 总 deadline **30 秒**（不另加 30 秒）。超时／error／loss 清理 listener／timer／pending response，经既有失败／关闭路径使当前 runtime 失败，不重试。Stop control write 沿用既有有界取消语义，不排在产品附件队列后。测试覆盖 ACK 先于 callback／drain、close 无 drain、Stop 与 write 竞态。不以本地 flush 宣称远端投递。Transport-loss 清理绑定捕获的 child 身份，即使 session 已失效仍清理；等待关闭前同步脱离旧 child，迟到回调不能终止替换进程。SIGTERM 5 秒后升级，再过 5 秒仍无关闭观察则报告未确认关闭并禁止替换，须手动清理及重载宿主。
- Live submission 保留**合计 8 MiB UTF-8 逻辑载荷**（正文＋附件文本＋序列化不可变快照 metadata：submissionId、snapshotId、relativePath、kind、utf8Bytes、unsaved）。Delivery／outcome 属有界记录状态开销，不计逻辑快照载荷，**最多 128 条**。接纳前按精确 charge 预留；不静默淘汰，也不是跨会话永久配额，仅 live session 结束才重置并披露丢失。条数限制约束空／小文件 metadata，允许超过 32 条可见消息；bytes 限制容纳多次满尺寸快照而不无限增长。首片即通过明确“Attachment history”控件访问完整有界历史列表；T014-05 改进导航，不是才补基本访问。
- 内存与 wire 分开：8 MiB charge 对保留字符串给出保守 **16 MiB UTF-16 内容上限**，另加有界 128 条记录／object 开销（不是 heap-size 保证）。一个 draft ≤256 KiB 文本加 8k 正文；一个 preparation snapshot；一个 ≤4 MiB UTF-8 outbound buffer 与 write 后释放的临时序列化字符串；一个 preview chunk、一个 UI 组装 preview ≤256 KiB UTF-8。历史每项不缓存重复 serialized prompt，不把历史正文带入每次 workspace 投影。超限阻止新增附件发送，但不阻止纯文本聊天、Stop 或查看已保留内容。

### 可复现无密钥运行时验证（2026-09-22）

本次明确授权的 T014-01 证据：执行 `npm run compile`、`node scripts/spikes/spike-attachment.mjs --build`，然后执行 `wsl.exe -d Ubuntu-24.04 --user nobody --exec unshare --user --map-root-user --net /usr/local/bin/node /mnt/d/Users/hex4c59/Projects/Typescript/pi-vscode/scripts/spikes/spike-attachment.mjs`。helper 打包真实 production adapter；仅进程配置 seam 添加经审阅的 `attachment-provider.mjs` 公开 `registerProvider`／`streamSimple` 夹具。实际 production preparation、编码、stdin write／drain、ACK、一次 token 与关闭路径连接真实 pi 0.86.1 RPC。合成推理捕获最后一条真实模型输入并返回固定文本，不证明真实服务质量／上下文容量。

2026-09-22 21:57 从 Windows 发起的 WSL 运行通过：Node v24.12.0、namespace root 仅映射 nobody／65534、无接口／可用路由、全新白名单环境／home／配置／工作区、无 session 持久化，禁用发现，仅显式加载 bundled gate 与审阅夹具。启用的 `/literal` 模板正对照确实展开；enriched 前导 slash／skill／模板文本保留为精确 JSON 数据。三个 262,144-byte 附件（Unicode、NUL 控制字符、引号／换行文本）的含 LF frame 实测为 262,425／1,835,289／334,745 bytes。provider 输入与冻结后修改原对象前的载荷完全一致；每 token 一次尝试、拒绝重放，262,145 bytes 拒绝且零新增 write。adapter SIGTERM 后观察到 RPC close code 143（不是自然 code-0 退出）；worker exit 0、临时夹具清理通过。未使用用户秘密／网络／付费推理。这是 Linux adapter／runtime 证据，不是原生 Windows runtime、F5 或安装版 VSIX 验收；ACTIVE 保留这些缺口。

### 首片所需验收与证据

一次明确集中 Build 批准后：普通 owner-local specs 扩展 `src/extension/tests/harness.ts` 的窄 native picker／document／version／stat seam，捕获精确 runtime input 与可见状态，不新建 E2E runner。测试有效／dirty／空文件且不保存、取消、binary／open 失败、open 前 stat 上限、已打开小 dirty 文本但磁盘大、Windows 原始／canonical 越界、来源身份／version 连续两次变化、关闭重开／删除、敏感 dummy 来源拒绝、最终增长／metadata 超限。拒绝准备断言**零 write**；接纳断言不可变历史与 prompt 原文一致。

Validator 覆盖全部 v2 动作、raw body 8,000／+1、无路径／正文权限、旧 v1、accessor／extra、ID／revision／offset／旧 view。预算／adapter specs 覆盖 ASCII controls、引号／反斜线、Unicode／lone surrogate、256 KiB／+1、实际嵌套 frame 限额／LF-only 分片、错 session ACK、callback／drain error／timeout／close、重复发送、各 await 上 Stop／替换，以及无重试／监听清理。挂载 React／jsdom 的 UI 测试覆盖安全 literal 完整预览、chunk 组装、移除／重附、超过 32 行历史、两种保留上限、独立较新正文编辑、重建／迟到 ACK、空／加载／错误／stopping 状态及 delta 期间焦点／展开／滚动稳定。保留模型／thinking、审批、纯文本聊天回归；mock 不证明真实 pi 行为。

未来 Build 运行 `npm run compile`、`npm run lint`、`npm test`、`npm run docs:verify` 及 `git diff --check`。本次文档任务只运行文档检查。Windows VS Code F5 与**已安装 VSIX**须分别验证原生选择、dirty 编辑器／不保存、来源变化重附、256 KiB literal 预览／发送、历史／重建及键盘／焦点／主题／Stop。Cursor 证据单列。后续须另批隔离 runtime 检查，验证真实 pi framing／literal 命令处理，不用私有数据；真实模型／网络／凭证／付费调用**不包含**在 Build 批准内。缺真实宿主／runtime 证据保持相应验收待定，不另开设计票，也不宣称成功。不自动接受 gate／ADR／整个 REQ-003。

## T014-02 最新整文件确认

**范围：** REQ-003，由 [ACTIVE](../../ACTIVE.md) 中长期 Goal 授权，仅在 WI-014 成为唯一 Build 后实施。本节扩展 T014-01，保留其单文件、捕获、传输与活跃历史预算；本切片不实施选区或混合集合。

- 每次 enriched Send 前，host 按相同 canonical 归属、来源资格、敏感内容与 UTF-8 上限重新捕获当前编辑器文本。canonical 目标或编辑器文档身份不同视为不可用，不静默换成另一文件。内容、编辑器版本／dirty 状态或文件系统身份变化会阻止提交，并用新 opaque snapshot ID 及 `confirmation-required` 状态替换草稿预览。保留正文，不产生 runtime prompt 或历史记录。
- 在普通 generation/view envelope 中新增 exact v2 意图 `confirmFileAttachment { draftRevision, attachmentId, snapshotId }`，ID 与 revision 沿用校验上限。Host 仅在空闲且合资格时接受当前暂存整文件快照；异步重新校验来源后标为 `attached` 并增加 draft revision。确认本身不发送，用户随后明确按 Send。预览可选，不产生确认；不提供发送旧整文件选项。
- 文档编辑使暂存／已确认状态失效；后续 Send 暂存新快照并再次要求确认。旧 ID／revision、新正文编辑、移除、Stop、视图替换、工作区／runtime 替换与 dispose 均不能批准或恢复旧确认。准备期间 Stop 取消准备、保留草稿。视图重建后未变化的暂存快照仍可检查，但不重放确认。
- React client 标明暂存状态，仅针对该确切快照提供 **Use latest contents**；意图不携带路径／正文权威。同步、未获确认的正文编辑、模型／任务工作或准备期间禁用动作。草稿快照被替换时，关闭指向旧草稿快照的已打开预览，避免把旧字节当作当前内容。
- 沿用已同意测试接缝：真实 provider／validator 配原生编辑器与 runtime harness、挂载 React 应用／真实桥、隔离真实 pi 传输及 F5／安装版 VSIX。覆盖连续两次编辑、不预览即确认、重复／过期确认、校验期间变化、超限／删除／不可用来源、Stop／重建与最终提交／历史精确字节。历史 T014-01 实机证据不证明此新增行为。

## T014-03 固定选区与明确旧快照选择

**已实现契约；可执行证据及待验收状态由 [ACTIVE](../../ACTIVE.md) 记录。** 属于 WI-014 Goal 授权的 REQ-003。T014-02 继续适用；本片在一个附件槽中增加选区类型，混合列表属于 T014-04。

- `addSelectionAttachment { draftRevision }` 沿用 v2 action envelope。Host 获取当前本地文本编辑器的单个非空选区；无编辑器、空／多个范围、来源不合资格或取消给出有界可恢复错误。Webview 不提供路径／范围／选中文本。仅捕获选区，不读取整篇文档，因此已打开大文档中的合规小选区仍可使用。沿用 canonical／路径／内容安全及单项 256 KiB UTF-8 上限，捕获前后核对来源／文档，不保存。
- 元数据与 enriched context 新增判别类型 `kind: "selection"`、`originalRange { start: {line, character}, end: {line, character} }`（从零开始的安全整数、末端不包含）及 `stale: boolean`。浏览器显示从一开始的原始位置，明确为历史范围而非当前导航坐标。file 元数据不变。移除／重附前，选区正文、原始范围与原始 unsaved 标记不可变；仅移动光标不移动附件。
- Host 另外跟踪选区提交当前获准的来源 revision。来源编辑使其失效，但不更新捕获正文。Send 校验当前来源资格／文档身份；与已观察版本不同则零提交并显示旧快照选择。UI 提供移除／重附及明确 **Use old snapshot**，预览可选且不产生确认。`confirmSelectionAttachment { draftRevision, attachmentId, snapshotId }` 校验 exact 字段与当前已观察来源版本；确认前／中或最终 Send 前再次变化须重新选择。确认本身不提交，旧快照选择不能绕过删除／不可用／越界。
- 确认 token／revision 撤销、Stop、新正文、视图／runtime／工作区替换及不可变已发历史沿用 T014-02。原始范围标记与实际提交字节保留于活跃历史，不新增保存会话存储。frame／预览／活跃内存／记录预算继续计入新元数据并执行。
- 沿用已同意接缝：原生编辑器／provider／validator、adapter 编码、挂载 React／bridge、隔离真实 pi 与实际 F5／安装版。验证 Unicode／多行／dirty 的确切起止、大文档小选区、无／空／多个选区、来源变化与仅光标变化区别、过期确认／重复编辑／Stop／重建、删除／越界拒绝及历史原文不变。整文件最新确认及模型／审批／Stop 回归保留。不隐含多范围合并、多文件、图片或持久化行为。

## T014-04 有界混合附件事务

**已实现契约；本轮可执行证据与仍待维护者接受的范围见 [ACTIVE](../../ACTIVE.md)。** 仅替代 T014-01–03 的单附件槽限制；[REQ-003](../product-requirements.zh.md#req-003--显式编辑器上下文) 拥有产品上限，职责／信任／仅内存生命周期不变。

- 配对发布的 v2 host／browser 草稿字段改为 `attachments: DraftAttachment[]`，按显式添加顺序保留 0–20 项。既有添加／移除／确认／预览命名意图仍只携带 revision 与 opaque IDs。整文件原生选择可多选；取消、不安全、项数或预算超限的批次不改变既有列表。选区一次追加一个固定快照；不推断上下文，不添加排序功能或持久化。
- 捕获与最终内容均检查单项 262144、合计 1048576 UTF-8 文本字节及最多 20 项。项数／合计失败使用有界 `attachment-limit`／`total-too-large`，提示缩减／移除。正文仍独立限制 8000 UTF-16 单元。每次修改推进 draft revision 并撤销准备；逐项精确确认不授权其他项，不发送草稿。
- Send 准备完整集合，一次接纳前再次检查每项来源／文档及确认。变化整文件更新最新候选；变化选区保持原文／范围并明确选择旧快照。任一变化、不可用、不安全、超限或未确认项均零 prompt 写入、无部分历史、不静默略过；正文／列表保留供修复／移除。Stop、新正文／列表、视图／runtime／工作区替换撤销迟到捕获／确认／接纳。
- enriched adapter 输入及 literal JSON 使用同序 `attachments: [...]`，不是多次 prompt。Adapter 独立检查单项／项数／合计／路径／范围／正文及实际 JSONL frame。为批准的 1 MiB 文本合计，frame 上限由 4 MiB 增至 **8 MiB**，包含双层 JSON 转义；最坏转义必须实际传输验证。超限在 stdin 写入前失败，不截断／重试。
- 活跃历史继续限制为 **128 个附件快照记录及 8 MiB 逻辑负载**，不淘汰。混合提交的不可变记录共享一个 submission ID 与投递／结果；各自唯一 snapshot ID 供预览。每条提交的正文只计一次，加每个快照确切正文与不可变序列化元数据（继续每条 2 KiB metadata 上限），整组接纳前预留容量。history count 仍为快照记录数，不静默扩大既有保留策略；导航改进归 T014-05。
- 已同意 host／validator、adapter、挂载 React／bridge、真实 pi 合成服务／原生宿主接缝：单个混合向量、20／21 项、1 MiB／+1、Unicode／转义上限、整批／整条原子失败、多项变化确认、异步准备期间编辑、旧答案／Stop／重建、完整预览与实际送达／历史字节。F5 与安装版分开记证，不与浏览器或模型效果混同。

## T014-05 有界活跃历史导航

**已实现契约；本轮可执行证据与仍待维护者接受的范围见 [ACTIVE](../../ACTIVE.md)。** REQ-003 拥有已发内容不可变要求，REQ-005 提供取消约束；不是 REQ-008 保存会话恢复。

- 保留 host 权威的 128 快照／8 MiB 无淘汰预算与现有完整有界、仅元数据的 `getAttachmentHistory` 投影。客户端按接纳顺序每页 **16 条快照记录**；显示记录范围／总数／当前页及提交分组或序号，不把 opaque ID 当源链接。同一提交可跨页，不能暗示未在本页显示的附件未曾发送。
- 打开历史默认最新页；首页／前页／后页／最新页意图明确且有界。之后元数据／状态刷新和 streaming delta 不擅自跳页；活跃会话丢失导致历史清空时诚实复位。视图重建可重置临时页码／滚动，但同一活跃会话须恢复 host 已确认草稿、元数据与精确预览。
- 完整字面预览仍按需，沿用 16,384 UTF-16／49,152 UTF-8 chunk、每视图一个活动响应、一个已组装的 256 KiB 快照。换页或收起历史时本地取消已打开的历史预览，不匹配的迟到块不得重开；页元数据与每次 delta 不传正文。草稿预览／捕获／确认／发送规则不变。
- 分页、预览和状态刷新不提交／改写／清空草稿；普通 streaming／状态更新保持所选页、键盘焦点和上下文滚动。一次最多渲染一页元数据，不增加分页 RPC、持久化或通用虚拟列表框架。
- `history-full` 保留全部未发送草稿与已保留历史。提供具体可选恢复指引：检查历史，或主动使用 **Developer: Reload Window**，明确当前聊天、附件快照及未发送草稿会丢失。不自动执行／重置，不暗示持久化；预算、来源与传输错误仍区分恢复方式。
- 在已批准 host／client／React 接缝，浏览器及独立 F5／安装版合成链路验证页边界／空历史、跨页混合提交、来源变化／删除及超过 32 条聊天后的完整预览、host／view／runtime 丢失、迟到块、Stop、预算与键盘／滚动稳定。

## Planned WI-013 本地交互契约

**2026-09-22 暂缓，未完成：** 保留供未来恢复，[ACTIVE](../../ACTIVE.md) 当前准备 WI-014 附件。本候选不是附件传输契约，下方尺寸不能作为全局 prompt／附件上限。

**仅候选——不是当前 version-1 allowlist、Living 契约或 Build 授权。** 维护者于 2026-09-22 选择路线 1（本地候选）配合路线 3（本地未发布上游提案）；路线 2 须另行选择窄试点。[Draft ADR 0002](../decisions/0002-interaction-contract-route.zh.md) 记录路线批准，不代表逐字段／预算接受。本文保持 Outline，上方既有受控聊天行为不变；以下仅涉及 REQ-004/005/006/009 的未来标准交互。ADR 0002 中同日后续修订以未修改发行版 pi 为基线，上游增强可选。远端缺口仅阻塞依赖声明，不阻塞整个项目。以诚实本地证据评估当前发行版切片；下方远端 close／outcome／operation 字段是条件能力，不要求每个扩展采用新协议。[调查](../discussions/2026-09-22-pi-compatibility.zh.md) 持有固定 pi 0.86.1 证据及上游提案。

### 所有权与候选判别字段

以下名称描述可审阅本地 schema，不是已导出 TypeScript 类型或 pi wire 字段。Build 前须通过测试冻结精确封装、错误及版本／能力迁移，不静默扩展当前 `version: 1` 消费方。

- **Host：** 独占接纳、操作资格、内存交互 ledger、队列、本地期限、投影及恢复屏障。每项绑定 host epoch、workspace generation、runtime instance／live-session 身份、不复用的不透明 interaction ID 和当前 view revision。上游 ID 留在 adapter 内；UI ID 不授予工具权限。
- **Adapter：** 拥有校验后的传输关联、每个已接纳远端请求的一次性回复 token、方法映射及自有 child 的被动观察。它映射证据，不决定产品就绪。Host 先撤销资格，adapter 在写入前独立消费 token 防止重复调用。timer／listener／token 由创建者清理。远端对话框／执行事实归 runtime，两个本地所有者均不得虚构。
- **操作关联：** 判别联合 `association: { kind: "runtime-scoped", operationId, coverage } | { kind: "reviewed-fixture", evidenceRef } | { kind: "unknown" }`。`runtime-scoped` 要求当前连接绑定的已验证公开能力；coverage 为 `awaited-handler | registered-work | unknown`。审阅夹具仅有限源码推断，不是通用支持或已启用路线 2。未知归属不能接纳依赖可靠分离才支持的操作。Host 关联 ID 不能建立来源；不凭标题、通知、`hasUI` 或单一待决命令推断。Runtime 归属不是对共同加载可执行代码的身份认证。
- **Adapter 证据：** 独立事件判别 `interaction-opened`、`interaction-closed`、`response-outcome`、`operation-settled`、`transport-lost`、`child-exited`、`spawn-failed`。均绑定 runtime／session；操作／对话框事件另绑定相应 ID 及证据依据。只有所选远端能力提供事实时才发出 close／outcome／settlement；旧协议缺失保持 unknown，不合成事件。`operation-settled` 包含 `completed | failed | cancelled` 和 coverage，不代表所有脱离等待链工作结束。
- **Host ledger：** 独立轴为本地有效性 `queued | active | invalidated`；回复尝试 `none | reserved | written-locally | write-failed`；远端对话框 `unknown | closed` 及有证据的原因／结果；操作 `pending | settled | failed | unknown` 及 coverage；自有 runtime `connected | lost | exited | spawn-failed`。本地失效记录有界原因，如 answer-attempt、user-cancel、Stop、local-cutoff、remote-close、replacement 或 loss。记录不可恢复有效；后续远端事实可完善证据，不可重开。
- **Webview 投影：** 候选 `interactionState` 投影一个按方法区分的表单（`select` 含不透明 option ID／label、`confirm`、`input`、`editor`）、身份／view revision、排队数、`canAnswer`、有界惰性文本及证据支持状态。候选 `answerInteraction` 仅含身份／view revision 和 `answer: { method: "select", optionId } | { method: "confirm", value: boolean } | { method: "input" | "editor", text: string }`；`cancelInteraction` 仅含身份／view revision。Stop 为宿主协调意图，不是任意 RPC。当前 validator 不接纳这些新意图。否定 confirm 与取消在本地不同，即使 pi 均映射 false；普通 confirm 不能创建／复用工具授权。

### 校验、终态与顺序

1. 修改状态前校验普通对象、精确自身字段、支持的封装版本／判别、有界身份、当前工作区资格／runtime／view、活动 ledger 及方法。Select 必须属于原选项，adapter 将 ID 映射回原始精确值。Confirm 仅接受 boolean；input／editor 仅接受有界字符串，不强制转换、静默 trim 或截断（方法允许时空字符串与取消不同）。未知／多余字段、错方法、旧／重复答案无传输作用；有效但过期 UI 重新同步。序列化前再次检查答案预算。
2. Host 串行仲裁终态。回答／取消时，先原子失效并预留唯一回复 token，再 await I/O；传输及范围仍合格时尝试一次方法对应回复。Stop／替换／丢失在写入前获胜则抑制未发出的肯定回复。不确定写入不重试，回答尝试后不追加第二个取消回复。重复意图增加零次写入。保证是**恰好一次本地预留、至多一次写尝试**，不是远端恰好一次投递或执行；某些失效完全不写入。
3. Stop 先阻止新任务／接纳并失效全部活动／排队答案及覆盖的待审批，然后经支持的回复取消尚未回答的对话框，并按支持能力请求清队列／操作或 agent 取消。已写答案可能在远端获胜，Stop 不能收回；普通取消可继续扩展代码。保持 stopping 直至相关有证据的稳定结束或明确未确认失败；本地 write／drain、cancel／abort ACK、`agent_settled`、`promptInFlight=false` 或 handler 返回单独均不证明任意扩展完成。未解决前不应用 pending 设置或切换 profile／session。
4. 观察到远端 close 立即使匹配的活动／排队项失效；迟到 close／outcome 不影响其他范围。相同重复事实无害；冲突终态或必要顺序缺失令相关范围失败关闭并给出有界诊断，不猜成功。登记的对话框／子工作须得到交代，才可视 scoped operation 为 settled。顺序依赖协商证据，不为旧 RPC 虚构全局序号。
5. 视图替换递增 view revision、拒绝旧页面意图，重同步同一 host ledger，不重启期限或重放。工作区／runtime／session 替换和 provider dispose 先失效，再清 listener／timer。仅保留旧请求拒绝／诊断所需的有界证据；旧回调不能更新新身份。仍须保留草稿、不自动重放。WI-010 既有故障关闭不变，不授权以自动 kill／restart 补救 WI-013 不兼容。

候选 host 错误码区分 `invalid-message`、`invalid-answer`、`unsupported-method`、`source-unknown`、`unsupported-capability`、`overload`、`write-failed`、`transport-lost` 和 `stop-unconfirmed`，描述失败边界，不转发上游异常。无效输入不执行；不支持接纳提供限制／终端路径；过载遵循下方队列政策；写入／丢失未知不重试回复；Stop 未确认保留恢复屏障。精确 UI 文案与错误封装须在 Build 前冻结。

### 队列、计时与内存预算

一个活动表单加有界 FIFO 队列、可见数量。排队项到期／关闭后直接移除，不再呈现；出队和回复时重查有效性／期限。溢出保留已接纳项，仅经支持的回复拒绝／取消新增并告警。持续溢出进入交互失败，禁答并阻止新任务，不宣称执行已停止或自动重启。无法发拒绝时远端状态未知。

无上游期限则无统一用户倒计时，但仍可能有隐藏私有 signal。声明时长在上游输出前开始，不是侧栏显示时；收包加时长不是远端期限，也不是已证明的剩余作答窗口。收包相对本地 cutoff 须另行批准并标为呈现策略，不能延长远端有效性或替代到期证据。出队／视图重建不重新计时。远端期限元数据须明确时钟／经过时间语义，披露迟到投递。传输／Stop 稳定等待期限与用户回答时间分离；当前 prompt 响应 timeout 须在支持无限期命令对话前重设契约。

**仅未批准的尺寸候选：** 一个活动加七个排队；完整 frame 64 KiB UTF-8（也限制半 frame 缓冲）、文本／答案 32 KiB、64 个各至多 1 KiB 的选项且合计符合 frame；十秒五次溢出为持续溢出候选。取较低对端预算。这些不是实现默认值或获批产品限额，仍须可用性／传输证据及批准。超大输入明确失败，不静默截断答案。诊断不含正文／秘密，使用有界错误码／计数并限速。

**防重放登记不是终生交互配额。** 先前 256 条终态建议不授权健康连接在 256 次对话后停止。候选本地策略：全新 host／runtime epoch、单调不复用的本地 ID、有界 live-token map 和有界近期终态诊断 ring；答案必须有 live token，淘汰诊断文本不恢复回答资格。计数耗尽不得回绕复用。远端 open-ID 重放须在 adapter 边界另证不复用／序列 watermark 或 tombstone 策略，旧协议任意 ID 不提供这一条件。精确保留预算、远端重复处理及耗尽策略仍是 Build 前缺口，不是已采用的重大政策或无界 tombstone 集合。

### 丢失、退出与主动恢复

`transport-lost` 表示本地禁答，远端执行未知。被动 `child-exited` 须识别精确、已成功 spawn 的 child 及实际 exit／close 详情；spawn 失败或流错误不是退出证据。Adapter 在流失败后须保留足够进程观察所有权，以观察后续真实退出。这是当前合并 loss 事件中不存在的 Planned 能力。退出仅证明自有 child 结束，不证明后代结束、副作用回滚或操作成功。

已待决且 Stop 未确认时，由 host 拥有恢复屏障：显示“未确认停止／不能继续”、保留草稿、阻止任务／设置／profile／session 转换，提供手动结束 runtime 指引。实际自有 child 退出与用户主动恢复是两个条件，单击恢复不是证据。充分边界证据加主动恢复后，替代 runtime 才可使用全新身份、受控默认、清授权且不重放。宿主重载丢失 ledger／child 所有权；新 ready 进程、PID 缺失检查或用户陈述不能解除旧工作未知。在不新增持久化或自动终止的情况下如何跨所有权丢失保留／执行屏障尚未解决，**阻塞该恢复分支及依赖它的所选切片**，不宣称纯内存状态已能实现。

### 实现／验收前所需证据

本新增内容均未运行：validator／ledger 确定性测试覆盖各判别、选项／字符串预算、旧 view／runtime／epoch、ID 复用／诊断淘汰、重复／冲突答案、Stop／回答及到期／回答两个顺序、排队到期、溢出、半 frame 与写丢失；断言无未授权作用及清理，不只调用数。另行授权的固定版本公开 runtime 测试须确立所选切片的加载／同意与受覆盖审批边界、可观察回答／取消作用、诚实未知结果、脱离等待链限制及 child 退出／丢失／重载恢复。仅依赖对应能力的声明才要求来源／scope 映射及增强终态／取消证据，不是通用认证来源或精确远端完成要求。之后仍须 Windows VS Code 侧栏键盘／焦点／主题、F5、已安装 VSIX 及审阅真实扩展；仅合成／官方示例证据不足。记录这些测试边界不产生新 runtime 能力、Accepted ADR 或 gate 关闭。

## 证据边界

[WI-010 收尾](../archive/2026-09-21-closed-wi-history.zh.md#wi-010)保存四项开发态 F5 及历史自动化／集成／解压包结果。WI-008／WI-009 的延后选择主路径已于 2026-09-21 19:44 确认，当前交接见 [ACTIVE](../../ACTIVE.md)；审批／Stop 交错、失败恢复及完整授权／生命周期／无障碍矩阵不因此视为已独立手测。

原生对话、信任／重载及宿主／兼容编辑器行为按具体验收范围核对已有 F5 记录；未覆盖场景和已安装 VSIX 仍需独立验证。契约保持 Outline，三个 Gate 保持 Open。

### WI-016 T016-01 — 脏编辑器写保护

Host 策略在提供审批前，以及单次批准或精确活跃会话授权实际放行前，检查内置 `write`／`edit` 目标。只读取 VS Code 文档元数据与文件系统身份，不读取缓冲区正文，也不保存文档。目标有未保存编辑时拒绝调用，并通过已有有界 `chatError` 提醒用户先处理修改、再明确重试；检查不可靠时也用固定恢复文案拒绝。不新增 Webview 能力或 gate 信封字段。

目标映射跟随声明 pi 0.86.1 的 write/edit 路径解释（相对／绝对、单个开头 `@`、home、file URL、Unicode 空格、原生 Windows shell 盘符写法）。已有文件匹配规范路径／文件身份；不存在的文件使用可解析的最近祖先。异步解析后重检文档集合，持续变化最多尝试三次；排除非 file／已关闭文档。无关脏文件不阻止干净目标或读取。审批等待期间变脏不会产生新 session grant；既有 grant 不绕过保护。最终检查期间取消或撤销授权不会重新放行。

这只是公开 `tool_call` 的执行前检查，**不是编辑器与随后文件写入之间的原子锁**。最终检查后的编辑、不透明 shell 写入、trusted extension 执行及并发文件系统变化，仍不能承诺完整保护。pi 继续拥有工具执行与取消；UI 解释拒绝原因，不自动重试、回滚或保存。当前检查及实机证据属于 ACTIVE，不代表 REQ-007 review diff 已完成。

### WI-016 T016-02 — 已应用变更审阅（Build 契约）

本节落实 ACTIVE 中 Goal 已授权的 REQ-007 切片，不接受新 PRD／ADR。Webview 仅发送 v2／viewId／generation 命名意图：`getChangeReview` 无载荷，`openReviewDiff`／`openReviewSource` 仅带 host 所有的不透明 `id`；未知／过期 ID 不能打开任意路径或命令。Host 独立发送 `changeReviewState`，精确 DTO 归 `webviewProtocol.ts`。条目区分工具报告的 write/edit 目标与任务期间观察到的工作区事件；观察不等于 agent 独占归因。

Before/after 正文留在 host，通过只读虚拟文档打开 VS Code 原生 diff；不向 Webview 暴露快照正文、路径能力、进程、SDK 或通用命令。源导航打开当前重新校验的来源，不承诺旧位置。历史快照对不会被当前 Git／HEAD diff 替代，也不覆盖源文件。工具 complete／failed／interrupted 状态与观察到的文本差异分离；错误／Stop 可能发生在部分副作用之后。

Before 在已批准 write/edit 最终授权窗口捕获，after 使用公开工具完成事件，独立于有界活动展示文本。并发／preflight 重叠调用须披露，不伪称孤立操作归因。Host 在任务期间观察所选项目的额外变化元数据；没有 before 时明确无法提供已捕获 diff，不编造。仅捕获安全普通 UTF-8 项目文件；已知敏感路径／内容、外部目标、二进制／过大／不可靠读取给出原因，不截断或伪造快照对。捕获限制不静默替正常审批放行／拒绝工具；脏文档保护与最后重检仍强制。

技术保留界限：128 条记录、每个文本快照 256 KiB UTF-8、每个活跃 runtime 保留正文 8 MiB、展示路径 1 KiB UTF-8、UI 每页 16 条。不淘汰既有快照；记录／正文超限明确说明，后续工具继续走正常审批。有界读取与期限，迟到结果不得修改替换后的 runtime。元数据更新不重置当前页或草稿。快照跨视图销毁／重建保留，runtime／资源／会话替换时清除并明确提示。打开历史 diff 时重检当前来源，披露后续变化／不可用，不修改已捕获快照对。 原生打开操作单飞；重复意图不累积编辑器操作。Watcher 工作按已保留路径串行合并，待处理工作有界。最终授权拒绝移除临时快照，不占保留记录／正文容量。断开的 runtime 隐藏审阅操作时，重置／丢失提示仍可见。

### WI-017 T017-01/02 — 保存会话选择与顺序交接（Build 契约）

Goal 已批准的 REQ-008 先落实公开 pi 持久化、当前项目列表、新建与主动恢复；完整渐进历史／历史附件恢复仍属 T017-03，列表或探针不代表完成。Agent 执行保持 subprocess RPC；adapter 自有、有界短生命周期 helper 可使用声明包的公开 SessionManager API 枚举及校验项目／身份，不自行读写 session 文件格式。返回的存储路径仅作 host/adapter 的不透明参数。活跃会话使用 pi 原生持久化，不建扩展自有存储；空会话可能需 pi 持久化后才出现在列表。

新增 v2/viewId/generation 命名意图：getSavedSessions(page：非负安全整数)、newConversation（无载荷）、resumeConversation(id：host 发出的不透明列表 ID)。原生 host 确认先于修改；恢复必须确认其他入口已退出，并说明这不构成独占锁。确认同时披露 Stop、未发送草稿／附件丢弃及 grant／review 清除；取消或失效确认不切换。确认后活跃任务须经既有 Stop 流程等到 settlement；失败不启动另一会话或暗中重试任务。资源同意及受控默认仍有效，不自动安装／加载历史扩展；启动目标会话前重检项目／选择身份。

独立 sessionState DTO 投影 phase（idle/listing/confirming/switching/error）、当前公开 session 身份／名称、是否加载、每页 16 项与总数，以及固定错误码。列表项只含不透明 UI ID、有界标题／摘要及修改时间，不含存储路径或任意 SDK 调用。元数据界限：标题 160 字符、摘要 256 字符、时间戳 40 字符；只有当前发出页的 ID 可操作，失效选择须刷新。Helper/host 校验分页请求与结果；刷新可能反映外部变化，不是锁定的历史列表。

列表／切换有自有取消、期限及有界输出，不累积无界重复请求。项目／runtime 替换、销毁或失效原生确认使旧工作失效。成功替换会话推进 Webview generation，清空临时授权、延后模型、review 和附件内存。保存会话身份不同于 adapter 的数字 runtime generation。失败明确且可恢复；公共 API 成功不自动代表完整历史恢复 UI 已交付。

### WI-017 T017-03 — 有界恢复历史与保留文本（Build 契约）

Host 将公开 SDK 的活动分支（含可用的 compaction 前对话及通用工具／自定义／摘要记录）投影到独立保存历史区域，不在实时消息中重复这些行；展示不改变 pi 的模型上下文。初始及向前／向后每页最多 32 条顺序记录，每条最多 4 KiB UTF-8 文本，明确标记截断／不支持内容。历史工具名称与状态只描述旧记录，不代表当前已加载能力或重建成功。结构化后备展示有显式深度／字段／字符串上限并遮蔽凭证类字段名；明确标记 `display: false` 的记录同时从分页和预览序号中排除。不执行历史 renderer 或扩展代码。概览／预览逐段消费文本，不拼接整条大记录。

恢复时公开分支最后条目作为仅 host 持有的锚点；之后各页及预览经公开 SDK 重新读取并限定至该锚点，继续对话不会移动旧页偏移。锚点消失或不在当前分支时明确失败，不展示另一分支。扩展不增加 session 文件格式、附件存储、全局搜索或分支 UI。Helper 使用有界结构化请求、15 秒期限、1 MiB 响应上限并观察子进程实际 close；原始诊断与存储路径不进入 Webview。

新增命名意图 getSavedHistory(page) 与 getSavedHistoryPreview(id, requestId, offset)，仍使用 v2/view/generation 信封。savedHistoryState 含可用性、idle/loading/error、单页、页码／总数与固定错误。Host 将 SDK 条目 ID 替换为临时行 ID，只有当前窗口的 ID 能请求保留文本。savedHistoryPreview 关联 id/requestId，携带固定错误或最多 8192 UTF-16 code unit 的字面文本块，以及 offset/nextOffset/done/totalChars；分块不切开 surrogate pair。UI 只保留单个渲染窗口与预览块，提示更早内容并可翻页，不累积完整历史。

保留文本动作展示公开消息中实际保留的原文。可识别的显式上下文 prompt payload 将其文件／选区附件文本展示为历史快照，缺失字段／内容明确标为不可用；未知格式仍以带限制说明的字面文本展示。绝不重读当前源路径冒充旧附件、不重建图片、不额外保证持久化；结构化或不支持数据的遗漏在文本预览中也明确说明。

会话／工作区替换与销毁取消旧读取并撤销行能力；视图重建取消进行中的预览，但保留已完成的不可变历史窗口。目录／检查等待已接纳的历史读取及先前实际 helper 所有权 settled，过期原生对话框不属于该屏障。与目录请求竞争的新历史读取获得可恢复回复，不会无限 loading；视图释放也取消进行中的目录请求。Host 在异步 Stop／检查之后、确认切换正式提交之前再次核对草稿 revision；只接纳自身取消附件准备产生的那次 revision，之后用户编辑仍使确认失效。已提交切换清空旧附件结果及草稿内容。运行时替换一旦提交，其完成不依赖旧视图、不重复任务；提交前旧视图不能授权新交接。延后模型选择／grant／review／实时附件内存不迁移。预算性能、真实 runtime、原生宿主及安装包证据继续由 ACTIVE 记录，本 Build 契约自身不完成 REQ-008 或接受 gate。
