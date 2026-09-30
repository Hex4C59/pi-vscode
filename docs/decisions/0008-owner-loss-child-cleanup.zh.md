# ADR 0008：宿主丢失时结束精确自有子进程

[English](0008-owner-loss-child-cleanup.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[0008-owner-loss-child-cleanup.md](0008-owner-loss-child-cleanup.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：ADR
- 状态：Accepted
- 创建：2026-09-30
- 决定批准：2026-09-30 维护者 `/goal` 完成 ACTIVE 剩余任务，进入已记录的 WI-036 Build 切片
- 验证：2026-09-30，代理依据该要求接受；compile／lint、1016 项自动化测试，以及 IPC 断开、父 stdin 结束与 stdout 管道丢失的真实 Node supervisor 进程测试；[分层证据与限制](../archive/2026-09-30-wi-036-macos-acceptance.zh.md)
- Gate：不关闭 gate。只取代 ADR 0002 在 owner-loss 时保留精确 child 存活的规则。ADR 0006 启动交接与会话内恢复仍有效。共享域准入后来由 [ADR 0009](0009-per-window-recovery-domains.zh.md) 取代。
- 工作项：WI-036 按批准范围接受并关闭
- 相关：[ADR 0002](0002-interaction-contract-route.zh.md)、[ADR 0006](0006-owned-runtime-handoff.zh.md)

## Context

ADR 0002 在宿主丢失后继续观察精确 pi child，并不终止它。后续宿主仍可通过 ADR 0006 启动交接清理，但中间 child 会继续跑。维护者要求断开或崩溃时按 Codex 方向清理本宿主自有进程。pi 0.86.1 没有停止工具后代的公开 API；macOS 上 `child.kill` 只针对精确 child。每窗口独立恢复域当时是单独产品选择，现为 [ADR 0009](0009-per-window-recovery-domains.zh.md)。

## Decision

1. **宿主丢失即结束精确 child。** supervisor 在 spawn 之后检测到宿主 IPC 断开、父 stdin 结束／关闭／错误，或父 stdout 关闭／错误时，走与显式 End 相同的有界 SIGTERM（5 秒）再 SIGKILL（5 秒）。不以关闭 pi stdin 作为杀进程手段。
2. **回执仍拥有退休。** 信号发送不是退出。精确 child 退出后 supervisor 写匹配终态回执；spawn 前丢失则 `never-spawned`。未确认退出仍为 `termination-unconfirmed`。ADR 0006 仍在下次激活时先观察再结束，仍拒绝结束另一窗口的活 `owned` 运行。
3. **会话内不确定不变。** managed-process `release("uncertain")` 仍断开而不自动结束 child。Stop 期限仍不自动 kill。撤销信任仍不自动 kill。
4. **对后代保持诚实。** 精确 child 退出不证明工具子进程、脱离进程组或文件回滚。本切片不加入进程组 kill。

## Rationale

宿主已走而 child 仍跑，就是遗留进程事件。复用既有 End 路径避免第二套终止协议。本切片当时拒绝独立域和 killpg；独立域后来由 ADR 0009 接受。

## Alternatives considered

- 保持只观察的 owner-loss，依赖下一宿主 ADR 0006 交接：拒绝；下一窗口打开前 child 一直跑。
- 杀死进程组／全部后代：拒绝；无公开 pi API，也无已验证的 macOS 树边界。
- 每窗口恢复域：本切片推迟；后来由 [ADR 0009](0009-per-window-recovery-domains.zh.md) 接受。

## Consequences

丢失宿主时会在无对话框的情况下中断其精确 pi child。后续激活可退休匹配回执并显示正常页。失败或未确认清理仍阻塞替代。工具后代可能仍在。VS Code 窗口崩溃 F5 与安装版 VSIX 证据与 supervisor 进程测试分开记录；本 ADR 不接受整份 Draft PRD，也不关闭 gate。
