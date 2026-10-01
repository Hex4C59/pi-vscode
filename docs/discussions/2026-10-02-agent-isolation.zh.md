# Agent 隔离规则落地

[English](2026-10-02-agent-isolation.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-02-agent-isolation.md](2026-10-02-agent-isolation.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-02
- 类型：Discussion
- 状态：范围已批准；历史落地记录
- 创建：2026-10-02
- 范围：仅仓库工作流；不改产品行为或共享内核

## 批准与所有权

维护者于 2026-10-02 批准隔离规则落地方案，包括创建 `codex/agent-isolation` 分支及基于 `origin/master` 的专属 worktree。未授权仓库提交、历史改写、push 或 PR。主 checkout 已有的 WI-079 修改保持不动；远端基线中的较旧 WI 记录不构成本任务的当前产品批准。

仅采用隔离、冲突处理和落地顺序，不采用 PI-Desktop 的架构或测试设施。[协作指南](../guides/agent-collaboration.zh.md) 负责流程和任务单；[AGENTS](../../AGENTS.zh.md) 负责简短入口规则。保留单一产品 WI，允许批准范围内互不重叠的子任务，共享记录只有一个协调者。本次独立授权的工作流维护不替换当前产品 WI。

## 实现前待验证的失败方式

任务所有权：本 Agent 唯一负责双语 AGENTS 与协作指南、Cursor 指针、`package.json` 的门禁入口、`scripts/testing/pr-base.*`、本讨论双语文件，以及本 worktree 的 `ACTIVE.md` 会话契约摘要。产品代码、lockfile、共享内核、主 checkout、WI 提案及其他 Agent 工作均排除。必须执行针对性 Git CLI 测试、适用仓库检查并生成 JSON 报告；仍不允许 commit／历史改写／push／PR。

- 错误拒绝当前分支，或错误拒绝包含本任务提交的分支。
- 过期的本地远端跟踪引用掩盖远端基线的新提交。
- 错误接受落后或已分叉的分支。
- 将 fetch 失败、缺少远端、缺少远端分支或非仓库目录报告为成功。
- 基线检查修改任务文件、index、HEAD 或其他 worktree。
- Git 子进程无限挂起，或泄漏测试仓库。

使用临时本地 Git 远端与专属 worktree 验证真实 CLI，不访问用户数据或外部服务。测试夹具中的提交仅为测试数据，不是在任务分支提交。可重复 JSON 报告写入 `out/work/agent-isolation/pr-base.json`。Cursor 规则加载及服务端 PR 强制执行仍是独立、未验证事项。

## 交接

2026-10-02 后续批准范围：新增远端 PR 基线工作流，并将候选验收证据绑定到实际测试提交与基线版本。沿用本任务 worktree，不增加 commit／历史修改／push／PR 授权。本 Agent 额外负责 `.github/workflows/pr-base.yml`、双语 testing 指南的证据入口，以及对应规则／会话契约摘要。实现前验证 CI 不会误查 checkout HEAD 而非 PR head，不接受缺失／格式错误的快照 ID，显式快照检查不需要联网 fetch；保留本地先 fetch 的行为。文档须区分脏工作区开发检查与已提交候选验收，以及祖先检查与行为集成证据。

规则、双语任务单、薄层 Cursor `alwaysApply` 指针及 `check:pr-base` CLI 仅在 `codex/agent-isolation` worktree 实现。其 `ACTIVE.md` 只修改指南要求同步的两条会话契约摘要，不改 WI 提案或产品源码。主 checkout 仍保留既有 `ACTIVE.md` 修改与未跟踪用量测试。本任务变更未暂存、提交、推送或合并，也未创建 PR。

### 首次落地验证

2026-10-02 验证使用 Node 25.9.0 及 `npm ci` 安装的锁定依赖：

- 八个 CLI 端到端场景在门禁实现前失败，实现后通过。`npm test` 实际收集这些场景；JSON 报告位于 `out/work/agent-isolation/pr-base.json`。
- `npm run compile`、`npm run lint`、两个脚本语法检查、`git diff --check` 及 Cursor 指针／元数据静态检查通过。未验证 Cursor 实际加载规则，也未配置或验证服务端 PR 强制执行。
- 首次全量测试：1,147 通过，一个既有默认模型保存用例失败。该未修改套件单独运行四项全通过；全量复跑 1,148 项全通过。本任务不声称修复了所观察到的偶发失败。两次全量日志及单独复跑日志均保留在 `out/work/agent-isolation/`。
- `npm run docs:verify` 与 `npm run docs:health` 均退出 1。存在八条既有断链，指向 ignored 的 WI-035 验收工件，另有两条既有 Draft ADR 0010 警告。未修改的 `git archive HEAD` 快照复现完全相同的 verify 诊断；health 独立扫描零错误／提示，但组合文档检查仍失败。不复制其他 worktree 的工件或改写历史证据来凑通过。
- 真实基线门禁正确退出 1：本 worktree 从 `b24d641` 开始，获取的 `origin/master` 已推进至 `dd33b5d`（领先 14 个提交）。未自动 rebase／merge。任何 PR 前须取得明确提交／历史修改授权，仅刷新本私有任务 worktree，仅解决本任务改过路径的冲突，并重跑受影响检查。这些规则尚未进入共享基线。

日志与基线比较保留在 `out/work/agent-isolation/`；基线快照移到仓库外，避免被当成新增文档扫描，其位置记录在 `baseline-location.txt`。主 checkout、其本地分支及 WI-079 工作仍不在本任务写入范围内，本交接不替换其当前产品记录。

### 启用授权

2026-10-02 维护者要求启用已完成配置并继续剩余操作，授权按明确路径提交本任务、刷新本私有分支、推送、经适用门禁创建和合入 PR，以及配置对应 GitHub 必需检查／最新基线保护。不授权丢弃主 checkout 工作、修改产品代码、force-push、绕过失败的必需检查或静默修复无关基线失败。实现与 `ACTIVE.md` 会话契约摘要仍分开提交。远端 `master` 当前没有分支保护或 rulesets，已登录账户有管理员权限。本任务之前 master CI 已失败，包括文档链接和 Windows 行为测试；须分别记录实际任务／PR 结果。

启用检查点：实现与会话契约修改分别提交，并无冲突地 rebase 到 `dd33b5de667a180c0ac0fe30c34ae394dd5d7101`。干净候选 `5b8b5aebdbb6da60395253d4f6c19012a627818f` 的 compile、lint、Webview／包文件检查及 1,171 项测试通过。文档检查仍报告原有历史工件失败。从 `codex/agent-isolation` 创建 PR #1。GitHub 保护已核验：要求 GitHub Actions app 15368 提供 `PR head contains base snapshot`，严格检查最新基线，对管理员也生效，要求通过 PR 交付但不要求外部批准，禁止 force-push／删除 `master`。没有关闭现有检查或降低既有保护；此前没有保护／rulesets。应用集成未连接，无法通过其读取详细 PR CI 诊断；PR 汇总状态为 UNSTABLE，不代表完整 CI 成功。任何合入必须使用 GitHub 正常门禁，不能使用管理员绕过。本检查点及后续 PR 合并事件记录启用过程，下方早期验证段落保留其历史源码状态。主 checkout 工作保持不动，本地 `master` 同步须等其所有者使该 checkout 安全后进行。

### 后续补充验证

新增 PR 工作流覆盖所有目标为 `master` 的 PR，先测试门禁，再检查事件提供的 base/head 提交 ID，而非 checkout HEAD，最后保留 fixture 报告与祖先检查日志。双语协作指南集中规定候选／基线／源码状态证据模板，区分任务候选、实际 PR 集成候选及脏工作区开发检查；testing 指南与会话契约摘要指向该要求。未采用 PI-Desktop 的进程、依赖环境或产品测试设施。

新增六个真实 Git CLI 场景先失败，原八项仍通过；实现后十四项全通过。YAML 解析及工作流静态接线、脚本语法与 diff 检查通过。`npm run compile`、`npm run lint` 和新一轮全量 `npm test` 通过（1,154 项，零失败）。文档命令仍退出 1，诊断与初始基线完全一致；未修改历史工件或 Draft ADR 状态。

这些是开发结果，不是已提交候选或远端验收。实际测试源码的 HEAD 基线为 `b24d641888a4dee8c50993097a353e1aac41aad4`；已纳入基线也是该提交，获取的目标 `master` 为 `dd33b5de667a180c0ac0fe30c34ae394dd5d7101`。源码状态为脏。已修改的跟踪与未跟踪源码快照为 `out/work/agent-isolation/ci-development-source.tar`，SHA-256 `b6fb0bec5dde837c88fbc391687453b89f2bae00b0e98131834d5a663ae01af5`；跟踪文件补丁、源码状态、日志与身份报告 `ci-validation.json` 保留在同目录。该快照标识检查运行时、最终交接更新前的源码。

真实无参数基线门禁仍失败，因为尚未纳入已获取目标。GitHub 实际运行、必需检查设置与分支／merge-queue 保护均未由本任务配置或验证。全部修改仍仅在此 worktree，未暂存、提交；未 rebase、push、merge 或创建 PR。主 checkout 状态仍是既有 `ACTIVE.md` 修改与未跟踪用量测试。
