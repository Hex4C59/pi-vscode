# ADR 0003：React 与 TypeScript Webview 前端

[English](0003-react-webview.md) | 中文

- 翻译状态：Technically Verified
- 权威原文：[0003-react-webview.md](0003-react-webview.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-27

- 类型：ADR
- 状态：Accepted
- 创建：2026-09-22
- 决策批准：2026-09-22，React／TypeScript 与已整合的 Vite 设计
- Build 批准：2026-09-22，WI-015 T015-01–06；当前范围与验收以 [ACTIVE](../../ACTIVE.md) 为准
- 验证与接受：2026-09-27 UTC，代理按本次明确决策／验收委托完成评估；详见下文实际证据
- 相关 gate：[gate-webview-trust 与 gate-session-streaming](../reference/architecture-gates.md)，保持 Open
- 工作项：WI-015 T015-01–06 已验收；[收尾记录](../archive/2026-09-27-wi-015-react-acceptance.zh.md)

> 2026-09-28 后续处置：下列早期「gates Open」描述保留原切片决定时点；三个广泛边界现已另由 [ADR0004](0004-trust-and-lifecycle.zh.md) 接受，不由本 ADR 自动推出。

## 背景

内联 Webview 脚本集中多个独立变化的 UI 职责，host 生成字符串内缺少 TypeScript 检查。维护者优先考虑长期组件组合与状态维护。[调查](../archive/2026-09-22-webview-framework.zh.md) 保存仓库证据与官方来源，[ACTIVE](../../ACTIVE.md) 维护当前范围及批准。

## 决策与批准

采用 React 与 TypeScript 作为前端方向。维护者确认紧凑的 IDE 原生感外观整理、保持功能行为，并需要浏览器开发预览与快速刷新。迁移期间 WI-014 暂停，WI-015 承担迁移工作。维护者已于 2026-09-22 批准 WI-015 六个有界切片 T015-01–06 的 Build。当前范围、证据与验收以 ACTIVE 为准；本批准不等于接受 ADR 或关闭任何 gate。

Webview 仍只负责展示，host 持有权威状态及现有受校验消息语义。框架状态持有 UI 状态与 host 投影，不独立实现任务、审批或附件策略。原生文件选择及 VS Code 能力仍由 host 操作。这些边界沿用既有架构，不构成新运行时集成路线。

维护者随后确认整合设计：Vite 前端构建／开发预览、保留 host esbuild、普通 CSS／主题 token、node:test 配合 jsdom、保留 host／协议语义，并分别取得浏览器／开发宿主／安装版证据。React／Vite 路线已整合到实现中。本次明确委托允许代理据实际证据验收；下文记录代理评估，不冒称维护者亲自检查。

## 理由与替代方案

React 组件与类型化边界符合已确认维护目标。独立浏览器构建可解决字符串无类型检查问题，此收益本身不依赖框架。原生 TypeScript 模块对运行时改动较小，但仍须手工组合 DOM；Vue、Preact、Lit 是选型讨论中的可行替代。没有基准证明 React 更快或更小，也不承诺总代码量下降。

## 影响与剩余设计

迁移路线使用浏览器资源与 CSP／加载、组件／状态拆分、前端类型及 lint 覆盖、确定性 UI 测试和开发预览夹具。产品与预览共用应用，仅预览 host 边界使用非秘密合成状态，不调用 pi 或特权 host 能力。产品加载本地打包资源，不依赖开发服务器。

视觉需求归 PRD；当前范围、验证与验收记于 ACTIVE。浏览器预览不能证明 VS Code 主题、生命周期或安装包行为。流式更新须保留稳定身份、焦点／展开／滚动及草稿 revision 语义，清理监听器，按既有契约拒绝过期 host／view 完成。

## 接受条件与本次证据

2026-09-27 UTC，代理按本次明确委托完成评估并接受本 ADR。原条件已逐项满足，不是由文档检查或历史通过替代：

- compile／lint 及 456 项标准测试通过，覆盖真实 client／host／adapter 行为；生产依赖图排除 preview／tests，CSP 与 allowlist 仍由既有 host 契约负责。
- WI-019 的正式 Q16、三主题双语、窄栏／真实 1100×620 短窗、键盘焦点、模型／thinking、附件确认、审批／审阅与会话流程分别取得原生 F5 和新安装包证据，见 [WI-019 归档](../archive/2026-09-27-wi-019-formal-chat.zh.md)。不以浏览器截图替代真实宿主。
- dist/delegated-completion-20260928/host-chat-installed/installed-lifecycle-report.json：流式中原生 Developer Reload Webviews 后重建展示并保留 host 已确认的新草稿与 Stop 权威；随后核对自有 RPC 后实际终止，失联态草稿只读可选中、发送阻断；显式完整 Reload Window 后新任务成功。已看 formal-runtime-loss.png。F5 失联与完整重载另在 host-chat-lifecycle/f5-report.json；不把 renderer reload 冒称 host onDidDispose。自动化卸载／过期 view 断言补足边界语义。
- 包本地 JS／CSS／SVG 存在、非空及哈希绑定通过；修复 Vite 根地址并在真实宿主恢复 Pi 标记，安装 9 项产物与当前编译树一致。没有预览服务器运行依赖。

本轮实际版本：React／React DOM 19.3.0、Vite 7.3.1、plugin-react 5.1.1、TypeScript 5.9.3、pi 0.86.1；构建 Node 24.12.0。JS 371241 字节（gzip 114818），CSS 39254（7642），SVG 290（185），详见 wi015-bundle-measurements.json；不是性能优越性基准。真实 Windows 官方 VS Code 1.105.1 原生 F5 与 1.139.1 安装版分别验证；声明的最低 engine 不代表其每个版本或兼容分支均已实测。

本接受仅确定 React／TypeScript／Vite 前端选择与迁移，不改变 host 权威、公开 pi 边界、秘密策略、工具授权或会话存储。gate-webview-trust 与 gate-session-streaming 保持 Open，按各自完整问题另行接受；不是整份 Draft PRD 接受。
