# WI-039：PACKAGE-01 组包批准范围

[English](2026-09-30-wi-039-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-039-approved-proposal.md](2026-09-30-wi-039-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 创建：2026-09-30
- 权威：历史批准范围，不是新的 Build 授权
- 归档原因：WI-039 实现与所需证据完成；最终处置归[验收记录](2026-09-30-wi-039-macos-acceptance.zh.md) 与 [ACTIVE](../../ACTIVE.md)。

## 批准与追溯

维护者在 WI-038 安装版取证受阻后批准新开 WI：修复 PACKAGE-01、加入组包回归、验证解包归档，再补做隔离安装版双窗口。本 WI 追溯 REQ-009 的安装版交付能力与 WI-034 已接受的组包切片；设置页与 endpoint 路径仍属 REQ-002。无新增 gate 或 ADR。不接受整份 Draft PRD。

本会话维护者要求完成 ACTIVE 剩余任务、写收尾记录并在每项后提交 Git，即关闭授权。实机证据取于 Build；本次关闭不伪称维护者亲自重跑这些宿主。

## 目标与范围

隔离安装版必须能创建运行时并加载供应商配置。组包必须拒绝「交付 bundle 加载了未随包发布的运行时依赖」。

范围内：宿主 bundle 外部依赖、组包拒绝校验、解包后真实 import 验证、安装版复验证。范围外：把 `verify-vsix` 串进 `package:vsix`／CI（ARCH-07）、组包整体重构、ARCH-06、ARCH-02、WI-036、pi 升级、公开发布，以及 WI-038／ADR 0007 的最终接受。

## 方案

1. `dist/extension.js` 只保留真实运行时外部依赖：`vscode`（宿主提供）与 `@earendil-works/pi-coding-agent`（supervisor 以子进程启动其 CLI）。声明的 `@earendil-works/pi-ai` 0.86.1 内联进 bundle。
2. 扫描交付 bundle 的 `require`／静态与动态 `import`／`export … from` 裸标识符。除 `vscode` 与 Node 内置模块外，每个标识符都必须对应已装入的 `node_modules/<包名>`。
3. 解包后在扩展根目录真实 `import()` 每个标识符。修复前归档必须失败，修复后必须通过。

内联 pi-ai 使 `dist/extension.js` 从 307 KB 增至 982 KB。若装入完整 external 解析闭包，开发树上约 824 MB 未压缩／229 个包。

## 验收

- 组包规格覆盖标识符扫描、缺失依赖时的固定拒绝信息、装入 pinned 子树时通过。
- 全新组包加解包验证器覆盖归档条目、pinned CLI／RPC／gate，以及对每个裸标识符的真实 import。
- `compile`／`lint`／完整 `npm test` 通过。
- 隔离安装版两窗口设置页加载供应商配置。同一轮也记录了 WI-038 的 endpoint 争用；该 WI 仍独立，直至其自身关闭。

## 后续限制

这是组包能力修复，不是新的用户可见行为条款、gate 或模块责任变更。ARCH-07 仍在停车场。Windows 原生 F5／安装仍在当前 macOS 验收平台之外。
