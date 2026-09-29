# 测试有效性审查

[English](2026-09-29-test-relevance-audit.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-29-test-relevance-audit.md](2026-09-29-test-relevance-audit.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-29

- Type: Discussion
- Status: 已授权修复通过验证；依维护者要求停止逐断言审查，接受待定
- Created: 2026-09-29
- Authority: 仅上下文；不新增 WI 或接受结论
- Related: [ACTIVE](../../ACTIVE.md)、[测试指南](../guides/agent/testing.zh.md)

## 问题与范围

维护者询问多次迭代后，886 个通过用例中是否存在失效的旧测试。本轮核对完整收集清单与模块可达性，再重点审查部分断言和大量使用模拟器的套件；不代表已证明每条断言必要。初次审查未修改应用代码和测试文件；随后获授权的修复见下方记录。

## 初次审查发现与建议处理

| 发现 | 证据 | 建议处理 |
|---|---|---|
| 防裁切断言在刻意加入裁切样式后仍通过 | `src/webview/tests/app.spec.ts` 的 “production model popover stays unclipped” 只检查 computed `overflowY !== "hidden"`。内存构建中注入 `footer.style.overflow = "hidden"` 后，7 个 app 用例仍全通过。当前 jsdom 返回 `overflow: "hidden"`，但 `overflowY` 为空。 | 缩小为 DOM／样式连接检查并加入反例；实际裁切须由浏览器／宿主布局证据验证。 |
| 预览器恢复策略与当前生产实现不同 | `src/webview/tests/operations-preview.spec.ts` 期待两个按钮同时可用、任一操作都清除恢复态；`preview/preview-bridge.ts` 实现该模拟。`PiChatViewProvider.recoverRuntime` 与 `extension/tests/provider-profiles.spec.ts` 则要求先观察终态，再独立恢复。 | 对齐或缩小预览夹具；已批准的替代策略实施前保留当前宿主覆盖。Draft ADR 0006 不表示当前测试已经过时。 |
| 一个循环的后续坏输入已不再执行校验 | `src/adapter/runtime/tests/session-runtime.spec.ts` 的 “compaction end never invents settlement” 在同一连接发送四个坏帧。WI-033 在第一帧就停用连接，后三帧不能验证各自的拒收路径。 | 此处保留一个故障用例；独立类型使用新连接，或依赖已有解码矩阵。若保留后续帧，应明确它们检查隔离。 |
| 最近新增的集成矩阵重复共用校验类型 | `runtime/tests/runtime-protocol.spec.ts` 将 7 种操作与 6 种坏回包交叉为 42 项；`rpc-replies.spec.ts` 已覆盖这些字段类别。 | 完整字段矩阵保留在校验器；集成层考虑每种操作保留两类代表故障（14 项，可减少 28 项）。保留两条 Prompt 路径、Stop 两阶段、投递不确定、清理及无重试断言。这是精简候选，尚非已证明的最小套件。 |
| 名字保留旧 UI／协议词汇 | `webview/tests/app.spec.ts` 写着 “real v2 bridge”，实际断言 v3；`settings-dialog.spec.ts` 主要挂载当前设置页，也包含资源／文件夹弹窗。 | 按当前行为改名、归类；不能因文件名旧就删除有效测试。 |

## 仍有价值的部分与清单证据

- 实际发现 82 个应用 spec 和 11 个脚本 spec。`src`、`scripts` 下现有 `.test`／`.spec` 文件无收集遗漏。runner 清理 `dist/tests` 并执行明确清单，不会把残留构建产物混入数量。
- 只读 esbuild 依赖分析将测试导入与 extension、approval gate、session worker、ownership supervisor、Webview 生产入口比较。测试引用但不在这些生产图内的应用模块仅七个：六个 preview 模块和 `runtime/process/direct-process.ts`。预览器挂载当前 `mountChat`；direct-process 仍由附件 spike 使用。这只是模块证据，不是断言覆盖率或“没有冗余代码”的证明。
- `candidate-preview.spec.ts` 混合当前共享 UI 行为与模拟宿主行为，不能按年代和名称整文件删除。拆分／迁移前应明确行为归属并保留有用的 UI 回归。
- compatibility helpers 仍供兼容性及附件 spike 使用。生产打包依赖图测试检查排除 preview／test／direct-process 代码，仍有价值。
- 前次 WI-033 日志记录 886 通过、0 失败／跳过；其中包含 `scripts/spikes/project-trust.spec.mjs` 的已安装固定版本 pi 资源探针，因此整套测试并非全是 mock。该探针不证明本次坏报文在真实 pi、F5 或已安装 VSIX 中的行为。

## 初次审查建议与限制

优先修复误导性断言和预览策略偏差，再精简重复组合与更新命名。测试数量目标不是验收标准。本轮没有证明任何整个测试文件可安全删除；未重跑完整套件，未做真实 pi 坏输入探针、F5 或 VSIX 验收。内存反例 7/7 通过，证明的是裁切断言存在盲区，而非产品正确。

初次审查时清理仍为建议；后续实施授权与结果如下。WI-033、WI-032 接受状态及现有恢复策略讨论保持原状态。

## 已授权修复与验证（2026-09-29）

维护者随后明确要求修复全部已确认问题，记为 WI-033 的测试维护收尾，未另开 WI。五类发现均已处理：

- 裁切检查改为逐层检查菜单父容器至 footer 的 overflow 简写及 X／Y 长写，标题限定为样式保障。正常 app 用例 7/7 通过；内存分别注入 hidden、clip、双值简写、X hidden、Y auto 后，每次均恰好 1 项失败。实际浏览器布局仍需独立证据。
- 预览恢复现为先模拟观察到退出，再独立恢复；恢复同时清除交互。测试先出现 1 项预期失败，修复后 3/3 通过。顺带补齐 candidate harness 的 DOM Node，消除焦点事件中此前不使测试失败的 ReferenceError。预览不执行真实进程结束，也不验证原生确认框；宿主测试仍负责真实策略边界。
- session-runtime 只发送一帧坏 phase 验证故障收尾；各字段坏值继续由 rpc-frames 独立检查。同块和旧连接隔离覆盖保留。
- ACK 集成矩阵 42→14；底层字段类别矩阵和各操作投递不确定／清理／无重试检查保留。另移除 history-navigation 中一项只检查“有列表项”的弱用例，其 128 项场景已由同文件完整分页及内容检查覆盖。
- settings-dialog 改为 `settings-page.spec.ts`；原文件夹／资源取消用例分别移至 `no-folder-controls.spec.ts`、`project-setup-controls.spec.ts`。更新 v2 和 retired 等旧测试标题。

最终仍为 93 个 spec 文件，886→857 项：28 个重复 ACK 组合和 1 项弱历史列表用例被移除。`npm run compile`、`npm run lint`、`npm test`（857 通过、0 失败／跳过）、`npm run docs:verify`、`git diff --check` 通过；文档只有 ADR 0005／0006 Draft 的 4 条既有提示。套件包含当前固定版本 pi 资源探针；随后一次运行输出了来自 `docs-i18n-check.spec.mjs` 故意输入无效 revision 的预期 Git `fatal: Needed a single revision` 诊断。本地日志在忽略目录 `dist/test-maintenance-tests.log`、`dist/test-maintenance-style-check.log`、`dist/test-maintenance-compile.log`，不作为持久发布证据。未做 F5、安装 VSIX 或真实 pi 坏报文专项；未提交 Git，维护者接受仍待定。

## 逐文件有效性核对

后续逐个核对了收集情况、导入对象、测试标题与断言存在性，并对可疑断言及其生产或模拟所有者做深入阅读。应用层每个顶层测试至少有一个直接断言，未发现完全相同的标题。这是文件层级的有效性判断，不证明每个断言都不可替代，也不把模拟测试视为宿主验收。“保留”表示现有证据不足以删除整个文件。

| `src/adapter/` 下的文件 | 当前对象与结论 |
|---|---|
| `ownership/tests/recovery-store.spec.ts` | 持久占用与退休；保留。 |
| `ownership/tests/runtime-owner.spec.ts` | 结束控制及准确退出证据；ACK 用例现等待 ACK 连接关闭，再检查回执独立性。 |
| `ownership/tests/supervisor.spec.ts` | 子进程观察、所有者丢失与控制套接字；保留。 |
| `runtime/tests/activity-projection.spec.ts` | 有界、脱敏的活动投影；保留。 |
| `runtime/tests/attachment-transport.spec.ts` | 单次 Prompt 写入与投递不确定；保留。 |
| `runtime/tests/command-classification.spec.ts` | 当前注册扩展命令分类；保留。 |
| `runtime/tests/extension-feedback.spec.ts` | 公共反馈身份、替换与脱敏；保留。 |
| `runtime/tests/interaction-writer.spec.ts` | 交互写入、排空、超时与退休；修复未独立等待 drain 的用例。 |
| `runtime/tests/pi-startup-model.spec.ts` | pi 启动模型环境读取；保留。 |
| `runtime/tests/process-strategies.spec.ts` | 托管／直接进程生命周期；直接策略仍供附件 spike 使用。 |
| `runtime/tests/review-events.spec.ts` | 有界运行时事件中的审阅完成；保留。 |
| `runtime/tests/rpc-dialogs.spec.ts` | 对话方法、不透明选项与取消；保留。 |
| `runtime/tests/rpc-frames.spec.ts` | 帧解码与坏事件矩阵；保留。 |
| `runtime/tests/rpc-occupancy.spec.ts` | ACK 与 agent 独立占用；保留。 |
| `runtime/tests/rpc-replies.spec.ts` | ID／命令配对及回包校验；保留。 |
| `runtime/tests/runtime-cancellation.spec.ts` | 取消自有启动及替换栅栏；保留。 |
| `runtime/tests/runtime-errors.spec.ts` | 安全的提供商错误分类；保留。 |
| `runtime/tests/runtime-protocol.spec.ts` | 跨操作坏回包及同块隔离；已精简重复矩阵，保留。 |
| `runtime/tests/session-runtime.spec.ts` | 会话身份与故障生命周期；删除不可达的坏帧循环项，保留。 |
| `runtime/tests/trusted-runtime.spec.ts` | 信任／受控配置生命周期与扩展接纳；保留。 |
| `sessions/tests/session-backend.spec.ts` | 外部会话 worker 与取消；修复 worker 未启动也通过的问题。 |
| `sessions/tests/session-history.spec.ts` | 有界公共历史投影；保留。 |
| `sessions/tests/session-worker-protocol.spec.ts` | worker 报文校验；修正正例夹具中不自洽的预览偏移。 |
| `tests/controlled-environment.spec.ts` | 受控进程环境；保留。 |
| `tests/trusted-approval-gate.spec.ts` | 审批网关配置及工具接纳；保留。 |

| `src/extension/` 下的文件 | 当前对象与结论 |
|---|---|
| `bridge/tests/webview-html.spec.ts` | 本地资源、CSP 与资源根；保留，属于静态宿主外壳证据。 |
| `bridge/tests/webview-messages.spec.ts` | 当前 v3 入站操作校验；修正两个 v2 标题。 |
| `contracts/tests/credential-text.spec.ts` | 共享凭据样式；保留。 |
| `contracts/tests/model-catalog.spec.ts` | 有界模型标识；保留。 |
| `draft/tests/draft-submission.spec.ts` | ACK 顺序与草稿保留；保留。 |
| `draft/tests/file-attachment.spec.ts` | 原生获取、快照、预算及取消；保留。 |
| `editor-tools/tests/change-review.spec.ts` | 审阅捕获、来源与资源清理；保留。 |
| `editor-tools/tests/dirty-write.spec.ts` | 脏编辑器写入保护；保留。 |
| `editor-tools/tests/editor-tools.spec.ts` | 编辑器工具组合及可选审阅；保留。 |
| `editor-tools/tests/tool-approval.spec.ts` | 审批路径／范围安全；保留。 |
| `extension-loading/tests/extension-loading.spec.ts` | 显式信任扩展加载；保留。 |
| `interactions/tests/interaction-coordinator.spec.ts` | 表单队列、回答权限与取消；保留。 |
| `models/tests/custom-endpoints.spec.ts` | 端点存储与秘密边界；移除未输入秘密却断言其不存在的空转检查，并清理临时文件。 |
| `models/tests/model-selection.spec.ts` | 已应用／待应用模型意图；保留。 |
| `models/tests/model-settings.spec.ts` | 延后设置与替换；保留。 |
| `models/tests/provider-config.spec.ts` | 提供商状态、默认值与秘密处理；清理临时文件。 |
| `tests/architecture-boundaries.spec.ts` | 选定源码／打包规则；收窄标题，仅属静态证据。 |
| `tests/extension-interaction-protocol.spec.ts` | 当前 v3 能力词汇；v2 拒绝仍是兼容性保护。 |
| `tests/focus-chat.spec.ts` | 命令显示／聚焦与回退；保留。 |
| `tests/provider-interactions.spec.ts` | 视图丢失及 Stop 时的宿主表单生命周期；保留。 |
| `tests/provider-model-sync.spec.ts` | 提供商刷新与实时默认值同步；保留。 |
| `tests/provider-profiles.spec.ts` | 信任配置及当前恢复策略；批准替代方案实施前保留。 |
| `tests/runtime-chat.spec.ts` | 宿主任务、ACK、Stop 与故障状态；保留。 |
| `tests/sessions.spec.ts` | 宿主已存会话意图与交接；保留。 |
| `tests/settings-panel.spec.ts` | 设置编辑器身份与视图隔离；保留。 |
| `tests/workspace-policy.spec.ts` | 工作区资格与过期操作；保留。 |

| `src/webview/tests/` 下的文件 | 当前对象与结论 |
|---|---|
| `app.spec.ts` | 生产挂载与样式保障；修复裁切反例。 |
| `attachment-ui.spec.ts` | 已挂载附件预览与草稿连续性；保留。 |
| `candidate-approvals.spec.ts` | 模拟宿主下的共享审批 UI；保留为 UI 证据。 |
| `candidate-combinations.spec.ts` | 共享语言／审阅组合；保留为 UI 证据。 |
| `candidate-preview.spec.ts` | 模拟场景中的共享聊天；保留，不推断真实宿主行为。 |
| `candidate-review.spec.ts` | 共享审阅入口与不透明意图；保留为 UI 证据。 |
| `change-review.spec.ts` | 审阅 DTO 与已挂载客户端行为；保留。 |
| `client.spec.ts` | 宿主 DTO 解析及浏览器客户端边界；保留。 |
| `context-focus.spec.ts` | 嵌套上下文焦点与 Escape；保留。 |
| `execution-ui.spec.ts` | 已挂载任务／活动／审批交互；移除重复的弱裁切用例。 |
| `extension-interactions.spec.ts` | 表单 UI 与有类型的回答；保留。 |
| `history-navigation.spec.ts` | 完整历史分页与预览取消；删除较弱的重复列表断言。 |
| `interaction-client.spec.ts` | 表单 DTO／代际校验；保留。 |
| `model-selection.spec.ts` | 已挂载模型已应用／待应用控件；保留。 |
| `no-folder-controls.spec.ts` | 无文件夹恢复及模型选择；保留，接收迁移的文件夹用例。 |
| `operations-preview.spec.ts` | 模拟扩展／恢复行为；夹具已对齐当前宿主策略。 |
| `pi-welcome-mark.spec.ts` | 已挂载欢迎动效；保留为 DOM 行为证据。 |
| `preview-attachments.spec.ts` | 模拟附件状态转换；保留为预览证据。 |
| `preview-sessions.spec.ts` | 模拟会话状态转换；保留为预览证据。 |
| `production-chat.spec.ts` | 正式聊天挂载及宿主消息；保留。 |
| `production-interactions.spec.ts` | 正式交互 UI 与意图；保留。 |
| `project-setup-controls.spec.ts` | 资源选择与配置；保留，接收迁移的资源用例。 |
| `provider-config-ui.spec.ts` | 已挂载设置／提供商意图 UI；保留。 |
| `saved-history.spec.ts` | 历史 DTO、分页及原文预览；保留。 |
| `session-handoff.spec.ts` | 代际提交与草稿顺序；保留。 |
| `session-navigation.spec.ts` | 正式历史导航／焦点；保留。 |
| `sessions.spec.ts` | 会话 DTO 与过期 ID 客户端处理；保留。 |
| `settings-page.spec.ts` | 当前设置页；从 settings-dialog 改名。 |
| `sidebar-craft.spec.ts` | 共享视觉／DOM 样式约束；修正弹窗标题，不声称浏览器布局。 |
| `task-status.spec.ts` | 任务状态展示映射；保留。 |
| `workspace-ui.spec.ts` | 被阻止／不受信任工作区 UI；保留。 |

| `scripts/` 下的文件 | 当前对象与结论 |
|---|---|
| `docs/docs-health.spec.mjs` | 文档期限／替代检查；保留。 |
| `docs/docs-i18n-check.spec.mjs` | 双语标记与 Git 子进程检查；保留。 |
| `docs/docs-verify.spec.mjs` | WI／PRD 及 ACTIVE 校验；保留。 |
| `packaging/production-runtime.spec.mjs` | 生产依赖排除；保留为构建图证据。 |
| `packaging/production-webview.spec.mjs` | 正式包使用共享聊天、排除预览代码；保留为构建图证据。 |
| `packaging/verify-webview-assets.spec.mjs` | 本地／VSIX 静态资源校验器；保留。 |
| `spikes/compatibility.spec.mjs` | 隔离的 RPC／子进程兼容辅助；保留。 |
| `spikes/project-trust.spec.mjs` | 隔离与固定版本 pi 资源探针；保留，不等于坏帧或 F5 检查。 |
| `testing/background-processes.spec.mjs` | Windows 后台进程启动规则；保留为静态证据。 |
| `testing/commit-check.spec.mjs` | 暂存规则与 CLI 错误；保留。 |
| `testing/test-runner.spec.mjs` | 精确测试发现与旧产物排除；保留。 |

后续还把 `runtime-owner.spec.ts` 与 `session-backend.spec.ts` 的两处等待改为先取得可观察的进程就绪信号，再断言取消／退出；控制套接字夹具可接收分片 JSONL；修正 v3／共享弹窗名称，并将两个架构测试标题收窄为静态证据。继续检查实际断言后，交互写入用例改为独立等待 `drain`，worker 预览正例的偏移改为自洽，移除从未输入 `sk-test` 却断言其不存在的空转检查，并登记模型测试临时目录清理；OAuth 夹具在一个用例中复用固定模型路径。最新 `npm run compile`、`npm run lint`、`npm test` 通过（857 通过、0 失败／跳过）；`npm run docs:verify` 为 0 错误、4 条既有 Draft ADR 提示，`git diff --check` 通过。没有删除整份测试文件。这不证明每条断言都必要或能捕获所有回归。真实 pi 坏帧、F5 与安装 VSIX 在本任务中仍未验证。

继续审查实际断言后，又发现几处只影响测试证据的盲区。模型同步测试现用内存中已保存的默认值检查精确模型及 `setModel` 调用；加强断言后首次出现刷新场景 856/857 的红灯，隔离本机 pi 设置的夹具后恢复通过。附件测试的空闲等待现有时限并释放消息钩子；Webview HTML 夹具会释放 provider。已挂载界面的“全部按钮禁用”断言先确认按钮非空；审批测试删除了仅把输入数组与自身比较的期限断言，并收窄标题。历史错误分别核对对应文案；附件和固定版本 pi 探针显式检查预期结果非空。附件测试中读取 `attachments()` 本身也会发送投影；“无额外投影”的计数基线现放在该读取之后，并分别断言无关 change／close 事件。文件级清单仍不能证明每条断言必要，也不能替代真实宿主验证。

进一步阅读脚本测试和较大的运行时、会话、审批及宿主套件后，仍无证据支持删除整份文件。又修复两处确定的盲点：RPC select 测试在对话方法错误时可能提前返回、跳过核心断言；两个审批测试在请求已失败时仍可能无界等待通知。supervisor 测试现用动作发生的时间窗独立检查回执时间戳，而非将收到的时间戳复制到预期对象。两个会话后端结果及 worker CLI 结果现先断言成功回包的具体变体，再检查原先放在条件分支里的字段。相关测试及完整套件通过；最新 `npm test` 为 857 通过、0 失败／跳过，`npm run compile` 与 `npm run lint` 通过。`npm run docs:verify` 为 0 错误、4 条既有 Draft ADR 状态提示，`git diff --check` 通过。此定向审查仍不能证明每条断言必要，也不能以自动化代替真实 pi、F5 或安装 VSIX 的证据。

## 继续逐断言审查

前面的 93 文件表只确认文件层级相关性。新一轮深审完整阅读了 25 个文件的用例、断言和夹具，并核对被测入口与证据层级。其余 68 个文件仍需达到这个审查深度；其中部分文件曾接受定向修复，不等于已完成整文件逐断言审查。

| 本轮完整阅读的文件 | 结果 |
|---|---|
| 适配层运行时：`activity-projection`、`attachment-transport`、`command-classification`、`extension-feedback`、`interaction-writer`、`pi-startup-model`、`process-strategies`、`review-events`、`rpc-occupancy`、`runtime-cancellation`、`runtime-errors` | 均仍检验当前行为。`runtime-errors` 现检查精确去空格和截断结果，而非只查最大长度。`attachment-transport` 剩余的时限、回调故障和 Stop 用例现于断言失败时也清理运行时。 |
| 适配层会话：`session-history`；适配层核心：`controlled-environment` | 均检验当前投影或环境行为。保留文本的分页测试现对持续返回未完成页设置失败上限。 |
| 扩展契约：`credential-text`、`model-catalog`；模型：`model-selection`、`model-settings`；草稿：`draft-submission` | 仍覆盖活跃校验、模型选择／延后变更和草稿 ACK；无整文件删除依据。 |
| 扩展宿主：`focus-chat`、`settings-panel`、`workspace-policy` | 宿主入口与资格用例仍相关。设置面板拒绝用例现运行于已就绪 runtime 和非空草稿，先确认每个禁止意图为合法 v3 消息，再断言无 Prompt／模型调用或状态变更。 |
| Webview：`client`、`interaction-client`、`pi-welcome-mark`、`task-status` | 解析器／客户端及已挂载状态／标记行为仍是当前对象；jsdom 证据不等于浏览器布局或 F5。 |

另对 `extension/draft/tests/file-attachment.spec.ts`、`extension/interactions/tests/interaction-coordinator.spec.ts`、`webview/tests/preview-attachments.spec.ts` 的循环做了局部检查，尚未计入完整深审。其分页或手动时钟循环现可在回归导致永不完成时有界失败。编辑后 `npm run compile`、`npm run lint`、`npm test` 通过（857 通过、0 失败／跳过）；本轮未改生产代码、恢复策略或创建 Git 提交。其余 68 文件审查完成前，不宣称本次逐文件深审结束。

随后完整阅读了 10 份扩展层测试：`extension-interaction-protocol`、`webview-html`、`extension-loading`、`webview-messages`、`provider-interactions`、`architecture-boundaries`、`editor-tools`、`provider-model-sync`、`provider-profiles`、`dirty-write`。它们仍检验当前协议、宿主或工具行为。`dirty-write` 的别名／路径拼写用例现同时要求具体的未保存编辑器拒绝错误和未执行，不能再由无关拒绝原因蒙混通过。`provider-interactions` 的 Stop 标题现只陈述实际验证的结算行为，并在 `finally` 释放等待中的 abort 回调。测试文件编辑后 compile、lint 与全部 857 项测试通过。完整深审进度为 35／93，剩余 58 份。其后阅读了 `rpc-replies` 和 `tool-approval`，`rpc-dialogs` 与 `runtime-protocol` 的截断部分仍需补读，故暂未把该组计入。

再完整阅读 29 份文件，累计 64／93。适配层：`rpc-replies`、`rpc-dialogs`、`runtime-protocol`、`rpc-frames`、`recovery-store`；扩展层：`tool-approval`；Webview：`context-focus`、`workspace-ui`、`session-navigation`、`settings-page`、`operations-preview`、`production-interactions`、`sessions`、`provider-config-ui`、`candidate-combinations`、`candidate-review`、`production-chat`、`change-review`、`attachment-ui`、`preview-sessions`、`session-handoff`、`saved-history`；脚本：`production-runtime`、`production-webview`、`docs-health`、`docs-i18n-check`、`docs-verify`、`verify-webview-assets`、`compatibility`。它们仍覆盖当前入口或明确的模拟／静态边界。`session-runtime` 连续 gate 请求现先要求回执数量递增，再检查最新决定，旧拒绝回执不能掩盖缺失的新回执；此文件仍在审查。`session-navigation` 在每次界面更新后重新查询列表行，确保断言针对当前 DOM 而非保存的旧节点。第一处修改后 compile、lint 与 857 项测试通过；后一处修改后的检查尚待运行。剩余 29 份包含较大的运行时、宿主和 candidate 套件。本轮仍无整文件删除依据。

随后核对其余 29 份文件，完成全部 93 份已收集测试源码的审阅。这些较大的适配层、宿主、附件、交互、Webview 与脚本套件仍覆盖当前入口或明确的模拟边界。又修复两处确认的测试缺陷：自定义端点取消夹具现在确实输入固定测试密钥，再验证 `models.json` 与界面投影都不包含它；supervisor 退出测试在子进程提前结束时及时清理期限计时器。此前连续审批回执和会话列表更新也已改为检查新的可观察结果。这些修改不改变生产行为或收集的用例数。完整测试现为 857／857 通过，compile 与 lint 通过。源码审阅和 93 份文件的相关性判断不代表已证明每条断言不可替代或能发现所有回归；浏览器布局、真实 pi 损坏报文、F5 和安装 VSIX 属于独立证据。

最新定向复核加强了 `rpc-frames.spec.ts`：长文本增量现在检查脱敏和截断后的精确内容；助手完成检查最终文字；合法空内容检查最终文字为空；未展示内容检查 thinking 文字及原始索引。坏帧／未知帧用例标题也已与两种不同结果对齐。本轮扫描条件断言和异步等待，已查看的可疑分支均有先行的结果变体或非空断言，没有确认新的假通过点。最后一次断言编辑后，`npm run compile`、`npm run lint`、`npm test` 通过（857／857，0 失败／跳过）。这仍不能证明 857 项断言全部必要或充分。

2026-09-30 的深入复核将 `execution-ui`、`app`、`model-selection`、`runtime-owner`、`recovery-store` 和 `supervisor` 与当前界面或占用实现对照。`execution-ui` 仍有第二处只用 computed `overflowY !== "hidden"` 宣称防裁切；先前已在 `app` 的同类断言证明 jsdom 的这一盲区。流式状态下的模型控件已有其他覆盖，`app.spec.ts` 已逐层检查 footer 之间的 overflow 简写和长写，因此删除这项重复弱用例。另一项运行时失联用例未提供历史聊天，却在标题中声称不会暴露旧聊天；标题现只描述实际检查的草稿与动作。`runtime-owner` 的 ACK 用例原先在服务端发送 ACK 前检查 pending，现等待 ACK 连接关闭后再确认缺少退出回执不能完成 `end()`。`recovery-store` 与 `supervisor` 的现有断言保留。完整测试现为 856 通过、0 失败／跳过，compile 与 lint 通过；浏览器裁切及真实宿主／运行时仍需独立证据。

下一轮逐文件核对了 `trusted-runtime.spec.ts`、`runtime-chat.spec.ts` 与适配层 checkpoint、宿主任务实现。多个 checkpoint／对话用例忽略其前置 `start()` 结果：一旦启动失败，预期的 `unavailable` 仍可能出现，使测试未执行目标场景就通过。所有要求运行时 ready 的这些用例现先断言启动成功。共享 `readySettings()` 夹具若未达到宿主 ready 会失败并释放 provider。`runtime-chat` 的 Stop 用例现要求取消回调确实安装且调用一次，并要求延后 thinking 设置恰好写入一次；工作区变化用例现检查实际 `stop()` 调用，而非只看界面投影。没有整份测试文件因此失效。修改后 compile、lint、856 项完整测试通过，0 失败／跳过。逐断言审查仍在进行；这些检查不构成真实 pi、F5 或安装 VSIX 证据。

继续将 `provider-profiles.spec.ts`、`sessions.spec.ts`、`provider-model-sync.spec.ts` 和 `models/tests/model-selection.spec.ts` 与配置切换、会话交接及模型变更实现对照。`provider-profiles` 的 checkpoint 拒绝用例原先只检查旧运行时仍 ready：即使切换动作被忽略也可能通过；现要求 `state-changed` 错误投影，并核实前置 ready。共享会话夹具现须在提供已保存会话选择前确认运行时 ready。永久悬挂 provider refresh 的模型同步用例现要求第二次运行时启动及新 Prompt 被接纳；此前 ready／idle 断言也可能只是旧会话的状态。其余已读用例仍有当前可观察行为覆盖。编辑后 compile、lint 和 856 项完整测试通过；本轮未删收集文件或用例。逐断言质量审查仍在进行。

本轮将 `candidate-approvals.spec.ts`、`history-navigation.spec.ts` 和 `session-runtime.spec.ts` 与当前预览桥、已挂载界面及运行时夹具对照。两项模拟审批队列用例原先只检查请求数量，删错请求或旧的八项队列重现都可能通过；现检查剩余或新队列的精确请求 ID，自定义工具用例也核对完整的外发决定。历史更新用例在比较重新渲染后的路径前，现要求首行路径确实存在，避免两边都缺失时假通过。已读的会话运行时断言保留现有前置条件和预期结果。修改后 compile、lint、856 项完整测试通过；未删除用例。这仍是自动化界面／夹具证据，不等于真实宿主验收。

随后将 `candidate-combinations.spec.ts`、`candidate-review.spec.ts` 和 `preview-sessions.spec.ts` 与当前预览桥对照。组合用例现要求已保存会话目录确实加载，并确认到期的是首个审批请求；附件到期用例先建立已接纳且待结算的附件和八项待审批队列，再断言到期失败。预览会话交接用例现检查 New／Restore 在提交前保留旧代际、提交后恰好前进一代；标题也不再暗示该夹具并未注入的确认回调。`candidate-review` 现有断言保留。测试编辑后 compile、lint 及 856 项完整测试通过；未改变生产行为或收集的用例数。

本轮将 `file-attachment.spec.ts`、`attachment-ui.spec.ts` 和 `preview-attachments.spec.ts` 与宿主接纳、已挂载界面和模拟桥对照。共享宿主夹具现要求运行时 ready，启动失败时清理资源，避免拒绝用例因运行时未启动而假通过。运行时失联的界面用例现要求历史入口消失。长历史预览用例现要求文件与选区记录同时存在，并将拒绝接纳后的保留元数据与独立副本对比。compile、lint 与 856 项完整测试通过。没有整份测试需删除的依据；真实宿主的附件行为仍不在本轮自动化证据内。

本轮将 `runtime-cancellation.spec.ts`、`rpc-occupancy.spec.ts` 和 `process-strategies.spec.ts` 与当前占用和进程实现对照。过期完成用例现在于 agent 结算后检查命令仍占用，并在当前命令结束后检查错误会话 ACK 仍阻止发送；此前正确回调的后续清理可能掩盖任一旧回调缺陷。owner 异常用例现统计启动次数，使再次调用 owner 却再次失败不能冒充“屏障保留”。取消测试保留现有迟到连接检查。compile、lint 和 856 项完整测试通过；收集的用例数不变。

本轮复核 `workspace-policy.spec.ts`、`focus-chat.spec.ts` 和 `extension-interaction-protocol.spec.ts`。无效文件夹选择用例现要求原生 picker 确实调用一次，Open 被静默忽略时不能通过。聚焦失败用例现核对尝试的是注册的聊天视图命令，而非接受任意命令的失败。工作区矩阵标题已收窄到实际覆盖的三类动作。v3 交互意图及 v2 拒收测试的现有断言保留。compile、lint 与 856 项完整测试通过；未删除文件或用例。

模型／提供商测试复核又确认三处断言缺口。取消 API 密钥输入用例原本可在登录提示从未打开时通过，现要求登录及秘密输入提示各发生一次。thinking level 保存失败用例现记录设置写入，证明重叠的 thinking／模型操作没有执行。延后模型用例除调用顺序外，还检查最终模型投影、待应用 thinking 清空及无模型错误。`custom-endpoints.spec.ts` 已检查当前写盘、取消和脱敏行为，本轮无需编辑。仅修改测试后，`npm run compile`、`npm run lint` 及全部 856 项测试通过。仍无整文件删除依据；全绿不保证每条断言有效，也不替代真实 pi、F5 或安装 VSIX 证据。

下一轮将 `draft-submission`、`model-selection`、`review-events`、`change-review`、`activity-projection` 与 `custom-endpoints` 对照当前实现。OAuth 端点用例原先只排除设备码和带 token 的 URL 进入提供商投影；现还排除普通授权 URL、设备 URL 和浏览器说明，并要求说明确实到达宿主通知。端点合并／删除用例现比较保留下来的完整提供商对象；拒绝删除原生提供商时，文件必须逐字节不变。首个模型选择用例的标题收窄为其实际验证的忙碌操作拒绝；旧页面动作仍由后面的视图重建用例覆盖。其余已读用例有直接前置条件和可观察结果；未删除文件。仅修改测试后 compile、lint 和 856／856 项测试通过。审查继续，不宣称所有断言均已充分证明有效。

已挂载 Webview 测试本轮核对了 `production-chat`、`sessions`、`provider-config-ui`、`production-interactions`、`change-review` 和 `model-selection` 与当前组件、客户端路径。两项模型焦点用例原先直接注入宿主 busy／已应用状态，却未证明点击模型后发出意图；现均要求精确的 `setChatModel` 消息。thinking 键盘焦点用例在模拟宿主应用前，现要求精确的 `setThinkingLevel: high` 消息。未命名的当前会话检查改为断言实际的空标题，不再同时接受无关的回退文案。其他已读用例保留现有消息或 DOM 状态检查；未删除文件。修改后 compile、lint 和全部 856 项测试通过；仍继续逐断言审查。

下一组客户端／历史测试核对了 `client`、`interaction-client`、`saved-history`、`history-navigation`、`session-handoff` 和 `context-focus`。`client.spec.ts` 三种阻止发送场景原本可能因为草稿仍在同步而通过，与所测模型或附件条件无关。现先要求精确的草稿更新、宿主附件状态回执、已接受文本、同步完成，以及施加阻止条件前确实可发送。宿主忙碌后恢复用例也核对重新发出的草稿文本及身份。其余已读用例保留请求 ID、代际、焦点目标和有界分页断言；未删除整份文件。仅修改测试后 compile、lint 和 856／856 项测试通过。逐断言审查继续；这些客户端夹具不等于真实宿主验收。

适配层本轮对照当前实现核对了 `runtime-errors`、`rpc-dialogs`、`interaction-writer`、`extension-feedback`、`command-classification` 和 `pi-startup-model`。交互写入的 callback／drain 用例现统计精确写入帧，并检查三类监听器均已释放；连接退休用例检查后续被拒绝的写入没有到达 stream。反馈容量用例现比较清除已淘汰 key 前后的完整快照；长期替换用例检查 status 内容确实更新且本地 ID 更新，不再只检查条目数量。其他四份文件保留已有的结果、边界和失败断言。未删除收集文件；仅修改测试后 compile、lint 和全部 856 项测试通过。逐断言审查仍在继续。

`execution-ui.spec.ts` 的代际隔离用例原先注入不完整的迟到 `workspaceState`，解析器会先拒收，无法证明代际保护生效。现在构造完整的第一代报文，先断言解析器接纳，再检查升至第二代后旧消息、thinking 活动及审批均未恢复。仅修正测试后 compile、lint 和全部 856 项测试通过。这证明夹具到达预期边界，不证明套件中每条断言都必要，也不是实际宿主行为验收。

下一轮将 `workspace-ui.spec.ts`、`sidebar-craft.spec.ts`、`operations-preview.spec.ts` 和宿主 `settings-panel.spec.ts` 与当前实现对照，也检查了重叠的 `settings-page`、`provider-config-ui` 用例。工作区阻止状态循环原先对三种状态都只要求提示非空，文案串位或重复仍可通过；现分别核对精确标题和说明。设置页视觉用例现确认三个分类、选中的 Providers 页、打开的 OpenAI 详情及精确刷新意图。预览恢复用例保留明确的模拟范围，宿主设置用例已有 ready 运行时、合法意图和隔离检查；这些文件未确认其他新问题。仅测试变更后 compile、lint 和全部 856 项测试通过。浏览器布局和真实宿主验收仍需单独证据。

进一步检查 `settings-page.spec.ts` 发现：原先被接纳的第二代报文与第一代展示同一模型，即使第二代被忽略，后续“一个模型”的断言也可能通过。现为第二代提供不同目录，先确认该模型出现，再逐帧核对旧代及异视图报文不能覆盖它；无效语言也核对页面语言未改变。仅修改测试后 compile、lint 和全部 856 项测试通过。

下一轮将 `pi-welcome-mark.spec.ts`、`task-status.spec.ts`、`context-focus.spec.ts` 和 `extension-interactions.spec.ts` 与已挂载组件对照。欢迎序列用例现核对标题所说的金色阶段。任务状态的节点复用用例原先即使后两次渲染一直保留初始文字也能通过；现核对同一节点上的 Working、Replying、Working 文字变化。嵌套 Escape 与交互表单已有焦点目标、有类型的回答、阻止动作及可观察反馈检查，未确认新问题。仅测试编辑后 compile、lint 和全部 856 项测试通过。DOM 与模拟时钟证据不能代替浏览器动效或真实宿主验收。

架构与打包测试本轮核对 `architecture-boundaries.spec.ts`、`production-runtime.spec.mjs`、`production-webview.spec.mjs` 和 `verify-webview-assets.spec.mjs` 与当前源码及构建图。模块入口扫描原先只识别 `from` 导入；新增静态 `import("../client-state.js")` 反例后按预期失败（855／856），扫描覆盖字面量动态导入后通过。选定文件的禁用能力检查和模块入口夹具也覆盖字面量 `require()`。生产依赖图仍排除 direct／test／preview 模块，资源测试仍覆盖当前 bundle 与归档；没有整文件删除依据。仅测试修正后 compile、lint 和全部 856 项测试通过。源码扫描只是静态检查，不能证明计算得到的导入路径或已安装 VSIX 行为。

下一轮将 `controlled-environment.spec.ts`、`trusted-approval-gate.spec.ts`、`webview-messages.spec.ts` 和 `webview-html.spec.ts` 与当前实现对照。环境用例现核对完整输入对象未变，且返回副本恰好含预期覆盖值。可信审批的迟到变更用例现分别修改顶层与嵌套字段，均须拒绝调用。v3 消息解析及打包 HTML 用例已有直接校验和 CSP／资源根断言，未确认新问题。compile 与 lint 通过。两次重叠的完整测试运行分别出现无断言栈的不同 Webview 文件级失败；失败文件单独运行均通过，另一个 runner 退出后完整运行 865／865 通过。共用 runner 会重建 `dist/tests`，并发运行可能造成干扰，但未证明具体根因。WI-034 新增 `package-vsix.spec.mjs` 后当前收集文件变为 94 份；这份新文件仍需单独核对，不能据此宣称当前所有文件均已审完。

## 审查交接（2026-09-30）

维护者要求停止继续审查测试文件。此前对 WI-034 之前的 93 份测试源码完成文件级相关性核对，未发现删除整份文件的依据，已修复上文确认的假通过断言。WI-034 后来新增 `package-vsix.spec.mjs`，当前收集文件为 94 份。该组包测试新增显式声明 `.local-env`、`.git`、`skills-lock.json` 和旧 VSIX 的反例：首次运行发现归档包含 `.local-env/secret.json`；组包器现即使 `files` 选中这些路径也会排除，并拒绝声明的 `../outside` 路径。修复后定向组包测试 11／11 通过。新增文件的这些 WI-034 用例已核对，但不属于此前 93 份文件级相关性清单。不再安排逐断言审查。测试全绿不证明每条断言必要或充分，WI-033 的维护者接受仍待定。
