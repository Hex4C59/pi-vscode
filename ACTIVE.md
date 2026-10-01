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
| **ID** | WI-078（PI-GAP-02：作曲区 `/` 命令发现） |
| **阶段** | Build（Prepare 核对完成；2026-10-01 持续授权批准本次发现切片，中英 PRD／Outline 已同步；先验证后实现） |
| **Gate ID** | none（沿用既有 runtime／Webview 信任边界，不声明新 gate 关闭） |
| **Decision** | none |
| **PRD 判定** | 用户可见：已同步中英 PRD WI-078／REQ-004／009 范围与追溯行；新增切片仅批准范围，尚未交付／接受 |

### 目标与范围

按 PI-GAP-02 交付可观察的作曲区 `/` 发现闭环：消息输入框前导 `/` 打开命令菜单，列出公开 `get_commands` 当前返回的扩展命令、prompt templates 与 skills；展示名称、可选描述、来源与粗粒度位置；选中补全写入已确认草稿且不发送。空列表、RPC 失败、过期世代与过滤零结果可解释。不把未在当前快照中的清单／磁盘／市场项显示为可执行，不承诺任意扩展兼容，不把绝对路径或 AGENTS.md 正文送入 Webview。PI-GAP-02 的实际加载报告（已登记 vs 已加载的 AGENTS.md／上下文）继续停车，不标整个 ID 完成。

### 方案与架构核对

安装包公开 rpc.md（pi 0.86.1）定义 `get_commands`：`source` 为 `extension`／`prompt`／`skill`，可选 `location` 与 `path`。生产 adapter 目前只在 Trusted 启动校验扩展命令名；本切片须在 Controlled 与 Trusted 的 runtime ready／替换后刷新有界展示快照。宿主过滤路径与凭据，UI 只渲染投影。补全走 `DraftSubmission` 一次草稿变更；发送仍走既有 idle `prompt`。WI-077 队列继续拒绝首部 slash。内置仅 TUI 命令不在 `get_commands` 中，不得发明。无新依赖、进程策略、存储或信任决定。契约 Outline 见[双语契约](docs/reference/webview-messages.zh.md#wi-078-作曲区命令发现outline未实现)。

### 架构检查（Prepare 结论：implement now；Decision none；设计 Implementable，尚非 Verifiable）

| 维度 | 状态／证据与下一检查 |
|---|---|
| 1–3 分解／接口／依赖 | pass（设计）：adapter 翻译 `get_commands`；宿主拥有快照／generation／补全准入；UI 只打开菜单与过滤。沿用 [host capability](docs/architecture/vscode-extension-architecture.md#internal-host-capability-modules) 与 `DraftSubmission`。实现时核对 imports。 |
| 4 契约 | pass（Outline）：[命令发现契约](docs/reference/webview-messages.zh.md#wi-078-作曲区命令发现outline未实现)定义数据、前置、错误、额度、顺序与隐私。Build 须成对类型／validator／消费者。 |
| 5、7–11 所有权／身份／状态／并发／恢复／清理 | pass（设计）：单一目录 owner 在宿主；补全不另设草稿 owner。世代守卫替换后的迟到回包。pass（composition）：空／失败与 Stop 迟到回包、未知 name／草稿与 generation 过期用例已通过；真实 runtime／宿主仍待验证。 |
| 6 范围 | pass：[中英 PRD](docs/product-requirements.zh.md) WI-078 与本次持续批准；不扩加载报告／包管理，不接受整个候选。 |
| 12–14 安全／数据／隐私 | pass（设计）：路径与文件正文留宿主；描述打码；不新增持久化。pass（composition）：adapter 丢弃 path，浏览器 parser 拒收附加 path 字段；菜单前仍须复核名称／描述内隐私边界，不把字段过滤等同完整隐私验收。 |
| 15 性能／背压 | pass（设计）：最多 512 行、名称／描述上限；过滤在已发布快照上本地进行。 |
| 16–17 验证／构建 | partial：adapter／provider／DraftSubmission／client 贯通，compile／lint／npm test 1150 通过；gap：菜单 UI、真实 runtime／浏览器／F5／安装 VSIX。 |
| 18 版本兼容 | pass（设计）：host／bundled UI 成对演进 v3；新意图只准 chat；旧 viewId 拒绝。 |
| 19 UX／可访问性 | gap：键盘／IME／与模型选择器互斥、中英空／错误态待实现与取证。 |

### 验收

实现前并列失败方式：把清单项显示为可执行；把 path 送入 Webview；发明 TUI 命令；补全即发送；忙碌时经 WI-077 队列发送 slash；替换后展示过期目录；空列表当加载中；IME 抢走中文；菜单与模型选择器同时打开。可观察验收：`/` 打开→列表与来源→补全写入草稿不发送→空／错误／过期、配置差异、键盘／IME／互斥。compile／lint／npm test、适用浏览器与真实 runtime；macOS F5／安装 VSIX 分层取证。docs:verify，关闭 docs:health。

### 范围外与批准边界

2026-10-01 持续 /goal 对既有 PI-GAP 内合规独立切片提供 Prepare→Build 范围确认，无需逐次点名。本 WI 只做 PI-GAP-02 上述 `/` 发现闭环；中英 PRD 已同步，不代表已通过验证或已验收。保留 Accepted PRD／强制 playbook／安全与重大架构审批，不改 Draft ADR 0010，不 push。仍排除下载／市场、额外生态／平台、Chat Participant、remote／multi-root、跳过审批、公开发布。实现提交不含 ACTIVE，关闭／晋升单独 docs(active)。

## 当前焦点与未决项

WI-077 文字队列切片已关闭。当前 WI-078 Build：作曲区 `/` 发现。下一步：复核目录名称／描述隐私，先写 mounted 菜单失败用例，再挂 `/` 菜单与键盘／IME／弹出层互斥，随后逐层取证。adapter／宿主／草稿／client 已贯通但尚未交付可操作菜单。WI-077 不重做；Draft ADR 0010 保持 Draft。PI-GAP-01 附件／命令展开与 PI-GAP-02 实际加载报告仍停车。

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
| PI-GAP-01／优先 | 运行中追加指令：steering／follow-up、队列展示与取回。 | 两种发送语义可区分，按上游边界投递；取回、Stop、失败与恢复不丢失或重复发送。明确附件范围，不把 clear_queue 当作完整队列体验。**文字切片已由 [WI-077](docs/archive/2026-10-02-wi-077-acceptance.zh.md) 关闭；附件与 slash／模板展开仍停车。** |
| PI-GAP-02／优先 | 命令／资源发现：输入框 `/` 菜单，发现已加载扩展命令、skills、prompt templates 并补全。 | 展示实际可用资源及来源；空列表、失效与错误可解释，不把未加载资源显示为可执行，不承诺任意扩展兼容。 另补实际加载报告：区分已登记／可发现与实际加载，展示经公开 API／可靠证据确认的 AGENTS.md、skills、模板和扩展；不可确认项标未知，不读取敏感上下文全文到 Webview。**当前 WI-078 只做 `/` 菜单切片；实际加载报告仍停车。** |
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

### 2026-10-02 — WI-078 adapter／宿主／client 子步，仍 Build

实现提交 `ff7b69f`（两种 profile 的 `get_commands` 有界快照）与 `b9f7242`（v3 命名补全、宿主 projection、草稿 owner、browser parser／client 往返），均不含 ACTIVE。先红后绿复现并修复 Stop 与快照 continuation 的竞态，以及同 revision bootstrap 提前退休待确认补全；保留参数、不发送、不覆盖较新编辑、旧目录 revision 与断开清理均有 composition 证据。当前 compile／lint 通过，`npm test` 1150 全通过。可重复工件：`dist/wi078-command-catalogue/{rpc-startup,host-completion,client-host-roundtrip}.json`；只是模拟 transport／VS Code seams，不是真实 pi／浏览器／F5／安装 VSIX。下一步：名称／描述隐私复核，mounted `/` 菜单先失败，键盘／IME／模型菜单互斥后再逐层取证。目录契约仍 Outline，WI 不关闭、PI-GAP-02 不整体完成；本 Goal 保持 active，无 push／amend／rebase／force。

### 2026-10-02 — WI-077 关闭：F5 与安装 VSIX 文字队列闭环

Agent 依据持续 /goal 关闭，不是维护者亲测。[验收](docs/archive/2026-10-02-wi-077-acceptance.zh.md)。macOS F5 Extension Development Host：Steering `WI077_STEER_from_f5` → Stop Recalled → Use in draft 恢复精确文字（`dist/wi077-queued-host/f5-*.png`，`phase: queue-f5`）。安装 VSIX 与浏览器 280 证据仍有效。关闭时 lint 通过、`npm test` 1140、docs:verify／health 0 错误（保留 Draft ADR 0010 两条提示）。PI-GAP-01 附件／命令展开继续停车。实现提交不含本次 ACTIVE。

## 已完成 WI 索引

编号、验收记录与历史限制见[已关闭 WI 索引](docs/archive/2026-09-29-closed-wi-index.zh.md)；现行架构 gate 状态见 [gate 表](docs/reference/architecture-gates.zh.md)。最近关闭：WI-077。
