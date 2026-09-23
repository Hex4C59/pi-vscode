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

**2026-09-23 维护者要求暂时停止实施、仅收尾记录；本轮结束后不自动启动下一 WI。** WI-017（REQ-008）代码／可执行验证完成，当前停在交接／待维护者验收，未正式关闭；没有正在 Build 的新 WI。WI-018 仅做了公开事件契约的只读调查，尚未登记或实现。2026-09-23 维护者另已批准 UI 交互预览制作，随后依次要求 to-spec 本地 Draft 和 to-tickets 候选拆分；该独立文档会话仅完成计划，预览尚未启动，实际编码前记录串行 WI 交接，不并行推进，也不重复申请已经获得的预览授权。WI-015 前端迁移、WI-014 附件及 WI-016 脏保护／修改审阅的代码与可执行验证完成，维护者体验／ADR／gate 接受仍待确认，不记为正式关闭；这些人工接受不阻塞下一明确需求。恢复实施时再核对当前范围，按依赖串行接续，不并行开新 WI；本次暂停不撤销既有明确授权，也不代表 Goal 已达成。

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

当前仅保留 WI-017 交接／待验收入口；按维护者要求暂停实施，没有正在 Build 的新 WI。

| 字段 | 内容 |
|------|------|
| **ID** | WI-017 |
| **标题** | 当前项目 pi 会话连续性与安全顺序交接 |
| **阶段** | 代码／可执行验证完成，交接／待维护者体验接受；2026-09-23 按维护者要求暂停实施，仅完成文档收尾，不启动新 Build。 |
| **Gate ID** | gate-webview-trust／gate-session-streaming／gate-project-trust 保持 Open；本 WI 不自动接受 gate |
| **Decision** | 沿用 subprocess agent runtime、公开 SDK/RPC 会话 API 和 pi 自有持久化；不解析／重写 session 文件，不加载历史扩展；新 consequential 决策另行提出 |
| **PRD 判定** | 用户可见：[REQ-008](docs/product-requirements.zh.md#req-008--会话连续性)，关联 REQ-004／005／006 的历史展示、Stop 与 fresh-grant 策略 |
| **批准状态** | 维护者 2026-09-22 UTC 的长期 Goal 已整体批准明确 REQ-001～009 及依赖实现。本次在 WI-016 代码／可执行验证完成后登记接续；不重新申请常规 Build，不接受整份 Draft PRD／ADR／gate。 |

### 目标与范围

- **T017-01：** 新建会话与当前项目保存会话列表，通过 pi 公开 API 持久化／枚举，包括终端 pi 产生的会话；只显示可验证的项目身份，不以 runtime generation 冒充保存会话。公开 API 的最小隔离探针只是技术证据，不作为功能完成。
- **T017-02：** 用户明确选择且确认原入口已退出后顺序恢复；Stop 当前工作并等 settlement，替换时失效旧输出／审批／grant、review 与内存附件状态，按当前资源／受控策略启动。确认不等于独占锁，不加载／安装历史扩展，失败不悄悄改项目或重试任务。
- **T017-03：** 从公开返回值恢复对话，长历史先近期窗口并可向前渐进加载；工具身份／状态／文本与支持的数据做安全有界展示，遗漏／不支持明确说明。历史附件以可用的原始历史文本展示，信息不足标不可用，绝不把当前文件重读冒充旧快照。UI 窗口不改 pi 模型上下文。

### 方案与架构核对

已读取声明 pi 0.86.1 的公开 RPC／SDK 文档：RPC 有 new_session、switch_session、get_messages／get_entries；SDK 有 SessionManager.list 与公开持久化 API。本次在完全自有配置中已实测 SessionManager.create/list/open、同项目／异项目分离和 AbortSignal，以及 CLI --session、RPC new_session／switch_session／get_messages／get_entries since；原生 Windows Node 24.12.0、pi 0.86.1，未调用模型，两个进程均实际退出。证据在 `dist/goal-evidence-20260923/wi017-t01/`；这是 SDK 合成历史／公开 RPC 技术证据，不是终端 UI、产品会话功能或原生宿主接受。现已按公开活动分支实现 32 行／页和 8192 UTF-16 字符／预览块，契约见 [Webview 消息](docs/reference/webview-messages.zh.md)。SDK／CLI、浏览器、开发宿主、实际 F5 与普通安装版已有分层实证；helper 交错、准备中切换／视图取消等审查发现已修复并复审，最终安装包已验证。详见[交付证据](docs/archive/2026-09-23-goal-session-handoff.zh.md)，不把合成模型或自动化验证当作维护者接受。生产 adapter 继续隔离 runtime；不从本地 sibling 构建，不私读 session 文件，不因技术探针接受架构结论。

Host 继续拥有当前项目、命名意图、交接确认与生命周期；Webview 仅接收有界安全投影和 host 不透明 ID。隐藏路径／公共 API 返回路径只在 host/adapter 之间作为 opaque 参数使用，不给 UI 任意打开／切换能力。依赖的完整流、Stop、草稿确认、延后模型、附件和审批回归必须保留。

### 验收与测试接缝

| 接缝 | 可观察验收 |
|------|------------|
| 公开 pi／存储 | 独立终端／RPC 创建的当前项目保存会话可列举和恢复；新建独立；非当前项目、缺失／损坏／不可恢复明确失败；无私读写 session 格式 |
| host／生命周期 | 活跃任务先 Stop／settled；确认顺序交接；迟到输出、审批、设置及临时快照不跨会话；grant 清空、当前受控策略保持、失败可恢复 |
| 历史／UI | 真实旧对话可见、近期窗口／向前加载、安全工具后备显示、历史附件不混入当前源；取消选择／视图重建不重复任务 |
| 生产／实机 | compile／lint／测试及双轴审查；隔离 genuine pi＋合成 provider、浏览器、实际 F5／安装版分别记录；当前资源／VSIX 一致性与进程清理 |

### 范围外与批准边界

不做全局跨项目发现、并发会话、实时接管／独占锁保证、分支 UI、历史代码回滚、额外附件持久化或自有 session 格式。不自动安装／加载缺失扩展，不绕过资源同意或受控审批。REQ-009 的加载目标选择等真实待决项不在此猜测。

## 当前焦点与未决项

- [x] WI-016 T016-01：代码／可执行验证完成，最终回归 210/210；实际 F5 与普通安装版分别通过 dirty／等待／grant／edit／恢复／Stop 矩阵。Standards 修复两轮测试时序／挂起发现后 0 未解决；Spec 0。没有替代维护者体验接受，WI-016 尚未关闭。
- [x] WI-016 T016-02：代码／可执行验证完成，229/229、双轴无未解决发现；浏览器／真实 F5／安装版各自记录，当前包与源码一致。维护者体验接受单独保留；[历史交接](docs/archive/2026-09-22-goal-change-review-handoff.zh.md)。
- [x] WI-017：T017-01～03 代码／可执行验证完成；compile／lint、308/308（0 skipped），Standards／Spec 复审均无未解决项；实际 F5／普通安装版、最终 VSIX 内容与清理分列记录。仍待维护者体验接受，未正式关闭；[完整交接](docs/archive/2026-09-23-goal-session-handoff.zh.md)。
- [ ] 暂停后的接续候选：REQ-004 retry／compaction／completed／stopped 与可靠终态，其后核对 REQ-001／002／005 余下故障矩阵；WI-018 未启动。只读核对声明 @earendil-works/pi-coding-agent 0.86.1：prompt ACK／agent_end／compaction_end 均不等于终态，agent_settled 才表示自动续行已结束；Stop 先 clear_queue 再 abort。源为安装包 docs/rpc.md 与公开类型，尚无该新切片代码或运行验证。
- [x] WI-014 T014-01～05：明确 REQ-003 代码／可执行验证完成，T05 检查点 197/197、本轮总回归 229/229；浏览器、真实 pi 合成链路、实际 F5、普通安装版与包一致性分列。维护者仍需确认窄栏／键盘、逐项确认、长历史预览与容量恢复体验；不自动正式关闭。
- [ ] WI-015 人工体验确认及 ADR 0003 接受仍待；不因前端重构永久暂停后续需求。
- [ ] WI-008／009：已确认 2026-09-21 的基础／空闲及延后设置主路径；故障／审批／Stop 完整矩阵未整体接受，不重复要求已确认路径。
- [ ] WI-010 pending-adr／完整边界矩阵及三个 Open gate 保留；有限切片关闭不代表安全沙箱、回滚或全后代取消保证。
- [ ] WI-013 依赖前置后恢复；加载目标选择／验证及交互队列预算仍有真实待定选择，见[保留调查](docs/discussions/2026-09-22-pi-compatibility.zh.md#wi-013-暂缓提案保留2026-09-22)。到需要时提出最少量具体问题，不重访已确认设计。
- 当前禁止读取 `.local-env`；历史配置授权不覆盖本 Goal 禁令。F5 存在 code134 间歇启动失败，已有成功隔离验证与失败日志并列；不把 sourceMaps／trace 开关声称为已证明根因修复。

### UI 交互预览授权与限定提案

| 字段 | 内容 |
|------|------|
| **当前动作** | 2026-09-23 to-tickets 本地候选拆分；to-spec Draft 已完成。本轮不执行预览代码工作，不新增并行实施 WI。 |
| **批准记录** | Q1–Q16 后维护者对“理解一致，开始制作交互预览”明确回复“确认”（中断后重申），共同理解确认已完成，预览制作授权持续有效；随后调用 to-spec 和 to-tickets，要求先交付本地方案与候选拆分。 |
| **目标／范围** | 可操作的窄栏候选预览，演示会话、输入／附件、活动／Stop、审批、修改审阅、基础 Markdown；精确行为归 [PRD 视觉方向](docs/product-requirements.zh.md#视觉重设计方向2026-09-23)。 |
| **PRD 判定** | 用户可见设计，关联 REQ-001～008 既有工作流；当前交付仅文档，预览不实现未完成的后端需求。 |
| **方案／风险** | 沿用 React／CSS／client／bridge 边界；候选仅接预览入口，生产根与样式保持隔离。当前共用 App，须验证没有提前影响正式侧栏。技术细节及证据见[限定 Draft](docs/discussions/2026-09-22-webview-framework.zh.md#交互预览限定-draft)。 |
| **可观察验收** | 五项故事可操作，覆盖空白／对话／执行／审批／附件变更／错误；挂载行为检查＋真实浏览器宽度／主题／键盘检查＋生产排除检查。布局经维护者视觉确认后才能正式接入，F5／安装版证据单独验证。 |
| **Decision／Gate** | 预览建议决策类 none，Direction；不改变 host 权威或接受 ADR 0003／既有 Open gates。Markdown／链接／复制安全实现与挂载接缝在 Build 内核对。 |
| **排除项／接续** | 本轮不制作预览、改依赖、发布或提交；正式切换、后端扩展、Plan／并行会话不在预览授权内。恢复代码工作时先串行登记该切片，保留当前 WI 的待验收边界；WI-017 代码／验证完成不等于正式关闭。 |

## 停车场

UI 交互预览的[候选切片 UIP-01～07 与依赖图](docs/discussions/2026-09-22-webview-framework.zh.md#交互预览候选切片)已本地起草，粒度待审阅；这是已授权预览的计划记录，不是第二个实施 WI，也不扩大为正式接入。

编辑区 panel／Chat Participant、全生态或额外平台扩展、无产品依据的 delta 优化、全局启动默认持久化及跳过工具审批仍不自动纳入。REQ-007／008／009 明确需求不是停车场。

## 最近交接

2026-09-23 提交整理：按维护者明确请求，将既有工作区修改按文档校验修复、探针迁移、隔离探针、凭证目录忽略、CI、相互依赖的前后端功能、双语文档与本工作记录分别提交；没有开始新功能。提交前实跑 Windows Node compile／lint、308/308 测试（0 skipped）、verify:webview，及 docs:verify／docs:health 均通过；文档保留 4 个既有 Draft ADR 提示，双语 0 error／0 stale。提交检查发现并清理两个源码文件及一份历史归档末尾多余空行，不改变逻辑或文档含义；各批次执行 commit:check。日志和暂存补丁检查证据保留在 `dist/commit-preflight-20260923/`，确认提交及检查证据无需继续保留后可删除；未建临时工作树，未重跑 F5／安装版验收，未推送。历史验收状态和 UI 候选粒度待审阅均保留。

### WI-017 可执行交付与暂停记录（2026-09-23）

- **实际交付：** REQ-008 原生保存／列表／新建／顺序恢复与有界长历史；本轮实现阶段 compile／lint 通过、308/308 测试且 0 skipped，双轴复审 0 未解决；F5／普通安装版覆盖草稿确认、长历史、视图替换、主动 Stop、runtime loss、grant 重置与待审批取消。证据／限制见[双语归档](docs/archive/2026-09-23-goal-session-handoff.zh.md)。本次收尾仅修改文档，不重跑或冒充新一轮代码验证。
- **安装检查点：** `dist/goal-evidence-20260923/wi017-t01/pi-vscode-wi017-final.vsix`，146,608,296 bytes／14,083 entries，SHA-256 `952535225a3b470fb5576823c6ff93169353aa2a9f62302fc9650e124ea241e2`；打包时本地／归档／安装可执行哈希一致，无预览服务器依赖，未发布。后续文档编辑不改变该包证据。可在独立 VS Code profile 使用“Extensions: Install from VSIX...”选择此文件；验证环境不要连接用户凭证或付费模型。
- **人工验收：** 窄栏／键盘会话列表及长历史分块；Cancel 保留非空草稿、确认 New／Restore 清理临时状态；原入口退出说明；审批／grant 重置和失败恢复。WI-014／015／016 的体验接受与 ADR／gate 仍保留，不被本轮替代。
- **清理／保留：** 同目录 `cleanup-final.json` 及其引用记录确认自有开发／浏览器／F5／安装进程退出、六端口空闲；隔离 launcher、models／settings／server 与 result 夹具恢复，仓库 launch 未改。保留 Goal evidence／profiles／合成 sessions／VSIX 及 `dist/session-integration-adapter.cjs` 至接受／保留期结束且唯一证据保存；未建 worktree。只读事件调查子代理已关闭。
- **停止点：** 维护者明确要求暂时做到这里，仅收尾文档；没有开始 WI-018 实现。Goal 仍有必要代码／验证缺口，未达成，也不标记为阻塞或正式关闭。未读取 .local-env／凭证、使用付费模型、改相邻仓库或 Git index／commit。并行 UI 文档与脚本迁移修改保留；脚本迁移历史的两项 picker 失败已被整合后 308/308 覆盖，原日志仍保留。
- **文档检查：** 收尾 docs:verify／docs:health 通过（0 error，4 个既有 Draft ADR 提示；双语 0 error／0 stale），本轮文档限定 diff check 通过。全工作区 diff check 仍报 src/extension/piChatViewProvider.ts:926 的既有文件尾空行；本次仅文档收尾，保留源码原样，不声称全仓库差异检查通过。日志在 wi017-t01/{docs-closeout.log,docs-health-closeout.json,docs-diff-closeout.log,worktree-diff-closeout.log}。语义核对限 WI-017／ACTIVE／相关归档；未重跑代码构建或行为测试。

### UI 候选预览文档交接（独立授权，未启动 Build）

2026-09-23 UI to-tickets：在已完成的限定 Draft 上新增双语 UIP-01～07 候选纵向切片，各自包含行为闭环、验收、需求来源、直接依赖和排除项；预览制作授权保留在上方，粒度审阅仅确认计划。前六项分别交付可用聊天、格式化回复／活动、会话、附件、审批／授权和审阅，最后一项核对组合状态／视觉证据；依赖为 01 → 02～06 → 07，按 WIP=1 串行，不新建外部工单／分支、不改代码／索引／提交。检查：双语依赖一致，7 个节点／10 条直接依赖，无环或传递冗余；本次差异／空白检查通过。npm run docs:verify 的结构检查为 0 error、4 个既有 Draft ADR 提示；全库双语检查因本次未修改的新归档 docs/archive/2026-09-23-goal-session-handoff.zh.md 缺少四项翻译元数据而失败，未覆盖该处进行中的工作。随后本 Goal 文档收尾已补齐这四项元数据，最终全库检查结果见上方 WI-017 交接；此处保留原次检查事实。本轮仅文档，未运行代码构建／行为测试；正式侧栏接入仍等待预览视觉确认。

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
