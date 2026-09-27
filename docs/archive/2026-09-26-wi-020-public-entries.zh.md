# WI-020 公共入口与类型契约归档

[English](2026-09-26-wi-020-public-entries.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-26-wi-020-public-entries.md](2026-09-26-wi-020-public-entries.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-26

- 类型：历史记录
- 状态：Archived
- 归档原因：2026-09-26 维护者明确接受并关闭 WI-020，恢复 WI-019／UIP-01。
- 权威：仅已关闭技术切片的历史范围和证据；当前工作以 [ACTIVE](../../ACTIVE.md) 为准。

## 关闭结论

维护者已接受公共入口、模块类型契约及唯一 P2 修复。Standards／Spec 均 0 未解决项；9 月 26 日修复检查为 compile、lint、321/321（0 skipped）、verify:webview、无环依赖图、生产 Webview 隔离与独立入口产物一致性。文档验证 0 error／5 个既有提示、i18n 0 stale。该技术切片不要求新增真实宿主验收；浏览器视觉、真实 pi、F5／安装版仍未在该轮运行，不因此接受产品、ADR 或 gate。

7 个未提交修复源码／测试文件保留，未暂存或提交；HEAD 为 fbf6767066715d5b18bd3c85f2350fe86fff9a7b。现行模块规则归架构文档，后续工作归 ACTIVE；下方原提案及历史交接中的“待审阅／暂停”仅描述当时状态。

## 原批准提案（原中文记录保留）

### WI-020 原提案

| 字段 | 内容 |
|------|------|
| **ID** | WI-020 |
| **标题** | 跨模块公共入口重构 |
| **阶段** | Build 已授权；公共入口与追加的模块类型契约两片均完成本地自动检查，待维护者审阅；WI-019 暂停。 |
| **Gate ID** | 无新增 gate；既有 gate-webview-trust／gate-session-streaming／gate-project-trust 均保持 Open。 |
| **Decision** | none；仅调整源码模块导入入口，不改变跨层所有权或公开产品协议。 |
| **PRD 判定** | 纯技术：现有功能、交互、消息协议与打包行为保持不变，无新增用户可见需求。 |

### 目标与范围

维护者要求不止会话后端：有跨模块消费者的内部模块统一通过明确的 index.ts 入口导入，不再从其他模块直接指向实现文件。先盘点实际依赖图，定义模块为有外部消费者、承担独立职责的目录；模块内文件继续直接导入，不为每个文件和测试目录机械添加转发入口。入口只导出所需能力，类型用 type-only 导出；Webview 不得经入口获得 host／Node 实现。构建／脚本的独立打包入口（如 session worker、审批 gate）保持明确文件路径，文件内测试可以直测内层实现。WI-019 已批准的产品预览保持暂停，不在本项实现 UIP-01 或恢复后端工作。

### 方案与架构核对

模块入口只转发已存在的能力和类型；Provider、Webview 与适配层原有职责不变。构建配置继续指向独立打包文件，模块入口不参与改变其启动路径。

### 验收

- 识别每条应用源码跨模块导入并迁移到对应公共入口；检查生产构建入口、跨层依赖、无运行时导入环和类型／值导出的一致性。只为现有消费建立入口，不增加空薄包装或新功能。
- npm run compile、npm run lint、npm test、npm run verify:webview 与适用的文档验证；重点检查实际生产 Webview bundle 未混入特权宿主实现、session worker／approval gate 仍按原入口打包。记录实际结果；真实 F5／安装版不作为无行为改动的本次交付证据。

### 追加批准：模块类型契约（2026-09-23）

维护者要求参考只读上游 `../pi/packages/agent/src/types.ts`，将本仓库模块自有、由调用者使用的类型抽为模块内 `types.ts` 契约文件；仍通过各目录 `index.ts` 做外部导出。该请求作为 WI-020 的后续纯技术切片实施；宿主拥有的 Webview／runtime／session 契约继续以 `src/extension/contracts/` 为单一权威，不复制或改写上游类型／策略。实现类与类型文件之间只用 type-only 依赖；不为无自有类型的目录凑空文件，不调整构建入口、行为、协议、所有权和权限。验收为 compile／lint／全量测试／Webview 产物与依赖图复查，并记录尚未运行的真实宿主验证。

### 架构核对（本次限定切片）

| 维度 | 结论与证据／限制 |
|------|----------------|
| 1–2 职责与接口 | pass：12 个公共入口只对外转发既有值及模块自有 `types.ts` 的类型；跨层契约仍归宿主所有，未定义通用插件接口。 |
| 3、12 依赖／信任 | pass（静态）：跨模块与 type-only 结构检查、70 个生产源码的运行时依赖图无环；Webview 对宿主契约只作类型导入，独立打包入口不经公共索引。未复验真实宿主。 |
| 4–5 契约／所有权 | pass（既有自动范围）：只搬迁调用者契约与展示 Props 的类型定义，原有 DTO／runtime／session 契约保持单源；无状态持有、协议或 dispose 行为修改，320/320 自动回归。F5／安装版未验证。 |
| 6、16–17 范围／测试／构建 | pass（本地）：纯技术批准见本表，compile／lint／全量测试、Webview 资产检查通过；不表示产品体验接受或 gate 关闭。 |
| 7–11、13–15、18–19 | N/A（本次无新增领域身份、状态转移、并发、持久化、容量、协议版本或用户交互）；现有实证限制沿用 WI-019／历史记录。 |

### 范围外与批准边界

不修改 pi 集成策略、存储、协议、产品可见行为，不接受 ADR／关闭 gate。原提案阶段不暂存或提交；维护者本次另行明确授权本地 Git commit，不授权推送／合并。


## 历史交接与审查（原中文记录保留）

### WI-020 公共入口重构（2026-09-23）

**P2 限定修复（2026-09-26；原 P2 已解决，待维护者确认）：**

- **授权／基线：** 维护者仅授权原 P2 及必要回归，不暂存／提交、不关闭或切换 WI；WI-019／UIP-01 保持暂停。修复前 HEAD 为 `fbf6767066715d5b18bd3c85f2350fe86fff9a7b`；既有差异仅为下方两段用户所有记录（4 行新增），index 为空；原记录逐字保留，排除本轮修复审查。
- **最小方案与实现：** 按 codebase-design 核对现有 Module／Interface／Seam：`components/types.ts` 经父 `index.ts` type-only 导入；四个展示 Module 的分页常量仍由父 client 管理，由 App 通过现有 Props Interface 传入 `pageSize`，无反向值导入、新 Module、规格例外或职责／协议／行为变化。公共入口检查复用同一结果函数，整类豁免已移除。架构 1–3／5 保持职责、所有权及依赖方向，16–17 有本轮自动证据（implement now／none；限定自动范围 Verifiable）；其余无新增设计变更。
- **有界 TDD／实际检查：** 在维护者确认的“入口检查结果”Seam 新增一个正反例用例；旧豁免错误返回空结果，实跑 3 pass／1 fail，再作必要修复后 4/4 通过。既有公开展示行为 Seam 的 28 项相关挂载／client 回归在修复前后均通过，无新增内部实现快照。Windows Node 24.12.0 本轮 compile、lint、全量 **321/321（0 skipped）**、verify:webview、git diff --check 通过。
- **补充证据：** 70 个生产 TS／TSX、72 条运行时边无环，跨模块入口绕过、展示到父模块值依赖、Webview 特权导入均为 0。按生产 Vite 配置内存构建的模块清单无 host／adapter／Node／preview，且输出匹配磁盘产物；gate／session-worker 仍按原显式入口打包，与修复前 HEAD 同工具链产物逐字节一致。首次产物探针因 Git LF 与工作区 CRLF 的原始文本比较误报；仅修正证据脚本的文本换行比较，失败日志和说明保留，实际 bundle 字节比较未归一化。
- **文档／复审：** docs:verify 同一入口仅在进程内额外排除禁止读取的 `.local-env`，结构 0 error／5 个既有提示，i18n 0 error／0 stale；未修改校验配置。Standards／Spec 已按修复前基线→当前工作区完成独立并行复审，含本轮 ACTIVE 差异及未跟踪文件盘点（无新增未跟踪源码），排除既有用户修改；`078569c...fbf6767` 仅作背景。**Standards：0 项（硬性违规／启发式均 0）；Spec：0 项，原唯一 P2 已解决。** 两轴分别核查源码和本轮证据，未把日志说成审查者重跑；未合并或重排两轴结论。
- **限制／保留：** 未运行浏览器视觉、真实 pi、F5／安装版；自动检查不代替维护者接受。WI、验收、ADR、gate 状态不变。`dist/wi020-p2-fix-20260926/` 保留用户修改基线、红绿日志、图／产物证据与复审输入；未创建临时 worktree，确认不再需要其中唯一基线／证据后可清理。既有 `dist/wi020-review-20260926/` 原审查证据未改动，沿用原清理条件。

**下一步建议（2026-09-26，ask-matt 路由，尚未执行）：** 先用 `/code-review` 对照本 WI 范围审查 `078569c..fbf6767` 的 Standards／Spec，再由维护者确认 WI-020 收尾与恢复 WI-019；恢复后从已批准的 UIP-01 继续，不重启 Q1–Q16 访谈或追加通用重构。当前 WI、暂停、验收与 gate 状态不变。本次仅核对本地记录、Git 状态、预览入口和相关测试源码；320/320 等仍是 2026-09-23 的历史结果，未执行代码审查、产品实现、应用测试或提交。本轮文档校验通过：调用 docs:verify 同一入口，仅在进程内额外排除禁止读取的 `.local-env`，结构 0 error／5 个既有提示，i18n 0 error／0 stale；未修改校验配置。`git diff --check` 通过。

**限定代码审查（2026-09-26）：** 按维护者请求，仅审查 `078569c...fbf6767` 的 WI-020（`705baf2`、`fbf6767`）；上段未执行建议现已完成审查这一步，原有未提交记录保留。Standards：0 项；Spec：1 项 P2——`src/webview/components/types.ts:6` 绕过父模块入口，`src/extension/tests/architecture-boundaries.spec.ts:40–41` 对组件→父模块的整类豁免掩盖了入口迁移遗漏，公共接口一致性仍为 gap。最小类型依赖可改为从 `../index.js` type-only 导入；其余父级值依赖须按无运行时环的边界处理或由维护者明确确认限定例外，不能机械改走父 index。当前源码／测试未修复。本轮 Windows Node 24.12.0 重新通过 compile、lint、320/320 测试（0 skipped）、verify:webview；70 个生产 TS／TSX 的运行时依赖图无环，36 个已修改既有模块排除 import／re-export 后的运行时代码体未变。按生产配置内存构建检查 Webview 未混入 host／adapter／Node 实现；独立 gate／session-worker 与基点在同一工具链下的内存构建产物逐字节一致。docs:verify 同一入口在进程内额外排除禁止读取的 `.local-env`，结构 0 error／5 个既有提示、i18n 0 error／0 stale；未修改校验配置，git diff --check 通过。未运行浏览器视觉、F5／安装版或真实 pi；测试通过不消除上述 Spec 缺口、不代表产品或 gate 接受。仅追加本交接，未暂存／提交、关闭或切换 WI，WI-019 继续暂停。`dist/wi020-review-20260926/` 保留本轮日志、静态／产物证据和豁免清单供审查复核；其中首次产物探针的路径匹配误报与更正说明一并保留，不作为产品缺陷。无新增临时工作区，确认本轮证据无需保留后可清理该目录。

维护者要求暂停 WI-019 后，新增 adapter／runtime／sessions、host／bridge／contracts／draft／editor-tools／models／sessions、Webview／components 共 12 个显式目录入口，仅对已有跨模块消费者导出值和类型；更新生产导入，模块内部、单独打包入口与模块内测试仍可直指文件。架构文档双语同步，增加静态结构回归覆盖跨模块入口和 Webview 仅类型导入宿主契约。Windows Node 24.12.0 实跑 compile、lint、全量 319/319（0 skipped）、verify:webview 通过；AST 静态扫描生产 62 个 TypeScript 文件无运行时导入环；既有独立 worker／gate 的产物仍正常打包，Webview 产物体积未见本轮明显增量。git diff --check 通过。docs:verify 结构 0 error、5 warning（含 ACTIVE 篇幅与既有 Draft ADR），i18n 0 stale；仍因本轮未修改的本地技能 .agents/skills/setup-ts-deep-modules/SKILL.md 中失效示例链接失败，不把它说成通过。未做 F5／安装版、真实 pi 或维护者产品验收，不关闭任何 gate／ADR；没有暂存、提交或清理证据目录。WI-019 原批准方案保留在停车场，恢复后从 UIP-01 继续。

**追加类型契约切片：** 参考只读的 `../pi/packages/agent/src/types.ts` 的类型集中、接口语义注释及实现分离方式，为 runtime、session adapter、draft、editor-tools、models、host sessions、Webview、presentation components 的实际调用者创建 8 个模块内 `types.ts`。类型由原实现迁往契约，模块 `index.ts` 以 type-only 方式导出；原文件需要的类型转发保留兼容，既有跨层契约继续保留 `src/extension/contracts/` 为单一权威。双语架构文档同步。Windows Node 24.12.0 重新实跑 compile／lint／320/320（0 skipped）、verify:webview；静态结构新测覆盖类型文件没有运行时导入／导出、入口导出；70 个生产 TS／TSX 的运行时导入图无环。docs:verify 结构 0 error／5 warning、翻译 0 stale，仍因本轮未修改的本地技能 `setup-ts-deep-modules` 示例相对链接失效而整体失败。未运行 F5／安装版／真实 pi，未修改相邻仓库，未创建提交；待维护者审阅。

**文档校验修复（2026-09-23）：** 维护者明确要求解决先前 `docs:verify` 的失效链接。已修正本机 `.agents/skills/setup-ts-deep-modules/SKILL.md` 的示例：说明相对链接应由目标仓库的 `AGENTS.md`／`CLAUDE.md` 解析，技能文档本身不再包含指向不存在目录的 Markdown 链接。重新实跑 `npm run docs:verify`：结构 0 error／5 warning（ACTIVE 篇幅及现有 Draft ADR），i18n 0 error／0 stale，命令退出 0；`git diff --check` 退出 0。本次只改文档，未重跑无关代码检查；文件属于 `.gitignore` 忽略的个人本地技能，不会随仓库 Git 变更传播；保留以维持本机校验，除非维护者自行移除或更新该技能，不清理／暂存／提交。

**提交检查点（2026-09-23）：** 维护者明确要求提交 Git commit。代码、类型契约、静态测试与双语架构说明作为 `705baf2` 独立提交；本 `ACTIVE.md` 仅记录工作项和检查点，单独提交。提交前重新实跑 Windows compile／lint、320/320 测试、verify:webview、docs:verify（0 error／5 个既有提示，i18n 0 stale）及 commit:check；无 F5／安装版或维护者体验验收，不关闭 WI／ADR／gate。`.agents/skills/setup-ts-deep-modules/SKILL.md` 是被忽略的个人本地文件，修复只保留在本机，不强制纳入仓库；新环境的文档检查需自行保证该本地技能链接有效或不存在。未推送／合并。


## 证据保留

`dist/wi020-p2-fix-20260926/` 和 `dist/wi020-review-20260926/` 保留原始基线、红绿／构建日志、依赖图、产物证据及双轴报告；维护者不再需要唯一证据后可清理，不按目录名自动删除。关闭／归档的本轮文档检查单独记入 ACTIVE，不复用上述历史通过记录。
