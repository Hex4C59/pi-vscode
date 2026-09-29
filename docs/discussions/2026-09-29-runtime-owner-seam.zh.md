# 运行时适配层：只留一种托管进程接法

[English](2026-09-29-runtime-owner-seam.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-29-runtime-owner-seam.md](2026-09-29-runtime-owner-seam.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-29

- 类型：讨论
- 状态：WI-028 实现；下方早期设计已由明确批准的进程策略计划取代
- 创建：2026-09-29
- 权威：**仅作上下文**——不覆盖 [`ACTIVE.md`](../../ACTIVE.md)、PRD 或 ADR 0001–0004
- 相关：[ADR 0002](../decisions/0002-interaction-contract-route.zh.md)（托管运行时恢复）、[架构](../architecture/vscode-extension-architecture.zh.md)

## 背景

2026-09-29 对 `src/adapter/` 的架构审查发现：`src/adapter/runtime/pi-rpc-runtime.ts` 中的 `createPiRpcRuntime` 支持两种进程模式，并在 21 处判断 `environment.owner`：

- **托管**（生产）：`src/extension.ts` 总会传入 `RuntimeOwner`。停止不确定时只标记未确认，不自动结束，符合 ADR 0002。
- **不托管**：运行时自己起 pi，停止或出错时先 SIGTERM 再 SIGKILL，并当作已确认。没有产品路径使用它，只有 runtime 测试和 `scripts/spikes/spike-attachment.mjs` 在用。

后果：两套停止语义缠在一个 750 行的闭包里；错误文案写两遍；若干测试（`session-runtime`、`attachment-transport`、`review-events`、部分 `trusted-runtime`）验证的是不发布的模式；runtime 测试里有五份手写的假子进程或假 owner。ADR 0002 规定的"放弃"动作（断开、排空 stdout/stderr、绝不关闭 stdin）在 `pi-rpc-runtime.ts:298-299`、`:360-362` 与 `launch-supervisor.ts:33-35` 重复出现。

## 早期已确认设计（已取代）

1. **删除不托管路径。** `PiRpcRuntimeEnvironment.owner` 改为必填。删除 `spawn` 注入、运行时自己的 `stopChildProcess` 以及所有 `environment.owner` 分支。测试用内存假 owner，生产用真实 `RuntimeOwner`；两种实现使这个分界成立。
2. **冻结生产行为。** 托管模式行为完全不变，包括错误文案、干净停止时 `end()` → `recover()` 的顺序、忙碌时停止标记未确认，以及 `shutdownUnconfirmed` 阻止下一次启动。过程中发现的可疑语义单独记录，不在本切片修改。
3. **记录。** 记录于 WI-027 仍为 Build 时：只做设计，登记停车场，不另开 WI，不改应用代码。开启该 WI 须维护者明确要求。
4. **收窄启动结果。** `RuntimeOwner.launch` 返回 `RuntimeLink` `{ stdin, stdout, onLost(cb), abandon() }`，不再返回 `ChildProcess`。放弃动作只写在 ownership 里。运行时拿不到 `kill()`，"不自动结束"由类型保证。
5. **由 owner 决定如何放开。** 运行时只判断这次停止是否干净，并调用 `RuntimeOwner.release({ clean }): Promise<{ confirmed: boolean }>`。干净时 owner 执行 `end` → `recover`，否则执行 `abandon`。`end`、`recover` 保留给用户显式的"结束 / 恢复"操作。运行时保留 `shutdownUnconfirmed` 及其文案。
6. **Spike。** `spike-attachment.mjs` 提供一个脚本内的小 owner，直接起 pi；`end`/`recover` 不做事，`abandon` 只排空输出。spike 继续验证附件帧与应答时序，不验证托管。
7. **断言直接杀进程的测试。** `session-runtime.spec.ts:53`、`attachment-transport.spec.ts:50` 与 `:71` 改写为托管语义（不杀进程、不调 `end`、运行时被挡住、需要显式恢复）；若 `trusted-runtime.spec.ts` 已覆盖相同托管场景则删除。
8. **一个夹具。** `src/adapter/runtime/tests/fake-owner.ts`（非 spec 辅助文件）取代五份假实现：可按类型覆盖或挂起的 pi 应答；记录发出的帧与 `release`/`abandon`/`end`/`recover` 调用；注入帧与断开连接；可延迟的 `launch`。测试只从 `createPiRpcRuntime` 进入。
9. **命名。** `RuntimeLink`、`release({ clean })`、`abandon`。仅为实现名称，不进 `CONTEXT.md`。
10. **范围。** 只做本项。删除 `PiRuntimeLifecycle.prompt()`、把交互类型挪进 `contracts/` 另行处理（见下文）。宿主（`src/extension/`）不动。
11. **验收。** `npm run compile`、`npm run lint`、`npm test`，全部托管模式用例通过；手动跑一次 `scripts/spikes/spike-attachment.mjs`；维护者 F5 冒烟：启动并发送、干净替换（切换配置或会话）、任务中 Stop、停止未确认后"结束 + 恢复"、重新加载窗口后恢复栅栏仍在。不做安装 VSIX 验收：打包清单不变。

## 证据

- 生产装配：`src/extension.ts:10-11`（`createRuntimeOwner` → `createPiRpcRuntime({ owner })`）。宿主从不直接调用 `RuntimeOwner`，四个方法都经运行时转手。
- 仅不托管模式的使用者：`src/adapter/runtime/tests/{attachment-transport,session-runtime,review-events,trusted-runtime}.spec.ts`、`scripts/spikes/spike-attachment.mjs:43`。
- 现有假实现：`trusted-runtime.spec.ts:8-61`、`runtime-cancellation.spec.ts:9-43`，以及另外三个 runtime spec 中的假 `spawn`。

## 审查的其他发现（未确认，无决定）

记下来，免得下次审查从头再找：

- `createPiRpcRuntime` 内部可分为请求应答配对、帧翻译、任务忙闲三块；"空闲 / 能发送"定义了四次（`stop`、`checkpointRestart`、`prompt`、`preparePrompt`）。本切片之后更好做。
- 会话 worker 协议（请求类型、上限、校验）在 `sessions/pi-session-backend.ts` 与 `sessions/sessionWorker.ts` 各写一份，已漂移（历史页大小一边是字面量 `32`，一边是 `HISTORY_PAGE_SIZE`）。
- 凭据样式正则在 `src/adapter/runtime/` 与 `src/extension/` 共复制六份，已漂移（`activityProjection.ts` 的打码缺 `authorization` 与私钥规则）。
- 托管控制消息（`initialize`、`spawned`、控制请求 / 应答）两侧各自手写校验；`control-protocol.ts` 只管 socket 路径。
- 生产宿主不使用 `PiRuntimeLifecycle.prompt()`（`src/extension/tests/harness.ts:132-137` 仍在用）；八个生命周期方法标为可选，但生产全部实现。
- `pi-rpc-runtime.ts:5` 与 `rpc-dialogs.ts:1` 从 `src/extension/interactions/` 而非 `contracts/` 引入类型。
- SIGTERM → SIGKILL 辅助函数有四份，有的等 `close`，有的等 `exit`。ADR 0002 区分两者，合并时必须保留这一区别。

## 早期倾向（历史）

设计已定，留给之后的技术 WI。开启时，若架构文档描述了 `RuntimeOwner` 的形状，同步更新适配层一行。无 ADR：本项删除未发布的模式并收窄内部分界以落实 ADR 0002，不改变信任、托管或恢复语义。

## 当前 WI-028 决定与证据

维护者在本轮明确要求实施完整进程策略计划，取代早期设计第 1、4–6、10–11 项：`PiRpcRuntimeEnvironment.process` 必填；`RuntimeOwner` 保持原状，由托管策略组合；显式直接策略仍供 Linux attachment spike 使用。生产入口装配托管策略。按维护者单独确认，各策略统一采用生产五秒 RPC Stop 观察预算。策略专属失败文案取代 RPC 中的 owner 分支。共享内存进程取代普通假子进程夹具；原生进程策略与托管／RPC 组合另行测试。

WI-027 已有实现与自动化证据，仍待维护者关闭；其提案与待确认事项保留在 ACTIVE，WI-028 成为唯一当前工作。Decision：none；无新产品范围、协议、持久化、依赖或架构 gate 接受。

| 架构维度 | 结论 | 证据／剩余限制 |
|---|---|---|
| 1–5：分解、接口、依赖、契约、所有权 | pass | 必填 RuntimeProcess 与窄 RuntimeLink；托管／直接策略拥有进程清理；生产依赖图排除 direct／tests。 |
| 6–11：范围、身份、状态、并发、失败、生命周期 | 自动化层 pass | 既有 RPC 测试及 process-strategies、runtime-cancellation 覆盖五秒 Stop、延迟启动、返回后接入前间隙、释放串行化、失败屏障与显式恢复。 |
| 12–15：安全、持久化、隐私、上限 | 保持 | ADR0002 栅栏／回执 owner 不变；无新 UI 能力、原始 stderr 投影或重试；直接进程关闭有界。 |
| 16–18：测试、构建、兼容 | 自动化证据；运行时缺口 | 当前命令／结果在 ACTIVE；Linux 隔离 attachment probe 无法在此 Mac 运行。无包／版本／schema 改动。 |
| 19：UX／无障碍 | 本技术切片 N/A | 生产用户可见语义不变；未做 F5 与安装 VSIX。 |

成熟度：已实现并有自动化回归证据；不新增真实 pi、宿主或安装包接受。compile／lint／test 与文档检查的实际结果记录在 ACTIVE。spike 验证 bundle 单独构建；构建不等于执行 Linux 隔离探针。
