# WI-042：macOS 评估与验收

[English](2026-09-30-wi-042-macos-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-042-macos-acceptance.md](2026-09-30-wi-042-macos-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：已归档
- 创建：2026-09-30
- 处置：2026-09-30 由代理依据本会话完成 ACTIVE 剩余任务、写收尾并提交的要求接受并关闭
- 权威：本展示身份切片的历史证据；不是整份 PRD、gate、协议或运行时选择的接受
- 范围：[批准提案](2026-09-30-wi-042-approved-proposal.zh.md)、REQ-002／UI-01
- 验收身份：代理依据维护者完成 ACTIVE 剩余任务的要求；不伪称维护者亲自测试

## 批准行为与实现

选择器优先唯一的 canonical `provider / modelId` 匹配，因此标签等于该组合的第二项不会同时被选中。同名标签且当前模型为 canonical 时仍只选中一个 radio。

## 自动化验证

本次关闭在当前工作树上重跑 compile、lint 与完整套件。

| 检查 | 实际结果 | 范围 |
|---|---|---|
| `npm run compile`／`npm run lint` | 通过 | 生产 bundle 与静态检查 |
| `npm test` | 997 通过，0 失败／跳过 | 新增两项挂载碰撞／同名标签用例 |

## 实机证据

本切片不要求。接受的是 jsdom 挂载的生产聊天证据。

## 失败、清理与限制

- 宿主 `chatModel` 仍是运行时显示标签；唯一性是选择器展示不变量。
- 无 gate、ADR 或协议变更。未推送。

## 最终处置

代理依据本会话完成 ACTIVE 剩余任务、写收尾并提交的要求，接受并关闭 WI-042。只接受已应用 radio 唯一性。
