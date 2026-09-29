# pi-vscode — 当前工作（跨会话入口）

本文件是唯一当前工作入口，不是需求／架构权威或追加日志。规则见 [AGENTS](AGENTS.zh.md)、[内核](AGENTS.kernel.zh.md)与[协作指南](docs/guides/agent-collaboration.zh.md)。更早检查点见 [9月27日](docs/archive/2026-09-27-active-checkpoint-history.zh.md)；WI-010 收尾见 [归档](docs/archive/2026-09-28-wi-010-goal-closure.zh.md)。WI-025 收尾、完整轮次与已替代交接见 [2026-09-29 WI-025 归档](docs/archive/2026-09-29-wi-025-active-superseded.zh.md)。

## Agent 会话契约（摘要）

| 步骤 | Agent |
|---|---|
| 开场 | 必要阅读、Git基线、当前WI／批准／Gate／PRD与验收核对；不把历史提案当当前授权。 |
| 提案 | Prepare保留范围与PRD判定；新增Build范围须批准；WIP最多1。 |
| 建造 | 按批准实现并实际验证；模拟／runtime／F5／安装分别取证，不虚报接受。 |
| 收尾 | 对照批准、记录代理或维护者的实际验收身份；正常ADR／gate、双语归档、检查与资源清理。 |

## 正在做（WIP=1）

| 字段 | 内容 |
|---|---|
| **ID** | WI-026 |
| **标题** | 设置文案精简与方案 A 编辑区设置页 |
| **阶段** | Build；维护者 2026-09-29 先授权删除标注文案，后要求根本重设计并明确选择方案 A。批准独立编辑区设置页与其必要桥接、聊天就近执行入口及双界面语言同步，不授权提交／推送。 |
| **PRD 判定** | 用户可见：双语 PRD 记录 WI-026 方案 A，覆盖 REQ-002／003：设置移至编辑区、执行入口移至输入区，语言在宿主内存共享；认证、模型应用及 runtime 权限语义不变。 |
| **Gate ID** | 无新 gate。 |
| **Decision** | none。 |
| **批准范围** | 原文案删除保留；用单实例编辑区设置页替代聊天设置弹窗，分类为通用／默认模型／供应商，含搜索、凭据详情、必要状态。执行配置在输入区附近按需展开；宿主共享 ProviderConfig，设置页独立标识和能力白名单，语言仅宿主内存同步。 |
| **范围外** | 不移动聊天到编辑区，不改 pi 密钥处理、默认模型应用、思考强度、执行权限和恢复规则，不增加磁盘语言偏好；WI-023／024 F5 仍独立。 |

### 目标与范围

删除标注说明并落实维护者选定的 A：设置在编辑区独立打开，聊天保持可见，分类呈现单项任务。仅 WI-026；不重开 WI-025 的已接受切片。

### 方案与架构核对

设置页面由独立 SettingsPanel 管理单实例、标识与限定白名单，只投影非秘密供应商状态及语言；复用现有 ProviderConfig 和模型应用路径。main 按宿主标记选择设置或聊天挂载。设置分类／详情独立，执行配置留在输入区权限展开层。语言仅宿主内存同步，不写磁盘。关闭设置不触碰聊天／runtime。Decision none：继续既有低信任 Webview／特权宿主边界、持久化及 runtime 集成策略；未引入不可逆技术选型。风险与检查：跨视图身份、旧消息、页面销毁、busy／error、共享语言与草稿保留。

### 验收

正式挂载测试核对中英文、默认／会话模型、供应商配置及 busy／error 状态；运行 compile、lint、npm test、verify:webview、docs:verify；按 skill 在 280／320／400px 深／浅／高对比检查实际渲染。维护者 F5 视觉接受独立。

### 范围外与批准边界

方案 A 是本次明确选择。允许必要的设置页面生命周期和限定消息扩展；原聊天权限、密钥输入、模型保存和执行语义保持。关闭设置页不清理聊天；语言仅内存共享，宿主重启恢复默认。不提交或推送。

## 当前焦点与未决项

- [x] WI-026 范围由维护者截图与文字明确授权；本地参考与 skill 缺口已核对。
- [x] 双语 PRD、架构／协议、skill、方案 A 正式设置页与相关测试同步。
- [x] 自动检查与实际渲染核对；具体覆盖见最近交接。
- [ ] 维护者 WI-026 F5 视觉接受；代理已尝试 F5，但 UI 捕获故障，未确认真实设置渲染／语言同步／关闭草稿保留；安装 VSIX 未验证。
- [x] 维护者明确否定继续小修，要求一手调研与根本重设计；已完成[双语研究与候选](docs/discussions/2026-09-29-settings-redesign-research.zh.md)，不再以紧凑表单作为推荐终点。
- [x] 维护者选择 A 编辑区独立设置，替代代理原先推荐的 B；实施后验收仍独立。
- [x] A 正式页面、双界面桥接、执行入口及自动验证；真实宿主视觉缺口见上。

## 最近交接

2026-09-29 — WI-026 方案 A 实现与验证：

正式设置现位于单实例编辑区 WebviewPanel，分类为通用／默认模型／供应商，模型可搜索、凭据操作在供应商详情；执行配置移至输入区权限展开层。设置视图采用独立身份与窄白名单，仅接收非秘密 ProviderConfig／语言；语言在宿主内存共享，关闭设置不处理聊天生命周期。正式挂载及宿主测试覆盖页面导航、状态／语言投影、身份隔离、重复打开、关闭重开与草稿保留。

最新实际检查：compile、lint、npm test（736/736）、verify:webview、docs:verify（0 errors／0 warnings）、git diff --check 全部通过；包含工作区并行改动，不是干净提交证据。浏览器实际检查正式组件的 800px 英文深色供应商列表／详情，以及 280／320／400px 中文 ready 深／浅／高对比；不是系统 forced-colors。未补齐英文窄屏长文本／错误／加载、执行展开层视觉矩阵。F5 已启动并点击设置，窗口标题成为 Pi · Settings，但工具 AX／截图仍停留 Welcome；重建 UI 连接后 macOS ScreenCaptureKit 报 -3811 音视频捕获失败。故不宣称设置在真实宿主可见、语言同步或关闭草稿保留通过；后两者目前只有自动测试证据。一次未发送测试草稿可能留在该开发宿主；未发送聊天、改凭据、模型或执行授权。

WI-026 继续 Build，维护者视觉接受待办。正式组件预览保留于 127.0.0.1:5178/settings-review.html（width=editor、language=zh 可查看宽屏中文）。本次未提交／推送；保留并行 CONTEXT、默认模型讨论、架构 skill 和 webview-client 可读性重构。

前置文案精简与研究检查点：

后续截图评估与重设计研究：维护者否定继续压缩旧表单，明确要求先调研再根本重设计。已实际读取 VS Code、Claude Code、Cline 一手文档并查看本地 Codex 设置截图，结论与限制见[研究](docs/discussions/2026-09-29-settings-redesign-research.zh.md)。在已有 skill 视觉库中新增两种可操作结构候选：A 编辑区独立设置；B 全幅侧栏总览与任务详情。原先推荐 B，现由维护者明确选择 A；凭据操作进入供应商详情，执行入口靠近输入区；原生 Settings 是官方基线，自定义候选偏离该建议的理由和代价明确记录。选择前的研究轮未改应用代码／宿主语义或提交；后续 A 已获 Build 授权，仍待正式视觉验收。Chrome 抽查 280／320／400px、深／浅／高对比的具体页面并实际操作模型搜索、选择和详情导航；非完整矩阵与 F5。研究页保留在 127.0.0.1:8769/assets/settings-redesign-study.html，`variant=A|B` 切换；文档结构检查与脚本语法检查通过。前轮 732 项测试只证明前轮删除文案实现，不是重设计验收。

已删除截图标出的语言说明、默认模型解释／会话模型说明／供应商汇总、凭据状态与说明、设置中的空闲运行时提示；保留字段、动作和错误／加载／切换／恢复反馈。清理闲置文案与样式，更新正式挂载测试、双语 PRD 和 pi-sidebar-ui skill。核对本地 Codex 设置参考图：其较宽布局使用独立文字列与右侧控件，不能据此在窄侧栏控件附近堆叠说明；skill 现明确默认使用标签＋控件，仅保留影响选择的必要解释。

本次实际通过 compile、lint、npm test（732/732）、verify:webview、docs:verify（0 errors／0 warnings）、git diff --check 与 skill quick_validate。Chrome 合成宿主实际渲染核对：280／320／400px 中文 ready 的深／浅／高对比主题，以及英文高对比 error；标注文案消失，控件正常换行，错误反馈保留。英文高对比 ready 另做可访问树核对。此为合成宿主证据，不是 F5／安装 VSIX／系统 forced-colors 验收；WI-026 保持 Build，等待维护者视觉接受。预览服务保留于 127.0.0.1:5178 供查看。本次未提交／推送；并行出现的 CONTEXT 双语与 live-session-saved-default 双语讨论改动保留。

2026-09-29 — 维护者 F5 视觉验收确认：

维护者明确确认当前焦点中的 WI-025 F5 视觉验收。此前 730/730 全量测试、compile／lint／verify:webview 与合成主题矩阵是原交接的历史证据，本次尚未重跑；本次仅记录维护者验收并完成文档收尾。WI-025 的 F5 视觉切片可接受；安装 VSIX、真实模型／执行完整链、精确原生宽度矩阵与 forced-colors 等仍未由本次确认覆盖，详见第六轮[证据边界](docs/archive/2026-09-29-wi-025-active-superseded.zh.md)。WI-023／024 各自 F5 仍待办；没有新 Build 授权。维护者随后明确请求提交本次收尾文档，不含推送。

## 停车场

**架构（已确认，未开工）**：把已保存默认应用到活跃运行会话模型的顺序抽取，用户可见规则冻结。维护者 2026-09-29 确认设计。词汇见 [CONTEXT](CONTEXT.zh.md)；讨论见 [2026-09-29](docs/discussions/2026-09-29-live-session-saved-default.zh.md)。不自动开 WI，不打断 WI-026。

额外扩展生态、编辑区聊天／Chat Participant、remote／multi-root支持、额外平台、无产品依据的delta优化、全局启动默认持久化、跳过审批、图片／PDF／表格／语法高亮、历史回滚、框架更换及发布不属于本次批准队列；不得据此自动新建或实施WI。OAuth 订阅登录与自定义 OpenAI-compatible 端点属 WI-024 后续候选，不自动开工。对照 Claude Code 的侧栏质感见[讨论](docs/discussions/2026-09-28-claude-code-ui-comparison.zh.md)。侧栏视觉规则已收入 skill [pi-sidebar-ui](.agents/skills/pi-sidebar-ui/SKILL.md)，WI-025 已实施并获维护者 F5 视觉确认；依据见[讨论](docs/discussions/2026-09-28-agent-ui-rules.zh.md)。

**WI-024（暂停，未关闭）**：扩展内 API Key＋默认模型已实现并提交，混合布局／模型同步修复已于 2026-09-29 分组提交（`bed0e8d`／`2149560`）；批准边界与交付见[暂停提案](docs/archive/2026-09-28-wi-024-paused-proposal.zh.md)。待办：维护者 F5 确认设置分区（渐进展开）、Add key、模型选择器恢复；WI-023 F5（设置布局／模型选择器可见）另行待办。恢复前不得并入 WI-025 验收。

## 已完成 WI 索引

为兼容当前 Cursor 预览，链接直接打开归档文件。表中早期 gate Open／待决描述是相应验收日期的历史，不是当前状态；当前全部六项 gate Accepted，见 ADR0001／0004。

| WI | 结果 | 完成／验收 | 历史 |
|----|------|------------|------|
| WI-001 | 扩展壳、辅助侧栏与 RPC 探针；ADR 0001 | 2026-09-19 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-002 | 版本化 ping/pong Webview 桥 | 2026-09-19 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-003 | Project trust 技术 spike；gate 仍 Open | 2026-09-19 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-004 | REQ-004 最小流式聊天；gate 仍 Open | 2026-09-21 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-005 | 文档健康第一阶段 | 2026-09-19 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-006 | 工作区与项目资源选择 UI | 2026-09-21 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-007 | 根据资源选择启动 pi RPC | 2026-09-21 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-010 | thinking／受控工具／Stop 四项 F5 已确认；限定切片关闭，ADR pending／gate Open | 2026-09-21 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-011 | 模块内测试迁移、递归 runner 与 scripts 分组；限定技术切片收尾 | 2026-09-22 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-012 | 最小 P1–P3 探针切片关闭；P3／完整兼容缺口保留，不是产品验收 | 2026-09-22 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-020 | 跨模块公共入口与模块类型契约；唯一 P2 已修复，双轴零发现 | 2026-09-26 维护者技术验收；ADR／gate 不变 | [记录](docs/archive/2026-09-26-wi-020-public-entries.zh.md) |
| WI-021 | REQ-004 retry／compaction／可靠终态与必要 focus 回退修复；原生 F5／安装分别验证 | 2026-09-27 UTC 代理按本次委托完成评估；gates 不变 | [记录](docs/archive/2026-09-27-wi-021-execution-closure.zh.md) |
| WI-019 | Q16 委托评估、共享正式 chat、实机浮层／资源修复与独立 F5／安装验收 | 2026-09-27 UTC 代理按本次委托完成评估；ADR／gates 不自动关闭 | [记录](docs/archive/2026-09-27-wi-019-formal-chat.zh.md) |
| WI-015 | React／TypeScript／Vite 迁移验收；ADR 0003 Accepted | 2026-09-27 UTC 代理按本次委托完成评估；广泛 gates 保持 Open | [记录](docs/archive/2026-09-27-wi-015-react-acceptance.zh.md) |
| WI-013 | 受信扩展加载、标准交互、工具审批与自有runtime恢复；ADR0002 Accepted | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；广泛gates保持Open | [记录](docs/archive/2026-09-28-wi-013-acceptance.zh.md) |
| WI-008 | 模型选择／就绪、故障／审批／Stop、认证错误安全与必要实机修复 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；WI-009及广泛gates不自动关闭 | [记录](docs/archive/2026-09-28-wi-008-model-acceptance.zh.md) |
| WI-009 | thinking能力／下一轮意图、审批／Stop／退出恢复、键盘焦点与短窗错误修复 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；完整REQ／广泛gates不自动关闭 | [记录](docs/archive/2026-09-28-wi-009-thinking-acceptance.zh.md) |
| WI-014 | 显式文件／选区混合附件、逐项确认、完整预览／历史／容量恢复与丢失提示 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；审阅／会话及广泛gates不自动关闭 | [记录](docs/archive/2026-09-28-wi-014-attachment-acceptance.zh.md) |
| WI-016 | 受控dirty保护／准确readonly历史diff、分页及丢失恢复；短窗裁切红→绿 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；WI-017与广泛gates仍独立 | [记录](docs/archive/2026-09-28-wi-016-review-acceptance.zh.md) |
| WI-017 | 当前项目／CLI-origin会话、顺序交接、原文历史与异常恢复；trusted默认重置红→绿 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；广泛gates独立 | [记录](docs/archive/2026-09-28-wi-017-session-acceptance.zh.md) |
| WI-010 剩余边界／原Goal | 三项剩余gate、ADR0004、Living契约、实际分层验证与全局收尾 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估 | [记录](docs/archive/2026-09-28-wi-010-goal-closure.zh.md) |
| WI-022 | Windows后台终端闪现；默认CLI `--no-daemon` 规避，维护者确认关闭 | 2026-09-28 维护者确认已解决 | [记录](docs/archive/2026-09-28-wi-022-closure.zh.md) |
| WI-025 | 侧栏视觉工艺、准备阶段修正与启动前强度；维护者 F5 视觉验收 | 2026-09-29 维护者确认；VSIX／真实模型完整链不在本次验收证据内 | [记录](docs/archive/2026-09-29-wi-025-active-superseded.zh.md) |
