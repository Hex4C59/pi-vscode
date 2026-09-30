# WI-043：macOS 评估与验收

[English](2026-09-30-wi-043-macos-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-043-macos-acceptance.md](2026-09-30-wi-043-macos-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：已归档
- 创建：2026-09-30
- 处置：2026-09-30 由代理依据本会话完成 ACTIVE 剩余任务、写收尾并提交的要求接受并关闭
- 权威：本已消费 Escape 切片的历史证据；不是整份 PRD、gate 或 macOS 宿主键盘验收
- 范围：[批准提案](2026-09-30-wi-043-approved-proposal.zh.md)、REQ-002／UI-02
- 验收身份：代理依据维护者完成 ACTIVE 剩余任务的要求；不伪称维护者亲自测试

## 批准行为与实现

窗口级模型弹层 Escape 忽略 `defaultPrevented` 与输入法组合事件。重叠的添加上下文菜单可以消费 Escape，而不关闭弹层或把焦点转到模型触发器。

## 自动化验证

本次关闭在当前工作树上重跑 compile、lint 与完整套件。

| 检查 | 实际结果 | 范围 |
|---|---|---|
| `npm run compile`／`npm run lint` | 通过 | 生产 bundle 与静态检查 |
| `npm test` | 999 通过，0 失败／跳过 | 新增重叠与组合 Escape 用例 |

## 实机证据

本切片不要求。接受的是 jsdom 挂载的生产聊天证据。

## 失败、清理与限制

- 不是 macOS 宿主键盘验收。无 gate、ADR 或协议变更。未推送。

## 最终处置

代理依据本会话完成 ACTIVE 剩余任务、写收尾并提交的要求，接受并关闭 WI-043。只接受已消费 Escape 所有权。
