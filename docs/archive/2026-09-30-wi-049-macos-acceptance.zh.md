# WI-049：macOS 评估与验收

[English](2026-09-30-wi-049-macos-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-049-macos-acceptance.md](2026-09-30-wi-049-macos-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 处置：2026-09-30 由代理依据本会话完成 ACTIVE 剩余任务、写收尾并提交的要求接受并关闭
- 权威：本组包必需资产切片的历史证据；不接受整份 PRD、gate 或 ADR 0005
- 范围：[批准提案](2026-09-30-wi-049-approved-proposal.zh.md)，ARCH-07
- 验收身份：代理依据维护者完成 ACTIVE 剩余任务的要求；不是维护者亲自跑过这些检查

## 批准行为与实现

`collectPackageFiles` 与 `verify:package-files` 要求宿主 JS、webview JS／CSS 与三份 helper。CI 在 compile 之后运行这些检查。`verify-vsix` 仍是解包运行通道，不由 `package:vsix` 调用。

## 自动化验证

本次关闭在当前工作树重跑 compile、lint、`verify:webview`、`verify:package-files` 与完整测试。

| 检查 | 实际结果 | 范围 |
|---|---|---|
| `npm run compile`／`npm run lint` | 通过 | 生产包与静态检查 |
| `npm run verify:webview`／`npm run verify:package-files` | 通过 | 本地 dist 资源与组包必需文件清单 |
| `npm test` | 1015 通过，0 失败／跳过 | 三项新用例：仅 JS 收集失败、有 CSS 无 helper 失败、完整合成树通过磁盘检查 |

## 原生证据

不要求。本次关闭未组包或解包生产 VSIX。

## 失败、清理与限制

- 不从 `package:vsix` 运行 `verify-vsix`。不接受 ADR 0005。无 gate。不推送。

## 最终处置

代理依据本会话完成 ACTIVE 剩余任务、写收尾并提交的要求，接受并关闭 WI-049。只接受组包缺必需资产须失败这一规则。
