# pi 兼容性调查

[English](2026-09-22-pi-compatibility.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-22-pi-compatibility.md](2026-09-22-pi-compatibility.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-22
- 类型：讨论
- 状态：Draft
- 创建：2026-09-22
- 权威：仅作研究上下文，不授权实现

## 当前交接 — WI-013 Paused，WI-014 Prepare

维护者于 9 月 22 日明确暂缓自定义扩展交互，不将 WI-013 标为完成，并要求依据源码核对基线、准备最小文件／选区切片。[ACTIVE](../../ACTIVE.md) 现持有唯一当前 WI-014 Prepare 提案。REQ-009 长期目标、既有文档路线批准及未决条件保留；ADR 0002 仍 Draft，不是 Accepted。不授权代码、探针、模型或凭证访问。下方旧交接是带日期历史，不是当前排期权威。

### 基础闭环核对（只读，2026-09-22）

声明依赖及已安装 manifest 均为 pi **0.86.1**。以下源码位置对应本次工作树检查，不是执行测试或不可变版本证据。

- **已实现，有限定历史验收：** 工作区资格／资源同意及启动（`src/extension/piChatViewProvider.ts:245–317`）；文本发送／流式（`:194–240,406–439`）；模型／thinking 即时及延后选择（`:66–170,386–404`）；受控工具审批（`src/extension/toolApproval.ts:24–62`）、工具／thinking 投影（`src/adapter/pi-rpc-runtime.ts:94–118`）、Stop（`piChatViewProvider.ts:365–376`，adapter `:341–353`）。既有测试包括 `resource choice starts runtime with approve or no-approve and stops on workspace change`、`sendChat streams assistant text and rejects stale runtime events`、`streaming selections replace pending intent without mutation; settled applies model then thinking`、`approval deny timeout cancellation late replies and exact session grant revoke`、`Stop holds deferred settings until cancellation completes and runtime loss fails closed`。本轮只将其作为测试源码证据。
- **未实现为产品流程：** 文件／选区捕获、预览及快照历史；可识别写入的脏编辑器保护和 before/after diff 跳转；新建／枚举／恢复已保存会话 UI。完整入站 union／validator（`src/extension/webviewMessages.ts:16–25,56–100`）、runtime 接口（`runtimeLifecycle.ts:48–62`）、host receiver（`piChatViewProvider.ts:355–481`）及 composer／timeline（`src/webview/placeholderHtml.ts:350–357,388–414`）均未提供这些操作。`toolApproval.ts` 有 canonical 路径／授权策略，没有 VS Code 文档 dirty 检查。adapter 使用 `--no-session`（`pi-rpc-runtime.ts:175`）；内存对话在替换时清空，流式处理限最近 32 条（`piChatViewProvider.ts:185–190,208–220`）。上游公开会话能力不等于产品会话功能已交付。
- **兼容仍局部：** 受控启动禁用第三方发现，仅显式加载自带审批 gate（`pi-rpc-runtime.ts:175`）；标准对话框未通用桥接（`:75–85`）。资源 flag 和原始公开 prompt 保留部分原生路径，不证明每类 AGENTS／skill／prompt 生效。已安装公开 `docs/rpc.md:43–77` 记载纯文本 `prompt.message`、skill／template 展开及异步受理，没有文本文件附件字段。host 序列化上下文文本是可行性提案，不是新造 pi 附件协议。完整资源、终端会话和真实扩展验收仍待完成。
- **验收比实现窄：** WI-008／009 空闲／延后主路径 F5 已确认，但未正式关闭；WI-010 四项 F5 仅关闭受控切片。下方历史 103/103 tests 和 WI-012 P1／P2／P3 未重跑。已安装 VSIX 激活／行为、完整审批／生命周期矩阵和整体编程闭环尚无验收，三个 gate Open。因此有用的执行中段已有，但“附加 → 执行 → 看 diff → 恢复”尚未闭合。

### 附件可行性与建议测试边界

保留 REQ-003 已确认 UTF-8 预算及独立用户正文限制。现有上限按通道不同：`chatBounds.ts:1–2`、validator `webviewMessages.ts:88–91` 将正文限为 **8,000 字符**；`toolApproval.ts:57` 将审批输入限为 **32,768 字符**；助手投影限 **65,536 字符**，不是附件容量。Planned 契约中 WI-013 的 32／64 KiB 是未批准交互候选，不是现行全局入站上限。`src/adapter/jsonl.ts:4–7,21–31` 无出站尺寸检查，接收 JSONL 限 **8 Mi 字符**，不是 UTF-8 字节。`pi-rpc-runtime.ts:305–334` 发送单条 JSON 转义 prompt，等待受理 30 秒，无 write／drain 处理。这些都不能证明 1 MiB 附件可端到端工作。

建议 host 持有快照，附件意图使用严格 shape 和不透明 ID，仅携带元数据，不接受 Webview 提交路径／正文。用户正文独立限额。将不可变、已校验文本编入公开 `prompt.message`，附相对来源／类型／原始范围／未保存元数据，使用明确分隔、转义的**不可信上下文**；分隔符不赋予执行权，也不是提示注入沙箱。Build 前在既有 reference 冻结编码与版本化附件契约，包括前导斜杠／模板展开行为，避免附件文本意外变成命令。不透传原始 RPC、不新增上游附件字段。

独立预算序列化出站 prompt（JSON 转义、元数据及正文开销）、按需预览块、有界保留快照及紧凑状态投影。不要为了附件扩大审批、助手或通用入站上限。采用专用有界上下文路径与流控，活跃会话快照存储保留实际发送完整文本，预览按需获取，不随每次 delta 重发兆字节内容。具体字节／frame／chunk／保留量及溢出导航仍为技术设计提议，不重开已定产品附件上限；能力不足就阻止该实现声明，不静默截断。活跃会话保留不能随现有 32 条投影静默淘汰快照；有界存储须有可见背压／恢复，而不是无限历史或新持久化承诺。持久化历史／恢复仍归 REQ-008／公开 API，不在 WI-014。

最高实用测试边界：经注入 VS Code／document API 的 host 意图到捕获的 `PiRuntimeLifecycle.prompt` 载荷（`src/extension/tests/harness.ts`、`runtime-chat.spec.ts`）。建议确定性夹具覆盖文档版本／dirty 快照、添加／移除／预览、整文件重确认及旧选区选择；断言发送原文／元数据、不保存／不回退磁盘、失败零发送及清理。扩展严格 validator 测试，覆盖伪造 ID／多余字段／旧 view／workspace／runtime。若 adapter framing／write 改动，则测试真实序列化／分片 LF、UTF-8／JSON 膨胀、溢出及丢失受理不重试。复用 `execution-ui.spec.ts` VM DOM 边界（`execution UI keeps incremental nodes, expansion, focus, scroll and cumulative output`；`Stop stays visible through stopping, locks approvals, preserves drafts and next-turn controls`），验证惰性预览、键盘、错误和稳定流式。这些测试／边界仅提议，未实现或运行。后续 F5 与 Windows 已安装 VSIX 须验证真实编辑器快照／传输／预览响应；Cursor 单列证据。

### WI-014 本地候选切片（2026-09-22）

**仅规划草案。** 稳定 `T014-*` ID 标识本地候选，不是新 WI、tracker Issue 或 Build 批准。[ACTIVE](../../ACTIVE.md) 仍是唯一 WI-014 Prepare／批准记录；WI-013 保持 Paused。范围仅 [REQ-003](../product-requirements.zh.md#req-003--显式编辑器上下文)，保留既有 REQ-001／002／004／005／006 路径。下列中间限制是明确的候选交付边界，**不缩减最终 REQ-003 验收**。所有建议行为检查均 **Not run**。

**WI-014 建议首片的规划前置条件已补齐（2026-09-22）：** 既有 [Planned T014-01 契约](../reference/webview-messages.zh.md#planned-t014-01-单文件附件契约)现集中拥有精确意图／投影、revision、v2 迁移、捕获／安全、编码、数字预算、传输及保留／恢复。它是实现就绪的待批准候选，不是已实现行为或 Build 授权；ACTIVE 拥有一次待决集中批准。完整 1 MiB 混合集合仍属后续验收，不从当前接收上限推断。不新增票据、预重构／框架工作或 ADR 决策。

**共同验收纪律：** 每个候选扩展上方既有 host 意图 → 注入 document API → 捕获 runtime prompt 边界、严格 shape validator 和 VM DOM tests，涉及 adapter 时补序列化／写入测试；使用 owner-local 普通 specs，不另建 runner。每片后续均需 Windows VS Code F5 **及已安装 VSIX** 的对应 UI／编辑器／生命周期证据（包括键盘、焦点、主题及适用失败）。默认无密钥替身／合成文本；真实 runtime 探针、模型／网络和凭证使用须另批，缺证据继续待验，不从 mocks 推断。不得用真实私钥或凭证文件作夹具。未来获批实现还须依测试指南运行 compile／lint／相关 tests。本轮草拟不执行这些检查。

1. **T014-01 — 安全发送单个合格整文件快照**
   - **状态：** Candidate；仅规划，批准归 ACTIVE。
   - **来源：** REQ-003 文件捕获／预览／移除／未保存／已发送内容规则；[架构 §2／4／5](../architecture/vscode-extension-architecture.zh.md)；上方基线核对及可行性测试边界。
   - **结果：** 原生显式选文件 → host 持有 TextDocument 快照 → 紧凑条目、可选完整字面预览／移除 → 单次受控 prompt → 活跃会话内查看冻结的已提交快照。包含 dirty 编辑器文本及未保存标记，不自动保存或回退磁盘。
   - **验收：** 捕获与最终提交均核对可信单本地工作区、现有普通文本文件和 canonical 归属，包括 symlink／junction 越界与 Windows 歧义路径。外部、目录、非文本、非 file、已删／不可用来源和取消选择均有明确安全结果，不附加无关打开文件。UI 仅发 allowlisted 意图／不透明 ID，不拥有路径／正文权威。在 T014-02 前，任何文档身份／版本变化均阻止发送并提供移除／重附，不宽松使用最新或旧文本。添加与最终内容均查单项 UTF-8 上限，8,000 字符正文独立计算。资格／预算／准备失败时 runtime 零提交。
   - **验收：** 所有异步检查后串行一次 host 接纳；冻结／序列化前立即复核 document／confirmation／draft／workspace／runtime 身份，之后不再异步重读文件。runtime 参数与保留历史使用同一不可变文本／元数据。不可信上下文编码处理分隔符、Unicode／JSON、slash／template 歧义，不新造 pi 附件字段或宣称注入隔离。首个可用路径即有界出站写、预览和保留快照；接纳前预留容量，满时显式阻止，不淘汰已发文本或无限增长。每个保留快照均有独立于 32 条消息投影的有界访问入口。视图重建重同步 host 附件／历史、拒绝旧页操作；workspace／资格／runtime 替换使草稿附件失效并解释、不静默携带，释放时清理监听／存储。
   - **验收：** 阻塞／准备时保留正文与附件；仅清除已接纳 draft revision，迟到响应不能清除新编辑。区分 host 接纳、RPC 拒绝／丢失受理及最终任务完成。重复发送、旧 ID／revision、准备期间 Stop／替换、写失败／丢失均不重放；已尝试投递诚实呈现，不保证远端零副作用。以捕获 payload／状态／磁盘不变断言及共同宿主检查证明。
   - **Blocked by：** 无候选依赖；仍须满足规划前置条件并获得 WI-014 明确切片 Build 批准。
   - **限制／未决：** 每条消息一个整文件；来源变化须重附，选区和多附件暂不支持。精确建议技术容量／编码现由所链接 Planned T014-01 契约拥有，此处不重复。host 提交／版本检查不是文件系统原子锁，快照不约束后续 runtime 工具读取。读取 dirty 内容不是 REQ-007 写保护／diff。

2. **T014-02 — 确认变化整文件的最新内容**
   - **状态：** Candidate；仅规划。
   - **来源：** REQ-003 整文件最新内容及重复变化确认；ACTIVE 发送事务提案。
   - **结果：** 整文件变化时暂停 Send，展示更新元数据／可选完整预览，并明确“使用最新内容”；确认仅恢复匹配 draft／document revision 的提交。
   - **验收：** 附加后编辑、确认、最终提交前再次编辑：再次确认，当前内容未确认前零发送。打开预览可选、不等于确认。重新取得最新编辑器文本，包含 dirty 内容、不保存；删除／不可用／路径变化及最终增长超限阻止整条发送。取消／确认失败保留草稿；移除／重附可恢复。覆盖异步预览／路径检查期间编辑、旧确认、新草稿编辑及 Stop／替换，断言最终发送／历史原文字节与不重放。F5／安装版查两次连续编辑和未保存标记。
   - **Blocked by：** T014-01 — 使用其接纳、revision、资格与不可变历史路径。
   - **限制／未决：** 仍仅一个整文件；不得用“发送旧整文件”替代最新内容确认。最终事务／传输／保留保护已在 T014-01，不延后到此片。

3. **T014-03 — 附加固定选区并明确处理过时快照**
   - **状态：** Candidate；仅规划。
   - **来源：** REQ-003 选区快照／原始范围／过时选择及紧凑元数据；ACTIVE host 捕获提案。
   - **结果：** 附加活跃编辑器选区 → 预览／移除 → 发送捕获文本；来源编辑后明确选择重附或发送旧快照。共用单附件槽可放文件或选区。
   - **验收：** 经 host 捕获精确选中文本／路径／原始范围／未保存状态，不接收 Webview 正文。无合格活跃编辑器、空选区、非 file／外部／已删／不可用来源均可恢复且零发送。来源编辑不能移动或静默更新已捕获文本；旧范围标为历史，不冒充当前导航坐标。旧快照确认绑定已观察来源／draft revision，再次编辑后须重新验证／选择。重附捕获新的范围／文本；可选完整预览安全呈现且不自动确认。沿用 canonical、单项／最终预算、不可变提交、revision 清空、保留及生命周期保护。并列测试文件与选区不同 stale 规则；F5／安装版查选区边界、dirty 文本、两种选择及历史标签。
   - **Blocked by：** T014-02 — 在已验证的 revision 绑定 stale UI／host 事务上增加有意不同的选区语义。
   - **限制／未决：** 总计一个附件；不含图片／PDF、外部路径、递归目录或推断上下文。发送旧快照不能绕过当前来源资格／不可用检查。

4. **T014-04 — 原子发送有界混合附件集合**
   - **状态：** Candidate；仅规划。
   - **来源：** REQ-003 单项／合计／数量上限及最终校验；上方附件可行性章节。
   - **结果：** 混合文件与选区、逐项查看／移除，一次提交完整不可变集合；否则获得可操作的整条拒绝，不漏项／截断。
   - **验收：** 在冻结技术契约内，单项恰好 256 KiB、合计 1 MiB、20 项成功；多 1 UTF-8 字节和第 21 项拒绝。覆盖 ASCII／多字节边界、正文独立 8,000／+1 字符、添加时与最终增长、混合 stale 选择、移除／缩减恢复。任一无效项阻止全部提交。覆盖最坏 JSON 转义／分隔符／元数据开销和有界 write／drain、分片 framing、写失败及丢 ACK 不重试，不放大审批／助手／通用入站预算。发送预览与全部实际提交文本一致。F5／安装版证明完整 1 MiB 路径、预览响应及模型／thinking／审批／Stop 不回归；若无另行执行批准，真实 pi 传输容量继续待证。
   - **Blocked by：** T014-03 — 通过共享事务／传输组合两种附件及不同确认规则，不并行另造竞争实现。
   - **限制／未决：** 产品上限不保证模型上下文容量。容量失败阻止此项验收，不允许降低已定上限。既有有界历史入口仍可用；多组已发送附件的进一步导航归 T014-05。

5. **T014-05 — 在长活跃会话中浏览保留附件历史**
   - **状态：** Candidate；仅规划。
   - **来源：** REQ-003 实际已发送历史文本；ACTIVE 活跃会话保留／视图重建提案，受 REQ-005 约束、不含 REQ-008 持久化。
   - **结果：** 有界分页浏览旧提交集合、按需加载完整预览，同时保持当前草稿与流式对话响应。演进 T014-01 的有界入口，不到此时才引入保留／安全。
   - **验收：** 超过现有 32 条消息投影窗口后，早先发送原文仍可达，后续来源编辑／删除不改变历史；这与未发送附件资格检查不同。不随每次 delta 重传快照正文。达到冻结保留预算时显式拒绝新附件接纳，提供主动重置会话的操作指引及明确丢失警告，不静默淘汰／自动重置。视图重建保留草稿与历史引用，拒绝旧页预览／确认／发送响应、保留新 draft revision。workspace／资格／runtime 替换及 host reload 诚实区分草稿失效、活跃会话可用性结束及不承诺持久化；待决 preview／write／confirmation 不能泄入新身份。验证有界内存／预览队列及监听清理，Stop 不发送／重放草稿。
   - **验收：** 扩展多轮 host／VM 夹具，覆盖分页、重复编辑、耗尽、重建和丢失，delta 期间保留键盘焦点／展开／滚动。F5／安装版验证长会话导航、容量指引及生命周期恢复；随后记录 T014-01–05 合并 REQ-003 验收与适用回归，区分合成、真实宿主及另批 runtime 证据。缺证据保持待验，不另开纯验证票或自动关闭 gate。
   - **Blocked by：** T014-04 — 按完整混合集合的真实保留成本验证并浏览多次提交；此前全部安全有界入口／生命周期检查仍为必需。
   - **限制／未决：** 仅当前活跃会话；不含已保存会话列表／恢复、自定义扩展交互或持久化文件。精确保留／页／块容量和主动恢复文案须在受影响 Build 前冻结，不能靠静默丢数据才发现问题。

**依赖与覆盖核对：** `T014-01 → T014-02 → T014-03 → T014-04 → T014-05`（箭头表示前置 → 依赖方）。各 `Blocked by` 仅列直接前序，无自环、环、缺失 ID 或多余传递边。串行是有意选择：这些切片演进同一 host 接纳／确认状态、UI 与 prompt 传输。T014-01 仅依赖排序靠前，不是批准／可执行；不打开并行 WI。维护者已确认颗粒度与依赖边；Build 批准仍独立待决。

REQ-003 覆盖：显式文件／选区捕获为 01／03；紧凑元数据、移除、可选完整预览、未保存／不保存及来源拒绝从 01 开始、03 特化；整文件最新内容／重复变化确认为 02；固定选区／旧快照选择／历史范围为 03；单项／合计／数量 UTF-8 最终限制与整条发送为 01／04；实际发送不可变内容及有界保留从 01 开始、长会话访问为 05。draft revision 清空、canonical 安全、Stop／替换／不重放与视图重建是首路径不变量，后续仅增加压力／规模验收，**不是延后保护**。范围外 REQ-007／008／009 及暂停 WI-013 不作为本图阻塞。

## WI-013 暂缓提案保留（2026-09-22）

**Paused，未关闭／未验收。** 从当前 WI 入口移出，是维护者优先基础闭环，不是兼容已通过。原阶段 Prepare、决策类 `adr-after-approval`、Decision `pending-adr`（ADR 0002 Draft 及 WI-010 独立 pending ADR）；`gate-webview-trust`／`gate-session-streaming`／`gate-project-trust` Open。用户可见追溯为 REQ-009.3–4／REQ-006 加载与标准交互，受 REQ-004／005 约束；PRD Draft。

**保留批准与方向：** 9 月 22 日维护者目标为未修改发行版 pi、支持现有及外部 AI 编写 pi 扩展，两者均不自动可信。路线 1＋3 保留历史文档批准；上游增强可选，路线 2 须另选窄试点。不要求通用专用作者协议，不承诺任意 TUI／全生态、内置生成器／编辑器、市场／安装 UI 或包管理交付。具体加载目标选择／校验、微小切片、Build、探针／模型、依赖、发布及提交未批准。此前 Agent 建议是单个显式选择扩展＋一个标准 confirm：列明公开加载 API、目标校验、执行前同意、受覆盖审批、拒绝／初始化失败、回答／取消／Stop／断连／手动恢复，分别覆盖现有和 AI 编写输入；合成夹具不代替真实扩展验收。报告具体必需条件与有限调整，不使整个项目等待上游。

**保留目标与范围：** 在声明发行版准备限定加载／标准交互；普通取消返回方法协议取消结果，不默认选择／批准；Stop 独立，不新增自动兼容 kill／restart。editor 无公开 timeout 选项，宿主超时策略／结果映射待定。已知不满足 Stop 的操作排除并回终端，仅在可靠区分时保留独立验证能力，否则排除整个扩展；不凭标题／`hasUI`，也不要求全局来源认证。已待决且无法确认停止时，答案失效，显示“未确认停止／不能继续”，阻止新任务，手动结束运行时后主动恢复。既有故障／关闭路径保留，不成为绕过此政策的漏洞。

**保留方案、所有权与契约：**

1. Adapter 校验并映射公开 RPC，绑定进程／RPC 身份与一次性回复／失效 token，分开自带 gate confirm 和普通交互；未知／畸形方法拒绝，不任意转发。普通 confirm 不能授权工具。
2. Host 拥有操作生命周期、待决交互与 Stop 结果，关联工作区 generation／runtime session／交互 ID。分别建模命令受理、交互结束、agent 稳定及扩展操作完成；`agent_settled`、`promptInFlight=false`、abort ACK 或对话框返回都不能单独证明空闲命令结束。取消前失效，Stop 期间拒绝任务／答案及全部迟到／重复答案。
3. UI 只投影有界惰性文本／选项，发送命名答案／取消意图。Host 校验字段／版本／ID／成员／字符串／队列预算；先比较侧栏／原生输入焦点及 editor 能力，不先重写前端。不支持／超限明确处理，不静默截断提交。
4. Host 内存投影随视图重建同步、旧视图答案失效；工作区／runtime 替换、断连、dispose 清理监听／登记。Stop 协调审批取消、交互失效、协议取消和 clear_queue／abort，等待可证完成或诚实未知；未解决时不应用 pending 设置或切换 profile／session，保留草稿、不重放／承诺回滚。
5. 手动结束与主动恢复分开：用户确认不是退出证据；自有 child 退出不证明全部后代或副作用停止。须解决可操作指引／退出观察和未知时持续封锁；当前 UI 无该流程。重建使用新代次／清授权，不静默开启可信加载。

**保留架构核对：document first／Direction，非 Implementable。** 按架构 §2／§5 与 `runtimeLifecycle.ts`，提案级所有权／依赖／需求／领域／存储 pass；交互仅内存，不引入 SDK host 或会话存储。契约／状态／并发／错误／清理 gap：adapter 仅 gate、host Stop 仅 chatBusy，受控聊天替身不覆盖空闲命令；须解决切片完成／未知、必要分离、Stop／手动恢复，不强制新增通用上游完成事件，不静默缩为不收答案 UI。安全／可观测／性能／版本 gap：通用 DTO 缺失，预算／溢出／超时未冻结，固定示例不证明通用兼容；诊断有界无秘密，不默认可信加载。测试／UX／兼容／交付 gap：审批／Stop／VM 测试不验收标准交互，真实 Windows 键盘／焦点／主题与安装包待证。本次文档提案构建／依赖 N/A，未来改动另审。

**保留验收与批准条件：** 双语目标／ADR／调查／Planned 契约／架构交接仅文档交付。Build 前明确支持操作、必要可靠分离与诚实结束证据、精确 DTO／预算／错误／恢复／呈现，同步 PRD／契约并获范围批准；无法满足必需条件就阻塞依赖切片。后续 owner-local tests 覆盖方法／取消／超时／重复／未知／错误代次、R1→R2、视图重建／断连、Stop 与审批／pending 设置交错及清理；UI 有界安全文本／键盘焦点；单独批准固定版隔离 runtime 证据，包括空闲命令取消后继续。Windows F5、已安装 VSIX、审阅固定真实扩展须区分禁止操作与独立支持能力，验证实际退出＋主动恢复前持续封锁。断言状态／副作用，不只调用。获 Build 批准后才用常规 compile／lint／test；探针／扩展／网络／模型须单独批准，Cursor 单列证据。

**保留范围外：** 当时提案不含产品／探针代码、模型／凭证访问、可信加载 UI／profile 切换、会话枚举恢复、附件／脏编辑器／diff、完整 CF 矩阵、前端工程化、SDK helper 或任意 TUI。可信加载前提须另批，受控 REQ-006 不变。WI-008／009 收尾、WI-010 ADR、三个 Open gate、安装版缺口保留，不关闭其他 WI／gate、接受 ADR 或提交。队列容量／溢出阈值／载荷预算／加载校验／重载恢复仍未决，不因暂停消失。下方及 Draft ADR 0002 的带日期批准、生命周期研究、路线修订继续作为证据记录。

## 先前交接 — WI-012 已关闭，WI-013 Prepare

维护者于 2026-09-22 明确确认最小 WI-012 探针收尾，并要求仅整理标准交互／Stop Prepare。[归档提案与收尾](../archive/2026-09-21-closed-wi-history.zh.md#wi-012) 持有历史批准／证据限制，[ACTIVE](../../ACTIVE.md) 持有唯一当前 WI-013。不授权产品代码、探针／模型运行、ADR／gate 验收或其他 WI 关闭。下方完整 CF 矩阵仍活跃，作为完整矩阵仍 Not run；P1–P3 观察不等于其全部变体通过。

本次只读代码核对：`pi-rpc-runtime.ts` 处理自带 gate confirm，拒绝其他 confirm，未桥接其他标准对话框；`abortTask` 使用 `promptInFlight`，`piChatViewProvider.ts` 仅停止 `chatBusy`。`runtimeLifecycle.ts` 与 Webview 契约没有标准对话框操作生命周期。既有 runtime-chat／approval tests 覆盖受控聊天替身，不证明空闲扩展完成。WI-013 因而提议独立操作身份／完成、宿主失效与有界类型化答案；可靠不支持操作分离、超时／载荷预算、手动退出观察／恢复及 UI 呈现仍须在 Build 前解决。agent 稳定或取消对话框不能证明扩展结束。必要验收若无法通过可靠分离实现，应报告阻塞，而非虚构兼容或新增自动 kill／restart。既有故障关闭保留；可信加载另行限定，不借本提案自动开启。

下方保留各日期研究／执行状态，其中当时的当前 WI／批准表述属历史，已由本交接和归档替代。CF 草案及剩余问题仍为活跃未来证据工作，不是实现权威。

## 方向纠正（2026-09-22）

维护者最新明确目标已归 [PRD 产品方向与 REQ-009](../product-requirements.zh.md)：使用未改核心的发行版 pi，支持现有及 AI 编写的 pi 扩展。[Draft ADR 0002](../decisions/0002-interaction-contract-route.zh.md) 记录带日期的路线修订。本节替代下方等待上游，或在通用严格远端保证与降低产品要求之间二选一的建议。路线 1＋3 是文档批准；下方上游提案是可选未来工作，不是项目关键路径，也不强制外部扩展采用自定义作者协议。

保留版本特定证据与真正未知项。本地失效、传输进度及自有 child 退出是有用且不同的事实，不是远端成功；缺精确关闭／ACK／认证来源本身不阻塞全部当前发行版支持。不满足 Stop 的操作、必要时可靠分离、加载同意／审批覆盖及失败关闭的手动恢复仍是真实约束。有限下一步是 ACTIVE 中当前发行版加载与标准交互前提提案，不再扩张推测协议或运行宽泛探针。其微小候选切片是 Agent 建议，不是已确认实现范围。此处不授权代码、执行、新兼容结论或状态提升。

## WI-013 接口补足提案（2026-09-22）

**历史路线设计，可选上游分支：** 使用下方前置条件前先读上方方向纠正。增强远端测试与字段草图仅在未来选择该可选能力时适用，不是基线交付必需条件。

**授权与结论：** 维护者明确授权 WI-013 Prepare 形成可审阅的缺失接口与可行补足方案，**仅文档，不写代码、不运行探针**。维护者随后选择路线 1 配合路线 3，路线 2 仅在另行选择窄试点后启用。本节现为**本地未发布的上游提案**；[Draft ADR 0002](../decisions/0002-interaction-contract-route.zh.md) 记录路线批准。规范本地 host／adapter／Webview 候选见 [Planned WI-013 契约](../reference/webview-messages.zh.md#planned-wi-013-本地交互契约)，本地 schema／预算变更归那里，不维护平行协议。旧研究保留证据，不赋予其增加需求的权威。路线批准不批准每个示例字段／数字、不接受 ADR、不授权 Build。统一侧栏、无统一用户倒计时、有界串行队列／溢出、可靠时按操作排除、不自动 kill／restart 等既定选择保持不变。

### 需求边界与实际缺口

REQ-004/005/009 要求诚实可观察状态、本地失效与旧答案保护、有界交互且不延长明确期限，以及受支持操作的 Stop 或明确未确认失败。它们**不要求**通用取消任意 JavaScript、沙箱、全局不可变／认证来源身份、跨进程精确同步关闭表单，或每个答案必须独立 ACK。下方生命周期事件及回复结果是**候选机制**，不是新确认的产品需求。此前把“严格到期／来源／结束保证”说成除降低 PRD 外的唯一选择过强，由本节纠正。诚实的延迟观察可以保留既定产品方向；可行性和验收仍需证据。

下方已确立的 pi 0.86.1 证据区分五项缺口：(1) 本地 adapter／host 登记与被动 child 退出暴露可在本仓补足；(2) 入站 UI 缺操作／来源上下文；(3) 缺私有 timeout／signal 关闭及答案消费结果；(4) prompt 响应不是通用操作成功，空闲命令的 `ctx.signal` 通常 undefined，不是通用 Stop signal；(5) 重载丢失自有 child handle。ID 只在操作确有所有者后解决关联，不能使未跟踪工作自动变成已跟踪。当前 gate envelope 不能认证任意共同加载扩展；再加一层 envelope 也不会修复该边界。

### 三条路线与建议

1. **本地 adapter／host ledger——必要基础，单独不足。** 本仓拥有 DTO 校验、一次性本地回答资格、视图／运行时代次、有界队列／诊断、取消顺序及独立 child 退出证据。成本可控但涉及 host／adapter／UI 生命周期测试。能与原版 0.86.1 互操作、诚实保留未知结果；不能合成远端关闭、来源或操作稳定结束。因此不是独立的通用兼容方案。
2. **自愿合作扩展协议——可选窄试点。** 合作作者可显式包装每个受支持操作，经公开 API helper 路由其对话框，拥有 AbortController，等待登记的子工作，并通过版本化、有界公开 UI／文本 envelope 发布关联结果。具名注册命令可接收取消／控制消息。这些是设计可能性，**不是已验证的传输／重入保证**；命令待决时公开 API 控制路由与丢失处理仍未知。不能拦截任意第三方 `ctx.ui`、hook、私有 timer 或脱离等待链的任务；自报来源只是提示，不是认证。成本由本仓与每位参与作者共同承担，需持续支持 schema／版本。仅作为明确披露的支持子集才保持范围，不能静默等同完整 pi 兼容；gate／审批消息不能从合作 envelope 获得权限。
3. **上游公开协议增强——建议的缺失事实所有者。** pi 应在运行时分发处赋予调用上下文，拥有对话框终态仲裁，发布操作范围生命周期并协商能力。这最直接保留标准 UI 互操作，但依赖上游同意、实现／发布与固定版本验证；不假定交付日期或接受。原有未改扩展可通过运行时拥有的 UI 路径获得对话框生命周期观察，脱离等待链工作仍需作者合作。不隐含 fork、私有导入、依赖升级、SDK 宿主切换或上游发布。

**维护者于 2026-09-22 已选择：路线 1 作为本地候选契约，配合路线 3 的本地上游提案；路线 2 仅在另行选择窄试点时启用。** 不重复探针寻找 0.86.1 不发送的字段。这是可审阅的具体补足设计，不宣称通用兼容现已可用。维护者批准路线／支持范围及后续执行，不必选择技术字段拼写。以下契约使 Prepare 可审阅；产品 Build 仍受具名前置条件阻塞。

### 本地上游提案：最小能力与可选编码

**未提交、未发布；不承诺上游同意、实现或发布。** 问题证据为下方固定 pi 0.86.1 UI 类型、`createDialogPromise`、命令分发及 prompt／abort 源码：对话框缺调用上下文，私有 timeout／signal 移除等待却无关闭事件，回复无 consumed／ignored 结果，handler 异常可被捕获，agent abort 不等于空闲命令取消。本地登记不能制造这些事实。

请求明确支持范围所需的最小公开能力：

1. **UI 生命周期与结果：** open 和终态 close 关联同一对话框，并区分答案是否赢得终态仲裁。一个关联 close 可携带结果，独立逐答案 ACK 可选。覆盖私有 signal／timeout 关闭路径及声明计时语义，不承诺瞬时投递。
2. **来源与操作范围：** runtime 分发提供调用关联及明确 coverage。等待链 handler 成功／失败与命令受理分开；仅登记／等待过的子工作才声称覆盖，未知／脱离等待链工作保持 untracked。这是归属，不是密码学来源或工具授权。
3. **合作取消：** 暴露范围取消受理及后续 scoped outcome，包含空闲命令。作者须响应 signal 并清理已登记工作；不强制取消任意 JavaScript、不保证后代结束。
4. **向后能力协商：** 在有文档的旧版本安全发现路径声明支持方法／语义，并绑定当前连接／runtime。缺发现则不发送新命令、不乐观承诺。精确发现机制仍待上游设计。0.86.1 保留已支持路径；能力缺失仅阻塞依赖它的新支持，不自动升级依赖。

下方示例中的独立结果事件、全流序号、父操作图、丰富 source hint 和详细对端预算协商均为可选机制，不是一次强制完整新协议。稳定关联、不可逆对话框仲裁、明确 coverage 及可检测连接丢失是核心语义；名称／版本整数及等价证据如何暴露可协商。重连／重放、持久化、沙箱、自动 kill／restart 及全局身份认证不在范围内。Host／adapter／UI 状态、顺序和预算政策仅由所链接本地候选契约持有。

**上游竞态验收提议——Not run：** 回答／timeout、回答／signal 两种顺序；重复及冲突 response ID；排队时迟到 close；Stop 先于回答与答案已消费；空闲命令取消清理与不合作；捕获异常与正常返回；登记子工作与脱离等待链工作；缺能力、流丢失和旧 session 消息。断言承诺范围内一个远端终态、不复活／重复副作用、明确未知 coverage、不从取消受理推断成功。执行须另行授权，产品依赖前须公开实现／发布。

### 远端编码示例（PROPOSED，不强制完整协议）

**本节全部名称都是 PROPOSED 示例，不是已有 pi 字段／命令／事件，也不是可执行实现。** Adapter 将所选远端契约映射为宿主证据；host 独占产品资格状态；Webview 仅接收有界投影和具名回答／取消／Stop 意图，不接收原始 RPC 或特权命令。不新增会话文件访问或持久化。

- **协商：** 假设的 `interaction_capabilities` 交换包含 `protocol: "pi-interactions", version: 1`、运行时签发的 `runtimeInstanceId` 与活跃会话 `sessionEpoch`、支持的方法／特性（`uiLifecycle`、`responseOutcome`、`operationScope`、`cooperativeCancel`）及 frame／文本／选项／待决上限。宿主提供不透明连接 nonce；能力证据须绑定当前连接／运行时，而非仅回显字符串。pi 拥有自身能力声明；helper 只能声明合作范围。必要能力缺失／版本不匹配返回 `unsupported-capability`，不能乐观支持。旧 0.86.1 仅继续已有受支持产品路径；协商前不发送新方言命令。协商不能提高宿主上限，也不能认证共享进程的可执行同伴。
- **身份：** host 激活时创建全新不透明 host epoch，替换工作区时更新 generation，并拥有 view revision 与 UI interaction ID。pi 在 `(runtimeInstanceId, sessionEpoch)` 内生成不复用的调用 `operationId`／`interactionId`；父操作明确或 null。host 签发 `requestId` 关联命令，`responseId` 关联一次答案意图。运行时生成 `origin: { kind, registrationId, sourceHint }` 记录分发来源；`kind` 可为 command／tool／hook／unknown。这是运行时信任假设下的操作归属，**不是对任意进程内代码的身份认证**，也不是复用工具授权的依据。未知来源保留 `source-unknown`，不凭标题、单个活动命令或通知正文推断。缺少分离依据时不允许依赖分离的操作。
- **对话框生命周期：** 提议 `ui_opened` 包含作用域 ID、方法、有界载荷及可选运行时拥有的期限元数据。`ui_closed` 包含相同 ID、终态 revision 及唯一原因：`answered | user-cancelled | timed-out | signal-aborted | operation-cancelled | operation-failed | session-ended`。仅运行时／对话框所有者发出远端原因；host 丢失／退出是独立本地证据。私有 signal 必须经过该所有者的关闭路径。期限元数据说明上游计时／时钟语义，不代表宿主精确同步时钟。观察到关闭后立即本地禁答，包括排队表单。投递可能迟到，不承诺精确时刻关闭。旧协议收包＋时长至多标为本地保守策略截止，不能当远端到期或出队重新计时；无 timeout 不增用户倒计时，也不证明不存在隐藏 signal。
- **答案／结果：** 提议 `ui_answer` 携带作用域 ID、`responseId`、预期对话框 revision 及方法对应答案或明确取消。pi 在对话框所有者处原子仲裁 pending → terminal：答案、到期、signal 或操作取消只能有一个获胜。提议 `ui_response_outcome` 返回 `consumed | already-closed | duplicate | invalid-answer | unknown-interaction | stale-session`，已知时关联终态 revision／原因。同 response ID、同内容仅重放已存结果，不重放作用；冲突复用视为无效。timeout 先赢则迟到答案不能复活对话框；答案先赢则 Stop 不能撤销其作用。host 写入前撤销回答资格，Stop 后不再发送新肯定答案。如关联关闭事件能提供相同语义，也可把结果合并其中：不强制独立逐答案 ACK。本地 write、命令 `accepted`、对话框 `consumed` 与操作 `completed` 是不同事实；即使 consumed 也不证明后续扩展工作成功。
- **操作范围：** 提议 `operation_started` 绑定调用／来源／父操作及 `tracking: "awaited-scope" | "untracked"`；`operation_settled` 报告 `completed | failed | cancelled`、有界错误码及明确范围覆盖声明。运行时分发拥有 handler scope；合作作者登记／等待异步子工作并在稳定结束前清理。脱离等待链／未登记工作为 `unknown/untracked`，不能默认为 handler 返回已覆盖。被捕获的 handler 异常必须产生失败范围结果，不以 prompt 成功推断。提议 `cancel_operation { requestId, operationId, reason: "user-stop" }` 返回 `accepted | unsupported | already-settled | unknown-operation`；accepted 仅表示接纳取消请求，**不表示完成**。范围拥有的 AbortSignal 须到达空闲命令及活动工作，作者须响应它。不能抢占任意 JavaScript；不合作仍是未确认失败，不伪造 cancelled 事件。
- **顺序／丢失：** 运行时对协商流发出单调 `eventSeq`；存在已跟踪父操作时 open 在 start 后，terminal outcome／close 共用一个仲裁 revision，登记的对话框／子工作先关闭再发 scoped settlement。host 容忍相同重复，拒绝冲突重复，序号缺口／乱序终态事实使相关范围失败关闭，不猜测。终态不可逆。断连使本地答案失效，远端结果未知。v1 不透明重连／重发命令或答案；新连接须主动恢复及全新 ID。仅视图重建同步同一 host ledger。宿主重载丢失 ledger／handle：新 ready 不消除旧工作未知，在获批可观察边界前该恢复分支持续阻塞。
- **预算／错误：** 本地数字候选、校验和防重放内存缺口由 [Planned 契约](../reference/webview-messages.zh.md#planned-wi-013-本地交互契约) 持有，不属于本上游请求。特别是 256 条诊断保留量不是获批终生对话配额；撤回默认第 256 次后停止接纳的政策假设。上游应说明有界输入、明确 invalid／unsupported／closed 结果及身份寿命。精确 tombstone／watermark／epoch 设计和对端预算协商仍可协商；有界存储不能静默允许重放。

### Build 前置条件与后续最小验收

**架构核对：document first，Direction，决策类 `adr-after-approval`。** 依据架构 §2／§4／§5 与 REQ-004/005/006/009，所有权／依赖／需求／领域／存储在提案层面 pass：UI 仅呈现、host 策略与 adapter 传输分离、pi 执行，仅临时 ledger。契约／状态／并发／错误／生命周期／版本缺口已有上述限定解决方案，但远端能力可用性与重载恢复仍是阻塞，不是 Implementable 证据。安全／可观测／性能需验证来源假设、安全有界投影、无秘密及候选预算。测试／UX／兼容／交付尚未验证；本次文档任务不改构建／依赖。已有 runtime-chat tests 和 Outline Webview 契约只是测试边界，不证明这些新保证。

路线已批准并记入 Draft ADR 0002，本地候选已归双语 reference 契约。Build 前：批准具体支持操作范围；确立公开受支持远端能力或明确有界合作契约（含控制消息可行性）；解决未知来源接纳、不合作及重载／手动退出恢复，不自动兼容 kill／restart；在双语 reference 契约中定稿 Planned DTO／错误／预算，任何可见范围变化与双语 PRD 对齐；在 ACTIVE 记录限定执行授权。可信加载／审批覆盖需独立边界批准，envelope 不是来源认证。任何确认的集成策略决策按规则记录 Draft ADR、等待验证，不能仅凭本提案 Accepted。

最小检查均 **Not run，不新增探针授权**：确定性 host／adapter 覆盖旧 view／session／ID、重复／迟到／冲突答案、Stop／回答与 timeout／回答的两个竞态顺序、signal close 延迟投递、排队到期、溢出及畸形／超大输入；断言本地失效先于 I/O、不虚报远端成功。另行批准的公开运行时证据覆盖真实结果仲裁、捕获的 handler 错误、空闲命令合作取消、脱离等待链／不合作工作、流丢失与自有 child close 区别，以及不重放／重载后不虚假恢复。观察标记／状态及清理，不只数 ACK。随后验证 Windows VS Code F5 与已安装 VSIX 的侧栏键盘／焦点／主题／失败状态及一个审阅固定版本真实扩展；官方 `timed-confirm.ts` 仍是有用夹具，**不是第三方验收**。Cursor 证据单列。

`gate-webview-trust` 需要有界 DTO／投影校验及旧视图证据；`gate-session-streaming` 需要操作／交互终态、Stop／丢失／恢复证据；`gate-project-trust` 需要加载／来源／审批边界证据。均保持 Open，WI-013 保持 Prepare，PRD 保持 Draft；新增 ADR 0002 为 Draft，不是 Accepted。本提案完成所请求的可审阅产物，不写代码、不运行运行时／模型／探针、不读凭证、不改相邻仓库、不发布或提交。

## WI-013 来源与完成边界研究（只读）

已安装 pi 0.86.1 的公开 `RpcExtensionUIRequest` 提供对话框 ID／方法／呈现字段，不提供来源扩展、命令调用或父操作。`get_commands` 的 `sourceInfo` 可过滤主动发出的命令调用，不能归属入站对话框，也不能禁用已加载扩展的 hook／后台任务。仅有一个待决命令不足以证明来源。自带 gate envelope 是受控配置内约定，不是对任意共同加载可执行扩展的发送者认证。依据：已安装 `docs/rpc.md`、`dist/modes/rpc/rpc-types.d.ts`、`dist/core/source-info.d.ts` 与当前 `approvalGate.ts`／`pi-rpc-runtime.ts`。

所检查注册命令分支会等待 handler 后才返回 prompt 成功，但会捕获 handler 错误并仍可能报告命令已处理，脱离等待链的后台任务也可能继续。这是版本特定实现证据（`dist/core/agent-session.js`、`dist/modes/rpc/rpc-mode.js`），不是已记录的操作成功结束保证。公开 prompt ACK、对话框返回及 agent 稳定必须分开观察。当前 adapter 的 30 秒 prompt 响应超时与基于 agent_settled 的状态不能直接支持空闲命令无限期等待用户输入。

宿主持有 child handle 时，Node exit／close 可证明该子进程终止。当前 adapter 丢失处理混合进程／流错误与 close，丢弃退出细节，未单独暴露被动退出确认。宿主重载会失去所有权，新运行时 ready、PID 检查或用户确认均不能单独证明旧任务停止。进程退出从不证明全部后代终止；Windows 行为仍需证据。

维护者随后批准：下一 Prepare 步骤只读选择并审查一个固定版本的真实扩展／示例源码。这是研究方向，不证明当前 RPC 足够、不自动批准允许清单，也不授权静默缩减 REQ-009。未修改产品或运行新增探针。队列／载荷具体设计不能制造已可 Build 的错觉。

### 单个固定候选 — 上游 `timed-confirm.ts`（2026-09-22）

**选择：** pi 官方扩展示例 `packages/coding-agent/examples/extensions/timed-confirm.ts`，不是独立生产扩展，也不是生态维护认证。它提供有实际意义的 confirm／select 取消和有界本地计时器，自身源码不涉及文件、shell、网络、模型或自定义 TUI。审查覆盖完整 70 行，而非仅 README 说明。本次未展开其他候选比较。

**固定来源与证据：** 上游提交 `890f920884f6d21fc7617d236ef9e1cc5d7a0ef8`（2026-09-21），其[包清单](https://github.com/earendil-works/pi/blob/890f920884f6d21fc7617d236ef9e1cc5d7a0ef8/packages/coding-agent/package.json#L1-L4) 声明 0.86.1；本地 checkout 无可用的精确 tag。本地候选与已安装 0.86.1 示例 Git blob hash 均为 `1ab86e55b21d2f7c54a03c4f7a70c2b51a9dc714`。只读 `gh api` 成功获取固定文件及该版本之前最近一次文件历史：`3e5ad67e0f325d4888f82f9b82966218eb4407f5`，2026-05-07，包 scope 迁移。这证明官方来源延续及发行包包含，不证明持续修复维护或运行兼容。相关相邻仓库源码文件无修改；未改动相邻仓库。

- **入口与作用：** [10–42 行](https://github.com/earendil-works/pi/blob/890f920884f6d21fc7617d236ef9e1cc5d7a0ef8/packages/coding-agent/examples/extensions/timed-confirm.ts#L10-L42) 仅有公开 API 类型导入，注册 `/timed` 和 `/timed-select`。每个 handler 等待一个对话框（5 秒 confirm 或 10 秒 select），发送结果／取消通知后返回。文件中没有运行时依赖导入、hook、自定义工具、持久化、进程或脱离等待链的 promise。这是候选的源码作用范围，不是 pi／加载的沙箱声明。
- **后台工作：** [`/timed-signal` 44–70 行](https://github.com/earendil-works/pi/blob/890f920884f6d21fc7617d236ef9e1cc5d7a0ef8/packages/coding-agent/examples/extensions/timed-confirm.ts#L44-L70) 创建自己的 AbortController 与 5 秒计时器，不连接宿主 Stop。先发通知，再等待 confirm、清理计时器并发最终通知。正常对话框返回会清理计时器；清理不在 `finally` 中，此前抛错可能使计时器保留到自行触发。没有 interval 或子进程。所有取消分支都故意继续发送通知；取消不等于执行终止。
- **RPC 到期可见性：** 固定版本 [RPC 对话框实现 90–160 行](https://github.com/earendil-works/pi/blob/890f920884f6d21fc7617d236ef9e1cc5d7a0ef8/packages/coding-agent/src/modes/rpc/rpc-mode.ts#L90-L160) 在 signal／timeout 时删除待决项并返回 false／undefined，该处不发送对话框关闭事件。`/timed` 与 `/timed-select` 传输 timeout，`/timed-signal` 的私有 signal 期限不传输。通知分配新 ID，不携带原对话框或操作 ID。也核对了已安装 0.86.1 RPC 的这些映射。按通知正文猜测关闭仅是候选专用启发式，不是可靠来源。
- **完成与身份：** [命令分发 1477–1500 行](https://github.com/earendil-works/pi/blob/890f920884f6d21fc7617d236ef9e1cc5d7a0ef8/packages/coding-agent/src/core/agent-session.ts#L1477-L1500) 等待 handler，但捕获错误后仍返回已处理。[RPC prompt／abort 394–435 行](https://github.com/earendil-works/pi/blob/890f920884f6d21fc7617d236ef9e1cc5d7a0ef8/packages/coding-agent/src/modes/rpc/rpc-mode.ts#L394-L435) 区分 prompt preflight 与 agent abort，不提供通用扩展操作成功／Stop 事件。[UI 类型 246–291 行](https://github.com/earendil-works/pi/blob/890f920884f6d21fc7617d236ef9e1cc5d7a0ef8/packages/coding-agent/src/modes/rpc/rpc-types.ts#L246-L291) 无扩展／调用父身份。此经审查代码的正常等待路径短，仍不能认证任意共同加载情况下的入站请求，也不能证明无关工作停止。命令目录过滤仅控制主动调用。
- **重载／会话边界：** 完整候选未注册 start／shutdown／reload hook、状态恢复或待决计时器清理 hook。上游[重载 2982–3006 行](https://github.com/earendil-works/pi/blob/890f920884f6d21fc7617d236ef9e1cc5d7a0ef8/packages/coding-agent/src/core/agent-session.ts#L2982-L3006) 发出 shutdown 并使 runner 失效／重建；这不等于取消 JavaScript 计时器。不能假设旧等待 handler／计时器在会话替换、重载或断连时结束或可靠移交。未运行生命周期检查。

**结论：** 它是 CF-04 confirm／select／timeout／取消后继续行为的具体发行版源码夹具；**产品兼容／Stop 验收仍阻塞**，不覆盖 input／editor，也不独立满足受维护第三方扩展验收目标。不是因为普通取消后通知就排除候选。短正常完成路径缩小了审查不确定性，但来源归属、Stop 竞态稳定、signal 到期可见性及被动手动退出恢复仍未解决。未安装、加载、导入、运行探针、请求模型、读取凭证或修改产品。

**最小下一步：** 保持 WI-013 Prepare，仅起草不执行的候选隔离验证提案：`/timed` 与 `/timed-select` 覆盖完成、取消、到期、Stop／回答竞态及旧 ID，`/timed-signal` 作为隐藏到期／清理的明确负例。请求任何探针授权前，分别记录哪些完成观察仅依赖固定协作源码，哪些共同加载下必需的来源能力仍不可得。不能将夹具专用加载限制视为已批准产品范围。已知不支持操作继续排除，仅可靠分离不可行时排除整个扩展。已待决而 Stop 未确认仍须 fail-closed、手动结束运行时后主动恢复，绝不自动 kill／restart。

### 生命周期证据与最小候选契约（2026-09-22 跟进）

**历史解释说明：** 上方接口补足提案替代本小节将精确到期／ACK／认证来源视为必要保证的解释，以及“较弱子集或阻塞”的二选一建议。版本特定观察及本地／远端证据区分仍有效；这些更强机制不是已确认 PRD 要求。

**结论：可明确部分契约，但按必要保证尚不可产品实现。** 宿主能撤销自身回答能力、关闭可编辑表单；当前 RPC 通常不能告知上游何时私下结束该对话框、是否消费答案、哪个操作拥有主动发来的 UI 请求。更多运行无法产生协议缺少的来源、答案 ACK 或对话框结束字段。本跟进替代上方立即准备另一隔离探针的建议：保留 Prepare，先决定有界支持契约，不靠新增执行修补协议缺口。

**本次只读证据：** 已安装 `@earendil-works/pi-coding-agent/package.json:1–3` 确认 0.86.1；包内 `docs/rpc.md:1184–1259` 说明对话框／超时默认返回；`dist/core/extensions/types.d.ts:37–41,135–136` 为 select／confirm／input 提供可选 signal／timeout，editor 没有。`dist/modes/rpc/rpc-types.d.ts:397–468` 没有来源、期限时间戳、取消事件或答案 ACK。`dist/modes/rpc/rpc-mode.js:28–29,46–86,615–625` 支持下方版本特定实现结论；这是检查依据，不是可导入的私有 API。上方官方固定源码链接及候选身份仍作为 pin，本次未重新联网。

#### 计时与证据强度

- **上游计时器：** `createDialogPromise` 先检查 signal 是否已取消（此时不发请求），注册 abort 监听并设置 `setTimeout(opts.timeout)`，之后才登记／输出请求。相对毫秒不是从宿主收包或侧栏显示开始。序列化、stdout 缓冲、传输、宿主解析／事件循环、Webview 投递及排队都会消耗时间；答案序列化／stdin 调度也需时间。双方不交换时间戳或共享单调时钟。实现按 timeout 真值判断，因此不能把任意数字规范化为虚构保证；候选仅支持审阅过且在 Node 有效范围内的正有限计时值。
- **不能精确还原期限：** 设上游于实际时间 S 设置计时，宿主于 R 收到，时长为 D。名义目标 S+D 不晚于 R+D，但传输耗时未知，收包时不能保证仍有正的回答窗口。R+D 仅是最晚名义估计，不是计时回调实际执行的上界：事件循环阻塞会延迟上游取消。宿主单调计时可避免本地墙钟跳变，不能同步上游或证明远端到期。不能把 R+D 标为权威 `expiresAt`、出队时重新计时，或推断此前答案已被接受。即使 `/timed` 也无法保证在上游到期瞬间同步关闭。
- **私有 signal：** abort 在 pi 内删除待决项并返回，不发送关闭事件。`/timed-signal` 展示了线上没有的期限。因此缺少 `timeout` 不能证明上游无限期有效。editor 无公开 signal／timeout 选项，但传输／操作丢失仍使宿主答案失效。不新增统一用户回答倒计时。
- **答案投递：** 本地 write 成功／回调或 drain 只证明本地传输进度，不证明上游收包或查到待决 ID。处理器忽略未知 ID，消费和忽略均不发 ACK。到期可能先于答案抵达。移除已回答表单是宿主转换，不是接受答案的证据；不能凭 write 成功显示“扩展已确认”。

#### 宿主已知生命周期分类

1. **确定的本地事实，不声称远端结束：** 校验后收包、本地入队／接纳、回答或取消意图、一次回复尝试、Stop／溢出／代次变化／策略期限导致本地失效。I/O 前原子禁用答案，从活动队列移除失效项并保留有界原因。Stop 禁用全部活动／排队答案；普通取消可能使扩展继续。本身份失效不可逆。
2. **确定的自有进程事实：** 观察确切 spawned child 退出后，该运行时全部请求失效，包括退出后才收到的缓冲请求。区分实际 child exit／close 与启动失败、流错误或断连；启动错误后的 close 不证明进程曾运行。不证明后代终止、副作用回滚或操作成功。当前 adapter 合并这些路径（`src/adapter/pi-rpc-runtime.ts:185–195`）；独立被动观察是未来能力，不是已实现证据。
3. **仅受限推断：** 在固定实现内，关联 prompt 响应可见证审阅命令 handler 的等待链已结束（`dist/core/agent-session.js:943–949,1062–1083`；`dist/modes/rpc/rpc-mode.js:298–319`）。success 标志不能区分正常返回与被捕获异常；`extension_error` 必须保留为失败，不能把未关联错误解释为成功完成。脱离等待链任务、hook 或 timer 会破坏整个操作完成的推断。prompt 响应丢失仍为未知，不重试命令。adapter 当前 30 秒响应等待不是用户回答期限，支持无限期交互前需单独改定契约。
4. **无可用完成证据：** notify／status 正文、新对话框、`get_state` idle、`agent_settled`、`clear_queue` 或 abort ACK 均不能关闭任意扩展操作。即使同一运行时，通知也有独立 ID、无来源／父操作；匹配正文不构成关联。传输丢失使本地答案失效，远端执行仍未知。宿主重载丢失 child handle 和登记；新代次能拒旧答案，不能证明旧进程退出。人工确认／PID 缺失检查不足以单独恢复；批准可观察恢复边界前此分支持续阻塞。

#### 受限支持与阻塞场景

**仅候选夹具推断：** 独占加载完整审阅并固定的扩展，一次一个确切注册的主动命令，确认命令解析，无运行中 agent／tool，无初始化 UI、hook、独立 timer／signal、脱离等待链任务、子进程或其他 UI 生产者，才能建立封闭环境内的来源假设。审查全部已加载可执行代码，包括自带 gate 与依赖；只指定一个第三方文件不够。待决时限制运行时／会话 reload 与切换。意外 UI／错误或前提破坏均 fail-closed。这是合作夹具的源码归属证据，不是认证来源或通用产品允许清单。

既有候选的 `/timed` 与 `/timed-select` 为等待对话框 → 通知 → 返回；只有该封闭环境下，关联命令响应才能提供最终 handler-settled 证据。它仍不揭示准确对话框结束时刻、选择是否被接受或结束原因，因此仅是严格到期／答案 ACK 验收的负例或有限夹具，不是获批支持操作。`/timed-signal` 保留为隐藏到期负例。经过审阅的无期限、无 signal、全部工作受等待的命令可避免自主到期，但此处未选择或验证新真实候选，失败／Stop 仍需明确结束证据。普通取消后只有已审阅通知本身不是排除扩展的理由，也不是原子 Stop 保证。

**阻塞：** 任意共同加载、自主 hook／UI、未经审阅异步工作、私有 signal 到期、可靠答案已接受状态，以及即时上游到期同步。命令目录过滤不能保证这些性质。操作级排除仅在上述分离真正成立时有效，否则按已有选择排除整个扩展。进程退出提供整个运行时的终止边界，不是自动 kill／restart 补救或通用操作归属。

#### 最小提议状态与验收（不是 schema 批准）

分开三个事实，避免一个含混的 `completed`／`cancelled` 标志：

- **宿主登记：** 不透明交互 ID 私下映射上游请求 ID、工作区 generation／runtime instance、可选操作关联及明确依据（`reviewed-fixture` 或 `unknown`）、方法、已校验载荷和 view revision。状态为 `queued | active | invalidated`，回答资格归宿主。上游 ID／猜测来源不赋予权限。
- **证据：** 本地失效原因（`answer-attempted`、`user-cancel`、`stop`、`local-deadline`、`overflow`、`runtime-lost`、`runtime-exited`、`generation-replaced`、`reviewed-handler-settled`）；回复尝试 `none | written-locally | write-failed`；没有独立证据则远端结果为 `unknown`。handler 状态 `pending | settled-under-review | failed | unknown` 与运行时状态 `connected | lost | exited` 分离。不编造上游关闭原因或 `accepted` 状态。本地计时留在宿主，不作为远端到期时间戳。
- **Webview 投影／意图：** 有界且按方法区分的表单、不透明 ID／generation／view revision、队列数与 `canAnswer`，以及依据证据显示“答案已发送，是否接受未确认”“回答已禁用，上游状态未知”或“运行时已退出，交互不可用”。具名回答／取消意图选择宿主登记项，校验精确字段、方法、选项成员及字符串预算。false confirm 答案与取消意图区分，即使上游两者都返回 false。不暴露原始 RPC、任意命令或推断出的扩展身份。

候选 UX 在本地失效后移除可编辑表单并保留原因，不静默抹去不确定性或显示“上游已取消”。对有期限的排队项，若相应策略获批，则沿用最初收包起算的*本地策略截止*，激活／回复前再检查，出队不重获 D，到期仅本地失效、不批准或默认作答。这只限制陈旧展示，不能满足精确上游期限语义，**未被采用为已确认需求的替代**。陈旧投影消失前表单即可禁答，宿主检查始终权威。视图重建同步宿主状态，不产生新的上游有效性。失败沿用手动退出／主动恢复，不自动 kill／restart。

**后续最小验收：** 身份／方法／视图校验及最多一次回复尝试；本地失效后不能回答（含排队到期、Stop／回答竞态及替换）；不凭 write／drain／abort ACK 显示成功；隐藏 signal 到期明确不支持；捕获的 handler 错误仍显示失败；主动通知不归属操作；区分观察到 child 退出与断连／重载未知；保留草稿，未确认 Stop 阻止新任务，不自动重试／kill／restart。夹具完成声明前须审查／验证确切封闭前提。本次这些检查均 Not run，不能替代安装版 VSIX／真实扩展验收。载荷／容量／持续溢出阈值仍是技术契约缺口，只对选定可行切片提出具体值，不作为另一轮无尽研究。

**这里唯一仍需的重大产品选择：** 是否考虑另行批准“源码审阅的受限子集＋明确较弱可观察性”，还是保留严格上游到期／来源／结束要求，在上游公开协议补足前保持阻塞。建议当前通用兼容继续阻塞，不再请求宽泛探针，也不重开侧栏、无统一用户期限、有界队列／溢出或不自动 kill／restart 的已定选择。较弱子集须明确批准 PRD／契约范围，不能用讨论记录静默重定义成功。架构仍 Direction／document first，保留契约／生命周期／来源／恢复缺口；所有权、信任边界与公开 RPC 基线不变。未改产品／探针、未导入或运行运行时／模型／网络，未读凭证。

## 补充执行结果（2026-09-22 16:20）

共同理解确认后，维护者明确批准补充代码与执行，包括无网络确定性 provider 输出。此批准替代下方历史讨论中的待执行状态，不取消真实推理／产品改动禁令。最终完整运行使用下方同一非特权 WSL namespace 命令、pi 0.86.1 和 Node v24.12.0，于 UTC+8 16:20:45 结束，exit 0，五个 RPC 与 worker 均 exit 0，自有夹具清理通过。未读取本地凭证文件。

- **P1 合成公开 API 持久化／恢复通过：** 追加完整且标注为合成的助手消息后，A／B 各生成一个保存会话，A 列表排除 B。RPC 恢复返回的不透明 A 路径，获取三条消息，包含 A 标记且无 B 标记，没有 agent／工具执行。未直接访问会话文件或生成授权。缺失路径仍返回成功空历史，真正恢复错误处理尚未验证。此结果解除合成 API 边界阻塞，不是终端生成历史验收。
- **P2 合成 provider 拦截通过：** 公开 provider 输出驱动真实 pi 循环及合成 `tool_call` hook。内置 `write` 与自定义 `fixture_write` 均观察到拒绝后文件不存在、允许后精确预期内容，以及 hook／交互／工具结果与 agent 完成事件。这证明这些夹具的 hook 机制，不证明产品自带审批协议、任意第三方扩展或真实推理。
- **P3 证据细化：** 先取消再 abort 返回 false，旧答案未影响替代请求，但扩展 JavaScript 仍继续执行。四种对话框均有请求／继续／完成观察。跨代次路由即使旧代次配新请求 ID 也被拒绝；这验证探针 ledger，不证明产品宿主或上游代次保护。待决 input 的自然 EOF 在 owner shutdown 前以 0 退出且无完成标记，不证明命令优雅取消。仅 abort 仍允许肯定答案。editor 超时仍 blocked，完整 Stop 兼容未成立。

Windows tests 103/103、Linux helper 9/9、五个脚本语法和 diff 检查通过。仅修改四个既有探针／helper／测试文件，无产品／依赖／CI 改动，无 F5、VSIX、真实 provider 或真实扩展验收。该执行时点 WI-012 尚待审阅；后续最小切片关闭见上方。既定不支持操作／失败关闭产品选择不变。下一工作需要限定决策，不自动重写前端或实现产品。

## 补充验证讨论（2026-09-22）

维护者要求整理补充方案，尤其取消语义，不进入前端重写或运行新增探针。确认选择现归 PRD REQ-009：排除已知不满足 Stop 的操作（无法可靠分离时才排除整个扩展），保留独立验证能力，不为兼容新增自动终止／重启补救。已经待决时发现失败，则使宿主答案失效、阻止新任务，并诚实提示手动结束运行时后恢复；不取消既有运行时故障处理。这是讨论选择，不是产品实现批准。

候选取消检查：对比普通取消、仅 abort、宿主先使请求失效再发送协议取消及 clear_queue／abort；观察合成扩展是否在取消后继续、迟到答案是否能到达旧／替代请求，以及是否具备真实稳定结束信号。区分宿主拒绝发送答案与上游请求终止；仅 UI 锁定不能证明执行停止。还需验证不支持操作的识别和已待决恢复路径。此处无新运行结论，确切公开路径及 P1／P2 补充夹具可行性正在只读调查。进入执行提案前须确认共同理解。

### 只读跟进：缩小阻塞结论

公开 `SessionManager.appendMessage` 接受完整的合成助手消息。所检查持久化条件依赖助手条目，不依赖真实模型调用。因此 P1 先前 blocked 仅适用于尝试过的用户／自定义消息夹具，不代表全部无模型保存会话验证不可行。建议补充：通过公开 API 创建明确标注的合成用户／助手夹具，枚举 A 并排除 B，经 RPC 恢复返回的不透明路径，检查历史／项目身份及无 agent／工具执行。这不是 provider 推理、终端生成历史或手写会话存储；运行时可行性尚未验证。

P3 的公开 `extension_ui_response` 取消可在无模型时结束空闲命令对话框。先在探针 ledger 使 R1 失效，发送取消，再 clear_queue／abort；检查取消结果、继续执行标记顺序、无第二次完成，以及迟到 R1 回复后 R2 独立性。对话框返回会继续执行扩展 JavaScript，所以有序取消／abort 不等于原子 Stop。另测先观察自然 stdin EOF 退出、再执行 owner shutdown，并明确测试旧代次路由。探针 ledger 行为不证明产品宿主已实现。这些检查不需要重定产品取消决策。

P2 仍未找到已记录的无模型受覆盖工具执行入口。公开 `registerProvider`／`streamSimple` 可作为候选：无网络确定性 provider 产生工具调用，经真实 pi 循环执行实际拒绝／允许副作用。这是合成 provider 执行，不是推理或伪造 hook；超出原批准中禁止假模型请求的范围。维护者于 16:06 确认共同理解及补充范围：P1 公开 API 合成消息持久化／恢复、P3 取消顺序／继续执行／迟到答案／自然 EOF、P2 该无网络确定性 provider 驱动真实审批。此为提案范围确认，不是执行批准：前一问题明确不自动执行。补充代码与运行仍需明确批准，不使用真实服务凭证。未运行跟进探针或修改代码。

## WI-012 执行证据（2026-09-22）

维护者于 14:59 批准 P1–P3 代码与执行，历史批准保留在[归档](../archive/2026-09-21-closed-wi-history.zh.md#wi-012)。`scripts/spikes/` 下五个独立脚本实现探针与 helper 回归，未改变产品代码、依赖、CI 或会话文件格式。下方早期 CF-01–CF-08 草案仍是更广的未执行产品矩阵；此处观察仅覆盖具名探针子集。

**环境与命令：** 已安装 pi 0.86.1、Node v24.12.0、WSL Ubuntu-24.04、Linux 6.18.33.2-microsoft-standard-WSL2。从 Windows 执行 `wsl.exe -d Ubuntu-24.04 --user nobody --exec unshare --user --map-root-user --net /usr/local/bin/node /mnt/d/Users/hex4c59/Projects/Typescript/pi-vscode/scripts/spikes/spike-compatibility.mjs`。这是 Linux 集成证据，不是 Windows pi、F5 或安装版 VSIX 验收。

**隔离：** 入口和 worker 要求映射至非特权宿主用户、无网络接口、无可用 IPv4／IPv6 路由；允许 Linux 仅用于拒绝的 IPv6 哨兵行。worker 使用白名单环境及唯一一次性 home／config／project 目录。不调用 provider、假模型、凭证命令、不安装包或运行用户扩展。最初网络隔离运行使用 WSL 默认 root；审阅发现额外权限风险后增加 UID guard，并以宿主 UID 65534 重跑。默认 root 调用现于导入 pi 前失败。这不是文件系统沙箱。正常运行观察到 worker／RPC 退出与夹具删除；强制终止 worker 不保证全部后代退出。

- **P1——部分观察／blocked：** 公开包根导入及空会话列表成功。公开创建 A／B manager、追加用户／自定义消息后 cwd 身份正确，但保存列表为零。所检查实现等待助手消息才持久化；在本轮无模型范围内，已保存会话枚举／恢复及无重放验证仍 blocked。未伪造助手记录或调用私有 flush。另测 RPC `switch_session` 到不可用路径，返回成功且消息为零：路径缺失不一定产生上游恢复错误。产品缺失会话检查不能只依赖 RPC 失败。
- **P2——部分观察／blocked：** `--no-extensions` 阻止发现合成扩展的初始化／命令；显式 `-e` 能加载。`--tools read` 下公开 active-tool 查询显示合成自定义工具被排除。实际拒绝／允许写入拦截仍 blocked：未找到已记录的无模型受覆盖执行路径。加载 hook 不证明拦截生效，未用直接工具执行或 RPC bash 替代审批证据。
- **P3——协议观察，不是完整通过：** select／confirm／input／editor 完成及普通取消返回预期值；select／confirm／input 超时返回预期取消／默认值。editor 无公开超时选项，仍 blocked。对已取消 ID 的回复未替换当前对话框答案。**待决 confirm 在 `clear_queue` 与 `abort` 成功后仍存在，并接受肯定回复。** 因而仅 abort 不满足产品对空闲扩展命令待决交互失效的要求。宿主／adapter 处理需另行限定提案，本探针不修产品。断连观察为结束 stdin 后执行有界 owner shutdown，不证明自然 EOF 取消。跨代次运行时迟到回复保护仍未运行。

**验证：** Linux 七个 helper 回归通过；Windows `npm test` 101/101（原 94 加新 7，0 skipped）。五个新脚本语法检查通过。审阅修复了静默非零 RPC 退出、有界失败输出保留、超时断言和 namespace 权限 guard。退出码 0 表示观察完成，不表示所有需求通过。请求关联、超时／失败清理与有界诊断具备 helper 证据，替身不算运行时兼容证据。不宣称 compile／lint／F5／VSIX 或真实扩展验收。文档检查结果与最终交接归 ACTIVE；gate／ADR 验收不变。

## 此前交接（2026-09-22 14:50）

维护者授权 WI-011 收尾并进入兼容性 Prepare，明确不运行探针、不实现产品功能。当时 WI-011 已归档，ACTIVE 持有 WI-012 待批准 P1–P3 提案。WI-012 后续批准／关闭现归[历史](../archive/2026-09-21-closed-wi-history.zh.md#wi-012)，ACTIVE 当前为 WI-013 Prepare。下方草案保留此前综合与完整未来夹具范围；其 WI-011 收尾前置条件现已满足，执行批准条件尚未满足。全部夹具仍 Not run，此转换不批准整个 PRD 或架构。

## 问题与当前方向

维护者看重 pi 的配置与可扩展性，不只是由 pi 驱动的聊天界面。已确认产品选择归入 [PRD](../product-requirements.zh.md)，当前工作与顺序归入 [ACTIVE](../../ACTIVE.md)。标准扩展交互与已保存会话顺序交接是候选兼容边界，不是已验证运行保证。

维护者选择先准备兼容性验证，再决定前端工程化时机。必需能力验证失败时，暂停受影响范围，凭证据重新协商需求或集成；不静默删需求或更换架构。本讨论不关闭 WI-011。

## 已检查证据

只读检查使用已安装 `@earendil-works/pi-coding-agent` 0.86.1 的公开文档与声明。没有启动运行时、执行用户扩展、请求模型或运行兼容测试。下列包内相对路径标识证据，不授权依赖私有实现入口。

- `docs/rpc.md` 扩展 UI 章节：记录了 select、confirm、input、editor 与文本展示。不传输任意 TUI 组件；`custom()` 返回 undefined，组件 widget 工厂被忽略。依赖自定义 UI 返回值的扩展可能功能失败，而非仅视觉降级。`ctx.hasUI` 不证明完整 TUI 支持。
- `docs/rpc.md` 的 `get_commands`：可发现已加载扩展命令、skills 与提示词，不是完整资源清单。交互式内置命令不等于 RPC 命令。已安装 `dist/modes/rpc/rpc-types.d.ts` 使用 `sourceInfo`，旧文档示例使用不同来源字段；实施前核对当前公开类型与行为。
- `docs/sdk.md` 与 `docs/security.md`：不同资源类别的加载与信任不同。加载扩展可能以用户权限执行代码；资源发现不能无意变成执行路径。即使加载扩展，工具白名单仍可能排除自定义工具。
- `dist/core/session-manager.d.ts` 的公开 `SessionManager` 声明：`list(cwd)` 可枚举项目会话。RPC 可切换已知保存会话并获取历史，但未记录保存会话枚举命令。SDK 辅助边界需要评估，不能顺手改变既有子进程基线。
- 已安装 `sdk.md` 的 `listAll(process.cwd())` 示例与当前签名将字符串解释为会话存储目录的语义不一致。项目列表不能照抄此示例。
- 已检查公开契约不保证运行中 TUI 接入、排他所有权或安全并发写入。在所检查会话管理／运行时模块中未发现所有权锁；这是风险信号，不是经过测试的数据损坏结论。用户确认终端已退出不是强制锁。

当前受控运行时禁用第三方发现并使用临时会话，所以既有实现不能证明新兼容目标已经可用。ADR 0001 的历史最小宿主验证不证明此扩展目标。

## 候选方案与验证需求

已检查 RPC 不支持完整 TUI 对齐。选择的产品方向为标准对话框／文本与明确披露的终端回退；会话选择顺序恢复而非运行进程接管。架构替代方案尚未决定，没有新的 Accepted ADR。

下方夹具草案将已确认 PRD 选择转为可观察检查，不是可执行实现或可行性结论。WI-011 与 WI-012 最小切片现已关闭，WI-013 仅 Prepare；后续兼容性证据再决定前端工程化时机。本次文档跟进不授权探针、模型调用或 Build。

## 范围明确的本地规格草案

### 状态与追溯

**Draft——仅整理兼容性验证准备。** 本次综合遵循 [ACTIVE](../../ACTIVE.md) 已记录的下一候选顺序，不是第二个当前 WI、兼容性实现计划或夹具执行授权。WI-013 现为唯一当前 WI，仅 Prepare；WI-012 只关闭最小探针。9 月 22 日的选择批准记录产品方向，不批准 Build。此处不分配新 WI 编号、不接受 ADR、不关闭 gate、不发布到 tracker。

主要切片为 [REQ-009](../product-requirements.zh.md#req-009--代表性-pi-兼容)，配置／资源关联 [REQ-001](../product-requirements.zh.md#req-001--项目与信任可见性)／[REQ-002](../product-requirements.zh.md#req-002--模型就绪)，可信加载与已保存会话关联 [REQ-006](../product-requirements.zh.md#req-006--执行审批策略)／[REQ-008](../product-requirements.zh.md#req-008--会话连续性)。[REQ-003](../product-requirements.zh.md#req-003--显式编辑器上下文)、[REQ-005](../product-requirements.zh.md#req-005--停止与恢复) 与 [REQ-007](../product-requirements.zh.md#req-007--修改后审查) 提供相邻兼容约束，不授权实现完整编码闭环。

证据包括上方只读包调查、[package.json](../../package.json) 当前依赖 pin、PRD／ACTIVE 已记录讨论选择，以及下方现有测试边界。上游结论沿用先前研究，不是本次草案会话重新验证的运行结果。所有 CF 变体仍为 Not run。

### 问题与预期结果

现有受控聊天不能证明扩展保留了维护者看重的 pi 配置、扩展交互与已保存对话。在选择前端工程化工作前，应形成可审阅说明：哪些必需公开集成路径可测试、什么观察足以判定成功或失败、哪些缺口需要维护者决策。本草案限定该证据范围，不承诺可行性，也不交付新的用户可见行为。

### 限定用户故事

以下概括已确认讨论选择，规范行为仍归 Draft PRD；不是新增获批 Build 故事：

- 作为维护者，我需要配置模型与已同意资源产生预期效果，错误／排除可见，而不是静默替换。追溯：REQ-009.1–2；CF-01/02。
- 作为 pi 扩展用户，我需要显式信任的命令／工具／钩子与标准交互在披露的审批和 Stop 边界内工作，不支持的 TUI 有诚实的终端回退。追溯：REQ-009.3–4 与 REQ-006；CF-03/04/08。
- 作为终端 pi 用户，我需要主动进行同项目已保存会话交接，并恢复可用历史，不重放任务、不恢复授权。追溯：REQ-009.5 与 REQ-008；CF-05/08。
- 为后续编码闭环，我需要检查附件载荷限制、可控制写入及审阅约束是否存在集成阻塞。此处仅包含可行性证据，完整附件、diff 与历史 UI 交付仍属后续工作。追溯：REQ-003/007；CF-06/07 及下方历史变体。

### 方案与职责约束

保留[架构分层所有权](../architecture/vscode-extension-architecture.zh.md)及 [ADR 0001 子进程基线](../decisions/0001-build-baseline.zh.md)。Webview 呈现有界状态与具名意图；宿主负责工作区／编辑器策略、同意、草稿与生命周期协调；adapter 映射 pi 公开操作／事件；pi 负责执行与已保存会话语义。这是沿用既有职责，不是新增接口决策。

建议证据顺序：检查公开 API 可用性与安全隔离；定义可观察成功／失败变体；另获运行批准后执行隔离合成集成路径；之后在各自获批范围内取得安装版 VSIX 与经审阅真实扩展证据。不为运行探针而先实现全部未来 UI。缺少公开会话列表路径、自定义工具拦截或脏写入保护属于待报告阻塞，不授权解析会话文件、引入 SDK helper 或替换 RPC。此类边界提议须先经架构评估与正常 ADR／批准流程。

### 测试与草案完成条件

遵循[测试指南](../guides/agent/testing.zh.md)，使用三个连贯证据边界：

- **宿主意图 → 可观察状态／副作用：** 现有 [runtime-chat 测试](../../src/extension/tests/runtime-chat.spec.ts) 通过注入运行时测试 provider，包括旧事件拒绝与 Stop 顺序。建议沿用该边界覆盖对话框／配置／会话失败转换；新增操作和替身尚不是已确认契约。断言状态、草稿保留与无未授权／重放副作用，不只检查调用次数。
- **pi 公开进程／API → 关联结果与一次性副作用：** 建议对 CF-01–CF-08 的适用部分另行批准隔离运行。现有 [controlled-environment 测试](../../src/adapter/tests/controlled-environment.spec.ts) 检查环境覆盖并保留 provider 环境，不证明隔离、可信加载或会话恢复。新增集成 harness／API 选择待确认，默认 `npm test` 不会自动收集新 e2e 通道。
- **宿主投影 → 用户交互：** 现有 [execution UI 测试](../../src/webview/tests/execution-ui.spec.ts) 使用脚本化 DOM／VM 覆盖字面文本展示、审批、Stop／草稿及旧代次。可行时沿用该边界进行确定性呈现检查；不能证明真实渲染、安装版传输上限或 VS Code 行为。Windows VS Code 安装版加至少一个经审阅且固定版本的真实扩展仍是 PRD 验收边界；Cursor 证据单列。

CF-01–CF-05 定义五类检查；CF-06/07 覆盖相邻载荷／写入／审阅阻塞，CF-08 覆盖共享生命周期失败。下方输入、操作与失败证据是测试细节，PRD 仍是验收权威。覆盖模型空态、会话／资源不可用、拒绝同意、扩展缺失、初始化／切换失败、迟到答案及中断，不只展示成功路径。

范围、需求链接、候选测试边界、排除项与未知项明确且文档检查通过，即完成本地 Draft 的可审阅交付。后续验证报告须按变体记录 passed／failed／blocked／not-run 与带版本证据；假运行／VM 成功不是安装版验收。本次不创建测试、不宣称夹具通过。此前 WI-011 收尾前置条件已满足；进一步探针或产品 Build 须在 ACTIVE 单独记录限定提案与明确批准，WI-013 目前仅授权 Prepare。

### 范围外与开放问题

不包含前端重写、框架选择、生产功能实现、依赖升级、新会话持久化、广泛生态认证、公开发布、外部发表或 Git commit。PRD 对远程／多根、并行会话、实时接管、任意 TUI 及回滚的排除保持不变。本综合不关闭旧 WI，也不接受待决 ADR／gate。

开放证据工作限定为下方公开 API／传输可行性、资源加载／优先级、自定义工具与脏写入拦截、安全故障注入／隔离、具体历史／渲染预算及真实扩展选择。活跃会话审阅保留与向前加载历史的策略已确认，具体预算／机制尚未确定。必需能力失败后须带证据提交维护者决定范围／架构；不编造决定，也不为补全草案重新询问已解决产品选择。

## 夹具草案与证据纪律

**下方所有夹具及变体状态均为 Not run（未运行）。** ID 表示计划检查，不代表已有自动化覆盖。现有模块内测试如 `src/adapter/tests/controlled-environment.spec.ts` 检查当前实现行为（该测试验证环境覆盖并保留 provider 环境），不执行这些夹具，也不证明可信加载、附件或已保存会话兼容。历史测试结果仍是历史。

另行批准运行后，使用一次性工作区 A、不相关工作区 B、隔离的 pi 配置／会话目录及经过审阅的合成扩展。排除真实凭证、继承的凭证命令、用户／全局扩展及发现过程中意外执行扩展；合成运行不访问外部网络或调用真实模型。仅 `PI_OFFLINE` 不构成网络隔离。执行前明确隔离与清理，无法隔离则阻塞。未来真实 provider 检查须另获授权并单列证据。伪造／离线回复只证明已走到的路径，不证明真实认证、推理或资源遵循行为。

通过 pi 已记录的公开会话 API 或正常终端／RPC 交互创建并保存会话夹具，通过公开 API 枚举／恢复。绝不手工编辑、解析或伪造会话文件。输入或故障无法通过支持的 API 或明确标注的测试替身产生时，记录受阻变体和缺口，不使用私有内部实现。API 选择、拦截与传输可行性仍属 Prepare 证据工作。

各变体记录：夹具 ID、确切包／宿主／VSIX 版本、配置／资源选择、输入字节、请求／会话／代次关联、有序公开事件及 UI 观察、预期与实际状态、标记有无及清理。失败证据须有界／脱敏，不含密钥。自用验收需要 Windows 本地 VS Code 已安装 VSIX 证据；F5、合成测试及 Cursor（尽力兼容、单列记录）不能替代。

### CF-01 — Provider／模型配置（REQ-009.1、REQ-002）— Not run

- **输入：** 隔离配置身份 `fixture-provider/model-a` 与 `fixture-provider/model-b`，假回复 `CF01_A`／`CF01_B`。独立变体为空列表、缺少虚拟凭证、模型不可用及切换被拒绝。
- **操作：** 发现配置模型，空闲时依次选 A、B 并检查回读；独立注入各故障，主动请求恢复。假回复始终标为假数据。
- **预期：** 所选身份与回读一致；失败有有界可操作错误，不静默替换、不泄漏凭证、不虚报成功。真实 provider 复用仍未验证。
- **失败证据：** 所选／请求／回读身份及修改／错误事件；未选身份的回复、缺失错误或泄漏虚拟凭证标记均为失败。

### CF-02 — 资源与同意（REQ-009.2、REQ-001）— Not run

- **输入：** 隔离项目 `AGENTS.md` 含 `CF02_AGENT`，skill `fixture-skill` 含 `CF02_SKILL`，提示词 `fixture-prompt` 含 `CF02_PROMPT`；另设隔离全局资源 `CF02_GLOBAL` 区分范围。不需要可执行第三方资源。
- **操作：** 比较全新允许／拒绝项目资源会话，调用指定 skill／提示词，再切项目重复。在可用时检查公开资源／上下文输出或明确标记的假 provider 输入捕获；仅模型回显不足以证明。
- **预期：** 允许的资源在支持的加载／调用路径中有可追溯效果；拒绝的项目资源按类别排除并明确显示。全局／上下文加载边界单列，同意不授予工具或扩展执行权限。缺少观察 API 是缺口，不推断成功或伪造完整清单。
- **失败证据：** 每类资源／选择的来源及标记有无、启动／切换事件及排除提示；拒绝后意外项目标记或无法解释的优先级记为失败／未解决变体。

### CF-03 — 命令、工具、钩子与初始化（REQ-009.3、REQ-006）— Not run

- **输入：** 已审阅合成扩展：`/fixture-command` → `CF03_COMMAND`，自定义工具 `fixture_echo` → `CF03_TOOL`，钩子 → `CF03_HOOK`，初始化仅向一次性 `cf03-init.txt` 写入 `CF03_INIT`。独立变体抛出 `CF03_INIT_FAIL`、`CF03_COMMAND_FAIL`、`CF03_TOOL_FAIL` 或 `CF03_HOOK_FAIL`。受覆盖内置写入向 `cf03-write.txt` 写 `CF03_WRITE`。
- **操作：** 分别允许／拒绝资源启动受控配置，检查发现过程不加载扩展。拒绝可信加载同意，再于独立空闲场景确认同意及覆盖警告。调用命令／工具／钩子及失败变体；先拒绝后允许受覆盖写入。在写入一次性初始化标记后注入初始化失败。
- **预期：** 受控／拒绝信任运行不产生第三方初始化／命令／工具／钩子效果。可信加载仅在同意后可产生 `CF03_INIT`；受覆盖调用仍询问，拒绝不得产生 `CF03_WRITE`。自定义工具可用性与审批拦截须验证，不能由加载推断。失败明确呈现、不虚报成功；切换失败未就绪，不宣称初始化回滚。扩展内部执行不属于通用审批保证。
- **失败证据：** 各阶段前后的标记文件／计数器、命令／工具可用性、审批决定及关联错误。受控初始化标记、拒绝后写入、隐藏失败或自动批准待决调用均失败；不支持自定义工具覆盖则记兼容缺口。

### CF-04 — 标准 UI 与终端专用 UI（REQ-009.4、REQ-005）— Not run

- **输入：** `/fixture-dialog` 分别发起 select（`CF04_RED`、`CF04_BLUE`）、confirm、input、editor；返回 `CF04_RESULT:<value>` 或 `CF04_CANCEL`，普通取消后输出 `CF04_CONTINUE`。文本展示含字面量 `<script>CF04_UNSAFE</script>` 及 `CF04_TEXT`。另设已知依赖 custom 返回值的 TUI 夹具。
- **操作：** 完成每种标准交互，再分别关闭／取消、触发协议支持的超时、Stop 和断连。保留 R1 回复，使其失效后打开替代 R2（包括新运行时代次），再通过标注的测试替身投递旧 R1 回复。独立执行已知 TUI 专用夹具。
- **预期：** 返回确切值或协议取消结果，不默认选择／批准。普通取消允许扩展主动输出 `CF04_CONTINUE`，不等于 Stop。Stop 使待决请求失效、清续跑并等待稳定结束或明确失败；迟到 R1 不能完成 R1 或 R2。超时／断连不批准。文本无执行性且有界。已知不支持 TUI 明确限制及终端路径，不模拟成功结果；不承诺自动识别全部不兼容。协议之外的扩展代码可能继续，记录此限制，不保证终止。
- **失败证据：** 请求 ID／代次、取消／超时／Stop 顺序、回复次数、UI 状态及不安全文本展示。接受旧回复、默认答案、Stop 后协议覆盖续跑或伪造 TUI 成功均使对应变体失败。

### CF-05 — 已保存会话与扩展缺失（REQ-009.5、REQ-008）— Not run

- **输入：** 通过公开方式创建／保存工作区 A 的会话 A，含对话 `CF05_HISTORY`、历史 `fixture_echo` 结果 `CF05_TOOL_HISTORY`、支持的结构化数据、超长文本及字面量 `<script>CF05_UNSAFE</script>`；工作区 B 另有会话。历史授权通过正常批准交互获得，不注入会话记录。
- **操作：** 退出终端、要求退出确认，列出 A 已保存会话并主动恢复 A；移除合成扩展后重复。取消退出确认；请求不可用会话；无公开故障路径时用标注替身注入恢复失败。尝试新对话及按当前能力继续。
- **预期：** 仅当前项目选择，恢复对话／项目身份，默认受控并重新授权；不恢复代码状态、不重放任务、不暗示独占锁。扩展缺失历史使用安全有界的通用名称／状态／文本／结构化展示，标明截断／不支持，披露可识别缺失，允许支持的续聊，不自动加载／安装或声称缺失工具成功。上游恢复失败进入明确未就绪／恢复状态，不伪造历史。UI 上限不重定义 pi 恢复的模型上下文。
- **失败证据：** 公开列表／恢复结果、项目身份、历史展示及重新审批；意外选择 B 会话、执行历史代码、重复任务、静默加载或隐藏恢复失败均失败。

### CF-06 — 附件预算与内容变化（REQ-003）— Not run

- **输入：** 纯文本，无 BOM／换行（除非纳入计数）。重复 262144 次 `A` 恰为 256 KiB，追加 `B` 为 +1。多字节等价：重复 87381 次 `界` 加 `A` 恰为 262144 UTF-8 字节，追加 `B` 为 +1。四个恰达上限附件合计 1048576 字节（1 MiB），增加第五个 `B` 为合计 +1 且各项仍合规。另测 20 个一字节附件与 21 个。包括低于上限变体、磁盘 `CF06_DISK`／未保存 `CF06_EDITOR_V1` 的整文件，以及附原始范围的选区快照 `CF06_SELECTION_V1`。
- **操作：** 添加／预览／移除各边界组合，发送时复查。整文件改为 `CF06_EDITOR_V2`，确认最新后发送前再次修改；将原本合规内容增长至单项／合计超限。修改选区来源／范围，分别重附加或明确发送旧快照。另测删除／来源不可用，保留无关打开编辑器。
- **预期：** 其他条件有效时接受恰达／低于上限；任何 +1 字节或第 21 项均在添加／发送检查阻止整条发送，提示缩小，无截断／漏发。计 UTF-8 文本而非代码单元，正文限制独立。整文件变化暂停并要求明确确认最新内容，再次变化重新校验；选区按明确选择保留或替换固定快照，不将旧范围伪装为当前范围。紧凑路径／类型／范围／大小／未保存／陈旧状态及按需完整预览，不强制预览、不自动保存、不替换旧磁盘或附加无关文件。历史保留实际发送内容。
- **失败证据：** 精确字节／数量计算及捕获的发送附件载荷（仅合成）、确认／版本顺序、不变磁盘及历史快照。部分发送、误计量、未经确认内容或静默替换来源均失败；传输／渲染能力在实际执行前仍未验证。

### CF-07 — 脏编辑器保护与诚实差异（REQ-007）— Not run

- **输入：** Git／非 Git 变体。`target.txt` 磁盘为 `CF07_BEFORE`，未保存缓冲区为 `CF07_USER_DIRTY`；另一文件有既有用户修改 `CF07_PREEXISTING`。受覆盖写入请求 `CF07_AGENT`；另设已审阅的一次性 shell／可信扩展及并发用户修改 `CF07_SHELL`／`CF07_CONCURRENT`。
- **操作：** 脏状态尝试可识别可控制写入；用户明确处理缓冲区后按正常审批重试。审阅实际前后差异与跳转，再比较混合修改变体。
- **预期：** 阻止受控脏写入，不自动保存／覆盖用户修改；处理后获批写入可按已经应用审阅。区分工具报告目标与观察到的工作区变化，保留既有修改并披露 shell／并发归因限制。Git 相对 HEAD 不证明任务独占；非 Git 仍需相关文本 diff。不自动 reset／stash／回滚，不承诺完整绕过保护。
- **失败证据：** 缓冲区／磁盘快照、写入／审批顺序、diff 标签／内容及跳转目标。丢失脏缓冲区、隐藏既有修改或对混合观察声称任务独占归因均失败。无法拦截是阻塞，不豁免保护。

### CF-08 — 生命周期、配置与失败恢复（REQ-005/006/008/009）— Not run

- **输入：** 活动任务 `CF08_ACTIVE`、排队续跑 `CF08_QUEUED`、待决受覆盖审批／对话框 R1、活跃会话授权、草稿 `CF08_DRAFT`、已保存对话 `CF08_HISTORY` 及已完成一次性副作用 `CF08_DONE`。
- **操作：** 忙碌时请求配置／会话切换，显式 Stop 并等待；测试无法稳定结束／断连、替换失败及主动重试／重启。另测仅视图重建、一轮完成、同一运行会话 Stop，然后新建／切换会话、工作区变化、运行时重启及宿主重载。失效和替代 R2 后投递旧 R1 答案／事件。
- **预期：** 不忙碌切换、不隐藏任务、不自动重放或 Stop 后执行排队任务；停止中保持至稳定结束或明确关闭失败。配置切换保留已保存对话／草稿、清授权、可信加载需明确同意，不保证扩展临时状态。切换失败未就绪、保留草稿／历史、禁止发送，主动重试或重启受控配置；不撤销 `CF08_DONE`。同一运行会话的视图重建／一轮完成／Stop 保留有效授权及配置，但 Stop 使待决请求失效。新建／恢复／重启会话重置授权与默认受控；旧回复不授权替代任务。崩溃明确中断并保留未发送输入。
- **失败证据：** 有序生命周期／状态／关联记录、授权检查、草稿／历史及标记计数。重复任务／副作用、迟到授权、静默回退、重置后继承授权或虚假回滚声明均使对应变体失败。

## 剩余决策与证据工作

第十三轮已在 PRD REQ-007／008 确认呈现策略：差异仅保留于活跃运行会话，文件后续编辑后保留历史差异，向前分批加载历史，附件恢复限于公开 API 保留的信息。具体分批／渲染预算仍需性能证据。CF-07 补充侧栏重建与运行时／会话替换、文件后续编辑对比；CF-05 补充超长历史向前加载、原附件文本可用／不可用分支。验证不可用提示，不以当前文件替换历史快照。这些变体均未运行。取消语义、缺失扩展的通用历史、附件预算、配置切换及工作顺序已在 PRD／ACTIVE 解决，不再重复提问。具体 API 集成、资源优先级、自定义工具拦截、超时／故障机制及安装版传输上限需要证据，不是猜测式产品回答。

**真实扩展选择仍是待完成的证据收集：** 找出至少一个维护中的扩展、固定版本、审阅初始化／网络／依赖行为，并在获批安装版 VSIX 运行前提出映射上述类别的具体成功／失败检查。维护者现在无需指定扩展。不宣称任何候选兼容，合成通过不能单独满足要求。必要 API 缺口须带证据返回范围／架构协商；此处不改变 ADR／gate／PRD 状态。
