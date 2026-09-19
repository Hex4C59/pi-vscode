<!-- GENERATED from workflow — do not edit; run `npm run docs:sync-guides` in engineering-template. -->

# 架构治理（Agent 检查清单）

[English](architecture-governance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[architecture-governance.md](architecture-governance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-19（补充样例 / few-shot）

- 类型：指南
- 状态：Accepted
- 创建：2026-09-19
- 最近审阅：2026-09-19（扩展评审标准）
- 权威：Agent 何时、如何应用架构维度；可移植清单——不替代产品架构或 ADR
- 相关：[AGENTS.kernel.zh.md](../../AGENTS.kernel.zh.md)；可选产品 `docs/architecture-review-guide.md` 作长文评审叙述

Agent **不会**记住历史聊天。**本文件 + 产品文档** 才是治理一致性的来源。

本文是**工作清单**。每行只写一个字「通过」不够。对每个触及的维度，须标明 **pass / gap / N/A**、**证据**（路径、§、gate、contract ID）以及**若忽略的风险**。

---

## 何时打开本清单

在以下情况**之前**打开并引用证据：

- 提议模块拆分、新公共 API、IPC/命令、共享类型或持久化布局。
- 声称设计「正确」「可上线」「符合架构」。
- 大规模重构、新的跨层依赖，或关闭 architecture gate。

以下可跳过：错别字、纯文案、维护者明确限定单文件且无边界影响的任务。

---

## 治理问题（核心句）

> 本仓库是否建立了**可执行的架构治理**——有文档约束与**权威链**，且实现与评审可以核对？

用**磁盘上的文件**回答。若尚无架构文档，如实说明并提议 Prepare 阶段（见 [agent-collaboration.zh.md](agent-collaboration.zh.md) §9）。

---

## 如何汇报（架构向提案的必填格式）

在聊天中附上类似表格（仅 WI 相关行；其余标 N/A）：

| 维度 | 状态 | 磁盘证据 | 若继续做的缺口或风险 |
|------|------|----------|----------------------|
| 模块分解 | pass / gap / N/A | 如 `docs/modules/README.md` owner | … |

然后给出**简短结论**：现在实现 | 先 spike | 先补文档 | 被 gate/ADR 阻塞。

---

## 权威链（典型产品仓）

```text localized
AGENTS.kernel.md + AGENTS.md + playbook
        ↓
product-requirements.md（Accepted 后）
        ↓
主架构（如 docs/architecture/*.md）
        ↓
docs/modules/*（所有权、must-not）
        ↓
docs/reference/* 契约（Outline / Living）
        ↓
src/shared/contracts + 测试（Living）
        ↓
architecture-gates.md + Accepted ADR
```

任一层缺失或契约为 `Planned` 时标明缺口——**不要臆造** owner、DTO 或 `Living` 行为。

---

## I. 结构维度（五核心）

### 1. 模块分解（module decomposition）

**回答：** 系统由哪些部分组成？各自负责什么？**明确不负责**什么？

**通过时通常：**

- 每模块有**单一主责**、**高内聚**。
- **低耦合**：不必了解对方内部实现。
- **变更原因**与边界一致（如 pi 升级不应迫使无关 UI 大改）。
- 边界在可行时**可独立测试**。
- **权限与职责匹配**（低信任代码不能碰高权限 API）。

**红旗：**

- 无限膨胀的 God 模块（`Manager`、`Utils`）无 owner。
- 多模块**直接改同一 runtime/会话**。
- 改一个字段牵动无关层。
- 模块间**依赖环**。

**引用：** 架构模块章节；`docs/modules/README.md`；各 module stub。

**不要只说**「结构清晰」——应说明分解原则、哪些边界已固定、职责重叠处、缺什么才能独立测。

---

### 2. 公共接口（published API）

**回答：** 其他模块通过哪些**具名操作**使用本模块？（IPC、命令、preload、服务端口——不仅是 TypeScript `export`。）

**通过时通常：**

- 接口**窄**、**用例形状**（非 `invoke(method, args)`）。
- 调用方依赖**能力**，非内部存储或框架类型。
- 输入输出足以**校验**与 **test double**。
- 低信任调用方不能要**泛化宿主能力**（任意路径、shell、凭据）。

**红旗：**

- pi SDK / Node / FS 类型泄漏到 UI 包。
- 「临时」公共 export 变成永久胶水。
- 接口过宽难以 mock 或替换（妨碍日后 RPC/子进程 ADR）。

**引用：** reference 契约页；`IpcRegistration` 等 module 文档；code-style 中 IPC 命名。

**记住：** **接口 ≠ 契约**——可有签名但 abort 语义、超时、并发替换会话仍未定。

---

### 3. 依赖（dependency direction）

**回答：** 谁可以 import/call/知道谁？控制与数据流的**允许方向**？

**通过时通常：**

- **主导单向**（如 UI → host → adapter → 上游）。
- 依赖图**无环**（尤其 adapter ↔ controller）。
- **业务规则**不直接依赖框架 handler；框架在**边缘**。
- 共享类型在 **contracts** 层，非 host 内部。

**红旗：**

- UI import 上游 SDK 或 host 单例。
- 高层编排直接 import IPC handler 模块。
- runtime 控制与 adapter 双向依赖。

**引用：** 架构分层图；`boundaries.md`；拟议 diff 的 import 路径。

---

### 4. 契约（contracts）

**回答：** 跨边界调用前后须满足什么？载荷、错误、顺序、幂等？

**通过时通常：**

- 声称对齐实现前，契约文档至少 **Outline** 或 **Living**。
- **Living** 与 `src/shared/contracts`、测试**同 PR** 变更。
- 错误码、空状态、**非法状态**有说明——非仅 happy path。
- 事件流有 correlation（ID、索引、权威「消息完成」）。

**红旗：**

- reference 仍为 `Planned` 却已实现 DTO。
- 仅有类型无语义（如 `abort()` resolve 但队列/会话未定义）。
- 文档、代码、测试定义冲突。

**引用：** `docs/reference/README.md`；具体契约文件；相关 gate。

---

### 5. 所有权（resource ownership）

**回答：** 每项资源（任务记录、runtime 槽、订阅、worktree、凭据、journal、附件 token）的创建/更新/删除/清理由**谁唯一负责**？

**通过时通常：**

- 架构**一资源一 owner**，禁止双重所有权。
- 遵守 module 表 **Must not**。
- **Adapter 只转换**，不拥有业务真相。
- 生命周期（dispose、取消作用域、退出顺序）有命名 owner。

**红旗：**

- 两模块同时订阅上游并改同一 catalog。
- 把 UI store 当持久化真相。
- 清理只写在注释里。

**引用：** 架构 §8；`docs/modules/*`；cleanup 矩阵（若有）。

---

## II. 行为与运行时

### 6. 需求与范围

**回答：** 当前 **WI / 首版** 包含什么？明确**不包含**什么？成功标准？

**通过时通常：** 不把全产品 scope 塞进 spike WI；范围外进停车场；用户可见表述与 PRD 状态一致。

**红旗：** 「顺便做…」无 WI 变更；将受 gate 约束功能说成已交付。

**引用：** `product-requirements.md`；`ACTIVE.md`；open gates。

---

### 7. 领域模型

**回答：** 核心实体、ID、关系？（如 workspace ≠ runtime ≠ session ≠ view。）

**通过时通常：** 术语与 glossary、架构一致；跨层 ID 稳定；不变量已写。

**红旗：** 同一词在 UI、持久化、SDK 中指不同事物。

**引用：** glossary；架构领域章节；PRD。

---

### 8. 状态机

**回答：** 有哪些状态？合法转移？非法操作如何处理？

**通过时通常：** 任务/runtime/UI 状态有文档或 contract-states；非法转移可见失败；终态有恢复或用户动作。

**红旗：** 仅 `isLoading`，无 abort/switch/crashed 模型。

**引用：** `task-and-runtime-states` 等；状态权威 module。

---

### 9. 并发模型

**回答：** 什么可并行？什么须串行？abort、切换、退出如何交互？

**通过时通常：** cancel/switch/reload 后**迟到事件**有规则；无无限 fire-and-forget；多 runtime 时有 generation/incarnation 等防陈旧机制。

**红旗：** 「以后再加锁」；无队列的可变单例。

**引用：** 架构并发章节；spike 笔记；进程模型 ADR。

---

### 10. 错误与恢复

**回答：** 失败如何呈现？重试？UI 与 host desync？崩溃恢复？

**通过时通常：** 区分用户可修、系统、上游错误；恢复路径有文档；边界处不空 `catch`，在 owning boundary 记一次日志。

**红旗：** helper 吞错；UI 无 failed 状态卡住。

**引用：** PRD 失败场景；code-style；module 测试焦点。

---

### 11. 生命周期与清理

**回答：** 谁订阅？谁释放？退出/崩溃时顺序？

**通过时通常：** abort、切换、关窗、deactivate 时清理监听与子进程；应用退出顺序有文档；pending IPC 取消。

**红旗：** 泄漏订阅；僵尸子进程；「exit hook TODO」。

**引用：** `application-lifecycle`；架构生命周期 §；boundaries 流式清理。

---

## III. 质量与交付

### 12. 安全与信任模型

**回答：** 谁可信？以何权限运行？什么绝不能进 UI/日志？

**通过时通常：** 边界与架构一致；**不虚假沙箱**；凭据走专用通道且提交后从 UI 清除；不可信内容安全渲染。

**红旗：** 密钥进 renderer 存储、遥测或普通日志。

**引用：** `security.md`；架构安全 §；`AGENTS.md` L0。

---

### 13. 数据与持久化

**回答：** 持久化什么？谁写？schema？迁移？真相来源？

**通过时通常：** 有 persistence owner；UI 为投影；schema 变更链到 gate/ADR；apply 不破坏目标工作区。

**红旗：** 无 owner 的随意 JSON；双写同一路径。

**引用：** `persistence-layout`；`gate-task-persistence`；module owner。

---

### 14. 可观测与隐私

**回答：** 何者可日志/计量？禁止哪些 PII/密钥？

**通过时通常：** 边界处日志；不 log 全文 prompt/token/认证路径。

**红旗：** `console.log` 消息体或环境密钥。

**引用：** security playbook；PRD 隐私。

---

### 15. 性能与背压

**回答：** 流式、大 payload、队列深度、UI 抖动？

**通过时通常：** 流式有界；composer 稳定（见 UI playbook）；附件/大小与 gate 一致。

**红旗：** 缓冲整条流；在 UI 路径同步 FS。

**引用：** PRD；架构；WI 验收指标。

---

### 16. 测试策略

**回答：** 本 WI 须自动证明什么？什么仍手动？

**通过时通常：** 新公共面有计划契约/模块测试；Agent 已跑脚本并汇报——非「应该能过」。

**红旗：** 新 IPC/状态转移零测试；声称验证却无命令。

**引用：** `testing.md`；module stub；CI。

---

### 17. 构建、发布、升级

**回答：** 工具链 pin？打包 Node？生产启动干净？

**通过时通常：** spike 先证明 build baseline；上游版本显式 pin。

**红旗：** 生产构建隐式依赖 `../`。

**引用：** `package.json`；gate-build-baseline；已接受 ADR。

---

### 18. 兼容与版本

**回答：** 破坏性 IPC/schema？磁盘数据迁移？

**通过时通常：** 破坏性变更有记录；遵循 change-policy。

**红旗：** 无 ADR 静默破契约。

**引用：** `docs/decisions/`；契约版本说明。

---

### 19. 体验与无障碍（WI 用户可见时）

**回答：** 状态可见？键盘？高密度工具 UI？

**通过时通常：** loading/empty/streaming/aborting/error 已设计；工作目录与危险操作可见。

**红旗：** 营销页式布局；运行状态隐藏。

**引用：** `ui.md`；PRD UX。

---

## IV. 九透镜速览（第二遍）

| 透镜 | 问 |
|------|-----|
| **Structure** | 部件与模块可辨认？ |
| **Boundaries** | 触及代码路径上信任线是否落实？ |
| **Direction** | 依赖是否指向领域内侧、适配器外侧？ |
| **Behavior** | WI 动态场景是否被契约/状态覆盖？ |
| **Responsibility** | 触及资源是否各有唯一 owner？ |
| **Time** | 生命周期、顺序、并发是否处理？ |
| **Data** | 真相与持久化路径是否清楚？ |
| **Risk** | 未关 gate/ADR 是否阻止「完成」声称？ |
| **Verification** | 测试/docs:verify/验收是否定义？ |

---

## 架构成熟度（勿过度声称）

| 级别 | 含义 |
|------|------|
| **Direction** | 图与 owner 已认同——未必有代码 |
| **Implementable** | 契约与模块足够细，可不猜实现 |
| **Verifiable** | Living 契约 + 测试 + CI 守住关键规则 |
| **Evolvable** | ADR/gate 跟踪变更而不腐化 |

说明本 WI 声称到哪一级。

---

## Agent 义务

1. 提风险时**点名维度**，不只说「乱」「有风险」。
2. **引用**架构 §、module owner、contract ID、gate ID——或标 **未文档化**。
3. **决策类：** `none` | `spike-only` | `adr-after-approval`。
4. 关会话时若治理文档有变，运行 `npm run docs:verify`（产品仓）。

---

## 维护者一句话（架构向会话）

```text
@ ACTIVE.md。本次涉及架构/边界。请按 workflow/architecture-governance.md 对相关维度逐项给出 pass/gap/N/A、磁盘证据与风险，再提案；我确认后再改代码。
```

---

## 工作样例（few-shot）

Agent 应**模仿下列样例的结构与证据写法**。路径与产品名换成当前仓库。更长叙述见可选产品 `docs/architecture-review-guide.md`。

### 样例 1 — 填好的治理表（WI-001：工具链 + SDK spike）

**背景：** 初始化阶段；WI-001 仅证明 `package`、import  pinned SDK、最小 runtime 探测——无聊天 UI、无真实模型。

**结论：** `spike-only` — 可做脚手架；维护者验收前**不要**声称产品功能或关闭 `gate-build-baseline`。

| 维度 | 状态 | 磁盘证据 | 若继续做的缺口或风险 |
|------|------|----------|----------------------|
| 模块分解 | N/A | 尚无应用模块，仅 bootstrap | spike 未过就拆 `src/main` 服务为时过早 |
| 公共接口 | gap | 无 Living 的 `contract-ipc` | WI-001 无 renderer IPC 可接受；同 PR 加 IPC 则不行 |
| 依赖 | pass | `AGENTS.md` L1；规划 renderer ↛ SDK | 首个真实 UI WI 须 enforce |
| 契约 | gap | `reference/ipc-channels.md` = `Planned` | 勿在代码里发明 channel 列表 |
| 所有权 | N/A | 架构 §8 owner 未实现 | 多任务代码前先文档化 owner |
| 需求与范围 | pass | `ACTIVE.md` WI-001 一句目标 | 扩 scope → 停车场 |
| 构建发布升级 | gap | `gate-build-baseline` = `In spike` | 须跑 `npm run package` 并报告 Node vs SDK 最低版本 |
| 测试策略 | pass | WI 验收中的 `npm test` / spike | Agent 须粘贴命令输出 |
| 安全与信任 | N/A | WI-001 无凭据 | IPC+密钥时再评审 |

**声称的成熟度：** 产品架构 **Direction**；仅 WI-001 验收命令可达 **Verifiable**。

---

### 样例 2 — 填好的治理表（提案：首批 allowlist IPC）

**背景：** 维护者批准 WI-002「发文本到 runtime」；Agent 提议 `task:send-message`。

**结论：** 若策略要求则 `adr-after-approval`；否则表后 `none`——**维护者 OK 后再实现**。

| 维度 | 状态 | 磁盘证据 | 若继续做的缺口或风险 |
|------|------|----------|----------------------|
| 公共接口 | gap | 窄 handler vs 泛化 invoke | 合并前 `ipc-channels` 至少 `Outline` |
| 契约 | gap | payload 未写入 IPC/事件页 | renderer 与 main DTO 易漂移 |
| 依赖 | pass | handler 调应用服务，preload 不调 SDK | 在 diff 中核对 import |
| 所有权 | gap | 校验归 `TaskRuntimeController` 还是 `IpcRouter` 不清 | 引 module 文档或走 Prepare |
| 状态机 | gap | 「aborting 时 send」未定义 | 须定义或推迟功能 |
| 安全与信任 | pass | `security.md`：宿主校验；payload 无密钥 | 宿主加 schema 校验 |

**差的跟进：**「IPC 简单，我加了十五个 channel。」  
**好的跟进：**「本 WI 两个 channel；已更新 `contract-ipc` Outline；`aborting` 状态推迟到 WI-003，gap 写入 ACTIVE。」

---

### 样例 3 — 判断对话（维护者 ↔ Agent）

**3a —「还要优化什么？」**

- **维护者：**「加了 architecture-governance.md，还要什么？」
- **宜：**「当前 WI-001 无必须项。可选：日后复制到 `docs/guides/`、`src/` 存在时在 path-triggers 加一行。除非你要求，我不会开新 WI。」
- **忌：** 无 `ACTIVE.md` 依据的六条路线图。

**3b —「现在写 Accepted ADR？」**

- **维护者：**「聊天里 spike 过了，写 build baseline Accepted ADR。」
- **宜：**「尚未——需你跑打包应用并确认 ACTIVE 验收日志；此前 gate 保持 `In spike`，Decision `none`。」
- **忌：** 为讨好请求起草 Accepted ADR。

**3c — 架构向开场**

- **维护者：**「@ ACTIVE.md — 加 Webview 聊天面板。」
- **宜：** 复述 WI，再给依赖/安全/契约/UX 的部分 pass/gap；协议未定义则 `spike-only`。
- **忌：** 未列边界或 CSP gap 就写 `Chat.tsx`。

**3d — 前提 vs 仓库**

- **维护者：**「这周交付多项目并行任务。」
- **宜：**「PRD/架构有描述，但 `gate-runtime-host` 与任务持久化为 Open。建议停车场或 Prepare WI——不能声称已交付。」
- **忌：**「好的，我现在实现并行任务。」

**3e — 明确头脑风暴**

- **维护者：**「只 brainstorm：以后可能用的可观测工具。」
- **宜：** 列表标 **optional / deferred**；「不在 ACTIVE；不实现。」
- **忌：** 把 brainstorm 当成下 sprint 承诺。

---

### 样例 4 — 公共接口：过宽 vs 较窄（代码）

可移植的 host/UI 分离评审模式：

过宽（禁止模式）：

```typescript
interface HostApi {
  invoke(method: string, args: unknown[]): Promise<unknown>;
}
```

较窄（方向正确；错误/取消/并发仍须**契约**）：

```typescript
interface AgentApi {
  prompt(input: PromptInput): Promise<CommandResult<PromptAcceptance>>;
  abort(): Promise<CommandResult<void>>;
}
```

**评审用语 — 差：**「Preload API 没问题。」  
**评审用语 — 好：**「Preload 暴露用例方法而非泛化 invoke；`PromptInput`/`CommandResult` 仍须在 Living `contract-ipc` 中定义非法状态与超时。」

---

### 样例 5 — 模块分解评审用语（ prose）

**差：**

> 模块分解合理。

**好（结构级，带 gap）：**

> 进程边界区分 renderer、preload、main 与 pi runtime。Main 将 runtime、IPC、信任、凭据、附件视为不同变更原因。Gap：文档未固定 `RuntimeController` 与 `PiAdapter` 调用边界；`ExtensionUiCoordinator` 尚未纳入规划目录树。

其他产品可换成 webview / extension host / adapter 等名称；保留 **证据 + gap** 模式。

---

## 索引（维度一览）

| # | 维度 | 节 |
|---|------|-----|
| 1–5 | 模块分解、公共接口、依赖、契约、所有权 | I.1–I.5 |
| 6–11 | 范围、领域、状态机、并发、错误、生命周期 | II.6–II.11 |
| 12–19 | 安全、持久化、可观测、性能、测试、构建、兼容、UX | III.12–III.19 |

**完整叙述与示例：** 可选产品 `docs/architecture-review-guide.md`。

可复制到产品仓 `docs/guides/architecture-governance.md`，或在 `AGENTS.md` load map 中链接。
