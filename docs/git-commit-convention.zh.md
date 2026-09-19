# Git 提交规范

[English](git-commit-convention.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[git-commit-convention.md](git-commit-convention.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-19

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

查 `git status` 与暂存 diff；排除无关改动；按暂存内容选 type/scope；写英文 subject + body；无 amend/rebase/squash/force-push 除非维护者明确要求。

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
