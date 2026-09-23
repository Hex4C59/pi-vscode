# 已关闭工作项历史 — WI-001～007 与 WI-010～012

[English](2026-09-21-closed-wi-history.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-21-closed-wi-history.md](2026-09-21-closed-wi-history.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-22
- 类型：归档
- 状态：Historical
- 创建：2026-09-21
- 权威：仅作上下文；当前工作仍以 [`ACTIVE.md`](../../ACTIVE.md) 为准
- 归档原因：WI-001/002/003/004/005/006/007/010/011/012 已关闭；其提案、验收证据与旧交接不再属于当前工作入口。WI-008／WI-009 未关闭，仍保留在 ACTIVE。

> 不得按本文件直接实现。它保留历史范围、批准、证据和限制；现行需求、架构、gate、ADR 与 `ACTIVE.md` 优先。

记录中的版本、脚本路径及“待验收”均是各次收尾时的快照。后续 19:44 延后选择确认及 WI-011 脚本分组见 [ACTIVE](../../ACTIVE.md)，现行命令入口见 [pi 集成指南](../guides/agent/pi-integration.zh.md)。原路径与原验收观察保留，不据此推断本次重跑。

<a id="wi-012"></a>
## WI-012 — 最小公开 API 兼容性探针（2026-09-22 关闭）

归档原因：维护者明确确认**最小探针切片**收尾，随后仅进入 WI-013 标准交互／Stop Prepare。[ACTIVE](../../ACTIVE.md) 持有替代提案。仍活跃的[兼容性调查](../discussions/2026-09-22-pi-compatibility.zh.md) 保留确切运行命令、分阶段观察及尚未执行的完整 CF 矩阵，不整篇归档。关闭接受限定调查结果和缺口，不是产品兼容、ADR 或 gate 验收。

### 批准提案与批准顺序

- **分类：** 纯技术、spike-only；关联 REQ-009.3–5、REQ-006／008 与 REQ-005 约束。project-trust／session-streaming 及 webview-trust gate 保持 Open，WI-010 pending ADR 保留。原前端候选编号用于 WI-012，前端工程化仍未分配。
- **14:50 Prepare／14:59 Build 授权：** 在 `scripts/spikes/` 添加独立调用 runner、worker、合成扩展、helper 与 `.spec.mjs` 回归，沿用现有 runner。不改生产源码、依赖／锁文件、构建或 CI；允许按需新增独立 npm 入口，实际未添加。SDK 仅用于隔离夹具进程，不改 ADR 0001 生产子进程基线。
- **P1（CF-05 子集）：** 公开包 API 创建／保存一次性 A／B 会话，`SessionManager.list` 枚举 A，经 RPC 恢复返回的不透明路径，检查历史／项目标记、空列表／不可用／错误及无重放。不解析会话文件、不证明独占锁或产品授权重置。
- **P2（CF-03 子集）：** 合成初始化／命令／工具／hook，对比受控禁用和明确加载、active-tool 排除，以及真实临时写入拒绝／允许的副作用。最初禁止真实或假模型调用；找不到公开无模型执行入口记 blocked，不以直接工具／mock 代替通过。
- **P3（CF-04／08 子集）：** select／confirm／input／editor 完成、普通取消、公开支持的超时、clear_queue／abort／断连、请求／进程代次与迟到／替代答案。普通取消不是 Stop 或全部扩展代码终止，不支持路径明确记缺口。
- **16:06 补充范围确认，随后单独明确批准代码／运行：** 允许公开合成助手消息持久化，及无网络确定性 provider 输出驱动 P2 真实 pi 循环；细化取消先于 abort、继续执行／迟到答案、探针代次 ledger 与独立自然 EOF 观察。仅对这些夹具替代原假 provider 禁令；不授权真实模型／外网、本地凭证加载或产品 Build。共同理解确认本身不是执行批准。
- **隔离／预算：** 先检查固定版本公开签名／CLI 和夹具；唯一自有临时 home／config／session／cwd，环境白名单排除真实密钥、凭证命令、代理与用户／全局扩展；禁止安装包／外网。`PI_OFFLINE` 不足以隔离。无法建立可观察隔离即 blocked，不改全局防火墙／环境。提议并批准预算为请求 10 秒、场景 60 秒、退出等待 5 秒、场景诊断 64 KiB；超界失败，不重试不确定副作用。成功／失败只清理自有资源，记录失败与实际子进程退出，不保证全部后代。
- **架构核对／验收：** Direction、spike first。保留分层／范围／存储边界；公开 API、关联、错误、隔离、有界诊断与清理须运行证据。各变体记录 passed／failed／blocked／not-run、确切命令／包／Node／OS、输入／预期／实际、事件顺序、副作用与退出。helper 回归覆盖空输入／关联／超时／非零退出／清理／日志预算，运行相关回归、全量 tests、JS 语法和文档检查。产品 UI／可访问性／安装验收 N/A。失败是调查证据，不是兼容成功。
- **范围外：** 完整 CF-01／02、CF-06／07、profile／授权重置矩阵、性能、真实扩展、F5／已安装 VSIX、前端工程化、生产 SDK／架构／会话格式修改、旧 trust 探针修改、其他 WI／ADR／gate 关闭及提交。

### 历史执行、验收对照与限制

最初无模型完整运行于 15:30 exit 0；默认 root WSL 执行经审阅改为 nobody／UID 65534 guard，两个 RPC 与 worker 退出、清理通过。P1 仅用户／自定义消息持久化及 P2 受覆盖执行 blocked；P3 仅 abort 后仍接受肯定答案。历史 Windows tests 101/101、Linux helper 7/7、五脚本语法通过。这些结果推动单独获批补充，并非静默扩大范围。

最终完整运行于 **UTC+8 16:20:45** 结束，pi **0.86.1**、Node **v24.12.0**、Ubuntu-24.04／WSL Linux **6.18.33.2-microsoft-standard-WSL2**，非特权用户／network namespace，无接口／可用路由，环境白名单与隔离夹具。五个 RPC 与 worker 均 exit 0，自有清理通过。不是文件系统沙箱或 Windows 宿主验证；确切命令及变体观察保留在上述调查。

- **P1 合成公开 API 边界通过：** 助手夹具使 A／B 持久化，A 列表排除 B；RPC 恢复三条消息，含 A 标记、无 B／任务重放。缺失路径仍成功空历史；真正恢复失败、终端生成历史及产品授权重置未验证。
- **P2 合成拦截边界通过：** 固定 provider 驱动真实 pi 循环；内置／自定义写工具拒绝后无目标，允许后精确内容。合成 hook 成功不证明产品自带 gate、所有扩展或真实推理。
- **P3 部分观察／兼容缺口：** 先取消再 abort 的 confirm 返回 false，旧答案无影响，但扩展 JavaScript 继续；仅 abort 接受 true。四种对话框有请求／继续／完成观察。跨代次仅测探针 ledger。自然 EOF 在 owner shutdown 前 exit 0 且无完成标记，不证明优雅取消。editor timeout 仍 blocked；没有完整 Stop 保证或产品宿主迟到答案验证。
- **历史检查：** Windows 103/103、Linux helper 9/9、五脚本语法、docs:verify 与 diff 检查通过；当时保留 ACTIVE 长度警告。较早 docs:health 通过。本次纯文档收尾未重跑 tests／探针，当前文档检查归 ACTIVE。不宣称真实 provider 请求、凭证读取、F5／安装版 VSIX、真实扩展、产品／依赖／CI 修改或提交。
- **收尾对照：** 获批探针要求诚实逐变体证据，而非兼容全通过。剩余 P3／恢复错误缺口明确结转，子集结果不接受整个 CF 夹具。WI-008／009 开放、WI-010 ADR pending、三个相关 gate Open。REQ-009 的操作级不支持／终端回退、已待决未确认停止／手动结束政策仍是未来目标；不批准自动终止／重启补救，既有故障关闭保留。WI-013 在 Build 前须建立可靠分离／完成依据，否则报告阻塞。

<a id="wi-011"></a>
## WI-011 — 模块内测试结构重构（2026-09-22 关闭）

归档原因：维护者于 9 月 22 日 14:50 请求收尾，随后进入兼容性 Prepare。当前工作转至 [ACTIVE](../../ACTIVE.md)；此处保留已批准技术范围，不代表产品交付。

- **批准范围：** 应用测试迁入 extension／adapter／webview 各自的 `tests/`，统一 `.spec.ts`；脚本使用 `.spec.mjs`。按 workspace／focus／runtime／model／bounds／protocol／approval／architecture、adapter projection／environment、Webview HTML／workspace／model／execution 拆分连贯套件并提取局部 harness。保留全部原场景／断言，生产源码位置不变。
- **Runner 提案与验收：** 薄 runner 加 import-safe 递归收集库，排除 helper／fixture／其他层级和符号链接，保留相对输出路径，仅执行本次确切清单。只清理 `dist/tests/`；空集合、构建和进程失败均失败退出。临时夹具覆盖发现、同名隔离、排除、旧输出清理与失败。保持 node:test、esbuild、生产打包／依赖和既有 CI 范围，同步 package／CI／文档引用，不新增 tsconfig 或测试层级。
- **追加批准（2026-09-21 20:33）：** scripts 按 docs／testing／spikes／packaging 分组，文件名、对外 npm 命令与行为不变；同步根路径计算、导入、CI 及夹具。不增加 src/tests 多层目录、不运行付费调用或扩大验收，原已批准计划未改。
- **架构／风险核对：** 保持既有分层所有权；迁移须同步递归收集以免漏掉嵌套测试。风险为遗漏／重复用例、输出冲突、旧 bundle、cwd／VM 变化；名称基线与收集器回归提供已记录证据。不改变生产边界或需求；本 WI decision／gate 为 none。
- **历史验证：** 原基线 73/73、0 skipped（44 应用＋29 脚本用例）。应用用例拆入 14 个模块内 spec，保留原名称／场景／断言。11 个 runner 回归后为 84/84，包含 Unicode 与非根 cwd。实现时及 19 文件 scripts 分组后 compile、lint、docs:verify、docs:health、diff 检查通过。三个探针入口与 VSIX 入口语法检查通过，未重跑探针或 VSIX 验收。scripts 仍不在 lint 范围，有专门回归覆盖。
- **后续独立维护证据：** 提交隔离检查器新增 10 个测试，记录为 94/94，compile／lint／docs／diff 检查通过。不是 WI-011 迁移再新增 11 个用例，也不是本次收尾重跑。
- **收尾限制：** 本次仅文档收尾，依据既有检查记录与维护者收尾授权，不宣称新运行应用测试／compile／lint／F5／VSIX。本次文档检查记录在 ACTIVE。收尾不涉及生产逻辑、依赖／锁文件、新 e2e／snapshot／性能通道、CI 矩阵扩展或 Git commit。既有 project-trust 探针的 0.85.1 guard 仍不同于 0.86.1 pin，不推断探针结果。WI-008／WI-009 保持开放，WI-010 pending ADR 与三个 Open gate 不变。

<a id="wi-001"></a>
## WI-001 — 构建基线与运行时探针

- **结果：** Accepted [ADR 0001](../decisions/0001-build-baseline.zh.md) 记录扩展壳、辅助侧栏基线与子进程 RPC 方向。
- **已关闭 gate：** `gate-extension-host-baseline`、`gate-sidebar-chat-shell`、`gate-runtime-host`。
- **证据：** TypeScript/esbuild 扩展壳、F5 占位页、一次带有界关闭的 `get_state` 子进程探针。
- **限制：** 未交付用户聊天、流式、模型选择、会话或 webview 信任关闭。历史 runtime spike 证据已合并入 ADR 0001；原始日志与精确原始环境记录未保留。

<a id="wi-002"></a>
## WI-002 — 版本化 ping/pong Webview 桥

- **批准范围：** nonce CSP Webview 桥与一条版本化、允许列表 ping/pong 往返；无 pi 运行时、密钥、通用命令或聊天。
- **验收：** 维护者于 2026-09-19 在 F5 观察到 `Connected (ping/pong only)`，并确认视图仍不能发送真实聊天。自动化检查拒绝畸形、未知及扩展字段消息。
- **决策：** `none`；`gate-webview-trust` 保持 Open，未写 ADR。
- **历史方案：** 宿主将入站数据视为 `unknown`，行动前严格校验 envelope；Webview 无 Node、文件系统、shell 或 pi SDK。

<a id="wi-003"></a>
## WI-003 — Project trust 技术 spike

- **决策类：** `spike-only`；维护者批准范围，并于 2026-09-19 验收技术结果。`gate-project-trust` 保持 Open。
- **问题：** 固定 pi `0.85.1` RPC 能否在启动及跨 `cwd` 会话切换时应用明确项目资源选择，而不直接读写 pi 会话或信任文件？
- **方法：** 隔离临时 home/cwd/config；公开 `PI_CODING_AGENT_DIR`；最终运行设置 `PI_OFFLINE=1`、`PI_TELEMETRY=0`；会话 fixture 与 remembered trust 仅经公开 API/hook 创建。未调用模型或安装项目包。
- **六组观察：** 全局 `always` 默认／`--approve`／`--no-approve`、remembered trust 加 `--no-approve`、全局 `never` 默认、全局 `never` 加 `--approve`。项目 extensions、skills、prompt templates、`APPEND_SYSTEM` 标记服从明确选择；`--no-approve` 覆盖全局 `always` 和 remembered trust。切换 cwd 后旧项目命令消失；每次切换观察到两次 resume 事件，调用方不能假设只有一次。
- **仍有效限制：** 拒绝项目资源后，全局扩展与 `AGENTS.md` 上下文仍存在。项目 settings 效果与 themes 未独立观察；项目包刻意未安装。系统提示证据来自 `session_start`/`getSystemPrompt`，不是 provider 请求。没有 OS 网络沙箱或独立流量审计。早期探索尚未设置 `PI_OFFLINE`；只有最终重跑使用该开关。
- **验证：** 六组真实运行时场景与策略／生命周期测试，覆盖成功、超时、失败、取消、启动错误、回调错误及清理。这证明 spike 行为，不证明完整生产隔离。

<a id="wi-005"></a>
## WI-005 — 文档健康第一阶段

- **结果：** 维护者于 2026-09-19 验收。纯技术仓库维护；未改变产品行为或 gate。
- **交付：** 双语治理指南、项目 documentation-health skill、只读 `docs:health`、生命周期元数据检查及测试。
- **限制：** 无调度器、自动语义审查、自动清理／修复、持久问题库、commit 或 PR 自动化。缺少生命周期元数据不证明新鲜；历史 ADR 仍为历史证据。
- **已记录产品讨论：** 维护者在 Draft PRD 中确认 D-01～D-04 首版方向：默认操作前询问并对范围内只读给出例外；非持久单次／当前存活会话授权；项目资源拒绝与工具审批分离；每窗口单本地目录与单活跃运行会话，显式有界文本上下文及诚实的修改归因。这些选择未批准具体实现 WI，也未把整份 PRD 变为 Accepted。

<a id="wi-006"></a>
## WI-006 — 工作区与项目资源选择 UI

- **批准范围：** 展示本地工作区资格，并记录可修改、仅内存的 allow/decline，不启动 pi。阻断无目录、多根、远程、非 file 及未信任工作区；提供原生目录／信任恢复。
- **安全／生命周期：** 宿主拥有身份与代次；拒绝 stale 消息；路径用 `textContent`；无 Webview 存储、pi trust 文件写入、密钥或运行时。视图重建保留选择；工作区／资格变化或扩展宿主重载清除。
- **修正：** 打开目录使用公开 `updateWorkspaceFolders`；编辑器标题明暗 Pi 图标恢复／聚焦现有视图，不切换隐藏。
- **验收：** provider/DOM/契约自动化通过。维护者验证项目显示、allow/decline、隐藏后恢复、独立 CLI profile 重载清空、未信任恢复与多根失效，并于 2026-09-21 按 F5 清单验收，未报告问题。
- **限制：** 未关闭 `gate-project-trust` 或 `gate-webview-trust`，未启动 pi，未证明剩余项目资源类别，也未交付完整 REQ-001。早期交接记录远程宿主及部分主题／辅助功能路径未全部独立取证；最终验收未报告问题，但未产生关 gate ADR。

<a id="wi-007"></a>
## WI-007 — 根据资源选择启动 pi RPC

- **批准范围：** eligible 工作区以 `--no-session` 和明确 `--approve`／`--no-approve` 启动固定 pi RPC；一次成功 `get_state` 作为 ready 证据；选择、工作区、资格或 dispose 变化前保持进程。
- **架构：** 宿主消费注入的 `PiRuntimeLifecycle`；扩展入口连接子进程 adapter；Webview 展示 `not-started`、`starting`、`ready`、`stopping` 或 `error`，不接收进程能力或凭证。
- **验证：** `npm test` 44/44，compile、lint、docs 检查通过。2026-09-21，维护者在受信任单根本地工作区观察到 `Runtime connected (RPC)` 与 `Choice recorded: allow project resources`，并声明 F5 验收通过。
- **限制：** 无聊天输入、流式、模型 UI、工具审批或会话列表。两个 trust gate 保持 Open；WI-003 未观察类别与隔离限制继续适用。

<a id="wi-004"></a>
## WI-004 — 首条端到端聊天（最小流式切片）

- **PRD：** REQ-004 最小 Draft 切片（用户文本 + 助手 `text_delta` 流式）；不交付 REQ-002/003/005/006/008 完整能力。
- **批准范围：** `runtime === ready` 后 `sendChat`；宿主 `prompt` + `--no-tools` RPC；`text_delta` 投影与 `agent_settled` 结束忙碌态；内存 transcript；双语 [`webview-messages`](../reference/webview-messages.zh.md) chat Outline。证据见 [WI-004 RPC（0.85.1）](../discussions/2026-09-21-wi-004-rpc-evidence-0.85.1.zh.md)。
- **Build 交付（2026-09-21）：** `PiRuntimeLifecycle.prompt`／事件订阅；`pi-rpc-runtime` 长生命周期 JSONL；读取 `~/.pi/agent/settings.json` 启动 `--model`；`chatModel` 展示；`auto_retry_end`／无回复时的有界 `chatError`。
- **验收：** 维护者 2026-09-21 声明关闭 WI-004。F5：助手文本快速逐字流式；Send → Sending… → Send；上游 503 时显示错误；在 pi 保存启动默认模型（如 gpt-5.6-luna）后扩展侧恢复正常。自动化 `npm test` 49/49、compile、lint、`docs:verify` 通过。
- **限制：** `gate-session-streaming`、`gate-webview-trust`、`gate-project-trust` 仍 Open；无扩展内模型选择（REQ-002）、Stop、工具审批、会话历史；provider 错误可能仍含简短 JSON 片段；模型依赖 pi 启动默认而非 TUI 临时切换。

<a id="wi-010"></a>
## WI-010 — 思考展示与受控工具执行

- **批准与关闭：** 2026-09-21 批准 Build 与受控配置；维护者确认下述四项 F5 后，于同日要求“进入收尾吧”。关闭的是限定 WI，不是整个 PRD 或架构 gate。决策类 `adr-after-approval`；Decision `pending-adr` 仍在 ACTIVE 跟踪。
- **PRD 与已批准提案：** D-01／D-02 下用户可见的 REQ-004／REQ-005／REQ-006 切片。固定 pi `0.86.1` 子进程 JSONL RPC，展示真实上游 thinking／工具结果，启用受控内置工具与 Stop，不重写 Agent 循环。稳定 ID 折叠卡、累计输出替换、最终消息校正、逐项有界输出及 64 项上限内预留提示保留展开／焦点／滚动；省略展示不跳过审批。完整审批输入、授权查看／撤销、Stop 保留草稿已实现。
- **执行前边界：** 自带异步 `tool_call` hook 经公开 `ctx.ui.confirm` 等待；版本化封装绑定 runtime／cwd、request／tool-call ID 与完整参数。gate hello 与 `get_state` 是就绪前提。文件／握手缺失阻止启动，不是可用的无工具回退；单靠 `tool_execution_start` 不构成拦截。
- **策略与生命周期：** 仅工作区内 canonical 普通文件 `read` 自动允许；搜索／列目录、写入／编辑、shell、外部路径询问；未知工具拒绝。既有文件授权匹配工具 + canonical 路径；shell 匹配工具 + canonical cwd + 完整输入。不存在／无法解析目标仅允许一次。授权仅内存保存，同一运行会话的普通 settled／Stop 保留，替换／工作区变化清除。Stop 先使待审批失效，再 `clear_queue` + `abort`，等待 settled 或报错／关闭，不重放副作用。不回滚，不保证取消所有后代进程。
- **受控配置：** `--no-extensions` 仅显式加载自带 gate，不受项目资源同意影响；生产强制 `PI_OFFLINE=1`／`PI_TELEMETRY=0`。保留可信用户 provider 配置、环境凭证及凭证命令。Offline 限制启动网络／缺包安装，不阻断推理 HTTP 或工具联网。规范化不消除文件替换竞态；输出过滤尽力而为；凭证命令不属于工具 gate 覆盖。不是沙箱。
- **维护者 F5 验收（2026-09-21）：** (1) thinking／状态展示正常；(2) 文件读取与工具卡正常；(3) 拒绝写入无副作用，随后允许写入正常；(4) 长时间无害命令执行中 Stop 正常。这四项是手动收尾依据，不代表完整审批／生命周期／主题矩阵或已安装 VSIX 测试。
- **此前报告的自动化，本次文档收尾未重跑：** `npm test` 73/73、compile／lint；九个真实 pi 审批夹具：allow、deny、timeout（含迟到回复）、stop、shell-allow、shell-deny、shell-stop、shell-running-stop、load-failure。运行中 PowerShell 输出后被 Stop，未创建后续 marker；发现／settings／本地 package 第三方扩展 marker 均未出现。Fixture provider 无真实 provider 凭证；load-failure 使用 `--no-tools`，区别于生产启动拒绝。
- **此前报告的 offline／打包证据：** `scripts/spike-offline-inference.mjs` 使用 `--offline`，跳过缺包安装，实际一次 loopback HTTP 推理返回 `loopback-ok`；生产环境覆盖另有单元测试。完整依赖 `dist/pi-vscode-validation.vsix` 为 139.71 MB／14,080 entries。`scripts/verify-vsix.mjs` 解压到隔离目录，在脱离仓库路径下验证固定 CLI、生产依赖、自带 gate hello／`get_state`，探针不启用工具。不代表已安装 VSIX 激活／F5 验收或外部 provider 全面验证。
- **核对及延期验收：** 授权复用／撤销／重置、改变范围及其余审批／生命周期／UI 矩阵仍无完整手动确认，不由四项检查推断。WI-008／WI-009 延后模型／thinking 选择（含审批／Stop 顺序）仍待独立 F5、保持开放。最终契约为搜索／列目录保守询问、启动失败关闭，不是广义只读自动允许或聊天回退。已安装 VSIX 验证及完整边界验证／ADR 仍在 ACTIVE 开放。
- **范围外：** 终端模拟器、任意 Webview shell／RPC、第三方扩展全面审批、永久授权、完整自由执行、Markdown／高亮、附件、会话历史与回滚。所有权见[架构 §7](../architecture/vscode-extension-architecture.zh.md)；[消息契约](../reference/webview-messages.zh.md) 保持 Outline。架构 Proposed／Direction；`gate-project-trust`、`gate-webview-trust`、`gate-session-streaming` 仍 Open。
- **已替代交接：** 此前实现文档记录 UI 已实现、全部 F5 待完成；现在仅以上四项观察替代该笼统 F5 缺口。此前文档会话报告 `docs:verify` 零 errors／warnings／stale notices，并消除 ACTIVE 长度警告。文档收尾未修改源码、package 或已批准计划；未获提交请求。

## 跨会话维护记录

- 集成与 TypeScript playbook 已同步扩展中英文，补充可复用协议、生命周期、信任、隔离与升级规则。未经授权未修改生成模板指南或同级仓库。
- Windows 测试修复将 docs-health CLI 测试从 URL `.pathname` 改为 `fileURLToPath`，消除 `D:\\D:\\...` 路径失败。
- 禁用其他已安装扩展后，历史 DEP0169 输出不再出现；来源未证明，也从未声称由产品代码修复。

## 替代入口与未决上下文

当前 WI 范围与批准见 [`ACTIVE.md`](../../ACTIVE.md)。现行产品选择见 Draft [PRD](../product-requirements.zh.md)；结构所有权见[架构](../architecture/vscode-extension-architecture.zh.md)；真实 gate 状态见[架构 gate](../reference/architecture-gates.zh.md)。本归档合并多个已关闭 WI，不存在单一替代文档；以上链接是现行入口。
