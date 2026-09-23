# pi VS Code

[English](README.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[README.md](README.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-23

面向 [pi](https://github.com/earendil-works/pi) coding agent 的 VS Code 扩展：边写代码边在侧栏聊天。左侧保留 Explorer，Pi 优先使用右侧辅助侧栏。

本项目独立维护，按 [MIT](LICENSE) 开源。pi 是独立的上游产品。

## 当前状态

扩展已有 React／TypeScript 侧栏，承载限定的工作区设置、草稿／流式、模型／thinking、活动／审批、Stop 与有界混合附件（最多 20 项／1 MiB UTF-8）：整文件和固定编辑器选区；来源变化后明确确认最新整文件内容或旧选区快照。REQ-001～REQ-009 完整产品闭环仍未实现。当前范围、实跑验证和待验收项由 [`ACTIVE.md`](ACTIVE.md) 单点维护，不由本概览维护。

- 浏览器、实际 F5 与已安装 VSIX 证据分别记录；真实 pi 配本机合成 provider 不是真实模型证据或维护者验收。
- 活跃附件历史已实现有界分页和按需完整预览；已有路径不自动接受整份 PRD、架构 gate 或发布。
- WI-010 经维护者四项 F5 确认后关闭；隔离已安装 VSIX 激活现已有 Goal 验证证据，完整审批／生命周期矩阵及维护者接受仍未完成。
- WI-008／WI-009 的空闲选择及下一轮生效主路径已确认，最终收尾仍待完成。
- 已覆盖的内置 write/edit 在审批前及最终授权前检查未保存编辑；被阻止时须明确恢复，绝不自动保存。不保证拦截 shell 写入或最终检查之后的编辑。
- 修改后审查现将可靠的 write/edit before/after 文本保存在 host 内存，提供原生只读 diff 和当前源导航。可展开面板区分工具报告目标与观察到的工作区变化、解释捕获／归因限制，历史差异保留到 runtime／项目替换；它不是补丁审批或回滚。保存会话现通过 pi 公开 API 提供当前项目目录、确认后的顺序新建／恢复，以及有界的不可变历史／附件文本预览；不会自动加载历史工具，确认也不是所有权锁。其余产品闭环和维护者验收仍待完成，当前证据见 ACTIVE。[PRD](docs/product-requirements.zh.md) 保持 Draft，`ACTIVE.md` 列出的架构 Gate 保持 Open。

仓库尚无 Marketplace 或 Open VSX 发布验收记录。[历史](docs/archive/2026-09-21-closed-wi-history.zh.md)中的验证 VSIX 仅通过解压包检查，不等于已安装包验收。

## 从源码运行

按 [`package.json`](package.json) 声明的 Node 与 VS Code 版本范围准备环境，然后执行：

```bash
git clone https://github.com/Hex4C59/pi-vscode.git
cd pi-vscode
npm ci
npm run compile
```

`npm run compile` 使用 esbuild 构建 extension host、approval gate、有界公开会话 helper 与 runtime 入口，使用 Vite 构建浏览器 Webview，并在独立的 TypeScript 配置中严格检查 host、浏览器前端与测试。

### 浏览器前端预览

开发 React 前端时运行 Vite 预览：

```bash
npm run preview:webview
```

打开 Vite 输出的本地 URL。预览使用 synthetic host 挂载生产应用，并提供场景、主题和侧栏宽度选择；支持浏览器热刷新，但不会启动 pi、使用 VS Code API、读取工作区文件或请求 provider。预览行为不等于 F5 或已安装 VSIX 验收。

`npm run watch` 使用 esbuild 监视 extension host 与 approval gate，并重建生产 Webview 输出。它是生产重建 watcher，不会启动浏览器预览服务器或提供浏览器 HMR；需要浏览器预览时运行 `npm run preview:webview`。

在本地 VS Code 窗口打开仓库，按 **F5**（Run Extension）。在扩展开发宿主中通过命令面板运行 **pi: Focus Chat**，或使用编辑器标题栏的 Pi 图标。

打开一个可信本地文件夹，选择是否允许 pi 项目级资源。宿主启动 pi 并显示就绪状态或有界错误。聊天复用已有 pi provider 配置与凭证；真实 provider 请求可能按其规则计费。无目录、多根、远程和未信任工作区不能启动运行时。

受控配置在覆盖范围内的操作前询问，仅自动允许 canonical 路径位于工作区内的普通文件读取。资源同意与工具授权独立。Stop 请求取消，不撤销已完成的修改；扩展不是沙箱。具体限制见[已批准的执行切片](docs/product-requirements.zh.md#req-006--执行审批策略)。

## 开发与验证

按改动范围运行检查：

```bash
npm run lint
npm test
npm run build:webview
npm run verify:webview
```

`npm test` 使用 `node:test` 与 esbuild 收集所属目录中的 `*.spec.ts`。Webview spec 通过 jsdom 和 synthetic bridge/host 挂载 React 应用，不再使用已移除的内联字符串 VM harness。浏览器预览适合观察布局和交互，但不属于自动化测试或宿主验收证据。

`npm run build:webview` 将生产前端写入 `dist/webview`。`npm run verify:webview` 检查本地静态 bundle 包含非空的 `webview.js`、`webview.css`，且没有意外的 JavaScript chunk。也可传入 VSIX 路径检查归档：

```bash
npm run verify:webview -- path/to/pi-vscode.vsix
```

可选 VSIX 参数检查 `extension/dist/webview/webview.js` 与 `extension/dist/webview/webview.css` 是否存在。这些是静态资源检查，不会安装 VSIX、启动开发服务器或运行 pi。生产 Webview 加载打包的本地资源，不依赖开发服务器。

按[贡献指南](CONTRIBUTING.zh.md)选择与改动匹配的检查。集成探针须遵守 [pi 集成指南](docs/guides/agent/pi-integration.zh.md)，与默认自动化测试分开执行。

## 文档

- 当前工作与验收：[`ACTIVE.md`](ACTIVE.md)
- 贡献者与 Agent：[`CONTRIBUTING.zh.md`](CONTRIBUTING.zh.md)、[`AGENTS.zh.md`](AGENTS.zh.md)
- 安全报告：[`SECURITY.zh.md`](SECURITY.zh.md)
- 按任务导航：[文档索引](docs/README.zh.md)
- 变更历史：[`CHANGELOG.md`](CHANGELOG.md)

## 侧栏兼容性

manifest 将 Pi Webview View 注册到 `secondarySidebar`。宿主／兼容编辑器支持须独立验证，版本声明本身不证明侧栏位置可用。回退方向是在主侧栏显示同一视图，并在支持时移到右侧；不代表所有宿主已有经验证的自动回退。

## 许可证

[MIT](LICENSE) — Copyright (c) 2026 Hex4C59
