# pi VS Code 系统架构

[English](vscode-extension-architecture.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[vscode-extension-architecture.md](vscode-extension-architecture.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30

- 类型：Architecture
- 状态：Accepted
- 创建：2026-09-19
- 权威范围：结构、边界与所有者（不表示功能已实现）
- 相关 gate：[`../reference/architecture-gates.zh.md`](../reference/architecture-gates.zh.md)
- 同级参考：pi-desktop（Electron 呈现层；pi 集成原则相同，宿主不同）
- 上游：[pi](https://github.com/earendil-works/pi) coding-agent runtime（开发期只读同级检出 `../pi`）

> ADR0001～0004 已接受的结构边界。实际功能／环境交付仍以对应 WI 证据为限；不代表整份 PRD 接受或发布认证。

## 1. 背景

**pi VS Code** 是在用户写代码时提供 **侧栏聊天伴侣** 的 VS Code 扩展，布局对标 GitHub Copilot Chat / OpenAI Codex：**左侧主侧栏保留资源管理器**；pi 聊天在 **Webview View** 中，在宿主支持时 **优先放在辅助侧栏（右侧）**。

扩展是 **呈现与编排层**，不重写 pi 的 agent 循环、provider、工具、压缩或会话文件语义。

## 2. 分层

| 层 | 职责 | 本仓所有者 |
|----|------|------------------------|
| **UI（Webview）** | 聊天布局、流式展示、仅 UI 状态 | `src/webview/` |
| **Extension host** | 激活、命令、通过公开 pi SDK 管理供应商认证与已保存默认、工作区信任、webview 生命周期、经校验的 `postMessage` | `src/extension/` |
| **Adapter** | pi SDK 或 RPC 子进程 → 内部领域事件 | `src/adapter/` |
| **Runtime（上游）** | 模型、工具、会话、项目资源 | pi 包 / 子进程 |

下图展示当前分层与调用方向。实现范围和产品验收以 ACTIVE 及历史记录为准；本图不证明完整边界已经验收。

<!-- docs-i18n: localized-mermaid -->
```mermaid
flowchart TD
    U["用户"] --> W["UI：侧栏 Webview<br/>src/webview/"]
    W <-->|"版本化意图与宿主状态投影"| H["扩展宿主<br/>src/extension/"]
    H <-->|"运行时生命周期与领域事件"| A["适配层<br/>src/adapter/"]
    A <-->|"子进程 JSONL RPC"| P["上游 pi 运行时<br/>npm 依赖，不在本仓库 src/ 内"]
    H <-->|"供应商认证与已保存默认"| S["公开 pi SDK<br/>ModelRuntime、SettingsManager、pi-ai"]
    A -->|"有界 session-worker 协议"| J["短生命周期会话 worker<br/>公开 SessionManager"]
    E["扩展入口<br/>src/extension.ts"] -->|"注册视图和命令"| H
```

三条集成路径职责不同：agent 执行使用子进程 RPC；保存会话读取使用适配层的独立 worker；供应商配置在特权宿主内调用公开 SDK。宿主 SDK 调用不嵌入 agent 循环，也不向 Webview 暴露 SDK 能力。持久化与生命周期责任见下方所有权章节。

### 源码目录

目录在各层内部聚合已有职责，不代表独立 npm 包或额外运行时层次。

| 目录 | 职责 |
|------|------|
| `src/extension/bridge/` | Webview 资源壳、入站消息校验与输入限制 |
| `src/extension/contracts/` | 宿主拥有的 Webview DTO、运行时／会话接口与审批 envelope 契约 |
| `src/extension/models/` | 模型目录校验、已应用／待应用实时设置、供应商认证、已保存默认与自定义端点配置 |
| `src/extension/draft/` | 草稿提交与编辑器附件捕获 |
| `src/extension/editor-tools/` | 审批策略、未保存文件保护与修改审阅 |
| `src/extension/sessions/` | 宿主侧保存历史阅读与预览协调 |
| `src/extension/interactions/` | 标准交互准入、队列、答复权与视图投影 |
| `src/extension/extension-loading/` | 原生受信入口选择、规范身份检查与加载同意 |
| `src/adapter/runtime/` | 实时 pi RPC 进程、请求应答配对、帧翻译、任务忙闲、模型解析及活动／错误投影 |
| `src/adapter/sessions/` | 公开 pi 会话 API helper 与历史投影 |
| `src/adapter/ownership/` | 持久恢复域、supervisor／控制通道、精确子进程回执与遗留运行交接 |

目录 `index.ts` 对跨模块目录的调用者暴露所需操作与纯类型契约。模块自有类型放在本目录 `types.ts`，跨层 Webview DTO、运行时生命周期和会话接口仍以 `src/extension/contracts/` 为单一宿主权威。模块内部仍可直接导入实现文件。`src/extension.ts` 装配宿主与适配层入口。浏览器代码仅以类型方式导入宿主拥有的契约；单独打包的 session-worker 和 approval-gate 入口保持明确的实现文件路径。

`piChatViewProvider.ts` 留在宿主根目录承担协调。适配层根目录保留独立打包的 `approvalGate.ts` 及运行时／会话集成共同使用的环境和路径辅助模块。契约仍归宿主拥有；浏览器消费纯共享类型，不导入特权实现。模块测试放在各模块的 `tests/`；层级 `tests/` 保留跨模块协调测试和共享夹具。构建产物位置不变。

## 3. UI 布局（产品默认）

| 表面 | 作用 | 默认 |
|------|------|------|
| **主侧栏** | Explorer、SCM 等 | 不变（文件树在左） |
| **辅助侧栏** | pi 聊天 **Webview View** | **首选** 停靠（`viewsContainers.secondarySidebar`） |
| **主侧栏回退** | 宿主回退位置中已注册的 Pi webview | 1.105.1 的 Explorer 回退已验证；Focus Chat 先发现专用容器是否存在再展开。其他宿主须单独取证。 |
| **编辑区 Panel** | 整页聊天 | **停车场**（可选，非 MVP 默认） |

命令 `pi-vscode.focusChat` 从编辑器标题或命令面板显示现有容器并聚焦聊天视图。位置兼容性须在目标宿主验证。

## 4. 信任边界

- **密钥**：仅特权宿主／运行时集成，**不得**进入 Webview 消息、HTML 或存储。供应商登录通过原生宿主提示和公开 `ModelRuntime.login` 使用 pi 认证存储，不新增并行产品凭据库。渲染器仅接收有界就绪元数据，不接收凭据或 OAuth 验证码／授权 URL。
- **Webview**：无 `require`、无直连 pi SDK、无文件系统/shell；仅[消息契约](../reference/webview-messages.zh.md)中定义的结构化消息。
- **工作区**：host 按用户操作与 VS Code 信任读写；webview 经消息请求能力，host 校验。
- **会话**：除非 Accepted ADR 明确允许，会话功能不随意读写 pi 会话文件；优先 SDK/RPC。
- **诚实性**：不把 webview/extension host 宣传为对抗不可信代码的沙箱；工具与 shell 能力仍由上游 pi 设计决定。

## 5. 主流程与生命周期

1. **打开**：用户在辅助侧栏打开 pi 视图 → host 创建/保留 `WebviewView` → 通过 `asWebviewUri`、严格 CSP 与脚本 nonce 加载打包的 React／TypeScript 应用（`dist/webview/webview.js` 和 `webview.css`）；`localResourceRoots` 仅包含该资源目录。
2. **聊天**：webview 发用户输入 → host → adapter → pi 流式 → host 转发有界展示投影到 webview（过滤不保证任意输出完全无敏感信息）。
3. **视图释放与运行时关闭**：释放或替换 Webview 时，`PiChatViewProvider.clearView()` 清理视图监听及视图绑定操作，不停止运行时，也不清空宿主聊天／待选设置；重建视图后从宿主重新同步。Provider 释放（含扩展清理）时，取消运行时事件订阅，清空聊天／待选设置及审批／授权，请求 `runtime.stop()`，并释放视图／工作区监听。Adapter 负责有超时边界的子进程关闭；这不保证取消所有后代进程。

**已接受 WI-015／WI-019 前端边界：** host `bridge/webviewHtml.ts` 仅提供资源壳，`main.tsx` 经 `chat/index.ts` 的 `mountChat`（设置页为 `mountSettings`）挂载共享 React 展示。`chat/types.ts` 定义挂载与页面语言契约。真实 bridge 管理传输寿命，WebviewClient 保持投影、身份与草稿权威；host 保持执行、审批、附件、会话与持久化权威。浏览器不导入 Node、VS Code 或 pi 运行时代码。Vite 构建浏览器，esbuild 构建 host／gate。Q16 由代理按本次委托完成评估后，正式与预览共享 chat 组合、样式、消息／活动／安全 Markdown、会话／历史／审批／审阅控件。预览 owner 仅保留合成 bridge、场景、计时器及开发控件，生产图排除 preview 和 tests。历史 baseline-app 夹具已删除；Attachment snapshot、Saved session 与转录仅由生产 chat 组合呈现。卸载释放 client、root 及监听；合成 owner 另释放自己的定时器。Markdown 仅由白名单 React 元素呈现，不注入 HTML／嵌入资源，不新增 host 意图或改变审批／附件原文。[Accepted ADR 0003](../decisions/0003-react-webview.zh.md) 记录委托验收与独立宿主／安装证据；[ACTIVE](../../ACTIVE.md) 持有剩余工作。

**已接受的 WI-026 方案 A（2026-09-29，维护者 F5 视觉验收）：** `bridge/settingsPanel.ts` 拥有单实例编辑区 WebviewPanel，重复 `openSettings` 揭示已有页面。它使用相同打包资源和 CSP、独立随机 viewId 及当前宿主 generation；入站白名单只允许 bootstrap、界面语言和供应商／默认意图，不投影工作区／聊天、草稿、审批或历史。ProviderConfig 和默认应用到会话仍由 PiChatViewProvider 及现有宿主服务处理。关闭面板只清理自己的监听与标识，聊天／runtime 继续；Provider dispose 同时释放设置面板。`main.tsx` 按宿主写入的 surface 标记选择 `settings/index.tsx`，该标记不授权渲染器改变宿主能力。

界面语言仍属展示层，语言包及本地 store 留在 `chat/`。协调器新增共享内存 locale（初始英文），向两个视图投影经验证的 `uiLanguageState` 并接收 `setUiLanguage`。任一视图重建恢复宿主语言，宿主重启重置；这替代 WI-019 仅挂载期的语言寿命。切换保留 client、草稿、会话与原文，不引入磁盘偏好；预览 Reset 保留自身语言 store。Decision none：既有低信任渲染器／特权宿主边界、持久化和 runtime 集成策略不变。维护者于 2026-09-29 确认 F5 视觉验收；安装 VSIX 仍未验证。


候选无文件夹欢迎页通过既有 client `edit`／版本化 `updateDraft` 编辑草稿（该路径原本独立于运行时就绪状态）。其发送分支只打开 `chat/no-folder-prompt.tsx`，不会在该状态调用任务提交。提示使用既有命名 `openFolder` 意图；工作区／信任／资源资格继续由 host 决定。不另持草稿、不选择工作区、不持久化或重放。原生弹窗寿命与返回焦点归候选展示负责，其他阻断状态保留既有资格规则。

Unix 控制端点在路径不超过 103 字节时继续使用恢复目录内的 socket；超长路径使用由绝对恢复目录与 run ID 派生的有界 `/tmp/pi-vscode-<SHA-256>.sock`。supervisor 继续负责绑定、`0600` 权限与清理；绑定前不删除已有端点。fence／receipt 存储及 Windows named pipe 不变。

**WI-013已接受边界（2026-09-28 Asia/Shanghai）：** [Accepted ADR0002](../decisions/0002-interaction-contract-route.zh.md)规定显式受信加载、host-owned标准交互、公开adapter seam、被动supervisor与持久恢复fence；精确v3 DTO归[消息契约](../reference/webview-messages.zh.md)。[委托验收](../archive/2026-09-28-wi-013-acceptance.zh.md)分别记录真实扩展、原生F5、安装、多窗口及限制，不表示全生态兼容或三项广泛gates关闭。

### RPC 进程策略（WI-028）

`createPiRpcRuntime` 必须接收 `runtime/process/types.ts` 定义的 `RuntimeProcess`。它仍是生命周期与用例编排者：启动、发送、模型操作、重启检查及 Stop。三个内部模块分别拥有 RPC 工作，不是宿主 API：

- **请求应答配对**（`rpc-replies.ts`）拥有请求编号、待应答、分发、超时、连接失效清理及可暂停的启动剩余时间预算。写入回调、背压和单次发送凭证仍由发送编排负责，避免把 RPC 应答当成写入完成。
- **帧翻译**（`rpc-frames.ts`）拥有 JSONL 解析、分类、`ActivityProjection` 及有序 `RuntimeEvent` 映射。它不访问子进程、不写入流、不执行审批回调；编排者把已分类的 hello、反馈、对话框和审批结果交给现有组件。
- **任务忙闲**（`rpc-occupancy.ts`）拥有发送、ACK、扩展命令、agent、Stop、对话框及审批占用的命名转换。发送准入、重启检查、释放分类和停止完成共用此状态，但不合并成一个空闲标志。任务结束与 ACK 到达相互独立；扩展命令结束不等于 agent 结束。

RPC 仍拥有就绪、会话身份及共享五秒 Stop 观察预算。连接失效先撤销适配能力再清理；旧连接结果保持隔离。其 `RuntimeLink` 只暴露 stdin、stdout 与连接丢失订阅，没有原生终止能力。进程策略拥有启动取消、释放串行化、清理及策略专属恢复文案。RPC 清空状态前区分空闲与不确定释放，包括返回的连接尚未接入的间隙。

生产装配选择 `createManagedProcess(createRuntimeOwner(...))`。干净释放结束并退休已观察的工作；不确定时断开并排空输出，不关闭输入或自动结束托管子进程。启动未完成或缺失退出证据时禁止恢复／替换。现有 owner 仍按 ADR0002 拥有持久栅栏与精确子进程回执。直接 spawn 策略仅由 attachment spike 显式选择，保留有界 SIGTERM／SIGKILL 清理；依赖图测试确保它和测试辅助文件不进入生产。运行时测试共用内存进程／字节连接，另有原生策略及生产组合回归。宿主生命周期、Webview 契约、pi 版本与恢复存储不变。当前验证与未验证的宿主／安装包证据归 ACTIVE。

WI-033 补强现有所有者：帧翻译先使用纯 `rpc-events.ts` 解码器，再进入 `ActivityProjection`；请求配对核对预期命令及布尔结果，区分本地传输故障与远端响应。编排器把协议故障送入既有不确定释放流程。解码类型仅在适配层内部使用，不是宿主／Webview 契约。[消息契约](../reference/webview-messages.zh.md#运行时协议失败wi-033) 负责失败与兼容行为。不改变进程所有权或 ADR0002 恢复规则。

### 启动遗留运行时交接（WI-035）

**已接受的启动限定替代：** [Accepted ADR 0006](../decisions/0006-owned-runtime-handoff.zh.md) 在所需验证及本次明确委托的代理接受后采用 WI-035，只取代 ADR 0002 的下一宿主启动仪式。ADR 0002 的共享域准入与会话内 Stop／协议恢复仍保持 Accepted。[WI-035 证据](../archive/2026-09-30-wi-035-macos-acceptance.zh.md) 区分实际 F5／安装、活所有者安全与未验证分支；不接受 gate 或整份 PRD。

`onView:pi-vscode.chat` 激活、构造 provider 后开始一个仅宿主使用的 `handoffRetainedRuntime()` promise，不是无条件 VS Code 应用启动 hook；请求启动时等待它，并重新核对 disposal、工作区身份、资格与资源选择。单独 Webview bootstrap／重建不重做交接。宿主能力可选以兼容注入 lifecycle；生产经 RPC 装配转入进程策略的必需 handoff。不新增渲染器意图或 DTO。

ownership 拥有观察、原始 run 身份、结束授权与匹配持久回执退休。只有 `owner-lost` 自动结束。另一窗口的活 `owned` 运行不受影响；对应新窗口无 End／Recover 控件，尝试准入只报告共享域占用。空域／已退休结果清除失效启动恢复状态；观察／退出／存储／退休失败保留 barrier 和既有显式恢复。managed-process 与 cleanup 串行交接，拒绝活跃／在途启动，清除 blocked 前检查 generation。launch 等待之前排队的 cleanup／handoff。后来成功取得自己的运行时会清除 elsewhere-owner 标记，使本宿主后续不确定状态仍显示恢复。

共享 `globalStorageUri/recovery-v1`、精确子进程记录、会话内 Stop／协议不确定性和 direct spike 清理不变。控制确认或 `exited`／`never-spawned` 状态不能代替匹配终态回执。退休写入者崩溃仍保守阻断，并发退休不保证每个调用成功；子进程退出不证明后代终止或文件回滚。精确预算与 v3 投影行为归 [ADR 0006](../decisions/0006-owned-runtime-handoff.zh.md)及[消息契约](../reference/webview-messages.zh.md#启动交接wi-035)，实际验收与限制见 [WI-035 归档](../archive/2026-09-30-wi-035-macos-acceptance.zh.md)。

### 宿主内部能力模块

宿主仍作为一个扩展统一打包。`PiChatViewProvider` 拥有工作区／视图身份、运行时就绪状态、实时执行投影、Stop 与顺序会话交接，组合具体内部模块；不引入动态加载、第三方宿主 API 或通用命令总线。

| 模块 | 拥有的实现 | 协调者使用的接口 |
|------|------------|------------------|
| `DraftSubmission` | 已确认正文、附件捕获／确认、有界不可变提交历史、分块预览、文档订阅及准备取消 | 已校验草稿意图、发布、重置／视图生命周期、准备取消、完成通知与只读修订号／ACK 状态 |
| `EditorTools` | 审批策略组合、未保存文件检查及可选 `ChangeReview` 资源 | pi 审批回调、已校验工具／审阅意图、任务通知、取消／重置／释放 |
| `ModelSettings` | 已应用／待应用模型设置与过期操作失效 | 选择、加载／应用、重置／取消及只读投影 |
| `ProviderConfig` | 公开 SDK 供应商认证、模型目录、已保存默认与自定义端点配置 | 已校验供应商／默认意图、原生提示和有界无密钥投影 |
| `SavedHistory` | 恢复会话的历史窗口、请求关联文本预览与取消 | 恢复、分页／预览、发布／重置及 helper 完成屏障 |

模块接收窄能力与只读上下文，不持有 Provider 或其可写状态。草稿接纳在单次运行时发送前同步通知协调者；交付 ACK 与任务完成仍是不同事实。草稿重置通过模块自身 epoch 使已接纳提交的迟到回包失效。视图关闭只取消未提交准备／预览，已确认草稿及已接纳提交仍归宿主管理。协调者继续拥有原生会话确认及跨模块交接顺序。

`EditorToolOptions.changeReview: false` 是由测试验证的内部组合选择：不创建审阅快照、watcher 与虚拟文档 provider，但保留审批及未保存文件保护。生产默认仍启用，不新增用户设置或由 Webview 关闭保护的权限。这证明一个可选能力可省略，不代表所有功能均已独立可切换。

模块测试使用 VS Code 夹具，不构造 Provider；组合测试额外覆盖省略审阅后的聊天／流式／Stop。既有附件、审批、模型与会话交接回归覆盖它们的交互。当前检查和真实宿主限制归 ACTIVE 管理；内部重构不接受架构 gate，也不实现通用 pi 扩展 UI。

## 6. 架构 Gate

[Gate 表](../reference/architecture-gates.zh.md)是状态与接受范围的唯一入口；[ADR 0001](../decisions/0001-build-baseline.zh.md)保存最小宿主／侧栏／RPC 基线决定。当前未决边界和 ADR 缺少条件由 [ACTIVE](../../ACTIVE.md)跟踪。代码存在或限定 WI 关闭不等于完整架构结论已接受。

## 7. 受控执行所有权（WI-010 已关闭，2026-09-21）

- **宿主策略：** `src/extension/editor-tools/toolApproval.ts` 拥有待审批卡与会话授权。仅工作区内 canonical 普通文件 `read` 自动允许。搜索／列目录询问；不存在／无法解析目标仅允许一次。既有文件授权绑定工具 + canonical 路径；shell 绑定工具 + canonical cwd + 完整输入。插入待审批卡时在写入点重检八张上限，并发预检查不能放出第九张。不持久化授权，不提供自由执行模式。规范化不能防止所有检查／使用竞态。
- **八张卡准入（WI-040，2026-09-30 接受）：** `ToolApprovals.evaluate` 在异步安全／范围检查之后、写入卡片的位点重检 `pending.size >= 8`，因此九个并发 custom-tool 预检查不能放出第九张卡。取消与错误仍释放已占用槽位。这是本地准入不变量；不宣称已修非法投影、断连或内存耗尽。[验收与限制](../archive/2026-09-30-wi-040-macos-acceptance.zh.md)。
- **契约所有权：** `src/extension/contracts/approvalProtocol.ts` 拥有纯捆绑 gate envelope 类型与校验器；adapter 消费这一宿主契约，不导入审批策略。`src/adapter/runtime/runtime-errors.ts` 拥有运行时错误归一化与长度限制。`toolApproval.ts` 保留授权决策及文件系统范围检查。
- **执行边界：** `src/adapter/approvalGate.ts` 打包为 `dist/approval-gate.mjs`（构建与 package 声明已包含）。公开异步 `tool_call` hook 通过 `ctx.ui.confirm` 等待；产品 v1 协议绑定 runtime／cwd、request／tool-call ID 与完整输入。`src/adapter/runtime/pi-rpc-runtime.ts` 拥有对话回复并校验 hello／就绪。不存在通用审批 RPC 或按标题授权。文件缺失拒绝启动；hello/get_state 失败停止启动，不是可用的无工具回退。
- **交付运行时闭包（WI-039，2026-09-30 接受）：** 交付 bundle 只允许把扩展宿主模块 `vscode` 与由 supervisor 以子进程启动 CLI 的 pinned `@earendil-works/pi-coding-agent` 留在自身之外。它加载的其他每个裸标识符都必须内联进该 bundle 或随包装入 `node_modules/`；组包拒绝「交付 bundle 加载未随包发布的依赖」，解包验证器则在解包扩展根目录真实 `import()` 每个这样的标识符。`@earendil-works/pi-ai` 因此内联进 `dist/extension.js`；声明的 pi 版本、供应商／SDK 路径与模块责任不变。[验收与限制](../archive/2026-09-30-wi-039-macos-acceptance.zh.md)。
- **受控配置：** CLI 使用 `--tools read,write,edit,bash,powershell,grep,find,ls --no-extensions -e <bundled gate>`，并保留资源 flag。即使同意资源，也禁用第三方扩展发现。其他上下文／资源类别不因此全部排除。自带扩展以用户代码权限运行；不是沙箱，不承诺完整约束 shell／网络。
- **投影与生命周期：** `runtimeLifecycle.ts` 定义活动／最终消息／运行时错误事件及窄 `abortTask`／审批 handler 注入。`activityProjection.ts` 按消息／内容索引关联真实 thinking，按 tool-call ID 关联工具，替换累计输出并限制展示字段。`PiChatViewProvider` 拥有投影时间线及执行状态；`EditorTools` 拥有审批生命周期，由协调者通知重置／取消。Stop 在 adapter `clear_queue` + `abort` 前取消待审批；未 settled／失败则明确报错并撤销 transport／answer 接纳，按 ADR0002 保留 exact-child 观察；不自动杀死不确定工作。成功 Stop 保留同一运行会话授权；替换／断开清除。延后设置等待 settled 及停止完成。不回滚副作用、不自动重试任务。
- **契约／安全：** [contract-webview-messages](../reference/webview-messages.zh.md) 记录精确入站动作与有界 DTO。不开放通用命令，不转发原始 runtime／stderr；凭证模式过滤尽力而为，不保证任意输出完全无密钥。增量 UI、逐项及预留总量超限提示、稳定展开／焦点／滚动、完整审批输入、授权撤销与保留草稿的 Stop 已实现并有 UI 测试覆盖。维护者已确认四项开发态 F5：thinking／状态、读取／工具卡、拒绝写入无副作用后允许写入、长时间无害命令 Stop。限定 WI 已关闭；不推断已安装 VSIX 或完整手动矩阵验收。

**WI-016 T016-01 补充：** host `writeProtection.ts` 将声明版本的内置 write/edit 目标映射到活跃 VS Code 文档元数据和文件系统身份。`ToolApprovals` 在提供审批及授权放行前检查，异步过程共用到期点和 epoch；重检 grant 撤销，并仅在保护通过后创建 session grant。沿用有界错误投影解释拒绝，不新增 Webview 文件权限、自动保存、持久化或工具替换。公开执行前 hook 不能提供编辑器／写入原子锁，也不能覆盖不透明 shell／扩展绕过。[消息契约](../reference/webview-messages.zh.md) 管理细节，ACTIVE 管理当前证据；T016-02 `ChangeReview` 管理有界的纯内存快照、合并后的工作区观察和只读虚拟文档 diff。Adapter 完成事件独立于 activity 展示限额。Webview 只接收元数据与不透明 ID；最终授权失败丢弃临时快照，runtime 替换使快照／迟到工作失效。

**缺失路径本地化（WI-045，2026-09-30 接受）：** 没有路径的审阅条目正文与 tooltip 共用同一翻译入口。这是展示一致性，不是捕获或授权变更。[验收与限制](../archive/2026-09-30-wi-045-macos-acceptance.zh.md)。

**环境与覆盖：** [`controlledEnvironment.ts`](../../src/adapter/controlledEnvironment.ts)强制 `PI_OFFLINE=1`／`PI_TELEMETRY=0`，保留可信用户 provider 配置及凭证命令；后者在工具审批范围外。Offline 限制启动网络／缺包安装，不隔离推理或工具网络。

**证据与成熟度：** [原WI-010历史](../archive/2026-09-21-closed-wi-history.zh.md#wi-010)保留其版本与限制。[ADR0004](../decisions/0004-trust-and-lifecycle.zh.md)经当前源码审查、公开pi探针、实际原生F5与安装VSIX验证，另行接受剩余信任／生命周期边界。该范围达到Evolvable，不声称全provider／OS／fork支持。最终WI-010收尾及证据由ACTIVE链接。

## 8. 模型设置所有权（WI-008／WI-009）

`ModelSettings`（`src/extension/models/modelSettings.ts`）拥有已应用设置、独立的 `pendingModel`／`pendingThinkingLevel` 与在途操作失效管理。`PiChatViewProvider` 提供运行时／工作区身份与执行资格，在生命周期变化时调用重置／取消，并将只读模型快照合入 Webview 投影。空闲时立即应用，活动回复期间分别记录最新意图；当前会话 `agent_settled` 后，在 `modelBusy` 下串行修改模型、刷新能力、校验并修改 thinking。失败回读实际状态，不自动重试修改。代次／运行时 session／目录 token 拒绝过期完成；意图跨视图重建保留，工作区／资格变化、运行时替换及 provider 释放会清除。

Webview 仅展示已应用／待应用状态并发送允许列表意图；adapter 映射公开 RPC。具体错误、Stop 交错及清理语义见[消息契约](../reference/webview-messages.zh.md)，界面要求见 [REQ-002](../product-requirements.zh.md#req-002--模型就绪)。

模型与 thinking 切片的范围、分层证据及关闭分别见 [WI-008 验收](../archive/2026-09-28-wi-008-model-acceptance.zh.md)与 [WI-009 验收](../archive/2026-09-28-wi-009-thinking-acceptance.zh.md)。它们不表示整份 PRD 或全部环境已接受；当前工作与限制归 [ACTIVE](../../ACTIVE.md)。

**稳定模型身份（WI-042，2026-09-30 接受）：** `ModelPickerView` 先用供应商／模型 id、再用唯一显示标签，最多标记一个已应用 radio。同名标签、以及标签与另一模型 canonical 组合碰撞时不会选中两个。这是展示唯一性，不是运行时选错结论。[验收与限制](../archive/2026-09-30-wi-042-macos-acceptance.zh.md)。

**已消费 Escape（WI-043，2026-09-30 接受）：** 窗口级模型弹层 Escape 忽略输入法组合与已被标记 `defaultPrevented` 的事件。重叠的添加上下文菜单可以消费 Escape 而不关闭弹层。jsdom 证据，不是 macOS 宿主键盘验收。[验收与限制](../archive/2026-09-30-wi-043-macos-acceptance.zh.md)。

### 供应商配置与已保存默认

`src/extension/models/` 中的 `ProviderConfig` 从声明的 pi coding-agent 发行版导入公开 `ModelRuntime`、`SettingsManager`，并使用 pi-ai 能力函数。它拥有供应商就绪状态、原生 API-key／OAuth 交互、默认模型及逐模型 thinking 设置。pi 认证存储与设置仍为权威，不新增 provider 栈、agent 循环或产品 SecretStorage 副本。Webview 接收有界无密钥投影并发送具名意图，不调用 SDK。已保存默认与已应用／待应用实时会话设置不同，跨模块应用顺序仍归协调者。

宿主 `customEndpoints.ts` 向公开文档定义的 pi `models.json` 写入有界无密钥条目，凭据仍经公开 login 保存。[Draft ADR 0005](../decisions/0005-custom-endpoint-file.zh.md) 记录该批准切片与剩余验证，不代表架构已接受或真实端点认证。精确供应商／默认 DTO 与失败语义归[消息契约](../reference/webview-messages.zh.md)。

已接受 WI-038 中，`customEndpoints.ts` 拥有文档校验／合并，`endpointFileTransaction.ts` 拥有规范化路径身份、跨宿主互斥、替换与自有资源清理；`ProviderConfig` 只在干净提交后继续重载／登录／注销。[Accepted ADR 0007](../decisions/0007-endpoint-write-transaction.zh.md) 记录立即拒绝争用、保守遗留锁与外部编辑尽力检测。精确结果语义归消息契约。[验收与限制](../archive/2026-09-30-wi-038-macos-acceptance.zh.md)。

### 保存会话 helper（WI-017）

Agent 执行仍使用 subprocess RPC；独立短生命周期 adapter helper 导入声明发行版的公开 SessionManager，负责当前项目列表、身份校验与活动分支历史；extension host 不为保存会话读取加载 SessionManager，也不解析 session 文件。这一 worker 隔离不禁止前述独立宿主供应商／设置 SDK 路径。生产包包含 dist/session-worker.mjs 与声明发行依赖。报文版本、上限和请求／响应校验的唯一来源是 `session-worker-protocol.ts`。宿主拥有进程生命周期，worker 拥有 SessionManager 调用与流读写。Helper 有输入／输出上限、期限／取消与实际 close 观察。Host 拥有原生交接确认、Stop／settlement、当前资源策略、fresh grants 及不透明 UI 能力。运行时就绪校验请求的公开会话 ID 与路径，不匹配则保持未就绪。UI 历史窗口与不可变保留文本分块不定义模型上下文、不恢复当前工作区文件。参见[消息契约](../reference/webview-messages.zh.md#wi-017-t017-03--有界恢复历史与保留文本契约)及 ACTIVE 的实现／验证状态；[WI-017委托接受](../archive/2026-09-28-wi-017-session-acceptance.zh.md)不自动接受广泛gate／ADR。

**请求关联（WI-041，2026-09-30 接受）：** `parseSessionWorkerResponse` 将 inspect 会话 id、history 页码与 preview offset 绑定到本次请求。非终态预览必须推进游标；`done` 必须与剩余字符一致。list 已对照页码。解析器反例不证明真实 worker 会发出这些帧，或所选会话已被错误切换。[验收与限制](../archive/2026-09-30-wi-041-macos-acceptance.zh.md)。
