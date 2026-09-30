# WI-041：macOS 评估与验收

[English](2026-09-30-wi-041-macos-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-041-macos-acceptance.md](2026-09-30-wi-041-macos-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：已归档
- 创建：2026-09-30
- 处置：2026-09-30 由代理依据本会话完成 ACTIVE 剩余任务、写收尾并提交的要求接受并关闭
- 权威：本解析器关联切片的历史证据；不是整份 PRD、gate、真实 worker 发帧或所选会话切换的接受
- 范围：[批准提案](2026-09-30-wi-041-approved-proposal.zh.md)、REQ-008／CORE-02
- 验收身份：代理依据维护者完成 ACTIVE 剩余任务的要求；不伪称维护者亲自测试

## 批准行为与实现

inspect 拒绝不同会话 id。history 拒绝不同页码。preview 拒绝不同 offset、非终态零推进，以及仍有剩余字符却标记结束。list 仍拒绝不同页码。

## 自动化验证

本次关闭在当前工作树上重跑 compile、lint 与完整套件。

| 检查 | 实际结果 | 范围 |
|---|---|---|
| `npm run compile`／`npm run lint` | 通过 | 生产 bundle 与静态检查 |
| `npm test` | 995 通过，0 失败／跳过 | 新增一项关联／游标用例，覆盖五条反例与 list 错页对照 |

## 实机证据

本切片不要求。不宣称真实 worker 会发出这些帧。

## 失败、清理与限制

- 接受的是解析器准入不变量。下游 UI／会话选择未改。
- 无协议版本、gate 或 ADR。未推送。

## 最终处置

代理依据本会话完成 ACTIVE 剩余任务、写收尾并提交的要求，接受并关闭 WI-041。只接受请求关联与预览游标不变量。
