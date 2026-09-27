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

**本轮 Git 提交授权与检查（2026-09-27）：** 维护者明确要求提交当前项目累计改动，覆盖本轮暂存／提交所需的历史禁令，不授权推送、重写历史或继续实施。运行状态修复、候选 UI、信任探针、范围文档与本文件按关注点分开提交；只额外清理三个新增文件末尾空行。提交前本轮 compile／lint、npm test 447/447、verify:webview 与 docs:verify 通过；文档检查 0 错误、5 警告，双语检查 0 错误／警告。每个提交单独执行 commit:check。本轮没有新增浏览器、真实 runtime、F5 或安装版验收证据，不关闭 WI／ADR／gate，不切换正式侧栏；既有忽略证据输出保留原清理条件。
## 本次恢复实施授权与固定基线（2026-09-27）

维护者本次明确授权恢复已批准工作，完成 WI-019 UIP-05～07、满足体验确认／架构条件后的必要正式接入，再串行完成 REQ-001～009 已明确批准的剩余实现／验证及可执行收尾。此授权取代下文历史记录中的「本轮不推进 UIP-05～07」「其余后端工作仍暂停」「只交付模拟浏览器预览，不实现剩余后端需求」及将正式接入列为永久范围外的限制；历史反馈与证据保留其原始范围。候选体验确认前不切换正式侧栏；不接受整个 Draft PRD、未决产品／架构选择、ADR／gate 或人工体验。WIP=1，WI-019 技术交付后转待体验确认，当前串行进入 WI-021；不重开 WI-020，不复用未登记 WI-018。

开始 HEAD 为 `86cd3b0fd2b4a4fda00c81e0a08745da06080c85`，暂存区／tracked 工作区／未跟踪文件均为空。前轮提交授权已用完；本次禁止暂存／提交／推送／合并。基线和本次红绿／验证／复审证据保留在 `dist/authorized-completion-20260927/`（仓库忽略的证据输出，不是临时 worktree；维护者复核且不再需追溯后可清理）。全程禁读／遍历 .local-env、用户凭证和真实秘密配置；不调用付费模型、不修改相邻仓库、不污染现有安装／会话。

WI-019 技术交付检查点 UIP-07：UIP-05 审批／精确授权、UIP-06 审阅入口已实现；组合验证与双轴复核完成技术检查，整体视觉接受仍待。展示 Module 通过既有公开挂载 → 真实 WebviewClient → 校验 bridge → 确定性外部 Adapter 的已批准 Seam 测试；UI 仅管理选中／展开／焦点，不拥有权限、截止时间或会话身份。真实浏览器和宿主 Seam 分别取证，模拟不等于后端验收。当前事实收尾表沿用下方需求核对与未决 WI 表，完成源码／收集核对后逐项修正，不另建任务账本。

## 长期 Goal 授权与执行边界（2026-09-22 UTC）

维护者本次 /goal 明确授权完成前端重构以及 PRD REQ-001～REQ-009 的明确需求和必要构建、打包、测试、文档，允许独立无秘密配置下浏览器／开发宿主／实际 F5／安装版及本机合成服务验证。按依赖串行推进、WIP=1；每次切换 WI 前记录范围、REQ、验证与排除项。此授权取代历史候选“须再次申请常规 Build”与永久暂停措辞，但不接受整份 Draft PRD／ADR／gate，不替代人工验收，不决定尚未确认的产品选择。禁止读取 .local-env／用户凭证、付费模型、相邻仓库修改、发布／外部 tracker、索引／提交／推送／合并操作。

**前轮已执行的 Git 提交授权（2026-09-27；不适用于本次恢复实施）：** 维护者明确要求提交当前工作区累计改动，取代本次提交涉及的历史不暂存／不提交限制；不授权推送。候选 UIP-01～04、公共入口／共享展示支持与关联文档已提交为 9129cd1（feat(webview)），ACTIVE 单独提交；仅修正两处新增文件空白问题。提交前本轮 compile／lint／npm test 408/408／verify:webview／commit:check 通过，文档扫描按 .local-env 禁读的安全预加载方式执行。提交只记录工作，不关闭 WI-019、不推进 UIP-05～07、不切换正式侧栏或改变 ADR／gate／待验收状态。dist/git-commit-20260927/ 保留本次检查日志；维护者复核后日志不再需要时可清理，原有证据目录及唯一内容全部保留。

**当前唯一 Build 为 WI-021：REQ-004 执行状态与可靠终态；WI-019 完整候选技术交付后转待体验确认（不是关闭），其 UIP-01／03／04 与整体验收仍待。** 2026-09-26 维护者明确接受 WI-020、授权关闭并归档，随后恢复已批准的 WI-019。WI-020 的公共入口／类型契约与 P2 修复仅作技术验收，见[归档](docs/archive/2026-09-26-wi-020-public-entries.zh.md)。沿用 Q1–Q16 已确认的预览制作授权，不重新访谈；旧后端暂停已被本次恢复授权替代，按依赖串行推进。WI-018 曾作为执行状态调查的候选编号，未登记／未实现，本次不复用该编号。WI-017 代码／可执行验证完成，转为待维护者验收，未正式关闭。WI-014／015／016 的体验／ADR／gate 接受仍待确认；预览登记不替代这些接受，也不代表 Goal 已达成。

先前 Goal 固定审查基点为 `4bbf9ec923f2499a88f52a29b8439fb9d9d5396c`，当时 index 为空，既有脏修改按用户所有保留。2026-09-23 维护者随后明确要求整理当前项目全部改动并创建 Git commit，本次据此按关注点暂存／提交，ACTIVE 单独提交；该明确授权取代本次本地提交所涉及的历史索引／提交禁令，不授权推送／合并或恢复产品实施。`dist/goal-evidence-20260923/` 保留恢复基线、测试／包／宿主证据；历史交接已因事实更新被替代，见[归档](docs/archive/2026-09-22-pre-goal-handoffs.zh.md)，不是 WI 关闭。

### 当前源码收尾表（2026-09-27；开始 → 本次状态，不代表验收）

本次直接检查公开入口／源码和标准 runner 收集，未以历史勾选证明当前实现。`npm test` 在先前 UIP-07 技术检查点 424/424、0 skipped，compile／lint／verify:webview 通过；实际 Chrome 审批／审阅组合与附件矩阵通过，该检查点当时尚无真实 pi／F5／安装版；当前真实 pi／安装 v6 证据与 F5 失败条件见当前焦点。表中历史实证只作背景。

| 需求／WI | 开始事实（源码／标准收集） | 真实分类与剩余条件 | 本次推进／依赖 |
|---------|------------------------|-------------------|----------------|
| REQ-001 | host 工作区资格／资源选择／运行时；`workspace-policy.spec.ts`、`runtime-chat.spec.ts` | 当前 0.86.1 六场景资源／thinking 默认效果已验证；themes／包与受控第三方加载仍非该证据 | 当前公开资源 probe、标准回归与安装版资格／同意链已验证；完整 gate／体验仍待，不把旧 spike 当当前通过 |
| REQ-002；WI-008／009 | `extension/models/index.ts` → ModelSettings；已确认空闲／下一轮延后主路径；模型／thinking 及 host 回归已收集 | 已实现；当前安装版失败、延后模型→Stop、重启清理已验证，独立人工覆盖／收尾接受仍待 | 不重新实现、不重复索要已确认主路径；补当前证据 |
| REQ-003；WI-014 | `extension/draft/index.ts` → DraftSubmission，20 项／1MiB 混合附件、逐项确认／128 条历史；draft／transport／UI 测试已收集 | 当前候选附件浏览器矩阵与安装 v6 选区变化／确认／历史链通过；仍待维护者体验及 Q16 正式候选接入 | 保留单个居中 + 菜单、确认／取消／失败／容量／历史／不确定投递；正式候选切换仍待 Q16 |
| REQ-004；WI-010 限定片已关闭 | `adapter/runtime` 的 agent_settled、文本／thinking／工具活动；runtime-chat／activity-projection 已收集 | 开始未实现 → WI-021 当前已实现阶段／细分终态与 ACK 冻结；双轴交错发现修复，当前安装版 retry／compaction／失败／Stop／模型／审阅矩阵通过；F5 与完整个人目标仍待 | 当前唯一 WI-021；不重开已关闭 WI-010，不复用未登记 WI-018 |
| REQ-005 | clear_queue → abort、运行时丢失失败、草稿／ACK owner；runtime-chat／draft／session-handoff 已收集 | 已实现；当前安装 v6 失联／恢复／renderer reload／信任变化／Stop 通过，精确 ACK 与 host view disposal 沿确定性 Seam 验证；扩展交互分支尚未实现 | 后一部分归 WI-013；旧事件／较新草稿回归与候选组合分开取证 |
| REQ-006；WI-010／013 | bundled gate、once／精确 session grant／撤销／截止／stale；tool-approval／dirty-write 回归 | 受控审批已实现；trusted loading profile／空闲切换／失败恢复尚未实现，并有产品／架构待决 | WI-019 UIP-05 补展示／多卡选择，不改变 host 权限；真实加载归 WI-013 |
| REQ-007；WI-016 | `editor-tools/index.ts` 的 writeProtection／ChangeReview：只读 before/after、报告／观察／丢失；各层 review specs 已收集 | 当前安装 v6 readonly diff／dirty 拦截／超限捕获失败／历史快照链通过；仍待维护者窄栏键盘与丢失／恢复整体体验 | UIP-06 接入候选紧凑入口、分页／opaque intents；模拟不证明 native diff |
| REQ-008；WI-017 | `adapter/sessions/index.ts` 公共 SDK worker、`extension/sessions/index.ts` SavedHistory，原生保存／新建／恢复／锚定历史；session／history specs 已收集 | 当前安装版新建取消／新建／恢复／压缩后历史与原文通过；长历史标准回归及历史 SDK／CLI 仅各自范围有效，待维护者体验 | 保留已实现能力，仅补必要当前回归；不读写 pi session 文件 |
| REQ-009；WI-013 | 产品仅 bundled hello／confirm；compatibility.spec 是 probe helper，不是一般交互接入 | 尚未实现；加载目标选择／校验、精确交互 DTO／预算／时序／reload 恢复为真实未决 | 已授权恢复，不能默选推荐的「单扩展＋confirm」或预算；到该依赖点提出具体最小决策 |
| WI-015／ADR 0003 | React/Vite／client／bridge 迁移已实现 | 技术证据已有，待维护者体验及 ADR 接受；不是需再迁移 | 正式候选切换须 Q16，随后新宿主／安装包验证；Draft 不自动 Accepted |
| WI-019 UIP-01～04 | 候选已实现；UIP-02 体验确认及无文件夹限定确认有效 | UIP-01／03／04／整体视觉仍待；UIP-05～07 开始未实现 → 当前代码与技术验证完成，待完整候选体验确认 | 最短步骤见 README；正式侧栏未切换，Q16 条件保留 |
| WI-020 | 维护者 2026-09-26 关闭／归档 | 已完成，不重开 | 既有公共入口／类型契约仅作上下文 |
| gates／ADR 0002／WI-010 pending-adr | webview／project-trust／session-streaming 均 Open，ADR 0002 Draft | 证据／明确决策／维护者接受未齐；部分文档摘要状态过期 | 补可执行证据／修正过期摘要，保留 Open／Draft；不降低条件 |

代码缺口、缺当前验证、技术完成待体验、待决及已完成文档过期分列。当前未发现阻断自动检查的外部环境条件；浏览器、真实 runtime、F5／安装分别取证，不能互相替代。

## 正在做（WIP=1）

| 字段 | 内容 |
|------|------|
| **ID** | WI-021 |
| **标题** | REQ-004 执行状态与可靠终态 |
| **阶段** | Build；代码与本轮可执行技术验证／双轴修复已完成，F5 环境及整体接受条件仍待，未关闭；本项唯一实施，WI-019 非并行 Build／待完整体验确认 |
| **PRD 判定** | 用户可见；REQ-004 明确 retry／compaction／completed／stopped／failed 与 ACK 独立，关联 REQ-005／003；不是重开 WI-010 或复用 WI-018 |
| **授权** | 2026-09-27 本次维护者明确授权补齐 REQ-004 已要求实现与验证；仅实现可由公开 0.86.1 事件支持的观察状态，不设计 upstream 行为或新的产品取舍 |
| **Gate ID** | gate-session-streaming；Open 条件不自动接受 |
| **Decision** | none：复用既有 runtime → host → versioned webview 契约；不改变信任、持久化、工具策略或 ADR 选择 |

### 目标与范围

展示真实 pi 的自动 retry、compaction 与终态；只有 `agent_settled` 才结束本轮，agent_end、retry_end、compaction_end 均不独自证明任务完成。Stop 请求持续 stopping 到真实完成或失败；失败不可被后续 settled／ACK 改成成功。已接受投递独立于任务结果，较新草稿保留。正式和候选复用同一 host/client 能力；不以候选模拟代替真实后端证据。不做扩展加载／交互预算选择、不升级依赖、不读写 pi session 文件、不重实现 retry／compaction 或 agent loop。

### 方案与架构核对

- Runtime Adapter 在既有公共 `createPiRpcRuntime` Seam 将 pi 0.86.1 公开 `auto_retry_*`／`compaction_*` 映射为有界工作阶段事件；保留 session 与替换 reader 失效保护。错误文本沿既有脱敏／限长入口处理。
- Host Provider 拥有执行状态与本轮终态，DraftSubmission 拥有投递／ACK／任务结果的独立账本；UI 只映射受校验的状态。保持 runtime/host/contracts/ui 的既有依赖方向，不增加第二套业务状态。
- v2 仅增加有限枚举值，同树 host、validator、formal/candidate 消费者一致更新；未知值继续拒绝，旧 view/generation 继续失效；不新增 inbound 权限操作。
- 架构维度 1–5／6–12／14–19：实际公共事件、并发／ACK／Stop／替换、错误恢复、清理、容量、消息版本与用户状态逐例验证。存储／权限维度无新增写入或授权。

### 验收

一次一个红→绿→必要重构。批准 Seam 沿用真实 client／校验 bridge、公开 runtime 的确定性外部进程 Adapter、Host Provider 公开消息及实际浏览器／隔离宿主。覆盖 retry／compaction 期间仍 busy、允许 Stop、不提前应用待定设置／接纳第二轮；completed／stopped／failed 可区别，错误＋settled 与 early settled＋ACK／断连／旧事件不会误判，较新草稿和 accepted delivery 保留。标准入口收集新增测试；compile／lint／npm test／verify:webview／docs:verify／diff-check，真实无秘密无付费合成 runtime 与所需 F5／安装包分别取证。双轴独立复审并修复本次发现；人工体验／gate 仍按自身条件验收。

### 范围外与批准边界

整个任务起点仍为 `86cd3b0fd2b4a4fda00c81e0a08745da06080c85`，clean；WI-019 32 个 tracked／untracked 路径为本次已有增量，不覆盖或回退。当前 WI-019 检查点 424/424 与两组 Chrome 证据保留在 `dist/authorized-completion-20260927/`；其完整候选 Q16 待维护者确认，正式页面未切换。后续 WI-013 产品／架构待决不默认批准。本项技术交付不等于完整 Goal 或 gate 关闭；不暂存／提交／推送／修改用户安装。


## WI-019 待体验确认（非并行 Build，完整批准提案保留）

| 字段 | 内容 |
|------|------|
| **ID** | WI-019 |
| **标题** | 窄侧栏 UI 交互预览 |
| **阶段** | Build；2026-09-26 维护者确认 WI-020 关闭并恢复 WI-019。UIP-01 代码／本地可执行验证完成，待维护者视觉审阅；UIP-02 实现、本地检查与双轴复审完成，本次维护者体验确认已记录；UIP-03 历史入口视觉修订保留；中英文设置既有修改保留；无文件夹反馈已获该项限定确认；本次 UIP-05～07 实现与技术验证完成，候选整体体验／正式切换仍待，WI-019 未关闭。 |
| **Gate ID** | gate-webview-trust／gate-session-streaming／gate-project-trust 保持 Open；预览不关闭 gate |
| **Decision** | none（Direction）；沿用 React／CSS／client／bridge 和现有 host 权威，ADR 0003 保持 Draft |
| **PRD 判定** | 用户可见：[视觉重设计方向](docs/product-requirements.zh.md#视觉重设计方向2026-09-23)，关联 REQ-001～008；当前候选使用模拟；本次授权另覆盖条件满足后的正式接入和明确后端余项。 |
| **批准状态** | Q1–Q16 后维护者确认共同理解并明确授权预览制作；2026-09-23 再明确要求登记为当前任务。2026-09-26 明确恢复并从 UIP-01 继续；已有授权持续有效，无须重新访谈。 |
| **当前切片** | UIP-07：跨功能组合、短视口、键盘／焦点及生命周期；本次恢复授权覆盖 UIP-05～07 和条件满足后的正式接入，确认前不切换正式侧栏。UIP-02 体验确认仅限该片；无文件夹“可以了”仅确认该反馈，UIP-01／UIP-03／WI-019 整体验收仍待。 |

### 目标与范围

在 320–400px 窄侧栏中呈现接近参考截图的简洁感，组件实现参考已调查的 Roo Code 模式。提供可操作的会话、上下文、模型、执行、审批、修改审阅及基础 Markdown 预览，兼容 280px／更宽窗口和短视口。产品行为以 PRD 为准；技术方案与逐项验收见[限定 Draft 和 UIP-01～07](docs/discussions/2026-09-22-webview-framework.zh.md#交互预览限定-draft)。

首片 UIP-01 包含候选专用入口／样式、底部输入区、纯文本发送 → 模拟流式回复 → Stop／停止完成；复用模型／思考控件，并区分就绪、加载、无模型、工作区阻断和运行时错误。后续按 UIP-02～06 补齐各工作流，UIP-07 核对组合状态并交付视觉审阅。每片包含自己的行为检查，不把测试推迟到末片。

### 方案与架构核对

保留生产应用，在独立预览根与局部样式中实现候选，通过现有 client／校验 bridge 连接确定性模拟响应。恢复时生产与预览共用 mountApp；UIP-01 现已独立候选挂载／样式，生产打包排除候选资源的本轮证据见最近交接。Webview 保持展示职责，策略、授权有效期和会话身份仍由既有契约定义。复用 Roo 的交互模式，不整体移植其状态／协议。

工程内解决挂载接缝、Markdown／链接／复制安全与夹具覆盖；真实产品取舍或重大架构边界变化仍按正常决策流程处理。预览模拟不证明真实工具执行、持久化或原生确认。正式侧栏切换须等维护者视觉确认，再单独核对 F5／安装版。

### 验收

- **UIP-01：** 发送不重复，流式／Stop 保留较新草稿；应用与待应用模型设置可区分；阻断／错误可通过模拟恢复；320/400px 下输入和 Stop 可达，重置／卸载清理监听与定时器。
- **完整预览：** 空白、对话、执行、审批、附件变化和错误场景可操作；消息活动逐层展开；会话列表保留输入／Stop／审批；短视口优先审批操作，审阅收为紧凑入口。
- **验证：** 适用 compile／lint、挂载行为回归、真实浏览器宽度／主题／键盘观察、生产入口与样式隔离检查；记录实际条件和截图。模拟检查不代替维护者视觉接受。

### 范围外与批准边界

正式侧栏切换、剩余后端能力、Plan／并行会话、图片／PDF 上下文、表格／语法高亮、历史回滚、框架更换、发布均不在本预览范围。本轮不暂存／提交；本次起点 clean；WI-020 已提交并关闭，既有提交与证据保留。ADR、gate 和其他待验收状态不变。

### UIP-05～07 当前技术交付（2026-09-27）

**开始 → 当前：** UIP-05／06／07 开始未实现；现已实现紧凑多审批独立选择、完整命令／目标／精确 scope 检查、一次／精确会话授权、随时检查及撤销入口；紧凑修改审阅计数、分类、分页、opaque 原文／diff 意图及丢失告警；短视口优先审批／Stop、审阅局部滚动和仅恢复被收起内容中的焦点。保留已确认单个居中 +、无隐私菜单项、无文件夹可编辑欢迎页、中英文设置与默认折叠历史。候选入口为 npm run preview:webview，最短体验步骤见 README。正式 App 入口未切换。

**Module／Interface：** 复用公共 components、真实 WebviewClient 和校验 bridge；候选仅拥有选择／展开／焦点与布局。权限、截止、身份及任务终态仍由外部 Adapter／host 拥有。模拟夹具覆盖 8 个独立审批、33 条审阅、历史丢失、旧回包及组合，不宣称真实执行工具、native diff 或后端验收。无新依赖／持久化／协议／构建规则。

**TDD／复审修复：** 逐例红绿覆盖长输入仍可检查目标／scope、过期投影、旧续流不可清除新队列、最后审批超时必须结束任务但保留 accepted delivery、审阅收起只恢复被隐藏焦点。Standards 与 Spec 独立发现均已修复并复现复核；当前源代码定向复审各 0 未解决发现，全树含文档复审继续。

**当前执行证据：** compile／lint／npm test **424/424，0 skipped**／verify:webview／安全 docs:verify／git diff --check 通过；静态依赖检查与 production bundle 隔离通过。真实 Chrome 9 个审批宽度／主题／语言样本及 320×500 组合、另 8 个附件样本和确认／失败／容量／历史／会话取消／Reset／晚回包通过；两组 page errors／外部请求均 0，截图、JSON、红绿与检查日志在 dist/authorized-completion-20260927/。浏览器脚本最初仍引用已删除隐私菜单项及隐藏开发按钮，已修正当前脚本后重跑；不改产品以迎合过期期望。独立 Chrome／Vite／helpers 已关闭，仅保留证据及独立 profile，不改变用户安装／会话。

**待确认／限制：** 完整候选视觉／手感 Q16 未确认，不能据技术通过替换正式侧栏；WI-019、ADR 与 gates 不关闭。本轮尚无真实 pi／F5／普通安装 VSIX 证据，不引用旧结果作新通过。开始 clean，所有既有提交／忽略证据保留；未暂存／提交／推送／合并／发布。

### UIP-04 本轮接续（2026-09-27）

维护者明确批准 WI-019 候选预览 UIP-04 与必要回归（REQ-003／005、Q6／Q12），WIP=1；不推进 UIP-05～07、不切换正式侧栏、不暂存／提交、不关闭 WI 或改变 ADR／gate。无文件夹反馈的“可以了”仅确认该修订，不扩大验收。

最小方案：候选展示 Module 复用公共附件 Interface、真实 WebviewClient 与校验模拟 bridge；只拥有菜单、展开和临时阅读状态，准备／快照／预算／资格／确认／接纳仍由既有 owner 管理。无新增依赖。测试 seam 已由本轮请求确认：公开候选挂载→真实 client／校验 bridge→确定性模拟→用户结果，以及实际浏览器交互／布局。逐项红→绿，从添加一个文件且保留正文开始。

开始 HEAD：`fbf6767066715d5b18bd3c85f2350fe86fff9a7b`；index 为空。既有 tracked／untracked 内容快照及清单在 `dist/uip04-20260927/`（用于本轮 diff／双轴复审，完成复核且证据无需保留后可清理；不创建临时工作树）。全程禁读／遍历 .local-env。当前焦点：完成本轮 UIP-04 检查／双轴复核交接，等待维护者体验；不推进 UIP-05。

### 无文件夹反馈修订（2026-09-27）

**维护者体验确认（2026-09-27）：** 维护者回复“可以了”，本次按无文件夹反馈修订的体验确认记录，不扩大为 UIP-01／UIP-03／WI-019 整体验收，也不自动确认其他待验收项。随后要求撰写下一任务提示词；按既有串行顺序准备 UIP-04“在紧凑输入区添加并确认上下文”的执行提示，本次仅交付提示词，尚未启动 UIP-04，不改变当前切片／ADR／gate。

维护者按所附截图反馈批准无文件夹展示修订：默认显示正常欢迎页，不前置“没有工作区文件夹”卡片；允许先编辑草稿，点击发送或非 IME Enter 时才显示“无法发送消息，请先打开文件夹或工作区”的原生提示，可确定关闭或通过已有 openFolder 意图恢复。关闭／取消保留输入；打开文件夹后仍须既有信任／资源选择，不自动发送。只改 WI-019 候选，未改变无工作区不得启动任务的 REQ-001 边界，不扩展 host 权限／协议，不复制参考图的全局最近历史。

最小 Module／Interface：候选只调整编辑／提交前提示与原生对话框寿命；草稿继续交给既有 WebviewClient.edit／updateDraft（已核对现有 host 在无运行时仍允许草稿同步），不新增第二份草稿或模拟成功。发送前 no-folder 分支只显示提示，不调用 submit；恢复仍使用现有 action，runtime／信任／资源资格保持既有 owner。其余阻断状态、模型设置、Stop、较新草稿、语言、历史导航与正式入口不变，无新依赖／通用重构。按既有公开候选挂载→真实 client／校验 bridge→模拟响应及真实浏览器 Seam 逐例红绿，检查按钮／Enter／Shift+Enter／输入法、焦点、关闭／恢复／重置与无自动重放。

本次开始 HEAD `fbf6767066715d5b18bd3c85f2350fe86fff9a7b`、index 为空；44 个既有脏路径按用户所有保留。本次基线与证据在 `dist/wi019-no-folder-feedback/`，仅此任务差异纳入双轴复审；体验确认后不再需追溯时可清理。不读取或遍历 .local-env，不暂存／提交，不关闭 WI／ADR／gate，不推进后续 UIP。

### 界面语言追加授权（2026-09-27）

维护者明确要求界面设置增加中英文切换，并能继续增加语言。本轮沿 WI-019 候选范围直接实施，不切换正式侧栏、不推进 UIP-04～07。顶部设置齿轮提供 English／简体中文，默认英文；本次浏览器预览内保留选择（包括 Reset），刷新页面恢复默认，不新增 host 设置或持久化。只翻译界面文案／无障碍名称，不翻译消息、代码、工具输出、审批输入、历史原文和上游错误详情。

最小 Module／Interface：共享展示组件使用类型化 UI 文案 Context（默认英文），候选语言包提供中英适配和 locale 状态；语言切换仅触发 React 更新，不更换 client、bridge、会话身份或挂载树。真实 client／校验 bridge／交接规则不变。语言包、设置界面及样式留在预览入口，无新依赖。以公开候选挂载→真实 client／模拟 bridge 验证即时切换、草稿／流式／展开状态保留；浏览器验证键盘、窄栏、主题和 Reset。此前所有验收状态保持不变。

本轮基线 HEAD 为 `fbf6767066715d5b18bd3c85f2350fe86fff9a7b`，index 为空；37 个既有脏路径全部按用户所有保留，新增实现／文档与既有内容按任务开始工作区对比，不暂存／提交。基线与红绿／浏览器／复审证据保留于 `dist/wi019-ui-language/`，完成体验确认且不再需要追溯时可清理；不读取或遍历 .local-env。

### UIP-03 视觉反馈修订（2026-09-27）

- **维护者选择／批准：** 最近会话铺满空白页与大卡片密度不符合预期；明确要求按参考图使用图标收起全部历史，不展示空白页最近列表。此反馈修订 Q5 的展示选择，PRD 双语与 UIP-03 交付已同步；不接受 UIP-03／UIP-01／WI-019，不改变其他待验收状态。
- **最小方案：** 仅改 candidate／candidate-sessions 与候选 CSS：删除最近列表和自动加载，历史／新建图标、紧凑标题＋时间行、图标切换／Back／Escape 关闭。列表仍只替换消息区；输入／Stop／审批、阅读位置、确认／交接／有界历史不变。不加搜索／云历史／设置／依赖，不改 bridge、client、协议或正式入口。依赖方向、所有权与原 Seam 保持。
- **验证与所有权：** 沿用公开候选挂载＋真实 client／校验模拟 bridge 和实际浏览器 Seam，逐例红→绿；纯视觉密度／图标／主题由真实浏览器检查。基线 HEAD fbf6767066715d5b18bd3c85f2350fe86fff9a7b、空 index、37 个既有脏路径保留，当前基线 compile／365 项测试已实跑通过。快照、差异及后续证据在 dist/wi019-uip03-visual-feedback/；不暂存／提交、不读／遍历 .local-env，不新建 WI 或推进 UIP-04。

### UIP-03 首轮焦点与最小方案（2026-09-26 UTC；展示选择已由上方反馈修订）

- **批准／范围：** 关联 Q5/Q10、REQ-008/005；最近会话、当前项目分页导航、模拟确认／取消／失败与新建／恢复、有界历史。保留输入／Stop／共享操作、UIP-01/02 与 Reset／卸载；不做 UIP-04～07、通用重构、真实后端或正式接入。
- **Module／Interface／Seam：** 候选拥有导航、焦点及阅读位置；会话列表 Module 使用既有只读投影及命名回调，有界历史复用公开 SavedHistory。真实 WebviewClient 继续协调身份／草稿／意图；PreviewBridge 仅模拟现有协议。模拟原生确认由预览生命周期拥有，与正式 host 意图区分，不另造交接协议。
- **依赖／决策：** 无新增依赖，沿用 React／client 公共入口与确定性夹具。只增候选展示，不动生产 App／入口／共享样式；Decision none，ADR／gate 不变。检查维度 1–12、15–19 涉及接口、状态、安全、生命周期、测试与隔离；持久化／诊断无新设计，需用本轮自动／浏览器／打包证据复核，不据此声称真实 host 验收。
- **TDD：** 已获明确 Seam 授权：公开候选挂载 → 真实 client／校验 bridge → 确定性模拟响应；另做真实浏览器键盘／焦点／滚动检查。先“打开历史列表不切换会话且保留草稿”红→绿，再逐例完成其余行为，不批量堆积失败测试。
- **基线／所有权：** HEAD fbf6767066715d5b18bd3c85f2350fe86fff9a7b、空 index；34 个既有脏路径全部按用户所有保留，快照／hash／差异位于 dist/wi019-uip03/。基线 compile 与 npm test 343/343（0 skipped）本轮重跑通过。本轮关注点仅候选会话导航／模拟交接／回归及配套文档，不暂存／提交。
- **完成条件：** compile／lint／npm test／verify:webview、禁读 .local-env 的受限文档扫描、diff 检查；实际浏览器窄宽／短视口／主题／键盘／阅读位置；按本轮工作区基线做 Standards／Spec 双轴复审。只交付本片供维护者体验，不关闭 WI，证据在唯一内容不再需要后清理。

| UIP-03 架构核对 | 状态 | 本轮证据／限制 |
|---|---|---|
| 1–5 接口／职责／依赖／所有权 | pass（限定预览） | candidate-sessions 只展示既有投影；真实 client 拥有身份／资格与操作规则，模拟 bridge 执行原交接语义。复用 SavedHistory／Approvals 公共入口，无新依赖／协议。 |
| 6、8–12、15–16 范围／状态／并发／错误／清理／安全／有界输出／测试 | pass（自动与浏览器） | 逐例红→绿；取消／失败保留当前工作、Stop 稳定结束与较新草稿保护、旧回调失效、Reset／卸载／模拟恢复；历史原文惰性且限制明确，不推断真实 host 保证。 |
| 17–19 构建／兼容／可访问性 | pass／gap | 运行时依赖检查、独立生产入口和产物隔离；Chrome 窄宽／短视口／主题／键盘／焦点／阅读位置通过。F5、安装版和其他宿主未复验。 |
| 7、13–14 领域／持久化／诊断 | N/A（无新增设计变更） | 不改领域身份／存储／日志策略；ADR／gate 保持原状态。 |

### UIP-02 本轮焦点与最小方案（2026-09-26 UTC）

- **批准／范围：** 本轮明确批准基础流式 Markdown／代码复制及每条助手消息紧凑活动与两级详情，关联 REQ-004/005；保留 UIP-01 全部行为。不开展通用重构、不推进 UIP-03～07、不关闭 WI／ADR／gate，也不扩大任何既有验收。
- **Module／Interface／Seam：** 候选仍由公开 mountCandidatePreview 挂载，真实 WebviewClient 校验确定性 PreviewBridge 投影。Markdown Module 只接受助手正文，生成白名单 React 元素；活动 Module 只接受现有消息／活动数据，拥有展开状态。权限、草稿、会话身份及执行仍属现有 owner，不增 host 意图。
- **依赖：** 已核对 pi-tui 的间接 marked@18.0.11；将同版本声明为直接开发依赖，仅复用 lexer，不引入 HTML 渲染／高亮／表格框架，不升级已有框架。明确 HTTP(S) 浏览器链接与复制反馈；审批／附件原文保持在既有 literal 路径。
- **TDD／证据：** 已确认 Seam 为公开候选挂载 → 真实 client／校验 bridge → 模拟响应，以及实际浏览器中的安全／复制／焦点／阅读位置。先 Markdown／复制逐例红→绿，再活动；保留标准入口回归，之后 Standards／Spec 并行复审。
- **基线／所有权：** HEAD `fbf6767066715d5b18bd3c85f2350fe86fff9a7b`，index 为空。30 个既有脏路径按用户所有保留；字节快照、hash、index／工作区 patch 存于 `dist/wi019-uip02-20260927/`。本轮审查只比较该工作区基线到当前，不用 HEAD diff 代替。本轮不暂存／提交，不读取或遍历 .local-env，不更改校验配置。
- **交付条件：** compile／lint／npm test／verify:webview、受限 docs:verify、diff 检查；真实浏览器窄宽／短视口／主题／键盘及边界行为，运行时依赖／独立打包入口／候选隔离复查。模拟浏览器不代表 F5、安装版或原生 host 路由。

| UIP-02 架构核对 | 状态 | 本轮证据／限制 |
|---|---|---|
| 1–5 接口／职责／依赖／所有权 | pass（限定预览） | candidate-conversation／reply-markdown 内部 Module；只复用公共 client／bridge，契约未改；运行时依赖检查与生产产物清单见本轮证据。 |
| 6、8–12、15–16 范围／状态／错误／清理／安全／有界输出／测试 | pass（限定自动与浏览器证据） | 候选挂载红→绿、Stop／早停／跨轮保留／32 条上限／Reset、惰性输出与复制超时；不推断 host 或上游运行时保证。 |
| 17–19 构建／兼容／可访问性 | pass／gap | 独立构建与正式资源隔离通过，Chrome 窄宽／主题／键盘／阅读位置通过；F5、安装版和其他宿主兼容未验证。 |
| 7、13–14 领域／持久化／诊断 | N/A（无新增设计变更） | 本片不改会话身份、存储或日志策略；ADR／gate 保持原状态。 |

### 既有已完成技术维护：模块内聚性整理（2026-09-23）

维护者明确要求优化本轮审查指出的 Provider 职责集中、前端 client 状态集中及 adapter 对宿主策略实现的交叉依赖，授权本次有界实现与验证。归入 WI-019 的技术维护，串行完成后回到 UIP-01，不启动剩余后端需求。

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

### 既有已完成技术维护：精简宿主与内部能力模块（2026-09-23）

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

## 当前焦点与未决项

**技术交付／阻塞交接（2026-09-27）：** 本次已授权且不依赖未决选择的实现、当前验证、复审修复及文档已推进到下列硬条件边界；不是整个 Goal 完成，也不关闭 WI／ADR／gate。完整候选 Q16 体验确认前不替换正式 root；WI-013 真实扩展名称／版本／入口及必须支持的交互尚待维护者指定，精确 DTO／队列容量／溢出及恢复预算仍须决策，不默认采纳推荐；本次原生 F5 inspector attach 外部条件失败，不能以 CLI development 或安装版替代。上述条件持续未变化，继续 agent-only 修改会越过批准或无法产生有效新证据。最短维护者步骤：按 README 完整体验 UIP-05／06／07 与组合并反馈 Q16；回答已提出的真实扩展目标问题；恢复隔离 launcher 的原生 F5 attach 条件后再复验。其他待体验项集中按现有表验收，不重复确认已接受主路径。

当前唯一 Build WI-021：终态／Stop／ACK 交错红绿及独立复审修复；标准全量检查点 **447/447、0 skipped**。0.86.1 真实 RPC → 当前 Runtime Adapter → localhost 合成 provider 已观察自动 retry、恢复回复、自动 compaction 和 agent_settled；独立 HOME／agent／tmp／cwd、无用户凭证、无付费调用，产物在 `dist/authorized-completion-20260927/runtime-workflow/`。不读写 session 文件实现产品功能；会话由 pi 管理，夹具目录仅保留隔离证据。早期夹具缺 bundled gate／压缩保留窗口导致未触发／摘要调用数假设错误，修正夹具后通过，失败日志保留；不是产品验收。前一 446 检查点 compile／lint／tests／verify:webview／安全 docs:verify／diff-check 与依赖／生产隔离检查通过；实际 Chrome 新状态 5 宽×2 语言×3 主题×5 状态（150 样本）、既有审批 9 样本及附件 8 样本已重跑通过，0 page errors／外部请求。双轴发现 Stop→晚 ACK、early failed→晚事件、confirmed delivery→断连及重复 settled 四项竞态，以及显式 Stop 失败的 pending ledger／review watcher 清理遗漏，逐例红绿修复并继续独立复核。普通安装版 v3 已在独立 profile/extensions 实际通过真实 client→host→pi 0.86.1→localhost 正常回复／completed、慢流 Stop／stopped 与较新草稿保留；产物见 `host/installed-probe-report.json`，仅这两个场景，不代表完整矩阵或 F5。安装产物的 README 相对源码链接缺失暴露 docs 扫描失败；仅在打包产物把链接转换为原仓库绝对链接，保留正文，不改忽略配置，安全 docs:verify／docs:health 已重新通过。v1／v2 保留但不代表当前 446 项源码；v3 包含正式 host owner 修复；随后新增可靠终态后 runtime_error 不改写 execution 的回归／修复（444 项），v4 已完成独立安装且所有生产 JS/CSS/gate/worker/assets 哈希与当前树一致，实际安装版正常／Stop／retry／精确 session grant／真实 write／captured before→after diff／撤销通过；CLI 隔离开发宿主重跑同矩阵通过（`host/development-tools-report.json`），明确不是原生 F5。随后真实组合发现 composer footer 裁剪导致流式模型菜单被 main 消息遮挡，标准挂载 CSS clipping 回归红→绿（445 项），最小修复只解除 footer 裁剪，context／input 仍各自有界滚动；旧 context 回归保留并明确 footer 不裁剪菜单。445 检查点 v5 已重装且生产哈希等于当时树，真实安装正常／Stop／retry／非重试失败／模型保持原值+延后设置→Stop 后应用／grant／write／captured diff／revoke 通过（`host/installed-matrix-report.json`）。真实 Chrome 正式 mount＋真实样式＋校验 bridge 30 个宽／高／主题组合菜单 hit-test、Stop、Escape、焦点、较新草稿通过（`formal-menu-browser/browser.json`）；模拟 bridge 不能替代宿主。v3／v4 保留但不作为当前 CSS 字节证据，CSS 最终 Standards／Spec 复核均 0 未解决发现（分别独立 15／34 定向测试，非独立全量／宿主）。安装版 v5 进一步通过真实自动 compaction→completed，以及 compaction 中 Stop→stopped、较新草稿保留（`host/installed-compaction-report.json`）；初始夹具 string/array marker 与摘要包含前轮 failure marker 的两种误触发已修正，三轮失败报告保留，不能把夹具失败记成产品接受。所有当前 Chrome 候选审批／附件／150 状态样本已重跑通过，445 检查点 v5 VSIX 14083 项提取 RPC／gate hello 和静态 Webview 资产核对通过。Standards 已独立复核 review watcher 三类监听释放；Spec 追加发现候选 activity 失败账本误记 interrupted 与双语契约漏写显式失败例外，已分别红绿修复／同步修正，最终两轴复核已完成，Standards／Spec 各 0 未解决实现发现（独立定向检查，非独立全量／宿主）。REQ-001 当前 0.86.1 资源公开 API／文档重新核对后，独立无模型 probe 的 6 个 allow／decline／默认／saved-trust 跨 cwd 场景通过（`project-trust/resource-matrix.log`）；这是 release 资源边界证据，不是 controlled profile 第三方扩展加载接受。在完成公开 API／文档重审和当前 6 场景证据后，修复已登记 `spike:project-trust` 入口旧 0.85.1 guard 与声明 0.86.1 不匹配的工具缺口；仍严格 pin 0.86.1，未来升级仍要求重审，不是依赖升级或降低 guard。标准测试入口新增公开 CLI 回归，红 0.86.1 != 0.85.1 → 绿 446/446，验证 allow／decline、跨 cwd 原资源移除及 AGENTS 上下文边界；仅验证工具维护，不改变受控产品 profile／授权政策或接受 gate。追加设置观察红→绿：原探针未返回 settings 且使用旧 thinkingLevel 字段，改为当前公开 defaultThinkingLevel；隔离全局 medium、项目 a off／b low，零成本 fake reasoning 模型且无 prompt／模型请求，6 场景通过公开 get_state 验证批准应用项目值、拒绝保持全局值，跨 cwd 重新应用。标准 446 项通过（project-settings-red.log／project-settings-green.log）；themes 仍未观察，不能推广到产品受控 profile。Spec 追加发现 cacheWarming 对象不是当前有效配置，已改为公开契约的 off；双语 pi-integration 旧 guard 说明已同步，两轴最后只读核查各 0 未解决项。最终当前树 compile／lint／446 项／verify:webview／docs:verify／docs:health／diff-check／graph／production 检查通过（final-current-*、final-reviewed-*）；docs 0 errors、5 保留警告（ACTIVE 长度与两份 Draft ADR），不据此接受 ADR。首次 helper 路径转换失败，6 个新建 OS 临时夹具已通过自编写 marker／observer 输出路径识别并登记在 `project-trust/first-run-retained-fixtures.json`；后续 6 个夹具位于 repo evidence `project-trust/fixtures/`，路径清单 `retained-fixtures.json`。两次 worker 均等待关闭，夹具保留供检查，不按名字删除。安装版 v5 已进一步验证 native host（隔离 profile 的 custom dialog）新建取消保留草稿、确认新建、刷新目录／恢复、压缩后 SDK 历史与初始用户原文连续性（host/installed-sessions-report.json）；不读取原始 session 文件。前三轮原生 OS dialog 不在 DOM、handoff 后面板重挂载、异步原文状态及第四轮 helper 正则转义错误的失败记录保留；修正驱动后通过，未改变产品。安装版 deliberate Reload Window 已验证运行时重启读回 Synthetic one、清除流式期间延后 two intent、重启后新任务完成（host/installed-restart-report.json）；初次 helper 错将 hidden pending 节点 count 当状态已修正为公开可见性检查，失败记录保留。追加 REQ-005 当前正式 UI 缺口红→绿：host 保留失联后较新草稿，但页面隐藏；只分离 composerVisible 与 chatVisible，错误态保留只读／可聚焦复制的草稿和可靠终态，chat 仍隐藏、发送／设置／附件新增禁用、恢复入口保留，不自动动作。公开挂载 447/447；Standards 独立 9+1、Spec 9+7+6 组检查各 0 未解决项。当前 v6 VSIX 重装到同一独立 profile，生产哈希一致，实际 verified-owned RPC 子进程终止→failed／只读较新草稿／禁止发送→deliberate Reload 后新任务完成通过（host/installed-disconnect-report.json）；v5 隐藏草稿的失败证据保留。实际 Chrome 正式挂载错误态 30 个宽／高／主题样本焦点、选择全文、Enter 不提交及终态通过（formal-readable-draft-browser/browser.json），另外当前菜单 30 样本重跑通过；首次浏览器夹具父容器未按正式 root 设置 flex 导致尺寸断言失败，修正外部夹具后通过，未改产品 CSS。actual Developer Reload Webviews 在流式中保留已同步草稿与活动 Stop owner，随后可靠 stopped（host/installed-view-reload-report.json）；这是 renderer reload，不宣称 host onDidDispose。安装版 native trust 撤销中断旧任务并回到 untrusted，重新信任不自动同意／发送，明确资源选择后才启动 controlled runtime（host/installed-trust-report.json）；前两轮 Trust modal editor 遮挡侧栏的驱动失败保留，使用原生 Close Editor 后通过，无强制 click。当前安装 v6 dirty 编辑器实际保护通过：真实写工具在审批前被拦截、disk／unsaved buffer 都未覆盖或自动保存、先前 readonly captured diff 仍可打开（host/installed-dirty-review-report.json）。当前安装 v6 选区附件实际链路通过：原生 active editor 选区→完整不可变预览→源编辑变化→Use old snapshot 明确确认→另按 Send→rpc-accepted／settled 历史与 completed 终态（host/installed-attachment-report.json）。外部 file watcher 与确认异步状态、历史 settled 标签的驱动失败保留；同步原生 editor 操作并等待确认完成后通过。复用原 isolated profile 的上次自制 dirty buffer 会正确阻止新写入，因此新增 attachment-profile-current，仅隔离此次编辑器证据，不复制仓库或用户配置；原 profile／dirty buffer 证据保留。安装 v6 追加 idle RPC loss 保留先前 completed 与只读新草稿，不被 runtime error 改成 failed，deliberate Reload 才恢复（host/installed-idle-disconnect-report.json）；helper 首次误将前面的非重试 provider failure 断言整体替换，失败保留，修正限定范围后通过。重新信任后明确 Continue without 资源路径已验证新受控任务完成（host/installed-trust-decline-report.json），不是默认扩展执行许可。新增 qualification-profile 和自制双 folder workspace，仅隔离无文件夹／多根实际资格检查；两场景都不显示 resource admission／composer（host/qualification-no-folder-report.json、qualification-multi-root-report.json），未据 UI 推断 OS 子进程不存在。所有该组宿主／provider 清理完成，profile／workspace 供复核保留。安装 v6 原生 thinking slider 在 stream 期间维持已应用 medium、只登记待应用 high，Stop 可靠 settled 后从 SDK readback 应用 high，保留新草稿（host/installed-thinking-report.json）。审阅另验证真实 >256KiB before capture：工具写入完成但明确 Source is too large／Unavailable、无伪造 diff，旧 captured before/after 仍可读（host/installed-review-limit-report.json）；第一轮 helper 漏 Reason: 前缀的失败保留，修正观察后通过。当前 CLI development host 已用最终 447 树重跑正常／Stop／retry／grant／write／native diff／revoke（host/development-tools-report.json），不是原生 F5。原生 Add Folder to Workspace 在 stream 中加入自制第二 folder，明确原生 Trust 后重新挂载显示 multi-root 并阻断旧 admission（host/installed-add-folder-report.json）；首轮旧 iframe 失效／Trust 提问、次轮 Code 记住自制 Untitled workspace 的驱动失败保留；新增 add-folder-profile-current 隔离该缓存，未修改正式行为。当前最后独立整合复审：Standards 基线直接 diff／47 tracked+6 untracked／diff-check，Spec 8 组定向 97/97；发现 1 P2 与 2 P3 过期状态文本，已修复并各自只读复核为 0 未解决项（不把独立定向或读取日志记为独立全量／宿主通过）。完整宿主矩阵／F5 仍待：当前独立 F5 原生调试已创建开发窗口并加载本仓库路径，但 js-debug attach localhost inspector 报 Socket closed，开发 extension host debugBrk 等待超时；19544 CDP 未开放；排除驱动假设后确认 F5 开发窗口实际在已拥有的 parent browser 中（不是独立新 browser），localhost inspector attach 仍失败，开发扩展未完成启动，尚不通过。失败记录在 `host/first-f5-report.json`、`host/second-f5-report.json` 与当前隔离 logs，不能当作 F5 行为通过，继续诊断或补条件。WI-019 保留完整候选体验／Q16 等条件，正式侧栏不替换；其他待决／待验收依原表，不关闭。

- [x] WI-020：2026-09-26 维护者接受并关闭；公共入口／类型契约和 P2 修复记录归档，不改变 ADR／gate。
- [ ] WI-019（待完整候选体验确认，未关闭）：本次恢复 UIP-05～07 和条件满足后的正式接入；历史入口／语言设置／单个居中 +／无文件夹修订保留；UIP-02 与无文件夹限定确认有效，其余及整体视觉待确认。确认前正式页面不切换。

- [x] WI-016 T016-01：代码／可执行验证完成，最终回归 210/210；实际 F5 与普通安装版分别通过 dirty／等待／grant／edit／恢复／Stop 矩阵。Standards 修复两轮测试时序／挂起发现后 0 未解决；Spec 0。没有替代维护者体验接受，WI-016 尚未关闭。
- [x] WI-016 T016-02：代码／可执行验证完成，229/229、双轴无未解决发现；浏览器／真实 F5／安装版各自记录，当前包与源码一致。维护者体验接受单独保留；[历史交接](docs/archive/2026-09-22-goal-change-review-handoff.zh.md)。
- [x] WI-017：T017-01～03 代码／可执行验证完成；compile／lint、308/308（0 skipped），Standards／Spec 复审均无未解决项；实际 F5／普通安装版、最终 VSIX 内容与清理分列记录。仍待维护者体验接受，未正式关闭；[完整交接](docs/archive/2026-09-23-goal-session-handoff.zh.md)。
- [ ] WI-021／REQ-004：retry／compaction、可靠 completed／stopped／failed 与 ACK 交错代码已实现，447 标准回归、当前真实 RPC／安装 v6 矩阵通过；完整 F5／个人目标接受仍待，不能据此关闭 WI／gate。prompt ACK／agent_end／compaction_end 不等于终态，agent_settled 或明确不可恢复失败冻结可靠结果；Stop 先 clear_queue 再 abort。REQ-001／002／005 当前验证与缺失条件见收尾表／本节证据；WI-018 未登记、不复用。
- [x] WI-014 T014-01～05：明确 REQ-003 代码／可执行验证完成，T05 检查点 197/197、本轮总回归 229/229；浏览器、真实 pi 合成链路、实际 F5、普通安装版与包一致性分列。维护者仍需确认窄栏／键盘、逐项确认、长历史预览与容量恢复体验；不自动正式关闭。
- [ ] WI-015 人工体验确认及 ADR 0003 接受仍待；不因前端重构永久暂停后续需求。
- [ ] WI-008／009：已确认 2026-09-21 的基础／空闲及延后设置主路径；故障／审批／Stop 完整矩阵未整体接受，不重复要求已确认路径。
- [ ] WI-010 pending-adr／完整边界矩阵及三个 Open gate 保留；有限切片关闭不代表安全沙箱、回滚或全后代取消保证。
- [ ] WI-013 依赖前置后恢复；加载目标选择／验证及交互队列预算仍有真实待定选择，见[保留调查](docs/discussions/2026-09-22-pi-compatibility.zh.md#wi-013-暂缓提案保留2026-09-22)。到需要时提出最少量具体问题，不重访已确认设计。
- 当前禁止读取 `.local-env`；历史配置授权不覆盖本 Goal 禁令。历史 F5 曾有 code134 间歇失败与成功隔离证据并列，不作本次通过；本次 Socket closed／debugBrk 阻塞见当前焦点，不把 sourceMaps／trace 开关声称为已证明根因修复。

## 停车场

WI-019 的后续预览切片保持排队；[UIP-01～07 与依赖图](docs/discussions/2026-09-22-webview-framework.zh.md#交互预览候选切片)作为其串行拆分参考；UIP-02 体验已确认，UIP-01 待验收条件保留，UIP-03 实现、本地检查与双轴复审完成，待维护者体验确认；UIP-04 本轮候选实现、检查与复审完成，待体验，UIP-05～07 本次代码／技术检查已完成，完整候选体验及正式切换条件待确认；不再排队实施。

编辑区 panel／Chat Participant、全生态或额外平台扩展、无产品依据的 delta 优化、全局启动默认持久化及跳过工具审批仍不自动纳入。REQ-007／008／009 明确需求不是停车场。

### WI-017 待验收（非并行 Build）

REQ-008 会话连续性的代码与可执行验证已完成，尚未正式关闭。批准范围、公开 API／宿主证据、最终 VSIX 及资源保留条件见[WI-017 检查点](docs/archive/2026-09-23-goal-session-handoff.zh.md)。仍需维护者确认：窄栏／键盘会话列表与长历史分块、Cancel 保留草稿、确认 New／Restore 清理临时状态、原入口退出说明、审批／grant 重置及失败恢复。WI-020 技术关闭与 WI-019 恢复均不重写这些条件或提升 PRD／ADR／gate 状态。


## 最近交接

### WI-019 UIP-01～04 接续（2026-09-26～27）

**2026-09-27 UIP-04「+」居中修订：** 维护者截图指出文字加号偏下；仅将加号改为 aria-hidden 的对称 SVG，用 28×28 按钮的 grid 居中／零 padding，避免字体基线影响，不变更按钮位置／可访问名称／菜单行为。实际 Chrome 几何检测 dx=0、dy=0，截图已核看；编译／lint 与其余本次回归结果见 dist/uip04-plus-center-20260927/。该目录保留开始快照、日志、截图及隔离 browser-profile，体验后证据不再需要且自有进程关闭时可清理。不暂存／提交、保留既有修改、不改变 WI／ADR／gate 状态。

**2026-09-27 UIP-04 菜单精简：** 按维护者圈图移除 + 菜单的 Context limits and privacy 项及展开说明，不迁移到其他位置；文件／选区、保留附件历史及原有预算校验／错误提示不变。compile／lint／npm test 408/408／verify:webview 本次实跑通过；空菜单 End 到选区、Escape 返回 + 的回归已更新；实际 Chrome 菜单截图及八组尺寸／主题／语言与既有交互回归通过，0 页面错误／0 内容外部请求。首次红灯尝试遇到机器内存／页面文件不足，不当作功能红灯证据；完整回归恢复后通过。本次开始快照、日志与隔离浏览器证据保留在 dist/uip04-menu-clean-20260927/，体验后证据不再需要且自有进程关闭时可清理。不暂存／提交／关闭 WI，不改变待验收状态。

**2026-09-27 UIP-04「+」视觉接续：** 维护者提供 Claude Code 截图，要求单个 + 收拢文件／上下文添加。候选左下角 + 改为紧凑方形入口，菜单向上弹出、限宽并使用文件／选区图标；已添加条目置于输入框内正文上方，阅读滚动区与入口／弹出菜单分离，不裁切菜单。仍用既有模拟添加文件／选区，不冒充真实电脑上传，无新增能力、依赖或正式入口切换。本次接续 compile／lint／npm test 408/408（候选 87 项）／verify:webview 通过，新增公开挂载红→绿用例验证单 +、添加顺序和正文保留。实际 Chrome 本次八组窄宽／短视口／主题／双语矩阵、菜单键盘／焦点、文件与选区确认、分页与流式阅读、共享审批／Stop、失败／取消及生命周期复查通过（0 page error／0 内容外部请求）；修复短视口滚动容器与审批组合高度问题后重跑通过，早期失败记录保留。不声称 F5／安装版或原生上传验收；上一轮双轴复审只覆盖当时补丁，不冒充本次新增修改的独立复审。本次五个文件开始快照与实际日志保留在 `dist/uip04-plus-20260927/`（含隔离 browser-profile）；用途为本次视觉回归，维护者体验后、证据不再需要且自有进程关闭时可清理。保留全部既有修改、不暂存／提交、不关闭 WI 或改变待验收状态。

**UIP-04 本轮交接（2026-09-27；待体验，不关闭 WI）：** 运行 `npm run preview:webview`，打开 Vite 的本地地址（工具栏 Pi · UIP-04）。输入正文，用 + 添加模拟文件／选区；紧凑条目展示类型、原始范围、字节数与未保存／来源变化／旧快照，展开路径可看全名，Preview 查看惰性原文，Remove 只移除该项。无附件／正常纯文本发送不常驻空计数或上下文接纳说明。+ 内可看限制／隐私及附件历史；有保留项时另有紧凑历史入口。流式期间菜单只允许阅读历史／限制，不允许新增或修改附件；发送／Stop／模型控件仍在阅读滚动区之外。

**体验步骤：** Source changed 场景附加选区后发送，分别确认最新文件／旧选区，再明确发送；确认不要求先预览且不自动发送。“模拟来源编辑”让已确认附件再次拒发，也使正在准备的旧确认失效。Attachment preparation failure／capacity rejection／delivery uncertain／source unavailable 可检查失败、容量与不确定投递；空白场景添加中 Stop 可取消且保留正文。Long live history 从 + 打开历史、First／Next／Latest 分页、预览完整保留原文；可同时流式、编辑较新草稿与 Stop。Long context and literal content 检查长路径、多项与 HTML／资源字面惰性。保持英／中、会话取消／提交、Reset／卸载与旧响应失效，审批仍走既有共享区域。

| UIP-04 验收项 | 本轮实现／证据 |
|---|---|
| 紧凑入口与元数据 | + 的文件／选区／隐私／历史操作接通真实 client／校验模拟 bridge；长路径按需展开、有界局部滚动，菜单方向键／Home／End／Escape／焦点返回。 |
| 原文／移除／来源确认 | literal pre，不经 Markdown、不加载资源；逐项动作；文件刷新确认与固定选区旧快照分别处理，再变化／确认晚到重新校验。 |
| 混合发送与预算 | 混合快照接纳／清空与较新草稿沿用 owner，无重复；单项 256 KiB／总 1 MiB／20 项／正文 8000 不变。 |
| 失败／取消／投递 | 可见准备失败、超限、不可用与取消；不确定投递保留记录／较新草稿、不重试；已知界面状态双语展示，协议值／未知上游细节与原文不改。 |
| 保留历史 | 默认收起，最多 128 快照；既有分页与全原文预览、实际保留投递状态和终态（settled／interrupted／uncertain），不是当前文件／模型上下文。 |
| 既有行为与生命周期 | 标准入口保留 UIP-01～03 与附件／草稿／历史回归；无文件夹草稿／信任资格、共享审批、会话交接、Reset／卸载与迟到响应；不切正式入口。 |

**本轮检查与复审：** compile／lint／npm test **407/407（0 skipped；候选 86 项，本轮新增 28 项，标准入口实际收集）**／verify:webview／运行时依赖与独立产物隔离检查通过。实际 Chrome 8 组宽度／短视口／主题／语言矩阵通过：280／320／360／400／600px、500／800px、浅／深／高对比、英／中；菜单键盘／隐私操作／Escape／焦点、长路径、多项、原文／来源再次变化、失败／取消／容量／不确定投递、流式阅读／分页／较新草稿、共享审批／Stop、会话取消／提交、Reset／卸载及晚到响应通过，0 page error／0 预览内容外部请求。280×500 审批＋附件历史组合 Stop 位于 453–483px，审批决定可点击／局部滚动。Standards 最终独立复核：0 剩余规则发现／0 可操作启发式发现；Spec 最终独立复核：0 剩余可操作发现／无范围扩张。审查均对照本轮开始的工作区快照→当前 13 个变动路径（含新文件），不是仅比较 HEAD；复审者核查本轮证据但未独立重跑命令。Standards 首轮 1 项 P2（隐私键盘模型）、Spec 累计 3 项 P2（历史终态／状态本地化／新接纳审批的拒绝终态）已修复。补齐 Q12 的 + 历史只读资格、共享审批先接纳／有界布局、保留快照真实字节数（历史夹具 84／68）。不把模拟 Deny 的终止规则扩为真实 pi／host 保证。

**TDD 证据口径：** 新行为逐例验证；已复用的无文件夹／生命周期等作为保留回归。早期路径／范围断言、隐藏模型菜单的 DOM 比较与定时器步进探针经当前源码事实校正，失败记录仍保留，不记为产品回归或绿灯。历史终态修正后的有效红证据另用任务开始的 bridge 在内存构建中回放（`red-19-valid-baseline-replay.log`），这是事后基线验证，不冒充原始按时间顺序的红灯；当前 `green-19-spec.log` 与完整入口通过。

**证据／保留／限制：** `dist/uip04-20260927/` 保留开始快照（Markdown 用 .snapshot 后缀，避免当作文档扫描）、本轮 task.patch／清单、逐例红绿、检查日志、浏览器截图／脚本与独立产物隔离探针。`dist/uip04-20260927/browser-profile/` 是本轮明确隔离、无凭证的 Chrome 证据 profile，不是仓库副本；维护者体验／复核后，唯一证据不再需要且所有自有进程关闭时可清理。Windows 早先浏览器清理工具的进程查询超时，该轮自有 Node／Vite 已按记录的精确 PID 终止；最终使用已核对 PID 所有权的独立 Chrome／CDP 与程序化 Vite，记录自有 Chrome／连接／server／esbuild 关闭，不触碰原有服务。最初独立产物探针要求未捕获的初始 asset hash，故该断言不可成立；改为本轮生产入口／完整 module graph／候选 CSS 排除及内存构建与磁盘产物对照，不声称初始二进制 hash 相同，不改项目校验配置。没有 F5、安装版、原生选择器／文件系统、真实模型或其他宿主验收。HEAD／空 index 保持；45 个既有脏路径中 33 个字节未动、12 个只叠加本片，新增 candidate-context.tsx；不暂存／提交／关闭 WI，不改变 ADR／gate 或 UIP-01／03／WI 整体验收。


**以下前片交接仅作保留上下文，不是本轮 UIP-04 检查结果。**

**2026-09-27 无文件夹视觉反馈交接（本次）：** 无文件夹场景为正常欢迎页／可编辑草稿，不再前置工作区卡片或展示不可用模型占位。点击发送或非输入法 Enter 才出现“无法发送消息／请先打开文件夹或工作区再继续”；确定／关闭／Escape 保留输入并返回焦点。弹窗保留命名“打开文件夹”，模拟恢复后仍需资源选择，不自动发送；传输失败在弹窗内可见，草稿不丢失。只改变候选提示时机，client／bridge／host／信任与任务资格未改，无新依赖／第二份草稿／通用框架，未推进 UIP-04～07 或切换正式侧栏。PRD、README、架构及关联讨论双语同步，本次不接受／关闭 WI、ADR 或 gate。

**本次检查／复审：** compile、lint、npm test **379/379（0 skipped；候选 58 项，新增 4 项并适配 2 项既有断言）**、verify:webview 通过。逐例红绿覆盖欢迎页／发送提示、既有恢复、可见传输失败；回归覆盖 Enter／Shift／IME／空白输入、没有任务意图、Reset／卸载。真实 Chrome 153.0.8010.54 在 280／320／360／400／600px、500px 短窗口及浅／深／高对比共 8 组通过欢迎页／弹窗、无横向溢出、中英文、初始焦点／Tab／关闭／Escape、草稿、模拟资源恢复及之后正常发送／Stop／较新草稿、Reset／卸载；0 page error／0 外部请求。Standards：0 硬违规／0 可行动 smell，独立内存挂载 6/6；Spec：0 未解决／无越界，独立挂载 5/5 和实际 Chrome 四条关闭／恢复路径通过。审查基于本次工作区基线→当前工作区，不归责原有修改。

**本次隔离／证据／未验：** 81 个非测试源码、100 条运行时依赖无环／入口绕过／特权泄漏；实际正式入口 src/webview/main.tsx 的 41 个渲染模块排除候选提示、语言包、夹具与样式，JS 285573B／CSS 19026B。受限 docs:verify 0 error／0 stale，保留既有 ACTIVE 长度及 Draft ADR 的 5 项提示；git diff --check 与含新文件的任务差异检查通过，未改校验配置，未关闭／归档或运行 docs:health。证据保留在 `dist/wi019-no-folder-feedback/`：基线、红绿／最终检查、审查差异、浏览器脚本／截图与隔离检查；期间测试替身的类型错误及浏览器对原生 Tab／异步 close 完成时机的探针假设已修正，最终结果通过。体验确认且不再需追溯时可清理。44 个原有脏路径保留，30 个逐字节未动，14 个只叠加本片，另新增 no-folder-prompt.tsx；HEAD／index 未变，未暂存／提交，未访问 .local-env。自建浏览器／Vite 进程已清理，旧证据不动。未做 F5／安装版／真实原生文件夹选择器或真实模型验收；草稿保留证据限当前预览寿命，不声称首次打开文件夹引起宿主重启后仍有持久化保证。


**2026-09-27 界面语言追加交接（本次）：** 顶部齿轮 → Interface settings／界面设置 → Language／语言，支持 English／简体中文即时切换；默认英文，本页内场景／Reset 保留，刷新页面恢复英文。候选正文控件、模型／思考、活动、复制／链接反馈、会话／保留历史、原生模拟交接、工作区／审批及预览工具栏统一取类型化 UI 文案；原始消息／代码／工具／审批／历史／上游错误不翻译。共享 Context 默认英文，候选完整语言包与注册表可继续增加语言，未新增依赖／host 意图／持久化或切换正式页面。PRD、README 和架构双语同步；本次不推进后续 UIP，不接受／关闭 WI 或 ADR／gate。

**本次验证／双轴：** compile、lint、npm test **375/375（0 skipped；候选 54 项，含新增 8 项）**、verify:webview 通过；六个逐用例红绿及现有回归保留，另有浏览器工具栏／原生 Escape 红绿和 Reset／卸载回归。Chrome 153.0.8010.54 实跑 280／320／360／400／600px、500px 短窗口及浅／深／高对比 8 组，中文无水平溢出；键盘／关闭焦点、阅读位置、展开／流式／Stop／较新草稿、历史分页／恢复原文、准确剪贴板和 Permissions Policy 复制拒绝、惰性恶意输出、Reset／刷新生命周期通过。原生设置 Escape 不再误关底层模型；两轴发现同一 P2“关闭按钮在 modal 释放前聚焦导致 BODY 获焦”，真实浏览器红灯后改为原生 close → onClose，鼠标／Enter／Escape 复验通过。Standards 最终 0 硬违规／0 可行动 smell（源码／证据复查，未独立重跑浏览器）；Spec 最终 0 未解决／无越界，并独立 Chrome 四项关闭路径通过。

**本次隔离／证据／限制：** 80 个非测试源码／98 条运行时边无环、无公共入口绕过或 Webview 特权导入；实际生产入口仍为 src/webview/main.tsx，41 个渲染模块排除候选语言包／设置／夹具／样式。共享默认英文展示接入 Context 后 JS 为 285573B，**不宣称与基线逐字节相同**；CSS 为 19026B。受限 docs:verify 0 error／0 stale，保留 ACTIVE 长度与既有 Draft ADR 的 5 项提示；git diff --check 及包含未跟踪文件的任务差异检查通过。未改校验配置；本次不归档／关闭，未运行 docs:health；未做 F5／安装版／原生 host 或真实模型验收。`dist/wi019-ui-language/` 保存工作区基线、红绿／最终检查、审查差异、浏览器脚本／截图及依赖／打包证据，体验确认且不再需要追溯时可清理。所有自建浏览器／Vite 子进程已按身份清理；既有证据目录不动。37 个既有脏路径保留，其中 19 个逐字节未动，其余仅叠加本片，另有 3 个此前干净文件和 4 个新源码文件属于本次；HEAD／index 未变，未暂存／提交，未读取或遍历 .local-env。


**UIP-03 视觉反馈修订（2026-09-27，本次）：** 维护者明确取消空白页最近会话，要求历史图标默认收起；PRD Q5／UIP-03 当前交付及 README 双语已同步。已去掉最近列表和自动加载，New／History 改为带名称／提示的图标；历史改为整行可点击的紧凑标题＋短日期，摘要／完整时间通过 tooltip 和可访问说明保留。再次点击历史图标、Back 或 Escape 关闭并恢复阅读位置／焦点。列表仍只替换中间区域；输入、Stop、共享审批、既有确认／交接／有界历史保持，不加入参考图中的搜索／云历史／设置，也不改 bridge／client／协议／依赖或正式入口。

**本次实际验证：** 公开挂载 Seam 逐例红→绿覆盖默认收起／主动加载、图标切换／Escape、收起后的失败反馈；纯视觉图标与密度由真实 Chrome 先红后绿。删除旧最近入口后，5 项旧入口断言先失败，再按新批准入口迁移，保留恢复／有界历史／资格／阅读位置／排序行为；另改重复点击回归为图标关闭再打开，不从隐藏按钮触发返回。46 项候选测试和标准入口 367/367（0 skipped）通过；compile、lint、verify:webview 通过。Chrome 153.0.8010.54 的 8 组宽度／主题／短视口检查通过：历史行 36px、0 横向溢出，空白页无最近列表，键盘／焦点、内外阅读位置及展开、草稿／Stop、取消／恢复／失败／页边界可用；UIP-02 原生 Markdown／准确复制／复制拒绝／安全链接回归也在本次重跑通过。生产 JS／CSS 与本反馈开始时逐字节相同；76 个生产源码／82 条运行时边无环或特权泄漏。受限 docs:verify 0 error／0 stale、5 项既有提示；git diff --check 通过；Standards 初审／最终复查均 0 未解决、0 可行动 smell；Spec 首审的一项 P2 已修复，最终复查 0 未解决、无越界。该 P2 为：焦点在保留输入区时 Escape 未关闭历史；已补公开挂载红→绿，将关闭处理提升到候选根，并保留模型弹层／原生交接对话框的 Escape 优先级。真实浏览器重跑确认输入／Stop 区域关闭及两类弹层优先级。不是 F5、安装版或原生 host 交接验收。

**本次证据／保留：** dist/wi019-uip03-visual-feedback/ 保存初始 37 个脏路径（含未跟踪）快照／hash、有效红绿、当前工作区差异、浏览器脚本／截图／日志、检查与审查证据。首份直接比较 DOM 对象的红灯探针未给出可用输出，不计作行为红灯；改为观察布尔结果后明确失败，再做实现。既有内容均保留：26 个原脏路径字节未动，11 个仅作本反馈必要增量；没有新增源码文件，HEAD／空 index 不变。只使用忽略的证据目录，无 worktree／副本／暂存／提交；未读／遍历 .local-env，未改校验配置。自有浏览器／Vite／helper 验证后清理，原有服务保留；证据在维护者确认、唯一内容不再需要且无进程使用后清理。UIP-03 体验仍待，不推进 UIP-04，不关闭 WI，不改变 ADR／gate／UIP-01 或其他待验收条件。

**UIP-03 首轮实施交接（2026-09-26 UTC；最近列表的后续视觉修订见当前焦点）：**

**交付与体验入口：** 本片实现空白页最近三条、顶部 New／History、当前项目分页及 Back；会话列表仅替换中间消息区，输入／执行状态／Stop 和既有共享审批区域保持挂载。浏览不切换会话、不清草稿，返回保留两级活动展开、主动阅读位置与键盘焦点。运行 `npm run preview:webview` 并打开 Vite 输出的本地地址；选 Saved sessions／No saved sessions／Saved sessions error 检查列表（Refresh 恢复错误），选 Streaming 或 Activity before reply 检查浏览中流式／Stop。New／Restore 打开明确标注的模拟确认，支持取消／Escape、恢复失败、Stop 失败及成功重试。恢复后由现有 SavedHistory 查看更早页和原文分块、截断与无法恢复提示；历史不会送入模型、重放任务或读取当前文件。UIP-04～07 场景仍禁用，正式侧栏不变。

**TDD 与必要修复：** 从“打开历史不切换且保留草稿”逐例红→绿，标准入口新增收集 22 项候选行为用例，原有 343 项保持通过。覆盖页边界／返回阅读位置、流式／Stop、取消／失败、成功新建／恢复、并行有界历史、共享审批和清理；修复重复打开 History 的阅读位置覆盖及短视口欢迎页自动滚动。审查修复包括较新草稿使旧确认失效、失效后待应用模型继续应用、加入已在进行的 Stop、后页恢复失败后的最近页 Refresh、按修改时间排序的最近会话、模拟恢复中止未提交交接而不挂起导航。既有 preview-sessions 回归仅将必要的最新条目预期 01 改为 33，没有弱化断言或用旧页面通过替代候选接入。

**本轮实际检查：** compile、lint、npm test **365/365（0 skipped）**、verify:webview 均通过；final-check-results.json 与 final-*.log 保留输出。Chrome 153.0.8010.54 实跑 280／320／360／400／600px、浅／深／高对比、320×500 短视口共 8 组；键盘／焦点／内外阅读位置、列表状态与边界、浏览期间流式及 Stop、确认取消／失败／重试／不重放、历史分页分块、Reset／卸载和模拟恢复竞态通过。另重跑 UIP-02 实际流式 Markdown、准确剪贴板、浏览器 Permissions Policy 复制拒绝、安全新标签链接与惰性恶意输入；Windows 原生剪贴板采用 CRLF，挂载用例确认输入 LF 内容，未以换行宽容掩盖代码差异。最终浏览器 0 page error、0 嵌入远程资源请求；安全链接目的地由测试路由截获，不访问真实外站。受限 docs:verify 与 git diff --check 通过，0 error／0 stale，保留 ACTIVE 长度及既有 Draft ADR 的 5 项提示。文档沿用 docs-safety-preload.mjs 仅在本进程排除禁读目录的调用方式，没有扩大豁免或改校验配置；本轮不关闭／归档 WI，未另做全库 docs:health。

**隔离／未验证：** 76 个生产源码、82 条运行时边，无环／公共入口绕过／Webview 特权导入。实际生产 bundle 仍从 src/webview/main.tsx 构建，40 个渲染模块排除候选、夹具及 marked；JS 284714B／CSS 19026B 与本轮开始时逐字节一致。独立 extension／approval-gate／session-worker 构建产物清单已更新。未加依赖，不改 package／校验配置。仅模拟浏览器证据，不是 F5、安装版、原生 host 交接或真实 pi 验收；与重设计审批的完整组合矩阵仍归 UIP-07。

**Standards／Spec：** 基于“任务开始工作区 → 当前工作区”（含新文件、无提交）由两个独立审查分别完成。Standards：初始两项 P2（已有 Stop 的交接等待、后页失败后的最近页恢复）及追加 recovery 竞态 P2 均已修复并复查，最终 0 未解决、0 可行动 smell。Spec：较新草稿被旧确认清空的 P1、最近会话排序的 P2 均已修复并复查，pending settings／恢复伴随检查无新发现，最终 0 未解决、无越界。最终交接文字也经双轴窄复查；review-*.patch／scope 与 *-review-*.txt 保留范围和结果。既有修改只作必要上下文，不纳入本轮发现归责。

**失败与保留证据：** dist/wi019-uip03/ 保留初始 HEAD／index／工作区（含未跟踪）快照、逐例红绿、审查差异、实际浏览器脚本／日志／截图、构建与依赖检查。期间功能红灯及探针配置／选择器／断言故障、原生键盘滚动等待调整、首次进程树清理超时均保留；首轮收尾文档扫描发现新增交接标题超过两条，已将同一 WI 的预览接续归入一条交接，保留原验收与证据内容；修正后重新执行，不以历史通过覆盖失败或修改校验规则。最终自有 Chrome／Vite／helper 已退出，未关闭既有用户服务；没有临时 worktree／仓库副本。34 个原有脏路径中 18 个逐字节未动，16 个只作本片必要增量且保留原始快照；另增两文件、必要修改一个原来干净的 fixture 回归，总计本轮 19 路径。HEAD fbf6767066715d5b18bd3c85f2350fe86fff9a7b 与空 index 未变；不暂存／提交，未读取或遍历 .local-env。证据待维护者确认、唯一内容不再需要且无进程使用后清理，不按名称自动删除。

**下一步仅体验确认：** UIP-03 等待维护者检查最近／分页、浏览中 Stop 与草稿、模拟取消／失败／成功交接和恢复历史。UIP-02 的确认仅限该片，UIP-01 及 WI-019 整体仍未验收；不关闭 WI、不推进 UIP-04、不改变 ADR／gate 或其他待验收状态。

**UIP-02 本轮实施（2026-09-26 UTC；证据目录使用本机 9 月 27 日标签）：** 已按授权实现助手正文白名单 Markdown、准确代码复制／失败／不可用／超时反馈、每条助手消息一行活动与两级原文详情。早到活动与正文使用同一消息身份，失败／截断置于摘要前部；模拟桥保留前轮活动、Stop 后标记中断，并维持既有 32 条消息窗口。正式入口、client／host 协议与权限未改。沿公开候选挂载逐项红→绿（详见本轮日志），追加必要回归而不改测试收集／检查配置。既有 Stop 回归原来比较整条助手 article；活动现在会合法变为 interrupted，因此保留原断言意图，改为检查正文不变，另有新用例检查活动中断及跨轮保留。

**当前验证／限制：** Markdown 先通过挂载与 Chrome 后才接入活动；Chrome 153.0.8010.54 的 8 组窄宽／主题／短视口已检查流式中间态、原生剪贴板写入和 Permissions Policy 拒绝、显式链接与零嵌入资源请求；Windows 原生剪贴板使用 CRLF，传入 writeText 的 LF 内容由挂载用例精确核对。活动检查在原生 PageUp/PageDown 滚动尚未结束时首次失败；等待可观察位置稳定后，8 组外层／详情阅读位置、键盘焦点与两级展开均保留，无需改应用跟随逻辑。本轮最终 compile／lint／npm test **343/343（0 skipped）**／verify:webview 均通过；其中候选挂载 22 项，新增 10 项确认由标准入口收集。74 个非测试源码、79 条运行时依赖无环／公共入口绕行／Webview 特权值导入；Vite 实际生产入口仍为 `src/webview/main.tsx`，40 个产物模块排除 candidate／marked／host／adapter／Node／pi。生产 JS／CSS 与本轮工作区基线字节相同，独立 host／gate／session-worker 由 compile 重新产出。受限 docs:verify／docs:health 和 git diff --check 通过：0 error／0 stale／0 lifecycle notice，5 项提示（ACTIVE 长度及既有 Draft ADR）。Standards 首审与修复后复审均 0 发现；Spec 首审发现 1 项 P2：首个正文到达前 Stop，再发送会丢失活动-only 回复。已先红→绿补测，再在 Stop 投影中保留该消息身份并保持 32 条上限；真实 Chrome 也重跑并保留早停后的两级展开／中断记录。Spec 复审确认该 P2 已解决；最终集成又补上同一用例的旧空正文占位检查，避免下轮执行时旧中断消息误显 Thinking，已红→绿修正为消息自身活动驱动。该补充的双轴最终复查均 0 发现：Standards 0，Spec 初始 P2 已修、最终 0 未解决；Spec 复审独立重跑了扩展挂载用例。本轮审查严格按开始时工作区快照到当前的 19 个路径，包含本轮未跟踪新文件，不将既有用户修改作为本轮发现。无 F5／安装版／原生 host 路由／真实模型验收；以上自动／模拟验证本身不替代维护者体验确认，后续反馈单独记录如下。

**UIP-02 体验确认（本次维护者反馈）：** 维护者回复“可以，我认为不错”，记录为本片预览的体验确认，仅限 UIP-02。UIP-01 和 WI-019 整体验收、ADR／gate 及其他既有待验收条件不变，不据此认可未验证的 F5／安装版／原生 host 路由。本次仅同步确认记录与相关双语状态指针，不改代码、不启动 UIP-03～07、不切换正式侧栏、不关闭 WI、不暂存／提交；既有实现与证据保留。 本次仅文档核对：禁读 .local-env 的受限 docs:verify 与 git diff --check 通过（0 errors／0 stale，保留既有 5 条文档 warning）；未重跑代码或浏览器检查。确认前快照及本次检查日志保留于本轮证据目录的 confirmation-*／experience-confirmation-* 文件，沿用原清理条件。

**检查中的修正与证据边界：** 首次库类型编译问题已修正；首次浏览器探针出现 Windows 进程查询／清理超时，按本轮 PID、创建时间与完整命令核对后清理并重跑，默认启动的挂起读取进程也已逐一核对清理，不据此宣称查明系统根因。首轮文档扫描将原始 Markdown 快照视为独立文档而报相对链接错误；已逐字节保留为 `.md.snapshot`，不是扩大扫描豁免或改配置。复制、Markdown 和活动中间态的红→绿失败日志保留；原生剪贴板拒绝使用真实浏览器 Permissions Policy，而非伪造成功。

**本轮证据保留：** `dist/wi019-uip02-20260927/` 含初始字节快照／hash／差异、逐例红绿、浏览器脚本／日志／截图、后续检查与审查差异；维护者确认且唯一证据不再需要后清理。30 个既有脏路径中，15 个未触及文件字节完全保留，另外 15 个仅作本片必要增量并保留原始快照；HEAD 与空 index 未变。本轮自有浏览器／Vite／helper 已清理，既有用户预览服务未关闭。未创建 worktree／仓库副本，不读取或遍历 .local-env，不暂存／提交，不关闭 WI 或改变 ADR／gate／其他待验收状态。

#### WI-020 关闭／WI-019 UIP-01（2026-09-26）

维护者明确接受 WI-020，本项已关闭；完整提案、原审查与 P2 修复证据见[双语归档](docs/archive/2026-09-26-wi-020-public-entries.zh.md)，不把技术验收扩展为产品／ADR／gate 接受。WI-019 恢复为唯一 Build，当前仅 UIP-01；本片代码与本地可执行验证完成，等待视觉审阅，不自动推进后续切片或关闭 WI。

**本次视觉反馈（2026-09-26）：** 按维护者截图删除聊天区 `pi／pi-vscode` 标题行及四条专用样式，不留占位；中间欢迎内容与上方预览调试工具栏保留。PRD 双语已记录限定选择，不改正式侧栏、接口／状态／权限或 REQ-001 的真实执行前项目可见性要求。纯展示删除由浏览器检查承载，不添加冻结内部 DOM 的仓库测试；既有 10 项候选挂载回归保持不变。

**标题反馈验证：** 实际 Chrome 先确认重复项目标题的检查失败，删除后通过；360px 截图复核、320／400px 正常视口与 320px 短视口均无标题占位或水平溢出，发送／Stop／较新草稿检查通过，0 page error。本次重新执行 compile、lint、331/331 全量测试（0 skipped）、verify:webview、docs:verify 与 diff 检查；文档最终 0 error／0 stale，仍有 ACTIVE 长度和 Draft ADR 的 5 项既有提示；首次文档检查将本轮 `.md` 证据副本当成正文检查而出现相对链接错误，快照改为 `.txt` 后原字节保留并重新验证，未放宽校验。未执行新 F5／安装版／真实 pi 验证。`dist/wi019-uip01-20260926/header-feedback/` 保留修改前 29 个既有脏文件快照及本次日志／截图，沿用父证据目录的保留条件；自有浏览器／Vite helper 已清理，未触及用户服务。HEAD／空 index 不变，其他既有修改保留，无暂存／提交；WI-019、ADR 和 gate 状态不变，完整视觉接受仍待。

**官方图标反馈（2026-09-26）：** 按维护者要求把空状态中间的文字 `pi` 徽标换成官方 Pi agent 图标；已核对 [Pi press kit](https://pi.dev/press-kit) 与其 [favicon](https://pi.dev/favicon.svg)，本仓库 `assets/pi.svg` 的 viewBox 和三个 path 完全一致。复用该本地 SVG，以候选局部 CSS mask 随主题前景色呈现，删除文字与徽标边框；不复制几何、不改原资产、不新增依赖或运行时外部请求。已删标题行、欢迎文案和调试工具栏均保持现状；PRD 双语同步确认。

**维护者确认与下一步（2026-09-26）：** 维护者回复“OK”，确认本次官方图标调整；不据此扩展为整个 WI-019、正式侧栏或 ADR／gate 验收。下一步建议沿既有批准顺序推进 UIP-02（基础 Markdown／代码复制与紧凑活动及按需详情），范围与验收沿用[已登记切片](docs/discussions/2026-09-22-webview-framework.zh.md#2-uip-02--阅读格式化回复并查看紧凑活动)，不新增前置通用重构。本次仅记录确认和接续建议，未启动 UIP-02 或更改当前切片；保留全部未提交实现；本次 docs:verify 与 diff 检查通过，0 error／0 stale，保留 5 项既有提示。未重新运行代码检查，不复用历史通过记录作为本轮结果。

**图标反馈验证：** 浏览器检查先因旧文字徽标失败，再通过；本机 Chrome 实际加载本地 SVG，深／浅／高对比、320／360／400px 含短视口共 5 组样本通过，截图复核官方形状，发送／Reset 后图标显隐正常，0 page error／0 failed request／0 外部请求。此次重新执行 compile、lint、331/331（0 skipped）、verify:webview、docs:verify、git diff --check；文档 0 error／0 stale 与 5 项既有提示，仍仅在进程内排除禁止读取的 `.local-env`，校验配置未改。生产 JS／CSS 与本次修改前哈希完全相同。纯装饰替换由浏览器证据和既有挂载回归验证，没有增加冻结内部标记的用例；未复验 F5／安装版／真实 pi。`dist/wi019-uip01-20260926/official-icon/` 保留本次 29 个既有脏文件快照、官方来源对照、失败／通过日志与截图，沿用父目录“唯一证据不再需要后清理”的条件；自有浏览器／Vite helper 已清理，未触及用户服务。HEAD／空 index、其他既有修改及 WI／ADR／gate 状态保持不变，无暂存／提交。

**输入焦点反馈（2026-09-26）：** 按维护者要求去掉输入框内部蓝色矩形；源码与浏览器确认其来自候选 `textarea:focus-visible` 的独立 outline。仅删除该覆盖规则，沿用 textarea 原有 `outline: none`；外层 composer 的圆角 `:focus-within` 边框及其他控件键盘焦点提示保留。PRD 双语同步选择，不开始 UIP-02，不改生产样式、输入／发送／Stop 语义或状态边界。

**焦点反馈验证：** 浏览器先复现内层描边，再通过鼠标／Tab 聚焦、深／浅／高对比及窄栏／短视口共 5 组样本；截图确认内层矩形消失、外层焦点仍可见，模型按钮焦点、键盘发送／Stop／新草稿保持正常，0 page error。初次绿阶段探针把 `outline-style: none` 时仍返回的计算宽度误要求为 0，已改为检查实际是否绘制的 style 并保留失败日志，未为探针改产品代码。此次 compile、lint、331/331（0 skipped）、verify:webview、docs:verify、diff 检查通过；文档 0 error／0 stale、5 项既有提示，仍只在进程内排除禁止读取的 `.local-env`，未改校验配置。生产 JS／CSS 与此次修改前哈希一致；纯样式反馈使用浏览器证据与既有挂载回归，无新增实现耦合用例，未复验 F5／安装版／真实 pi。`dist/wi019-uip01-20260926/focus-outline/` 保留 29 个既有脏文件快照及失败／通过日志、截图，沿用父目录“唯一证据不再需要后清理”的条件；自有浏览器／Vite helper 已清理，用户服务未触及。HEAD／空 index、其他既有修改及 WI／ADR／gate 状态不变，无暂存／提交。

**滑块反馈方案（2026-09-26）：** 维护者要求按推理强度由浅至深、最高档渐变，增加纵向高度并改善拖动。真实 Chrome 基线 40 次移动只有 4 个位置、单次跳 1/3 轨道；拖动中零 change 提交且未禁用。仅临时改 `step=any` 即出现 41 个连续位置，故本次修复有界跳格，不宣称解决全部设备帧率问题。参考 codebase-design，ModelPicker 继续拥有短暂选择与原生 change 监听清理，client／host 继续拥有已应用／待应用及合法档位；只增默认关闭的 `continuousThinkingDrag` 展示选项，由候选调用者启用，避免复制整个控件或改生产默认。松手取最近合法档、同档不重复提交，键盘保留逐档／首尾导航；候选局部样式采用 48px 操作区、22px 轨道、30px 滑块头与蓝色系明暗／最高档渐变，宽度不改。PRD 双语记录此确认，沿既有候选公开挂载与浏览器 Seam 做有界红→绿；无协议／权限／所有权／模块方向变化（Decision none），不推进 UIP-02。

**滑块反馈验证：** 本次基线 HEAD 为 `fbf6767066715d5b18bd3c85f2350fe86fff9a7b`，index 为空；保存 29 个既有脏文件，另从未改动 HEAD 保存当时干净的 ModelPicker。两项挂载回归逐个红→绿，覆盖连续预览／最近合法档提交／同档不重应用，以及键盘逐档／首尾／流中 pending／stopping 禁用；首轮修复漏掉同档原生值归位，被用例识别后修正，失败日志保留。候选浏览器先在旧 32px 高度失败，最终深／浅／高对比、320／360／400px 含短视口共 5 组通过：宽度不变、48px 操作区、实绘颜色随强度加深、最高档蓝紫渐变；连续拖动 41 个位置、单步最大约 2.45% 轨道、零中途 change／禁用，真实松手归位与同档不重应用、Escape 焦点恢复通过。采样间隔不作为通用 FPS／全部设备顺滑度结论。

此次实际重跑 compile、lint、全量 **333/333（0 skipped）**、verify:webview、docs:verify 和 diff 检查；文档 0 error／0 stale、5 项既有提示，仅在检查进程内排除禁止读取的 `.local-env`，未改校验配置。72 个源码的 77 条运行时依赖无环／入口绕过／Webview 特权值导入；独立 `main.tsx` 生产入口与包内模块复核通过，不含候选 CSS、preview／host／adapter／Node／pi SDK。生产 CSS 与本次基线字节相同；**共享 ModelPicker 的 opt-in 分支使生产 JS 字节改变**，不宣称 JS 无变化。当前与精确哈希复原的基线包均保持默认 step=1、32px、固定蓝色与原生键盘档位；但正式页面浏览器布局中原有弹层裁剪阻断鼠标命中，基线与当前同样复现，首次失败日志保留，不能报告正式页面鼠标通过，本轮不扩大到修该既有布局问题。未做 F5／已安装 VSIX／真实 pi、触屏或人工手感验收。

本轮按修复前快照到当前工作区复核 8 个路径（含原未跟踪文件），22 个未涉及的既有脏文件逐字节保留；未改构建／检查配置或模块边界。`dist/wi019-uip01-20260926/thinking-slider/` 保留快照、红绿及检查日志、依赖／包清单、基线重建资产和截图，唯一证据不再需要后清理；未创建 worktree／仓库副本，自有浏览器及 Vite／helpers 已清理，未触及用户预览服务。HEAD／空 index、WI-019／UIP-01 与验收、ADR、gate 状态不变，未暂存／提交，等待维护者视觉与手感确认。

**实施与接口：** 候选 Module 使用独立浏览器挂载和局部 CSS，通过 Webview 公共入口复用真实 client／可用性推导、既有 ModelPicker Interface 与合成 PreviewBridge；生产 App、mount、样式不改。候选控制器拥有 React root／client／bridge 释放，重置先清理旧实例。挂载候选→真实 client→模拟桥是行为 Seam；发送／流式／Stop 保留较新草稿，区分已应用／待应用设置，提供加载、无模型、工作区阻断与运行时错误的模拟恢复。UIP-02～07 尚未实现，相应夹具选项明确禁用。架构 1–5／8–12 沿用既有所有权与命名意图（implement now／none），无协议、跨层策略或持久化变更。

**回归与修复：** 新增 10 项候选挂载用例。首次回归发现既有模拟桥未追加刚发送的用户消息，修复后覆盖单次提交、纯文本安全、多轮消息、模型／思考设置、Stop 后应用待定设置、阻断恢复与重置／卸载清理；没有改真实 host。首张 320px 截图发现预览工具栏按外窗宽度排版而溢出，已改为受侧栏约束并重新验证；失败日志和修正前截图保留。

**本轮实际检查：** Windows Node 24.12.0；最终 `npm run compile`、`npm run lint`、`npm test` **331/331（0 skipped）**、`npm run verify:webview` 通过。72 个非测试 TS/TSX 文件、77 条运行时边无环、公共入口绕行、Webview 特权导入或展示模块向父模块的值依赖。Vite 元数据排除候选／host／adapter／Node 输入；生产 JS 与 CSS 均和本轮开始时含既有修改的工作区逐字节相同，且匹配最终编译磁盘产物。独立 adapter／gate／session-worker 构建入口与配置未改，compile 重新产出；不借用历史独立产物字节比较作为本轮证据。`git diff --check` 通过。

**实际浏览器：** 本机 Chrome 153.0.8010.54、独立无凭证 headless context、localhost 模拟服务；外窗 840px，侧栏 280／320／360／400／600px × 高 800px 的深色样本，加 360px 浅色／高对比与 320px × 高 500px，共 8 组无水平溢出且输入／操作可达。实际操作 Shift+Enter／Enter、流式／Stop、较新草稿、多轮发送、Reset、待应用设置／Escape 焦点及 6 类模拟恢复均通过，page error 为 0；截图与 JSON 留档。`npm run preview:webview` 可供维护者继续视觉审阅；本轮自有浏览器、Vite 与其 helper 已关闭，没有保留运行服务。

**文档与边界：** 已同步 README、架构、PRD 追溯、预览讨论与归档索引双语；本轮重新运行 docs:verify／docs:health 的原入口，以进程级预加载仅排除禁止读取的 `.local-env`，未改校验配置。0 error／0 stale／0 review notice，保留 ACTIVE 长度提示及两份 Draft ADR 的四项索引／状态提示，共 5 项既有提示。未运行真实 pi／模型、F5 或安装版验证，模拟不证明原生对话框、真实执行或持久化；维护者视觉接受仍待，ADR、gate 及其他待验收项保持不变。WI-020 历史 Standards／Spec 零发现已随维护者接受归档，本轮 UIP-01 未另做独立双轴子代理审查。

**基线与保留：** HEAD `fbf6767066715d5b18bd3c85f2350fe86fff9a7b` 与空 index 保持不变；8 个既有未提交文件已快照，7 个 WI-020 源码／测试文件逐字节保持原状，ACTIVE 原记录迁入归档。`dist/wi019-uip01-20260926/` 保留本轮基线、失败／通过日志、图／产物证据与浏览器截图，维护者不再需要其中唯一记录后可清理；没有 worktree 或额外临时仓库。未读取 `.local-env`，不暂存／提交。

**档位刻度反馈方案（2026-09-26）：** 维护者提供参考图，要求能看见每个档位。本次只在候选滑条轨道内补充固定圆点，已填充与未填充部分均可辨，当前位置由滑块头表示；数量与位置以当前模型的合法档位为准，不复制图中的固定六档。沿用现有连续拖动、松手吸附、配色／最高档渐变及尺寸，不改提交／pending／键盘语义。ModelPicker 仅从现有档位生成候选 opt-in 的装饰样式，候选 CSS 负责绘制，不增加接口、DOM 交互层或依赖（Decision none）。沿已确认的候选浏览器公开外观／操作 seam 做刻度可见性红→绿，既有挂载回归验证行为；不为装饰冻结内部 CSS 字符串。保留本次开始的 30 个未提交／未跟踪文件与空 index，不暂存／提交、不推进 UIP-02。

**档位刻度验证（2026-09-27，本机 Asia/Shanghai）：** 浏览器像素检查先因轨道无点失败，再在深／浅／高对比、320／360／400px 含短视口共 5 组通过；每档轮流选中，逐点核对其余合法位置与邻近轨道的实绘差异，覆盖已填充／未填充及最高档渐变，当前档由原生滑块头表示。真实鼠标连续拖动仍有 41 个位置、零中途 change／禁用；点击刻度位置、逐档／首尾键盘、草稿保持与 Escape 焦点返回通过，0 page error／0 外部请求。没有新增透明点击层、业务交互或固定内部 CSS 字符串的测试。

本次实际 compile、lint、verify:webview、运行时依赖图／入口／特权隔离与生产包检查通过；生产 CSS 与本次基线完全相同，共享 opt-in 装饰使 JS 字节改变。首次沙箱全量为 332/333，文档 CLI 子进程未返回 JSON；文档命令进一步确认沙箱拒绝扫描既有 `dist/goal-evidence-20260923/dev-profile/agent-host/local-endpoint`。经维护者工具授权后，定向文档测试 7/7、全量 **333/333（0 skipped）**、docs:verify 通过；文档 0 error／0 stale、5 项既有提示。授权重跑为父子 Node 进程使用静默预加载，仅排除禁止读取的 `.local-env`，结束恢复 `NODE_OPTIONS`，未修改测试或检查配置，也未扩大忽略目录。初次失败日志保留，不冒充一次全绿。

本次 HEAD 仍为 `fbf6767066715d5b18bd3c85f2350fe86fff9a7b`，index 为空；复核基线至工作区仅 5 个路径新增本轮修改，其他 25 个既有脏文件逐字节保留。`dist/wi019-uip01-20260926/thinking-ticks/` 保存 30 个基线快照、红绿／授权重跑日志、截图与包／依赖证据，唯一证据不再需要后清理；目录沿用 9 月 26 日任务起点。自有临时 Vite／浏览器及 helpers 已退出，用户预览服务未触及，无新 worktree／仓库副本。未复验 Firefox、触屏、F5／安装版或真实 pi；原正式页面弹层裁剪限制未在本轮扩大处理。仍为 WI-019／UIP-01，验收／ADR／gate 状态不变，不暂存／提交，等待维护者确认刻度外观。


**Popover 动效方案（2026-09-27，本机 Asia/Shanghai）：** 维护者要求模型设置弹出／关闭更顺滑；当前仍只做 WI-019／UIP-01 候选。已保存 HEAD `fbf6767066715d5b18bd3c85f2350fe86fff9a7b`、空 index、30 个既有脏文件与本轮关注点。最小浏览器循环两次复现开／关均 0 个中间帧，关闭直接 display:none；按隐藏截断、缺少过渡、主线程掉帧三项排序核对，不把缺动画误说成已证实性能瓶颈。参考 codebase-design，ModelPicker 仍拥有开关／展开与焦点，只增加默认关闭的 `animatePopover` 展示选项由候选启用，正式默认保持原样；候选局部 CSS 先采用 160ms 淡入／100ms 淡出与 6px 位移，不动画高度、不加依赖／计时器／通用动效框架。关闭立即 inert／移出可访问树，减少动态效果时取消过渡；展开子列表的关闭内容稳定与重开复位做独立红→绿。沿既有候选浏览器公开行为 seam 验证，不冻结无关实现；依赖方向、client／host 权威和协议不变（Decision none）。PRD 双语已同步此限定反馈；不推进 UIP-02，不暂存／提交。

**Popover 动效验证：** 两项浏览器用例按顺序红→绿：基础开／关由 0 个中间帧变为实际淡入淡出；展开模型列表后关闭的面板高度最初从约 262px 瞬间缩到 174px，现关闭期间保持内容稳定，下一次打开再折叠，仅 opt-in 路径改变。三种主题／五组窄宽与短视口，分别以正常／减少动态效果两种偏好复验（10 组）：输入区位置不动、正常模式开关有中间帧，减少动态效果无淡入淡出／位移，均能正确到达末态。真实焦点拒绝进入关闭中控件、指针命中在面板外、关闭即不再暴露为打开的 dialog，Escape 焦点返回、快速开→关→开反转、选择模型后的稳定淡出／重开复位、草稿保持与淡出中 Reset 通过；0 page error。没有生产计时器或临时调试日志，未将帧采样当作通用 FPS／全部设备手感结论。

此次实际 compile、lint、全量 **333/333（0 skipped）**、verify:webview、依赖图与生产包隔离、docs:verify、diff 检查通过。原有正式 ModelPicker 挂载回归仍验证关闭时立即隐藏／复位；候选 CSS 不进入生产包，生产 CSS 与本次基线字节一致，共享 opt-in 代码／inert 语义使 JS 字节改变。72 个源码／77 条运行时边无环、入口绕过或 Webview 特权值依赖，独立 `main.tsx` 入口保留。文档 0 error／0 stale、5 项既有提示；父子 Node 测试与文档检查仅在进程内排除禁止读取的 `.local-env`，`NODE_OPTIONS` 结束恢复，未改检查配置。未复验 Firefox／最低宿主版本／触屏／读屏软件、F5／安装版或真实 pi；原正式页面弹层裁剪不在本轮范围。

本轮复核从 30 个修复前工作区快照到当前工作区（含原未跟踪候选文件），仅 7 个路径有本轮新增修改，其他 23 个既有脏文件逐字节保留；HEAD／空 index 不变。`dist/wi019-uip01-20260927/popover-motion/` 保留快照、红绿与矩阵帧序列、截图、检查／包清单和清理记录，唯一证据不再需要后清理。自有临时浏览器、Vite 及 helpers 全部退出，用户预览服务未触及；无新 worktree／仓库副本、暂存或提交。WI-019／UIP-01 与验收、ADR、gate 状态不变，等待维护者确认动效手感。

**反馈确认与接续建议（2026-09-27）：** 维护者回复“ok”确认本次 Popover 动效；仅限该反馈，不扩为 UIP-01／WI-019 整体验收。下一步建议沿已批准预览顺序做 [UIP-02：格式化回复与紧凑活动](docs/discussions/2026-09-22-webview-framework.zh.md#2-uip-02--阅读格式化回复并查看紧凑活动)：流式基础 Markdown／代码复制、每条助手消息的一行活动摘要及按需工具／思考详情；包含安全渲染、复制失败反馈和阅读状态保持，不含表格／语法高亮或正式侧栏接入。本轮只答复并更新现有交接，未启动 UIP-02，当前切片与 WI／验收／ADR／gate 状态不变；保留既有修改，不暂存／提交。

**本轮记录检查：** 文档检查实际通过（0 error／0 stale、5 项既有提示），diff 检查通过；除 ACTIVE 新增交接外，29 个既有脏文件逐字节保留，HEAD／空 index 不变。仅改交接，未重跑代码／浏览器／真实宿主检查。`dist/wi019-uip01-20260927/next-step/` 留存记录前基线与本轮检查，唯一证据不再需要后清理；文档扫描只在进程内排除禁止读取的 `.local-env`，未改校验配置。

### WI-019 模块内聚性与前端文件整理（2026-09-23）

**后续提交检查点：** 维护者随后明确要求 Git commit，授权将当前工作区的前端整理、模块重构及配套记录按关注点提交。已创建 `66fbe8f`（宿主／适配层职责）、`cc3d80c`（审批测试可控时钟）、`1868f88`（前端职责整理）、`63e89aa`（架构／预览说明）、`bea3812`（预览需求追溯）；本 ACTIVE 记录独立提交。各提交均审阅完整暂存差异并通过 commit:check；前端提交前仅移除新文件尾部多余空行。沿用刚完成且代码语义未变化的 311/311、compile／lint 与产物检查结果，本次不重复声称重新运行。下文“未提交”指实施交接时状态，已由本次明确授权取代；无推送或合并。审阅补丁和检查输出保留在既有 `dist/module-refactor/`，确认无需保留证据后可删除。

本轮按追加授权提取 ModelSettings，Provider 从 925 行到 787 行，模型状态及晚回包失效由单一模块持有；提取 SavedHistoryClient 和展示类型／可用性推导，webview-client 从 370 行到 255 行；审批 envelope 解析移至纯宿主契约，运行时错误格式化及其测试移至 adapter。同步双语架构说明，既有工作区改动保留。Windows Node 24.12.0 compile／lint、全量 311/311（0 skipped）、verify:webview、静态依赖检查及 git diff --check 通过。首轮 WSL compile 因缺 Linux Rollup 可选依赖失败，改用与现有依赖匹配的 Windows Node；首次全量测试挂在既有审批测试，核对并结束本轮自有进程树，修正可控时钟与提前完成断言后全量通过。docs:verify：结构 0 error／4 个既有 Draft ADR 提示；i18n 0 stale，但本轮未修改的 `.agents/skills/setup-ts-deep-modules/SKILL.md` 示例相对链接 `./src/packages/README.md` 失效，故整体文档检查未通过。不改动该独立本地技能。未运行新一轮浏览器视觉／F5／安装版／真实模型检查，不关闭 WI／ADR／gate，无 Git 提交。日志与静态检查脚本保留于 `dist/module-refactor/`，供复核本轮验证；无运行进程依赖，确认无需保留证据后可删除。


按维护者明确请求，将 UI 交互预览登记为唯一当前 WI，首片 UIP-01；沿用明确预览授权，未重复访谈。WI-017 转入待验收入口，证据与限制仍指向已有双语归档；不记为关闭。同步 PRD 工作追溯及前端讨论中的当前入口，保留后端余项暂停。登记时仅修改文档；随后维护者明确批准前端文件整理：重命名 client／消息解析模块、分离场景数据与模拟 bridge、迁移预览首页、按职责拆分 CSS 并同步测试／文档。此整理属于 WI-019 内的技术维护，保持现有产品行为；UIP-01 候选视觉界面尚未实现。本轮 Windows Node compile／lint、重跑全量 308/308 测试（0 skipped）、verify:webview、预览 HTTP 模块加载、CSS 全量选择器属性／覆盖顺序对照及 docs:verify 通过。首次全量测试停在未修改的 tool-approval 测试子进程，已结束自有测试进程树，重跑通过；不推断挂起根因。预览检查 server.close 后 Node 进程仍驻留，已核对命令行并结束自有进程树；已有用户预览服务未关闭。日志／校验脚本保留在 `dist/webview-reorganization/`，检查证据无需保留后可删除。未进行浏览器视觉／F5／安装版复验，无 Git 提交。登记阶段 docs:verify／docs:health 与 git diff --check 通过：0 error，4 个既有 Draft ADR 提示；双语 0 error／0 stale，health 0 review notice。这些为登记阶段结果，后续整理验证见上文。

**提交基线与保留证据（2026-09-23）：**

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
| WI-020 | 跨模块公共入口与模块类型契约；唯一 P2 已修复，双轴零发现 | 2026-09-26 维护者技术验收；ADR／gate 不变 | [记录](docs/archive/2026-09-26-wi-020-public-entries.zh.md) |
