# ARCH-03 运行时能力组合

[English](2026-09-30-arch-03-runtime-capabilities.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-arch-03-runtime-capabilities.md](2026-09-30-arch-03-runtime-capabilities.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：讨论
- 状态：Closed
- 创建：2026-09-30
- 权威：WI-055 盘点；不是实施批准、ADR 或接口拆分
- 相关：[runtimeLifecycle](../architecture/vscode-extension-architecture.zh.md)

## 问题

`PiRuntimeLifecycle` 哪些方法是必需、哪些可选，各实现提供什么，可选项是否仍有生产理由？

## 表面

必需：`start`、`stop`、`getSession`、`subscribe`、`preparePrompt`、`prompt`、`getModelProjection`、`setThinkingLevel`、`setModel`。

可选（宿主一律 `?.`）：`checkpointRestart`、`getOwnershipState`、`endOwnedRuntime`、`recoverOwnedRuntime`、`handoffRetainedRuntime`、`abortTask`、`invalidateInteractions`、`setFeedbackHandler`、`setInteractionHandler`、`setApprovalHandler`。

## 实现

| 实现 | 必需 | 可选项 |
|------|------|--------|
| `createPiRpcRuntime`（生产） | 全部 | 全部，含所有权、Stop、handler、checkpoint |
| `noopPiRuntimeLifecycle` | 全部（start 成功且模型为 null；prompt／变更失败关闭） | 仅 `handoffRetainedRuntime` → `{ ok: true, outcome: "none" }` |
| 诊断 `runPiRuntimeProbe` | 不是 lifecycle | 一次 `get_state` 后停止 |
| 宿主 harness `settingsRuntime` | 全部 | 无，直到测试赋值 |
| 功能测试 | 通常从 harness／noop 起步 | 仅在该切片下测试时挂上 `abortTask`、`checkpointRestart`、`handoffRetainedRuntime`、`getOwnershipState`、`endOwnedRuntime`、`setApprovalHandler`、`setInteractionHandler` |

宿主生产路径需要的可选项：Stop（`abortTask`）、profile 替换（`checkpointRestart`）、启动（`handoffRetainedRuntime`）、恢复横幅（`getOwnershipState`／`endOwnedRuntime`／`recoverOwnedRuntime`）、工具（`setApprovalHandler`）、trusted 表单（`setInteractionHandler`）、扩展反馈（`setFeedbackHandler`）、断连（`invalidateInteractions`）。

## 可选项是否仍必要？

对生产 RPC 是必要的：这些方法已实现，协调器会调用。保持可选是为了让 noop 与窄测试可以省略。风险也在这里：没有 `abortTask` 的测试会使 `abortTask?.()` 为 undefined，Stop 走未确认／失败分支而不是成功 abort。断言 Stop 的测试会挂上该方法。

装配是运行时 `?.` 加上生产工厂返回完整对象。TypeScript 不要求测试替身实现 Stop 或所有权。

## 结论

不据此把接口拆成大量能力类型。生产需要一个子进程对象。省略某方法的测试替身在该方法不在用例内时可以接受；不能用来宣称 Stop 或所有权覆盖。ARCH-04 仍分开。
