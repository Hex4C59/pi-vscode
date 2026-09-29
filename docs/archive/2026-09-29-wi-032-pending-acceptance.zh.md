# WI-032 — 凭据样式统一（待接受）

[English](2026-09-29-wi-032-pending-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-29-wi-032-pending-acceptance.md](2026-09-29-wi-032-pending-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-29

- 类型：Reference
- 状态：Archived
- 创建：2026-09-29
- 权威：保留已批准提案与交接；当前工作见 [ACTIVE](../../ACTIVE.md)

## 最终状态

2026-09-30 代理依维护者最终委托接受并关闭批准切片，不再要求维护者独立签认。见[接受记录](2026-09-30-wi-032-macos-evaluation.zh.md)。下文待接受措辞仅为历史，不是当前阻塞。

## 保留原因

维护者于 2026-09-29 优先实施 WI-033。WI-032 移出唯一当前工作，未关闭、未接受；ACTIVE 保留待接受事项。无新 gate、无新 ADR；Decision：none。PRD 保持 Draft。

## 已批准范围与验收

维护者授权实现，随后要求提交。六处宿主入口共用 [contracts](../../src/extension/contracts/index.ts) 中的纯规则 `containsCredentialLikeText`（拒收）与 `redactCredentialLikeText`（打码）：运行时对话取消、反馈用固定安全句、活动／最终文本打码、工具审批拒绝且不发卡、审阅快照不可用、附件拒收敏感文本。规则是既有私钥标记、凭据字段赋值和 Bearer 值的并集，包括空格后没有值的字段赋值。用户主动填写的对话回答仍原样回传。

纯契约由宿主拥有，适配层消费。原有长度限制、生命周期及各入口拒绝结果保留。普通上下文继续展示，私钥标记隐藏整段展示文本。过滤仅尽力识别，不能证明秘密绝不会进入 Webview。这是用户可见的一致性修复，不新增能力或架构边界。

验收覆盖六处结果、普通文本、用户回答及打码后的展示截断。历史会话打码、认证错误分类、敏感路径规则、模型设置、其他秘密处理和已提交的 WI-031 均在范围外。

## 历史交接

实现及自动检查已完成：compile、lint 通过；npm test 782 项通过、无失败或跳过；docs:verify 无错误，有两条既有 ADR 0005 Draft 警告；git diff --check 通过。F5／安装 VSIX 未做，维护者接受仍待定。维护者要求提交但不推送；这些是历史检查，不是 WI-033 证据。
