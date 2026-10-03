# pi VS Code 与 pi 0.86.1 的功能差距

[English](2026-10-01-pi-feature-gaps.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-pi-feature-gaps.md](2026-10-01-pi-feature-gaps.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-03
- 类型：讨论
- 状态：Open
- 创建：2026-10-01
- 权威：仅源码／文档比较；不是实现批准或验收

## 状态更新 — 2026-10-03

下文比较保留 10 月 1 日基线，不是今天的缺失功能清单。文字 steering／follow-up 与 slash 菜单已按 WI-077／078 关闭；用量、当前已打开会话重命名、当前会话完整成功回复复制已按 WI-079／080／081 关闭。批准范围与证据限制见[验收索引](../archive/2026-09-29-closed-wi-index.zh.md)，剩余工作见 [ACTIVE](../../ACTIVE.md)。队列附件／slash／模板展开及实际加载报告仍停车；未打开会话重命名、历史预览复制不属于已验收切片。其他讨论候选仍为背景，不是实现授权。

## 基线与证据

比较声明和已安装的 pi coding-agent **0.86.1**，不以持续变化的上游 main 为基线。文档所述兄弟目录 `../pi` 在此检出不存在。阅读了已安装包 README／RPC 文档及上游[标签 README](https://github.com/earendil-works/pi/blob/v0.86.1/packages/coding-agent/README.md)和[标签 RPC 契约](https://github.com/earendil-works/pi/blob/v0.86.1/packages/coding-agent/docs/rpc.md)。本讨论未执行 runtime 或真实宿主验证。

本地证据：[协议](../../src/extension/contracts/webviewProtocol.ts)、[客户端准入](../../src/webview/client/client-state.ts)、[RPC 适配器](../../src/adapter/runtime/pi-rpc-runtime.ts)、[会话后端](../../src/extension/contracts/sessionBackend.ts)、[供应商配置](../../src/extension/contracts/providerConfig.ts)、[交互](../../src/extension/contracts/extensionInteractions.ts)、[PRD](../product-requirements.zh.md)和 [ACTIVE](../../ACTIVE.md)。

## 当前比较

基本发送、流式／思考／工具活动、模型选择、Stop、审批、文本附件、当前项目已保存会话恢复、供应商 API key／OAuth 操作和自定义端点已有产品入口，不应列为完全缺失。这是源码证据，不是新跑的安装包验收。

| 领域 | 剩余产品入口差距 |
|---|---|
| 运行中输入 | 忙碌时禁用发送；没有 steering／follow-up 队列 UI 或取回工作流。Stop／clear_queue 不等于这套工作流。 |
| 会话探索 | 没有专门的 tree／fork／clone／书签工作流；当前后端列举、检查、预览已保存历史。会话分支不是文件回滚。 |
| 上下文控制与用量 | 已有自动压缩／重试状态；当前协议没有专门的手动 compact／自定义指令入口或上下文／token／缓存／费用面板。内部统计读取不等于面板。 |
| 输入 | 已有整文件和选区文本附件；没有图片附件意图或输入框 @ 模糊文件／路径补全。 |
| 资源发现 | 不应称 Trusted 扩展命令、上游 skills／模板完全缺失。输入框没有命令／资源发现菜单；兼容性是代表性范围，不是任意生态对等。 |
| 资源管理 | 已有本机扩展清单，但不是 pi 的 npm／git 包安装／更新／资源过滤管理或市场。额外清单应用限一个启用扩展。 |
| 用户 shell／导出 | 没有专门的用户 bash 执行及是否加入上下文选项，也没有 HTML／JSONL 导出／导入／分享入口。Agent 的 bash 工具是另一种能力。 |
| 扩展 UI | 已有有界标准对话框和文本反馈。终端自定义组件／渲染器／快捷键不等价于 Webview 接口；RPC 本身也限制终端自定义 UI。 |

## 判断与未决选择

主要差距是暴露更多上游工作流，而不是重造 Agent 核心。当前验收工作之后的候选优先级：steering／follow-up、命令／资源发现、上下文统计／手动压缩。仅为建议，不改变队列或批准 Build。会话分支、包安装须另行明确产品／信任范围。

在此锁定版本，plan mode、子 Agent、MCP 集成属于扩展能力，不是缺失的内置对等功能。持续变化的上游 main 目前文档已有内置 MCP；这是单独的升级评估，不是 0.86.1 证据。

README 的宽泛完成表述与后来的 WI-070 macOS 证据矩阵不能互换。本讨论没有跑该矩阵；WI-070 后来记录了当前安装包格子并写明限制。

## 补充比较（2026-10-01）

第二轮命令／设置核对发现以下超出 ACTIVE 中 PI-GAP-01–11 的独立差距。这些是讨论发现，不是新批准的待办。缺少产品控件不证明 runtime 能力被禁用：适用的上游配置仍可能被消费，本次未做 runtime 验证。

| 领域 | 补充差距与证据 |
|---|---|
| 会话命名 | 可以读取已保存名称，但产品协议／适配器没有重命名意图或 `set_session_name` 调用。 |
| 临时会话 | 没有显式不持久化会话选项；生产启动不选择 `--no-session`。它只涉及 pi 会话持久化，不承诺没有日志、网络或供应商留存。 |
| 限定模型轮换 | 没有可编辑的快捷轮换模型子集或轮换模型／思考级别的产品操作。已有选择器和默认值并非缺失。 |
| 资源重载 | 没有类似终端 `/reload` 的 runtime 资源／上下文重载操作。清单刷新与供应商刷新是另一回事；须评估 RPC 可行性及重新核对信任。 |
| 高级 runtime 设置 | Settings 没有重试／延迟／超时、供应商传输方式、压缩预算、思考预算及缓存保温控件。这是设置入口差距，不证明上游行为被禁用。 |
| 工具选择 | Controlled 使用规定的 allowlist；没有用户可编辑的初始工具子集／仅检查工作流。省略 write／edit 不能把 shell 或 Trusted 扩展约束成沙箱。 |
| 丰富自定义模型配置 | 新建端点写入一个 OpenAI 兼容模型；没有多模型定义、API 类型、上下文／输出上限、能力／兼容元数据或 headers 编辑器。不证明外部 models.json 支持缺失。 |
| 本地模型生命周期 | 没有专门的 llama.cpp router 模型下载／加载／卸载 UI。本地端点或供应商登录不等于这套生命周期 UI。 |
| 交互／渲染细节 | 没有整条回复复制、Mermaid 渲染、扩展贡献的快捷键／帮助表或输入草稿转原生编辑器工作流。代码块复制已有；不必字面复刻终端快捷键／主题。 |

第一轮以外的证据：[端点写入器](../../src/extension/models/customEndpoints.ts)、[Settings](../../src/webview/settings/index.tsx)、[Markdown 渲染器](../../src/webview/chat/conversation/reply-markdown.tsx)；标签版本的[设置](https://github.com/earendil-works/pi/blob/v0.86.1/packages/coding-agent/docs/settings.md)、[模型](https://github.com/earendil-works/pi/blob/v0.86.1/packages/coding-agent/docs/models.md)、[llama.cpp](https://github.com/earendil-works/pi/blob/v0.86.1/packages/coding-agent/docs/llama-cpp.md)与[快捷键](https://github.com/earendil-works/pi/blob/v0.86.1/packages/coding-agent/docs/keybindings.md)。

倾向：命名和整条回复复制是小便利；高级配置在实际使用需要时有价值。工具配置、临时持久化、重载及本地模型管理须明确边界。不重排 WI-070，不把终端对等变成自动实现要求。

## 最后一轮命令核对（2026-10-01）

PI-GAP-01–23 之外，剩余有源码依据的差异更窄：

- 当前项目会话搜索、仅命名会话过滤和可选排序：上游会话选择器支持，产品目录当前是固定最近修改排序的分页列表。这不是全局跨项目发现。
- 确认删除已保存会话：上游选择器支持，产品 SessionBackend／协议没有删除操作。须先确认公开 API 可行性；本观察不授权直接操作会话文件或 ADR 例外。
- 实际启动上下文报告：终端 pi 展示已加载 AGENTS.md 与资源；产品有资源同意／清单，但没有等价的实际上下文文件报告。这是可观察性，不表示 AGENTS.md 没有加载；可归入 PI-GAP-02／15，不必另开 WI。
- 诊断报告工作流：pi 有可选附带会话的错误报告及导出／上传选项，产品没有专门等价入口。插件报告须区分插件／上游错误，敏感信息审查及目标同意必须显式。
- 版本／更新日志展示：没有等价的产品内 changelog 视图。这是维护便利，不是 Agent 执行能力缺失，也不是自动升级授权。

证据：前述标签版本会话／README 文档；[当前会话目录 UI](../../src/webview/chat/sessions/candidate-sessions.tsx)、SessionBackend 和 Webview 协议。仅静态比较，不是新的 runtime 验收。没有依据时，不把任意置顶、归档、checkpoint、并发 Agent 或操作系统支持加入 pi 内置对齐缺口。重要工作流基本已被 23 项候选覆盖，不应再把验收细节拆成更多功能。

## 启动选项与编辑器补充（2026-10-01）

PI-GAP-01–27 记录后，又确认两处产品入口差异：

- 系统提示词自定义：pi 支持 SYSTEM.md／APPEND_SYSTEM.md 和显式替换／追加 CLI 选项。产品没有管理这些选择的专门设置／意图。已有上游文件加载可能已经生效，本次未验证，不能称系统自定义完全不支持。未来 UI 须明确项目／全局、替换／追加、信任及实际生效配置，不能弱化宿主审批或工作区规则。
- 已提交输入召回：pi 编辑器支持前后浏览输入历史；产品输入框没有相应历史状态／操作。它与阅读已保存会话、PI-GAP-01 队列取回不同。保留未发送草稿并显式召回；取回文本不得静默重挂附件或重新发送。

证据：前述标签 README／快捷键文档；[输入框](../../src/webview/chat/composer/message-composer.tsx)、[runtime 启动](../../src/adapter/runtime/pi-rpc-runtime.ts)及 Webview 协议。仅静态源码证据。按键可与 PI-GAP-22 协调；系统提示词配置可作为高级设置下单独批准的切片。本讨论没有新增 ACTIVE 行或 Build 批准。

不宣称已穷尽任意第三方扩展兼容性。其他终端／CLI 入口或已延后的环境不自动成为插件需求，已有功能细节也不重复计数。


## 无人值守执行分组建议（2026-10-03）

维护者要求把 ACTIVE 剩余事项分组，并提供独立交付及本地提交的 Goal 提示词。本节记录代理建议，不是实施批准、新产品决策或已启动 Goal。ACTIVE 保留全部 25 项未完成事项及原验收边界。

- A 组（适合一次明确范围授权）：PI-GAP-02、04、06、14、21、24、26（仅可审查的本地诊断导出）、27。这些符合既有工作流边界，尚未发现新的重大产品／信任／数据决策。这里只做范围分类，不证明 API 可行性或真实宿主验收。
- B 组（无人值守 Build 前先确认剩余范围／决策）：PI-GAP-01、05、07、08、09、10、11、13、15、16、17、18、19、22、23、25、28。队列输入、图片、会话探索、配置字段及快捷键切片需要边界；包／模型下载、持久化、工具、shell、删除及敏感传输需要明确选择。扩展 UI 和重载评估可由 AI 做，但不提前批准评估后的支持矩阵或重启替代方案。编辑器缓冲区保存和输入召回保留规则仍需明确有界产品选择。这不意味着技术上只能由人完成。
- 诊断上传及敏感会话／源码内容收集仍是另行批准的可选切片，不属于 A 组。产品中的最终用户确认控件可以由 AI 实现，不等于开发时必需维护者介入。
- 后续执行提示词应明确批准 A 组有界交付，在仓库允许范围内委托常规可逆选择和基于证据的代理评估，授权隔离的本地提交，并保留实际 runtime／F5／安装 VSIX 检查。旧代理验收是有范围的历史证据，不是新切片的全局批准。缺少前置条件或强制决策仍属于未完成；不能仅凭静态分类承诺完全无人值守完成。

本次讨论仅做文档检查；分组未执行应用测试、API spike 或真实宿主验证。
