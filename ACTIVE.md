# pi-vscode — 当前工作（跨会话入口）

本文件维护当前任务与交接。规则见 [AGENTS](AGENTS.zh.md)、[内核](AGENTS.kernel.zh.md)与[协作指南](docs/guides/agent-collaboration.zh.md)。

## Agent 会话契约（摘要）

| 步骤 | Agent |
|---|---|
| 开场 | 必要阅读、Git 基线、分配任务 ID／所有者／批准／Gate／PRD 与验收核对；编辑前建立任务专属 worktree。 |
| 提案 | 每任务单独 Prepare／批准／验收；最多 3 个任务执行，协调者登记槽位和文件归属。 |
| 建造 | 按批准实现并实际验证；证据绑定实际候选提交、基线与源码状态，模拟／runtime／F5／安装分别取证。 |
| 收尾 | 子任务交接由指定协调者汇总；记录验收身份、检查结果与未决项，按规则归档并清理自有资源。 |

## 任务登记（最多 3 个执行槽位）

维护者明确批准多 Agent 执行多个独立任务，替换原 WIP=1；[协作指南 §4](docs/guides/agent-collaboration.zh.md#4-有界并行最多-3-个任务)负责计数及准入。[本轮任务单／批准／交接](docs/discussions/2026-10-02-wi079-parallel-dispatch.zh.md)保留具体范围。协调者为「添加多 Agent 隔离规则」会话；其他 Agent 不改本文件或自行晋升停车场。

| 任务 ID | 阶段 | 槽位 | 执行者／所有者 | 分支／worktree | 范围／依赖 |
|---|---|---|---|---|---|
| OPS-PARALLEL | Done | - | 本会话协调者 | `codex/wi079-parallel-plan`／`../pi-vscode-worktrees/wi079-parallel-plan` | 并行政策／登记／入口及 docs 检查器已完成本地验证；维护者已授权提交／push／PR 合并；远端发布以 PR 正常合并记录为准，不改产品行为／内核／lockfile |
| AUDIT-PARALLEL | Done | - | Dirac（已结束） | `codex/parallel-collaboration`／`../pi-vscode-worktrees/parallel-collaboration` | 已报告检查器硬编码、PRD／gate 单 WI 陈述及入口歧义；只读，无编辑 |
| PREPARE-PARALLEL | Done | - | Curie（已结束） | `codex/parallel-task-audit`／`../pi-vscode-worktrees/parallel-task-audit` | 已完成独立候选／冲突矩阵；PR 基线审查可只读，整条回复复制仅 Prepare，不能沿并发批准启动产品 Build |
| WI-079 | Blocked | - | 本会话接管；旧会话已确认停止写入与自动晋升 | 后续实现 worktree 待分配 | 已批准 Build；原主 checkout 的红灯测试／交接仍未提交，须获授权发布基线或另定不依赖它的实现路径，不能复制未提交文件 |

空槽不自动授权新任务。旧连续队列指令不跨越新分配归属；2026-10-01 原批准／排除范围仍有效，历史 WIP=1 描述不再决定当前调度。每个新产品候选仍须独立 Prepare／范围批准；并发确认不等于批准全部停车场。

## 任务提案

### WI-079（接管；等待实现基线）

| 字段 | 内容 |
|---|---|
| **ID** | WI-079（PI-GAP-03：只读会话／上下文用量） |
| **阶段** | Build（2026-10-02 Prepare 核对完成；持续 goal 已授权既有 in-bound 独立切片；中英 PRD 行和 Outline 先同步再进入 Build，尚未实现／验收） |
| **Gate ID** | none（沿既有只读 public RPC、宿主投影与 v3 allowlist；不声明新 gate） |
| **Decision** | none（无新存储、信任、外部服务或 runtime 策略） |
| **PRD 判定** | 用户可见：已同步中英 PRD WI-079／REQ-004／009 范围及追溯行；只批准本切片，不接受整份 Draft，不升级 ADR 0010 |

#### 目标与范围

交付 PI-GAP-03 的只读 **用量**面板：当前上下文 token 估算／容量／百分比与整会话累计 input、output、cache-read、cache-write、total token 和上游报告估算 USD 费用分开显示；未知明确。公开 get_session_stats／必要时 get_state，不读 session 文件，不自算账单，不把累计误当当前。打开／手动刷新／ready 和任务稳定结束后的刷新，替换／New／Restore 不串会话，忙碌时标旧快照，不额外轮询。只做个人本机 macOS VS Code；排除 compact、导出、实时账单和持久化用量。

#### 方案与架构核对

安装 pi **0.86.1** 的公开 `docs/rpc.md` get_session_stats（554–595 行）明确 full-session tokens/cost（含 tools／compaction／branch summary）和当前 contextUsage；无模型时 contextUsage 缺失，压缩后 tokens／percent 可为 null。当前 adapter 在 checkpointRestart 用该公开统计，但未对产品用量投影。可复用现有 request owner／5s deadline，禁止新增 generic RPC bridge。

按优先级检视：PI-GAP-01 余量附件／slash 展开需要另定队列内容边界；PI-GAP-02 实际加载报告尚无本轮确认的公开 loaded-context API。两者继续停车，不以菜单交付冒充整个 ID。选择下一已定义只读候选 PI-GAP-03，不跳到需单独确认的 PI-GAP-08／09／13／17／19／25。

adapter 提供具名只读统计能力并验证 finite 非负数字和会话身份；宿主拥有一个 coalesced refresh、世代与快照；renderer 收 bounded nullable numeric DTO，绝不收路径／原响应。零费用但无可用非零定价明确 unknown，不证明免费。先通过[双语 Outline](docs/reference/webview-messages.zh.md#wi-079-只读用量outline未实现)核对字段／状态，再 test-first 实现。UI 本地打开／关闭，Refresh 仅 chat 无参数意图；沿一次一张弹出层，焦点不丢草稿。无新依赖／进程／持久化。

#### 架构核对（Prepare：implement now；Implementable，尚非 Verifiable）

| 维度 | 状态、证据与下一检查 |
|---|---|
| 1–5 分解／接口／依赖／契约／owner | pass（设计）：adapter public RPC，host projection owner，UI type-only。现行 checkpointRestart 的 get_session_stats 只作先例，不冒充新能力。新 Outline 先于实现，需成对 types／validators／消费者。 |
| 6 范围 | pass（批准）：中英 PRD WI-079，仅只读用量，无 compact／存储／价格计算。 |
| 7–11 身份／状态／并发／恢复／清理 | pass（设计）：one-flight、5s deadline、generation＋session token、替换清零而非旧累计；ready／loading／unavailable／no-session；失败显式重试。gap（实现证据）：迟到／替换／dispose 测试、真实退出、主机 New 不串数据。 |
| 12–14 安全／数据／隐私 | pass（设计）：只投影数字，sessionFile 和模型原元数据留宿主，无持久化；精确 chat allowlist。gap：异常原响应／额外 path 拒收、日志／Webview 检查。 |
| 15 性能／背压 | pass（设计）：O(1) numeric DTO、coalesce、bounded RPC、无轮询；busy 不无谓请求。 |
| 16–17 验证／构建 | gap：test-first composition、runtime／浏览器／F5／安装 VSIX 全待执行。现有 WI-078 结果不是此切片验收。 |
| 18 版本兼容 | pass（设计）：v3 host／bundled UI 成对，只 chat；旧 view 不接纳。未扩支持平台。 |
| 19 UX／可访问性 | gap：中英状态、未知／旧值、键盘／焦点／互斥、主题窄屏及 macOS 原生待验。 |

#### 失败方式（代码前）

累计冒充当前上下文；null 缺失变 0；零／未知定价显示免费；坏数字 NaN／负／无限／超界进入 UI；sessionFile／raw 响应／凭据跨边界；重复 Refresh 无限请求；busy／替换／迟到结果污染新会话；New／Restore 显示旧累计；错误显示成功；只发 RPC 不观察 cleanup；用量面板和模型／命令同时开；Escape／刷新丢未发草稿；实际 stats 被模拟替代却声称 runtime 通过。

#### 验收

1. 首先写行为端到端／跨 owner 用例并观察红，再实现，保留可重复 JSON 工件；host→adapter→validated client→mounted production panel，区分累计／当前、null、坏数字、零定价、无会话／错误／超时、busy／late replace／cleanup与非 chat 拒绝。
2. 真实 pi 0.86.1＋隔离 HOME／workspace／loopback provider 获取公开 stats；记录请求、数字、身份替换与 child close，不使用真实凭据、用户 sessions 或付费模型。
3. 浏览器 280／320／400、中英、暗／亮／高对比与 keyboard／close／focus／popup mutex；截图／报告。Preview 不冒充 host。
4. macOS 真 F5 和安装 VSIX，打开→实际 stats→Refresh→New 无旧累计，草稿不被 Refresh 清掉；逐层 report、截图及 cleanup，禁止替旧版行为验收。
5. compile／lint／npm test／docs:verify；关闭 docs:health、双语方案／验收归档，实现提交不含 ACTIVE，收尾 docs(active) 单独提交。未验明确，不自动 gate／ADR Accept。

#### 范围外与批准边界

2026-10-02 持续 goal 对既有 PI-GAP 内独立合规切片授权 Prepare→Build 和限定 Agent 验收。中英 PRD 已在本阶段前同步。高优先级冲突、产品扩张、重大架构／信任／隐私／存储／兼容、新服务／凭据／付费／公开发布和指定 GAP 仍须暂停询问。排除下载／市场、额外生态／平台、Chat Participant、remote／multi-root、跳审批。no push／amend／rebase／force，不改 sibling pi。

## 当前焦点与未决项

WI-078 菜单切片已关闭，方案与长验收见[双语归档](docs/archive/2026-10-02-wi-078-acceptance.zh.md)，不重开 WI-077／078。当前 WI-079 Build，下一步实现前读相关 owner／UI skill，先写 stats 闭环失败用例。PI-GAP-01 附件／slash、PI-GAP-02 实际加载报告仍停车；Draft ADR 0010 保持 Draft。REQ-008／中文 REQ-009 文档漂移不是新实现任务。

[PRD](docs/product-requirements.zh.md) REQ-009 macOS 已有矩阵见 [WI-070](docs/archive/2026-10-01-wi-070-acceptance.zh.md)；它不替代 WI-079 新切片分层验收。

## 停车场

本机插件清单切片 1–7、模型芯片、弹出层互斥、拒绝资源提示、规范模型身份、REQ-009 macOS 五类证据与 Webview 目录整理已关闭；下载／市场仍排除。见 [REQ-010](docs/product-requirements.zh.md)／[Draft ADR 0010](docs/decisions/0010-local-plugin-inventory.zh.md)。

### docs 目录检索与归属整理（本轮已关闭；保留原候选范围）

以下保留最初停车场记录；本轮独立授权与三项关闭记录见表后。2026-10-01 维护者要求把目录评估中的问题记录为后续任务。**仅授权记录；不改变当前 WI、既有队列顺序或 WIP=1，不沿用已有 `/goal` 批准自动启动本组 Build。** 晋升时按 Prepare→Build 确认具体范围。保留 architecture／decisions／guides／reference／discussions／archive 大分类。

| ID／优先级 | 问题与范围 | 完成标准 |
|---|---|---|
| DOC-NAV-01／优先 | archive 平铺记录多，方案、验收与旧交接混在一起，按 WI 检索成本高。优先整理 [归档索引](docs/archive/README.md)与[关闭 WI 索引](docs/archive/2026-09-29-closed-wi-index.md)的导航；不先批量移动文件。 | 可按 WI 找到已有方案、验收及相关历史记录；按记录类别找到非 WI 历史；缺失材料明确标注，不补造证据。保留历史状态、替代关系及当前权威文档入口，两个索引分工明确、不复制完整记录。 |
| DOC-NAV-02／其次 | discussions 同时容纳产品讨论、架构评估、技术调研与代码审计，索引区分不足。整理 [讨论索引](docs/discussions/README.md)，按主题／用途分组，允许交叉链接，不新增目录作为默认方案。 | 现有讨论均可从索引定位；分组可区分产品／UI、架构、调研及审计证据；保留“背景而非实现授权”的边界，不因记录已过期或篇幅长就归档，不隐藏未决问题。 |
| DOC-ORG-03／低，可不迁移 | docs 根目录的 [Git 提交约定](docs/git-commit-convention.md)与[双语文档指南](docs/bilingual-documentation.md)属于指南，与 guides 的归属略不一致。先评估移动收益及全部引用／校验配置影响，再提出保留或迁移方案。 | 记录保留或迁移的理由。若确认迁移，中英文成对移动，修复入站／相对链接、导航与必要校验配置，规则内容与权威性不变；若收益不足，明确保留并结束评估，不为一致性强制改路径。 |

**共同验收与边界：** 仅文档组织／检索，不改产品行为、批准状态、ADR 状态或历史事实，不删除历史，不为单份架构文档增设无必要层级。涉及双语索引或迁移时同步对应语言；完成后运行 `npm run docs:verify` 与 `npm run docs:health`，报告错误、警告与未验证项。Draft ADR 0010 的状态／索引警告不是本组目录缺陷，不以改成 Accepted 来消除。本次记录未执行上述整理。

DOC-NAV-01 已在本轮独立授权下按 WI-073 完成；见[验收](docs/archive/2026-10-01-wi-073-acceptance.zh.md)。

DOC-NAV-02 已在本轮独立授权下按 WI-074 完成；见[验收](docs/archive/2026-10-01-wi-074-acceptance.zh.md)。

DOC-ORG-03 已在本轮独立授权下按 WI-075 完成；见[验收](docs/archive/2026-10-01-wi-075-acceptance.zh.md)。

### pi 功能差距待办（按本轮持续授权逐项晋升）

**当前授权（2026-10-01）：** 新 /goal 允许按优先级自动选单个 ID，完成 Prepare、范围记录后 Build，不需维护者逐次点名。下列“仅记录／旧 goal 不覆盖”原文保留为历史，不作为当前启动限制；重大新增取舍、安全／数据审批、Accepted PRD 冲突仍保留单独确认。范围不明或外部条件阻塞时记录具体原因，再找其他可执行候选，不合并整组。

2026-10-01 维护者先后授权把两轮功能差距写入 ACTIVE，供后续实现。基线为当前锁定的 **pi 0.86.1**；证据与能力限定见[功能差距讨论](docs/discussions/2026-10-01-pi-feature-gaps.zh.md)。**仅授权记录，不启动 Build，不改变当前 WI、既有队列顺序或 WIP=1；已有 `/goal` 批准不自动覆盖这些新增候选。** 优先级仅为组内建议，晋升须重新核对版本、现有实现与公开 SDK／RPC，按 Prepare→Build 确认 PRD、范围、架构影响和验收。

| ID／建议优先级 | 差距与候选范围 | 完成标准／边界 |
|---|---|---|
| PI-GAP-01／优先 | 运行中追加指令：steering／follow-up、队列展示与取回。 | 两种发送语义可区分，按上游边界投递；取回、Stop、失败与恢复不丢失或重复发送。明确附件范围，不把 clear_queue 当作完整队列体验。**文字切片已由 [WI-077](docs/archive/2026-10-02-wi-077-acceptance.zh.md) 关闭；附件与 slash／模板展开仍停车。** |
| PI-GAP-02／优先 | 命令／资源发现：输入框 `/` 菜单，发现已加载扩展命令、skills、prompt templates 并补全。 | 展示实际可用资源及来源；空列表、失效与错误可解释，不把未加载资源显示为可执行，不承诺任意扩展兼容。 另补实际加载报告：区分已登记／可发现与实际加载，展示经公开 API／可靠证据确认的 AGENTS.md、skills、模板和扩展；不可确认项标未知，不读取敏感上下文全文到 Webview。**`/` 菜单切片已由 [WI-078](docs/archive/2026-10-02-wi-078-acceptance.zh.md) 关闭；实际加载报告仍停车，不标整个 ID 完成。** |
| PI-GAP-03／其次 | 上下文用量面板：上下文占用、token、缓存及费用。 | 来自公开 API 实际数据，区分累计值与当前上下文；未知费用明确标注，不伪造数据；刷新和会话切换不串数据。**只读面板已晋升 WI-079 Build，尚未交付。** |
| PI-GAP-04／其次 | 手动压缩：compact 入口及可选自定义压缩指令。 | 复用上游压缩；运行、完成、失败／取消可观察，与发送、Stop、切换规则明确；说明压缩有损，保留既有自动压缩与重试。 |
| PI-GAP-05／后续 | 图片输入：选择／粘贴／拖入图片并发送给支持的模型。 | 批准具体输入方式与格式／数量／大小边界；预览、移除、错误恢复；不支持图片的模型不静默降级，明确历史与敏感内容范围。 |
| PI-GAP-06／后续 | 文件发现与补全：`@` 模糊搜索与路径补全。 | 接入既有附件流程，保留工作区、敏感来源、大小及内容变化确认规则；无结果／失效可恢复，不绕过宿主读取边界。 |
| PI-GAP-07／后续 | 会话探索：tree、fork、clone、书签，分片批准。 | 公开会话 API；分支可辨识，切换前处理活动任务与重新授权，失败可恢复；会话分支不是代码回滚，不隐式恢复文件或承诺并发会话。 |
| PI-GAP-08／需单独产品／信任决策 | 完整资源管理：npm／git 包安装、更新、移除及扩展／skills／模板／主题过滤。 | 先确认是否调整下载／市场 non-goal；来源、作用域、信任、版本、执行风险与恢复明确；复用上游包管理，不把本机清单当完整包管理，不默认包含市场。 |
| PI-GAP-09／需兼容性评估 | 扩展 UI：标准交互之外的组件、渲染器及第三方快捷键，评估 Webview 等价范围。 | 支持／拒绝／替代矩阵与代表性证据；不支持明确反馈，不虚报成功；不以终端代码直接进入 Webview 绕过 RPC 限制，不承诺全生态对等。 |
| PI-GAP-10／较低 | 用户 shell：直接执行命令，选择输出是否进入模型上下文。 | 区分用户操作与 Agent bash；输出归属、审批、取消、错误、大小与切换规则可验证，不宣称沙箱。 |
| PI-GAP-11／较低 | 会话导出／导入／分享：HTML／JSONL、恢复和分享入口分别批准。 | 公开能力，格式／来源／恢复边界明确；提示敏感信息风险，分享显式确认目标与可见性，不默认上传；导入不静默跨项目恢复或加载历史扩展。 |

#### 补充差距（PI-GAP-12–23，待晋升）

第二轮证据见[补充比较](docs/discussions/2026-10-01-pi-feature-gaps.zh.md#补充比较2026-10-01)。缺少设置界面不等于上游 runtime 能力被禁用；晋升相关项时先核对外部配置的实际生效方式。

| ID／建议优先级 | 差距与候选范围 | 完成标准／边界 |
|---|---|---|
| PI-GAP-12／小型便利 | 会话重命名：编辑显示名，刷新当前标题与已保存列表。 | 使用公开 API；取消不改名，失败保留原值，成功刷新；不切换会话或修改历史。明确是否包括未打开的已保存会话。 |
| PI-GAP-13／需持久化决策 | 临时会话：显式关闭 pi 会话历史持久化。 | 确定启动、切换、退出与恢复边界，通过公开参数／API 实现；状态可辨识，不误列可恢复历史；不是无痕模式，不承诺无工具文件、日志、网络或供应商留存。 |
| PI-GAP-14／后续 | 常用模型集合与快捷轮换：轮换子集、上一个／下一个模型及思考级别。 | 保留已有选择器与默认值；仅轮换实际可用项，空集合明确提示；沿用忙碌时模型变更规则，失败不伪报切换；与 PI-GAP-22 协调。 |
| PI-GAP-15／需生命周期评估 | 资源／上下文重载：评估类似 `/reload` 的更新流程。 | 先核对公开 RPC／SDK 可行性，必要时提重启／替代方案；重新核对信任与身份，忙碌处理、实际生效内容及失败恢复明确；清单／供应商刷新不是 runtime 重载，不扩张加载权限。 成功后刷新 PI-GAP-02 实际加载报告，旧数据标失效；明确变更是否已生效，不把清单变更当作已加载。 |
| PI-GAP-16／按实际需要分片 | 高级 runtime 设置：重试、延迟／超时、传输偏好、自动压缩预算、thinking budget、缓存保温；系统提示词自定义作为单独批准的设置切片。 | 先查继承配置、作用域与写入所有者；有效值／默认值、持久化及生效时机可解释，非法值拒绝，失败可恢复；不重造底层逻辑，披露缓存保温额外请求／费用；与 PI-GAP-03／04 分工明确。 系统提示词先验证已有 SYSTEM.md／APPEND_SYSTEM.md 加载，不误称底层缺失；明确项目／全局、替换／追加、继承、信任及生效时机，失败保留原配置；不弱化宿主审批或工作区规则，与 PI-GAP-02／15 的生效报告协调。 |
| PI-GAP-17／需工具／信任决策 | 用户可选工具集合：初始工具子集、仅检查工作流与可用工具展示。 | 公开工具配置，实际启用集合、生效时机与恢复明确；不绕过审批，不把省略 write／edit 宣称严格只读或沙箱，说明 shell／Trusted 扩展写入能力。 |
| PI-GAP-18／后续 | 丰富自定义模型配置：多模型、API 类型、上下文／输出上限、能力／兼容元数据及 headers。 | 分片批准字段；公开格式，保留已有模型与未知配置，字段验证和失败恢复；credentials／敏感 headers 不进入 Webview；不误称外部 models.json 支持缺失。 |
| PI-GAP-19／需本地模型范围决策 | llama.cpp router 模型下载、加载、卸载及状态展示。 | 先确认公开控制方式与本机范围；来源、空间／网络、取消及恢复明确，加载状态可核对；卸载活动模型先处理任务；不默认安装／启动服务，登录端点不是模型管理。 |
| PI-GAP-20／小型便利 | 整条 assistant 回复一键复制。 | 保留代码块复制；明确原始文本或展示文本，反馈成功／失败；空回复、流式中与历史范围明确，不复制隐藏／被拒绝的敏感内容。 |
| PI-GAP-21／较低 | Mermaid 渲染，保留源码与复制。 | 安全 Webview 渲染，不执行消息脚本或隐式外部请求；流式未完成、语法错误、过大图表有界回退源码；验证主题、窄侧栏与可访问性。 |
| PI-GAP-22／较低 | 插件快捷键与帮助表：模型／思考选择、Stop、工具／思考展开等，分片确定。 | 适配 VS Code 命令与上下文，避免冲突和 IME 误触；帮助对应真实注册操作，忙碌／弹窗规则明确；与 PI-GAP-09 第三方快捷键分开，不照搬终端。 |
| PI-GAP-23／较低 | 长草稿转原生编辑器：打开 VS Code 编辑器，编辑后显式带回。 | 确定缓冲区及保存方式；用户显式操作，不自动发送；取消、关闭、并行编辑与版本冲突不静默覆盖；附件归属与临时内容清理明确，不任意执行外部编辑器命令。 |

#### 会话管理与维护补充（PI-GAP-24–27，待晋升）

2026-10-01 维护者授权记录第三轮差距。仍仅记录、不启动 Build；证据见[最后一轮命令核对](docs/discussions/2026-10-01-pi-feature-gaps.zh.md#最后一轮命令核对2026-10-01)。实际加载报告合并到 PI-GAP-02／15，不重复编号。

| ID／建议优先级 | 差距与候选范围 | 完成标准／边界 |
|---|---|---|
| PI-GAP-24／后续优先 | 当前项目已保存会话搜索、仅命名会话筛选与可选排序。 | 搜索作用于批准范围内的完整目录，而非默认为当前页；筛选／排序／分页一致，无结果、失效与错误可恢复；保留原有恢复确认与顺序交接，不自动恢复或扩展为全局跨项目发现。 |
| PI-GAP-25／需会话 API／删除决策 | 确认删除已保存会话。 | 先核对公开 API 可行性；若不可行，记录阻碍并提出合规方案，不直接操作 session 文件。明确活动会话处理、确认、删除后列表刷新、失败及是否可撤销；不误删其他项目或依赖历史中的文件，不把删除会话说成代码回滚。 |
| PI-GAP-26／维护性，后续 | 插件诊断报告：审查后导出诊断包，上传作为另行批准的可选切片。 | 区分插件／pi runtime 问题，记录实际版本与有界诊断；默认不附完整会话／源码／凭据，用户可审查和取消；包含会话或上传须显式同意内容、目标与可见性，失败可恢复，不自动向上游发送。 |
| PI-GAP-27／较低 | 产品内版本信息与更新日志：插件版本、内置 pi 版本及对应变更说明。 | 展示实际包版本，区分插件与上游变更；缺失／不可用明确提示，不伪称最新版；不为打开页面隐式联网，不自动下载、安装或升级。 |

#### 输入历史与系统提示词补充（待晋升）

2026-10-01 维护者授权记录第四轮发现，仍仅记录，不启动实现或改变既有队列。证据见[启动选项与编辑器补充](docs/discussions/2026-10-01-pi-feature-gaps.zh.md#启动选项与编辑器补充2026-10-01)。系统提示词管理并入 PI-GAP-16，不重复编号；输入召回新增 PI-GAP-28，与 PI-GAP-22 的快捷键协调。

| ID／建议优先级 | 差距与候选范围 | 完成标准／边界 |
|---|---|---|
| PI-GAP-28／小型便利，后续 | 已发送输入历史召回：显式取回上一条／下一条已提交文字，修改后由用户再次发送。 | 与已保存会话查看、PI-GAP-01 排队消息取回区分；先确定历史作用域、保留数量及清理／持久化边界，说明失败或投递不确定的输入是否计入；召回前保留当前未发送草稿并支持返回，不静默覆盖；只召回文字，不自动重挂旧附件或重新发送；新建／恢复／切换后不串历史，快捷键兼容多行光标与 IME，遵守既有敏感内容规则。 |

**共同完成要求：** 各晋升切片须有批准的可观察验收、适用端到端验证与可重复工件；模拟、runtime、F5、安装 VSIX 证据分别记录。测试安排遵循现行 testing playbook。已有登录、模型配置、自动压缩、标准扩展交互及已保存会话恢复不列为重做任务。plan mode／子 Agent／MCP 不作为 pi 0.86.1 内置漏接项；升级上游另行评估。

下列仍为 standing non-goals：额外扩展生态（本机清单除外）、编辑区 Chat Participant、remote／multi-root、额外平台、跳过审批、公开发布。

## 最近交接

### 2026-10-02 — WI-078 关闭并晋升 WI-079

Agent 按持续 goal 验收，不是维护者亲测；[方案／验收](docs/archive/2026-10-02-wi-078-acceptance.zh.md)。实现 `bdc9f5b` 不含 ACTIVE。compile／lint／1157 tests、18 组浏览器、真实 pi 4 starts／4 closes、macOS F5／安装 VSIX 裸空格与参数保留均通过；provider 数量不变，cleanup 空。VSIX SHA-256 `fa61b6b435d2d2f3da3e364cfc66e2c2208fd25c9299677790e6800631cc08a3`。F5 前两轮失败为 harness 父窗口 CLI 抢焦点，纠正后真 `[Extension Development Host] A` 通过，失败报告保留。OS IME、真实模型、加载报告未验。PRD／Living 契约及索引同步；docs:verify／health 零错误，保留 Draft ADR 0010 两条提示。下一 WI-079 Prepare→Build 和中英 PRD 已同步，不继承已关闭证据；goal 保持 active，无 push。

### 2026-10-02 — WI-077 文字队列关闭（简要）

[验收](docs/archive/2026-10-02-wi-077-acceptance.zh.md)：macOS F5 与安装 VSIX Steering→Stop Recalled→Use in draft，文字闭环关闭；附件／命令余量停车。Agent 委托验收，非维护者亲测；原证据限制保留。

## 已完成 WI 索引

编号、验收记录与历史限制见[已关闭 WI 索引](docs/archive/2026-09-29-closed-wi-index.zh.md)；现行架构 gate 状态见 [gate 表](docs/reference/architecture-gates.zh.md)。最近关闭：WI-078；当前 WI-079。
