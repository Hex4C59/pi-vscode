# Git 提交规范

[English](git-commit-convention.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[git-commit-convention.md](git-commit-convention.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-21

- 类型：指南
- 状态：Accepted
- 创建：2026-09-19
- 权威：本仓库 commit message 的格式与语言（创建或改写提交时阅读）

## 适用范围

适用于本仓库人工或编码 Agent 撰写的全部 commit message，含 amend、reword、squash 等改写历史。

使用 **Conventional Commits**；**subject、body**（及需要的 footer）一律 **英文**。

> **内核提醒：** `AGENTS.kernel.md` L0 — 未经维护者明确要求勿提交；要求提交时遵循本指南。

## 格式

```text
<type>(<scope>): <summary>

<body>

<footer>
```

要求：subject 与 body 必填；footer 按需；段间空一行；一提交一逻辑变更；勿写密钥、完整 prompt、敏感路径。

Git 默认 merge/revert 文案可保留；手动改 revert 须用 body 说明原因。

## 语言

- 整段 message **英文**（含 body、自定义 footer）。
- 勿中英混写；标准 trailer 保持惯例；标识符与路径按需原样保留。

## 类型（type）

与英文版一致：`feat` `fix` `docs` `refactor` `test` `build` `ci` `perf` `style` `chore` `revert`。优先最具体类型，勿用 `chore` 掩盖含糊变更。

## 范围（scope）

小写，表示稳定领域；跨多域且无主域时可省略。

**pi VS Code 起步列表**（与 [`vscode-extension-architecture.zh.md`](architecture/vscode-extension-architecture.zh.md) 对齐；新边界稳定后再增补）：

| Scope | 典型路径 / 主题 |
|-------|-----------------|
| `host` | Extension host — `src/extension.ts`、`src/extension/` |
| `webview` | 侧栏 webview — `src/webview/` |
| `adapter` | pi SDK / 子进程 RPC — `src/adapter/` |
| `contracts` | 共享类型、`docs/reference/` 消息或协议文档 |
| `build` | esbuild、`tsconfig`、compile/watch 脚本 |
| `deps` | 依赖或 lockfile 专用变更 |
| `docs` | 文档树（不含 `contracts` 类 reference 规格） |
| `ci` | GitHub Actions、发布自动化 |

在架构文档出现稳定边界后再加 scope；勿为单次文件臆造 scope。

## 摘要（subject）

祈使、小写开头（除非标识符大小写敏感）、无句末句号、建议 ≤72 字、单一结果。

## 正文（body）

英文；说明**原因**与**行为**；可短但须有目的。涉及架构、安全、持久化、公共契约、上游 SDK、构建/CI、用户可见行为或迁移时写清细节。未跑过的检查勿声称已通过。

## 页脚（footer）

```text
Refs: #42
Closes: #57
Co-authored-by: Name <email@example.com>
```

议题引用放 footer。

## 破坏性变更

subject 中 type/scope 后加 `!`，并附 `BREAKING CHANGE:` footer 说明不兼容行为与迁移。

```text prompt
feat(contracts)!: require protocol version on webview hello

Host rejects postMessage without version so stale webviews cannot
talk to a newer bridge after upgrade.

BREAKING CHANGE: Unversioned webview messages are dropped.
```

## 提交前

提交授权规则不变：只有维护者明确要求时才能创建或改写提交。对每个已授权提交：

1. 用一句话说明该提交的关注点，并从会话临时 commit map 列出预期路径或 hunk。
2. 检查 `git status`、`ACTIVE.md` 的未暂存 diff 和已有的暂存 diff。除非其所有者明确授权，否则保留任务开始前已有的全部 index 内容。
3. 只按路径和 hunk 暂存该关注点。若所有权或重叠不明确，立即停止；采用[协作指南](guides/agent-collaboration.zh.md)中的非破坏性 baseline／工作副本／three-way 恢复流程，不用 stash、reset 或覆盖工作。
4. 用 `git diff --cached` 检查**完整**暂存 patch，不能只看 `--stat` 或文件列表；逐个暂存 hunk 对照已声明的关注点和预期路径。
5. 若 `ACTIVE.md` 与实现混在一起，停止并拆分。实现提交不含 `ACTIVE.md`；当前 WI 记录另作 `docs(active)` 提交；无关的 ACTIVE 纠错或维护另作 `fix(docs)` 或 `docs` 提交。
6. 按确认过的暂存内容选择 type/scope，撰写英文 summary + body（及 footer），再检查长度和敏感信息。
7. 提交后报告 worktree 或 index 中仍剩余的关注点，适用时注明所有权。
8. 未经维护者明确要求，不得 amend/rebase/squash/force-push。

仓库提供 `npm run commit:check` 时，它只是一道机械保护：会拒绝同时暂存 `ACTIVE.md` 与实现路径，但无法判断文档、测试或相邻 hunk 是否在语义上混杂。即使通过，也不能代替完整 cached diff 审阅。本仓库不安装 Git hook；有该命令时须显式运行。

## 隔离示例（message 仍为英文）

**正确——拆分关注点：**

```text prompt
feat(host): add project trust gate

Prevent runtime startup until VS Code reports a trusted workspace.
```

```text prompt
docs(active): record project trust verification

Capture WI acceptance evidence separately from the host implementation.
```

**错误——实现与 ACTIVE 混合：**

```text prompt
feat(host): add project trust gate and update ACTIVE

Implement the trust gate and record WI progress in the same commit.
```

错误示例无法独立审阅和回滚；机械检查也可能漏掉其他位置的语义混杂。

## 示例（message 仍为英文）

```text prompt
feat(host): register Pi chat webview in secondary sidebar

Wire WebviewViewProvider for WI-001 shell only; no postMessage bridge yet.
```

```text prompt
docs(decisions): accept ADR 0001 build baseline for WI-001

Close extension-host, sidebar-shell, and runtime-host gates after
maintainer F5 and spike acceptance; chat product remains gated.
```

```text prompt
build(adapter): add pi RPC get_state spike script

Prove subprocess start, one JSONL round-trip, and clean exit for
gate-runtime-host without LLM calls.
```

## 无效示例

```text prompt
update docs
```

无 type、scope、结果或 body。
