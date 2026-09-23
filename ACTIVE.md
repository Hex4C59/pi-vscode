# pi-vscode — 当前工作（跨会话入口）

本文件是当前工作入口，不是需求／架构权威，也不是历史日志。维护者新会话只需 **@ 本文件**；Agent 完整读取当前 WI，再按 [`AGENTS.zh.md`](AGENTS.zh.md) 渐进加载。完整流程见[协作指南](docs/guides/agent-collaboration.zh.md)；已关闭历史见[归档索引](docs/archive/README.zh.md)。

## Agent 会话契约（摘要）

| 步骤 | Agent |
|------|-------|
| **开场** | 完成内核基础阅读、本文件与协作指南；明确当前 WI、批准状态、Gate、PRD 判定、焦点与验收。 |
| **渐进加载** | 按任务路由展开；归档仅在需要既往证据时读取。 |
| **提案** | Prepare 保留完整提案和 PRD 判定；新增 Build 范围须记录确认，已有明确批准持续有效。 |
| **建造** | 按已批准范围交付可审阅行为和适用检查结果，明确未验证部分。 |
| **收尾** | 对照批准与验收，修正或记录延期；更新交接，按协作 §7 归档已失效材料；运行文档检查，保留待决验收／ADR。 |

- **WIP=1：** 同时只有一个「正在做」。
- **Gate：** 未经 Accepted ADR 关闭的 gate 不得当作已交付能力。
- **提交：** 未经维护者明确请求不得创建或修改 Git commit。

## 长期 Goal 授权与执行边界（2026-09-22 UTC）

维护者本次 /goal 明确授权完成前端重构以及 PRD REQ-001～REQ-009 的明确需求和必要构建、打包、测试、文档，允许独立无秘密配置下浏览器／开发宿主／实际 F5／安装版及本机合成服务验证。按依赖串行推进、WIP=1；每次切换 WI 前记录范围、REQ、验证与排除项。此授权取代历史候选“须再次申请常规 Build”与永久暂停措辞，但不接受整份 Draft PRD／ADR／gate，不替代人工验收，不决定尚未确认的产品选择。禁止读取 .local-env／用户凭证、付费模型、相邻仓库修改、发布／外部 tracker、索引／提交／推送／合并操作。

**当前唯一工作项为 WI-019：UI 交互预览。** 2026-09-23 维护者明确要求登记 UI 预览为当前任务，沿用 Q1–Q16 后已确认的预览制作授权，首个实施切片为 UIP-01；已完成登记及维护者追加批准的前端文件整理，候选视觉预览尚未实现。此前 Goal 实施暂停仅对其余后端工作继续有效。WI-018 曾作为执行状态调查的候选编号，未登记／未实现，本次不复用该编号。WI-017 代码／可执行验证完成，转为待维护者验收，未正式关闭。WI-014／015／016 的体验／ADR／gate 接受仍待确认；预览登记不替代这些接受，也不代表 Goal 已达成。

先前 Goal 固定审查基点为 `4bbf9ec923f2499a88f52a29b8439fb9d9d5396c`，当时 index 为空，既有脏修改按用户所有保留。2026-09-23 维护者随后明确要求整理当前项目全部改动并创建 Git commit，本次据此按关注点暂存／提交，ACTIVE 单独提交；该明确授权取代本次本地提交所涉及的历史索引／提交禁令，不授权推送／合并或恢复产品实施。`dist/goal-evidence-20260923/` 保留恢复基线、测试／包／宿主证据；历史交接已因事实更新被替代，见[归档](docs/archive/2026-09-22-pre-goal-handoffs.zh.md)，不是 WI 关闭。

### 有界需求核对（源码与公开契约，不代表验收）

| 需求 | 已有实现 | 真实剩余缺口 | 验证方式／依赖 |
|------|----------|--------------|----------------|
| REQ-001 | host 工作区资格、资源选择、运行时启动，UI 状态／恢复 | 当前发行版资源边界完整实证 | workspace-policy／runtime-chat＋隔离真实 pi／宿主 |
| REQ-002 | model/thinking、空闲应用、下一轮延后 | 失败／重启／Stop 独立宿主矩阵 | host/UI model-selection＋合成模型宿主 |
| REQ-003 | 20 项／1MiB 混合附件、逐项确认、精确快照、128 条有界历史／分页，取消／重建／容量边界已实现验证 | 维护者体验接受，非代码延期 | WI-014 检查点 197/197＋浏览器／实际 F5／已安装 VSIX；[历史证据](docs/archive/2026-09-22-goal-frontend-attachment-handoffs.zh.md) |
| REQ-004 | 文本流、thinking／工具活动／审批 | retry／compaction／completed／stopped 细分；失败／ACK 回归 | runtime-chat／activity projection＋真实 RPC |
| REQ-005 | Stop、清队列／abort、断连失败；未发送草稿保留 | 断连／恢复／视图重建宿主矩阵；其余 ACK／Stop 边界回归 | host/UI 回归＋合成慢流 |
| REQ-006 | bundled gate、once／精确 session grants、撤销 | trusted 扩展 profile、空闲切换、失败恢复 | 覆盖审批链路后接续 WI-013；保留信任边界 |
| REQ-007 | dirty-write guard、可靠 before/after 只读 diff／当前源、报告／观察标签、历史变化／丢失与分页已实现 | 维护者体验接受，非代码延期 | WI-016：229/229＋浏览器／实际 F5／安装版；[历史交接](docs/archive/2026-09-22-goal-change-review-handoff.zh.md) |
| REQ-008 | 原生 pi 保存、当前项目列表／新建／顺序恢复、锚定长历史／原始附件文本已完成 | 维护者体验接受，非代码延期 | WI-017：308/308＋SDK／终端 CLI／浏览器／实际 F5／普通安装版及包内容；[历史证据](docs/archive/2026-09-23-goal-session-handoff.zh.md) |
| REQ-009 | 仅 bundled approval，不是一般扩展交互 | 显式加载、标准交互／Stop、五类兼容及真实扩展 | 恢复 WI-013；加载目标选择／校验与交互预算尚待具体决策 |

代码闭环缺口与人工验收分列；任何必要未实现项不会被改写为“仅待人工验收”。

## 正在做（WIP=1）

| 字段 | 内容 |
|------|------|
| **ID** | WI-019 |
| **标题** | 窄侧栏 UI 交互预览 |
| **阶段** | Build 已授权；前端文件整理完成，候选视觉预览尚未实现。 |
| **Gate ID** | gate-webview-trust／gate-session-streaming／gate-project-trust 保持 Open；预览不关闭 gate |
| **Decision** | none（Direction）；沿用 React／CSS／client／bridge 和现有 host 权威，ADR 0003 保持 Draft |
| **PRD 判定** | 用户可见：[视觉重设计方向](docs/product-requirements.zh.md#视觉重设计方向2026-09-23)，关联 REQ-001～008；只交付模拟浏览器预览，不实现剩余后端需求。 |
| **批准状态** | Q1–Q16 后维护者确认共同理解并明确授权预览制作；2026-09-23 再明确要求登记为当前任务。已有授权持续有效，无须重新访谈。 |
| **当前切片** | UIP-01：隔离预览可输入、回复与停止。UIP-02～07 作为同一预览范围内的后续切片串行推进；候选拆分不是新增产品授权。 |

### 目标与范围

在 320–400px 窄侧栏中呈现接近参考截图的简洁感，组件实现参考已调查的 Roo Code 模式。提供可操作的会话、上下文、模型、执行、审批、修改审阅及基础 Markdown 预览，兼容 280px／更宽窗口和短视口。产品行为以 PRD 为准；技术方案与逐项验收见[限定 Draft 和 UIP-01～07](docs/discussions/2026-09-22-webview-framework.zh.md#交互预览限定-draft)。

首片 UIP-01 包含候选专用入口／样式、底部输入区、纯文本发送 → 模拟流式回复 → Stop／停止完成；复用模型／思考控件，并区分就绪、加载、无模型、工作区阻断和运行时错误。后续按 UIP-02～06 补齐各工作流，UIP-07 核对组合状态并交付视觉审阅。每片包含自己的行为检查，不把测试推迟到末片。

### 方案与架构核对

保留生产应用，在独立预览根与局部样式中实现候选，通过现有 client／校验 bridge 连接确定性模拟响应。当前生产与预览共用 mountApp，首片须解决入口／样式隔离并核对生产打包排除候选资源。Webview 保持展示职责，策略、授权有效期和会话身份仍由既有契约定义。复用 Roo 的交互模式，不整体移植其状态／协议。

工程内解决挂载接缝、Markdown／链接／复制安全与夹具覆盖；真实产品取舍或重大架构边界变化仍按正常决策流程处理。预览模拟不证明真实工具执行、持久化或原生确认。正式侧栏切换须等维护者视觉确认，再单独核对 F5／安装版。

### 验收

- **UIP-01：** 发送不重复，流式／Stop 保留较新草稿；应用与待应用模型设置可区分；阻断／错误可通过模拟恢复；320/400px 下输入和 Stop 可达，重置／卸载清理监听与定时器。
- **完整预览：** 空白、对话、执行、审批、附件变化和错误场景可操作；消息活动逐层展开；会话列表保留输入／Stop／审批；短视口优先审批操作，审阅收为紧凑入口。
- **验证：** 适用 compile／lint、挂载行为回归、真实浏览器宽度／主题／键盘观察、生产入口与样式隔离检查；记录实际条件和截图。模拟检查不代替维护者视觉接受。

### 范围外与批准边界

正式侧栏切换、剩余后端能力、Plan／并行会话、图片／PDF 上下文、表格／语法高亮、历史回滚、框架更换、发布均不在本预览范围。维护者追加批准的文件整理保持现有行为；本轮未创建新提交。

### 追加批准：模块内聚性整理（2026-09-23）

维护者明确要求优化本轮审查指出的 Provider 职责集中、前端 client 状态集中及 adapter 对宿主策略实现的交叉依赖，授权本次有界实现与验证。归入当前 WI-019 的技术维护，串行完成后回到 UIP-01，不启动剩余后端需求。

- **PRD 判定：** 纯技术；保持现有可见行为、消息协议、审批策略与运行时调用顺序。
- **方案／所有权：** ModelSettings 独立拥有模型投影、待应用意图与异步失效标识；Provider 保留工作区／运行时身份、Stop／会话切换协调。前端历史阅读模块拥有分页／分块预览状态，client 保留消息身份校验和传输。审批 envelope 校验归属纯宿主契约，运行时错误格式化归属 adapter。
- **架构核对：** 采用既有 runtime／bridge 注入接口；子模块不持有整个 Provider 或可写的全局状态。保留 generation／session 与晚回包保护、reset／dispose 所有权。Decision：none；内部职责调整，不接受 ADR／gate。
- **验收：** compile、lint、全量自动测试、webview 产物检查及 docs:verify；重点覆盖延后模型、Stop、断连／替换、草稿与会话历史关联。新增模块通过可观察行为测试验证，禁止仅凭文件缩短宣告完成。
- **范围外：** 新功能、协议升级、CSS 重组、真实模型调用、提交／发布。自动测试不替代 F5／安装版验收。
- **状态：** 本轮代码重构完成；本轮开始时的未提交文件整理和文档改动按用户所有保留，未暂存／提交。后续焦点仍为 UIP-01 候选视觉预览。

| 架构维度 | 结果 | 当前证据／限制 |
|---------|------|----------------|
| 1 模块拆分 | pass（限定切片） | `modelSettings.ts` 独立拥有模型状态；`saved-history-client.ts` 独立拥有历史阅读状态。Provider 仍协调附件提交、Stop 与会话切换，不宣称全部业务已独立模块化。 |
| 2 接口 | pass | ModelSettings 接受窄 runtime 能力、只读上下文和变更通知；SavedHistoryClient 只发送两个既有历史意图。测试无需实例化 VS Code 即可使用模型模块。 |
| 3 依赖 | pass（静态） | `approvalProtocol.ts` 为纯宿主契约，`runtime-errors.ts` 为 adapter 实现；AST 静态检查无运行时导入环、无浏览器特权导入、无 adapter 对宿主策略／错误辅助实现的导入。不覆盖动态运行行为。 |
| 4 契约 | pass（既有契约回归） | 消息版本／DTO 未改；模型顺序、失败回读、过期回包及历史分块关联由既有组合测试与新增模块测试覆盖。 |
| 5 所有权及 8–11 状态／并发／错误／清理 | pass（自动验证范围） | Provider 在重置／断连／提交失败时通知模型模块；client 在 generation 变化／会话确认时重置或失效历史预览；模型只读投影合并发布，历史状态通过单次客户端通知发布。真实宿主未复验。 |
| 16 测试 | pass | Windows Node compile／lint、311/311（0 skipped）、verify:webview；审批测试改用可控时钟消除真实文件 I/O 与 30ms 超时的竞态等待。 |

本轮决策：implement now／none，限定职责接口具有可验证自动测试；整体架构仍 Proposed／Direction，既有 ADR／gate 不变。其余治理维度无新增设计变更，本轮不据此宣称完整安全、持久化、性能、兼容性或 UX 验收。

### 追加批准：精简宿主与内部能力模块（2026-09-23）

维护者明确要求按“小核心 + 内部能力模块”的第一步修改代码，随后明确批准按功能归组 Extension／Adapter 源码及测试，并批准消除 contracts 对 models 的类型绕行引用：直接从契约定义处导入，保持类型导出与运行行为，复查依赖图及 compile／lint／测试。本次为 WI-019 内串行技术维护，默认功能与既有策略保持一致，不恢复其他后端需求，不引入第三方加载／动态安装／公共插件 API。此前未提交的模块化工作已保留。

- **PRD 判定：** 纯技术；协议、会话存储与 pi 运行时调用方式不变。
- **方案：** DraftSubmission 独立拥有草稿、附件捕获／确认、提交账本、预览及文档监听；EditorTools 组合审批、未保存文件保护与修改审阅，拥有策略回调和清理；Provider 保留工作区、视图身份、执行／Stop 及会话切换协调。既有 ModelSettings、SavedHistory 继续独立拥有各自状态。源码目录归属见[架构](docs/architecture/vscode-extension-architecture.zh.md#源码目录)；模块测试就近，组合测试及共享夹具保留层级 tests。
- **接口／所有权：** 模块只接收只读上下文、命名操作与通知，不接收 Provider 或可写全局 state。保留原子提交、早于 ACK 的完成事件、旧视图／旧会话失效检查；视图关闭与会话重置分别处理。
- **架构核对：** 内部职责调整，Decision none；契约不升级，安全策略不关闭，不改存储／运行时／依赖方向。本次内部接口达到自动验证范围的 Verifiable，整体架构与既有 ADR／gate 状态不变。
- **验收：** compile、lint、全量行为测试、webview 产物检查；新增模块独立行为与清理测试，复用附件／审批／会话交接回归。架构／消息契约双语同步及 docs:verify。真实 F5／安装版未验证时单独列明。
- **当前状态：** 内部模块化与目录归组已完成；43 个源码／测试文件迁移，导入、构建入口、测试收集规则及双语引用已同步。Provider 从 787 行降至 516 行，仅作为规模参考。实现与配套文档已单独提交（`0416ce6`）；后续产品焦点仍为 UIP-01。
- **组合能力：** 内部 `EditorToolOptions.changeReview: false` 可省略审阅 provider／watcher／快照，默认生产仍启用；审批与未保存文件保护不能由此关闭。不宣称所有功能均可独立禁用，也不交付通用 pi 扩展 UI。
- **本轮验证：** Windows Node 24.12.0，目录迁移后 `npm run compile`／`npm run lint` 通过；`npm test` 318/318，0 skipped（前片新增 7 项模块／组合行为测试，目录片扩展既有 runner 回归）。迁移核对 36 个应用／8 个脚本 spec 完整收集，无旧产物；88 个 src 文件除迁移路径字符串外 token 一致。新模块测试无需构造 Provider；覆盖早于 ACK 的完成、视图丢失后确认、旧 ACK／安全检查失效、取消 picker、监听清理及省略审阅后的发送／流式／Stop。前片对 50 个生产 TS/TSX 的 AST 静态检查无运行时 import 环、无直接浏览器特权导入，新模块无对 Provider 的运行时依赖；目录片不新增依赖边。后续依赖清理已让 runtimeLifecycle 直接从 webviewProtocol 引入 ModelCatalogEntry，并集中类型导入／导出；本次 AST 复查 88 个 TS/TSX 文件无文件环、50 个生产文件按模块归组后也无环（均含类型引用），compile／lint／318 项测试再次通过；仅整理类型引用，未新增行为测试，未复验真实宿主。
- **产物／文档检查：** `verify:webview`、`git diff --check` 通过；`docs:verify` 结构无错误，i18n 无 stale，仍因已有本地技能 `.agents/skills/setup-ts-deep-modules/SKILL.md` 的示例链接 `./src/packages/README.md` 失效而失败；本次未改该无关文件。
- **证据与限制：** `dist/internal-modules/` 保留前片模块化证据，`dist/module-layout/` 保留目录迁移映射、迁移前源码、审计脚本及本轮验证日志；均为忽略的验证输出目录，不是临时 worktree，证据不再需要且无进程使用时可删除。本轮不运行真实 pi／F5／安装版，不把自动回归当作真实宿主验收。

| 架构核对维度 | 结果 | 证据与限制 |
|--------------|------|------------|
| 1–3 模块／接口／依赖 | pass（内部实现） | `draft/draftSubmission.ts`／`editor-tools/editorTools.ts` 通过命名通知、窄运行时能力及只读上下文组合；Provider 保留跨功能事务。静态结果不证明动态运行行为。 |
| 4–5 契约／所有权 | pass | v2 消息与 pi 调用方式不变；模块分别拥有提交 epoch、审批检查 epoch、文档订阅及审阅资源；架构和消息契约双语已同步。 |
| 8–11 状态／并发／错误／清理 | pass（自动回归） | 独立测试与既有 Stop／会话／附件／审批回归通过；模块重置忽略迟到 ACK 和迟到检查错误。 |
| 12 安全 | pass（本次范围） | 内部关闭审阅测试仍拒绝 dirty 写入、保留授权检查；既有消息校验和旧视图／代次检查保留。不是一般沙箱验证。 |
| 16–17 测试／构建 | pass（本地自动） | compile／lint／318 tests；runner 实测模块内递归发现、排除 fixtures／链接目录、输出无重名冲突及编译失败传播；真实宿主与安装版未复验。 |
| 6–7、13–15、18–19 | N/A（无新增设计变更） | 本轮不改产品要求、领域身份、存储、日志、容量／性能策略、兼容版本或 UI；既有行为由组合回归覆盖，不新增这些维度的验收结论。 |

### WI-017 待验收（非并行 Build）

REQ-008 会话连续性的代码与可执行验证已完成，尚未正式关闭。批准范围、公开 API／宿主证据、最终 VSIX 及资源保留条件见[WI-017 检查点](docs/archive/2026-09-23-goal-session-handoff.zh.md)。仍需维护者确认：窄栏／键盘会话列表与长历史分块、Cancel 保留草稿、确认 New／Restore 清理临时状态、原入口退出说明、审批／grant 重置及失败恢复。WI-019 不重写这些条件或提升 PRD／ADR／gate 状态。

## 当前焦点与未决项

- [ ] WI-019／UIP-01：实现隔离候选入口及聊天／Stop 闭环；已完成文件整理；候选视觉预览的实现与验收仍待开展。

- [x] WI-016 T016-01：代码／可执行验证完成，最终回归 210/210；实际 F5 与普通安装版分别通过 dirty／等待／grant／edit／恢复／Stop 矩阵。Standards 修复两轮测试时序／挂起发现后 0 未解决；Spec 0。没有替代维护者体验接受，WI-016 尚未关闭。
- [x] WI-016 T016-02：代码／可执行验证完成，229/229、双轴无未解决发现；浏览器／真实 F5／安装版各自记录，当前包与源码一致。维护者体验接受单独保留；[历史交接](docs/archive/2026-09-22-goal-change-review-handoff.zh.md)。
- [x] WI-017：T017-01～03 代码／可执行验证完成；compile／lint、308/308（0 skipped），Standards／Spec 复审均无未解决项；实际 F5／普通安装版、最终 VSIX 内容与清理分列记录。仍待维护者体验接受，未正式关闭；[完整交接](docs/archive/2026-09-23-goal-session-handoff.zh.md)。
- [ ] 预览之外仍暂停的接续候选：REQ-004 retry／compaction／completed／stopped 与可靠终态，其后核对 REQ-001／002／005 余下故障矩阵；WI-018 未启动。只读核对声明 @earendil-works/pi-coding-agent 0.86.1：prompt ACK／agent_end／compaction_end 均不等于终态，agent_settled 才表示自动续行已结束；Stop 先 clear_queue 再 abort。源为安装包 docs/rpc.md 与公开类型，尚无该新切片代码或运行验证。
- [x] WI-014 T014-01～05：明确 REQ-003 代码／可执行验证完成，T05 检查点 197/197、本轮总回归 229/229；浏览器、真实 pi 合成链路、实际 F5、普通安装版与包一致性分列。维护者仍需确认窄栏／键盘、逐项确认、长历史预览与容量恢复体验；不自动正式关闭。
- [ ] WI-015 人工体验确认及 ADR 0003 接受仍待；不因前端重构永久暂停后续需求。
- [ ] WI-008／009：已确认 2026-09-21 的基础／空闲及延后设置主路径；故障／审批／Stop 完整矩阵未整体接受，不重复要求已确认路径。
- [ ] WI-010 pending-adr／完整边界矩阵及三个 Open gate 保留；有限切片关闭不代表安全沙箱、回滚或全后代取消保证。
- [ ] WI-013 依赖前置后恢复；加载目标选择／验证及交互队列预算仍有真实待定选择，见[保留调查](docs/discussions/2026-09-22-pi-compatibility.zh.md#wi-013-暂缓提案保留2026-09-22)。到需要时提出最少量具体问题，不重访已确认设计。
- 当前禁止读取 `.local-env`；历史配置授权不覆盖本 Goal 禁令。F5 存在 code134 间歇启动失败，已有成功隔离验证与失败日志并列；不把 sourceMaps／trace 开关声称为已证明根因修复。

## 停车场

UI 交互预览已移至当前 WI-019；[UIP-01～07 与依赖图](docs/discussions/2026-09-22-webview-framework.zh.md#交互预览候选切片)作为其串行拆分参考，当前选择 UIP-01，其余保持排队。

编辑区 panel／Chat Participant、全生态或额外平台扩展、无产品依据的 delta 优化、全局启动默认持久化及跳过工具审批仍不自动纳入。REQ-007／008／009 明确需求不是停车场。

## 最近交接

### WI-019 模块内聚性与前端文件整理（2026-09-23）

**后续提交检查点：** 维护者随后明确要求 Git commit，授权将当前工作区的前端整理、模块重构及配套记录按关注点提交。已创建 `66fbe8f`（宿主／适配层职责）、`cc3d80c`（审批测试可控时钟）、`1868f88`（前端职责整理）、`63e89aa`（架构／预览说明）、`bea3812`（预览需求追溯）；本 ACTIVE 记录独立提交。各提交均审阅完整暂存差异并通过 commit:check；前端提交前仅移除新文件尾部多余空行。沿用刚完成且代码语义未变化的 311/311、compile／lint 与产物检查结果，本次不重复声称重新运行。下文“未提交”指实施交接时状态，已由本次明确授权取代；无推送或合并。审阅补丁和检查输出保留在既有 `dist/module-refactor/`，确认无需保留证据后可删除。

本轮按追加授权提取 ModelSettings，Provider 从 925 行到 787 行，模型状态及晚回包失效由单一模块持有；提取 SavedHistoryClient 和展示类型／可用性推导，webview-client 从 370 行到 255 行；审批 envelope 解析移至纯宿主契约，运行时错误格式化及其测试移至 adapter。同步双语架构说明，既有工作区改动保留。Windows Node 24.12.0 compile／lint、全量 311/311（0 skipped）、verify:webview、静态依赖检查及 git diff --check 通过。首轮 WSL compile 因缺 Linux Rollup 可选依赖失败，改用与现有依赖匹配的 Windows Node；首次全量测试挂在既有审批测试，核对并结束本轮自有进程树，修正可控时钟与提前完成断言后全量通过。docs:verify：结构 0 error／4 个既有 Draft ADR 提示；i18n 0 stale，但本轮未修改的 `.agents/skills/setup-ts-deep-modules/SKILL.md` 示例相对链接 `./src/packages/README.md` 失效，故整体文档检查未通过。不改动该独立本地技能。未运行新一轮浏览器视觉／F5／安装版／真实模型检查，不关闭 WI／ADR／gate，无 Git 提交。日志与静态检查脚本保留于 `dist/module-refactor/`，供复核本轮验证；无运行进程依赖，确认无需保留证据后可删除。


按维护者明确请求，将 UI 交互预览登记为唯一当前 WI，首片 UIP-01；沿用明确预览授权，未重复访谈。WI-017 转入待验收入口，证据与限制仍指向已有双语归档；不记为关闭。同步 PRD 工作追溯及前端讨论中的当前入口，保留后端余项暂停。登记时仅修改文档；随后维护者明确批准前端文件整理：重命名 client／消息解析模块、分离场景数据与模拟 bridge、迁移预览首页、按职责拆分 CSS 并同步测试／文档。此整理属于 WI-019 内的技术维护，保持现有产品行为；UIP-01 候选视觉界面尚未实现。本轮 Windows Node compile／lint、重跑全量 308/308 测试（0 skipped）、verify:webview、预览 HTTP 模块加载、CSS 全量选择器属性／覆盖顺序对照及 docs:verify 通过。首次全量测试停在未修改的 tool-approval 测试子进程，已结束自有测试进程树，重跑通过；不推断挂起根因。预览检查 server.close 后 Node 进程仍驻留，已核对命令行并结束自有进程树；已有用户预览服务未关闭。日志／校验脚本保留在 `dist/webview-reorganization/`，检查证据无需保留后可删除。未进行浏览器视觉／F5／安装版复验，无 Git 提交。登记阶段 docs:verify／docs:health 与 git diff --check 通过：0 error，4 个既有 Draft ADR 提示；双语 0 error／0 stale，health 0 review notice。这些为登记阶段结果，后续整理验证见上文。

### 提交基线与保留证据（2026-09-23）

前轮按维护者请求整理八个提交，基线 HEAD 为 `aee4178`，当时工作区干净。前轮 Windows Node compile／lint、308/308 测试、verify:webview、docs:verify／docs:health 通过；文档有 4 个既有 Draft ADR 提示。这些是先前结果，不是新预览证据。`dist/commit-preflight-20260923/` 保留提交检查日志，确认无需保留后可删除；`dist/goal-evidence-20260923/` 与 `dist/session-integration-adapter.cjs` 的宿主／包／夹具证据保留条件见各 WI 归档，不能按名称删除。没有在本次登记中创建临时工作区。

## 已完成 WI 索引

为兼容当前 Cursor 预览，历史链接直接打开归档文件，不附章节锚点；打开后搜索对应 WI 编号即可定位。

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
