# 架构评估 — 2026-10-01

[English](2026-10-01-architecture-assessment.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-architecture-assessment.md](2026-10-01-architecture-assessment.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01
- 类型：讨论
- 状态：Draft
- 权威：代理评估与上下文；不是实现批准或验收变更

## 范围与方法

维护者要求按维度给出十分制架构分数。本评估对照[已接受架构](../architecture/vscode-extension-architecture.zh.md)、[治理清单](../guides/architecture-governance.zh.md)、当前源码与既有测试，对象是自用 macOS 本机 VS Code。这是抽样架构审阅，不是穷尽安全审计或实机验收。分数是判断，不是覆盖率。等权平均约 **8.2/10**。

## 分数与证据

| 维度 | 分数 | 评估与证据 |
|---|---:|---|
| 分层与依赖方向 | 8.8 | [装配根](../../src/extension.ts)分开宿主、适配层与上游执行。[生产浏览器图测试](../../scripts/packaging/production-webview.spec.mjs)排除特权实现与合成夹具。领域／运行时契约仍引用[runtimeLifecycle](../../src/extension/contracts/runtimeLifecycle.ts)里的展示 DTO，表示层耦合仍在。 |
| 模块内聚与接口深度 | 7.5 | [EditorTools](../../src/extension/editor-tools/editorTools.ts)隐藏审批、编辑器检查与可选审阅资源。890 行的[宿主协调者](../../src/extension/piChatViewProvider.ts)仍拥有工作区、任务、配置、恢复与会话交接；改一条流程要理解多组回调和标志。扣分不只因为长度。 |
| 契约与身份 | 8.5 | [入站校验](../../src/extension/bridge/webviewMessages.ts)强制 v3、精确字段与有界值；协调者拒绝过期 view／generation。[运行时接口](../../src/extension/contracts/runtimeLifecycle.ts)合并执行、恢复、交互与模型能力，可选操作偏多。 |
| 状态与并发 | 8.4 | [占用所有者](../../src/adapter/runtime/rpc/rpc-occupancy.ts)与[顺序测试](../../src/adapter/runtime/rpc/tests/rpc-occupancy.spec.ts)区分 ACK、任务完成、命令、对话框与 Stop。宿主编排仍用多组布尔、令牌和回调顺序表达合法组合。 |
| 进程生命周期与恢复 | 8.7 | [RPC release](../../src/adapter/runtime/pi-rpc-runtime.ts)同步撤销传输；生产使用托管所有权。当前测试覆盖精确 child 回执、owner loss、不确定交付与阻塞替换。后代终止与回滚明确不在承诺内。 |
| 安全与信任 | 8.8 | [CSP 壳](../../src/extension/bridge/webviewHtml.ts)、精确消息校验与[编辑器策略](../../src/extension/editor-tools/editorTools.ts)提供具体限制。[运行时错误](../../src/adapter/runtime/runtime-errors.ts)避免投影原始供应商错误体。任意输出打码与路径检查／使用保证仍有文档限制；本分数不是安全认证。 |
| 数据与持久化 | 8.5 | 公开 pi API 保留会话权威；[endpoint 事务](../../src/extension/models/endpointFileTransaction.ts)提供有界读取、协作写者互斥、替换检查与明确提交／清理结果。不协作编辑与崩溃 leftover 采取保守限制。 |
| 性能与背压 | 7.0 | [JSONL 成帧](../../src/adapter/runtime/rpc/jsonl.ts)、附件上限与有界投影避免普通路径无界保留。每个文本 delta 更新 transcript，[publish](../../src/extension/piChatViewProvider.ts)投递完整工作区／聊天快照。本次审阅未建立延迟、传输量或渲染测量；这是扩展性顾虑，不是已证实变慢。 |
| 可测试与验证 | 8.2 | 注入的进程／桥接缝、原生进程测试、jsdom 交互与生产图测试覆盖不同失败面。当时 1,027 项测试通过。不能替代实机验收；[ACTIVE](../../ACTIVE.md)仍保留 macOS 代表性矩阵证据缺口。 |
| 构建、交付与兼容 | 7.8 | 明确的宿主／helper／浏览器入口、精确 pi 发行 pin 与包闭包测试支持确定交付。[CI](../../.github/workflows/ci.yml)跑 Ubuntu 与 Windows，没有当前 macOS 目标。公开发布与额外宿主／平台支持属范围外，不是缺了必做功能。 |
| 文档与可维护性 | 7.5 | ADR、gate 与所有权说明保留理由。[README](../../README.md)把剩余实现／验证写成已完成，而 [ACTIVE](../../ACTIVE.md)记录已确认显示缺项与证据缺口。历史范围陈述增加阅读成本。计划中的目录整理不计入已实现模块化。 |

## 当前倾向与选项

保留现有分层。目录归组能改善导航，本身不会减少跨模块协调。若后续维护值得做结构工作，评估把会话交接或任务生命周期窄抽出，配单一权威所有者与保行为验证。没有具体变化的实现时，不要造通用事件总线或额外抽象层。

性能上先测量长流式期间的 postMessage、渲染更新与交互响应，再考虑合并发布或改传输。补 macOS CI 覆盖、把摘要状态与当前缺口对齐，比换框架或进程模型更直接。这些是审阅建议，不是已批准 Build 或重排产品队列。

## 验证与限制

当时运行：`npm run typecheck`、`npm run lint` 与 `npm test` 通过；测试报告 1,027 通过、零失败／取消／跳过。本次审阅未跑 compile／安装、原生 F5、真实供应商行为或性能基准。既有验收／gate 记录当作历史限定证据，不当作新通过。应用代码、PRD、ADR 与 gate 状态未改。

未决问题是完整快照的实测成本、真正减少调用方知识的最小生命周期抽出，以及 ACTIVE 已记录的 macOS 代表性证据矩阵。
