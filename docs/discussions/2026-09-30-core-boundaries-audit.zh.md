# 核心边界审查：附件、审批与进程控制

[English](2026-09-30-core-boundaries-audit.md) | 中文

- Type: Discussion
- Status: Draft
- 翻译状态: Machine Draft
- 权威原文: [English](2026-09-30-core-boundaries-audit.md)
- 原文版本: Uncommitted baseline
- 最近同步: 2026-09-30
- Scope: 只检查此前未覆盖的实现及相关新测试；排除 HTML/CSS 和前几轮已检查的文件。
- Authority: 仅记录证据与候选后续。先完成审查再修复；不修改应用代码，不批准实施、新建 WI、接受 ADR 或提交 Git。

此前发现：[架构待办](../../ACTIVE.md)、[UI 审查](2026-09-30-ui-components-audit.zh.md)、[运行时辅助模块审查](2026-09-30-runtime-helpers-audit.zh.md)。剩余文件跟踪：[审查进度](code-audit-progress.json)。

## 确认问题

### CORE-01／P2：并发预检查突破待审批容量限制

[ToolApprovals](../../src/extension/editor-tools/toolApproval.ts#L62)在异步安全检查和 scope 检查之前判断 `pending.size >= 8`。[插入卡片时](../../src/extension/editor-tools/toolApproval.ts#L71)没有重新检查，也没有预留容量。

9 个普通 custom-tool 请求可以同时通过空 map 检查，然后等待 initial 安全 hook。一起放行后，同时出现 9 张待审批卡片。隔离探针使用真实 manager 确认了 9 张，超过代码原本的 8 张上限。取消后 9 项均被拒绝，计时器清理。

确认的是本模块的准入不变量失效，不是审批绕过。本轮没有回查此前的 host／UI 校验器，因此不把投影无效、断连或实际内存耗尽写成已复现生产后果。

候选后续：在 await 前预留容量，或者在原子准入点执行上限检查，并覆盖所有取消／错误路径的槽位释放。回归应测试并发预检查，而不只是顺序插入。

### CORE-02／P2：worker 响应校验缺少请求关联和游标语义约束

[parseSessionWorkerResponse](../../src/adapter/sessions/session-worker-protocol.ts#L162)检查 inspect／history／preview 的形状，但不把 inspect 的 session id、history 的 page、preview 的 offset 与传入请求匹配。list 分支已经检查返回页码是否等于请求页码。

[preview 校验](../../src/adapter/sessions/session-worker-protocol.ts#L121)限制数值顺序，但允许非终态不推进，以及结束标记与剩余字符不一致。

以下五个形状合法的合成响应都被接受，返回 `ok: true`：

1. inspect 请求 `requested-session`，响应却是 `other-session`。
2. history 请求第 0 页，响应却是第 4 页。
3. preview 请求 offset 0，响应却从 offset 10 开始。
4. preview 文本为空，offset／nextOffset 均为 0，totalChars 为 20，done 为 false。
5. preview 只推进到 20 个字符中的第 5 个，却声明 done true。

对照场景中，list 页码不匹配会被拒绝。现有纯协议测试也通过，但没有覆盖上述反例。

确认的是解析器接受不一致响应，不证明真实 worker 会发出这些响应，不证明已经错误切换会话，也不证明此前检查过的下游没有额外保护。那些集成按要求没有回查。

候选后续：明确并校验请求／响应关联及推进／结束不变量。解析器反例与真实 worker 集成验收应分别记录。

## 接口风险，不是已确认工作流故障

[captureSelection](../../src/extension/draft/fileAttachment.ts#L95)把选区文本 source 返回为整文件捕获也使用的 `FileSnapshot`。[validateEditorSnapshot](../../src/extension/draft/fileAttachment.ts#L66)及整文件重验证比较全文与快照文本，选区验证则是另一套函数。类型允许把选区 source 传给错误的 validator。

没有重新打开此前检查过的调用方，也没有确认实际错误配对。后续修复／设计阶段可以考虑区分 snapshot 类型或添加判别字段，不把它计为额外确认生产故障。

## 新增覆盖清单

40 个新实现文件、3 个新测试文件，包含下方补充的接口／入口检查。本表供下一轮排除使用；源码检查不是所有分支或集成的验收。

| 本轮新文件 | 覆盖／证据 |
|---|---|
| [fileAttachment](../../src/extension/draft/fileAttachment.ts) | 完整返回实现；mock FS 捕获与验证检查 |
| [toolApproval](../../src/extension/editor-tools/toolApproval.ts) | 完整返回实现；并发容量探针 |
| [control-client](../../src/adapter/ownership/control-client.ts) | 完整返回实现；mock net 校验与清理检查 |
| [control-protocol](../../src/adapter/ownership/control-protocol.ts) | 完整返回实现；用于 control 检查 |
| [launch-supervisor](../../src/adapter/ownership/launch-supervisor.ts) | 完整返回实现；原生启动失败处理探针 |
| [direct-process](../../src/adapter/runtime/process/direct-process.ts) | 完整返回实现；仅 spike 策略，不宣称生产行为 |
| [pathIdentity](../../src/adapter/pathIdentity.ts) | 完整返回实现；native 拼写比较的职责 |
| [session-worker-protocol](../../src/adapter/sessions/session-worker-protocol.ts) | 完整返回实现；关联／游标探针及纯测试 |
| [approvalProtocol](../../src/extension/contracts/approvalProtocol.ts) | 完整返回 parser 与 contracts |
| [ownership types](../../src/adapter/ownership/types.ts) | 完整返回能力契约 |
| [chatBounds](../../src/extension/bridge/chatBounds.ts) | 完整返回常量 |
| [webviewProtocol](../../src/extension/contracts/webviewProtocol.ts) | 完整返回 DTO 定义 |
| [webview bridge](../../src/webview/bridge.ts) | 完整返回传输实现 |
| [sessionBackend](../../src/extension/contracts/sessionBackend.ts) | 完整返回契约及 unavailable 实现 |
| [tool-approval 测试](../../src/extension/editor-tools/tests/tool-approval.spec.ts) | 部分返回源码；依赖此前检查过的 helper，本轮不运行 |
| [file-attachment 测试](../../src/extension/draft/tests/file-attachment.spec.ts) | 部分阅读第 1–200 行；不进行逐断言审计或执行 |
| [session-worker-protocol 测试](../../src/adapter/sessions/tests/session-worker-protocol.spec.ts) | 部分返回源码；运行 3 项纯测试，明确跳过 1 项 worker 集成测试 |

## 补充接口与入口检查

同一轮另外检查了 26 个新源码文件，均完整返回内容，没有新增独立确认缺陷：

- 契约／host 类型：[extensionInteractions](../../src/extension/contracts/extensionInteractions.ts)、[providerConfig](../../src/extension/contracts/providerConfig.ts)、[runtime types](../../src/adapter/runtime/types.ts)、[editor-tool types](../../src/extension/editor-tools/types.ts)、[extension-selection types](../../src/extension/extension-loading/types.ts)、[saved-history types](../../src/extension/sessions/types.ts)。
- Adapter 导出入口：[adapter](../../src/adapter/index.ts)、[ownership](../../src/adapter/ownership/index.ts)、[runtime](../../src/adapter/runtime/index.ts)、[sessions](../../src/adapter/sessions/index.ts)。
- Host 导出入口：[extension](../../src/extension/index.ts)、[contracts](../../src/extension/contracts/index.ts)、[bridge](../../src/extension/bridge/index.ts)、[draft](../../src/extension/draft/index.ts)、[editor-tools](../../src/extension/editor-tools/index.ts)、[extension-loading](../../src/extension/extension-loading/index.ts)、[interactions](../../src/extension/interactions/index.ts)、[models](../../src/extension/models/index.ts)、[sessions](../../src/extension/sessions/index.ts)。
- Browser 导出入口：[chat](../../src/webview/chat/index.ts)、[components](../../src/webview/components/index.ts)、[webview](../../src/webview/index.ts)。
- Browser 类型：[chat types](../../src/webview/chat/types.ts)、[component props](../../src/webview/components/types.ts)、[transport/client types](../../src/webview/types.ts)。
- [Webview 启动入口](../../src/webview/main.tsx)：surface 选择、一次 API 获取、bridge 构造、pagehide 清理与通用启动失败提示。没有沿 import 回查此前检查过的组件，没有检查 CSS，也不宣称真实浏览器验收。

此前的部分阅读仍然排除。本轮另外两个新测试文件也有输出截断区段；执行三项纯测试不等于检查了每个断言。进度清单明确跟踪这些部分覆盖，不把它们写成完整测试审查。

## 验证与边界

- CORE-01 和 CORE-02 的五个变体均通过内存探针复现，使用真实新文件实现及 source-input 允许清单。
- 附件检查通过：dirty 整文件快照、document version 拒绝、取消、选区捕获不读全文、选区 revision 验证。FS 与凭据检测为 stub；凭据规则此前已审查，本轮不重复验证。只使用普通合成文本。
- Control 检查通过：observe 只发 observe、end 准入、非法 state 拒绝、错误 run 拒绝、4096 字节预算，以及五个 mock socket 全部清理。没有创建真实 socket endpoint。
- Supervisor 使用确认不存在的 cwd 进行原生 spawn，返回 startup-unconfirmed，并调用一次 never-spawned writer。持久化 observer 为 stub，不宣称真实 durable receipt 已写入。候选启动事件顺序问题没有复现，不作为确认缺陷登记。
- 纯协议测试：3 项通过、0 项失败；跳过 1 项 CLI 集成测试，避免载入此前检查过的 worker。
- esbuild 使用 write false 和严格 source 允许清单。没有重新打开或在探针中载入此前的 contracts barrel、write normalization、child-link、recovery observer、worker 或 host 组合。没有使用真实 pi 运行时、执行工具命令、使用真实凭据／会话／配置。计时器与待审批项均已清理，没有落盘探针样本。
- 没有运行完整测试、compile／lint、F5、安装 VSIX 或真实浏览器验收。按维护者要求排除 HTML/CSS。
- 只新增双语报告和机器可读审查进度；应用代码保持不变。文档检查结果在交接回复报告。
