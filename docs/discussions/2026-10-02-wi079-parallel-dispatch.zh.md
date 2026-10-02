# WI-079 并行派工准备

[English](2026-10-02-wi079-parallel-dispatch.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-02-wi079-parallel-dispatch.md](2026-10-02-wi079-parallel-dispatch.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-02
- 类型：Discussion
- 状态：本地实现已验证；发布获授权，远端合并待完成
- 创建：2026-10-02
- 范围：现有 WI-079 的派工准备，不新增产品 WI

> 工作方式已替代（2026-10-02）：维护者随后要求单 Agent 工作并统一到 master。下文分工与隔离规则仅为历史；现行要求见[协作指南](../guides/agent-collaboration.zh.md)。

## 授权与基线（初始准备）

维护者要求开始多 Agent 工作。协调者从 `origin/master` 的 `8fcc943a20b6893a9dba3f6184e154fd4914b95d` 创建三个专属分支／worktree。现有 [WI-079](../../ACTIVE.md) 仍是唯一产品工作项。本记录不授权 commit、历史修改、push 或 PR。

主 checkout 中有未提交的 `ACTIVE.md` 修改和 `src/webview/tests/session-usage-roundtrip.spec.ts`，与已中断的会话 **持续推进 ACTIVE 队列** 关联。原所有者此前计划实现同一 adapter、host 和 UI 切片。空闲不等于所有权交接。此处不复制、暂存或修改这些文件。维护者解决归属前，新 Agent 只做只读准备；不声称产品实现或验收。

## 已分配任务单

每个 Agent 单独收到任务单；[协作指南](../guides/agent-collaboration.zh.md)仍是权威模板。下列 worktree 路径相对于主仓库目录。

| 所有者 | 分支 | Worktree | 本轮独占任务 |
|---|---|---|---|
| 协调者 | `codex/wi079-parallel-plan` | `../pi-vscode-worktrees/wi079-parallel-plan` | 本双语记录及双语讨论索引入口；host／契约顺序核对 |
| Adapter 规划 Agent | `codex/wi079-adapter-plan` | `../pi-vscode-worktrees/wi079-adapter-plan` | 只读 `src/adapter/**`；报告未来精确修改路径、public RPC seam、失败方式及 E2E 证据计划；不编辑 |
| UI 规划 Agent | `codex/wi079-ui-plan` | `../pi-vscode-worktrees/wi079-ui-plan` | 只读 `src/webview/**`；报告未来精确修改路径、生产 mounted E2E 计划及契约依赖；不编辑 |

所有任务单使用同一已提交基线，禁止依赖安装及 Git 历史修改，排除主 checkout 和其他 Agent 的未提交工作，并要求区分已验证事实与计划检查。仅协调者写本记录；准备期间无人写 `ACTIVE.md`、协议、生命周期接口、provider 或 lockfile。

## 所有权交接后的落地顺序

1. 确认原任务所有者释放 WI-079 实现归属。如需保留其红灯测试或交接，请其所有者发布明确授权的基线，不复制未提交文件。另行确认集成／提交权限。
2. 为 runtime 生命周期接口、Webview DTO、入站／出站校验指定唯一写入者。核对已批准 WI-079 Outline，先冻结最小兼容契约再实现消费者。共享契约放在不同 worktree 里也不能同时修改。
3. 发出新的实现任务单，写死互不重叠的文件列表。Adapter 与 UI 此时可基于已提交契约基线并行实现。Host provider 仍由协调者独占；归属解决前不为原红灯测试指定新写入者。
4. 先列失败方式并观测针对性行为测试失败，再实现。产出可重复 E2E 工件；合成 mount 不证明真实 pi、浏览器、F5 或安装 VSIX 验收。
5. 合并已提交修改到协调者任务分支前取得授权。不得通过本地 `master`、另一 worktree 的未提交代码或 force-push 集成。按适用 Git 权限刷新，重跑相关检查与 PR 基线门禁，保留候选／基线身份。

## 准备检查与剩余风险

两位规划 Agent 已完成只读报告并关闭。其 worktree 保持干净，为可能明确分配的后续任务保留；当前不是活跃产品写入者。

### 未来修改归属提议

以下是提议，不是编辑许可。未列出的文件均排除；已有共享 helper 保持只读，除非明确重新分配。

- Adapter：`src/adapter/runtime/pi-rpc-runtime.ts`；新增 `src/adapter/runtime/rpc/session-usage.ts` 和 `src/adapter/runtime/rpc/tests/session-usage-transport.spec.ts`。
- UI 组合：`src/webview/chat/candidate.tsx`、`src/webview/chat/composer/message-composer.tsx`；新增 `src/webview/chat/composer/session-usage-panel.tsx` 和 `src/webview/chat/composer/session-usage-panel.css`。
- UI 投影／client：`src/webview/client/types.ts`、`src/webview/client/client-state.ts`、`src/webview/client/parse-host-message.ts`、`src/webview/client/webview-client.ts`。
- UI 展示／证据：`src/webview/i18n/ui-text.tsx`、`src/webview/i18n/ui-zh-cn.ts`、`src/webview/styles.css`；新增 `src/webview/tests/session-usage-mounted.spec.ts`。
- 协调者提议：生命周期接口与导出类型、Webview DTO／校验、host provider／刷新 owner 和集成记录。实现前须指定额外 host 模块的精确路径。原所有者未提交的 roundtrip spec 不指定新写入者。

### 失败优先证据计划

Adapter 提议沿已有请求关联和 idle／session fence，不暴露 generic RPC。具名用量能力在 public RPC 读取前后核对会话身份，共享整次五秒 deadline。实现前，传输 E2E 应先在错误身份、忙碌转换、替换／释放、畸形或非有限／负数、nullable context、未知零费用定价、deadline／断连、迟到响应场景观测失败。从真实 runtime 入口穿过 JSONL，仅替换进程传输；拟保留 `dist/wi079-session-usage/adapter-report.json`，记录真实逐例结果与清理。

UI 提议复用 composer 弹层协调，经真实 client／parser 挂载生产 `mountChat`。实现前，mounted E2E 应先在当前／累计混淆、未知强制为零、危险额外字段、旧 revision、重复刷新、替换、不可用状态、草稿／焦点丢失、弹层冲突及误发送场景观测失败。拟保留 `dist/wi079-session-usage-ui/mounted-report.json`。浏览器宽度／主题／语言检查及真实 pi／F5／安装 VSIX 检查仍是独立协调者证据，不由 jsdom 或合成传输推导。

协调者须先在共享契约确定数值上界、坏必填字段与 nullable 策略、重置／revision 规则、busy 准入及保守定价解释，再开始这些实现。项目 pin 为 pi `0.86.1`；只读兄弟源码是 `0.87.1`，其 public commands 文档已迁移。较新源码不证明固定版本行为。新规划 worktree 没有已安装依赖；未安装包或修改 lockfile。

已提交基线通过显式快照 PR 祖先检查。本记录编辑前后 `npm run docs:verify` 输出相同：WI-035 双语归档指向忽略的原生工件的八条既有缺失链接。未新增文档诊断，整体检查仍失败。`git diff --check` 通过。本轮准备未运行产品测试或 runtime 检查，不报告为新的通过结果。

剩余决定：是否由本协调者从 **持续推进 ACTIVE 队列** 接管 WI-079。明确交接前，这些已准备 worktree 不是并发产品写入者。交接后用实现任务单替代规划任务，不把本历史记录当成永久所有权依据。

## 确认交接与独立任务阶段记录

维护者随后明确确认接管 WI-079，并把 WIP=1 替换为最多三个独立任务。已按该授权通知旧会话；其确认停止 WI-079 写入及自动晋升队列，保持主 checkout 不动。本阶段记录替代上文待交接／单 WI 调度陈述，不改变其证据限制。并发批准不是全部停车场的 Build 批准，也不授权 commit、历史修改、push 或 PR。

本轮执行三个不同工作：协调者实现有界并行政策及兼容文档检查；Dirac 审计辅助单 WI 假设；Curie 评估 WI-079 之外的独立候选。各自有独立分支／worktree。审计 Agent 始终只读，返回报告后关闭。干净 worktree 为明确分配的同任务后续保留，不是活跃产品写入者。

协调者独占修改范围为双语 AGENTS／协作指南、ACTIVE 登记、本记录／索引、文档入口及 documentation-health skill、PRD／gate 中的调度陈述、`scripts/docs/docs-verify-lib.mjs` 及新增 `scripts/docs/parallel-active.spec.mjs`。排除共享内核、产品行为、依赖 manifest／lockfile、其他 worktree 及主 checkout 的既有修改。未更新模板或兄弟仓库。

### 失败优先验证与发现

辅助审计确认旧文档检查器硬编码单个当前 WI，登记迁移后可能跳过 PRD 校验。实现保留旧输入兼容性，并校验新登记：最多三个唯一执行槽位、唯一 ID 和声明的分支／worktree 配对、有效所有者／阶段、登记 WI 的内联提案，以及每个 Build WI 的 PRD 判定／追溯。不验证实际执行进程、路径别名、批准语义是否充分或真实 Git 所有权。

实现前，修正仅属于 fixture 的语言切换入口后，三组真实 CLI fixture 测试在 `active-current-boundary` 失败。加强校验前，缺失表头场景错误地通过，先观测失败再修复。完整 CLI 测试覆盖十九个有效／无效场景，包括第二个 Build WI 待定／缺失 PRD 追溯，并保留 ACTIVE 输入。生成开发工件 `out/work/parallel-active/cli-report.json`。这是隔离合成仓库上的真实 docs CLI 验证，不是产品行为或真实 VS Code 验收。

二十五条针对性 docs／i18n／health／旧结构／并行测试通过。`git diff --check` 通过。`docs:verify`／`docs:health` 仍仅因八条既有 WI-035 工件缺失链接失败（合计重复诊断十六条）；保留 Draft ADR 0010 警告，ACTIVE 超过 180 行建议另增体积提示。新 ACTIVE／PRD 门禁无错误。已尝试 `npm test`，但本 worktree 未安装 `esbuild`，无法启动；未安装依赖，全量应用测试不是通过。所有结果是基于 `8fcc943a20b6893a9dba3f6184e154fd4914b95d` 的未提交开发证据，不是干净已提交候选验收。

### 独立后续候选

选择审计建议 WI-079，加独立只读 PR 基线证据审查及 PI-GAP-20 整条回复复制 Prepare。两个额外任务均未启动 Build。PR 基线审查无需产品写入，其未来单独限定报告是唯一输出。回复复制 Prepare 可独立核对 conversation／clipboard 行为，但未来实现会修改 WI-079 同样需要的 UI 翻译文件；Build 前须串行分配所有权。不得凑槽位增添无关清理，或重开已关闭 DOC-NAV／DOC-ORG。

WI-079 仍登记为已批准但未执行：原红灯测试／交接仍在主 checkout 未提交。所有权已明确，但发布／集成权限尚未明确。发布获授权基线，或明确选择不依赖这些未提交文件的实现；不得直接搬运作为捷径。本并发修改目前仅在协调者专属 worktree 准备，未提交、未在远端 `master` 启用。新编辑 Agent 不得导入其未提交政策／代码作为基线。

## 发布授权与验证阶段记录

维护者于 2026-10-02 明确授权提交、push 并通过 PR 合并本次配置。不包含迁移或发布 WI-079 主 checkout 的修改、改写历史、force-push、绕过保护或删除其他任务资源。上文发布待授权陈述属于早一阶段；远端启用仍须正常 PR 合并成功及对应记录。

在本任务 worktree 运行 `npm ci --ignore-scripts --no-audit --no-fund` 安装依赖，manifest／lockfile 均未改变。随后完整 `npm test` 全部 1174 条通过，包含新增 CLI 场景。保留早期缺 esbuild 结果作为历史环境证据，不是最终测试结论。对照基线 `8fcc943a20b6893a9dba3f6184e154fd4914b95d` 的原样 Git archive，文档仍因相同八条归档工件链接失败，另报 ACTIVE 体积警告。未修改无关归档证据或 ADR 状态。

实现、政策文档及 `docs(active)` 分开提交。在任务工件／PR 证据保留精确候选／基线身份与干净源码检查；push 前立即重跑 PR 基线门禁，通过正常 GitHub 保护合并。不把本地测试通过说成全部 CI 或产品／runtime／原生验收。主 checkout 保持不动，在其所有者的修改安全交接前可能仍有旧调度规则。
