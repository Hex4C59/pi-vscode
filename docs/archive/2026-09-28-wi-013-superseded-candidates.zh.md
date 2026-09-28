# WI-013 — 已替代候选与早期ADR路线

[English](2026-09-28-wi-013-superseded-candidates.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-28-wi-013-superseded-candidates.md](2026-09-28-wi-013-superseded-candidates.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-28

- Type: Reference
- Status: Archived
- Created: 2026-09-28
- Authority: 历史提案，不是当前实施或验收状态

## 归档原因与替代

旧路线和未定预算提案已由本次委托下记录并实施的决定替代。保留原始批准边界、未决措辞及理由，不把历史Prepare／Paused状态当作现在。当前决定见[ADR0002](../decisions/0002-interaction-contract-route.zh.md)，精确DTO见[消息契约](../reference/webview-messages.zh.md)，实际证据见[目标调查](../archive/2026-09-27-wi-013-target-research.zh.md)。本次候选归档本身不关闭WI／ADR／gate；[ACTIVE](../../ACTIVE.md)仍是唯一工作入口。

## 原ADR草案的路线与背景


- 类型：ADR
- 状态：Draft
- 创建：2026-09-22
- 决策批准：2026-09-22历史路线；2026-09-27 UTC本次委托的当前发行版决定见下（非ADR验收）
- 验证：本轮隔离公开RPC可行性见下；产品实现及验收待完成
- 相关 gate：[gate-webview-trust、gate-session-streaming、gate-project-trust](../reference/architecture-gates.zh.md)——全部保持 Open
- 工作项：[ACTIVE](../../ACTIVE.md)中的WI-013 Prepare，未关闭；历史[暂缓提案](../archive/2026-09-22-pi-compatibility.zh.md#wi-013-暂缓提案保留2026-09-22)；决策类 `adr-after-approval`、`pending-adr`。本ADR未Accepted。

**2026-09-27 UTC 恢复与委托：** WI-013 已恢复为 ACTIVE 唯一当前项。维护者本次明确委托代理决定目标、契约与预算并完成实施／验收，取代旧的常规待确认／Paused 条件；仍在核对可行性；下方当前发行版决定已选定目标与部分预算，完整恢复／DTO设计和ADR验收仍待完成。以下9月22日选择是历史路线依据，当前精确决定须另记录，所有强制公开 API／安全／实测条件保留。

## 背景

REQ-004/005/009 要求诚实标准交互状态、本地答案失效和受支持操作 Stop 边界。[pi 0.86.1 调查](../archive/2026-09-22-pi-compatibility.zh.md) 识别入站操作关联、对话框关闭／结果观察及通用空闲命令完成／取消缺口。本地 child 退出证据可改进，但宿主重载丢失进程所有权。关联不能创造远端事实。既有受控聊天和官方示例观察不证明通用兼容。

## 决定与批准范围

维护者明确选择**路线 1 作为本地候选契约，配合路线 3 的本地上游提案；路线 2 仅在另行选择窄试点时启用**，并要求交付这些文档。本地候选记入既有双语 [Webview 消息 reference](../reference/webview-messages.zh.md#planned-wi-013-本地交互契约)，上游请求留在既有调查。这是在 [ADR 0001](../decisions/0001-build-baseline.zh.md) 子进程 baseline 内的集成策略方向，不替换进程模型。

批准涵盖路线及文档，不代表所有字段拼写、数值预算、具体支持操作、产品 Build、探针、依赖变更、可信加载、发布或 release 获批。所需验证及下方接受条件满足前，本 ADR 保持 Draft。WI-010 独立 pending ADR 仍未解决。

## 方向修订（2026-09-22）

维护者澄清目标：使用未修改的标准发行版 pi，支持现有及 AI 编写的 pi 扩展。已确认范围和信任规则归 [PRD 产品方向与 REQ-009](../product-requirements.zh.md)。此前路线 1＋3 选择保留为文档交付的历史批准，**不使上游协议工作成为交付依赖**。当前主方向是使用有文档的公开 API 和诚实本地证据，评估有限的当前发行版加载／标准交互切片。路线 3 为可选未来上游工作；路线 2 仍仅为另行批准的可选试点，不是所有扩展作者必须采用的协议。

修订理由：此前表述把期望的远端可观察性提升为项目整体前提，超出已确认产品目标。缺失的远端消费／关闭／来源事实仍限制相关声明和依赖操作，但通用认证来源、精确远端完成及新协议不是开展限定可行性评估的前提。本地失效／写入／自有 child 退出证据在实际范围内仍有效。不因此修改核心、fork、豁免安全规则或认证兼容性。本 ADR 保持 Draft；加载机制、审批覆盖、需要时的操作分离、预算和 Stop／手动退出／重载恢复仍需限定设计、证据及 Build 批准。

## 理由

Host 拥有资格及产品恢复，adapter 映射校验后的公开证据并拥有传输／进程观察，Webview 呈现有界表单并发送具名意图，pi 拥有远端执行及对话框仲裁。此分工可阻止本地旧操作，同时不虚报远端成功。缺失运行时事实应向上游所有者提出，而不是从通知推断或重做 agent 内部机制。本地提案便于审阅，不暗示上游同意。

## 考虑的替代方案

- **仅路线 1：** 必需登记但不能提供远端来源、生命周期或完成事实；拒绝将其视为充分通用兼容方案。
- **路线 2 合作作者协议：** 可能适合单独披露窄试点，但传输／控制可行性及作者合作尚未验证。本决定不启用它，也不是通用拦截器或认证机制。
- **仅路线 3：** 上游能力不能替代本地校验／生命周期政策，且依赖上游同意、发布及固定版本证据。现与路线 1 配合形成文档，不承诺交付时间。

未选择 fork、私有 API 导入、SDK 宿主切换、自动兼容 kill／restart、沙箱或任意 JavaScript／后代取消。

## 影响与剩余设计

Reference 持有本地判别、操作 coverage／证据、一次性回复预留、队列／期限及退出与丢失恢复候选；调查持有最小上游能力与可选编码。均为提案，不是 Living 实现；此处不复制字段列表。

数值预算未批准。有界近期诊断 ring 不应变成任意的 256 次交互终生停止；不复用 epoch／单调本地 ID 加 live-token 校验为候选，远端防重放保留／耗尽政策仍需解决。Host 重载恢复缺获批可观察边界及持续执行设计：纯内存本地失效不证明旧执行已结束。解决前这阻塞受影响恢复设计，不使上游增强成为项目整体前提，也不授权持久化或自动终止。

架构核对：**document first／Direction**，不是 Implementable。依据架构 §2／§4／§5 与 REQ-004/005/006/009，所有权／依赖／领域／需求／存储在提案层面 pass。契约／并发／错误／生命周期／版本已有本地候选语义，仍存在远端能力及所有权丢失 gap。安全、可观测、性能、测试及无障碍需证据；构建／发布变更在本文档切片为 N/A。既有源码及测试是测试边界，不是新增行为验证。

## 验证与接受条件

Build 前解决所选当前发行版加载／交互切片、可观察的公开 API 证据与诚实未知结果、需要分离时的未知来源接纳、数值预算／ID 保留、版本迁移、取消不合作及手动退出／重载恢复。新增远端能力或合作协议仅是实际依赖它们的声明的条件，不是通用入口要求。可见范围变化须对齐双语 PRD，并记录明确限定实现授权。可信加载及审批覆盖需独立批准。

后续证据详见本地契约与上游提案：确定性本地校验／竞态／清理；另行授权的固定公开 runtime 生命周期／结果／取消及退出／丢失测试；Windows VS Code F5 与已安装 VSIX 交互／恢复检查；审阅固定版本真实扩展。本 ADR 未运行这些新增测试。历史合成 pi 0.86.1 结果仅保留原范围。文档检查归 ACTIVE 当前交接，不能接受 ADR 或关闭 gate。

仅在维护者确认已解决决策范围且所需验证已记录后接受；分别记录批准与证据。当前不指定接受日期。

## 本轮公开 RPC 可行性证据（Prepare）

2026-09-27 UTC，实际安装 pi 0.86.1 公开 CLI／RPC 在独立无秘密 HOME／agent／cwd、offline／no-tools／no-session 下运行自有合成扩展；没有模型或外网服务调用。dist/delegated-completion-20260928/wi013-public-rpc/report.json 与 probe.log 记录：select／confirm／input／editor 的 awaited handler 在客户端 cancellation 后才发原 prompt response，且 handler 继续执行；timeout 返回默认值但不提供远端 dialog-closed；不合作 idle 命令无限等待时 abort 仍 success，原 prompt 仍未返回。进程随后由探针 owner 关闭并记录 code／signal。

这些是当前版本合成可行性观察，不是通用 command settlement 保证、真实第三方验收或选定设计。公开 rpc.md 明确 prompt response 可表示 accepted／queued／handled，不能对未知命令等同完成；cancel 也不能等同扩展代码取消。真实目标源代码、操作覆盖、受信加载和所有权丢失后的恢复仍须分别解决。本次未选择预算或接受本 ADR。


## Planned WI-013 本地交互契约

**2026-09-22 暂缓，未完成：** 保留供未来恢复，[ACTIVE](../../ACTIVE.md) 当前准备 WI-014 附件。本候选不是附件传输契约，下方尺寸不能作为全局 prompt／附件上限。

**仅候选——不是当前 version-2 allowlist、Living 契约或 Build 授权。** 维护者于 2026-09-22 选择路线 1（本地候选）配合路线 3（本地未发布上游提案）；路线 2 须另行选择窄试点。[Draft ADR 0002](../decisions/0002-interaction-contract-route.zh.md) 记录路线批准，不代表逐字段／预算接受。本文保持 Outline，上方既有受控聊天行为不变；以下仅涉及 REQ-004/005/006/009 的未来标准交互。ADR 0002 中同日后续修订以未修改发行版 pi 为基线，上游增强可选。远端缺口仅阻塞依赖声明，不阻塞整个项目。以诚实本地证据评估当前发行版切片；下方远端 close／outcome／operation 字段是条件能力，不要求每个扩展采用新协议。[调查](../archive/2026-09-22-pi-compatibility.zh.md) 持有固定 pi 0.86.1 证据及上游提案。

### 所有权与候选判别字段

以下名称描述可审阅本地 schema，不是已导出 TypeScript 类型或 pi wire 字段。Build 前须通过测试冻结精确封装、错误及版本／能力迁移，不静默扩展当前 `version: 2` 消费方。

- **Host：** 独占接纳、操作资格、内存交互 ledger、队列、本地期限、投影及恢复屏障。每项绑定 host epoch、workspace generation、runtime instance／live-session 身份、不复用的不透明 interaction ID 和当前 view revision。上游 ID 留在 adapter 内；UI ID 不授予工具权限。
- **Adapter：** 拥有校验后的传输关联、每个已接纳远端请求的一次性回复 token、方法映射及自有 child 的被动观察。它映射证据，不决定产品就绪。Host 先撤销资格，adapter 在写入前独立消费 token 防止重复调用。timer／listener／token 由创建者清理。远端对话框／执行事实归 runtime，两个本地所有者均不得虚构。
- **操作关联：** 判别联合 `association: { kind: "runtime-scoped", operationId, coverage } | { kind: "reviewed-fixture", evidenceRef } | { kind: "unknown" }`。`runtime-scoped` 要求当前连接绑定的已验证公开能力；coverage 为 `awaited-handler | registered-work | unknown`。审阅夹具仅有限源码推断，不是通用支持或已启用路线 2。未知归属不能接纳依赖可靠分离才支持的操作。Host 关联 ID 不能建立来源；不凭标题、通知、`hasUI` 或单一待决命令推断。Runtime 归属不是对共同加载可执行代码的身份认证。
- **Adapter 证据：** 独立事件判别 `interaction-opened`、`interaction-closed`、`response-outcome`、`operation-settled`、`transport-lost`、`child-exited`、`spawn-failed`。均绑定 runtime／session；操作／对话框事件另绑定相应 ID 及证据依据。只有所选远端能力提供事实时才发出 close／outcome／settlement；旧协议缺失保持 unknown，不合成事件。`operation-settled` 包含 `completed | failed | cancelled` 和 coverage，不代表所有脱离等待链工作结束。
- **Host ledger：** 独立轴为本地有效性 `queued | active | invalidated`；回复尝试 `none | reserved | written-locally | write-failed`；远端对话框 `unknown | closed` 及有证据的原因／结果；操作 `pending | settled | failed | unknown` 及 coverage；自有 runtime `connected | lost | exited | spawn-failed`。本地失效记录有界原因，如 answer-attempt、user-cancel、Stop、local-cutoff、remote-close、replacement 或 loss。记录不可恢复有效；后续远端事实可完善证据，不可重开。
- **Webview 投影：** 候选 `interactionState` 投影一个按方法区分的表单（`select` 含不透明 option ID／label、`confirm`、`input`、`editor`）、身份／view revision、排队数、`canAnswer`、有界惰性文本及证据支持状态。候选 `answerInteraction` 仅含身份／view revision 和 `answer: { method: "select", optionId } | { method: "confirm", value: boolean } | { method: "input" | "editor", text: string }`；`cancelInteraction` 仅含身份／view revision。Stop 为宿主协调意图，不是任意 RPC。当前 validator 不接纳这些新意图。否定 confirm 与取消在本地不同，即使 pi 均映射 false；普通 confirm 不能创建／复用工具授权。

### 校验、终态与顺序

1. 修改状态前校验普通对象、精确自身字段、支持的封装版本／判别、有界身份、当前工作区资格／runtime／view、活动 ledger 及方法。Select 必须属于原选项，adapter 将 ID 映射回原始精确值。Confirm 仅接受 boolean；input／editor 仅接受有界字符串，不强制转换、静默 trim 或截断（方法允许时空字符串与取消不同）。未知／多余字段、错方法、旧／重复答案无传输作用；有效但过期 UI 重新同步。序列化前再次检查答案预算。
2. Host 串行仲裁终态。回答／取消时，先原子失效并预留唯一回复 token，再 await I/O；传输及范围仍合格时尝试一次方法对应回复。Stop／替换／丢失在写入前获胜则抑制未发出的肯定回复。不确定写入不重试，回答尝试后不追加第二个取消回复。重复意图增加零次写入。保证是**恰好一次本地预留、至多一次写尝试**，不是远端恰好一次投递或执行；某些失效完全不写入。
3. Stop 先阻止新任务／接纳并失效全部活动／排队答案及覆盖的待审批，然后经支持的回复取消尚未回答的对话框，并按支持能力请求清队列／操作或 agent 取消。已写答案可能在远端获胜，Stop 不能收回；普通取消可继续扩展代码。保持 stopping 直至相关有证据的稳定结束或明确未确认失败；本地 write／drain、cancel／abort ACK、`agent_settled`、`promptInFlight=false` 或 handler 返回单独均不证明任意扩展完成。未解决前不应用 pending 设置或切换 profile／session。
4. 观察到远端 close 立即使匹配的活动／排队项失效；迟到 close／outcome 不影响其他范围。相同重复事实无害；冲突终态或必要顺序缺失令相关范围失败关闭并给出有界诊断，不猜成功。登记的对话框／子工作须得到交代，才可视 scoped operation 为 settled。顺序依赖协商证据，不为旧 RPC 虚构全局序号。
5. 视图替换递增 view revision、拒绝旧页面意图，重同步同一 host ledger，不重启期限或重放。工作区／runtime／session 替换和 provider dispose 先失效，再清 listener／timer。仅保留旧请求拒绝／诊断所需的有界证据；旧回调不能更新新身份。仍须保留草稿、不自动重放。WI-010 既有故障关闭不变，不授权以自动 kill／restart 补救 WI-013 不兼容。

候选 host 错误码区分 `invalid-message`、`invalid-answer`、`unsupported-method`、`source-unknown`、`unsupported-capability`、`overload`、`write-failed`、`transport-lost` 和 `stop-unconfirmed`，描述失败边界，不转发上游异常。无效输入不执行；不支持接纳提供限制／终端路径；过载遵循下方队列政策；写入／丢失未知不重试回复；Stop 未确认保留恢复屏障。精确 UI 文案与错误封装须在 Build 前冻结。

### 队列、计时与内存预算

一个活动表单加有界 FIFO 队列、可见数量。排队项到期／关闭后直接移除，不再呈现；出队和回复时重查有效性／期限。溢出保留已接纳项，仅经支持的回复拒绝／取消新增并告警。持续溢出进入交互失败，禁答并阻止新任务，不宣称执行已停止或自动重启。无法发拒绝时远端状态未知。

无上游期限则无统一用户倒计时，但仍可能有隐藏私有 signal。声明时长在上游输出前开始，不是侧栏显示时；收包加时长不是远端期限，也不是已证明的剩余作答窗口。收包相对本地 cutoff 须另行批准并标为呈现策略，不能延长远端有效性或替代到期证据。出队／视图重建不重新计时。远端期限元数据须明确时钟／经过时间语义，披露迟到投递。传输／Stop 稳定等待期限与用户回答时间分离；当前 prompt 响应 timeout 须在支持无限期命令对话前重设契约。

**历史未批准尺寸候选（当前选定子集见ADR 0002；本段不是Build契约）：** 一个活动加七个排队；完整 frame 64 KiB UTF-8（也限制半 frame 缓冲）、文本／答案 32 KiB、64 个各至多 1 KiB 的选项且合计符合 frame；十秒五次溢出为持续溢出候选。取较低对端预算。这些不是实现默认值或获批产品限额，仍须可用性／传输证据及批准。超大输入明确失败，不静默截断答案。诊断不含正文／秘密，使用有界错误码／计数并限速。

**防重放登记不是终生交互配额。** 先前 256 条终态建议不授权健康连接在 256 次对话后停止。候选本地策略：全新 host／runtime epoch、单调不复用的本地 ID、有界 live-token map 和有界近期终态诊断 ring；答案必须有 live token，淘汰诊断文本不恢复回答资格。计数耗尽不得回绕复用。远端 open-ID 重放须在 adapter 边界另证不复用／序列 watermark 或 tombstone 策略，旧协议任意 ID 不提供这一条件。精确保留预算、远端重复处理及耗尽策略仍是 Build 前缺口，不是已采用的重大政策或无界 tombstone 集合。

### 丢失、退出与主动恢复

`transport-lost` 表示本地禁答，远端执行未知。被动 `child-exited` 须识别精确、已成功 spawn 的 child 及实际 exit／close 详情；spawn 失败或流错误不是退出证据。Adapter 在流失败后须保留足够进程观察所有权，以观察后续真实退出。这是当前合并 loss 事件中不存在的 Planned 能力。退出仅证明自有 child 结束，不证明后代结束、副作用回滚或操作成功。

已待决且 Stop 未确认时，由 host 拥有恢复屏障：显示“未确认停止／不能继续”、保留草稿、阻止任务／设置／profile／session 转换，提供手动结束 runtime 指引。实际自有 child 退出与用户主动恢复是两个条件，单击恢复不是证据。充分边界证据加主动恢复后，替代 runtime 才可使用全新身份、受控默认、清授权且不重放。宿主重载丢失 ledger／child 所有权；新 ready 进程、PID 缺失检查或用户陈述不能解除旧工作未知。在不新增持久化或自动终止的情况下如何跨所有权丢失保留／执行屏障尚未解决，**阻塞该恢复分支及依赖它的所选切片**，不宣称纯内存状态已能实现。

### 实现／验收前所需证据

本新增内容均未运行：validator／ledger 确定性测试覆盖各判别、选项／字符串预算、旧 view／runtime／epoch、ID 复用／诊断淘汰、重复／冲突答案、Stop／回答及到期／回答两个顺序、排队到期、溢出、半 frame 与写丢失；断言无未授权作用及清理，不只调用数。另行授权的固定版本公开 runtime 测试须确立所选切片的加载／同意与受覆盖审批边界、可观察回答／取消作用、诚实未知结果、脱离等待链限制及 child 退出／丢失／重载恢复。仅依赖对应能力的声明才要求来源／scope 映射及增强终态／取消证据，不是通用认证来源或精确远端完成要求。之后仍须 Windows VS Code 侧栏键盘／焦点／主题、F5、已安装 VSIX 及审阅真实扩展；仅合成／官方示例证据不足。记录这些测试边界不产生新 runtime 能力、Accepted ADR 或 gate 关闭。
