# WI-035：遗留运行时交接批准范围

[English](2026-09-30-wi-035-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-035-approved-proposal.md](2026-09-30-wi-035-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 创建：2026-09-30
- 权威：历史批准范围，不是新的 Build 授权
- 归档原因：WI-035 实现与所需证据完成；最终处置归[验收记录](2026-09-30-wi-035-macos-acceptance.zh.md)、[ADR 0006](../decisions/0006-owned-runtime-handoff.zh.md) 与 [ACTIVE](../../ACTIVE.md)。

## 批准与追溯

维护者于 2026-09-30 要求先完成停车场的遗留运行时交接，批准 WI-035 Build；后续明确选择按本次授权由代理验收并将 ADR 0006 转 Accepted。本 WI 追溯 REQ-005／REQ-006，不接受整份 Draft PRD，不改变 gate。没有 Git 提交或推送授权。所需原生平台为 macOS VS Code；Windows 原生 F5／安装验证在本验收范围外。

## 目标与范围

恢复域记录着上一宿主失去所有者后遗留的自有运行时，下一个宿主结束它、等待真实终态证据、退休 fence，然后显示正常空对话／无文件夹页，不再有黄色恢复条或 End／Recover 两个操作。

包含 ownership 的只观察控制与交接判定、managed-process／runtime lifecycle 能力、启动协调、定向测试、双语 ADR／架构／消息契约同步，以及 macOS 实际 F5 和新鲜隔离安装 VSIX 证据。

不包含 Webview 协议和预览夹具、`errorCode` 渲染、ADR 0002 共享单运行时限制、每窗口独立恢复域，以及会话内 Stop／协议故障的既有恢复路径。不恢复已停止的逐断言测试审查。

## 架构与安全核对

| 维度 | 必需行为 | 限制 |
|---|---|---|
| 模块、接口、依赖、所有者 | control-client 负责观察，runtime-owner 负责决策；managed-process 和宿主 lifecycle 委托 | 无渲染器 DTO 或反向依赖 |
| 需求、状态、并发、清理 | 仅 owner-lost 自动结束，owned 不触碰，精确回执是退休前提 | 独占退休只有一个写入者，不保证所有窗口成功；失败宿主重新观察空域 |
| 安全与可观察性 | 有界控制、精确形状／run 校验、诚实报告无效／不可达 | 无清除未知或任意 PID 旁路 |
| 测试、兼容、交付 | 判定表、observe 不结束、busy／串行化与宿主启动回归 | 未原生复现的分支仅有自动化证据 |
| 存储与展示 | recovery-v1 schema 不变；正常启动无恢复条 | 未决保留运行仍显示显式恢复 |

## 验收条件

1. 正常遗留：下一次激活无恢复条；前任精确子进程退出且有匹配回执；fence 退休；新的资源选择只启动一个新运行时。
2. 活所有者安全：另一窗口打开前后的 run 与 PID 不变，本窗口不发结束请求。
3. 失败诚实：退出不确定、监督不可达或存储损坏时保留 fence 和显式恢复页，仍需终态证据才可恢复。
4. 不回归：会话内 Stop／协议不确定性不变；compile、lint、完整测试、文档验证、双语检查、文档健康与空白检查通过。
5. 原生证据：实际 macOS F5 和新鲜隔离安装 VSIX 分别记录；不声称原生复现无回执分支。

## 后续限制

激活指通过 Pi view 构造 provider，不是无条件 VS Code 应用启动。WI-036 的独立域／owner-loss 当场清理候选仍仅在停车场。原生初始配置和工具失败仅是诊断历史，不算通过；验收记录披露实际工作区选择、安装版供应商警告和清理方法。
