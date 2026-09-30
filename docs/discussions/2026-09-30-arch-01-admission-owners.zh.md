# ARCH-01 准入与状态转换所有者

[English](2026-09-30-arch-01-admission-owners.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-arch-01-admission-owners.md](2026-09-30-arch-01-admission-owners.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：讨论
- 状态：Closed
- 创建：2026-09-30
- 权威：WI-054 盘点；不是实施批准、ADR 或协调器拆分
- 相关：[架构](../architecture/vscode-extension-architecture.zh.md)

## 问题

发送、模型、Stop、profile、会话与工作区文件夹操作的准入在哪里，这些规则是否重复或漂移？

## 所有者（不要合并）

| 所有者 | 拥有的状态 | 实际强制的准入 |
|--------|------------|----------------|
| Webview `availability()` | 派生禁用标志 | 仅 UI。不是传输或宿主权威。 |
| `PiChatViewProvider` | `busy`（文件夹／信任 UI）、`chatBusy`、`stoppingTask`、`profilePhase`、会话阶段、`runtime` | 组合谁可以发送、切换 profile、列会话或跑文件夹／信任命令。`busy` 不是聊天占用。 |
| `DraftSubmission`（经注入的 `eligible`） | 草稿修订与发送 | 宿主回调：profile idle、交互 idle、非会话切换、合格文件夹、runtime ready、非 `busy`／`chatBusy`／`modelBusy`／`stoppingTask`。 |
| `ModelSettings` | `modelBusy`、下一轮意图 | `canSelect`：未销毁、runtime ready、非 `blocked`、非 `modelBusy`。`applyPending` 额外要求非 `stopping` 且非 `chatBusy`。 |
| `createRpcOccupancy` | prompt／ACK／command／agent／abort／dialogs／approvals | `allowsSend`、`allowsModelMutation`（`!promptInFlight`）、`allowsRestart`（含无 dialog／approval 的空闲）。活 RPC 进程的传输事实。 |
| `EditorTools` | 审批／授权 | 使用协调器的 `chatBusy` 与 `execution === "stopping"`。 |

模型用的 `blocked` 来自协调器：`state.busy` 或会话切换或交互非 idle 或 profile 非 idle。

## 操作表

| 操作 | 宿主门 | 嵌套所有者 | 传输 |
|------|--------|------------|------|
| 发送 | Draft `eligible` 然后 `chatBusy = true` | 草稿账本 | `allowsSend` |
| Stop | `receive` 中始终接受（即使处于 profile 阶段）；空闲则 no-op | `stoppingTask` + `execution: "stopping"` | 运行时 Stop 内 occupancy `beginStopping` |
| 模型／thinking | `ModelSettings.canSelect` + 推迟的 `applyPending` | `modelBusy` | `allowsModelMutation` |
| Profile 切换 | `canSwitchProfile`（ready，非 busy／chatBusy／stopping／modelBusy／session／interactions；profile idle 或 error） | `profilePhase` | 运行时重启用 `allowsRestart` |
| 会话列表／切换 | `sessionEligible` − `sessionTransitionBusy` − `sessionOperation` | 会话投影阶段 | — |
| 文件夹／信任 | `state.busy` 串行对话框；busy 时拒绝其他意图 | `state.busy` | — |

## 重复与漂移

独立校验是必要的：webview 可以撒谎，宿主可能竞态，RPC 进程仍可能在飞。不能用 `chatBusy` 替代 occupancy。

可能的漂移，不是当前生产缺陷：

- 工具以 `execution === "stopping"` 识别 Stop；模型以 `stoppingTask` 识别。协调器在 `stopCurrentTask` 中同时设置二者。将来若只设置其中一个等待状态，审批与推迟的模型应用会失步。
- `state.busy`、`chatBusy`、`modelBusy`、`recoveryBusy`、occupancy `aborting` 是四种不同的「忙」。新增第五种等待标志应加本表一行，而不是合并布尔。

未发现同一谓词在两个所有者上对上述生产路径给出冲突结果。不要合并成一个 busy。不要按文件长度拆协调器。

## 结论

仅盘点。新的等待状态应标明扩展本表哪一行。ARCH-03／04 仍分开。
