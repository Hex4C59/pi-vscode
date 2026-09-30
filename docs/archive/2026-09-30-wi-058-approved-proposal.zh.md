# WI-058：每窗口恢复域范围批准

[English](2026-09-30-wi-058-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-058-approved-proposal.md](2026-09-30-wi-058-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 创建：2026-09-30
- 权威：历史批准范围，不是新的 Build 授权
- 归档原因：WI-058 实现与自动化证据完成；最终处置归[验收记录](2026-09-30-wi-058-macos-acceptance.zh.md) 与 [ACTIVE](../../ACTIVE.md)。

## Approval and Traceability

维护者 `/goal` 完成停车场全部任务授权本 Build。用户可见：每个 VS Code 窗口各自准入运行时。追溯 REQ-005／006。批准后写 ADR 0009。

## Goal and Scope

用 `recovery-v1/windows/<uuid>/` 取代 ADR 0002 共享域准入。扫描遗留共享根和最多 32 个兄弟窗口目录做 owner-lost 交接。不结束活的 `owned` 兄弟。披露并发改文件。保留 ADR 0008 精确 child 清理与会话内 Stop。

## Approach

每次 activate 仅内存 `randomUUID()`。先 `handoffForeignRecoveryDomains`，再本窗口 managed-process 交接。占用文案点名本窗口域。受信 UI 与原生确认警告同一文件夹上的两个 agent。

## Acceptance

两个独立 store 可同时 reserve。兄弟列表跳过当前 id 与非法名，上限 32。外域交接失败不阻塞本窗口。compile／lint／完整 `npm test`。未跑的双窗口 macOS F5 记为未验证。

## Subsequent Limits

不实现 Chat Participant、remote／multi-root、跳过审批、换框架、公开发布，不提交 Git。
