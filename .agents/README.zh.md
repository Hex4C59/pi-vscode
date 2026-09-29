# `.agents` — 工程 Skills 说明

[English](README.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[README.md](README.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-29
- Type: Guide
- Status: Accepted
- Created: 2026-09-28
- Authority: 面向人的本仓库 `.agents/skills/` 目录索引；不能替代各 skill 自己的 `SKILL.md`

本目录存放开发 **pi VS Code** 时使用的 **Agent Skills**。每个 skill 是 `.agents/skills/<name>/` 下的目录，内含 agent 选中后会加载的 `SKILL.md`。

**行为以各 skill 的 `SKILL.md` 为准。** 本 README 是**给人看的索引**：做什么、何时用、怎么用。

产品规则、WIP、gate 仍以 [`AGENTS.md`](../AGENTS.md)／[`ACTIVE.md`](../ACTIVE.md) 为准；skill 不能替代它们。

## 怎么调用

| 类型 | 用法 |
|------|------|
| **斜杠／显式** | 输入 `/skill-name`（或宿主里等价的「运行 skill」）。标了 `disable-model-invocation: true` 的 skill 必须显式调用；你想固定某条流程时也显式调用。 |
| **自动建议** | 未禁止自动调用的 skill，可能在你的表述匹配其 `description` 时被选用。在意用哪一个时，直接点名。 |
| **路由** | 不知道用哪个 → `/ask-matt`。 |

调用后务必以该 skill 的 `SKILL.md` 为准；本目录只作导读。

## 主流程（想法 → 交付）

多数功能工作可按 `/ask-matt` 推荐路径：

1. **`/grill-with-docs`** — 把想法问清楚；在工作区里留下 `CONTEXT.md`／ADR。
2. 可选：**`/prototype`**（配合 **`/handoff`**）——对话定不下、需要可跑答案时。
3. 跨会话大构建 → **`/to-spec`** → **`/to-tickets`**，再按票 **`/implement`**（建议换新上下文）。小改动 → 同一会话直接 **`/implement`**（或 **`/tdd`**）。
4. 需要时用 **`/code-review`** 做标准轴＋规格轴审查，再提交。

grilling → spec → tickets 尽量留在同一上下文；implement 各票宜新开会话。

## 代码库健康（结构）

问题若是 **模块深度、缝、依赖方向**，而不是新功能规格，可走这条路径：

1. **`/improve-codebase-architecture`** — 扫 `src/`，找浅模块与跨缝泄漏；在 **系统临时目录** 写自包含 HTML 报告（不进仓库）；你选中一条候选。
2. **`/grilling`**（若结论要进 `CONTEXT.md`／ADR 则用 **`/grill-with-docs`**）— 在改代码前定约束、缝后职责、测试面。
3. **`/implement`** 或小范围直接改 — 本仓库需要时，须先有维护者在 [`ACTIVE.md`](../ACTIVE.md) 的 **Build** 授权（例如口头「可以实现」）。

步骤 1–2 的用语：**`/codebase-design`**（module、interface、depth、seam、adapter、leverage、locality）。本仓库分层与公共 `index.ts` 入口见 [`docs/architecture/vscode-extension-architecture.zh.md`](../docs/architecture/vscode-extension-architecture.zh.md)；公共入口自动化检查在 `src/extension/tests/architecture-boundaries.spec.ts`。

`/diagnosing-bugs` 若发现根因是缺缝而非一行修补，可转到这里。

## 目录

### 路由与会话卫生

#### `ask-matt`

- **做什么：** 本仓库 skill 路由器；说明主流程、入口与独立 skill。
- **何时用：** 不知道该用哪个 skill／顺序。
- **怎么用：** `/ask-matt`（仅显式）。

#### `handoff`

- **做什么：** 把当前对话压成交接文档，给另一个 agent／会话接续。
- **何时用：** 上下文将满、换人／换会话，或原型在别的目录需要带回结论。
- **怎么用：** `/handoff`（仅显式）。

#### `wait-what`

- **做什么：** 停住，把没听懂的上一条重新讲清楚。
- **何时用：** 鸡同鸭讲、「刚才那段没懂」。
- **怎么用：** `/wait-what`（仅显式）。

#### `retro`

- **做什么：** 对一场 coding 会话做复盘。
- **何时用：** 有意义的会话结束；想改进协作方式。
- **怎么用：** `/retro`（仅显式）。

### 规格 → 票 → 实现

#### `grill-with-docs`

- **做什么：** 硬追问，并边问边写文档（ADR、术语表）。
- **何时用：** 在仓库里工作，既要压设计又要留纸面痕迹。
- **怎么用：** `/grill-with-docs`（仅显式）。底层用 `grilling`。

#### `grill-me`

- **做什么：** 同样强度的追问，不强制产文档。
- **何时用：** 还没有工作区／还不想写 ADR，但仍要压设计。
- **怎么用：** `/grill-me`（仅显式）。

#### `grilling`

- **做什么：** 共用追问原语：设计树、轮次 frontier、带推荐答案。
- **何时用：** 用户要「grill」计划／决策，或其它 grill skill 调用它。
- **怎么用：** 通常经 `/grill-me`／`/grill-with-docs`；也可能匹配 grill 用语自动进入。

#### `to-spec`

- **做什么：** 把**已有**对话收成规格并发布（不再面试）。
- **何时用：** grill（或等价共识）之后，要冻结给 agent 用的规格。
- **怎么用：** `/to-spec`（仅显式）。跟踪器未配置时先跑 `/setup-matt-pocock-skills`。

#### `to-tickets`

- **做什么：** 把计划／规格拆成带阻塞边的 tracer-bullet 票。
- **何时用：** 已有规格（或对话已够），要把工作拆成会话级可执行块。
- **怎么用：** `/to-tickets`（仅显式）。

#### `to-questionnaire`

- **做什么：** 把一时答不完的决策做成问卷给人填。
- **何时用：** 聊天里定不了全部决策，需要异步人工输入。
- **怎么用：** `/to-questionnaire`（仅显式）。

#### `implement`

- **做什么：** 按规格或票实现（通常内驱 TDD 与审查）。
- **何时用：** 已有 agent-ready 的票／规格，可以改代码。
- **怎么用：** `/implement`（仅显式）。**仍须遵守本仓库 `ACTIVE.md` 的批准规则。**

#### `implement-spec`

- **做什么：** 按规格实现代码（偏规格、不必走完整票务）。
- **何时用：** 有明确规格，想直接实现。
- **怎么用：** `/implement-spec`（仅显式）。

#### `tdd`

- **做什么：** 测试驱动（红 → 绿 → 重构）。
- **何时用：** 要先写测试再改行为；提「red-green-refactor」；要集成测试。
- **怎么用：** 直接说 TDD／点名 `tdd`；常嵌在 `/implement` 里。

#### `prototype`

- **做什么：** 扔弃式原型，回答设计问题（状态／UI 手感）。
- **何时用：** 纯对话定不下，需要可跑的东西。
- **怎么用：** 自动或点名；原型在别的目录时配合 `/handoff`。

#### `triage`

- **做什么：** 把外来 issue／PR 经分流角色收成 agent-ready brief。
- **何时用：** **别人**报来的 bug／需求。**不要** triage `/to-tickets` 已经产出的票。
- **怎么用：** `/triage`（仅显式）。

#### `wayfinder`

- **做什么：** 把超过单会话的大工作画成决策票地图，一张张解。
- **何时用：** 巨型、路径不清的倡议。
- **怎么用：** `/wayfinder`（仅显式）。

#### `loop-me`

- **做什么：** 围着你要建的工作流规格反复追问。
- **何时用：** 定的是可重复工作流，不是单个功能切片。
- **怎么用：** `/loop-me`（仅显式）。

### 设计与架构

#### `pi-sidebar-ui`

- **做什么：** 安静、有工具感的侧栏视觉工艺：空白会话、灰白单色 π、封闭间距／字号、VS Code 表面。
- **何时用：** 改 webview CSS／TSX、空状态、作曲区、会话栏，或视觉打磨。
- **怎么用：** 匹配这些文件或用语时自动，或显式点名。不授权 Build。

#### `codebase-design`

- **做什么：** 深模块、接缝、可测性、AI 可导航设计的共同用语。
- **何时用：** 设计／加深模块接口；其它 skill 需要这套词汇。
- **怎么用：** 表述匹配时自动，或显式点名。

#### `improve-codebase-architecture`

- **做什么：** 扫描 **加深机会**（浅模块、缝泄漏、难测接口）；在 OS 临时目录生成自包含 HTML 报告；对你选中的候选再 **grill**。报告阶段不写最终接口方案。
- **何时用：** 定期结构巡检、重构切片前，或 `/diagnosing-bugs` 判定根因在结构。
- **怎么用：** `/improve-codebase-architecture`（仅显式，`disable-model-invocation`）。用语来自 **`/codebase-design`**；选中候选后可接 **`/grilling`**、**`/domain-modeling`**。

#### `domain-modeling`

- **做什么：** 打磨领域语言；写／改 CONTEXT.md、ADR。
- **何时用：** 术语争论、领域文档或 ADR 工作。
- **怎么用：** 自动或点名。

#### `diagnosing-bugs`

- **做什么：** 难 bug／性能诊断纪律：先建能变红的 tight loop，再猜原因。
- **何时用：** 「诊断」「debug」、坏了／抛错／失败／变慢。
- **怎么用：** 报 bug 时自动，或显式点名。

### 审查、文档、调研

#### `code-review`

- **做什么：** 自某固定点起的双轴审查：Standards 与 Spec（并行子代理）。
- **何时用：** 审分支／PR／WIP，或「review since X」。
- **怎么用：** 自动或点名；常在 `/implement` 之后。

#### `documentation-health`

- **做什么：** 基于证据、只读的文档健康检查。
- **何时用：** **明确**要求查陈旧文档或做文档维护审查时。
- **怎么用：** 意图清晰时可自动；范围审查时建议点名。

#### `writing-for-agents`

- **做什么：** 如何写 skill 与 agent 文档（`AGENTS.md`、指针、信息层次）。
- **何时用：** 新建／改 skill 或 agent 入口文档。
- **怎么用：** 自动或点名。同目录另有 `SKILL-MECHANICS.md`。

#### `research`

- **做什么：** 对高信任一手资料调研，把结论写成仓库内 Markdown。
- **何时用：** 查文档／API、委派阅读、背景调研。
- **怎么用：** 自动或点名。

#### `pr`

- **做什么：** 写 PR 正文。
- **何时用：** 开 PR 或起草描述。
- **怎么用：** 要 PR body 时自动或点名。

### Git 与仓库工具

#### `resolving-merge-conflicts`

- **做什么：** 解决进行中的 merge／rebase 冲突。
- **何时用：** 卡在冲突上。
- **怎么用：** 自动或点名。

#### `git-guardrails-claude-code`

- **做什么：** 给 Claude Code 加 hook，拦截危险 git 命令。
- **何时用：** 要在 Claude Code 里挡强推、硬重置等。
- **怎么用：** 配置这类防护时自动或点名。

#### `setup-pre-commit`

- **做什么：** Husky + lint-staged（Prettier）+ 提交时类型检查／测试。
- **何时用：** 本仓库加或修 pre-commit。
- **怎么用：** 自动或点名。

#### `setup-matt-pocock-skills`

- **做什么：** 一次性配置：issue 跟踪、triage 标签、领域文档布局。
- **何时用：** 首次用依赖跟踪器的 skill（`to-spec`、`to-tickets`、`triage` 等）之前。
- **怎么用：** `/setup-matt-pocock-skills`（仅显式）。

#### `setup-ts-deep-modules`

- **做什么：** 接入 dependency-cruiser，强制深模块（实现只能经入口暴露）。
- **何时用：** 要在 TypeScript 仓库落实深模块边界。
- **怎么用：** `/setup-ts-deep-modules`（仅显式）。

#### `migrate-to-shoehorn`

- **做什么：** 测试里的 `as` 断言迁到 `@total-typescript/shoehorn`。
- **何时用：** shoehorn 迁移或部分测试数据不想用危险断言。
- **怎么用：** 自动或点名。

#### `scaffold-exercises`

- **做什么：** 搭课程练习目录（章节／题／解／讲解）且能过 lint。
- **何时用：** 做课程内容，不是产品功能。
- **怎么用：** 自动或点名。

#### `wizard`

- **做什么：** 生成交互式 bash 向导，只覆盖**必须人做**的步骤。
- **何时用：** 控制台、密钥、一次性切换——agent 点不了的那部分。
- **怎么用：** 自动或点名。agent 自己能做的步骤不要用它。

### 教学与长文写作

#### `teach`

- **做什么：** 在本工作区语境里教一个 skill／概念。
- **何时用：** 学习模式，不是交付产品代码。
- **怎么用：** `/teach`（仅显式）。

#### `writing-fragments`

- **做什么：** 探索：挖写作碎片，先不结构。
- **何时用：** 文章／随笔早期。
- **怎么用：** `/writing-fragments`（仅显式）。

#### `writing-beats`

- **做什么：** 利用：把素材收成 beats 旅程；用词先落地再引用。
- **何时用：** 非虚构中期结构。
- **怎么用：** `/writing-beats`（仅显式）。

#### `writing-shape`

- **做什么：** 利用：逐段收成文章。
- **何时用：** 成文收口。
- **怎么用：** `/writing-shape`（仅显式）。

## 与 pi VS Code 流程的关系

| 事项 | 权威位置 |
|------|----------|
| 当前 WI、批准、gate | [`ACTIVE.md`](../ACTIVE.md)、[`AGENTS.md`](../AGENTS.md) |
| Prepare／Build／Close 协作 | [`docs/guides/agent-collaboration.zh.md`](../docs/guides/agent-collaboration.zh.md) |
| 分层、模块职责、信任边界 | [`docs/architecture/vscode-extension-architecture.zh.md`](../docs/architecture/vscode-extension-architecture.zh.md) |
| 架构审查清单（声称「正确」前） | [`docs/guides/architecture-governance.zh.md`](../docs/guides/architecture-governance.zh.md) |
| 领域术语（`CONTEXT.md`） | [`CONTEXT.md`](../CONTEXT.md) |
| 测试文件布局 | [`docs/guides/agent/testing.zh.md`](../docs/guides/agent/testing.zh.md) |
| Skill 具体步骤 | `.agents/skills/<name>/SKILL.md` |

调用 `/implement` 或 `/to-spec` **本身不等于**本仓库的 Build 授权；仍须在 `ACTIVE.md` 记录维护者批准。

## 维护

- 新增 skill：建 `.agents/skills/<name>/SKILL.md`（含 `name`、`description`、可选 `disable-model-invocation`），并在**同一次改动**更新本索引（英／中）。
- 路由说明优先放在 `/ask-matt`，避免到处复制。
- skill 文档里不要写密钥、凭证或私人路径。

## Skill 目录一览

与 `.agents/skills/` 一致（39 个）：

```text
ask-matt
code-review
codebase-design
diagnosing-bugs
documentation-health
domain-modeling
git-guardrails-claude-code
grill-me
grill-with-docs
grilling
handoff
implement
implement-spec
improve-codebase-architecture
loop-me
migrate-to-shoehorn
pi-sidebar-ui
pr
prototype
research
resolving-merge-conflicts
retro
scaffold-exercises
setup-matt-pocock-skills
setup-pre-commit
setup-ts-deep-modules
tdd
teach
to-questionnaire
to-spec
to-tickets
triage
wait-what
wayfinder
wizard
writing-beats
writing-for-agents
writing-fragments
writing-shape
```
