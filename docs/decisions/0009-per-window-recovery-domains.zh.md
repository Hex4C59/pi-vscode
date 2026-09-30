# ADR 0009：每窗口独立恢复域

[English](0009-per-window-recovery-domains.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[0009-per-window-recovery-domains.md](0009-per-window-recovery-domains.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：ADR
- 状态：Accepted
- 创建：2026-09-30
- 决定批准：2026-09-30 维护者 `/goal` 完成停车场全部任务并按最佳方案实施
- 验证：2026-09-30，代理依据该要求接受；compile／lint、1027 项自动化测试（含双域同时 reserve、兄弟扫描上限与外域交接隔离）；[分层证据与限制](../archive/2026-09-30-wi-058-macos-acceptance.zh.md)
- Gate：不关闭 gate。只取代 ADR 0002 的共享域单运行时准入。ADR 0006 先观察再结束、ADR 0008 精确 child 清理与会话内 Stop／协议恢复仍有效。
- 工作项：WI-058 按批准范围接受并关闭
- 相关：[ADR 0002](0002-interaction-contract-route.zh.md)、[ADR 0006](0006-owned-runtime-handoff.zh.md)、[ADR 0008](0008-owner-loss-child-cleanup.zh.md)

## Context

ADR 0002 在共享 `globalStorageUri/recovery-v1` 域同一时间只准入一个 Pi runtime，避免发明窗口身份。同一文件夹上两个窗口即使宿主都活着也会互相挡住。维护者要求清空停车场并实施剩余产品选择：独立域。

VS Code 没有稳定窗口 id。`vscode.env.sessionId` 不是已证实的每窗口键。变更后共享根上的遗留 fence 仍需 ADR 0006 交接。

## Decision

1. **每个扩展宿主一个域。** 激活时分配仅内存 UUID，fence 写在 `recovery-v1/windows/<uuid>/`。占用只表示本窗口域已有 fence，不表示存在另一窗口。
2. **外域清理先观察再结束。** 本窗口交接前，尽力扫描遗留共享根和最多 32 个兄弟 UUID 目录。活的 `owned` 运行不结束。`owner-lost` 走 ADR 0006。外域失败不阻塞本窗口。
3. **披露并发写入。** 两窗口可对同一文件夹跑两个 pi。受信加载文案与原生确认警告它们可能同时改文件。
4. **安全边界不变。** 精确 child 回执、会话内 `release("uncertain")`、不以 stdin 作为杀进程、不证明后代、不升级 `recovery-v1` schema 版本。

## Rationale

内存 UUID 加有界兄弟扫描即可去掉跨窗口互斥，而不伪造稳定窗口注册表。遗留根交接仍退休变更前的 leftover。文件竞争诚实披露是并发 agent 的产品代价。

## Alternatives considered

- 保留共享单运行时域：被本次停车场产品选择拒绝。
- 用 `vscode.env.sessionId` 当目录名：拒绝；未证实为每窗口键。
- 把窗口 id 持久化到 globalState：拒绝；reload 会复用已死宿主的域，混淆活所有者与 owner-lost。
- 无界目录扫描或进程组 kill：拒绝；保持 32 目录预算和 ADR 0008 精确 child 边界。

## Consequences

第二窗口可在第一窗口仍运行时启动自己的 runtime。它们可能编辑同一工作区文件。Reload 分配新 UUID；旧目录成为兄弟并按 owner-lost 交接。双窗口 macOS F5 与隔离安装版已于 2026-09-30 记录。本 ADR 不关闭 gate。
