# WI-039：macOS 评估与验收

[English](2026-09-30-wi-039-macos-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-039-macos-acceptance.md](2026-09-30-wi-039-macos-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：已归档
- 创建：2026-09-30
- 处置：2026-09-30 由代理依据本会话「完成 ACTIVE 剩余任务、写收尾并在每项后提交 Git」的要求接受并关闭
- 权威：本批准组包切片的历史证据；不是整份 PRD、发布、gate、WI-038 或 ADR 0007 的接受
- 范围：[批准提案](2026-09-30-wi-039-approved-proposal.zh.md)、REQ-009 交付 VSIX 运行时闭包、安装版宿主上的 REQ-002 供应商配置
- 验收身份：代理依据维护者 2026-09-30 完成 ACTIVE 剩余任务、写收尾记录并在每项后提交的要求；不伪称维护者亲自重跑这些检查

## 批准行为与实现

交付宿主 bundle 只允许把 `vscode` 与 pinned `@earendil-works/pi-coding-agent` 留在自身之外。声明的 `@earendil-works/pi-ai` 0.86.1 内联进 `dist/extension.js`。组包拒绝「交付 bundle 的裸运行时标识符未装入或非宿主提供」。解包验证器在解包扩展根目录真实 import 每个标识符。因此隔离安装版的供应商设置、endpoint 添加／删除与模型目录与开发宿主一样能加载。未改 Webview DTO、gate、ADR、模块责任或用户可见设置条款。

实现提交为 `9d9259d`（`build(packaging): bundle pi-ai and guard VSIX runtime deps`）。架构与 PRD 切片为 `f9fcd45`。

## 自动化验证

Build 记录 993 项测试（新增 3 项组包回归）。本次关闭在当前工作树上重跑同一套件。

| 检查 | 实际结果 | 范围 |
|---|---|---|
| `npm run compile` | 通过 | 生产 bundle 与 TypeScript；`dist/extension.js` 为 982 KB 且已内联 pi-ai |
| `npm run lint` | 通过 | 静态检查 |
| `npm test` | 993 通过，0 失败／跳过 | 含标识符扫描、缺失依赖拒绝、装入子树通过，以及解包 import 验证覆盖 |
| 实现提交 | `9d9259d` | esbuild external、`packageVsix` 拒绝、`verify-vsix` 真实 import |

修复前归档 149,815,375 字节（`dist/wi038-native/pi-vscode-prepackage01.vsix`，SHA-256 `0b2abc72fe523df6bc89ab930179444acdf230967194517ed9a53ef30e2949f0`）解包 import 验证失败：`dist/extension.js` 会加载 `@earendil-works/pi-ai` 且该包未随包发布。修复后归档 149,921,300 字节（`dist/wi038-native/pi-vscode-final.vsix`，SHA-256 `1a70dd777a92fbcf5205d3f927e87482e347835b23130e3caa123b93ab22f6c9`，15,535 条目，pi 0.86.1）通过。这些被忽略的本地产物不是入库证明；哈希与大小是可保留摘要。

## 原生环境与出处

macOS 27.0.0（arm64）；发行版 pi 0.86.1。隔离自有根 `/private/tmp/pi-w038-4cmFzI` 持有独立的父／开发／安装 user-data 与专用 agent 目录。仅合成 endpoint；无真实登录、模型或付费调用。接受的安装运行使用 `pi-vscode-final.vsix`（149,921,300 字节）。VS Code 报告 `Extension 'pi-vscode-final.vsix' was successfully installed.`

## 实际安装版供应商证据

本 WI 之前记录的阻断失败是：两个隔离窗口都报「Could not load provider configuration.」。诊断构建记录 `Cannot find package '@earendil-works/pi-ai' imported from <扩展目录>/dist/extension.js`（`ProviderConfig.ensureRuntime` → `createRuntime`）。解包该归档只装入 `node_modules/@earendil-works/pi-coding-agent`。

组包修复后，同一隔离安装版双窗口路径加载了供应商配置（第一次尝试即 `provider-loaded: true`，错误字符串为空）。添加／删除争用都显示固定占用错误，且 `ids: ["fixture-endpoint"]` 未变。释放后各自干净提交并保留全部条目（`installed-holder`、`installed-add-0`、`installed-add-1`，删除重试时还有 `installed-holder-2`）。`failures` 为空。自有进程已清理（`cleanupRemaining: []`）。本地报告：`dist/wi038-native/report-pi-w038-4cmFzI.json`。

该轮也捕获了 WI-038 的开发宿主争用。这些观察不关闭 WI-038。

## 失败、清理与限制

- 针对修复前归档的更早安装尝试不是通过。
- 把验证器串进 `package:vsix`／CI 仍属停车场 ARCH-07。
- 本次关闭不接受 WI-038、ADR 0007、ADR 0005、gate 或整份 Draft PRD。
- Windows 原生 F5／安装仍在当前 macOS 平台决定之外。
- 未推送。

## 最终处置

代理依据本会话完成 ACTIVE 剩余任务、写收尾并在每项后提交的要求，接受并关闭 WI-039。实现、993 项自动化测试、解包 import 的红／绿验证，以及隔离安装版供应商配置加载，满足该批准组包切片。ARCH-07 与 WI-038 仍分开。
