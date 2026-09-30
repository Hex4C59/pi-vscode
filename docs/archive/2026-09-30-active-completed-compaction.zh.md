# ACTIVE 已完成任务压缩（2026-09-30）

[English](2026-09-30-active-completed-compaction.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-active-completed-compaction.md](2026-09-30-active-completed-compaction.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 创建：2026-09-30
- 权威：仅历史 ACTIVE 正文；现行工作见 [`ACTIVE.md`](../../ACTIVE.md)
- 归档原因：维护者要求把已完成任务移出 ACTIVE，避免入口变成已关闭 WI 目录

## Replacement reason

2026-09-30 维护者要求归档 ACTIVE 中已完成任务。焦点清单、逐 WI 受托接受表、已关闭审查／ARCH 停车场行，以及重复的已完成 WI 表，是会话历史，不是当前工作。编号查找仍在[已关闭索引](2026-09-29-closed-wi-index.zh.md)。压缩不重开那些 WI，不改 gate 或 ADR，不批准 WI-036 Build，不创建 Git 提交。

## Live remainder in ACTIVE

ACTIVE 保留：会话契约、WIP=0、macOS 自测平台决定与受托接受身份、未决停车场（WI-036 仅 Prepare、ARCH-02 顺序封装不自动开 WI、审查停止、范围外队列）、最多两条交接，以及一行已完成索引指针。

逐 WI 受托接受从来不是新工作的长期通行证。

## Delegated acceptance table (historical)

macOS 自测平台变更，以及 2026-09-30「代理依据完成 ACTIVE 的要求接受；不是维护者亲自测试」的身份，仍以各 WI 验收记录为准。本表本身不是当前授权。原表见下方[原始中文记录](#original-chinese-source-appendix)。

## Closed focus checklist (historical)

2026-09-30 焦点行均为 `[x]` 已关闭。打开[已关闭索引](2026-09-29-closed-wi-index.zh.md)中的验收记录。非 WI 行（架构文档同步、quality-code skill、`src/extension.ts` 入口整理、停止逐断言审查、测试审查）是历史记录，不构成新的建造授权。原文见附录。

## Closed audit and architecture parking items (historical)

RUNTIME-01／02、CORE-01／02、UI-01～03、TOOL-01／02、RUNTIME-03～05、接口风险、资源与期限测量、ARCH-01／03～08、ARCH-02 补充、PACKAGE-01 已随对应 WI 关闭。ARCH-02 **顺序封装**未关闭，仍停在 ACTIVE（2026-09-29 确认设计；不自动开 WI）。

证据入口仍为：[运行时与凭据](../discussions/2026-09-30-runtime-helpers-audit.zh.md)、[核心边界](../discussions/2026-09-30-core-boundaries-audit.zh.md)、[UI](../discussions/2026-09-30-ui-components-audit.zh.md)、[工具链](../discussions/2026-09-30-tooling-config-audit.zh.md)。

## Historical review notes

审查覆盖限制（长文件抽查、不重启全仓逐断言审查、历史 `npm test` 计数）留在上述讨论中。它们不是当前测试证据。

## Follow-up entry cleanup (2026-09-30)

已批准队列与 macOS 自用验收完成后，维护者再次要求清理 ACTIVE。入口现保留会话契约、WIP=0、当前验收范围与身份、standing non-goals、一条简短文档交接及历史指针。本归档前文的未决措辞是首次压缩时的快照，不是当前工作：WI-057／WI-058 已关闭，见[已关闭索引](2026-09-29-closed-wi-index.zh.md)。

从入口移出的内容在此或既有证据归属文档中保留：

- **macOS 验证交接：** 双窗口 F5／安装版所有权、崩溃清理、自定义端点调用及 OAuth 设备码／浏览器交互见[验证记录](2026-09-30-macos-verification-acceptance.zh.md)。记录的是代理受托自用验收，不是维护者亲自测试，也不是隔离 profile 已登录 Copilot。该验证会话未重跑 compile／lint／test，未创建 Git 提交。
- **停车场清空交接：** WI-058 每窗口恢复域与 ADR 0009 已接受。侧栏对比按 WI-025／UI skill 结案，不采用 Claude Code 珊瑚色，见[讨论](../discussions/2026-09-28-claude-code-ui-comparison.zh.md)。剩余 11 文件审查结案：生产文案已由 WI-058 覆盖，其余仅用于预览。范围外能力升格为 standing non-goals；已停止的逐断言审查未重启。
- **文档纠正检查点：** 中英文 README 已同步自用 macOS Accepted 状态及既有证据。该次修改前，`master` HEAD 为 `5bea9ae`，与本地记录的 `origin/master` 提交差异为 `0 / 0`，未运行 fetch。文档结构／双语及 health 检查通过，错误与提示均为 0；`git diff --check` 通过。这些是历史观察，不是当前 Git 或行为测试证据。该文档任务未运行 compile／lint／test，未提交或推送。

重复的 WI-057／WI-058 行改由已关闭索引查找；现行 gate 状态见 [gate 表](../reference/architecture-gates.zh.md)。本次仅调整入口组织，不新增 WI、产品需求、验收或 Git 授权。

## Original Chinese source appendix

<a id="original-chinese-source-appendix"></a>

以下保留压缩前 ACTIVE 中已完成授权表、焦点清单、已关闭停车场审查／ARCH 行与重复已完成表的原文，仅将历史标题改为粗体以免增加标题计数。现行入口不在此重复。

**验收授权与平台决定**

维护者于 2026-09-30 作出两项决定，逐 WI 记录如下。

**一、平台变更（维护者确认）**

自用验收平台由 PRD 原述的「Windows 本地 VS Code 已安装 VSIX」改为 **macOS 本机 VS Code**。维护者只在 macOS 上测试；**Windows 实机 F5 与安装版 VSIX 移出验收范围，记为范围外**，不再作为待补缺口。

这是范围变更，须留存后果：本轮之前各 WI 记录中反复出现的「F5／安装 VSIX 未验证」缺口，在本决定之后的含义变为「**macOS 实机证据未验证**」，不再包含 Windows 含义。原 PRD 的 Windows 表述已双语同步为 macOS（见下「PRD 同步」）。本决定不改变 Cursor、公开发布、全生态或其他 OS 的既有排除项，也不接受整份 Draft PRD。

**二、验收授权（逐 WI 范围，维护者授权）**

| WI | 授权评估内容 | 平台 | 方式 |
|---|---|---|---|
| WI-031 | 已完成，不重开 | — | 维护者技术接受（2026-09-29），不在本轮范围 |
| WI-032 | 六处宿主入口共用凭据文本规则的自动化复核 + macOS 宿主证据 | macOS | 代理受托接受（后续授权） |
| WI-033 | 运行时报文校验 + 真实 pi 坏报文故障注入 + macOS 宿主证据 | macOS | 代理受托接受（后续授权） |
| WI-034 | VSIX 组包能力 + macOS F5 与隔离安装版证据 | macOS | 代理受托接受（后续授权） |
| WI-035 | 遗留运行时启动交接、活所有者保护 + macOS F5／隔离安装 | macOS | 代理依据本次明确授权接受并提升 ADR 0006 |
| WI-037 | RUNTIME-01／02 thinking 有界上下文与完整引号凭据脱敏 + macOS F5／隔离安装 | macOS | 代理依据本次明确的实机取证并完结要求接受 |
| WI-039 | PACKAGE-01 安装版运行时依赖闭包 + 解包 import／隔离安装供应商加载 | macOS | 代理依据本会话完成 ACTIVE 任务并收尾提交的要求接受 |
| WI-038 | ARCH-05 跨宿主 endpoint 写入互斥 + 双窗口争用／串行提交；ADR 0007 | macOS | 代理依据本会话完成 ACTIVE 任务并收尾提交的要求接受 |
| WI-040 | CORE-01 并发预检查下八张审批卡准入 | 自动化 | 代理依据本会话完成 ACTIVE 任务并收尾提交的要求接受 |
| WI-041 | CORE-02 session-worker 请求关联与预览游标 | 自动化 | 代理依据本会话完成 ACTIVE 任务并收尾提交的要求接受 |
| WI-042 | UI-01 模型选择器稳定身份 | 自动化 | 代理依据本会话完成 ACTIVE 任务并收尾提交的要求接受 |
| WI-043 | UI-02 已消费 Escape | 自动化 | 代理依据本会话完成 ACTIVE 任务并收尾提交的要求接受 |
| WI-044 | TOOL-01 Vite 提交路径分类 | 自动化 | 代理依据本会话完成 ACTIVE 任务并收尾提交的要求接受 |
| WI-045 | UI-03 缺失审阅路径本地化 | 自动化 | 代理依据本会话完成 ACTIVE 任务并收尾提交的要求接受 |
| WI-046 | RUNTIME-03／04／05 诊断 helper 结算与成功证据 | 自动化 | 代理依据本会话完成 ACTIVE 任务并收尾提交的要求接受 |
| WI-047 | ARCH-06 endpoint 写入输出预算 | 自动化 | 代理依据本会话完成 ACTIVE 任务并收尾提交的要求接受 |
| WI-048 | ARCH-02 补充 默认保存失败不修改实时模型 | 自动化 | 代理依据本会话完成 ACTIVE 任务并收尾提交的要求接受 |
| WI-049 | ARCH-07 组包入口缺必需资产须失败 | 自动化 | 代理依据本会话完成 ACTIVE 任务并收尾提交的要求接受 |
| WI-050 | TOOL-02 拒绝未收集的 `.spec.tsx` | 自动化 | 代理依据本会话完成 ACTIVE 任务并收尾提交的要求接受 |
| WI-051 | 接口风险先核验 Composer 与 FileSnapshot | 自动化 | 代理依据本会话完成 ACTIVE 任务并收尾提交的要求接受 |
| WI-052 | 资源与期限风险先测量 | 自动化 | 代理依据本会话完成 ACTIVE 任务并收尾提交的要求接受 |
| WI-053 | ARCH-08 流式与历史预览成本先测量 | 自动化 | 代理依据本会话完成 ACTIVE 任务并收尾提交的要求接受 |
| WI-054 | ARCH-01 准入与状态转换所有者盘点 | 自动化 | 代理依据本会话完成 ACTIVE 任务并收尾提交的要求接受 |
| WI-055 | ARCH-03 运行时接口能力组合盘点 | 自动化 | 代理依据本会话完成 ACTIVE 任务并收尾提交的要求接受 |
| WI-056 | ARCH-04 内部模型与 Webview DTO 耦合盘点 | 自动化 | 代理依据本会话完成 ACTIVE 任务并收尾提交的要求接受 |

授权边界（与 2026-09-27 委托先例一致，且不继承其范围）：

- **身份（2026-09-30 后续授权）**：维护者明确要求「你帮我审查完就不要我来独立接受了」，将 WI-032／WI-033／WI-034 的最终验收判断与关闭委托给代理；记录为**代理受托接受**，不再要求维护者逐项独立接受，也不伪称维护者亲自测试。原先仅评估、等待独立接受的条件被本决定替代。
- **逐 WI 生效**：上表逐项授权，不构成可用于其他 WI 的长期通行证；新增 WI 须另行授权。
- **不涉及**：整份 Draft PRD 的提升、gate 状态、公开发布。本会话维护者要求完成 ACTIVE 剩余任务并在每项后提交 Git，构成逐项提交授权；仍不推送。
- **PRD 同步**：另一轮已把 Windows → macOS 平台决定双语同步到 PRD；本轮按“全部当前改动”提交授权一并保存，并同步 WI-032／033 的限定接受状态，PRD 仍为 Draft。

**当前焦点与未决项**

- [x] WI-056 代理受托接受并关闭：共享值对象保留，未复制 DTO。[记录](2026-09-30-wi-056-macos-acceptance.zh.md)。授权建造队列已空（WIP=0）。
- [x] WI-055 代理受托接受并关闭：生产 RPC 实现全部可选 lifecycle 方法；noop 仅 handoff；不拆接口。[记录](2026-09-30-wi-055-macos-acceptance.zh.md)。ARCH-04 盘点已关闭。
- [x] WI-054 代理受托接受并关闭：发送／模型／Stop／profile／会话／文件夹准入分属不同所有者，未合并 busy。[记录](2026-09-30-wi-054-macos-acceptance.zh.md)。ARCH-03 盘点已关闭。
- [x] WI-053 代理受托接受并关闭：流式 stringify／lex 与历史预览遍历已测，不优化。[记录](2026-09-30-wi-053-macos-acceptance.zh.md)。ARCH-01 盘点已关闭。
- [x] WI-052 代理受托接受并关闭：启动设置、诊断 stderr、artifact inflate 与 test／Git 目前不需要库内预算。[记录](2026-09-30-wi-052-macos-acceptance.zh.md)。ARCH-08 测量已关闭。
- [x] WI-051 代理受托接受并关闭：生产 Composer 标志由 `Candidate` 从同一 workspace 派生；FileSnapshot 按 `DraftAttachment.kind` 配对校验器；未确认生产错误配对。[记录](2026-09-30-wi-051-macos-acceptance.zh.md)。资源与期限测量已关闭。
- [x] WI-050 代理受托接受并关闭：已收集 `tests/` 下 `.spec.tsx` 使发现失败；现有规格仍为 `.spec.ts`。[记录](2026-09-30-wi-050-macos-acceptance.zh.md)。接口风险核验已关闭。
- [x] WI-049 代理受托接受并关闭：组包收集与 CI 在缺 helper／CSS 时失败；`verify-vsix` 仍独立。[记录](2026-09-30-wi-049-macos-acceptance.zh.md)。TOOL-02 已关闭。
- [x] WI-048 代理受托接受并关闭：默认保存失败保留旧投影；实时 applyConfiguredModel 收不到新模型。[记录](2026-09-30-wi-048-macos-acceptance.zh.md)。ARCH-07 已关闭。
- [x] WI-047 代理受托接受并关闭：endpoint 写入输出须落入 1 MiB 读取预算；pretty-print 超限保留原文件且不登录。[记录](2026-09-30-wi-047-macos-acceptance.zh.md)。ARCH-02 补充已关闭。
- [x] WI-046 代理受托接受并关闭：诊断探针拥有 child／pipe 错误、boolean success 与观察退出；五项合成用例通过。[记录](2026-09-30-wi-046-macos-acceptance.zh.md)。ARCH-06 已关闭。
- [x] WI-043 代理受托接受并关闭：窗口级模型弹层 Escape 忽略已消费事件；重叠添加上下文菜单 jsdom 用例通过。[记录](2026-09-30-wi-043-macos-acceptance.zh.md)。TOOL-01 已关闭。
- [x] WI-042 代理受托接受并关闭：模型列表已应用 radio 使用稳定身份；同名标签与 canonical 碰撞挂载用例通过。[记录](2026-09-30-wi-042-macos-acceptance.zh.md)。UI-02 已关闭。
- [x] WI-041 代理受托接受并关闭：inspect／history／preview 绑定请求身份与预览游标；五条合成反例与 list 错页对照自动化通过。[记录](2026-09-30-wi-041-macos-acceptance.zh.md)。UI-01 已关闭。
- [x] WI-040 代理受托接受并关闭：并发预检查下最多八张待审批卡，写入点重检；九路延迟 custom-tool 预检查自动化通过。[记录](2026-09-30-wi-040-macos-acceptance.zh.md)。CORE-02 已关闭。
- [x] WI-038 代理受托接受并关闭：跨宿主 `models.json` 写入互斥，ADR 0007 Accepted；开发／隔离安装双窗口争用与串行提交通过。[记录](2026-09-30-wi-038-macos-acceptance.zh.md)。ARCH-06 已由 WI-047 关闭。
- [x] WI-039 代理受托接受并关闭：安装版 VSIX 内联 pi-ai、组包拒绝未发布依赖、解包真实 import 红／绿通过；隔离安装版设置页加载供应商配置。[记录](2026-09-30-wi-039-macos-acceptance.zh.md)。ARCH-07 已由 WI-049 关闭。
- [x] WI-037 代理受托接受并关闭：thinking 有界上下文与完整引号凭据脱敏；macOS F5／隔离安装合成 SSE 逐帧通过。[记录](2026-09-30-wi-037-macos-acceptance.zh.md)。助手正文逐 delta 与 WI-036 未改。

- [x] 本轮按维护者要求同步架构文档（仅文档，不改应用代码／提交 Git）：[主架构](../architecture/vscode-extension-architecture.zh.md)补清宿主供应商／默认 SDK、RPC agent 与 session-worker 三条路径及现有模块责任；WI-035 章节与[消息契约](../reference/webview-messages.zh.md#启动交接wi-035)、[ADR 索引](../decisions/README.zh.md)明确已批准 Build／验收待完成的过渡关系；入口与模型段落改链既有验收记录，保留已有 ADR 0006 取证文本与 Draft 状态。本轮 `npm run docs:verify`、`npm run docs:health`（0 错误、4 条既有 Draft ADR 提示；双语 0 错误）及 `git diff --check` 通过。未重跑 compile／lint／行为测试／F5／安装验证，不新增验收结论，不关闭 WI-035，不实施 WI-036。

- [x] 本轮按维护者要求参考 `refactor` 创建项目内 [quality-code skill](../../.agents/skills/quality-code/SKILL.md)，用于新增功能、修复和有意行为变更的质量约束；维护者确认纯行为保持重构仅用 `refactor`，混合任务按阶段分开，不叠加两个流程；当前 GUI 目录已识别。采用行为契约、小步实现、按风险验证和最终差异复核；维护者后续要求补回三项：新增／修改函数体少于 50 行（含空行与注释）、维护者明确授权后的修改前／每步验证后／最终 Git 检查点，以及 Strategy／Builder／职责链使用指引与[示例](../../.agents/skills/quality-code/PATTERNS.md)。本次修改 skill 不构成提交授权，不扩大应用重构范围。本次只创建 skill 与记录，不改应用代码，不改变 WI-035／WI-036 状态。`npm run docs:verify`（0 错误、4 条既有 Draft ADR 提示，双语检查 0 错误）与 `git diff --check` 通过；尚未通过实际编码任务评估 skill 的执行效果。

- [x] WI-034 代理受托接受并关闭：组包、解包真实 RPC／gate、macOS F5／隔离安装激活渲染通过。[记录](2026-09-30-wi-034-macos-evaluation.zh.md)；不等于完整聊天或 REQ-009 验收。
- [x] [`src/extension.ts`](../../src/extension.ts) 入口整理（命名常量、拆开嵌套构造、导入分组）：仅可读性改动，注册顺序、参数与行为不变。维护者 2026-09-30 在会话中批准；属已授权范围内的小改，按协作指南不单独开 WI，当时 WI-034 为 WIP=1，现已按最终委托关闭。实跑 compile／lint／`npm test`（865 通过、0 失败／跳过）、`git diff --check` 与 [`architecture-boundaries.spec.ts`](../../src/extension/tests/architecture-boundaries.spec.ts)（5／5）通过；未提交 Git；本轮 macOS 激活渲染证据见 WI-034；Windows 范围外。
- [x] WI-033 代理受托接受并关闭：真实 pi 字节回放与既有协议矩阵通过；截断 JSON 保持忽略，原生坏帧路径未验证。[记录](2026-09-30-wi-033-macos-evaluation.zh.md)；无需维护者独立接受。
- [x] 依维护者 2026-09-30 要求停止逐文件／逐断言审查，不再排队继续；测试全绿不等于所有断言有效。
- [测试审查与修复记录](../discussions/2026-09-29-test-relevance-audit.zh.md)：WI-034 之前 93 份文件有文件级结论，没有整文件删除依据；新增组包测试使收集文件成为 94 份，其组包反例已定向核对，未纳入原 93 份清单。已确认的问题已修复；原接受状态不变。
- [x] 旧代际 Webview 用例现先确认迟到的 `workspaceState` 是有效报文，再验证它不能恢复消息、thinking 或审批；此前无效夹具可使隔离断言假通过。仅测试变更，compile／lint／856 项测试通过；文档检查见本轮记录。
- [x] 继续对照工作区 UI、设置页视觉测试、预览恢复及宿主设置面板：三种阻止状态现分别核对标题和说明；设置页核对分类、选中页、提供商标题及精确刷新意图。模拟预览与宿主设置隔离未确认新问题。仅测试变更，compile／lint／856 项测试通过。
- [x] 设置页代际用例现使用不同的第二代模型目录，逐帧核对旧代／异视图报文不能覆盖它；此前相同目录可能使第二代未被接纳仍通过。仅测试变更，compile／lint／856 项测试通过。
- [x] 继续核对欢迎标记、任务状态、嵌套焦点与扩展交互表单：任务状态现验证原位更新时的每一步文字，欢迎动画核对金色入场阶段；后两份未确认新问题。仅测试变更，compile／lint／856 项测试通过。
- [x] 架构／打包测试复核：模块入口扫描原先漏掉静态 `import()`，反例先红；现连同 `require()` 一起核对跨模块入口及选定文件的禁用能力引用。宿主、Webview 依赖图及 VSIX 资源测试仍覆盖当前构建边界。仅测试变更，compile／lint／856 项测试通过。
- [x] 测试有效性核对：93／93 份已收集测试源码完成相关性及断言审阅，修复已确认问题；无整文件删除依据，不宣称每条断言都不可替代。详情见审查记录。
- [x] WI-032 代理受托接受并关闭：六入口追踪与定向 139 项测试通过，macOS 宿主 smoke 已取证；六入口原生敏感交互未重放。[记录](2026-09-30-wi-032-macos-evaluation.zh.md)。
- [x] WI-031 维护者技术接受。F5／安装 VSIX 不在本切片内。

- [x] WI-030 维护者完成剩余设置页检查。真实浏览器登录、真实端点调用和新的安装包不在本次关闭内。ADR 0005 仍为 Draft。
- [x] WI-029 维护者技术接受；真实 pi／F5／安装 VSIX 不在本次证据内。
- [x] WI-028 维护者技术接受；Linux 隔离 spike／F5／安装 VSIX 不在本次证据内。
- [x] WI-027 维护者接受展示切片；F5／安装 VSIX 不在本切片内。
- [x] WI-026、WI-023、WI-024 的维护者 F5 视觉接受。
- [x] 维护者确认已安装的 VSIX 满意。该接受不追溯为 WI-026／023／024 的原证据。
- [x] 「生产聊天成为唯一组合」：维护者 F5 与安装包（VSIX）验收。

**代码审查后续任务（2026-09-30，记录授权）**

维护者确认前轮审查已足够，要求把现有问题整理为后续任务；停止继续逐文件审查。RUNTIME-01／02 已由 WI-037 接受关闭；其余任务仍在停车场。技术 spike 不再续查，既有诊断缺陷仍保留并与生产任务分开安排；不改变 WI-036、PRD／ADR／gate 或 Git 提交授权。
**执行顺序建议与去重：** 先处理下表两项 P1 脱敏及已有 ARCH-05／P1，再处理正确性与交付校验，最后处理小型 UI 问题和诊断工具。已有 ARCH-02 补充／P2、ARCH-06／P2、ARCH-07／P2 沿用下方原任务，另有 WI-038 取证确认、已由 WI-039 修复的组包缺陷 PACKAGE-01／P1（见下方 ARCH-08 之后的条目，计入后共 16 项确认缺陷），不把 ARCH-01～04 的设计观察或 ARCH-08 未测量性能风险计入缺陷数量；进入修复前需明确单个切片与批准范围。
**证据入口：** [运行时与凭据](../discussions/2026-09-30-runtime-helpers-audit.zh.md)、[核心边界](../discussions/2026-09-30-core-boundaries-audit.zh.md)、[UI](../discussions/2026-09-30-ui-components-audit.zh.md)、[工具链](../discussions/2026-09-30-tooling-config-audit.zh.md)；详细反例与验证限制留在报告，不复制为实机验收结论。

| 后续任务 | 优先级／范围 | 修复目标与候选完成标准 |
|---|---|---|
| [x] RUNTIME-01 | P1，WI-037 已关闭 | 显示文本不再作为原始 delta 缓存；有界保留脱敏上下文，Bearer／私钥跨片段后续内容不泄露。自动化与 macOS F5／隔离安装合成 SSE 证据见[验收](2026-09-30-wi-037-macos-acceptance.zh.md)。 |
| [x] RUNTIME-02 | P1，WI-037 已关闭 | 整体遮盖含空白及转义引号的凭据值；有效 JSON 与非结构化文本分别回归。自动化与实机 thinking 引号值见同一验收记录。 |
| [x] CORE-01 | P2，WI-040 已关闭 | await 前预留容量或在原子准入点重检；并发预检查不突破 8 项上限，取消／错误释放槽位。写入点重检与自动化证据见[验收](2026-09-30-wi-040-macos-acceptance.zh.md)。 |
| [x] CORE-02 | P2，WI-041 已关闭 | 关联 inspect id、history page、preview offset；拒绝非终态不推进及结束标记矛盾，保留 list 对照；解析器反例与真实 worker 集成分别验证，不宣称已错误切换会话。证据见[验收](2026-09-30-wi-041-macos-acceptance.zh.md)。 |
| [x] UI-01 | P2，WI-042 已关闭 | 稳定模型身份与显示标签分离；同名及标签／canonical 身份碰撞仍唯一选中，不据当前证据认定运行时模型选错。证据见[验收](2026-09-30-wi-042-macos-acceptance.zh.md)。 |
| [x] UI-02 | P2，WI-043 已关闭 | Escape 尊重已消费事件，回归重叠菜单／模型弹层、输入法与焦点返回；组件探针不代替 macOS 宿主验证。证据见[验收](2026-09-30-wi-043-macos-acceptance.zh.md)。 |
| [x] TOOL-01 | P2，WI-044 已关闭 | 把实际 Vite 构建配置归入实现输入，覆盖新增／修改／删除／重命名；与 ACTIVE 混合暂存须拒绝，普通文档配对仍允许，不替代人工语义审查。证据见[验收](2026-09-30-wi-044-macos-acceptance.zh.md)。 |
| [x] UI-03 | P3，WI-045 已关闭 | 缺失路径正文与 tooltip 共用翻译入口，覆盖对应语言；不是文件访问或授权问题。证据见[验收](2026-09-30-wi-045-macos-acceptance.zh.md)。 |
| [x] RUNTIME-03 | P2，WI-046 已关闭 | 管理 child／pipe 异步错误与单次结算；ENOENT 返回失败结果，清理失败有界，不把隔离进程崩溃说成实际扩展宿主崩溃。证据见[验收](2026-09-30-wi-046-macos-acceptance.zh.md)。 |
| [x] RUNTIME-04 | P2，WI-046 已关闭 | 区分 RPC 成功、发出终止与观察退出；kill 被拒且无退出证据时，不报告有界退出成功，不替代生产所有权／恢复规则。证据见同一验收记录。 |
| [x] RUNTIME-05 | P2，WI-046 已关闭 | 严格要求 success 为 boolean，字符串 false 等畸形值不能产生成功证据；不假定正常 pi 会发这些回复。证据见同一验收记录。 |

- [x] **接口风险先核验（WI-051 已关闭）。** 生产 Composer 标志由 `Candidate` 派生；FileSnapshot 按 kind 配对校验器；未确认生产错误配对，未收紧类型。证据见[验收](2026-09-30-wi-051-macos-acceptance.zh.md)与[讨论](../discussions/2026-09-30-interface-risk-verification.zh.md)。
- [x] **TOOL-02／条件性 P3：TSX 规格发现（WI-050 已关闭）。** 应用规格只用 `.spec.ts`；已收集 `.spec.tsx` 使发现失败。证据见[验收](2026-09-30-wi-050-macos-acceptance.zh.md)。
- [x] **资源与期限风险先测量（WI-052 已关闭）。** 启动设置、诊断 stderr、artifact inflate 与 test／Git 目前不需要库内预算；不宣称卡顿或耗尽。证据见[验收](2026-09-30-wi-052-macos-acceptance.zh.md)与[讨论](../discussions/2026-09-30-resource-timeout-measurement.zh.md)。
**审查停止与覆盖缺口：** [进度清单](../discussions/code-audit-progress.json)保留未检查的 1 个中文文案与 10 个预览源码，不自动排队继续；HTML/CSS 与技术 spike 排除。此前部分阅读仍只是部分覆盖，包含文档结构校验末尾 14 行；有检查记录不等于完整源码／分支／集成验收。后续修复所需定向上下文核对与回归，不等于重启全面审查。
**本次整理检查：** 仅更新本入口与审查进度；文档结构／双语及本次路径空白检查见交接回复。未重跑 compile／lint／完整测试／F5／安装验收，未改应用代码、暂存或提交；旧报告的探针与测试结果仍是历史证据。

**架构质量待办（关键路径抽查，未批准实施）**

维护者要求记录以下短板，不代表批准重构或新增 WI；当前 WI-035／WI-036 的状态与范围不变。首轮为静态设计抽查；后续扩大审查的可复现问题及未测量风险见下方，均不构成全仓质量认证。

- [x] **ARCH-01：跨功能准入与状态转换的可理解性（WI-054 已关闭）。** 所有者与操作表见[讨论](../discussions/2026-09-30-arch-01-admission-owners.zh.md)；未合并 busy，未按文件长度拆分。[验收](2026-09-30-wi-054-macos-acceptance.zh.md)。
- [ ] **ARCH-02：默认配置应用流程封装。** 复用下方已有“已保存默认应用到活跃运行会话模型”停车场项，不重复开 WI。[当前调用方](../../src/extension/piChatViewProvider.ts)仍需掌握“刷新 RPC 目录 → 应用默认 → 无模型时重启并读取持久默认”的顺序及 SDK／RPC 差异。候选完成标准：该流程由一个明确所有者封装，成功、失败、过期结果与重启条件可经接口验证；现有用户可见规则保持不变。
- [x] **ARCH-03：运行时接口的能力组合（WI-055 已关闭）。** 生产 RPC 实现全部可选项；noop 仅 handoff；不拆接口。见[讨论](../discussions/2026-09-30-arch-03-runtime-capabilities.zh.md)与[验收](2026-09-30-wi-055-macos-acceptance.zh.md)。
- [x] **ARCH-04：内部模型与 Webview DTO 的耦合取舍（WI-056 已关闭）。** 共享值对象保留；`ModelSettingsContext` 已是仅宿主类型。见[讨论](../discussions/2026-09-30-arch-04-dto-coupling.zh.md)与[验收](2026-09-30-wi-056-macos-acceptance.zh.md)。

**扩大审查补充（维护者要求继续检查，未批准修复）：**

- [x] **ARCH-05／P1：共享 endpoint 文件丢失并发更新（WI-038 已接受关闭）。** 完成标准见[验收](2026-09-30-wi-038-macos-acceptance.zh.md)；[ADR 0007](../decisions/0007-endpoint-write-transaction.zh.md) Accepted。ARCH-06 输出预算已由 WI-047 关闭。
- [x] **ARCH-06／P2：endpoint 写入越过自身读取预算（WI-047 已关闭）。** 输出预算在提交前验证，超限保留原文件并报告 `too-large`；pretty-print 扩大同样约束。证据见[验收](2026-09-30-wi-047-macos-acceptance.zh.md)。
- [x] **ARCH-02 补充／P2：默认保存失败仍修改实时模型（WI-048 已关闭）。** 操作接口区分已提交、失败、未执行及过期；后续动作只基于明确提交结果。flush 失败保留旧投影且实时 apply 收不到新模型。证据见[验收](2026-09-30-wi-048-macos-acceptance.zh.md)。
- [x] **ARCH-07／P2：组包入口未强制完整产物验证（WI-049 已关闭）。** 交付入口缺 helper／CSS 时失败；CI 在 compile 后运行 `verify:webview` 与 `verify:package-files`。`verify-vsix` 仍为独立解包运行验证。证据见[验收](2026-09-30-wi-049-macos-acceptance.zh.md)。
- [x] **ARCH-08／性能风险（WI-053 已关闭）。** 产品上限 stringify 约 2.12 MiB／0.41 ms，十六条 64 KiB lex 约 32 ms；历史预览 600×1 MiB 块 0.39 ms 且不 join。未优化。证据见[验收](2026-09-30-wi-053-macos-acceptance.zh.md)与[讨论](../discussions/2026-09-30-arch-08-streaming-history-cost.zh.md)。

- [x] **PACKAGE-01／P1（WI-039 已接受关闭）：隔离安装版 VSIX 缺少已声明依赖 `@earendil-works/pi-ai`。** 根因、红／绿解包 import 与隔离安装版 `provider-loaded: true` 见[验收](2026-09-30-wi-039-macos-acceptance.zh.md)。把验证串接进 `package:vsix`／CI 的资产清单已由 WI-049 覆盖；`verify-vsix` 解包运行仍独立。

**扩大审查覆盖与验证：** 新增读取生产 Webview client／历史 client／设置入口、聊天组合／Markdown／交互输入、两侧桥接与解析、endpoint 持久化、session backend／worker／历史投影、恢复记录／退休清理／observer、写保护／修改审阅、审批 gate／受控环境、esbuild、组包／独立 VSIX 验证器和 CI。长文件仍有区段抽查；未逐文件穷尽全仓，未重启逐断言审查。上述探针无网络／付费调用、未访问真实 pi 配置；临时样本已清理，应用代码未修改。当前生产依赖边界测试实际运行 2 项，全部通过；未重跑完整 npm test、实机或性能测试。本轮 `npm run docs:verify` 结构／双语均为 0 错误；3 条提示分别为 ACTIVE 超过 180 行指导值及 ADR 0005 的两条 Draft 提示。`git diff --check -- ACTIVE.md` 通过。

**审查覆盖与限制：** 本轮读取了主架构／相关 ADR 与契约，并重点检查宿主协调器、模型／供应商设置、草稿提交、保存历史、编辑器工具、交互协调、RPC 忙闲、进程策略和所有权关键路径；部分长文件只读取相关区段。未完成所有源码、Webview 组件、构建／组包脚本及测试的逐文件／逐分支审查，未开展本轮实机或性能验证。前轮 895 项测试通过只是当次执行证据，不等于全部断言有效或全仓架构优秀；本轮深入判断未重跑行为测试。未来全面审查需另行明确范围，不据此重启已停止的逐断言审查。

**记录检查：** 本轮仅补充待办，不改应用代码或提交 Git；`npm run docs:verify` 通过（结构 0 错误、4 条既有 Draft ADR 提示；双语 0 错误）。全工作区 `git diff --check` 未通过：既有[遗留运行时讨论](../discussions/2026-09-29-drop-runtime-recovery-barrier.md)及其[中文版本](../discussions/2026-09-29-drop-runtime-recovery-barrier.zh.md)出现 EOF 多余空行，不属于本轮待办修改，未擅自清理。

**共享运行时取舍：** 不另建重复待办，沿用 WI-036 的每窗口恢复域／共享限制候选；需要产品决定及 ADR，而非仅凭设计评价改动。

**架构（已确认，未开工）**：把已保存默认应用到活跃运行会话模型的顺序抽取，用户可见规则冻结。维护者 2026-09-29 确认设计。词汇见 [CONTEXT](../../CONTEXT.zh.md)；讨论见 [2026-09-29](../discussions/2026-09-29-live-session-saved-default.zh.md)。WI-026 已关闭。不自动开 WI。

运行时进程接口重构已关闭为 WI-028；不自动开 WI。

额外扩展生态、编辑区聊天／Chat Participant、remote／multi-root支持、额外平台、无产品依据的delta优化、全局启动默认持久化、跳过审批、图片／PDF／表格／语法高亮、历史回滚、框架更换及发布不属于本次批准队列；不得据此自动新建或实施WI。对照 Claude Code 的侧栏质感见[讨论](../discussions/2026-09-28-claude-code-ui-comparison.zh.md)。

**已完成 WI 索引**

完整编号索引见 [归档](2026-09-29-closed-wi-index.zh.md)（Cursor 预览直接打开该文件）。表中早期 gate Open 措辞是相应验收日期的历史，不是当前状态；当前全部六项 gate Accepted，见 ADR0001／0004。

| WI | 结果 | 完成／验收 | 历史 |
|----|------|------------|------|
| WI-056 | 模型与 Webview 共享值对象保留；未复制 DTO（ARCH-04） | 2026-09-30 代理按本会话完成 ACTIVE 收尾并提交的要求接受；无 gate／ADR | [记录](2026-09-30-wi-056-macos-acceptance.zh.md) |
| WI-055 | 运行时可选项留在同一 lifecycle；不拆分（ARCH-03） | 2026-09-30 代理按本会话完成 ACTIVE 收尾并提交的要求接受；无 gate／ADR | [记录](2026-09-30-wi-055-macos-acceptance.zh.md) |
| WI-054 | 准入所有者已列表；busy 标志保持分离（ARCH-01） | 2026-09-30 代理按本会话完成 ACTIVE 收尾并提交的要求接受；无 gate／ADR | [记录](2026-09-30-wi-054-macos-acceptance.zh.md) |
| WI-053 | 流式发布与历史预览成本目前不值得优化（ARCH-08） | 2026-09-30 代理按本会话完成 ACTIVE 收尾并提交的要求接受；无 gate／ADR | [记录](2026-09-30-wi-053-macos-acceptance.zh.md) |
| WI-052 | 启动、诊断、artifact 与 test／Git 成本目前不需要库内预算 | 2026-09-30 代理按本会话完成 ACTIVE 收尾并提交的要求接受；无 gate／ADR | [记录](2026-09-30-wi-052-macos-acceptance.zh.md) |
| WI-051 | Composer 标志与 FileSnapshot 校验器未确认生产错误配对 | 2026-09-30 代理按本会话完成 ACTIVE 收尾并提交的要求接受；无 gate／ADR | [记录](2026-09-30-wi-051-macos-acceptance.zh.md) |
| WI-050 | 未收集的 `.spec.tsx` 使发现失败（TOOL-02） | 2026-09-30 代理按本会话完成 ACTIVE 收尾并提交的要求接受；无 gate／ADR | [记录](2026-09-30-wi-050-macos-acceptance.zh.md) |
| WI-049 | 组包入口缺必需 helper 或 CSS 时失败（ARCH-07） | 2026-09-30 代理按本会话完成 ACTIVE 收尾并提交的要求接受；无 gate／ADR | [记录](2026-09-30-wi-049-macos-acceptance.zh.md) |
| WI-048 | 默认保存失败不修改实时模型（ARCH-02 补充） | 2026-09-30 代理按本会话完成 ACTIVE 收尾并提交的要求接受；无 gate／ADR | [记录](2026-09-30-wi-048-macos-acceptance.zh.md) |
| WI-047 | endpoint 写入输出预算（ARCH-06） | 2026-09-30 代理按本会话完成 ACTIVE 收尾并提交的要求接受；无 gate／ADR | [记录](2026-09-30-wi-047-macos-acceptance.zh.md) |
| WI-046 | 诊断探针结算与成功证据（RUNTIME-03／04／05） | 2026-09-30 代理按本会话完成 ACTIVE 收尾并提交的要求接受；无 gate／ADR | [记录](2026-09-30-wi-046-macos-acceptance.zh.md) |
| WI-045 | 缺失审阅路径正文与 tooltip 共用翻译（UI-03） | 2026-09-30 代理按本会话完成 ACTIVE 收尾并提交的要求接受；无 gate／ADR | [记录](2026-09-30-wi-045-macos-acceptance.zh.md) |
| WI-044 | Vite 配置纳入提交检查实现输入（TOOL-01） | 2026-09-30 代理按本会话完成 ACTIVE 收尾并提交的要求接受；无 gate／ADR | [记录](2026-09-30-wi-044-macos-acceptance.zh.md) |
| WI-043 | 模型弹层 Escape 忽略已消费事件（UI-02） | 2026-09-30 代理按本会话完成 ACTIVE 收尾并提交的要求接受；无 gate／ADR | [记录](2026-09-30-wi-043-macos-acceptance.zh.md) |
| WI-042 | 模型选择器已应用 radio 使用稳定身份（UI-01） | 2026-09-30 代理按本会话完成 ACTIVE 收尾并提交的要求接受；无 gate／ADR | [记录](2026-09-30-wi-042-macos-acceptance.zh.md) |
| WI-041 | session-worker 请求关联与预览游标不变量（CORE-02） | 2026-09-30 代理按本会话完成 ACTIVE 收尾并提交的要求接受；无 gate／ADR | [记录](2026-09-30-wi-041-macos-acceptance.zh.md) |
| WI-040 | 并发预检查下八张审批卡准入（CORE-01）；写入点重检 | 2026-09-30 代理按本会话完成 ACTIVE 收尾并提交的要求接受；无 gate／ADR | [记录](2026-09-30-wi-040-macos-acceptance.zh.md) |
| WI-038 | 跨宿主 endpoint 写入互斥；ADR 0007 Accepted；macOS 开发／隔离安装双窗口争用 | 2026-09-30 代理按本会话完成 ACTIVE 收尾并提交的要求接受；ADR 0005／ARCH-06 仍范围外 | [记录](2026-09-30-wi-038-macos-acceptance.zh.md) |
| WI-039 | 交付 VSIX 运行时依赖闭包（PACKAGE-01）；解包 import 与隔离安装版供应商加载 | 2026-09-30 代理按本会话完成 ACTIVE 收尾并提交的要求接受；ARCH-07 已由 WI-049 关闭 | [记录](2026-09-30-wi-039-macos-acceptance.zh.md) |
| WI-037 | 有界 thinking 流式与完整引号凭据脱敏；实际 macOS F5／隔离安装合成 SSE | 2026-09-30 代理按本次明确的实机取证并完结委托接受；助手正文逐 delta 仍范围外 | [记录](2026-09-30-wi-037-macos-acceptance.zh.md) |
| WI-035 | 精确回执启动交接、活所有者安全与实际 macOS F5／隔离安装；ADR 0006 Accepted | 2026-09-30 代理按本次明确委托接受；不改共享域或会话内恢复 | [记录](2026-09-30-wi-035-macos-acceptance.zh.md) |
| WI-034 | 确定性组包、macOS F5／隔离安装与真实解包 RPC／gate；批准切片接受并关闭 | 2026-09-30 代理按维护者最终委托接受；不接受整份 PRD | [记录](2026-09-30-wi-034-macos-evaluation.zh.md) |
