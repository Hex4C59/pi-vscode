# ADR 0003：React 与 TypeScript Webview 前端

[English](0003-react-webview.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[0003-react-webview.md](0003-react-webview.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-22

- 类型：ADR
- 状态：Draft
- 创建：2026-09-22
- 决策批准：2026-09-22，React／TypeScript 与已整合的 Vite 设计
- Build 批准：2026-09-22，WI-015 T015-01–06；当前范围与验收以 [ACTIVE](../../ACTIVE.md) 为准
- 验证：迁移的可执行检查已记入 ACTIVE；维护者体验／ADR 接受仍待确认
- 相关 gate：[gate-webview-trust 与 gate-session-streaming](../reference/architecture-gates.md)，保持 Open
- 工作项：WI-015 T015-01–06 实现已验证、待接受；ACTIVE 维护后续恢复的 WI-014

## 背景

内联 Webview 脚本集中多个独立变化的 UI 职责，host 生成字符串内缺少 TypeScript 检查。维护者优先考虑长期组件组合与状态维护。[调查](../discussions/2026-09-22-webview-framework.zh.md) 保存仓库证据与官方来源，[ACTIVE](../../ACTIVE.md) 维护当前范围及批准。

## 决策与批准

采用 React 与 TypeScript 作为前端方向。维护者确认紧凑的 IDE 原生感外观整理、保持功能行为，并需要浏览器开发预览与快速刷新。迁移期间 WI-014 暂停，WI-015 承担迁移工作。维护者已于 2026-09-22 批准 WI-015 六个有界切片 T015-01–06 的 Build。当前范围、证据与验收以 ACTIVE 为准；本批准不等于接受 ADR 或关闭任何 gate。

Webview 仍只负责展示，host 持有权威状态及现有受校验消息语义。框架状态持有 UI 状态与 host 投影，不独立实现任务、审批或附件策略。原生文件选择及 VS Code 能力仍由 host 操作。这些边界沿用既有架构，不构成新运行时集成路线。

维护者随后确认整合设计：Vite 前端构建／开发预览、保留 host esbuild、普通 CSS／主题 token、node:test 配合 jsdom、保留 host／协议语义，并分别取得浏览器／开发宿主／安装版证据。React／Vite 路线已整合到实现中。当前验证证据与待接受项由 ACTIVE 记录；本 ADR 不代替维护者验收。

## 理由与替代方案

React 组件与类型化边界符合已确认维护目标。独立浏览器构建可解决字符串无类型检查问题，此收益本身不依赖框架。原生 TypeScript 模块对运行时改动较小，但仍须手工组合 DOM；Vue、Preact、Lit 是选型讨论中的可行替代。没有基准证明 React 更快或更小，也不承诺总代码量下降。

## 影响与剩余设计

迁移路线使用浏览器资源与 CSP／加载、组件／状态拆分、前端类型及 lint 覆盖、确定性 UI 测试和开发预览夹具。产品与预览共用应用，仅预览 host 边界使用非秘密合成状态，不调用 pi 或特权 host 能力。产品加载本地打包资源，不依赖开发服务器。

视觉需求归 PRD；当前范围、验证与验收记于 ACTIVE。浏览器预览不能证明 VS Code 主题、生命周期或安装包行为。流式更新须保留稳定身份、焦点／展开／滚动及草稿 revision 语义，清理监听器，按既有契约拒绝过期 host／view 完成。

## 接受条件

保持 Draft，直到实现检查覆盖已有行为矩阵、包内产品资源验证完成，且 Windows VS Code 开发宿主与安装版 VSIX 覆盖修改后的 UI、主题／键盘、重建及流式行为。明确记录依赖／运行时兼容、前端包体测量及证据缺口。当前验证与验收仍待完成；本 ADR 不记录应用测试、构建、打包或实机验证通过的声明。文档检查不能接受 ADR 或关闭更广泛 gate。
