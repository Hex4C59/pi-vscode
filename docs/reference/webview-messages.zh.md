# Webview 消息（工作区、聊天、模型设置与受控执行）

[English](webview-messages.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[webview-messages.md](webview-messages.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-29

- 类型：Reference
- 状态：Living
- 创建：2026-09-19
- 契约 ID：`contract-webview-messages`
- 所有者：扩展宿主（`src/extension/`）；UI 发送方位于 `src/webview/`
- Gate：`gate-webview-trust`（Accepted，ADR0004）

> 连通性、工作区选择、宿主拥有的 pi RPC 子进程（WI-007）、纯文本聊天（WI-004）、模型／thinking 设置（WI-008／WI-009）及受控执行（WI-010）。不暴露密钥、Webview 内 pi SDK、文件系统访问或通用宿主操作。三项信任／会话 gates 已在 ADR0004 的明确证据与排除项内接受。

## WI-077 文字队列增补（Living；已记录 F5 与安装 VSIX）

已批准 REQ-004／005 切片见 [PRD](../product-requirements.zh.md#wi-077-已批准切片--文字-steeringfollow-up-与取回pi-gap-01)。Chat-only 意图与 `queuedTextState` 已进入 Living v3 白名单（类型、宿主校验器与浏览器 host-message 解析）。Chat provider 在 runtime ready 后接线 `QueuedTextSession`。生产 UI 在任务运行中挂载 Steer／Follow-up、pending／recovery 面板与 recall／use／discard 意图。浏览器 280 px en／zh／主题／键盘，以及隔离安装 VSIX 与 macOS F5 的 Steer→Stop→Use in draft 已记录；[WI-077 验收](../archive/2026-10-02-wi-077-acceptance.zh.md)。

- 仅 chat 命名意图：`queueChat {draftRevision, mode: "steering" | "follow-up"}`、`recallQueuedText {queueRevision}`、`useRecoveredText {id, draftRevision}`、`discardRecoveredText {id}`。沿用精确 v3 字段、generation／view／不透明 ID 校验；设置页忽略全部四项且无副作用。宿主读取已确认草稿，不接受 UI 提供 prompt 或 RPC 名。每次 ledger／快照发布变化推进 queue revision，阻止过期 clear。
- 宿主 `queuedTextState` 使用当前信封、单调 revision、变更阶段（`idle | submitting | recalling | stopping`）、固定错误码、公开待处理快照（含 attribution／reusable 的 `steering`、`followUp`）和有界本地恢复项（不透明 ID、mode、status、可选 literal text）。投影沿用凭据展示保护；拒绝／敏感上游文字标不可用，不暴露原文，也不提供改写后的恢复文字。不适合展示／复用的完整无损文字仅留宿主。
- 宿主草稿 owner 在队列准入时同步读取／预留／清除精确已确认 revision，不设第二草稿 owner。迟到投递不清除较新编辑。协调器拥有执行／身份／Stop，组合有界内存 queue ledger；adapter 拥有公开 `steer`、`follow_up`、`clear_queue`、`queue_update` 和已消费 user message 翻译。无通用 RPC、session 文件读取或持久 ledger。
- 队列发送使用一次性 token、单次 write、expected runtime session，沿用五秒 write／drain 和三十秒 ACK 预算。不复用普通 prompt occupancy：队列 ACK 不能释放活动任务。write 前任务已结束则拒绝该尝试，不隐式改为 idle prompt。Stop 同步封闭新发送，在既有共享五秒观察预算内等待在途尝试结束后 clear。超时进入既有不确定 runtime 恢复，不新增无界等待或重试。
- `queue_update` 是两组 string arrays 的公开待处理快照，不是消费回执。校验 text content 后才翻译匹配的公开 user `message_start`，按本 live session 的重复数量关联。ACK、队列移除与消费分别记录。文字关联有歧义（含两队列相同文字）时本地归属保留未知；外部／不可归属项明确标注，不声称由 UI 发送。未知／损坏／超大数据不得伪造空队列或取回成功；固定诊断 fail closed，不在日志记录文字。
- 显式取回与 Stop 共用一个 clear owner。根据有界已观察快照，在破坏性 clear 前预留无损恢复容量；容量／不可归属数据缺口拒绝显式取回。Stop 容量失败不静默丢弃恢复，而是显示未确认 Stop 与既有安全恢复。校验 clear 两数组后才记录确认取回；clear 期间的空 `queue_update` 不把文字标消费。先保留确认 clear 内容再 abort，后者失败不抹掉前者。clear 超时保留本地文字未知，迟到旧 session 回包不改新 runtime。
- 视图重建重新投影 ledger，关闭视图只取消未提交的 view 工作。断线保留本 generation 本地恢复与未知事实。New／Restore／profile／资源替换补 PRD 丢失警告，仅提交交接后清理。工作区身份变化沿用草稿失效规则，撤销旧能力，不把旧队列文字投影到新项目。Provider dispose 释放 ledger／订阅／计时器，无自动重发。

**局部 adapter 实现（WI-077 Build）：** `RuntimeEvent` 已新增仅宿主 `queue_updated {session, steering, followUp}` 和 `user_message_started {session, text: string | null}`。实际 JSONL 入口原子校验两队列，保留顺序、空项和重复数量，合计最多 32 条／256 KiB UTF-8。无效／超量快照按既有不确定 runtime 路径撤销连接，不投影空队列，也不 kill 自有 child。有界 text-only user start 保留 literal 文字（string 或 text blocks）；合法混合附件或超过 8000 UTF-16 单位只投影 null 关联文字，不截断指令。Start 只说明进入对话，不证明本地尝试归属或执行成功。原始事件仅留宿主，不直接转发 Webview 消息，不释放 task occupancy；message end 不重复消费。退役 reader 与替换 session 保持隔离。

**局部 Stop adapter 契约：** `abortTask(onQueueCleared?)` 现用相同两数组／数量／UTF-8 parser 校验成功 `clear_queue.data`，在发送 abort 前恰好调用一次同步、仅宿主 callback。投递前再次校验既有五秒观察预算；失败、损坏、超限、断线或超时 clear 不伪造取回，也不继续 abort。Callback 抛错使 Stop fail closed；已确认 callback 文字不因随后 abort 失败而撤回。按 session 的 Stop lease 独立于 `agent_settled` 阻止重复破坏性 clear；任务结束不再释放 Stop 准入 fence。旧 session 回复不向替换 runtime 投递。Chat provider 在存在 `abortTask` 时经 `QueuedTextSession` 传入恢复 callback；生产 UI 已挂载取回／恢复控件，浏览器／真实宿主验收仍未完成。

**局部显式取回 adapter 契约：** `recallQueuedText(expectedSession, onQueueCleared)` 清两队列，但不 abort、不释放任务占用。必填同步 callback 接收共享有界校验结果；调用者必须在准入前预留恢复容量。当前 gate／session 校验和共用 queue-control lease 在 write 前拒绝过期或并发 recall／Stop；竞争失败的 Stop 明确未确认，不自动重试。Recall 仅在单次 clear 在途期间封闭新准入，结束后移除自有 fence，不改变活动任务占用。沿用五秒控制观察预算与相同的迟到／损坏／断线 fail-closed 路径，不诊断原始文字。[传输组合测试](../../src/adapter/runtime/rpc/tests/runtime-protocol.spec.ts)生成 `dist/wi077-explicit-recall/report.json`，验证不 abort、重复文字和 occupancy 行为。这仍是未接入的 host-only API，不是 Webview 意图或产品恢复能力。

**局部队列发送 adapter 契约：** `prepareQueuedText(text, mode, expectedSession)` 为公开 `steer`／`follow_up` 返回一次性 token。write 前要求当前已验证 session、活动 agent、无 Stop／clear fence，且本 session 无队列 write 在途；无效／空白／超过 8000 UTF-16 文字拒绝，不降级 idle prompt。原文不改写序列化；首次 send 即消费 token，拒绝也不复用。独立 write owner 分别观察 ACK、callback 与必要 drain，以 monotonic deadline 执行五秒 write／drain、三十秒 ACK；队列 ACK／拒绝不改变普通 task occupancy。Unknown 仅按既有不确定恢复撤销当前连接，不重试、不 kill child。Stop／recall 同步封闭新准入，在既有控制预算内等待在途尝试后才 clear；在调用 `onAttempt` 前已发布在途 owner，重入 Stop 不能先 clear 再队列 write。清理 reply watch、timer 和 stream listener。[传输组合测试](../../src/adapter/runtime/rpc/tests/runtime-protocol.spec.ts)生成 `dist/wi077-queued-send/report.json`，并验证 Stop 顺序／重入、延迟 timer 的预算边界。该 host-only API 尚未接 UI；公开前仍须宿主草稿／凭据／附件／slash 准入、容量预留和 ledger 关联。

**队列生命周期 guard（局部 adapter）：** 在同步宿主 `onAttempt` 后、physical write 前再次校验自有 session／活动 agent。任务结束以 `not-sent` 拒绝；runtime 撤销后不再向退役 stream write。在途队列观察有独立 connection／session owner 的 fence：`agent_settled` 不放开尚待 queue ACK 时的直接／prepared 普通 prompt、model mutation 或 checkpoint restart；完成只移除 queue fence，不把 agent／task 标结束。该连接在 queue 观察未完成时 release，即使任务已结束也保留 uncertain，不记录 idle handoff。Transport composition 生成 `dist/wi077-queued-send/fence-report.json`；仅合成准入证据，不是 provider recovery 或产品验收。

**断线与 scheduled timer 证据（局部 adapter）：** queue observer 的 retirement hook 独立于一次性 reply watch。Release 按自有 connection 身份捕获它（loss 可能已清零 active session），先 detach 再退役 callback／drain／ACK 观察。因此 ACK 前或早期 ACK 后断线都立即返回 unknown 并清理 listener／timer；旧 callback、ACK 与 timer tick 不会 fault 替换后的 runtime。Composition 生成 `dist/wi077-queued-send/disconnect-before-ack.json` 与 `disconnect-after-ack.json`。另用受控时钟执行五秒 write／三十秒 ACK timer handler；Stop 五秒 queue-wait 过期不 clear、不 abort，不伪造 recovery callback（`stop-budget.json`）。这些仅注入内存 transport 和 mocked monotonic／setTimeout schedule，不是实际耗时、host ledger／UI 或真实 pi 验收。

**控制／model 与传输边界（局部 adapter）：** Stop／recall 的 clear 观察在途时，model／thinking mutation 保持 fence，即使任务自然结束；控制结束后恢复准入。两项 composition 先复现旧行为过早 mutation，再验证既有控制 fence 纳入 model 准入（`dist/wi077-queued-send/` 下 `stop-model-fence.json`、`recall-model-fence.json`）。另做既有行为 characterization：idle／settled／stale-session／空白／超长／invalid mode 不触发 attempt callback 或 idle fallback，8000 UTF-16 Unicode 原文接受，token 消耗后拒绝复用，RPC 拒绝、command／success 畸形、stream throw／callback error／error event。生成不含 prompt／raw error 的 `admission-*`、`protocol-*`、`stream-*` JSON 报告。仅 public adapter 加注入 transport，不是 host draft／容量／敏感文字准入、真实 pi 或 UI 验收；多数 characterization 边界在改行为前已 pass。

**本地 host delivery 保留（局部，未接线）：** `QueuedTextDelivery` 接受未来 draft coordinator 提交的 session-scoped 纯文字，在一次性 callback／write 前同步预留本地记录与 UTF-8 bytes；pending、ACKed、rejected／unknown 本地文字共用 32 条／256 KiB，ACK 不释放记录。容量拒绝不提交 draft callback、不 write／驱逐；可识别凭据复用既有共享 detector，leading slash、invalid／空白／超长文字或 mode 在保留前拒绝。Adapter 在 callback 前拒绝只释放未提交预留；callback 后 `not-sent` 仍保留原文，因为草稿可能已提交。Host-only snapshot 不是 wire DTO。Host→真实 adapter 配注入内存 JSONL composition 在 `dist/wi077-host-delivery/` 生成安全报告。Provider／DraftSubmission 接线、外部队列／clear 预留、归属、显式 recovery use／discard 和 commit 后 session-handoff 清理仍缺失；该保守本地保留不是完整 ledger 或产品验收。

**Host ledger 容量与归属（经 provider session 接线）：** `QueuedTextLedger` 拥有本地保留（经 `QueuedTextDelivery`）、上游 `queue_updated` 待处理投影与 clear 恢复共用的内存额度。clear 预留相对已保留本地／恢复文字同步加算；容量拒绝不改记录，也不 clear、write 或驱逐。两队列同时出现相同文字，或一次消费对应多条本地匹配时，本地归属标 unknown 并保留重复数量。未匹配的上游待处理文字标 external，不声称由 UI 发送。凭据类 clear 输出仅宿主保留为不可复用（`unavailable`），恢复投影省略原文；普通 clear 文字仍可复用。Composition 报告在 `dist/wi077-host-ledger/`。Provider `QueuedTextSession` 发布投影并处理 Stop／recall；生产挂载的 pending／recovery 控件已接线。

**草稿准入与 clear 串行（经 provider session 接线）：** `DraftSubmission.admitQueuedText` 同步准入精确已确认 revision，不设第二草稿 owner。拒绝过期／忙碌草稿、附件、空白／超长、首部 slash 与可识别凭据；`commitAttempt` 仅在该 revision 仍当前时清除，较新编辑得以保留。`applyRecoveredText` 仅把可复用恢复写入无附件空草稿。`QueuedTextCoordinator` 将该准入与共享 ledger、单一 clear owner 组合：queue 发送、recall 与 Stop 互斥 mutation 阶段；recall 期间重叠 Stop 以 busy 拒绝，不第二次 clear／abort。clear 前预留容量；确认 clear 后提交恢复；`useRecovered`／`discardRecovered` 与 `queuedTextState` 投影已具备宿主侧能力。Living 解析与设置页无副作用证据在 `dist/wi077-draft-queue/`。Provider 与生产挂载队列控件已接线；浏览器／真实宿主验收仍未完成。

**证据与余项：** [传输组合测试](../../src/adapter/runtime/rpc/tests/runtime-protocol.spec.ts)在旧实现先失败，再用注入内存传输验证这些事件／边界。Living 意图、provider 接线与生产挂载 Steer／Follow-up／recall／recovery UI 已交付。2026-10-02 已记录浏览器 280 px en／zh／主题／键盘、隔离安装 VSIX 与 macOS F5 的 Steer→Stop→Use in draft（锁定 pi 0.86.1＋合成 provider）；[WI-077 验收](../archive/2026-10-02-wi-077-acceptance.zh.md)。这些宿主未单独点击 Follow-up；活断线与 320／400 宽度未再取证。附件与 slash 展开仍在本切片之外。不接受 gate。

## WI-078 作曲区命令发现

**Living；菜单切片于 2026-10-02 依据持续 goal 接受。** [限定验收与限制](../archive/2026-10-02-wi-078-acceptance.zh.md)含 composition、浏览器、真实 pi、macOS F5／安装 VSIX 的裸／后缀补全。已批准 REQ-004／009 行为仍归 [PRD](../product-requirements.zh.md#wi-078-已批准切片--作曲区--命令发现pi-gap-02)。设置页不准入 chat 补全，PI-GAP-02 实际加载报告仍停车。

- 版本特定来源：实际 pi 0.86.1 RPC 与公开 `SlashCommandInfo`／`SourceInfo` 类型使用 `sourceInfo`，`extensions.md` 已说明（安装的 `rpc.md` 示例仍写 `path/location`）。adapter 校验仅宿主持有的元数据，将 `scope: user | project` 映射为粗粒度位置；`temporary` 不猜成自定义路径而省略位置。旧文档形状 `path/location` 仍可解析。`sourceInfo`、`baseDir`、包来源和资源路径均不跨 Webview 边界。RPC 实际返回的 inline 注册命令（如 `llama`）不是虚构 TUI 命令。隔离真实 runtime 已验证 Controlled 拒绝／同意资源、Trusted 显式夹具注册和替换回拒绝；四个子进程退出与夹具删除均已观察，没有供应商调用。随后显式 prompt 给无副作用夹具命令已 RPC-accepted 并保留参数；发现本身没有执行该 handler。

- 宿主在 Controlled 与 Trusted 配置下 runtime ready 后，以及提交的 runtime／session 替换后，从公开 `get_commands` 刷新有界快照。Adapter 翻译 RPC；宿主拥有校验、世代与展示过滤。UI 不调用 RPC、不发明名称。
- 入站仅 chat 意图（精确 v3 信封）：`completeCommand {draftRevision, name}` 只替换精确已确认草稿的首部 slash token，保留参数／空白后缀原文。裸补全追加恰好一个空格，不推断是否需要参数。`get_commands` 不提供参数元数据；补全不发明参数值。宿主只对照当前快照匹配 `name`；未知／过期名称拒绝且不改较新编辑。补全不发送、不入队、不展开。打开／过滤菜单是对最近已发布投影的本地 UI。没有准入 `refreshCommands` 意图；刷新发生在 ready／替换时。
- 宿主 `commandCatalogueState` 使用当前信封与单调 revision：`status: loading | ready | empty | unavailable`、`error: null | unavailable`、最多 512 行 `{name, description?, source: extension | prompt | skill, location?: user | project | path}`。名称非空、≤200 UTF-8、无空白或 `/`；凭据形状的名称使发现不可用。描述可选，先按既有宿主规则打码凭据再限制到 ≤500 UTF-16；含路径的可选描述不展示。非 ready 状态 rows 为空数组；名称不得重复。**绝不**投影 `path` 或文件正文。`get_commands` 没有的仅 TUI 命令保持缺席。
- 前置：当前 chat 视图、匹配 generation、runtime ready。非法：设置页、过期 generation、名称不在快照、草稿忙碌／过期 revision、插入后超长。空快照是 `empty`，不发明内置列表。失败／损坏的 `get_commands` 为 `unavailable`，固定诊断且无行；提交替换后不得保留上一世代行。
- 顺序：先发布目录，菜单才能声称 ready。补全是 `DraftSubmission` 下一次草稿变更。超时沿用既有 RPC start／control 预算；不静默重试以免混目录。取消／替换丢弃在途回包。同一 revision 对同一 name 的幂等补全，若包含后缀的结果草稿未变则 no-op。
- 机密与隐私：绝对路径、AGENTS.md 正文与凭据留在宿主。日志不得打印目录路径或 prompt 正文。Webview 只收上述展示 DTO。
- 作曲区交互：文字以 `/` 开头且光标在首个 token 内时打开有界 listbox；输入过滤已发布快照。方向键导航；Enter／Tab 仅补全已确认草稿，菜单打开时不发送；Escape 关闭且不清文字。忽略 composition／IME Enter。空列表、不可用与零匹配分开显示。命令与模型／权限弹出层互斥。打开或选择一项不代表命令已执行。
- 维护者于 2026-10-01 UTC 通过续跑 goal 批准推荐的统一空格规则。宿主变更、client 预期确认与合成预览应用同一格式规则，并以往返 composition 测试验证。Webview 的 contracts 导入保持仅类型，不共享宿主运行时代码到 UI。名称成员、revision、忙碌、大小与世代检查仍归原有 owner。

## WI-079 只读用量（Living）

行为／验收归 [PRD WI-079](../product-requirements.zh.md#wi-079-已批准切片--只读会话上下文用量pi-gap-03)，实现／证据归 [ACTIVE](../../ACTIVE.md)。已实现，并于 2026-10-03 完成限定 macOS 验收；见[原生验收及限制](../archive/2026-10-02-wi-079-team.zh.md)。

- 仅 chat 入站 refreshSessionUsage 除精确 v3 信封无载荷。要求当前身份／世代与空闲 ready session，settings／过期／busy 拒绝，不抓取不改草稿。打开本地用量不启动 pi；ready／settlement 可走同一宿主刷新，无周期轮询。
- sessionUsageState：当前信封、单调 revision；status 为 loading／ready／unavailable／no-session，可空有界 usage，无路径／正文。ready usage 分累计 tokens（input、output、cacheRead、cacheWrite、total）、context（可空；tokens／percent 可空，contextWindow 为数字）、可空 cost。缺／无效值不猜零；非 ready 不携带 ready 快照。UI 可保留同会话明确标旧的 busy 快照，替换不可沿用。
- Adapter 公开 get_state／get_session_stats 校验当前会话与有限非负数字，context percent 有界，null 未知。sessionFile、身份元数据与模型定价只留宿主。未知／全零定价使零费用未知，不当免费；报告费用是估算，不是账单。
- 宿主每 runtime／session 只有一个在途刷新，合并调用，有界 RPC deadline。固定 unavailable 不送原始错误；替换／dispose 失效 owner token、清旧快照、忽略迟到。只读显式重试可恢复，无模型／会话文件／持久化。New／restore 不发布旧累计。
- 类型、receiving validator 与 production host／runtime／UI 准入 `refreshSessionUsage` 和判别数字 `sessionUsageState`。tokens 为非负安全整数，contextWindow 为正安全整数，percent 为 [0,100] 有限数或 null，cost 为 [0,Number.MAX_SAFE_INTEGER] 有限数或 null。ready 必须 usage object，其他 status 必须 null。嵌套字段精确，排除 raw metadata／accessor。可选 runtime seam `getSessionUsage(expectedSession)` 返回 `{ok:true,usage}` 或 `{ok:false,detail}`（固定有界仅宿主诊断）；身份验证与既有 deadline 归 adapter／host。
- UI 仅投影、键盘可达面板与 allowlisted Refresh。保留一次一张，Escape 恢复焦点且不丢草稿；中英无会话／加载／未知／不可用／旧快照已实现。刷新按钮临时禁用前先聚焦面板，因此 Escape 可用并返回用量入口。

## WI-080 当前会话重命名（Living）

`renameSession` 仅 chat，只有精确 v3 action 信封，无 payload。host 拥有原生输入框；browser 不提供名称、session id／path 或 RPC。`sessionRenameState` 携带 host 信封、非负安全整数 `revision` 和 `status: unavailable | ready | renaming`。receiving parser 与 production provider／runtime／UI 已实现该 schema。既有 `sessionState.current.name` 仍是标题权威。

可选 host-owned runtime capability 为 `renameSession(name, expectedSession): Promise<RuntimeSessionRenameResult>`。host trim 名称，要求非空、最多 200 UTF-16、无控制字符。原生输入／mutation 共用 one-flight，捕获 generation 与 runtime／session 身份；输入后及 RPC 后重查。adapter 公开 `get_state`、`set_session_name`、再经验证 `get_state`，同身份且名称匹配后才成功。返回 `{ok:true,conversation:{id,name,path}}` 或 `{ok:false,detail}`，detail 固定有界，path 仅宿主。取消保留标题；unavailable／非法／busy／stale 不 mutation。超时不证明 mutation 失败，不自动重试。确认成功更新当前标题、刷新已保存目录；替换／dispose 失效迟到回复与输入 owner。限定原生／runtime／browser 证据见 [WI-080 验收](../archive/2026-10-02-wi-080-team.zh.md)。

## WI-081 完整正文复制元数据（Living）

`ChatLine` 与仅宿主 `RuntimeEvent.message_final` 可带 `bodyCopyEligible?: true`，缺失代表未验证／不可复制。browser 仅接受非空 assistant 正文的 literal true，拒绝 false／其他值和 user 行字段。saved-history DTO 不准入该字段：尚无可靠完整／完成来源。无新增 host intent 或 clipboard authority。

仅公开 `stopReason === "stop"`、raw joined text 非空且最多 65,536 UTF-16、display projection 与 raw 一致且未打码／截断时 producer 才可标 true。缺 stop reason、tool continuation、length／error／aborted、隐藏／打码／截断保持不可复制。host 随同一 final body 转发事实，后续 text delta 移除资格。全局 chat idle 不证明单条完成。production producer 与 UI 已实现资格规则，经 browser clipboard API 复制原 Markdown 并提供有界成功／失败反馈；保留既有代码块复制。见 [WI-081 验收及限制](../archive/2026-10-02-wi-081-team.zh.md)。

## 编辑区设置界面（WI-026）

`openSettings` 无额外字段，仅当前聊天视图可发送，打开／揭示单实例编辑区面板。`setUiLanguage` 只携带 `locale: "en" | "zh-CN"`；宿主仅内存保存，并向各视图投影带标准宿主信封与 locale 的 `uiLanguageState`。

设置面板拥有独立随机 viewId 和共享宿主 generation，白名单更窄：bootstrap `ping/getWorkspaceState`、`setUiLanguage`、`refreshProviderConfig`、`openProviderApiKey`、`openProviderOAuth`、`addCustomEndpoint`、`removeCustomEndpoint`、`logoutProvider`、`setDefaultModel`、`setDefaultThinkingLevel`、`addPluginInventoryEntry`、`removePluginInventoryEntry`、`setPluginInventoryEnabled`。Bootstrap 返回 `uiLanguageState`、`providerConfigState` 与 `pluginInventoryState`。它不能启动聊天、改草稿、批准工具、切换执行配置或读取历史。供应商与清单操作前执行原有精确解析与当前身份／generation 检查；过期身份仅重新同步设置投影。关闭重开生成新标识，不关闭聊天／runtime；两个渲染器均拒绝外来及旧投影。API key 与 OAuth 设备码仍在原生宿主提示中收集。自定义端点消息只含显示名称、http(s) Base URL 和模型 id，不接受 API key。添加清单项无额外字段；宿主打开原生文件选择器并存储规范本地路径。移除只携带不透明 `id`；宿主删除该清单项，不删除磁盘文件。启用携带 `{id, enabled}`，不加载也不改写活 runtime。投影是 `{ id, displayName, enabled }`（basename ≤512 UTF-8）；记住的路径留在宿主文件。

## Endpoint 写入事务（WI-038，已接受契约）

宿主 `models` 模块拥有规范化 `models.json` 父目录旁的 `.models.json.pi-vscode.lock` 和全部事务临时文件。添加／删除在读取前只抢锁一次，持锁完成合并与原子替换；争用立即失败，不排队、不自动重试。锁只包含随机所有权 token 和 PID，不含配置正文或凭据。父目录别名共享锁；链接或其他无法确认的目标文件身份拒绝写入。

内部结果区分 `committed`、含固定原因的 `not-committed` 与 `committed-cleanup-failed`。只有干净提交才继续模型重载与登录／注销。争用、检测到版本冲突、非法输入／文件、序列化输出超过 1 MiB 读取预算和写入失败通过 `providerConfigState.error` 投影有界固定文本。清理失败保留替换是否发生的事实；已提交但清理失败说明 endpoint 已保存／删除，但未继续凭据动作。不把原始异常、私有路径、锁元数据或配置正文交给 Webview。刷新读取现状，重试须显式执行，不重放不确定修改。原有 API key 收集取消仍可留下已干净提交的 endpoint。

替换前，宿主用新读取核对原始文件字节及身份（或缺失状态）；不一致时拒绝替换，保留外部版本。不遵守锁协议的外部写入仍可在检查与 rename 之间竞争；这不是文件系统 CAS，也不保护任意外部写入。释放只删除当前事务身份匹配的锁，失败保留屏障。崩溃遗留锁不根据年龄或 PID 清理。恢复要求关闭相关写入宿主并由维护者核对，再手工删除已确认的遗留锁；渲染器没有解锁／删文件能力。Webview v3、endpoint 意图字段与凭据所有权保持。[ADR 0007](../decisions/0007-endpoint-write-transaction.zh.md)与 [WI-038 验收记录](../archive/2026-09-30-wi-038-macos-acceptance.zh.md)记录已接受决定与证据。

## 消息封装与允许列表

当前只接纳数字 `version: 3`。完整类型归[webviewProtocol.ts](../../src/extension/contracts/webviewProtocol.ts)，运行时精确校验归[webviewMessages.ts](../../src/extension/bridge/webviewMessages.ts)。v1／v2与单文件首片演进已移到[历史快照](../archive/2026-09-28-webview-contract-history.zh.md)；它们不是兼容路径。独立的pi审批gate envelope仍为v1，不与Webview版本混用。

仅普通对象或null prototype，exact own enumerable data fields；拒绝accessor、symbol、未知字段／类型／版本。bootstrap `ping`、`getWorkspaceState`仅含version／type。其他每个动作均含`{version:3,type,generation,viewId}`及下表的且仅有的载荷字段。generation／revision／sequence／page／offset为非负safe integer；opaque ID含viewId及request／snapshot／attachment／row ID匹配`[A-Za-z0-9_-]{1,100}`。

| 动作 | 额外字段／准入 |
|---|---|
| openFolder／manageTrust／stopChat／newConversation／getAttachmentHistory／getChangeReview | 无；分别走工作区、Stop、会话及只读投影资格 |
| refreshSessionUsage／renameSession | 无；仅 chat、匹配 generation／view；空闲 ready 功能准入；生产接线已实现 |
| chooseResources | choice: allow／decline；只能显式选择，不接收trust boolean |
| updateDraft | draftRevision、editSequence、text（最多8000 UTF-16单元） |
| sendChat／addFileAttachment／addSelectionAttachment | draftRevision；host自行取得已确认草稿／原生选择，不接收prompt路径或附件正文 |
| queueChat | draftRevision 加 mode `steering`｜`follow-up`；仅 chat；宿主读取已确认草稿，不接受 UI 提供的 prompt |
| recallQueuedText | 与最近发布的 `queuedTextState` 匹配的 queueRevision；仅 chat |
| useRecoveredText | 不透明恢复 id 加 draftRevision；将可复用文字移入无附件空草稿 |
| discardRecoveredText | 不透明恢复 id；丢弃一条宿主恢复记录且不发送 |
| removeAttachment | draftRevision、attachmentId |
| confirmFileAttachment／confirmSelectionAttachment | draftRevision、attachmentId、snapshotId |
| getAttachmentPreview | requestId、snapshotId、offset |
| decideApproval／revokeGrant | id；前者另含decision: once／session／deny |
| openReviewDiff／openReviewSource／resumeConversation | id；只能引用host当前允许的记录 |
| getSavedSessions／getSavedHistory | page |
| getSavedHistoryPreview | id、requestId、offset |
| setChatModel／setThinkingLevel | provider＋modelId／level；模型 id 可含 `.` `_` `:` `/` 与 `-`；仍须匹配当前 host 目录与能力 |
| openProviderApiKey／logoutProvider | providerId；API 密钥仅经宿主原生密码 InputBox 收集，永不进入 webview 载荷 |
| openProviderOAuth | providerId；宿主执行 pi OAuth 登录。URL 与设备码只出现在原生提示，永不进入 webview 载荷 |
| addCustomEndpoint | displayName、baseUrl、modelId；宿主合并一条 OpenAI 兼容 models.json 记录，随后在原生提示收集 API key。不接受 apiKey 字段 |
| removeCustomEndpoint | 非内置 models.json 供应商的 providerId；宿主删除该对象并登出 |
| setDefaultModel | provider＋modelId；经 SettingsManager 持久化 pi 默认；仅在该写入报告已提交时应用实时会话模型 |
| setDefaultThinkingLevel | provider＋modelId＋level；须匹配当前默认模型身份及支持档位；按模型保存默认值，不启动 runtime |
| refreshProviderConfig | 无；重载无密钥的供应商状态与默认模型目录 |
| addPluginInventoryEntry | 无；宿主打开原生文件选择器，把规范本地 pi 扩展路径追加到配置范围清单。投影为不透明 id 加 basename；这不是加载同意 |
| removePluginInventoryEntry | 当前投影清单行的 id；宿主删除该清单项，不删除磁盘文件 |
| setPluginInventoryEnabled | id 加布尔 enabled；持久化下一次空闲受信资格，不加载、不改写活 runtime |
| chooseExecutionProfile | profile: controlled／trusted；trusted 经原生确认应用一条已启用清单路径；没有或多余已启用项可见失败，作曲区不再打开文件选择器 |
| answerInteraction／cancelInteraction | id；前者另含与活动表单方法精确匹配的answer |
| endOwnedRuntime／recoverControlledRuntime | 无；只能清理当前恢复域确切运行，遵循ADR0002回执规则 |

畸形输入无效果／回复；过期身份不能执行，host重同步当前投影。先验证当前view，再重新读取真实workspace资格及generation。模型／thinking流式选择只登记下一回合意图。answer的select仅optionId、confirm仅boolean value、input/editor仅text（最多32768字符且UTF-8字节）；无通用命令、路径、shell或RPC桥。所有host投影含v3／generation／viewId，包括provider的pong；字段和动作状态语义归下文。

**WI-025 启动前默认值：** `providerConfigState` 新增 `defaultThinkingLevel: string | null` 与 `thinkingLevels: string[]`（最多 16 项、每项最多 16 字符）；非 null 强度须属于该列表。无已配置／已知模型时投影 null 和空列表。宿主使用 pi-ai 0.86.1 公开能力函数获得支持档位与有效值，已有不支持设置按上游归一化后投影有效档位。`setDefaultThinkingLevel` 绑定 provider/model 身份并验证当前支持档位，再经 `SettingsManager.setModelThinkingLevel` 保存。默认值写入期间忽略其他默认值写入与供应商操作，UI 禁用选择。flush 完成且 `drainErrors()` 为空后才发布成功。失败保留先前已应用投影、丢弃缓存的设置管理器并显示有限错误；显式刷新重载权威设置。只保存默认值，不启动或修改活跃会话；新会话沿用 pi 默认加载，历史恢复仍归上游。宿主与捆绑页面在 v3 内同步演进，更新此构建后须重载旧 Webview。

## 宿主状态投影

宿主发送 `version: 3, type: "workspaceState"`。完整字段／类型以 [`WorkspaceStateMessage`](../../src/extension/bridge/webviewMessages.ts) 为准；下表定义语义分组。UI 渲染此投影，不自行构造权威状态。

| 字段 | 语义与限制 |
|------|------------|
| `generation`, `status`, `folder` | 代次为非负安全整数；状态为 `no-folder`、`multi-root`、`remote`、`non-file`、`untrusted` 或 `eligible`；单目录为 `{ name, path }`，否则 folder 为 null。 |
| `choice`, `busy`, `error` | 选择为 null／`allow`／`decline`；busy 表示工作区动作未完成；error 为 null 或固定有界恢复提示，不含原始异常。 |
| `runtime`, `runtimeDetail` | 阶段为 `not-started`／`starting`／`ready`／`stopping`／`error`；失败详情为有界宿主诊断或 null，不含原始异常转储。 |
| `messages`, `chatBusy`, `chatError` | 宿主有序对话项 `{ role: "user" \| "assistant", text, id? }`，id 用于关联；提交期间起至会话结束／失败保持 busy。聊天错误有界，不直接转发 stderr 或凭证。 |
| `chatModel`, `thinkingLevel`, `thinkingLevels`, `availableModels` | 已应用模型展示名／档位可为 null；能力列表有界，模型最多 64 项 `{ provider, modelId, label }`。 |
| `pendingModel`, `pendingThinkingLevel` | null 或待应用模型目录项／有效档位；仅宿主内存意图，与已应用值区分。 |
| `modelBusy`, `modelError` | 加载目录、串行应用或恢复期间阻止发送和进一步选择；失败提示有界或为 null。 |
| `activities`, `approvals`, `grants`, `execution`, `controlledExecution` | 下节定义的执行投影；`controlledExecution: true` 描述所选配置，不证明就绪或 Gate 关闭。 |

**生产端显示上限（WI-010修正）：** 当前模型标签包括provider／ID fallback最多200个UTF-16单元。assistant最终文本／delta在脱敏后限制65,536单元；activity文本／input脱敏后限制16,384并报告截断。工作区别名标签最多512单元（省略号、不拆分surrogate），无执行资格的non-file URI标签最多65,536；实际本地cwd绝不缩短。受信entry显示名最多512个UTF-8字节，按code point安全截断并加省略号；原生同意对话框与host保留完整canonical path。模型摘要使thinking独立可见，title／无障碍文本及可滚动、换行的当前模型菜单保留完整有界标签。这些是生产端／UI契约，不保证任意有意内容中的秘密均能启发式清除。

## 运行时协议失败（WI-033）

适配层在活动、最终消息或工具完成投影前解码实际消费的事件字段。已识别消息／内容、工具结果、重试或压缩字段损坏时，产生固定协议错误并撤销连接。内容数组为未展示的图片／工具调用／未知对象类型保留索引；空数组及额外上游元数据有效。未知事件／更新类型、空行、非 JSON 和非对象输入沿用忽略规则。扩展对话、审批信封和反馈继续由各自校验器与拒收策略处理。

等待中的 RPC 同时绑定 ID 和命令。匹配响应必须带预期命令及布尔 `success`；未知、重复和已失效 ID 忽略。内部区分已校验响应与协议错误、断连、超时结果。命令专属 `data` 仍由已有领域解析器处理。合法 `success: false` 仍是上游拒绝；坏 ACK 不得伪造就绪、设置已应用、Stop 成功或远端 Prompt 拒绝。

协议故障同步撤销传输／回答能力，通过既有不确定运行时释放结束待处理调用并清理计时器／监听器。不发布坏事件的部分投影、不自动终止或重放任务。已写入而无有效 ACK 的 Prompt 保留投递不确定。Stop 不得因故障清理重置忙闲状态而成功。解绑同时丢弃当前 stdout 数据块剩余行与旧连接的后续报文。UI 只收到有界固定错误及既有运行时失败投影，不暴露原始坏报文。宿主生命周期及 Webview v3 接口不变。

## 受控执行契约

执行操作沿用上方消息封装规则，入站形状如下：

- `stopChat`：`{ version: 3, type: "stopChat", generation: number, viewId: string }`；仅聊天活动且尚未停止中时执行。
- `decideApproval`：`{ version: 3, type: "decideApproval", generation: number, viewId: string, id: string, decision: "once" | "session" | "deny" }`。
- `revokeGrant`：`{ version: 3, type: "revokeGrant", generation: number, viewId: string, id: string }`。

ID 非空且最多 100 字符。沿用精确自身字段校验、活动视图、代次及工作区 busy 检查。ID 只选择宿主已有待决请求／授权，不接受 Webview 提供的命令或路径。未知／过期决定不能复活已移除请求。仅当存在非 null 的可靠 scope 时，`session` 才创建授权；无 scope 不产生复用授权，UI 须仅提供允许一次。

执行投影中的字段：

- `activities`：最多 64 个宿主拥有的 `ActivityItem`：`{ id, kind: "thinking" | "tool", messageId, contentIndex?, toolCallId?, tool?, text, input?, status, truncated }`。Status 为 `thinking`、`preparing`、`executing`、`complete`、`failed` 或 `interrupted`。Thinking 按消息／内容索引关联，工具按 tool-call ID 关联。每项文本和展示参数最多 16,384 字符（项数限制同时约束总量）。文本或参数超限设置 `truncated`，工具更新保留该标记。64 项上限内预留稳定 `activity-overflow` 提示：额外活动只省略展示，不跳过执行／审批检查。UI 展示截断提示并按稳定 ID 增量更新 details，保留展开／焦点／滚动。`tool_execution_start` 投影为 `preparing`，不是副作用确认。`partialResult` 替换累计输出。`message_end` 校正最终正文／thinking；没有 thinking 时不合成。
- `approvals`：最多 8 个 `{ id, toolCallId, tool, input, scope: string | null, expiresAt }` 卡片。`input` 是完整 JSON 参数快照，最多 32,768 字符；过大或含凭证类字段在投影前拒绝。宿主／gate 默认超时 120 秒。拒绝、过期、取消及迟到回复均不授予权限。
- `grants`：最多 64 个 `{ id, scope }`。既有普通文件范围编码为 `[tool, canonicalPath]`；shell 为 `[tool, canonicalCwd, completeInput]`。精确匹配，不隐式授权目录／命令前缀。不存在／无法解析目标的 scope 为 null。查看／撤销影响后续调用，不撤销过去副作用。
- `execution`：`idle`、`waiting`、`thinking`、`awaiting-approval`、`executing`、`replying`、`retrying`、`compacting`、`completed`、`stopped`、`stopping` 或 `failed`；这是展示状态，不是沙箱证据。`controlledExecution` 表示所选配置，不证明运行时就绪或 gate 已关闭。

**凭据展示修复（WI-037）：** 共用展示脱敏隐藏完整引号值，包含空白／转义引号；未闭合值隐藏其剩余文本。有效 JSON 使用解析器确认结构，只替换凭据值，不重写无关原文。Thinking 原始上下文与 `ActivityItem.text` 分离，每个已准入条目最多 16,384 个 UTF-16 单元，最多 63 个准入条目。即使脱敏缩短了显示文本，原始预算耗尽后也省略后续 delta 并设置 `truncated`；脱敏后仍应用既有展示上限。完成、最终消息、新消息与 reset 释放原始缓冲；overflow 省略条目不分配缓冲。最终内容可校正投影，但迟到 thinking 更新不能覆盖 `message_end`。原始缓冲不进入 Webview。助手正文逐 delta 流式及尽力识别限制不变。批准切片于 2026-09-30 按实机取证并完结委托接受；见 [WI-037 记录](../archive/2026-09-30-wi-037-macos-acceptance.zh.md)。

`toolApproval.ts` 仅自动允许 canonical 路径位于工作区内的普通文件 `read`。搜索／列目录、编辑／写入、shell、外部路径仍询问；未知工具失败关闭。Windows 歧义路径不自动授权；realpath 检查覆盖符号链接／junction 越界，但不能消除检查与使用之间的竞态。同一运行会话的授权跨视图重建、普通 settled 与成功 Stop 保留；工作区／资格变化、运行时替换／断开、provider 释放取消请求并清空授权。

宿主在 `abortTask` 前取消待审批；adapter 取消未完成的对话等待，以有界超时先 `clear_queue` 后 `abort`。成功要求settled；失败或未证实结算时拒绝继续准入，撤销transport／answer权限并按ADR0002保留确切child观察，不自动kill未知工作。宿主在取消完成前保持 `stopping`，之后才应用待选设置。运行时丢失将未完成活动标为 interrupted，不自动重放任务。Stop 不撤销副作用，也不保证所有后代进程取消。

Adapter 仅接受自带 gate 的产品封装 `protocol: "pi-vscode-approval", version: 1`，runtime／cwd 须匹配当前子进程，就绪前通过 notify 收到 `kind: "hello"`。Call 包含 `request`、`toolCallId`、`tool`、`input`；自带异步 `tool_call` handler 通过公开 `ctx.ui.confirm` 等待，确认后再次检查完整参数快照。RPC 对话 ID 关联 `extension_ui_response`；标题文字不是授权依据。这不是通用 `approve_tool_call` RPC。受控工具 allowlist 为 `read,write,edit,bash,powershell,grep,find,ls`，使用 `--no-extensions -e <bundled gate>`；两种项目资源选择均禁用第三方扩展发现。自带文件缺失阻止启动；缺少hello／就绪则禁止ready并遵循owned-runtime失败／回执规则，不承诺可用的无工具回退。离线加载失败夹具单独使用 `--no-tools`。

仅转发有界展示字段，不发送原始 RPC 对象／stderr、签名或凭证存储。模式过滤尽力而为，不能保证任意 thinking／工具输出无敏感信息。运行权限及环境覆盖见[架构 §7](../architecture/vscode-extension-architecture.zh.md)；验证记录见下方证据边界。

WI-021 复用 pi 0.86.1 的公开 auto_retry／compaction 事件投影阶段，不拥有重试或压缩算法。可靠的 agent_settled 冻结本轮 completed／stopped／failed；无法取得 settled 时，显式 Stop／runtime 失败冻结 failed，但不改写已经可靠的终态。Stop 操作尚未结束时仍显示 stopping。终态已冻结但 prompt ACK 未到时，投递等待与任务结束分开：拒绝晚阶段／内容事件，ACK 不改写冻结结果。已经确认的 rpc-accepted／rpc-rejected／not-sent 投递不因后续断连变 unknown；未知投递不得自动重放。

## 延后模型／thinking 设置（WI-008 / WI-009）

- 空闲时有效选择立即应用。`chatBusy` 期间仅覆盖对应待应用字段（模型与 thinking 分别保留最后一次选择）；活动的会话级运行期间不发送设置 RPC。合并 chip 始终展示已应用值；独立状态展示 `Next turn (pending)`／`Applying next turn`，Popover 关闭后仍可见。
- 当前 runtime session 的 `agent_settled` 到达后，`applyPendingSettings` 在允许 UI 发送前设置 `modelBusy`，先执行 `set_model`，接受其刷新后的状态／目录／能力，再重新校验待应用档位并执行 `set_thinking_level`。不支持或未应用的档位显示有界错误，不静默钳制或降级。此时模型可能已改变；这不是原子回滚事务。
- 失败后只回读一次投影，不重试修改。回读失败时清空已应用模型／档位与可用档位，不猜测成功。当前应用结束时清空 pending 字段并释放 `modelBusy`；模型错误在 Popover 外仍可见。Prompt 被拒绝时清空待应用意图。
- 工作区身份／资格变化、运行时重启（含资源选择变化）及 provider 释放使待应用工作失效。代次、runtime session 与目录 token 防止迟到结果覆盖替代运行时。视图替换保留宿主拥有的 pending／进行中的设置，并同步到新视图；旧视图操作被拒绝。
- 会话完成使用 `agent_settled`：无剩余自动重试、压缩重试或排队续跑；`turn_end` 或低层 `agent_end` 不足以证明此边界。当前版本及升级验证遵循 [pi 集成指南](../guides/agent/pi-integration.zh.md)，历史 WI-004 证据仅适用于记录的版本。


**WI-008错误与就绪边界：** pi0.86.1公开get_state的零能力unknown sentinel不表示已配置模型；真实模型仅名为unknown仍有效。没有模型时显示配置恢复说明并阻止Send。provider错误正文仅在host内分类，不转发原文；401／403／缺密钥使用固定认证恢复文案，503与429使用固定可用性／限流文案，其余固定一般失败。公开prompt RPC拒绝可在adapter→host内部结果带allowlisted `rejection: "authentication"`，host映射固定文案；不新增Webview动作／版本、不改变rpc-rejected投递事实、不重试或回放。


## 信任与生命周期

- `PiChatViewProvider` 拥有内存工作区身份、单调代次、选择和订阅。观察目录变更及信任授予；每次操作重新读取实际工作区目录、`workspace.isTrusted` 和 `env.remoteName`。即使 URI 为 file，远程宿主也阻断。多根和非 file 工作区阻断。仅已信任的单个本地 file 目录可选择资源。
- 工作区或资格变化清空选择并递增代次；重复读取及视图重建保留选择。扩展宿主重载重置全部状态。VS Code 撤销信任会重载窗口；宿主还在每次请求检查信任失效。资源选择不使用设置、信任文件、密钥或 Webview 存储；独立 UI 语言偏好不持久化执行 consent。
- `openFolder` 仅空的本地窗口（`no-folder`）可用。打开原生单目录选择器，随后重新检查代次与资格，再使用原生 file URI 调用公开的 `workspace.updateWorkspaceFolders(0, 0, { uri: selected })`。取消不改变状态；返回 false 或异常时显示有界的重试／File > Open Folder 恢复提示。返回 true 后保持忙碌，直到权威工作区变更或宿主重启，以防重复更新；这仅表示请求获受理：UI 不伪造目录或成功状态。添加首个目录可能重启扩展宿主而不触发目录变更事件；新 provider 构造函数读取权威工作区状态，资源选择初始为空。`manageTrust` 仅其他条件符合的未信任目录可用，仅调用 `workbench.trust.manage`，不自行授予信任。
- 编辑器标题导航图标与命令面板命令 `pi-vscode.focusChat` 先查询已注册命令，仅在容器命令存在时显示 Pi 容器，随后始终聚焦 `pi-vscode.chat`；不切换可见性，也不创建另一个面板。默认仍为 `secondarySidebar`。编辑器标题入口使用分别适配浅色／深色的 Pi SVG；没有编辑器标题时仍可使用命令面板。
- 原生动作在活动视图中串行。工作区变化、视图替换／释放或 provider 释放使待决工作失效。后续命令或状态更新前再次检查结果。失败显示固定重试提示；取消不是错误。发送失败不会泄露异常；重开视图重新同步。
- 允许／拒绝在工作区身份或资格变化前可修改且仅内存保存。在 eligible 工作区作出选择后，扩展宿主以公开 `--approve` 或 `--no-approve` 启动 pi RPC（仅当次运行）；更改选择会重启运行时。WI-010 以上述受控 allowlist 与独占自带 gate 替代历史 `--no-tools` 启动。两种选择均禁用第三方扩展发现；资源同意不能覆盖此限制。拒绝仍可能按上游文档读取 AGENTS.md 与其他用户／全局资源。两者均非沙箱或工具授权。
- WI-004 聊天：`runtime === "ready"` 时宿主可通过 RPC 发送有界 `prompt`，将 `text_delta` 投影到 `messages`，直至会话级 `agent_settled`。Webview 不导入 pi、不 spawn 进程、不发任意 RPC。Live transcript 仅驻 host 内存；工作区身份／资格变化及 provider dispose 清空它。runtime reconciliation 默认清空，但明确拥有的 profile／session handoff 可保留投影。会话恢复遵循下述 WI-017 公开 pi API 契约；旧运行时 send 意图及迟到事件仍无效。
- 视图替换／释放清理视图监听；provider 释放清理工作区监听。每页有新脚本 nonce 和限制性 CSP。名称和路径仅随状态消息传输，以转义文本呈现，不插入可执行 HTML。原生按钮有明确标签、键盘激活和可见焦点；状态／错误使用实时区域。

## WI-014 附件事务契约

本节与T014-02–05共同定义已接受集合契约；不是单槽／v2候选。旧封装与首片提案见[历史快照](../archive/2026-09-28-webview-contract-history.zh.md)。

### 所有权、资格与有界捕获

`DraftSubmission` 拥有 host 草稿、附件准备与提交账本；`PiChatViewProvider` 提供执行资格并协调运行时／Stop／会话切换。`runtimeLifecycle.ts` 拥有窄内部 prompt／结果契约；adapter 负责编码、关联及有界写；Webview 仅展示。使用 VS Code 公开 document／picker API 与仅宿主侧 Node `fs/promises`／`path`，不提供 Webview 文件访问、通用 bridge 或 pi 会话文件访问。不新增依赖、框架、进程模型或持久化。

- 添加使用原生多文件picker，选区Add读取一个明确非空选区；不推断打开文件为附件。一个批次全部验证后才加入，取消／失败保留现有草稿。要求受信单一本地file工作区和ready runtime；每个await后重查资格。20项／1MiB集合语义见T014-04。
- 加载文档前拒绝非 `file` URI、authority／query／fragment、非绝对或 Windows 歧义路径（device／extended 前缀、UNC、drive-relative、ADS、控制字符、保留设备名组件、尾点／空格）。root／target 经 `realpath`，要求普通文件并用按路径段的 `path.relative` 判断归属，不用字符串前缀或一律转小写比较。原始与解析路径均检查；symlink／junction 指向 root 外则拒绝。记录 canonical root／target 和 stat 身份（`dev`、`ino`、size、mtime／ctime）；复查必须匹配。身份不支持／不可解析时失败关闭。这不是文件系统原子锁或恶意工作区沙箱。
- **加载前**阻止已知凭证来源：任意 `.local-env`／`.ssh` 组件、`.env`／`.env.*`、`auth.json`、`credentials.json`、`id_rsa`、`id_ed25519` 及 `.pem`／`.key`／`.p12`／`.pfx` 文件（组件大小写不敏感，原始／canonical 均检查）。绝不从 SecretStorage、进程环境或 pi 凭证库取附件。捕获后拒绝可识别私钥块或凭证赋值，沿用现有凭证类键词汇（`api_key`、`authorization`、`password`、`secret`、`access_token`，含大小写／分隔符变体）；无覆盖开关，错误不含原文。这是保守防御，不保证识别任意代码中的全部秘密；UI 提醒只附加非敏感代码。夹具只用 dummy 标记，不用私有文件／密钥。
- `openTextDocument` 前检查 `stat`：未打开磁盘文件超过 **1 MiB** 则 `source-too-large`，本功能不打开／读取。该捕获上限为 256 KiB 文本快照留出常见 UTF-16／UTF-8 解码开销，不是附件预算。已打开且匹配的 TextDocument（含 dirty 文本）即使磁盘较大也复用，但仍要求现有普通文件／归属。`getText()` 前通过末行末尾的 `offsetAt` 检查，超过 **262,144 UTF-16 code units** 时不分配全文；捕获后再限制 **262,144 UTF-8 bytes**。未打开文件由 VS Code 负责解码／加载，其公开 API 不提供抵抗并发文件增长的硬读取限额。完成后 re-stat，变化／超限拒绝；诚实披露残余竞态，不宣称有界 OS 读取。无原始读取回退、自动保存或旧磁盘替代。
- 文本资格指支持的文件成功作为 VS Code TextDocument 打开；被拒绝／二进制／不支持的打开结果为 `not-text`。不是按扩展名嗅探二进制，也不保证任意 bytes 都是文本。空文本文件可配非空正文发送。记录实际编辑器文本、document 对象／URI、version、dirty。变化／关闭重开、重命名／删除、canonical／stat 身份变化或最终文本不同，使已附 revision 持续无效直至移除／重附，即使后来恢复原文也一样。监听文档变化／关闭并在发送时复核；`DraftSubmission` 拥有并清理其文档监听。预览始终展示已捕获快照，不静默更新。

### 版本化意图与安全投影

上述所有附件意图使用当前v3信封，不接收路径／文本权威。正文最多8000 UTF-16单元且提交时trim后非空。host拥有revision／acceptedEditSequence；每次变更推进revision，旧revision只重同步。精确DTO归[webviewProtocol.ts](../../src/extension/contracts/webviewProtocol.ts)：attachmentState含draft的revision／text／acceptedEditSequence／attachments数组、preparation、固定result.code、historyCount／retainedBytes及lastSubmission。每条元数据含attachmentId／snapshotId／relativePath／utf8Bytes／unsaved与file或selection判别字段；draft另含attached／changed／confirmation-required／unavailable。selection附originalRange及stale。无绝对source path、TextDocument或stat对象。

attachmentHistory含有界entries及投递／outcome，不携带正文。attachmentPreview按requestId／snapshotId／offset相关，返回固定code或text／nextOffset／done。每view至多一个在途preview、无请求队列；chunk最多16384 UTF-16单元／49152 UTF-8字节，不拆surrogate；总frame最多128KiB，UI仅保留一个最多256KiB组装preview。relativePath最多1024 UTF-8字节、每条不可变元数据最多2KiB。错误码仅用类型中AttachmentCode允许值，包括no-editor／empty-selection／multiple-selections、attachment-limit／total-too-large；不得再发送已退役slot-full。错误是固定恢复文案，不含异常／秘密内容。安全literal显示不执行HTML／链接；过期view／snapshot／request响应不能重新打开预览。

### 草稿事务、投递与生命周期

1. Host 拥有跨视图重建的已确认正文／附件。新 view 先取得新 `viewId` 与当前 revision 再编辑；旧 ACK 不覆盖本地较新未确认文本。仅当 `lastSubmission.draftRevision` 匹配提交 revision **且**本地 edit sequence 未变化，UI 才清空；较新编辑随后作为新 revision 同步。准备期间编辑使其 token 失效并保留新草稿。Host 未收到的编辑不能承诺跨 view 丢失保留；UI 显示同步中／未同步状态，不虚报已保存。
2. 串行一个 picker／preparation 及一个 submission。捕获 preparation token、draft revision、workspace generation、runtime session、当前 view。执行有界 async 来源检查，每个 await 后复核身份。最终同步边界检查 document 对象／version／open／text／dirty、正文／附件预算、metadata、资格及 cancellation token；预留历史容量，构建一个不可变提交，序列化并检查实际出站 frame，**之后才接纳**。冻结后不再异步重读文件。保证 host／editor 一致，不保证未来 runtime 工具读取或 check/use 原子性。
3. 接纳原子提交不可变快照与正文，只推进／清空该草稿 revision，标记 delivery `host-accepted`；历史与 prompt 使用同一冻结数据。同一同步 turn 立即调用 adapter；adapter 检查 expected session，并在交给 stdin 前消费一次尝试 token。该边界发布 `write-attempted`；仅匹配成功响应才 `rpc-accepted`，明确负响应才 `rpc-rejected`；仅未尝试 write 才 `not-sent`；尝试后的 write／ACK／loss 不确定为 `unknown`。不重新插入可能已发送草稿，不自动重发。拒绝／不确定提交也保留供检查并准确标记，不一律称“发送成功”。
4. Task outcome 独立为 `pending | settled | failed | interrupted`；匹配的 `agent_settled` 是既有稳定结束边界，不是 prompt ACK。ACK 前 streaming／settlement 不可倒退 outcome，也不能在 ACK 未解决时允许第二次接纳。Host 接纳或 write／drain 不等于远端受理／完成。
5. Picking／preparing 期间 Stop 使 token 失效、返回 `preparation-cancelled`、保留草稿并保证零 prompt writes。Write handoff 后沿用受控 Stop／clear_queue／abort；远端效果可能已存在。Stop 不发送草稿、不恢复不确定提交、不重放。View dispose 取消未提交 picker／preparation／preview，但保留已确认草稿／已接纳历史；已提交尝试继续由 host 拥有。旧 view 事件不能修改新 view。
6. 工作区／信任／资格或 runtime 替换使附件资格／async 工作失效；保留正文及失效提示、移除来源能力、要求主动重附，不静默把上下文携带到另一项目／runtime。Live history 随所属 session 结束：主动重启／资源选择变化前说明内存历史丢失；故障丢失说明历史结束，不声称持久化。Host reload／provider dispose 释放全部快照、监听、timer、预览引用。同会话成功 Stop 保留历史。不新增会话持久化或自动 reset。

**投递／结算恢复：** 明确 RPC 拒绝将等待执行状态结束为 failed，提示检查配置后主动重新提交，而不是要求一个已不可用的 Stop。若结算先于 ACK，ACK 解决前仍阻止新接纳，之后通过同一结算投影结束回合。迟到 ACK 不能覆盖 runtime failure／interrupted 状态。合法 Stop 在任务已结算后仍回传当前状态，防止 renderer 本地卡在 stopping。

### 编码、传输与内存预算

- 每项text最多262144 UTF-16单元且UTF-8字节；集合最多20项／1048576 UTF-8 text字节，正文独立8000单元。plain prompt保持trim后的命令语义；enriched prompt以固定说明前缀＋JSON数据`{body,attachments}`封装，正文及附件中的slash／template／skill保持literal数据，不调用或重实现pi模板引擎。
- 实际LF结尾JSONL frame最多8MiB UTF-8，编码后逐次测量，计入双层escaping／元数据，超限在stdin前拒绝；不靠理论估算替代实际帧检查。完整集合冻结后同步提交一个prompt，不拆分／静默省略。
- 一个prepared frame、一个消耗式send token、一次write尝试，无附件写队列。先注册ACK／error／close，write callback及必要drain均成功才算本地flush；允许早到相关ACK，不把flush当远端接受。write／drain5秒，ACK从write起总共30秒；失败清理listener／timer，不自动retry。失联按ADR0002保留未知运行，不借关闭stdin或自动kill伪造终止。
- live history最多128 snapshot records／8MiB逻辑payload，正文每submission计一次＋每项text／不可变metadata；整组预留，无静默eviction。纯聊天／Stop／查看历史不因附件容量满被禁止。记录数约束空附件metadata；逻辑预算不是heap保证，UTF-16内容有保守16MiB ceiling另加有界对象开销。
- 仅一个最多1MiB draft集合＋8k正文、一个有界准备事务／最多8MiB outbound frame及短暂serialized字符串、一个preview chunk／组装preview；不在每个delta重发history正文，不缓存每条历史的重复序列化prompt。来源／transport／容量失败保留相应草稿并明确恢复，不自动清空或承诺跨host persistence。

### 验收与证据

代理按本次委托完成[WI-014验收](../archive/2026-09-28-wi-014-attachment-acceptance.zh.md)，涵盖T014-01–05，不冒称维护者亲自操作。首次Linux探针、旧v2形状及首片预算在历史快照中，不当作当前F5／安装包结果。当前验证分层由[ACTIVE](../../ACTIVE.md)与验收归档追踪；不接受整份Draft PRD或全provider／fork支持。

## T014-02 最新整文件确认

**已接受契约。** 与本节其余WI-014规则共同适用；[委托验收与范围](../archive/2026-09-28-wi-014-attachment-acceptance.zh.md)区分实际环境与自动化证据，不推断REQ-008持久化或整份PRD接受。

- 每次 enriched Send 前，host 按相同 canonical 归属、来源资格、敏感内容与 UTF-8 上限重新捕获当前编辑器文本。canonical 目标或编辑器文档身份不同视为不可用，不静默换成另一文件。内容、编辑器版本／dirty 状态或文件系统身份变化会阻止提交，并用新 opaque snapshot ID 及 `confirmation-required` 状态替换草稿预览。保留正文，不产生 runtime prompt 或历史记录。
- 在普通 generation/view envelope 中新增 exact v3 意图 `confirmFileAttachment { draftRevision, attachmentId, snapshotId }`，ID 与 revision 沿用校验上限。Host 仅在空闲且合资格时接受当前暂存整文件快照；异步重新校验来源后标为 `attached` 并增加 draft revision。确认本身不发送，用户随后明确按 Send。预览可选，不产生确认；不提供发送旧整文件选项。
- 文档编辑使暂存／已确认状态失效；后续 Send 暂存新快照并再次要求确认。旧 ID／revision、新正文编辑、移除、Stop、视图替换、工作区／runtime 替换与 dispose 均不能批准或恢复旧确认。准备期间 Stop 取消准备、保留草稿。视图重建后未变化的暂存快照仍可检查，但不重放确认。
- React client 标明暂存状态，仅针对该确切快照提供 **Use latest contents**；意图不携带路径／正文权威。同步、未获确认的正文编辑、模型／任务工作或准备期间禁用动作。草稿快照被替换时，关闭指向旧草稿快照的已打开预览，避免把旧字节当作当前内容。
- 沿用已同意测试接缝：真实 provider／validator 配原生编辑器与 runtime harness、挂载 React 应用／真实桥、隔离真实 pi 传输及 F5／安装版 VSIX。覆盖连续两次编辑、不预览即确认、重复／过期确认、校验期间变化、超限／删除／不可用来源、Stop／重建与最终提交／历史精确字节。历史 T014-01 实机证据不证明此新增行为。

## T014-03 固定选区与明确旧快照选择

**已接受契约。** 与本节其余WI-014规则共同适用；[委托验收与范围](../archive/2026-09-28-wi-014-attachment-acceptance.zh.md)区分实际环境与自动化证据，不推断REQ-008持久化或整份PRD接受。

- `addSelectionAttachment { draftRevision }` 沿用 v3 action envelope。Host 获取当前本地文本编辑器的单个非空选区；无编辑器、空／多个范围、来源不合资格或取消给出有界可恢复错误。Webview 不提供路径／范围／选中文本。仅捕获选区，不读取整篇文档，因此已打开大文档中的合规小选区仍可使用。沿用 canonical／路径／内容安全及单项 256 KiB UTF-8 上限，捕获前后核对来源／文档，不保存。
- 元数据与 enriched context 新增判别类型 `kind: "selection"`、`originalRange { start: {line, character}, end: {line, character} }`（从零开始的安全整数、末端不包含）及 `stale: boolean`。浏览器显示从一开始的原始位置，明确为历史范围而非当前导航坐标。file 元数据不变。移除／重附前，选区正文、原始范围与原始 unsaved 标记不可变；仅移动光标不移动附件。
- Host 另外跟踪选区提交当前获准的来源 revision。来源编辑使其失效，但不更新捕获正文。Send 校验当前来源资格／文档身份；与已观察版本不同则零提交并显示旧快照选择。UI 提供移除／重附及明确 **Use old snapshot**，预览可选且不产生确认。`confirmSelectionAttachment { draftRevision, attachmentId, snapshotId }` 校验 exact 字段与当前已观察来源版本；确认前／中或最终 Send 前再次变化须重新选择。确认本身不提交，旧快照选择不能绕过删除／不可用／越界。
- 确认 token／revision 撤销、Stop、新正文、视图／runtime／工作区替换及不可变已发历史沿用 T014-02。原始范围标记与实际提交字节保留于活跃历史，不新增保存会话存储。frame／预览／活跃内存／记录预算继续计入新元数据并执行。
- 沿用已同意接缝：原生编辑器／provider／validator、adapter 编码、挂载 React／bridge、隔离真实 pi 与实际 F5／安装版。验证 Unicode／多行／dirty 的确切起止、大文档小选区、无／空／多个选区、来源变化与仅光标变化区别、过期确认／重复编辑／Stop／重建、删除／越界拒绝及历史原文不变。整文件最新确认及模型／审批／Stop 回归保留。不隐含多范围合并、多文件、图片或持久化行为。

## T014-04 有界混合附件事务

**已接受契约。** 与本节其余WI-014规则共同适用；[委托验收与范围](../archive/2026-09-28-wi-014-attachment-acceptance.zh.md)区分实际环境与自动化证据，不推断REQ-008持久化或整份PRD接受。

- 配对发布的 v3 host／browser 草稿字段改为 `attachments: DraftAttachment[]`，按显式添加顺序保留 0–20 项。既有添加／移除／确认／预览命名意图仍只携带 revision 与 opaque IDs。整文件原生选择可多选；取消、不安全、项数或预算超限的批次不改变既有列表。选区一次追加一个固定快照；不推断上下文，不添加排序功能或持久化。
- 捕获与最终内容均检查单项 262144、合计 1048576 UTF-8 文本字节及最多 20 项。项数／合计失败使用有界 `attachment-limit`／`total-too-large`，提示缩减／移除。正文仍独立限制 8000 UTF-16 单元。每次修改推进 draft revision 并撤销准备；逐项精确确认不授权其他项，不发送草稿。
- Send 准备完整集合，一次接纳前再次检查每项来源／文档及确认。变化整文件更新最新候选；变化选区保持原文／范围并明确选择旧快照。任一变化、不可用、不安全、超限或未确认项均零 prompt 写入、无部分历史、不静默略过；正文／列表保留供修复／移除。Stop、新正文／列表、视图／runtime／工作区替换撤销迟到捕获／确认／接纳。
- enriched adapter 输入及 literal JSON 使用同序 `attachments: [...]`，不是多次 prompt。Adapter 独立检查单项／项数／合计／路径／范围／正文及实际 JSONL frame。为批准的 1 MiB 文本合计，frame 上限为 **8 MiB**，包含双层 JSON 转义；最坏转义必须实际传输验证。超限在 stdin 写入前失败，不截断／重试。
- 活跃历史继续限制为 **128 个附件快照记录及 8 MiB 逻辑负载**，不淘汰。混合提交的不可变记录共享一个 submission ID 与投递／结果；各自唯一 snapshot ID 供预览。每条提交的正文只计一次，加每个快照确切正文与不可变序列化元数据（继续每条 2 KiB metadata 上限），整组接纳前预留容量。history count 仍为快照记录数，不静默扩大既有保留策略；导航改进归 T014-05。
- 已同意 host／validator、adapter、挂载 React／bridge、真实 pi 合成服务／原生宿主接缝：单个混合向量、20／21 项、1 MiB／+1、Unicode／转义上限、整批／整条原子失败、多项变化确认、异步准备期间编辑、旧答案／Stop／重建、完整预览与实际送达／历史字节。F5 与安装版分开记证，不与浏览器或模型效果混同。

## T014-05 有界活跃历史导航

**已接受契约。** 与本节其余WI-014规则共同适用；[委托验收与范围](../archive/2026-09-28-wi-014-attachment-acceptance.zh.md)区分实际环境与自动化证据，不推断REQ-008持久化或整份PRD接受。

- 保留 host 权威的 128 快照／8 MiB 无淘汰预算与现有完整有界、仅元数据的 `getAttachmentHistory` 投影。客户端按接纳顺序每页 **16 条快照记录**；显示记录范围／总数／当前页及提交分组或序号，不把 opaque ID 当源链接。同一提交可跨页，不能暗示未在本页显示的附件未曾发送。
- 打开历史默认最新页；首页／前页／后页／最新页意图明确且有界。之后元数据／状态刷新和 streaming delta 不擅自跳页；活跃会话丢失导致历史清空时诚实复位。视图重建可重置临时页码／滚动，但同一活跃会话须恢复 host 已确认草稿、元数据与精确预览。
- 完整字面预览仍按需，沿用 16,384 UTF-16／49,152 UTF-8 chunk、每视图一个活动响应、一个已组装的 256 KiB 快照。换页或收起历史时本地取消已打开的历史预览，不匹配的迟到块不得重开；页元数据与每次 delta 不传正文。草稿预览／捕获／确认／发送规则不变。
- 分页、预览和状态刷新不提交／改写／清空草稿；普通 streaming／状态更新保持所选页、键盘焦点和上下文滚动。一次最多渲染一页元数据，不增加分页 RPC、持久化或通用虚拟列表框架。
- `history-full` 保留全部未发送草稿与已保留历史。提供具体可选恢复指引：检查历史，或主动使用 **Developer: Reload Window**，明确当前聊天、附件快照及未发送草稿会丢失。不自动执行／重置，不暗示持久化；预算、来源与传输错误仍区分恢复方式。
- 在已批准 host／client／React 接缝，浏览器及独立 F5／安装版合成链路验证页边界／空历史、跨页混合提交、来源变化／删除及超过 32 条聊天后的完整预览、host／view／runtime 丢失、迟到块、Stop、预算与键盘／滚动稳定。

## Planned WI-013 本地交互契约

早期候选已被下方选定v3契约替代；原始路线／未定预算／证据要求见[历史归档](../archive/2026-09-28-wi-013-superseded-candidates.zh.md)。保留本标题供旧链接定位，不把历史候选当当前授权或实现状态。

## 证据边界

历史WI-010首片结论保留在[原归档](../archive/2026-09-21-closed-wi-history.zh.md#wi-010)。当前分层委托验收分别见[WI-021执行](../archive/2026-09-27-wi-021-execution-closure.zh.md)、[WI-013交互／恢复](../archive/2026-09-28-wi-013-acceptance.zh.md)、[WI-014附件](../archive/2026-09-28-wi-014-attachment-acceptance.zh.md)、[WI-016审阅](../archive/2026-09-28-wi-016-review-acceptance.zh.md)、[WI-017会话](../archive/2026-09-28-wi-017-session-acceptance.zh.md)。WI-010当前671构建／修正与新包实际F5／安装、CSP／trust／workspace／streaming及边界矩阵见dist/delegated-completion-20260928/wi010-installed/EVIDENCE.md。不同日期／版本的证据不相互替代。

契约为Living；三个广泛gate由[ADR0004](../decisions/0004-trust-and-lifecycle.zh.md)另行正式接受，不因契约整理自动接受。无paid／真实provider质量、其他OS或fork验证声明。

### WI-016 T016-01 — 脏编辑器写保护

Host 策略在提供审批前，以及单次批准或精确活跃会话授权实际放行前，检查内置 `write`／`edit` 目标。只读取 VS Code 文档元数据与文件系统身份，不读取缓冲区正文，也不保存文档。目标有未保存编辑时拒绝调用，并通过已有有界 `chatError` 提醒用户先处理修改、再明确重试；检查不可靠时也用固定恢复文案拒绝。不新增 Webview 能力或 gate 信封字段。

目标映射跟随声明 pi 0.86.1 的 write/edit 路径解释（相对／绝对、单个开头 `@`、home、file URL、Unicode 空格、原生 Windows shell 盘符写法）。已有文件匹配规范路径／文件身份；不存在的文件使用可解析的最近祖先。异步解析后重检文档集合，持续变化最多尝试三次；排除非 file／已关闭文档。无关脏文件不阻止干净目标或读取。审批等待期间变脏不会产生新 session grant；既有 grant 不绕过保护。最终检查期间取消或撤销授权不会重新放行。

这只是公开 `tool_call` 的执行前检查，**不是编辑器与随后文件写入之间的原子锁**。最终检查后的编辑、不透明 shell 写入、trusted extension 执行及并发文件系统变化，仍不能承诺完整保护。pi 继续拥有工具执行与取消；UI 解释拒绝原因，不自动重试、回滚或保存。当前检查及实机证据属于 ACTIVE，不代表 REQ-007 review diff 已完成。

### WI-016 T016-02 — 已应用变更审阅（契约）

本节落实 ACTIVE 中 Goal 已授权的 REQ-007 切片，不接受新 PRD／ADR。Webview 仅发送 v3／viewId／generation 命名意图：`getChangeReview` 无载荷，`openReviewDiff`／`openReviewSource` 仅带 host 所有的不透明 `id`；未知／过期 ID 不能打开任意路径或命令。Host 独立发送 `changeReviewState`，精确 DTO 归 `webviewProtocol.ts`。条目区分工具报告的 write/edit 目标与任务期间观察到的工作区事件；观察不等于 agent 独占归因。

Before/after 正文留在 host，通过只读虚拟文档打开 VS Code 原生 diff；不向 Webview 暴露快照正文、路径能力、进程、SDK 或通用命令。源导航打开当前重新校验的来源，不承诺旧位置。历史快照对不会被当前 Git／HEAD diff 替代，也不覆盖源文件。工具 complete／failed／interrupted 状态与观察到的文本差异分离；错误／Stop 可能发生在部分副作用之后。

Before 在已批准 write/edit 最终授权窗口捕获，after 使用公开工具完成事件，独立于有界活动展示文本。并发／preflight 重叠调用须披露，不伪称孤立操作归因。Host 在任务期间观察所选项目的额外变化元数据；没有 before 时明确无法提供已捕获 diff，不编造。仅捕获安全普通 UTF-8 项目文件；已知敏感路径／内容、外部目标、二进制／过大／不可靠读取给出原因，不截断或伪造快照对。捕获限制不静默替正常审批放行／拒绝工具；脏文档保护与最后重检仍强制。

技术保留界限：128 条记录、每个文本快照 256 KiB UTF-8、每个活跃 runtime 保留正文 8 MiB、展示路径 1 KiB UTF-8、UI 每页 16 条。不淘汰既有快照；记录／正文超限明确说明，后续工具继续走正常审批。有界读取与期限，迟到结果不得修改替换后的 runtime。元数据更新不重置当前页或草稿。快照跨视图销毁／重建保留，runtime／资源／会话替换时清除并明确提示。打开历史 diff 时重检当前来源，披露后续变化／不可用，不修改已捕获快照对。 原生打开操作单飞；重复意图不累积编辑器操作。Watcher 工作按已保留路径串行合并，待处理工作有界。最终授权拒绝移除临时快照，不占保留记录／正文容量。断开的 runtime 隐藏审阅操作时，重置／丢失提示仍可见。

### WI-017 T017-01/02 — 保存会话选择与顺序交接（契约）

Goal 已批准的 REQ-008 先落实公开 pi 持久化、当前项目列表、新建与主动恢复；完整渐进历史／历史附件恢复仍属 T017-03，列表或探针不代表完成。Agent 执行保持 subprocess RPC；adapter 自有、有界短生命周期 helper 可使用声明包的公开 SessionManager API 枚举及校验项目／身份，不自行读写 session 文件格式。返回的存储路径仅作 host/adapter 的不透明参数。活跃会话使用 pi 原生持久化，不建扩展自有存储；空会话可能需 pi 持久化后才出现在列表。

新增 v3/viewId/generation 命名意图：getSavedSessions(page：非负安全整数)、newConversation（无载荷）、resumeConversation(id：host 发出的不透明列表 ID)。原生 host 确认先于修改；恢复必须确认其他入口已退出，并说明这不构成独占锁。确认同时披露 Stop、未发送草稿／附件丢弃、内存附件历史丢失及 grant／review 清除；取消或失效确认不切换。确认后活跃任务须经既有 Stop 流程等到 settlement；失败不启动另一会话或暗中重试任务。资源同意及受控默认仍有效，不自动安装／加载历史扩展；启动目标会话前重检项目／选择身份。

独立 sessionState DTO 投影 phase（idle/listing/confirming/switching/error）、当前公开 session 身份／名称、是否加载、每页 16 项与总数，以及固定错误码。列表项只含不透明 UI ID、有界标题／摘要及修改时间，不含存储路径或任意 SDK 调用。元数据界限：标题 160 字符、摘要 256 字符、时间戳 40 字符；只有当前发出页的 ID 可操作，失效选择须刷新。Helper/host 校验分页请求与结果；刷新可能反映外部变化，不是锁定的历史列表。

列表／切换有自有取消、期限及有界输出，不累积无界重复请求。项目／runtime 替换、销毁或失效原生确认使旧工作失效。成功commit会话替换先重置加载profile为controlled，清除显示名／error，再推进Webview generation并清空临时授权、延后模型、review和附件内存；Cancel／commit前inspect失败保留旧profile。保存会话身份不同于 adapter 的数字 runtime generation。失败明确且可恢复；公共 API 成功不自动代表完整历史恢复 UI 已交付。

### WI-017 T017-03 — 有界恢复历史与保留文本（契约）

Host 将公开 SDK 的活动分支（含可用的 compaction 前对话及通用工具／自定义／摘要记录）投影到独立保存历史区域，不在实时消息中重复这些行；展示不改变 pi 的模型上下文。初始及向前／向后每页最多 32 条顺序记录，每条最多 4 KiB UTF-8 文本，明确标记截断／不支持内容。历史工具名称与状态只描述旧记录，不代表当前已加载能力或重建成功。结构化后备展示有显式深度／字段／字符串上限并遮蔽凭证类字段名；明确标记 `display: false` 的记录同时从分页和预览序号中排除。不执行历史 renderer 或扩展代码。概览／预览逐段消费文本，不拼接整条大记录。

恢复时公开分支最后条目作为仅 host 持有的锚点；之后各页及预览经公开 SDK 重新读取并限定至该锚点，继续对话不会移动旧页偏移。锚点消失或不在当前分支时明确失败，不展示另一分支。扩展不增加 session 文件格式、附件存储、全局搜索或分支 UI。Helper 使用有界结构化请求、15 秒期限、1 MiB 响应上限并观察子进程实际 close；原始诊断与存储路径不进入 Webview。

新增命名意图 getSavedHistory(page) 与 getSavedHistoryPreview(id, requestId, offset)，仍使用 v3/view/generation 信封。savedHistoryState 含可用性、idle/loading/error、单页、页码／总数与固定错误。Host 将 SDK 条目 ID 替换为临时行 ID，只有当前窗口的 ID 能请求保留文本。savedHistoryPreview 关联 id/requestId，携带固定错误或最多 8192 UTF-16 code unit 的字面文本块，以及 offset/nextOffset/done/totalChars；分块不切开 surrogate pair。UI 只保留单个渲染窗口与预览块，提示更早内容并可翻页，不累积完整历史。

保留文本动作展示公开消息中实际保留的原文。可识别的显式上下文 prompt payload 将其文件／选区附件文本展示为历史快照，缺失字段／内容明确标为不可用；未知格式仍以带限制说明的字面文本展示。绝不重读当前源路径冒充旧附件、不重建图片、不额外保证持久化；结构化或不支持数据的遗漏在文本预览中也明确说明。

会话／工作区替换与销毁取消旧读取并撤销行能力；视图重建取消进行中的预览，但保留已完成的不可变历史窗口。目录／检查等待已接纳的历史读取及先前实际 helper 所有权 settled，过期原生对话框不属于该屏障。与目录请求竞争的新历史读取获得可恢复回复，不会无限 loading；视图释放也取消进行中的目录请求。Host 在异步 Stop／检查之后、确认切换正式提交之前再次核对草稿 revision；只接纳自身取消附件准备产生的那次 revision，之后用户编辑仍使确认失效。已提交切换清空旧附件结果及草稿内容。运行时替换一旦提交，其完成不依赖旧视图、不重复任务；提交前旧视图不能授权新交接。延后模型选择／grant／review／实时附件内存不迁移。

WI-017已按委托接受；预算／真实runtime／原生host／安装包及修复证据见[验收记录](../archive/2026-09-28-wi-017-session-acceptance.zh.md)，不自动接受广泛gate。

## WI-013选定v3接入契约

**已按委托接受的选定v3设计。** [ADR0002](../decisions/0002-interaction-contract-route.zh.md)及[WI-013验收](../archive/2026-09-28-wi-013-acceptance.zh.md)拥有决定／实际证据与兼容限制。host coordinator、公开RPC dialog／command adapter、process owner／recovery fence、profile coordinator、v3 validator及mounted共享chat是批准seam；测试观察公开状态／效果，不读取私有字段。

### 加载、覆盖与可见失败

trusted profile通过host原生picker选择**一个显式本地入口文件**（.ts／.js／.mjs／.cjs），这是入口，不保证sandbox其imports。加载前核对canonical regular file并拒绝已知凭证／配置路径；不检查用户秘密、不安装依赖。原生确认展示完整所选路径，警告可执行初始化、未覆盖扩展内部代码、单runtime恢复域、custom TUI限制和restart须新同意。取消／过期确认不生效。侧栏仅收到有界display name和profile，不得到任意可执行路径capability；不自动发现／下载，不从Webview字符串选择runtime。

仅当host任务、handler lease、dialog、approval、model mutation和session操作均idle时切换。使用当前公开saved-session身份重建runtime，保留仍有的未发draft／dialogue，清临时grant／review／interaction，再公开readback验证ready。失败保持unready及可用draft／dialogue，不自动fallback／replay。retry或显式恢复默认controlled，除非重新显式选择并确认trusted。新投影以model／thinking readback为准，不用旧UI猜测。

两profile保留covered tools询问；controlled工具仍用既有精确scope。trusted额外允许在gate边界通过公开getAllTools核实的**已注册custom tools**，最多64个有界custom name；unknown及覆盖builtin名字均拒绝。custom call显示完整有界literal JSON input、custom extension tool覆盖警告，仅Allow once／Deny，不隐授file／shell／session grant，也不保证builtin dirty-write保护。保留既有credential-like／过大input拒绝。这是已知custom tool审批，不是unknown fallback。trusted可执行代码及后续外部副作用不在安全sandbox内；metadata／token关联不认证恶意扩展。gate ready绑定profile／runtime；初始化inventory缺失／无效或extension_error即ready失败，不能因get_state成功而忽略。命令错误在prompt success后也须可见。

### 精确交互DTO方向

新browser intent沿用exact-own-fields envelope并一致升至`version: 3`，携带当前viewId及非负safe-integer generation。新intent为`chooseExecutionProfile { profile: "controlled" | "trusted" }`、`answerInteraction { id, answer }`、`cancelInteraction { id }`、`endOwnedRuntime {}`及`recoverControlledRuntime {}`。ID沿用opaque 1～100字符host-ID规则。browser不传文件路径、remote ID、PID、SDK调用、任意命令或恢复record。answer精确discriminant为`{ method: "select", optionId }`、`{ method: "confirm", value: boolean }`或`{ method: "input" | "editor", text: string }`。host先验method／当前active成员／精确选项归属／UTF-8预算再reserve。空字符串保留，不转换cancel。option用host opaque ID，仅adapter映射原始字符串。

interactionState投影active form或null、queued count、phase（idle／waiting／blocked）、有界固定错误码、有界literal feedback及丢弃数量。form共有opaque id／method／title及可选且明确标记的local cutoff timestamp；select加option ID／label，confirm加message，input加placeholder，editor加prefill。origin明确是“trusted runtime extension；未认证”，不从title推断。不虚构remote-consumed／closed／completed字段。独立executionProfileState投影controlled／trusted display label、phase（idle／selecting／switching／recovery-required／error）、固定错误码和当前named action可用布尔值。独立providerConfigState投影无密钥的供应商就绪状态、可选认证来源标签、默认 provider／model 及有界默认模型目录；API 密钥永不出现在该投影中。独立pluginInventoryState投影 busy／error 以及最多 64 条 `{ id, displayName, enabled }`（id 遵循 opaque host-ID 规则；displayName ≤512 UTF-8 字节）；记住的路径留在宿主文件。host保持权威，Webview不能清fence。

标准feedback按literal呈现notify、keyed status及string-array widget；terminal title／editor text请求显示为带标签feedback，不执行title命令或静默替换draft。custom／component TUI、editor readback、任意终端layout不支持，加载前明确披露。最多16条feedback、总65,536 UTF-8字节、每条32,768字节；最多八个status key、四个widget key，每key最多100字节。keyed update替换旧条目，clear删除；容量丢弃最旧feedback并计数，绝不丢弃可操作form／answer。过大或credential-like内容只产生固定安全警告，不投影原文。widget placement只是提示，内容仍可在扩展feedback区访问。feedback不是dialog completion证据。

### 仲裁、时间与生命周期

host coordinator拥有一个active加七个FIFO queue及当前view投影；adapter拥有私有remote ID、精确connection-lifetime重放保留和一次性reply capability。异步write前同步reserve／invalidate；之后Stop／loss能抑制尚未尝试的肯定write，不确定投递不retry。host／view／runtime替换先撤销旧答复权再cleanup。仅Webview重建用新viewId同步原host ledger，不重放timer／request。invalid／stale／duplicate输入无副作用；拒绝表单可能继续扩展代码，标签与Stop区分。

使用ADR0002选定数字。通用RPC frame／partial-buffer边界仍独立执行；通用stream overflow／loss不能伪造interaction exit或变成不兼容自动kill绕过。有效远端timeout duration须有限、非负且最多86,400,000ms；更大／无效明确unsupported，不静默缩短。本地receipt-based cutoff一次性撤销active或queued，不能证明上游何时过期；无timeout表单可无限等待人工。trusted startup接纳且未答复的表单只暂停剩余15秒readiness-response预算；回复write完成后恢复剩余传输预算，不据此推断handler完成，也不延长独立Stop观察预算。回复传输最多16个in-flight write，共享有界stream listeners，五秒内须同时观察write callback和drain；容量或不确定交付失败阻断连接，不重试或自动终止。已知精确extension-command handler lease无人工答复ACK计时器，write仍有五秒deadline。普通prompt transport／admission预算独立；matching handler response只释放该lease，error／agent work／未决dialog／queue分别追踪。不能因只有一个pending prompt就把unknown／误格式slash分类为该lease。

Stop先关闭准入、撤销／取消未答form与covered approval，包括取消引出的下一form，再clear公开queue并abort。五秒观察独立handler／agent／dialog义务；到期未证实则stop-unconfirmed／recovery-required，禁止send／profile／session／model transition及answer，保留可用draft，显示terminal／manual-end指引。不自动replay或kill。不宣称detached extension work已settled；可靠识别的不兼容操作排除，无法分离则排除扩展。显式End owned runtime与controlled recovery遵循ADR0002持久exact-child契约，不接受任意PID。pending startup／error／stream loss／host loss／observed child exit／never-spawned失败／receipt成功退休仍区分。工作区无执行资格（受限／无文件夹／多根）时仍可清理确切已保留运行；不授予信任／资源同意、不绕过启动资格。见ADR0002的WI-010清理修正。

### 启动交接（WI-035）

**WI-035 启动交接已接受。** [Accepted ADR 0006](../decisions/0006-owned-runtime-handoff.zh.md) 在所需验证后记录下述启动交接。只取代 ADR 0002 的下一宿主启动仪式；会话内 Stop／协议恢复仍有效。共享域准入后来由 [ADR 0009](../decisions/0009-per-window-recovery-domains.zh.md) 取代。[WI-035 证据](../archive/2026-09-30-wi-035-macos-acceptance.zh.md)区分实际 F5／安装、活所有者安全与未验证分支。

宿主在新启动准入前完成一次遗留运行交接；单独 Webview bootstrap／重建不会重做交接。空域或已验证退休显示正常空对话／无文件夹页，无恢复控件。匹配 supervisor 报告 `owned` 表示该域仍有活宿主：此处不对非本窗口域提供 End／Recover，也不请求终止；对本窗口已占用域尝试启动不创建替代运行。只有 `owner-lost` 在启动时自动结束，且退休前须有匹配 run／child 的终态证据。[ADR 0008](../decisions/0008-owner-loss-child-cleanup.zh.md) 之后，丢失宿主的 supervisor 也会当场结束该精确 child；后续交接往往观察到终态回执，而不是仍在运行的遗留进程。不可达／不确定／损坏时保留既有 `recovery-required` 投影和操作规则。v3 协议、错误码、显式会话内恢复、新工作区／资源核对与不重放规则不变。已 disposal 的宿主或过期工作区不能发布迟到交接结果或从旧文件夹启动。

### 所需验证与架构结论

治理维度1～19已通过WI-013限定实现与分层证据核对：owner／公共seam／v3 DTO、需求与状态并发、故障cleanup、安全／数据／隐私／背压、构建／兼容／UX。确定性测试与实际runtime／原生F5／安装／多窗口各自证据及限制见[委托验收](../archive/2026-09-28-wi-013-acceptance.zh.md)。限定设计成熟度为Implemented／Accepted，ADR0002 Accepted；三项广泛gates后来另由ADR0004接受，其他WI完整接受不由本节推断。


## WI-084 文件发现意图

`completeFileReference {draftRevision, caret}` 是具名 v3 chat-only 操作，继承 generation／view 身份；caret 为 0–8000 整数，仅允许这些字段，不接受 path／query／RPC。Host 从已确认草稿独立推导光标处独立 @ token，再使用既有附件准备占用。原生发现不读正文，返回仅 host 持有的 URI，仍经 captureFile 和全部敏感／大小／变化检查。成功原子附加整文件且仅移除该 token；取消／失败／失效保留草稿与附件。设置页无处理器，浏览器无文件系统能力。[WI-084](../discussions/2026-10-03-wi-084-file-completion.zh.md)保留待完成原生验收。


### WI-086 当前项目 metadata 搜索

v3 新具名 intent：searchSavedSessions { query, namedOnly, sort }。host 验证 exact keys、query 字符串 <=256 UTF-16／无控制字符、boolean 与 recent／oldest／name 枚举，并重验 view／generation／会话准入；不接收存储路径或正文能力。host 拥有临时 applied criteria，新搜索清旧行、取 page0；getSavedSessions／刷新／rename 刷新保持 criteria。SessionState 增加可选 search metadata／catalogue-too-large 错误。worker v1 list 接受可选已验证 search；无该对象保留旧请求语义，有则对完整有界当前项目既有 metadata 先筛排后分页，核对计数／页、clamp 页。公开 SessionManager 取消／15 秒 worker 截止不变；>5000 明确拒绝而非截断。无全文／持久／全局／自动恢复，原恢复确认／串行交接不变。browser 独立验证投影，只按类型 import 合同。[WI-086](../discussions/2026-10-02-wi-086-session-search.zh.md)拥有待完成 native 验收。
