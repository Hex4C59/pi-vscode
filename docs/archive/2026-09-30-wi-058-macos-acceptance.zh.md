# WI-058：macOS 评估与验收

[English](2026-09-30-wi-058-macos-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-058-macos-acceptance.md](2026-09-30-wi-058-macos-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 处置：2026-09-30 由代理依据完成停车场任务的 goal 接受并关闭
- 权威：本每窗口恢复域切片的历史证据；不接受整份 PRD、gate 或其他 OS
- 范围：[批准提案](2026-09-30-wi-058-approved-proposal.zh.md)，[ADR 0009](../decisions/0009-per-window-recovery-domains.zh.md)
- 验收身份：代理依据维护者 `/goal` 完成停车场全部任务；不是维护者亲自跑过这些检查

## Approved Behavior and Implementation

激活把本窗口 fence 写在 `recovery-v1/windows/<uuid>/`。第二窗口使用不同 UUID，可同时 reserve。启动尽力交接遗留共享根和兄弟窗口目录，不结束活的 `owned` 运行。占用启动文案点名本窗口域。受信加载文案与原生确认披露两窗口可能改同一批文件。

## Automated verification

本次关闭在当前工作树重跑 compile、lint 与完整测试。

| Check | Actual result | Scope |
|---|---|---|
| `npm run compile` | exit 0 | esbuild + 三份 `tsc --noEmit` |
| `npm run lint` | exit 0 | `eslint src` |
| `npm test` | 1027 通过，0 失败／跳过，12 583 ms | 双域 reserve、兄弟跳过／上限、外域交接隔离、占用文案、受信配置 UI |
| 双窗口 macOS F5／安装版 VSIX | 2026-09-30 已记录 | 两个活宿主、一个隔离文件夹；[原生证据](2026-09-30-macos-verification-acceptance.zh.md) |

## Limits

未把 `vscode.env.sessionId` 当窗口键。最多扫描 32 个兄弟目录。外域清理尽力而为。精确 child 诚实披露、会话内不确定与后代非声明不变。不提交 Git。
