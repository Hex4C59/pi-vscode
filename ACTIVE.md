# pi-vscode — 当前工作（跨会话入口）

本文件是唯一当前工作入口，不是需求／架构权威或追加日志。规则见 [AGENTS](AGENTS.zh.md)、[内核](AGENTS.kernel.zh.md)与[协作指南](docs/guides/agent-collaboration.zh.md)。已关闭编号查找见 [归档索引](docs/archive/2026-09-29-closed-wi-index.zh.md)。

## Agent 会话契约（摘要）

| 步骤 | Agent |
|---|---|
| 开场 | 必要阅读、Git基线、当前WI／批准／Gate／PRD与验收核对；不把历史提案当当前授权。 |
| 提案 | Prepare保留范围与PRD判定；新增Build范围须批准；WIP最多1。 |
| 建造 | 按批准实现并实际验证；模拟／runtime／F5／安装分别取证，不虚报接受。 |
| 收尾 | 对照批准、记录代理或维护者的实际验收身份；正常ADR／gate、双语归档、检查与资源清理。 |

## 当前无活动 WI（WIP=0）

当前无进行中的 WI。WI-037 已于 2026-09-30 由代理按维护者明确的实机取证并完结要求接受并关闭，见[验收归档](docs/archive/2026-09-30-wi-037-macos-acceptance.zh.md)。停车场 WI-036 及其他审查后续任务仍待维护者另开 Prepare，不自动转 Build。本次维护者明确授权在核对验收后提交 WI-037，其他未提交工作保留；无推送授权。

### 已关闭基线：WI-037

WI-037 已于 2026-09-30 接受并关闭。范围是 REQ-004 内 RUNTIME-01／02：thinking 有界原始上下文与完整引号凭据值展示脱敏。自动化 927 项（新增 32 项）在 Build 时通过；本次关闭另取 macOS F5 与隔离安装版合成 SSE 逐帧证据。助手正文逐 delta、WI-036、gate／ADR 与整份 Draft PRD 均未改。未提交或推送。

## 验收授权与平台决定

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
| WI-037 | RUNTIME-01／02 thinking 有界上下文与完整引号凭据脱敏 + macOS F5／隔离安装 | macOS | 代理依据本次明确的实机取证并完结要求接受 |

授权边界（与 2026-09-27 委托先例一致，且不继承其范围）：

- **身份（2026-09-30 后续授权）**：维护者明确要求「你帮我审查完就不要我来独立接受了」，将 WI-032／WI-033／WI-034 的最终验收判断与关闭委托给代理；记录为**代理受托接受**，不再要求维护者逐项独立接受，也不伪称维护者亲自测试。原先仅评估、等待独立接受的条件被本决定替代。
- **逐 WI 生效**：上表逐项授权，不构成可用于其他 WI 的长期通行证；新增 WI 须另行授权。
- **不涉及**：整份 Draft PRD 的提升、gate 状态、公开发布、提交 Git（提交仍须维护者明确要求）。
- **PRD 同步**：另一轮已把 Windows → macOS 平台决定双语同步到 PRD；本轮按“全部当前改动”提交授权一并保存，并同步 WI-032／033 的限定接受状态，PRD 仍为 Draft。

## 当前焦点与未决项

- [x] WI-037 代理受托接受并关闭：thinking 有界上下文与完整引号凭据脱敏；macOS F5／隔离安装合成 SSE 逐帧通过。[记录](docs/archive/2026-09-30-wi-037-macos-acceptance.zh.md)。助手正文逐 delta 与 WI-036 未改。

- [x] WI-034 代理受托接受并关闭：组包、解包真实 RPC／gate、macOS F5／隔离安装激活渲染通过。[记录](docs/archive/2026-09-30-wi-034-macos-evaluation.zh.md)；不等于完整聊天或 REQ-009 验收。
- [x] [`src/extension.ts`](src/extension.ts) 入口整理（命名常量、拆开嵌套构造、导入分组）：仅可读性改动，注册顺序、参数与行为不变。维护者 2026-09-30 在会话中批准；属已授权范围内的小改，按协作指南不单独开 WI，当时 WI-034 为 WIP=1，现已按最终委托关闭。实跑 compile／lint／`npm test`（865 通过、0 失败／跳过）、`git diff --check` 与 [`architecture-boundaries.spec.ts`](src/extension/tests/architecture-boundaries.spec.ts)（5／5）通过；未提交 Git；本轮 macOS 激活渲染证据见 WI-034；Windows 范围外。
- [x] WI-033 代理受托接受并关闭：真实 pi 字节回放与既有协议矩阵通过；截断 JSON 保持忽略，原生坏帧路径未验证。[记录](docs/archive/2026-09-30-wi-033-macos-evaluation.zh.md)；无需维护者独立接受。
- [x] 依维护者 2026-09-30 要求停止逐文件／逐断言审查，不再排队继续；测试全绿不等于所有断言有效。
- [测试审查与修复记录](docs/discussions/2026-09-29-test-relevance-audit.zh.md)：WI-034 之前 93 份文件有文件级结论，没有整文件删除依据；新增组包测试使收集文件成为 94 份，其组包反例已定向核对，未纳入原 93 份清单。已确认的问题已修复；原接受状态不变。
- [x] 旧代际 Webview 用例现先确认迟到的 `workspaceState` 是有效报文，再验证它不能恢复消息、thinking 或审批；此前无效夹具可使隔离断言假通过。仅测试变更，compile／lint／856 项测试通过；文档检查见本轮记录。
- [x] 继续对照工作区 UI、设置页视觉测试、预览恢复及宿主设置面板：三种阻止状态现分别核对标题和说明；设置页核对分类、选中页、提供商标题及精确刷新意图。模拟预览与宿主设置隔离未确认新问题。仅测试变更，compile／lint／856 项测试通过。
- [x] 设置页代际用例现使用不同的第二代模型目录，逐帧核对旧代／异视图报文不能覆盖它；此前相同目录可能使第二代未被接纳仍通过。仅测试变更，compile／lint／856 项测试通过。
- [x] 继续核对欢迎标记、任务状态、嵌套焦点与扩展交互表单：任务状态现验证原位更新时的每一步文字，欢迎动画核对金色入场阶段；后两份未确认新问题。仅测试变更，compile／lint／856 项测试通过。
- [x] 架构／打包测试复核：模块入口扫描原先漏掉静态 `import()`，反例先红；现连同 `require()` 一起核对跨模块入口及选定文件的禁用能力引用。宿主、Webview 依赖图及 VSIX 资源测试仍覆盖当前构建边界。仅测试变更，compile／lint／856 项测试通过。
- [x] 测试有效性核对：93／93 份已收集测试源码完成相关性及断言审阅，修复已确认问题；无整文件删除依据，不宣称每条断言都不可替代。详情见审查记录。
- [x] WI-032 代理受托接受并关闭：六入口追踪与定向 139 项测试通过，macOS 宿主 smoke 已取证；六入口原生敏感交互未重放。[记录](docs/archive/2026-09-30-wi-032-macos-evaluation.zh.md)。
- [x] WI-031 维护者技术接受。F5／安装 VSIX 不在本切片内。

- [x] WI-030 维护者完成剩余设置页检查。真实浏览器登录、真实端点调用和新的安装包不在本次关闭内。ADR 0005 仍为 Draft。
- [x] WI-029 维护者技术接受；真实 pi／F5／安装 VSIX 不在本次证据内。
- [x] WI-028 维护者技术接受；Linux 隔离 spike／F5／安装 VSIX 不在本次证据内。
- [x] WI-027 维护者接受展示切片；F5／安装 VSIX 不在本切片内。
- [x] WI-026、WI-023、WI-024 的维护者 F5 视觉接受。
- [x] 维护者确认已安装的 VSIX 满意。该接受不追溯为 WI-026／023／024 的原证据。
- [x] 「生产聊天成为唯一组合」：维护者 F5 与安装包（VSIX）验收。

## 最近交接

### 2026-09-30 — WI-037 受托接受并关闭

维护者要求完成 macOS F5／隔离安装实机取证并完结 WI-037。隔离 HOME 曾弹出 Keychain Not Found／Code Key，已放弃该路径（只应 Cancel，未点 Reset To Defaults）。接受运行保留登录 HOME，使用规范 `/private/tmp` 工作区。F5 与隔离安装版均对合成 loopback SSE 逐帧看到 `use Bearer [redacted]` 与完整 `password="[redacted]"`，正文 `synthetic-complete`，无 `SYNTHETIC_` 泄露。VSIX SHA-256 `a317981a706d1754208f099e4a5e5139fbb502dd6ade10ff4a78b068b960056f`；自有进程已停。记录见[验收归档](docs/archive/2026-09-30-wi-037-macos-acceptance.zh.md)。助手正文逐 delta、WI-036、gate／ADR、整份 PRD 未改；未提交或推送。本次关闭跑 `docs:verify`／`docs:health` 与相关路径 `git diff --check`，未重跑 compile／lint／npm test。

本次提交核对：验收报告、截图、VSIX 哈希及 7 个安装版产物已复核；仅含 WI-037 的独立提交快照 compile／lint／完整 899 项测试通过（HEAD 基线 867 + 本 WI 新增 32，排除尚未提交的 WI-035 用例），不替换 Build 混合工作树 927 项的历史结果。本 WI 实现／双语验收已提交为 `105b7eb`；入口记录独立提交，其他关注点保留；不推送。

### 2026-09-30 — WI-034 VSIX 组包能力

Decision：none。新增 `scripts/packaging/package-vsix.mjs` 与同目录 `package-vsix.spec.mjs`，并加入 `npm run package:vsix`。组包范围是声明的 `files` 产物加 `node_modules/@earendil-works/pi-coding-agent` 子树（该子树自带嵌套 `node_modules`）；归档用系统 `zip -X`，不再自写 ZIP writer。手写 `extension.vsixmanifest` 与改写后的 `extension/package.json`（`main` 指 `./dist/extension.js`，版本取锁定 pi 版本 0.86.1）。显式排除 `.git`、`.local-env`、`skills-lock.json` 与 `*.vsix`；编译产物缺失时拒绝组包。

实测：`npm run package:vsix` 产出 14,100 源条目／约 150 MB／20 秒；`verify-vsix.mjs` PASS（15,535 条目，解包后真实 RPC 就绪与 gate 握手，pi 0.86.1）；**隔离 `--extensions-dir` 真实安装成功**，安装目录含全部必需产物与 79 个嵌套依赖目录，且用户既有 profile 未被触碰。确定性：staging 目录 mtime 与两个生成文件时间戳归一到固定值后，同一输入树上多次独立构建 SHA-256 一致。这**只对固定输入树成立**，不是某个恒定哈希：`dist/` 一旦重编译（例如并发改动 `src/` 后重新构建），产物哈希会随之改变，不要把某次哈希当作固定证据。

过程中由测试抓出并修复两个真实缺陷：`**` 展开要求至少一层目录，导致 `dist/` 顶层四个必需产物被漏掉；glob 转义把 `*` 一并转义，使 `dist/*.mjs` 永不匹配。另有一次越界：用 `npm install @vscode/vsce` 探测时 npm 向上解析到仓库根并装入 96 个包，已 `npm prune` 完全清除且 `package.json`／锁文件未变。

检查：`npm run compile`、`npm run lint`、`npm test`（**867 通过、0 失败／跳过**）、`npm run docs:verify`（0 错误，4 条既有 Draft ADR 提示）、`docs:i18n:check`（0 错误 0 警告）、`git diff --check` 均通过。未提交 Git。**本机隔离安装不等于 macOS 宿主验收**（F5 与安装版实机证据见下方验收授权范围）；Windows 实机已由维护者 2026-09-30 移出验收范围，不再计为缺口。已知限制：组包依赖 `zip` 命令，Windows 默认 shell 无此命令，会在那里明确报错而非写出半成品，已在 README 双语记录。

**同日顺序代理受托接受（WI-032／033／034，历史）：**

依授权顺序完成 WI-034 实机 F5／隔离安装、WI-033 真实 pi 原始字节回放、WI-032 六入口复核，各项先落证据再继续。三个双语接受记录见当前焦点；维护者已授权代理作最终判断，不再要求独立接受。compile／lint／完整 867 项测试及六入口定向 139 项测试通过；安装版 7 个生产产物与当前构建一致。截断 JSON 保留忽略规则，原生坏帧路径与六入口原生敏感交互未验证；初次仅评估；本轮最终授权后由代理接受并关闭三个限定切片，不伪称维护者测试、不改 PRD／gate／ADR、不提交。docs:verify／docs:health 零错误，仅四条既有 Draft ADR 提示；`git diff --check` 通过；两个自有 GUI job 均退出 0，进程查询确认无本轮自有 GUI。一次性 profile 与包／截图留存；VS Code 应用级 shared storage 不随 user-data 隔离，详见 WI-034 记录。

历史提交授权（已消费，仅指 WI-032／033／034）：维护者要求 Git commit，并明确选择“全部当前改动”。按关注点分别提交实现／测试维护／组包／Draft ADR／PRD 状态／接受记录，ACTIVE 单独提交，不推送。提交前重跑完整测试与 lint；文档结构／健康、暂存隔离与差异检查通过后提交。

旧 WI-033 实现与逐轮审查交接已原样保留为[历史](docs/archive/2026-09-30-wi-033-audit-handoffs.md)；审查停止决定与当前关闭状态仍在本页，不因归档重启审查。

## 停车场

**遗留运行时（已确认，未开工）**：侧栏不再显示恢复黄条，也不再要求结束／恢复。上次的自有 pi 若还在，宿主启动时先结束它并退休恢复记录，再进入空对话或无文件夹页。维护者 2026-09-29 确认。Draft [ADR 0006](docs/decisions/0006-owned-runtime-handoff.zh.md) 尚未取代 ADR 0002。不自动开 WI。

**架构（已确认，未开工）**：把已保存默认应用到活跃运行会话模型的顺序抽取，用户可见规则冻结。维护者 2026-09-29 确认设计。词汇见 [CONTEXT](CONTEXT.zh.md)；讨论见 [2026-09-29](docs/discussions/2026-09-29-live-session-saved-default.zh.md)。WI-026 已关闭。不自动开 WI。

运行时进程接口重构已关闭为 WI-028；不自动开 WI。

额外扩展生态、编辑区聊天／Chat Participant、remote／multi-root支持、额外平台、无产品依据的delta优化、全局启动默认持久化、跳过审批、图片／PDF／表格／语法高亮、历史回滚、框架更换及发布不属于本次批准队列；不得据此自动新建或实施WI。对照 Claude Code 的侧栏质感见[讨论](docs/discussions/2026-09-28-claude-code-ui-comparison.zh.md)。

## 已完成 WI 索引

完整编号索引见 [归档](docs/archive/2026-09-29-closed-wi-index.zh.md)（Cursor 预览直接打开该文件）。表中早期 gate Open 措辞是相应验收日期的历史，不是当前状态；当前全部六项 gate Accepted，见 ADR0001／0004。

| WI | 结果 | 完成／验收 | 历史 |
|----|------|------------|------|
| WI-037 | 有界 thinking 流式与完整引号凭据脱敏；实际 macOS F5／隔离安装合成 SSE | 2026-09-30 代理按本次明确的实机取证并完结委托接受；助手正文逐 delta 仍范围外 | [记录](docs/archive/2026-09-30-wi-037-macos-acceptance.zh.md) |
| WI-034 | 确定性组包、macOS F5／隔离安装与真实解包 RPC／gate；批准切片接受并关闭 | 2026-09-30 代理按维护者最终委托接受；不接受整份 PRD | [记录](docs/archive/2026-09-30-wi-034-macos-evaluation.zh.md) |
