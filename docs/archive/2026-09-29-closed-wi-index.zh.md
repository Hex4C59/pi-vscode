# 已关闭工作项编号索引

[English](2026-09-29-closed-wi-index.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-29-closed-wi-index.md](2026-09-29-closed-wi-index.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-29
- Type: Reference
- Status: Archived
- Authority: 仅历史查找；现行工作见 [`ACTIVE.md`](../../ACTIVE.md)

## 替代原因

2026-09-29 维护者要求压缩 ACTIVE。已完成 WI 表已变成会话入口目录。编号查找归此处；ACTIVE 只保留短指针和最近关闭的一行。压缩本身不关闭 WI-023／024／026，不改 gate 或 ADR，不授权提交。同日稍后维护者确认这三项的 F5 视觉接受，对应行见下表。

早期行里仍写 gate Open 的，是该 WI 验收当日的快照，不是当前状态。现行六项架构 gate 均为 Accepted，见 ADR 0001 与 ADR 0004。

## 用法

打开链接记录查看范围、证据和限制。不要按本表实施。按文件罗列的归档目录仍在 [归档 README](README.zh.md)。

## 已关闭 WI 查找

| WI | 结果 | 完成／验收 | 历史 |
|----|------|------------|------|
| WI-001 | 扩展壳、辅助侧栏与 RPC 探针；ADR 0001 | 2026-09-19 | [记录](2026-09-21-closed-wi-history.zh.md) |
| WI-002 | 版本化 ping/pong Webview 桥 | 2026-09-19 | [记录](2026-09-21-closed-wi-history.zh.md) |
| WI-003 | Project trust 技术 spike；当时快照仍写 gate Open | 2026-09-19 | [记录](2026-09-21-closed-wi-history.zh.md) |
| WI-004 | REQ-004 最小流式聊天；当时快照仍写 gate Open | 2026-09-21 | [记录](2026-09-21-closed-wi-history.zh.md) |
| WI-005 | 文档健康第一阶段 | 2026-09-19 | [记录](2026-09-21-closed-wi-history.zh.md) |
| WI-006 | 工作区与项目资源选择 UI | 2026-09-21 | [记录](2026-09-21-closed-wi-history.zh.md) |
| WI-007 | 根据资源选择启动 pi RPC | 2026-09-21 | [记录](2026-09-21-closed-wi-history.zh.md) |
| WI-008 | 模型选择／就绪、故障／审批／Stop、认证错误安全与必要实机修复 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；WI-009及广泛gates不自动关闭 | [记录](2026-09-28-wi-008-model-acceptance.zh.md) |
| WI-009 | thinking能力／下一轮意图、审批／Stop／退出恢复、键盘焦点与短窗错误修复 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；完整REQ／广泛gates不自动关闭 | [记录](2026-09-28-wi-009-thinking-acceptance.zh.md) |
| WI-010 | thinking／受控工具／Stop 四项 F5 已确认；限定切片关闭，当时 ADR pending／gate Open | 2026-09-21 | [记录](2026-09-21-closed-wi-history.zh.md) |
| WI-010 剩余边界／原Goal | 三项剩余gate、ADR0004、Living契约、实际分层验证与全局收尾 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估 | [记录](2026-09-28-wi-010-goal-closure.zh.md) |
| WI-011 | 模块内测试迁移、递归 runner 与 scripts 分组；限定技术切片收尾 | 2026-09-22 | [记录](2026-09-21-closed-wi-history.zh.md) |
| WI-012 | 最小 P1–P3 探针切片关闭；P3／完整兼容缺口保留，不是产品验收 | 2026-09-22 | [记录](2026-09-21-closed-wi-history.zh.md) |
| WI-013 | 受信扩展加载、标准交互、工具审批与自有runtime恢复；ADR0002 Accepted | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；广泛gates当时保持Open | [记录](2026-09-28-wi-013-acceptance.zh.md) |
| WI-014 | 显式文件／选区混合附件、逐项确认、完整预览／历史／容量恢复与丢失提示 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；审阅／会话及广泛gates不自动关闭 | [记录](2026-09-28-wi-014-attachment-acceptance.zh.md) |
| WI-015 | React／TypeScript／Vite 迁移验收；ADR 0003 Accepted | 2026-09-27 UTC 代理按本次委托完成评估；广泛 gates 当时保持 Open | [记录](2026-09-27-wi-015-react-acceptance.zh.md) |
| WI-016 | 受控dirty保护／准确readonly历史diff、分页及丢失恢复；短窗裁切红→绿 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；WI-017与广泛gates仍独立 | [记录](2026-09-28-wi-016-review-acceptance.zh.md) |
| WI-017 | 当前项目／CLI-origin会话、顺序交接、原文历史与异常恢复；trusted默认重置红→绿 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；广泛gates独立 | [记录](2026-09-28-wi-017-session-acceptance.zh.md) |
| WI-019 | Q16 委托评估、共享正式 chat、实机浮层／资源修复与独立 F5／安装验收 | 2026-09-27 UTC 代理按本次委托完成评估；ADR／gates 不自动关闭 | [记录](2026-09-27-wi-019-formal-chat.zh.md) |
| WI-020 | 跨模块公共入口与模块类型契约；唯一 P2 已修复，双轴零发现 | 2026-09-26 维护者技术验收；ADR／gate 不变 | [记录](2026-09-26-wi-020-public-entries.zh.md) |
| WI-021 | REQ-004 retry／compaction／可靠终态与必要 focus 回退修复；原生 F5／安装分别验证 | 2026-09-27 UTC 代理按本次委托完成评估；gates 不变 | [记录](2026-09-27-wi-021-execution-closure.zh.md) |
| WI-022 | Windows后台终端闪现；默认CLI `--no-daemon` 规避，维护者确认关闭 | 2026-09-28 维护者确认已解决 | [记录](2026-09-28-wi-022-closure.zh.md) |
| WI-023 | 设置布局与模型选择器可见；维护者 F5 视觉验收。记录中的剩余项只有这次 F5 | 2026-09-29 维护者确认；安装 VSIX 不在本次证据内 | [记录](2026-09-28-wi-024-paused-proposal.zh.md) |
| WI-024 | 扩展内 API Key 与默认模型；维护者 F5 视觉验收设置分区、Add key 与模型选择器恢复 | 2026-09-29 维护者确认；OAuth、自定义端点、付费调用和安装 VSIX 不在本次接受内 | [记录](2026-09-28-wi-024-paused-proposal.zh.md) |
| WI-025 | 侧栏视觉工艺、准备阶段修正与启动前强度；维护者 F5 视觉验收 | 2026-09-29 维护者确认；VSIX／真实模型完整链不在本次验收证据内 | [记录](2026-09-29-wi-025-active-superseded.zh.md) |
| WI-026 | 编辑区设置页方案 A；维护者 F5 视觉验收 | 2026-09-29 维护者确认；安装 VSIX 不在本次证据内 | [记录](2026-09-29-wi-026-active-superseded.zh.md) |

## 不在本索引

- **WI-018** 从未登记，不再使用。
