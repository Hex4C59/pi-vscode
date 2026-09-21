# pi-vscode — 当前工作（跨会话状态）

运维说明：本文件供人与编码 Agent 共享会话状态，**不是**需求或架构权威。完整协作流程见 [Agent 协作指南](docs/guides/agent-collaboration.zh.md)（英文：[`agent-collaboration.md`](docs/guides/agent-collaboration.md)）。

**新会话开场**：只 **@ 本文件** 即可（或说「继续 pi-vscode，先复述 ACTIVE 再提案」）。Agent 须遵守下文 **Agent 会话契约**，并阅读 `docs/guides/agent-collaboration.md`（见 [`AGENTS.zh.md`](AGENTS.zh.md) 中「ACTIVE 会话配对」）。

## Agent 会话契约（摘要）

与 [agent-collaboration](docs/guides/agent-collaboration.zh.md) §5–§8 对齐；**完整权威**以该指南为准。

| 步骤 | Agent |
|------|--------|
| **开场** | 复述当前 WI、阶段（准备/建造）、Gate ID、Decision、Last session；今日建议焦点与验收步骤。 |
| **提案** | Prepare 阶段将 WI 目标、方案、验收、不做范围、决策类及 **PRD 判定**（用户可见须起草需求／纯技术须说明原因）写入本文件；维护者确认并在此记录后才进入 Build。聊天中的一句计划不算持久任务说明。 |
| **建造** | 获确认后读 [typescript](docs/guides/agent/typescript.zh.md) 与 [pi-integration](docs/guides/agent/pi-integration.zh.md)；按已确认范围实现并跑 lint/typecheck/测试（适用时）。 |
| **记录沉淀** | 讨论形成阶段性结论、方案确认及 WI 收尾／文档替代时，按协作指南 §7 主动整理 discussions、decisions 和 archive；已授权范围内不另问是否保存。ACTIVE 保留当前提案摘要、批准状态、未决阻塞和简短交接，链接详细记录。记录不代表批准；Accepted 须满足批准与验证条件；归档保留有效要求和未决项。 |
| **收尾** | 核对实际交付与已确认 PRD 切片／WI 验收；检查受影响文档是否被替代，运行 `npm run docs:health`，记录更新、保留或延期；更新下文 **Last session**。若须写 ADR：起草 `docs/decisions/000x-….md` 并更新 [architecture-gates](docs/reference/architecture-gates.zh.md)，或 ACTIVE 标 `Decision: pending-adr`。 |

- **WIP=1**：只推进本文件中的一个 WI；新想法进 **停车场**，不插队。
- **Gate**：未 Accepted 的 gate 不得当作已交付能力；spike 未确认前不得写 Accepted ADR（见 [何时写 ADR](docs/decisions/README.zh.md#何时写-adr)）。
- **文档**：改文档后运行 `npm run docs:verify`。

---

## 已完成（WI-005）

| 字段 | 内容 |
|------|------|
| **ID** | WI-005 |
| **标题** | 文档健康维护第一阶段：手动巡检闭环 |
| **阶段** | 已完成（维护者验收通过，2026-09-19） |
| **Gate ID** | 不适用（仓库维护，不改变产品边界） |
| **Decision** | `none` |
| **PRD 判定** | 纯技术：文档治理、检查脚本及项目 skill，不改变扩展用户行为 |

**批准：** 维护者明确回复「批准第一阶段任务」。本次优先执行 WI-005；WI-003 Prepare 暂停，原候选范围与未批准状态保持不变。

**目标与方案：** 增加双语文档健康治理指南及收尾入口；复用现有检查，增加只读 `docs:health`（显式替代关系、显式复核日期）；添加项目巡检 skill 与自动化测试，进行一次带证据的只读试巡检。

**风险：** 语义误判、历史误报与生成文件漂移。年龄仅触发复核；保留历史 ADR；不修改模板生成指南；语义判断必须附证据。

**验收：** 脚本支持文本／JSON、错误非零退出、复核提醒不阻断；测试覆盖日期、替代关系、历史保护与无写入；skill 给出明确范围、证据和限制；`npm test`、`npm run docs:verify`、`npm run docs:health`、compile、lint 通过或如实报告发现。

**范围外：** 定时调度、模型服务接入、自动修复／归档／删除、提交／PR、全库语义正确性保证、模板仓库修改。现有文档仅做只读试巡检，不借机清理历史。

## 正在做（WIP=1；WI-006 Build，待 F5 验收）

| 字段 | 内容 |
|------|------|
| **ID** | WI-006 |
| **标题** | 工作区与 pi 项目资源选择界面（运行时启动前置切片） |
| **阶段** | Build（维护者于 2026-09-19 回复「我认为这个方案可以」，批准下方 WI-006 范围） |
| **Gate ID** | `gate-project-trust`、`gate-webview-trust`（均 Open） |
| **Decision** | `none` |
| **决策类** | `none`（不关闭 gate；运行时集成另行批准） |
| **PRD 判定** | 用户可见：REQ-001 的 WI-006 Draft 切片；显示项目、阻断原因及资源选择，不交付完整 REQ-001 |

### 目标与范围（提案，待 Build 批准）

将现有占位侧栏扩展为明确的启动前置界面。本切片不启动 pi；避免在工具审批尚未接入、剩余资源类别未验证时，用一个信任按钮直接执行真实项目扩展。界面必须显示“选择已记录，运行时尚未启动”，不声称资源已加载或会话已就绪。

- 宿主读取当前工作区，展示单个本地文件夹名称与路径。无文件夹时提供“打开文件夹”入口，调用 VS Code 原生选择流程；取消保持原状态，不创建运行时。
- 多根、远程扩展宿主（包括 URI 为 file 的远程情形）或非 file 工作区明确显示暂不支持，不偷偷选择根目录。VS Code 未信任时禁止选择 pi 资源，提供原生管理工作区信任入口；不得替用户赋予信任。
- 支持的受信任工作区初始为“尚未选择”；提供“允许加载项目资源”和“不加载项目资源继续”。说明前者未来启动时可能执行项目扩展／触发项目包行为，后者仍可能读取 AGENTS.md 上下文及用户／全局资源，两者均不代表沙箱或工具授权。
- 选择仅由宿主保存在内存，并绑定当前工作区身份与代次；不写 pi trust.json、不持久化到设置或 Webview 存储。隐藏／重开侧栏保留，重载扩展宿主、工作区变化或资格失效清除；允许在启动前修改选择。
- 切换工作区后立即作废旧选择。迟到的旧页面操作不得更新新项目状态；宿主重新检查资格与代次，不信任 Webview 提供的路径或 VS Code trust 布尔值。
- 后续运行时切片必须消费当前明确选择并显式传 approve/no-approve，验证启动／切换清理和剩余资源类别；本切片不预先声称该集成完成。

### 方案与架构核对

- **所有权／依赖：pass（提案）** — 按架构 §2，由扩展宿主拥有工作区观察、选择状态和订阅清理，Webview 仅呈现。运行时适配器不变。
- **契约／安全：gap** — 当前 `docs/reference/webview-messages.md` 仅 ping/pong；Build 时须同步双语 Outline 和校验测试，仅新增获取状态、打开文件夹、管理信任及选择资源等窄操作，禁止通用命令／任意路径转发。状态更新使用代次关联，输出路径正确转义，保持 CSP 和密钥边界。
- **生命周期：gap** — Build 须实现工作区／信任变化重新计算，订阅 dispose、视图重建状态同步及迟到消息拒绝。此处无子进程，运行时退出／切换不冒充已验证。
- **可用性：gap** — 所有状态及错误须可见；按钮支持键盘和清晰标签，取消不是错误，宿主命令失败给出可重试提示。
- **持久化：N/A** — 仅内存，不新增磁盘格式。**成熟度：Direction**；未关闭任何 gate。

### 验收（提案）

1. F5 覆盖无目录、单本地目录、多根、远程及未信任状态；显示正确身份／阻断原因，仅有效状态允许资源选择。
2. 两种选择均可见且可修改；文案明确运行时未启动。测试证明所有 UI 操作的 pi 启动次数为零，无模型调用、资源执行或信任文件修改。
3. 同工作区重开视图保留选择；宿主重载或工作区变化重置。旧代次、非法枚举、畸形消息不能改变状态或执行任意命令。
4. 原生打开目录／管理信任流程的成功、取消、失败有明确行为；路径含特殊字符不能注入 HTML。监听清理和重复视图创建有测试。
5. 测试、compile、lint、docs:verify、docs:health 通过；维护者 F5 验收仅覆盖此 UI 前置切片。

### 范围外与批准边界

不启动运行时、不实现真实会话、聊天、模型、工具审批或持久信任；不自动安装包；不关闭 gate、不写 Accepted ADR。本提案不能替代完整 REQ-001 或 D-03 运行时验收。维护者于 2026-09-19 回复「我认为这个方案可以」，已批准本切片 Build；不代表整份 PRD Accepted 或 gate 关闭。WI-004 流式聊天仍在停车场。

## 已完成（WI-003 技术 spike）

| 字段 | 内容 |
|------|------|
| **ID** | WI-003 |
| **标题** | 打开工作区文件夹 + project trust 最小路径（待讨论） |
| **阶段** | 已完成（维护者于 2026-09-19 验收 spike-only 结果；gate 仍 Open） |
| **PRD / 架构** | [`vscode-extension-architecture`](docs/architecture/vscode-extension-architecture.zh.md)、[`architecture-gates`](docs/reference/architecture-gates.zh.md) |
| **Gate ID** | `gate-project-trust`（Open） |
| **Decision** | `none` |
| **PRD 判定** | 纯技术（提案）：先验证 REQ-001 / D-03 的信任加载前提，不新增产品 UI 或可执行聊天；用户可见切片后续另行批准 |
| **决策类（提案用）** | `spike-only`；gate 保持 Open，验证和维护者确认前不写 Accepted ADR |

**一句目标（候选，未批准）**：讨论如何将 VS Code 工作区文件夹与 pi project trust 经公开 API 对接；具体范围、方案、验收与不做事项尚未确定。

## WI-003 讨论稿（历史；范围已批准，spike 已验收）

### 目标与范围

建议先执行无模型调用的 project trust 技术 spike，而不是直接连接真实项目或新增信任 UI。证明固定 pi `0.85.1` 子进程 RPC 能按宿主明确选择加载／不加载项目资源，为 REQ-001 / D-03 提供证据。本次不交付用户可见需求，也不提升 PRD 为 Accepted。

### 文档证据与方案

- 已安装包公开 `README.md` 的 Project Trust 说明：RPC 不弹信任提示；未显式覆盖时会受已有信任决定和全局 `defaultProjectTrust` 影响。因此不能把启动 `--mode rpc` 当成默认不信任。
- 同一公开文档提供 `--approve` / `--no-approve` 单次运行覆盖；建议在隔离临时 fixture 中验证两条路径。不直接读写用户 `trust.json`，不调用私有模块，也不将 VS Code 信任自动映射为 pi 项目信任。
- 文档明确拒绝项目信任仍可加载上下文文件、用户／全局扩展及 CLI 显式扩展；须把它们与项目 settings、项目扩展／包、项目 skills 等逐项区别。拒绝信任不是“完全不读取项目”，更不是沙箱。
- Build 前半段确认并使用公开的临时 agent 配置目录机制，隔离真实用户凭证、全局扩展及信任状态。仅使用自行创建、可检查的无害标记 fixture；不执行仓库已有扩展、不安装项目包、不访问模型或网络。
- 覆盖初次启动，以及通过公开会话 API 切到不同 cwd 时的资源行为；会话 fixture 通过 pi API 创建，不手写或解析会话文件。若公开 API 无法控制或观察某类资源，报告 unknown／限制，不借私有接口补齐。
- 测试宿主前置策略：无文件夹、多根、非本地或 VS Code 未信任时不得启动；受信任的单文件夹只代表可继续询问 pi 资源选择，不隐式批准它。这里只验证策略，不连接现有 Webview。

### 验收与风险

1. 记录固定版本、公开入口、启动参数和 fixture 预期／实际观察；证明明确拒绝不因全局默认 always 或已有信任而静默加载项目资源，明确允许只在显式选择时生效。
2. 对启动和跨 cwd 切换分别报告项目资源与仍允许上下文／全局资源的边界；不能仅凭 `get_state` 成功宣称信任通过。发现不能满足 D-03 时停在技术结论，不擅改产品决定。
3. 无有效 workspace 或 VS Code 未信任时，测试证明启动次数为零；pi 拒绝路径不等同于拒绝普通文件访问。
4. 超时、失败及取消后清理监听、子进程和临时目录；不留真实会话、凭证或持久信任修改，不记录环境变量或密钥。测试 fixture 的信任数据仅通过公开入口设置；无法做到则报告该用例阻塞。
5. 运行测试、compile、lint、docs:verify、docs:health，记录未验证项。运行时行为仅在 spike 后才能称为验证通过。

### 架构检查（Prepare）

- **依赖方向：pass（方案）** — 架构 §2 与 ADR 0001 保留宿主→适配器→子进程 RPC；不改成 SDK 内嵌运行时。
- **安全／信任：gap** — 上游 README 给出覆盖参数，但 `src/adapter/pi-rpc-probe.ts` 现有探针仅传 `--mode rpc --no-session`；不能直接用于安全验证真实工作区。
- **契约／UI：N/A（本切片）** — `docs/reference/webview-messages.md` 仍仅 ping/pong；本 spike 不扩展桥接。产品信任 UI 需后续切片定义契约。
- **生命周期／持久化：gap** — 跨 cwd 加载、隔离配置、清理及公开会话 fixture 创建需验证；忽略会造成真实用户状态污染或资源误加载。
- **成熟度：Direction**；结论为先 spike，不宣称 gate 可关闭。

### 范围外与批准状态

不实现工作区选择／信任产品 UI、聊天、模型认证、工具审批、历史列表或持久信任设置；不写 Accepted ADR、不关闭 gate、不改变 WI-001 子进程决策。维护者于 2026-09-19 回复「就按照你说的执行范围做吧」，**已批准本 spike-only Build**。此批准不包括产品实现、gate 关闭或 Accepted ADR。

---

## 已完成（WI-002）

- **验收：** 维护者 2026-09-19 F5 确认显示 `Connected (ping/pong only)`，仍是占位页，不能发送真实聊天消息；自动化校验与文档检查见下文 Last session。
- **Decision：** `none`；`gate-webview-trust` 仍为 **Open**，没有关 gate ADR。

## WI-002 讨论稿（归档；维护者已确认并验收）

### 目标与范围

基于 WI-001 的禁脚本占位侧栏，定义最小、版本化的 webview ↔ 扩展宿主消息提纲，并验证一条不涉及 pi、不携带密钥的 ping/pong 往返。`docs/reference/webview-messages` 从 Planned 进入 Outline；仅给出本 WI 实际使用的消息与校验边界，不预注册未来聊天协议。对应 `gate-webview-trust`，当前仍为 **Open**。

### 方案与风险（已确认方案）

- Webview 只使用 VS Code 提供的消息通道；宿主把收到的消息当作 `unknown`，验证协议版本、允许的消息类型及最小字段，再处理 ping。拒绝未知版本、未知类型与畸形输入；不提供通用宿主命令转发。
- 仅为此桥启用所需脚本，保持限制性的 CSP；不向 webview HTML、脚本或消息传递 `SecretStorage`、环境密钥或 pi SDK／运行时能力。消息提纲和代码同范围推进。
- 风险：启用脚本扩大了 webview 的攻击面；须核对 CSP、脚本来源与消息校验。Webview 不是安全沙箱；在验证之前不得把 `gate-webview-trust` 视为已关闭。
- **Gate / 决策类**：`gate-webview-trust` / `none`（仅协议提纲 + ping/pong，不写 Accepted ADR）。如拟关闭 gate，应另行确认验收与 `adr-after-approval`，不可由一次往返自动推定。

### 验收（维护者）

1. F5 打开 Pi 侧栏，能在页面看到 ping/pong 往返结果；占位页不声称已能聊天。
2. 自动化测试或等效受控验证证明宿主对未知版本、未知类型和畸形消息不执行业务动作；正常 ping 仅产生预期 pong。
3. 检查 HTML、消息及脚本不含密钥，不给 webview Node、文件系统、shell 或 pi SDK 访问；CSP 与启用脚本的范围一致。
4. `docs/reference/webview-messages` 提纲与实现一致；`npm run compile`、`npm run lint`、`npm run docs:verify` 通过。若本 WI 增加测试命令，同时运行测试。

### 明确不在 WI-002

- 真实 pi prompt、流式聊天、会话与模型选择（WI-004）；工作区文件与 project trust（WI-003）。
- 凭证传输、泛用命令桥、会话文件读写；不以 ping/pong 直接关闭 `gate-webview-trust`。

### 确认状态

**维护者已确认（2026-09-19）**：「审阅完了，我认为没有什么问题」。按上方方案进入**建造**，决策类 `none`；此确认不代表关闭 `gate-webview-trust` 或接受 ADR。

---

## 已完成（WI-001）

| 字段 | 内容 |
|------|------|
| **ID** | WI-001 |
| **ADR** | Accepted [`0001-build-baseline`](docs/decisions/0001-build-baseline.zh.md) |
| **已关闭 gate** | `gate-extension-host-baseline`、`gate-sidebar-chat-shell`、`gate-runtime-host` |
| **说明** | 脚手架 + 辅助侧栏占位壳 + 子进程 RPC spike；**不**包含用户聊天产品能力。 |

---

## 今天 / 当前焦点（WI-006 Build，待 F5 验收）

- [x] 完成工作区与资源选择前置 UI 提案及双语 PRD 细化
- [x] 维护者批准 WI-006 Build（2026-09-19）
- [x] 完成宿主状态、前置 UI、窄消息协议及自动化验证
- [ ] 维护者 F5 验收 WI-006；原生对话框、远程宿主及辅助功能仍需手动验证

### 前序验收

- [x] WI-005 第一阶段获批准，WI-003 Prepare 暂停
- [x] 双语治理规则、健康检查、测试和项目 skill
- [x] 完成自动校验与只读试巡检，报告限制
- [x] 维护者验收 WI-005 第一阶段（2026-09-19，明确选择验收通过）
- [x] 恢复 WI-003 Prepare，核对公开信任参数并撰写技术 spike 提案
- [x] 维护者批准 WI-003 spike-only Build
- [x] 六组启动／跨 cwd 验证及九项策略／生命周期测试通过
- [x] 维护者验收 WI-003 spike 结果（2026-09-19：「WI-003 应该是可以的了」）；未验证边界保留，gate 仍 Open

---

## 停车场

- WI-004：`gate-session-streaming` + 首条端到端消息流
- 编辑区标签聊天（Claude Code 式 `panel` 默认）
- Chat Participant API（VS Code 内置 Chat UI）

---

## Last session

### WI-006 信任及多根手动验证（2026-09-20，最新）

- 维护者将独立测试工作区设为 VS Code 未信任，截图确认资源选择按钮隐藏、显示阻断说明及 Manage workspace trust 入口；恢复信任后截图确认按钮恢复且状态为 Not chosen yet. Runtime not started.。
- 按先记录选择、添加第二根目录、观察多根阻断、移除第二根目录的步骤测试，维护者明确反馈结果均符合预期：多根时不能继续选择，恢复单根后不沿用旧选择。
- 结合先前记录，项目显示、两种选择、图标恢复、CLI 无调试重载重置、信任变化及多根变化均有手动证据。原生目录选择取消、远程环境、主题／辅助功能仍未全部手动验证；F5 自动启动问题未宣称修复。待维护者决定 WI-006 整体验收，不自动关闭 gate。

### WI-006 重载验证（2026-09-20，最新）

- 维护者通过官方 CLI、独立 user-data-dir、不附加调试器启动开发宿主；点击 Continue without project resources 后在该窗口执行 Developer: Reload Window，恢复后未点击按钮，确认显示 Not chosen yet. Runtime not started.。本路径下宿主重载清除资源选择的手动验证通过。
- 附加调试曾成功命中 receive 断点，继续后选择正确记录；隐藏再打开报告正常。此前 F5 自动启动及附加调试下重载／断开异常未确证修复，不与产品选择重置混为一谈。
- 原生取消、未信任／多根／远程状态及明暗主题／辅助功能的剩余手动覆盖仍保留；本反馈不自动等同 WI-006 整体验收或关闭 gate。无需重复正常 CLI 路径的重置测试。

**WI-001 证据合并补记（2026-09-19）：** 按维护者批准，将独立运行时 spike 摘要合并至 [ADR 0001 的 Spike 证据](docs/decisions/0001-build-baseline.zh.md#spike-证据)，同步中英文与集成指南引用，删除原讨论文件。保留日期、包版本、命令、机制和结果，明确缺少原始日志／精确环境信息及未验证范围；未重跑 spike，未改变历史决策或 gate 状态，无待确认项。

**集成指南维护补记（2026-09-19）：** 按维护者请求，同步产品与模板 SDK/RPC 技术包的中英文指南；补充协议、生命周期、信任、隔离验证与升级规则，通用异步规则引用 TypeScript 指南。产品记录 ADR 0001 已选方案、WI-001／WI-003 证据和剩余限制，修正会话文件例外须 Accepted ADR 的要求。本次仅文档维护，未重跑运行时 spike，未改变产品 WI 或 gate 状态，无新增决策待确认。

**TypeScript 指南维护补记（2026-09-19）：** 按维护者请求，补充产品与 engineering-template 技术包的中英文 TypeScript/Node 规则，覆盖运行时校验、模块与依赖、异步清理、错误处理、验证和维护触发条件；产品章节记录当前配置与命令覆盖范围。本次仅更新指南，未变更代码、工具链、当前 WI 或 gate 状态，无新增决策待确认。

### WI-006 手动验证反馈（2026-09-19，最新）

- 维护者截图确认 Explorer 已显示所选目录，Pi 显示相同项目及资源选择入口，打开文件夹问题在本次 F5 中不再复现。
- 维护者分别点击 allow／continue without，两张截图均显示对应 Choice recorded，且明确 Runtime not started。
- 维护者确认隐藏右侧栏后点击编辑器标题栏 π 能恢复 Pi，重复点击不会隐藏；图标恢复问题在本次 F5 中通过。
- 尚未明确确认：隐藏重开后选择是否保持、宿主重载后是否重置；原生取消、未信任／多根／远程状态及明暗主题／辅助功能的手动验证仍保留。上述反馈不自动等同整个 WI 全场景验收，也不关闭 gate。

### WI-006 验收修正（2026-09-19）

- 用户反馈原生选择目录后 Explorer 仍为空、隐藏侧栏缺少 Codex 同类图标入口，并批准两项修正。
- 空窗口改用公开 updateWorkspaceFolders 添加选中目录；拒绝／异常给出重试和 File > Open Folder 指引。接受请求不伪造成功状态，等待实际工作区变化或宿主重启，新实例读取真实状态；重复请求阻止，取消／迟到结果安全处理。
- focusChat 增加明暗主题 π 图标及 editor/title navigation 入口（与本机 Codex 同贡献位置）；命令先显示现有容器再聚焦，不切换隐藏或复制视图。无编辑器时保留命令面板后备。
- 自动化新增目录 API 失败、重启状态、重复请求及聚焦顺序测试；43 项通过，compile、lint、双语契约检查通过。原生 Explorer 行为、图标明暗主题及隐藏恢复仍待用户 F5 重验，不宣称已修复真实环境症状。gate 保持 Open，无运行时／持久信任变更。

**文档精简补记（2026-09-19）：** 按维护者授权，删除无产品专属内容的 architecture-review-guide 中英文 Draft 占位文件；文档索引改指现有架构治理清单。模板生成的治理清单保留对可选产品指南的通用文字提及，不修改模板源或生成文件。现行主架构、评审要求及当前 WI 状态不变。

### WI-006 Build（2026-09-19，最新）

- **批准：** 维护者回复「我认为这个方案可以」，批准限定的前置界面实现；没有批准运行时集成或 gate 关闭。
- **实现：** PiChatViewProvider 拥有工作区资格、代次、内存选择及监听清理；消息仅允许已定义窄操作并重新检查资格／代次。支持原生打开目录、管理工作区信任；remoteName 即使 file URI 也阻断。视图重建保留选择，身份／资格变化和宿主重载重置。UI 用 textContent 渲染路径，nonce CSP，明确 Runtime not started；未连接运行时或持久化。
- **验证：** 主代理重跑 npm test 39/39、compile（含类型检查）、lint 通过；测试包含 VS Code facade mock 的真实 provider、最小 DOM 下的脚本执行、迟到请求、取消／错误及清理，不等于真实 F5 UI 测试。双语消息契约与 PRD 追溯同步；docs:verify、docs:health、git diff --check 收尾检查。
- **待验收：** F5 测试有效项目与两种选择、隐藏重开保留、重载重置；无目录打开／取消，受限模式管理信任，多根阻断；远程宿主和原生对话框、键盘／读屏仍需手动验证。不得将自动测试等同这些环境已验证。
- **限制：** REQ-001 只完成前置切片，运行时及剩余资源类别仍延期；两个 gate 保持 Open。未提交；DEP0169 隔离诊断配置保留。

**规则维护补记（2026-09-19）：** 按维护者明确请求，将讨论沉淀、决策记录和范围内归档接入协作指南 §7，同步 Agent 入口、目录说明、文档健康授权边界及本契约摘要。本次仅完善规则，不搬移历史，不改变当前 WI 的批准或验收状态；无新增产品决策待确认。

### WI-006 Prepare（2026-09-19，当前）

- 维护者确认准备下一步方案，已起草上述用户可见前置切片及双语 REQ-001 细化／追溯；尚未批准 Build，没有产品代码变更。
- 明确本切片只展示工作区和记录内存选择，不启动 pi；实际运行时集成、剩余类别验证和 gate 关闭另行批准。下一步审阅上方范围后决定 Build。
- DEP0169：维护者确认禁用其他已安装扩展后不再复现，Pi ping/pong 正常；来源未定位，不能称已修复。launch.json 暂留 disable-extensions 与 trace-deprecation；此诊断不阻塞当前 Prepare。

### WI-003 spike（2026-09-19，最新）

- **批准与状态：** 维护者批准 spike-only Build，并于 2026-09-19 明确确认 WI-003 可以，记录为技术 spike 验收通过；未验证项继续保留。`gate-project-trust` 保持 Open；无产品 UI、无 ADR、无提交。
- **实现：** `scripts/project-trust-lib.mjs`、`scripts/project-trust.test.mjs`、`scripts/spike-project-trust.mjs`；入口 `npm run spike:project-trust`。使用固定 pi 0.85.1 公开 CLI/RPC，以及隔离子进程中的公开 SessionManager 创建会话，不解析／手写会话文件。
- **证据：** 六组场景分别覆盖启动 A 与 switch_session 到 B：全局 always 默认／approve／no-approve、已有保存信任加 no-approve、全局 never 默认／approve。项目 extensions、skills、prompt templates、APPEND_SYSTEM 标记符合显式选择；no-approve 覆盖全局 always 与已保存信任。保存信任仅通过公开 project_trust hook 的 remember 创建，并移除 hook 后验证其生效，不读写 trust.json。
- **保留边界：** 拒绝项目资源时全局扩展与 AGENTS.md 上下文仍存在；旧项目命令在切换后消失。每次 switch 观察到两次 resume 事件，不假定一次切换仅有一个事件。系统提示证据来自 session_start/getSystemPrompt，不是实际 provider 请求。
- **隔离与清理：** 最终脚本使用公开 PI_CODING_AGENT_DIR、PI_OFFLINE=1、PI_TELEMETRY=0，临时 HOME/cwd/配置及环境变量允许列表；不继承凭证、代理或 NODE_OPTIONS。没有模型调用或项目包安装。测试成功、超时、退出失败、取消、启动错误及回调错误的进程／监听／目录清理；不合格工作区策略测试启动次数为零。这是 spike 策略，不是已接入 VS Code 的产品防护。
- **限制／执行偏差：** 项目 settings 效果与 themes 未独立观察，项目包刻意不安装；无 OS 网络沙箱或独立流量审计。早期探索运行尚未加 PI_OFFLINE，无法保证当时无启动网络流量；最终重跑已启用离线控制。不把离线开关等同网络隔离。
- **验证：** 主代理复跑 spike 六组通过；npm test 28/28，compile、lint 通过。收尾运行 docs:verify、docs:health、git diff --check；受影响 PRD 工作追溯同步，保留以下历史记录。
- **下一步：** 准备用户可见工作区与信任切片方案，明确启动时机、选择生命周期、切换清理及剩余验证；另行批准后实现，不凭本结果自动关闭 gate。
- **启动诊断交接：** F5 侧栏显示 ping/pong 占位符合当前实现，不证明运行时信任 UI 已交付。DEP0169 来源仍待完整堆栈；`.vscode/launch.json` 临时开启 `--trace-deprecation`，不将警告视为已修复。

### WI-005 / 产品讨论（历史）

- **日期：** 2026-09-19（WI-005 第一阶段）
- **状态：** WI-005 已获维护者明确验收通过；WI-003 已恢复 Prepare，已撰写 spike-only 提案，待 Build 批准。
- **本次收尾／续接：** 重新运行 19/19 测试、compile、lint、docs:verify、docs:health、git diff --check 全部通过。受影响 PRD 与 ACTIVE 的 WI-005 待验收／WI-003 暂停描述同步更新；历史记录保留，不自动归档。WI-003 调研发现 RPC 启动不弹信任提示，必须验证公开 approve/no-approve 覆盖及跨 cwd 边界；未启动运行时、未实现产品功能。
- **产品讨论交接（同日）：** 维护者认可「以 pi 为运行时，对齐 Claude Code／Codex 本地 IDE 工作体验，不复刻厂商云服务」，并授权下一步起草双语首版 PRD。已起草 REQ-001～008（均 Draft），分开已认可方向、建议边界及 D-01～04 待决项；WI-003 仅候选关联 REQ-001，其他需求尚未分配实施 WI。随后维护者确认采用 D-01 建议：默认操作前询问，覆盖范围内的工作区只读文件操作自动允许，修改／写入、shell 执行及外部路径访问需询问。双语 PRD 已同步；具体工具覆盖仍需验证。随后维护者确认 D-02：单次／本会话指定范围授权，无持久允许列表；文件按操作类别与路径、shell 按工作目录与完整命令及执行条件匹配，无法可靠匹配则仅单次。后台存活时隐藏侧栏、回合结束或停止不清除已授予权限；新建／切换会话、切换工作区、运行时重启清除，历史恢复重新授权；可查看撤销，停止取消待决审批。双语 PRD 与 REQ-006 已同步。随后维护者确认 D-03：VS Code 工作区已信任时，允许以不加载 pi 项目级资源的方式继续，界面明确标示，工具审批独立生效；启动／切换的实际加载边界仍须验证。维护者进一步确认 D-02 模式生命周期补充：新建／重建运行会话、历史恢复、运行时重启、扩展宿主重载、工作区切换默认操作前询问；自由执行须明确选择并警告，无永久默认配置。后台会话存活时隐藏侧栏／回合结束／停止保留模式；切换不自动批准待决请求，切回仅约束后续调用、不撤销已执行副作用。双语 PRD 已同步。随后维护者确认 D-04 首版边界：单个本地文件夹（Git／非 Git）、已有 pi 凭证与明确配置恢复路径、每窗口单个活跃运行会话且可选择恢复当前项目的插件已知历史、修改后审查不替代操作前审批。显式工作区文本文件／选区附件支持未保存内容但不自动保存；选区变化须可靠跟踪或重新附加，超限不静默截断。审查区分工具确认目标与任务期间观察到的工作区变化，不将原有用户修改或整个 Git diff 归因于 Agent。双语 PRD 已同步。D-01～04 均已确认；具体附件上限与归因验收边界留到 REQ-003／007 Prepare。整份 PRD 仍 Draft，切片验收细节、技术验证及 Build 授权仍待完成；没有启动 spike 或功能实现，也未将此讨论视为 WI-005 验收。下一步仍先验收 WI-005，再恢复 WI-003 Prepare；首版边界批准不替代该流程。
- **工具无关修正：** 按维护者要求，项目 skill 存放于 `.agents/skills/documentation-health/SKILL.md`，不使用 `.cursor/skills/`；移除工具专用的 `disable-model-invocation` 字段，双语入口同步。不同工具的自动发现能力仍须各自验证，不支持发现时可直接读取该文件。
- **变更：** 新增双语 documentation-health 指南、项目级 documentation-health skill、只读 docs:health CLI 及 7 项测试；接入 AGENTS、文档索引、WI 收尾义务。未更改生成指南或同级模板仓库。
- **验证：** `npm test` 19/19 通过；`npm run docs:verify` 0 错误／警告；`npm run docs:health` 扫描 28 份英文／根文档，0 错误／复核提醒；compile、lint、`git diff --check` 通过。JSON CLI 由测试实际调用并解析。
- **只读试巡检范围：** 本次健康检查指南与 package.json／CLI，以及 webview-messages 的消息白名单与 src/extension/webviewMessages.ts（字段严格校验、ping/pong）；上述对照未发现已确认语义过期。不代表全库审计或所有生命周期声明已验证。
- **语义练习：** 假设主张「docs:health 每周自动删除文档」被否定：package.json 仅注册手动命令，CLI 调用只读检查并输出报告，指南明确无调度／清理。未向仓库写入虚假示例文档，未进行自动化模型质量评测。
- **保留与限制：** WI-002 历史讨论保留，不自动搬移；生命周期元数据按需启用，未全库补日期，因此零提醒不等于内容全部新鲜；尚无定时执行、持久去重、自动语义审查或自动修复。skill 文件及链接已检查，当前会话未验证新 skill 的 IDE 自动发现。
- **下一步：** 审阅上方 WI-003 技术 spike 提案，确认后进入 Build。文档健康第二／三阶段未启动；无提交或 PR。

## 上次会话记录（WI-002 / WI-003）

- **日期：** 2026-09-19
- **变更：** WI-002 ping/pong 桥与 Outline 消息契约完成并获维护者 F5 验收；WI-002 讨论稿保留归档。WIP 滚动到 WI-003 Prepare（仅候选目标，讨论稿待撰写）。修复双语 Mermaid 图校验警告：保留可渲染围栏，增加双方显式本地化标记与校验测试。`gate-webview-trust` 仍 Open；没有 ADR 或端到端聊天。
- **验收：** 维护者确认 Pi 侧栏显示 `Connected (ping/pong only)`，仍是不能发真实消息的占位页；此前 `npm run compile`、`npm run lint`、`npm test`（3 项通过）、`npm run docs:verify` 已通过，中英 Mermaid 图通过双方显式标记保留可渲染围栏，文档检查 0 警告。
- **下一步：** 先撰写 WI-003 讨论稿并请维护者确认，再实施；不得把目前的一句目标当成批准。
- **流程修复（同日）：** 应维护者确认，增加每个 WI 的 PRD Prepare／Close 检查门、WI-003 待定判定、双语 PRD 追溯与文档结构测试；未批准 WI-003 范围或 PRD Accepted。`npm test`（12 项）、`npm run docs:verify`（0 错误／警告）、`npm run compile`、`npm run lint` 已通过。
