# WI-050：macOS 评估与验收

[English](2026-09-30-wi-050-macos-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-050-macos-acceptance.md](2026-09-30-wi-050-macos-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 处置：2026-09-30 由代理依据本会话完成 ACTIVE 剩余任务、写收尾并提交的要求接受并关闭
- 权威：本规格命名切片的历史证据；不接受整份 PRD、gate 或 ADR
- 范围：[批准提案](2026-09-30-wi-050-approved-proposal.zh.md)，TOOL-02
- 验收身份：代理依据维护者完成 ACTIVE 剩余任务的要求；不是维护者亲自跑过这些检查

## 批准行为与实现

已收集 `tests/` 目录下的应用规格必须使用 `.spec.ts`。同目录 `.spec.tsx` 使发现失败，不会映射进 `dist/tests`。现有生产规格未使用该后缀。

## 自动化验证

本次关闭在当前工作树重跑 compile、lint 与完整测试。

| 检查 | 实际结果 | 范围 |
|---|---|---|
| `npm run compile`／`npm run lint` | 通过 | 生产包与静态检查 |
| `npm test` | 1016 通过，0 失败／跳过 | 一项新用例：已收集 `.spec.tsx` 发现失败并指出路径 |

## 原生证据

不要求。

## 失败、清理与限制

- 不增加 TSX 规格执行。不重启逐断言审计。无 gate。不推送。

## 最终处置

代理依据本会话完成 ACTIVE 剩余任务、写收尾并提交的要求，接受并关闭 WI-050。只接受拒绝 `.spec.tsx` 这一命名约束。
