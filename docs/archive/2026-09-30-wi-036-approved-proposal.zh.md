# WI-036：宿主丢失时清理精确自有子进程范围批准

[English](2026-09-30-wi-036-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-036-approved-proposal.md](2026-09-30-wi-036-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 创建：2026-09-30
- 权威：历史批准范围，不是新的 Build 授权
- 归档原因：WI-036 实现与所需证据完成；最终处置归[验收记录](2026-09-30-wi-036-macos-acceptance.zh.md)、[ADR 0008](../decisions/0008-owner-loss-child-cleanup.zh.md) 与 [ACTIVE](../../ACTIVE.md)。

## 批准与追溯

维护者 `/goal` 完成 ACTIVE 剩余任务，进入已记录的 WI-036 Build 切片。用户可见：REQ-005／REQ-006。决策类 `adr-after-approval` → ADR 0008。不接受整份 Draft PRD，不改 gate。本 goal 未授权 Git 提交或推送。原生平台：macOS；Windows F5／安装版 VSIX 范围外。

## 目标与范围

宿主释放、崩溃或 IPC／管道丢失时，supervisor 对本 run 精确自有 child 走既有 SIGTERM（5 秒）再 SIGKILL（5 秒），观察到 exit 后写回执。随后 ADR 0006 启动交接可退休 fence。有序 `dispose`／idle `stop` 仍走 end＋recover。不关闭 child stdin 作为杀进程手段。不终止其他窗口、终端或外部进程。

## 方案

已 spawn 时 `markOwnerLost` 请求与显式 End 相同的 `beginTermination`。控制面已就绪且尚未 spawn 时仍记 never-spawned。共享 `recovery-v1`、单域准入、活所有者保护、会话内 Stop／协议不确定与 ADR 0006 先观察再 end 不变。无每窗口独立域、不取消共享单运行时、不迁移 `recovery-v1`。

## 验收

真实 supervisor 子进程：IPC 断开、父 stdin 结束、stdout destroy 均使精确 child 退出并留下匹配回执，且不关闭 child stdin。活所有者 observe 不结束 child。显式 End 与 initialize 前 disconnect 的 never-spawned 仍通过。compile／lint／完整测试。VS Code 窗口崩溃 F5 与安装版 VSIX 若未跑则标明未验证。

## 后续限制

每窗口独立域、会话内 Stop 自动 kill、killpg、任意 PID、未决 fence 迁移、gate 与 Git 提交仍范围外。信号发送或 child exit 不证明后代已停。
