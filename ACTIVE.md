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

## 正在做（WIP=1）

| 字段 | 内容 |
|------|------|
| **ID** | WI-011 |
| **标题** | 模块内测试结构重构 |
| **阶段** | Build 完成，待确认收尾（测试迁移及 2026-09-21 20:33 追加批准的 scripts 分组均完成） |
| **Gate ID** | none；既有三个 gate 均保持 Open |
| **Decision** | none；WI-010 遗留 `pending-adr` 保留 |
| **决策类** | none |
| **PRD 判定** | 纯技术：测试组织与收集重构，不改变产品行为，不新增需求 |

### 目标与范围

按批准计划将应用测试迁入 `src/extension/tests/`、`src/adapter/tests/`、`src/webview/tests/`，统一 `.spec.ts`；脚本原位改为 `.spec.mjs`。按 workspace／focus／runtime-chat／model-selection／bounds／protocol／approval／architecture、adapter projection／environment、Webview HTML／workspace／model／execution 拆分，提取局部 harness，保留所有场景和断言。生产源码位置不变。

新增薄 runner 与 import-safe 收集库：递归发现 owner-local specs、排除 helper／fixture／其他层级、不跟随符号链接、保留输出目录；只清理 `dist/tests/`，只执行本次确切清单，空集合／构建／进程失败均失败退出。新增临时夹具回归；同步 package 入口、CI 旧文件引用及双语指南／有效链接。保持 node:test、esbuild、当前 CI 范围、生产打包与依赖不变。

### 追加批准：scripts 按用途分组

维护者 2026-09-21 20:33 批准小重构：文档脚本移至 `scripts/docs/`，runner 移至 `scripts/testing/`，集成探针与信任辅助／测试移至 `scripts/spikes/`，VSIX 校验移至 `scripts/packaging/`。文件名、对外 npm 命令与行为不变，不增加 src/tests 多层目录；同步根路径计算、脚本调用、CI、夹具与有效文档链接。验证原 84 用例、编译／lint／文档检查，并针对移动后的入口做安全的路径验证；不运行付费调用或扩大验收。此次追加不修改原计划文件。

### 方案与架构核对

所有权：测试按现有 host／adapter／Webview 归属，无生产边界变化。收集：现有平面 glob 漏掉嵌套目录，须与迁移同步修复；类型／lint 已覆盖 `src/**/*.ts`，不新增 tsconfig。风险：遗漏／重复用例、同名输出覆盖、旧 bundle、cwd／VM 语义变化；通过迁移前名称基线与收集器回归验证。WI-010 ADR pending 与既有 gate 不变。

### 验收

迁移前基线已运行：73/73、0 skipped（4 应用＋4 脚本文件）；逐项保留原名称／场景，新增 runner 测试单独计数。验证递归发现、同名隔离、辅助文件排除、空集合失败、旧输出清理且保留其他 dist 产物。运行 npm test／compile／lint／docs:verify／docs:health 及 git diff --check；不将结果算作 F5 或安装包验收。

### 范围外与批准边界

不改生产逻辑／生产目录、依赖或锁文件；不新增 e2e／snapshot／性能通道、CI 矩阵或全套 CI 门禁；不调用真实模型，不关闭旧 WI／gate，不改已批准计划，不创建 Git commit。

## WI-008／WI-009 状态（延后选择主路径 F5 已确认；待收尾、非并行 Build）

- **批准：** 两者 Build 均于 2026-09-21 批准。WI-008 为 REQ-002 模型／thinking Popover 的 RPC／host／协议；WI-009 为 REQ-002／REQ-004 聊天优先重设计，并追加批准流式期间选择仅下一轮生效。Decision `none`；`gate-webview-trust`／`gate-session-streaming` Open。初版样式被重设计覆盖不是关闭依据。
- **已实现范围：** 紧凑状态头、设置空态卡、右侧用户 pill、助手消息、sticky composer、合并 model · thinking chip、锚定 Popover、可折叠模型列表与离散滑块。固定 `#168BFF` 粗滑块填充／头、无黄色轮廓，保留蓝色键盘焦点；其余主题 token，nonce CSP、`textContent`、无框架外链。不是原生 Quick Pick。
- **模型契约：** ready、generation 匹配、非 workspace busy／modelBusy 才可选；空闲立即应用，chatBusy 时分别保留最新 pendingModel／pendingThinkingLevel，applied chip 不变。当前 session `agent_settled` 后模型→刷新能力→重新校验 thinking，应用期间禁发／禁选。不支持／失败显示有界错误并回读，不重试修改或虚报成功；回读失败清空未知 applied。无模型可用有界提示，不泄露凭证。
- **生命周期：** generation／runtime session／catalog token 防迟到；视图重建保留宿主 pending，工作区／资格变化、运行时替换／重启与 dispose 清除。公开 RPC 为 `get_available_models`、`get_available_thinking_levels`、`set_model`、`set_thinking_level`；不重写循环或让 Webview 直连 pi。详见 [PRD](docs/product-requirements.zh.md) 与 [消息契约](docs/reference/webview-messages.zh.md)。
- **已获维护者 F5 验收：** 空闲模型／thinking 切换后成功流式回复、模型折叠、Esc／键盘、浅色主题、无目录／未信任／资源设置；粗蓝色滑块样式获批准。
- **追加 F5 确认（2026-09-21 19:44）：** 维护者确认回复过程中更换模型／thinking 不影响当前回复，结束后新配置生效，下一条消息正常使用新配置。此主路径不再待确认，无须重复验收。
- **证据边界：** 本次确认不扩大为故障注入、RPC 失败回读、重启清理或审批／Stop 交错的完整手动矩阵；这些边界保留已有自动化证据及未独立手测说明，收尾时分别记录。
- **原范围外保留：** 全局启动默认持久化（仍仅读取既有 defaultProvider/defaultModel）、登录／配置 UI、在线刷新模型、循环按钮替代列表／滑块、编辑区 Panel／Chat Participant、附件／历史／Markdown。Thinking 正文、工具审批与 Stop 由 WI-010 承接，不倒算为旧 WI 交付。
- **关闭条件：** 汇总已确认 F5 与全量检查，对剩余边界验证明确处理结论，再由维护者确认一起关闭并归档；本次未归档或标为已关闭。pi 当前 `0.86.1`；[WI-004 RPC 证据（0.85.1）](docs/discussions/2026-09-21-wi-004-rpc-evidence-0.85.1.zh.md) 保持历史。

## 当前焦点与未决项

- [x] WI-010：维护者确认 thinking／状态、文件读取／工具卡正常，拒绝写入无副作用后允许写入正常，长时间无害命令 Stop 正常；已按明确收尾请求关闭限定切片。
- [x] 既有证据保留：73 tests、compile／lint、九个真实审批夹具、offline loopback 推理、完整 VSIX 独立解压验证；本次文档收尾未重跑。
- [x] WI-008／WI-009 延后选择主路径 F5：维护者 19:44 确认当前回复不变、结束后应用、下一条使用新设置。
- [ ] WI-008／WI-009 收尾：汇总已确认验收与自动化证据、保留边界限制，再归档。
- [ ] 已安装 VSIX 的激活／运行验证仍无证据；开发态 F5 不等于安装包验收或发布。
- [ ] WI-010 其余手动矩阵：授权复用／撤销／重置、改变范围重新询问、剩余审批／生命周期／键盘主题覆盖未获完整确认；保留为边界验证，不伪装已验收。
- [ ] 完整边界验证与 ADR（WI-010 `pending-adr`）；三个 gate Open，不因 WI 关闭、自动化或打包通过而关闭。
- **仍有效限制：** 最终受控策略仅 canonical 工作区普通文件 `read` 自动允许，搜索／列目录询问，不存在目标仅单次授权；缺 gate／握手拒绝启动，不回退可用聊天。无沙箱、无回滚／全部后代进程取消保证；可信用户凭证命令不受工具审批约束。详见 [PRD](docs/product-requirements.zh.md)、[架构](docs/architecture/vscode-extension-architecture.zh.md)、[契约](docs/reference/webview-messages.zh.md) 及 [gate](docs/reference/architecture-gates.zh.md)。[WI-003](docs/archive/2026-09-21-closed-wi-history.zh.md#wi-003)／[WI-004](docs/archive/2026-09-21-closed-wi-history.zh.md#wi-004) 的历史限制仍保留。

## 停车场

- **下一候选：WI-012 — Webview 前端工程化与技术栈评估。** 在 WI-011 明确收尾后进入 Prepare；比较原生 TypeScript 模块化 browser bundle 与 React／Preact／Lit 等候选，评估 CSP、依赖与包体积、流式渲染、可访问性、测试迁移、现有协议／信任边界及渐进迁移风险。先形成可审阅选型与验证计划，不在技术选择获批前直接重写 UI；预期为纯技术，若改变可见行为则另行补 PRD 判定。框架／构建边界选择属于 ADR 候选，验证前保持 `pending-adr`。
- 编辑区标签聊天（Claude Code 式 panel 默认）、Chat Participant API。
- 流式 UI 限速／合并 delta（观感优化）。
- 将模型／thinking 写回 settings.json 启动默认。
- provider 错误文案进一步友好化（WI-004 已部分覆盖）。

## 最近交接

### 文档审阅交接（2026-09-22）

维护者明确要求按 `writing-for-agents` 全面审阅并修正文档，授权范围为本项目文档维护；不新增并行产品 WI。已逐份审阅 59 个 Markdown（含双语、隐藏技能与 PR 模板），另检查两个 Issue 表单及 LICENSE；排除依赖包与生成产物。交叉核对 package／CI、消息类型、宿主与 adapter、测试收集及历史验收；未重做产品运行验证。

以下问题均为 `confirmed`，已在本次文档授权内修复；每个键由规则／路径／主题构成，可供后续复查：

| 发现键 | 原问题与依据 | 处置 |
|--------|--------------|------|
| freshness/README.md/status | 首页仍称只有占位 UI；与源码及当前 WI 验收冲突 | 分开说明已实现切片、验收与发布缺口，同步 CHANGELOG |
| freshness/docs/product-requirements.md/deferred-selection | PRD／消息契约仍写延后选择待 F5；ACTIVE 已记录 19:44 确认 | 同步主路径确认，保留边界手测及收尾缺口 |
| hierarchy/docs/guides/architecture-governance.md/checklist | 603 行混合重复索引、示例与本仓不存在的路径；凭证 UI 条目不符产品 L0 | 保留 19 维度，集中完成条件与证据，使用真实入口并遵循 L0 |
| duplication/docs/product-requirements.md/evidence | PRD／架构／契约重复测试数、包大小及收尾日志 | 原始结果留在历史，现行文档链接证据；PRD 保留需求，架构保留所有权，契约保留语义 |
| workflow/docs/guides/agent-collaboration.md/completion | 提案步骤过密，Git 隔离规则多处维护 | 明确阶段完成条件，提交分支详规集中到提交指南；同步本文件契约 |
| routing/docs/guides/agent/pi-integration.md/version | 历史无聊天结论与当前实现混排；信任探针硬性限定 0.85.1、当前 pin 0.86.1 | 区分版本与证据，明确该探针未对当前版本通过 |
| hierarchy/docs/guides/agent/testing.md/tiers | 当前收集与未启用测试层级重复穿插 | 当前规则与新增层级分支分开，保留后缀含义、收集及证据要求 |
| security/SECURITY.md/contact | 漏洞报告引用不存在的 README 私密渠道，行为准则使用 noreply | 按本次维护者答复统一为 GitHub 私密报告链接，并同步 Issue 表单 |
| routing/docs/README.md/pointers | 索引指向宽泛目录，部分日期仍为模板占位 | 改为具体文档入口，移除未知创建日期占位，记录实际翻译同步日期 |
| scope/.agents/skills/documentation-health/SKILL.md/acceptance | 工具验收分支容易被普通文档审阅误执行 | 仅工具变更走该分支；文案修复运行文档检查 |
| portability/.agents/skills/writing-for-agents/SKILL-MECHANICS.md/invocation | 将特定宿主的调用开关和引用限制写成通用事实 | 改为按宿主 schema 核对；保留既有调用策略，补齐技能描述触发范围 |

本次验证：`npm run docs:verify` 与 `npm run docs:health` 均通过，0 errors／warnings／stale notices／review notices；两项技能 `quick_validate.py` 均通过，两个 Issue 表单 YAML 解析通过。补充检查覆盖全部 59 个 Markdown 的 559 个本地链接／锚点，均有效；`git diff --check` 通过，暂存区仍为空。本次不运行应用测试／编译／lint／F5／VSIX，因为没有应用或工具实现改动。安全报告链接由维护者指定；外部服务可用性未作提交报告验证。模板来源的架构治理／判断指南现注明本地修订与未同步状态；engineering-template 和其他相邻仓库未改。保留开工时已有修改，不创建 Git commit；没有创建临时工作区。

**此前交接（WI-011 及相关文档维护，保留原验证时点）：**

- 共享内核可读性整理（2026-09-22）：按维护者批准的 `writing-for-agents` 审阅建议同步双语 `AGENTS.kernel`，明确职责与优先级、合并事实判断和开工流程、澄清只读问答例外、修正可选优化示例、改写安全／架构术语和可核对的交付条件；同步产品入口中的章节引用。保留提交授权、安全禁令、审批及基础阅读要求。本次仅修改本仓副本，engineering-template 未同步；未改变 WI／Gate 状态或生产代码。

- Agent 入口规则可读性补强（2026-09-22）：按维护者明确请求，将双语 `AGENTS` 的压缩“权威栈”改写为“文档职责与冲突优先级”，逐项说明规则／Accepted PRD／架构／ACTIVE／历史材料的职责，定义真实冲突与互补关系并给出处理步骤；把加载地图的术语标签改为实际任务描述，使用中文路线并说明一项任务可匹配多行，加入 Webview 前端工程化示例，并将双语加载地图中的文档路径、架构文档引用及索引统一为可点击的相对 Markdown 链接（不加章节锚点）；再将抽象“上游指针”改为 pi 集成参考与规则，分别说明只读源码、集成指南、当前版本事实、升级重验和既有 RPC 决策边界；将过时“任务完成”短句改为“交付前检查”，按文档／代码／真实宿主列出检查及证据报告要求，区分检查通过与 WI／Gate 验收。随后按 `writing-for-agents` 审阅获批范围清理 WI-001 过时条件、合并开工指引、替换不存在的 boundaries 引用、澄清 Draft PRD 单独获批切片并集中 pi 集成规则，保留安全禁令与审批边界。不改变原优先级、加载义务、依赖版本、安全规则、产品／架构状态或生产代码。

- Gate 参考文档可读性补强（2026-09-22）：按维护者明确请求扩展双语 `architecture-gates`，解释 Gate 与测试／spike／WI／人工验收／ADR 的关系、`Open`／`In spike`／`Accepted` 语义，并为六个 Gate 补充问题、证据和“不代表”边界；随后补充新增 gate 的准入、去重、命名、证据／排除项、ACTIVE 关联、初始状态、ADR 及替代历史规则。未改变任何 Gate 状态、ADR、当前 WI 范围或生产代码。

- 架构文档局部纠偏（2026-09-21）：同步双语 §5，区分 Webview 释放仅清理视图与 provider 释放请求停止运行时；同步 §7／§8 的 19:44 延后选择主路径 F5 确认，保留边界矩阵未完整手测、WI 待收尾及 gate Open。仅修改文档，不改变当前 WI 范围或生产行为。

- 提交隔离工作流补强：双语协作／提交规范现要求开工基线分类、临时 commit map、实现提交排除 `ACTIVE.md`、当前 WI 固定 `docs(active)`、无关维护独立提交及重叠 hunk 的非破坏恢复。新增 `npm run commit:check`，只读检查暂存清单、whitespace，并机械拒绝 `ACTIVE.md` 与实现／构建／CI 路径同批暂存；不安装 hook，也不声称识别语义。10 个隔离 git 仓库回归覆盖空暂存、docs-only、混合路径、rename／Unicode、whitespace、非根 cwd 与 git 失败。全套 `npm test` 94/94（新增 10）、compile／lint／docs:verify／docs:health／diff check 均通过；文档 0 errors／warnings／stale notices。真实暂存区为空时 `commit:check` 按设计失败且不修改 index。

- 追加 scripts 分组完成：19 个文件移入 docs（10）／testing（3）／spikes（5）／packaging（1），同步 npm／CI 入口、URL 根路径、runner 夹具与 VSIX 辅助导入及双语有效链接。对外命令、生产代码与依赖不变。再次验证 84/84、compile／lint／docs:verify／docs:health／diff check 全通过；三个探针与 VSIX 入口语法检查通过。未执行集成探针或 VSIX 重验；原 project-trust 探针仍有 0.85.1 固定版本 guard，与当前 0.86.1 不符，未在目录重构中改动该既有限制。历史归档旧路径保留为当时记录。

- 原 44 应用用例拆入 14 个模块内 spec：extension 32、adapter 4、webview 8；4 个脚本测试改名且内容不变，原 29 脚本用例保留。原 73 个用例名称／断言保留；Webview 模型测试用显式类型化 DTO 替代仅为取状态而启动 provider，VM 交互断言不变。
- 新 runner 显式收集、保留路径、清理专用输出并传递失败；11 个新增回归覆盖递归／排除／同名／空集合／旧输出／失败及 Unicode、非根 cwd。默认只跑 spec，不启用 e2e 等新层级。CI 仅更新旧文件名，未扩大执行范围；生产逻辑／打包入口／发布白名单／依赖未改。
- 本次验证：`npm test` 84/84（73 原有＋11 新增，0 skipped）、compile、lint、docs:verify、docs:health、git diff --check 均通过；文档 0 errors／warnings／stale notices。scripts 仍不在 lint 范围，runner 由专门回归验证。无真实模型调用，无 F5／VSIX 重验，无提交；旧 WI／gate／ADR 状态保留。待维护者确认 WI-011 收尾。

### 先前交接（2026-09-21）

**WI-010 限定切片收尾**

- 预览链接兼容修正（2026-09-21）：按维护者反馈，仅移除完成索引 8 个“记录”链接的章节锚点，保留相对路径与历史内容；绕过当前 Cursor 对带锚点相对链接的处理问题。实际预览点击待维护者复验，不改变 WI／gate 状态。

- 按维护者四项 F5 确认及“进入收尾吧”关闭 WI-010；长提案、批准、既有自动化／打包证据和旧交接并入既有双语历史，更新归档索引与完成索引；同步双语 PRD／架构／消息契约的状态与最终范围。
- 未将四项检查扩大为已安装 VSIX 或完整审批矩阵验收；WI-008／WI-009 延后设置待验收，基础 UI／空闲切换验收保留。PRD Draft、架构 Proposed／Direction、契约 Outline、gate Open、ADR pending 均不提升。
- 本次仅文档，不改源码、package、已批准计划或 Git commit。语义核对覆盖 WI-010 相关文档、状态与活动 DTO／测试；仓库 README 的旧脚手架状态另记为待后续文档同步，不在本次限定归档中扩大修改。
- 本次 `npm run docs:verify` 通过：structure／i18n 均 0 errors、0 warnings、0 stale notices；`npm run docs:health` 通过：combined errors 0、review notices 0，扫描 29 文件。首次检查提示空闲交接缺当前项字段，已补齐未指定／未授权的 Prepare 入口后复查通过；未伪造新 WI。此前 73/73、compile／lint、审批／offline／VSIX 均为已有报告，非本次重跑。

**测试约定采用与后缀补齐**

- 维护者批准双语 [testing playbook](docs/guides/agent/testing.zh.md)、加载地图／索引／TypeScript 指引及后缀解释；纯技术文档，不新增并行 WI，不关闭 gate。保留当前 `*.test.ts`／`*.test.mjs` 布局与 runner，不新增 Cursor rules，不迁移框架。
- 指南区分当前收集与未来模块内 tests 迁移；解释 `.spec`、`.e2e`、`.expected.e2e`、`.snapshot`、`.bench`、`.perf` 及 host/client/compat，未来端到端统一 `.e2e.ts`；明确收集排除、前置条件、首次启用／跳过证据。此前 61/61、compile／lint／docs 检查通过，后缀纯文档会话未重跑代码测试／F5。此前 ACTIVE 长度警告是历史检查结果，后续压缩重复内容已处理。

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
