# pi-vscode — 当前工作（跨会话入口）

本文件维护当前任务与交接。规则见 [AGENTS](AGENTS.zh.md)、[内核](AGENTS.kernel.zh.md)与[协作指南](docs/guides/agent-collaboration.zh.md)。

## Agent 会话契约（摘要）

| 步骤 | Agent |
|---|---|
| 开场 | 必要阅读、Git 基线、当前 WI／批准／Gate／PRD 与验收核对。 |
| 提案 | Prepare 记录范围与 PRD 判定；Build 须批准；WIP 最多 1。 |
| 建造 | 按批准实现并实际验证；模拟／runtime／F5／安装分别取证。 |
| 收尾 | 记录验收身份、检查结果与未决项；按规则归档并清理资源。 |

## 正在做（WIP=1）

| 字段 | 内容 |
|---|---|
| **ID** | WI-077（PI-GAP-01：文字 steering／follow-up 与取回闭环） |
| **阶段** | Build（Prepare 核对完成；2026-10-01 持续授权批准本次文字切片，中英 PRD／Outline 已同步；先验证后实现） |
| **Gate ID** | none（沿用既有 runtime／Webview 信任边界，不声明新 gate 关闭） |
| **Decision** | none |
| **PRD 判定** | 用户可见：已同步中英 PRD WI-077／REQ-004／005 范围与追溯行；新增切片仅批准范围，尚未交付／接受 |

### 目标与范围

按 PI-GAP-01 交付可观察的纯文字闭环：运行中明确选择「Steer current task」或「Follow up after task」，区分 ACK、待处理与已消费／结果未知；展示已确认队列与不确定状态；通过公开 clear_queue 取回全部尚待处理的文字。Stop 先 clear 再 abort，取回内容可恢复且不覆盖现有草稿；失败、断线与切换不能静默丢失或自动重发。文字切片不含附件及扩展 slash 命令／模板展开；禁用时解释原因，原草稿／附件保留。PI-GAP-01 的剩余扩展范围继续停车，不标整个 ID 完成。

### 方案与架构核对

[WI-076 证据](docs/archive/2026-10-01-wi-076-acceptance.zh.md)验证当前 pi 0.86.1 公开 steer／follow_up、clear_queue 与 clear→abort。Prepare 核对安装包公开 rpc.md：另有 `queue_update {steering, followUp}` 权威文字快照、user message_start 前队列更新。Build 第一步已在 adapter 投影两种 host-only 事件并验证队列额度／user 关联文字／退役 reader；Stop adapter 已新增校验后、abort 前的同步取回 callback（宿主尚未接入）；一次性队列发送、显式取回、host ledger／容量预留和 UI 仍是实现缺口，不是新 runtime 能力／架构决策。缺失 sibling `../pi` 不作为依赖；使用已安装精确版本公开文档及只读 source 核对。

Adapter 隔离公开 RPC，host coordinator 拥有 runtime／session／view 世代与有界 ledger，DraftSubmission 仍唯一拥有已确认草稿；UI 仅命名意图／状态。两数组快照、ACK 与 user 消费事件分别投影，重复文字保留 multiplicity；无法准确归属尝试时标未知，不把队列减少当完成。总额度为 32 条未释放本地文字／256 KiB UTF-8，单条 8000 UTF-16；写入与 clear 前预留，不淘汰／截断。拒绝附件、首部 slash／skills／模板和既有可识别凭据，保留原草稿。取回进入独立恢复区，显式移入无附件空草稿并校验 revision，不发送、不覆盖。Stop 关闭准入，在原共享五秒预算内串行在途 write→clear→abort；确认 clear 结果即保留，abort 失败不抹掉。未知 ACK 不重发；断线保留本地未知文字；明确替换确认丢失，commit 后清理，不跨项目带入。详情与命名 DTO 见[双语契约 Outline](docs/reference/webview-messages.zh.md#wi-077-文字队列增补outline未实现)。无新依赖、进程策略、存储或信任决定。

### 架构检查（Prepare 结论：implement now；Decision none；设计 Implementable，尚非 Verifiable）

| 维度 | 状态／证据与下一检查 |
|---|---|
| 1–3 分解／接口／依赖 | pass（设计）：沿用[架构 host capability](docs/architecture/vscode-extension-architecture.md#internal-host-capability-modules)与 host-owned contracts，adapter／host／UI 各守 owner；Outline 命名四意图，无 generic bridge。实现时核对实际 imports。 |
| 4 契约 | pass（Outline）：[文字队列契约](docs/reference/webview-messages.zh.md#wi-077-文字队列增补outline未实现)定义数据、前置、准入、额度、错误、一次 write、超时与 clear／Stop 顺序；Build 须成对类型／validator／消费者。 |
| 5、7–11 所有权／身份／状态／并发／恢复／清理 | pass（设计）：DraftSubmission 单一草稿 owner，coordinator 管 ledger／Stop，adapter 仅翻译；设计已规定 session／generation／revision 防迟到、失联保留、commit 清理。gap（验证）：消费→clear 与 late ACK interleaving 先写 composition tests。 |
| 6 范围 | pass：[中英 PRD](docs/product-requirements.zh.md) WI-077 REQ-004／005 和本次持续批准；不扩附件／命令，不接受整个候选。 |
| 12–14 安全／数据／隐私 | pass（设计）：沿用信任／凭据规则，内存 ledger 不新增存储；不记录 prompt 或 raw frame 到日志。gap（实现）：敏感上游队列投影拒收与复用拒绝先验证。 |
| 15 性能／背压 | pass（设计）：32 条／256 KiB 与已有单条限制、one-attempt write／drain 预算；clear 前容量预留。gap：边界与外部不可归属队列拒绝须验证，不造无限恢复缓存。 |
| 16–17 验证／构建 | gap：尚未新增产品闭环验证；沿用 npm test composition、真实 runtime 及浏览器／macOS F5／安装 VSIX，各自留工件；pin 与构建策略不变。 |
| 18 版本兼容 | pass（设计）：host／bundled UI 成对演进 v3，新意图只准 chat；旧 viewId 拒绝，升级后重载旧页面。无持久 schema 迁移。 |
| 19 UX／可访问性 | gap：独立动作／状态／恢复冲突已规定，但 en／zh、280／320／400 三主题与 keyboard 实际渲染未验。 |

### 验收

实现前安排现有 owner-local／端到端测试并列失败方式：两种语义串线；ACK 当执行；忙碌／空闲准入竞态；重复点击／late ACK；取回与消费竞争；Stop clear／abort 失败；草稿修改后异步覆盖；view／runtime／session／model／profile 世代污染；额度拒绝丢失文字；未知状态自动重发。可观察验收须覆盖发送→显示→消费／取回、Stop 与断线恢复，现有任务不被重置，附件／命令拒绝保留输入。compile／lint／npm test、适用浏览器与真实 runtime e2e；当前 macOS 真实宿主／安装 VSIX 按最终 PRD 验收生成可复现工件，模拟／runtime／F5／安装分别记录。docs:verify，关闭 docs:health；不以底层 ACK probe 代替产品验收。

### 范围外与批准边界

2026-10-01 持续 /goal 对既有 PI-GAP 内合规独立切片提供 Prepare→Build 范围确认，无需逐次点名。本 WI 只做 PI-GAP-01 上述文字闭环；本轮 Prepare 完成后按持续授权批准 Build，中英 PRD 已同步，不代表已通过验证或已验收。保留 Accepted PRD／强制 playbook／安全与重大架构审批，不改 Draft ADR 0010，不 push。仍排除下载／市场、额外生态／平台、Chat Participant、remote／multi-root、跳过审批、公开发布。实现提交不含 ACTIVE，关闭／晋升单独 docs(active)。

## 当前焦点与未决项

WI-076 真实公开队列 RPC 前置已验证关闭；当前 WI-077 Build 产品文字闭环，Prepare／中英 PRD／契约 Outline 已完成，按持续授权继续，不等待点名。adapter queue_update／user 消费事实及 Stop clear 输出回调已完成 test-first 局部验证；下一步先写一次性队列发送／显式取回与 Stop 共用 clear owner 的 transport 交错验证，再接 host ledger／容量预留／唯一 draft owner 和 production-mounted 恢复 UI，不以此技术阶段宣称交付。技术 probe 不代表产品候选完成；WI-073–075 不重做；Draft ADR 0010 保持 Draft。

[PRD](docs/product-requirements.zh.md) REQ-009 当前 macOS 安装包矩阵见 [WI-070](docs/archive/2026-10-01-wi-070-acceptance.zh.md)。Webview 目录见 [WI-071](docs/archive/2026-10-01-wi-071-acceptance.zh.md)。REQ-008／中文 REQ-009 文档漂移不当作新实现任务。

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
| PI-GAP-01／优先 | 运行中追加指令：steering／follow-up、队列展示与取回。 | 两种发送语义可区分，按上游边界投递；取回、Stop、失败与恢复不丢失或重复发送。明确附件范围，不把 clear_queue 当作完整队列体验。 |
| PI-GAP-02／优先 | 命令／资源发现：输入框 `/` 菜单，发现已加载扩展命令、skills、prompt templates 并补全。 | 展示实际可用资源及来源；空列表、失效与错误可解释，不把未加载资源显示为可执行，不承诺任意扩展兼容。 另补实际加载报告：区分已登记／可发现与实际加载，展示经公开 API／可靠证据确认的 AGENTS.md、skills、模板和扩展；不可确认项标未知，不读取敏感上下文全文到 Webview。 |
| PI-GAP-03／其次 | 上下文用量面板：上下文占用、token、缓存及费用。 | 来自公开 API 实际数据，区分累计值与当前上下文；未知费用明确标注，不伪造数据；刷新和会话切换不串数据。 |
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

### 2026-10-01 — WI-077 Build 第二步：Stop clear 输出／并发 fence

实现 `3a26a87` 不含 ACTIVE。先在既有 [JSONL transport composition](src/adapter/runtime/rpc/tests/runtime-protocol.spec.ts)列 12 项 clear／Stop 场景（旧实现 10 fail、2 既有拒绝行为 pass）；clear.data 经共享两数组／32 条／256 KiB parser 校验，在同一五秒预算内调用同步 host-only callback，再 abort。已确认文字在 abort 失败后仍留在 callback 夹具；损坏／超限／断线／超时不投递／不 abort。独立 session Stop lease 防重复 clear，修正 agent_settled 提前放开 Stop 发送 fence（先复现 admission race fail，再 green），失败旧操作只可撤销自身 session。四组旧 clear fixture 补公开协议 data 形状；Stop 方法体／新 settlement helper 均少于 50 行。最终 compile／lint／1090 tests（0 fail／skip）及 docs:verify／docs:health 0 错误、staged 全量 review／commit check 通过；ADR 0010 两提示保留。

工件：npm test 可重建 `dist/wi077-stop-recall/success.json` 与 `abort-failure.json`，只有注入内存传输／callback 夹具证据，不是已接入 provider recovery、真实 pi／F5／安装验收。当前 provider 没传该 callback；显式取回、clear 前容量预留、产品 ledger／恢复区和发送 API 均未实现，不关闭 WI／PI-GAP-01。下一步先写一次性 steer／follow_up 的 write/drain／ACK／Stop fence 交错，以及显式 recall 与 Stop 共用 clear owner 验证，再实现 adapter seam；随后 host ledger 同步容量预留／本地尝试与外部文字归属、DraftSubmission 准入、view／generation／session 迟到与恢复 composition，最后 production UI／真实 runtime／浏览器／macOS F5／安装闭环。既有 abortTask callback 只能在 clear 后保存：尚不能代替 host 的 clear 前容量预留，接入时必须先补准入。无 push；goal 保持 active，常规授权不重问。

### 2026-10-01 — WI-077 Build 第一步：队列／消费 host-only 事件

Prepare 范围／双语 PRD 提交 `126f41a`、Build 记录 `186b76d`；本轮实现 `0592491` 不含 ACTIVE。先写 [transport composition 测试](src/adapter/runtime/rpc/tests/runtime-protocol.spec.ts)，旧代码新增 14 项均失败，再实现 queue_updated／user_message_started，保持 ACK／队列快照／进入对话／任务结束分别取证；32 条／256 KiB 原子验证、文字关联不截断、混合／超长 user text 为 null、损坏帧进入不确定恢复、迟到 reader 不污染新 session。变更函数均小于 50 行；双语契约保留 UI Outline，并记录局部实现与证据界限。全 spec 37 tests 与完整 npm test 1078 tests（0 fail／skip）通过；compile／lint、docs:verify／docs:health、diff／commit check 通过，保留 ADR 0010 两条提示。

工件：`dist/wi077-queue-transport/report.json` 由 npm test 主场景重建，仅注入内存 JSONL transport，不是 runtime／F5／安装或用户闭环验收。无新发送／clear API、host recovery、UI 或本轮真实宿主证据；不关闭 WI，不关闭 PI-GAP-01。下一步先在 adapter transport 测试一次性 steer／follow_up 与 Stop／clear ACK／并发／损坏返回，再实现可保存的 clear 输出（必须先保存再 abort，不能靠最终 Stop ok 才恢复）；fixture 的 clear 回复须补真实两数组形状，不能以 undefined data 通过。随后 host ledger／DraftSubmission 唯一准入、view／generation／session 迟到与恢复区 composition，再 UI／真实 pi／浏览器／macOS F5／安装分层验收。无 push，goal 保持 active，接续无需重问常规授权。

## 已完成 WI 索引

编号、验收记录与历史限制见[已关闭 WI 索引](docs/archive/2026-09-29-closed-wi-index.zh.md)；现行架构 gate 状态见 [gate 表](docs/reference/architecture-gates.zh.md)。最近关闭：WI-076。
