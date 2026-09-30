# WI-036：macOS 评估与验收

[English](2026-09-30-wi-036-macos-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-036-macos-acceptance.md](2026-09-30-wi-036-macos-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 处置：2026-09-30 由代理依据完成剩余任务的 goal 接受并关闭；ADR 0008 升为 Accepted
- 权威：本 owner-loss 精确 child 切片的历史证据；不接受整份 PRD、发布、gate 或每窗口独立域
- 范围：[批准提案](2026-09-30-wi-036-approved-proposal.zh.md)，REQ-005／REQ-006，[ADR 0008](../decisions/0008-owner-loss-child-cleanup.zh.md)
- 验收身份：代理依据维护者 2026-09-30 `/goal` 完成 ACTIVE 剩余任务；不是维护者亲自重跑这些检查

## 批准行为与实现

spawn 之后，宿主 IPC 断开、父 stdin 结束／关闭／错误或父 stdout 关闭／错误时，请求与显式 End 相同的有界 SIGTERM（5 秒）再 SIGKILL（5 秒）。supervisor 不以关闭 pi stdin 作为杀进程手段。匹配终态回执仍拥有退休。`release("uncertain")`、Stop 期限与活所有者 observe 不变。

实现为 `src/adapter/ownership/supervisor.ts`（`markOwnerLost` 调用 `requestOwnedChildEnd`）。

## 自动化验证

本次关闭在当前工作树重跑 compile、lint 与完整测试。

| 检查 | 实际结果 | 范围 |
|---|---|---|
| `npm run compile`／`npm run lint` | 通过 | 生产包与静态检查 |
| `npm test` | 1016 通过，0 失败／跳过，13 359 ms | 含 supervisor IPC 断开、父 stdin 结束与 stdout destroy 结束精确 child 且不关闭其 stdin；活所有者 observe、显式 End 与 initialize 前 never-spawned 仍通过 |

## 原生证据

macOS 27.0.0（arm64）。本切片原先的原生证据是真实 Node supervisor worker 进程。窗口崩溃 F5 与隔离安装版 VSIX 已于 2026-09-30 补录：SIGKILL 某一窗口的 `node.mojom.NodeService` 所有者结束该域精确 `pi` child（`child-exited`）；兄弟仍为 `owned`。[证据](2026-09-30-macos-verification-acceptance.zh.md)。

## 失败、清理与限制

- 精确 child 退出不证明工具后代、脱离进程组或文件回滚。
- 每窗口独立域已实现（WI-058／ADR 0009）。
- 不关闭 gate。未 Git 提交或推送。

## 最终处置

代理依据完成剩余任务的 goal 接受并关闭 WI-036，将 ADR 0008 升为 Accepted。只接受宿主丢失时清理精确自有 child。
