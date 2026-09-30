# WI-047：macOS 评估与验收

[English](2026-09-30-wi-047-macos-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-047-macos-acceptance.md](2026-09-30-wi-047-macos-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 处置：2026-09-30 由代理依据本会话完成 ACTIVE 剩余任务、写收尾并提交的要求接受并关闭
- 权威：本输出预算切片的历史证据；不接受整份 PRD、gate 或 ADR 0005
- 范围：[批准提案](2026-09-30-wi-047-approved-proposal.zh.md)，ARCH-06
- 验收身份：代理依据维护者完成 ACTIVE 剩余任务的要求；不是维护者亲自跑过这些检查

## 批准行为与实现

序列化 `models.json` 输出在替换前提交 1 MiB 读取预算检查。超预算 pretty-print 扩大返回 `too-large`，保留原文件，不继续凭据登录。

## 自动化验证

本次关闭在当前工作树重跑 compile、lint 与完整测试。

| 检查 | 实际结果 | 范围 |
|---|---|---|
| `npm run compile`／`npm run lint` | 通过 | 生产包与静态检查 |
| `npm test` | 1009 通过，0 失败／跳过 | 三项新用例：显式超限替换、pretty-print 添加、ProviderConfig 大小限制错误且无登录 |

## 原生证据

不要求。

## 失败、清理与限制

- 不接受 ADR 0005，不改变 ADR 0007 的排除语义。无 gate。不推送。

## 最终处置

代理依据本会话完成 ACTIVE 剩余任务、写收尾并提交的要求，接受并关闭 WI-047。只接受 endpoint 写入输出预算。
