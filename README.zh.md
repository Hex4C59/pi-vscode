# pi VS Code

[English](README.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[README.md](README.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30

面向 [pi](https://github.com/earendil-works/pi) coding agent 的 VS Code 扩展：边写代码边在侧栏聊天。左侧保留 Explorer，Pi 优先使用右侧辅助侧栏。

本项目独立维护，按 [MIT](LICENSE) 开源。pi 是独立的上游产品。

## 当前状态

扩展已有 React／TypeScript 侧栏，承载限定的工作区设置、草稿／流式、模型／thinking、活动／审批、Stop 与有界混合附件（最多 20 项／1 MiB UTF-8）：整文件和固定编辑器选区；来源变化后明确确认最新整文件内容或旧选区快照。[PRD](docs/product-requirements.zh.md) 已作为**自用 macOS 本机 VS Code 安装版 VSIX** Accepted，standing non-goals 仍排除。已批准实现与剩余 macOS 验证均已完成；[`ACTIVE.md`](ACTIVE.md) 维护当前工作，[macOS 验证记录](docs/archive/2026-09-30-macos-verification-acceptance.zh.md) 记录验收证据及限制。验收为受托代理身份，不是维护者亲自测试。

- 浏览器、实际 F5 与已安装 VSIX 证据分别记录；真实 pi 配本机合成 provider 不是真实模型证据。
- 活跃附件历史已有界分页和按需完整预览。
- 模型／thinking 切片接受及独立信任／生命周期边界接受分别记录在[关闭 WI 索引](docs/archive/2026-09-29-closed-wi-index.zh.md)与 [gate 表](docs/reference/architecture-gates.zh.md)。各记录保留限定证据的适用范围；自用验收不认证全部环境。
- 已覆盖的内置 write/edit 在审批前及最终授权前检查未保存编辑；被阻止时须明确恢复，绝不自动保存。不保证拦截 shell 写入或最终检查之后的编辑。
- 修改后审查现将可靠的 write/edit before/after 文本保存在 host 内存，提供原生只读 diff 和当前源导航。可展开面板区分工具报告目标与观察到的工作区变化、解释捕获／归因限制，历史差异保留到 runtime／项目替换；它不是补丁审批或回滚。保存会话现通过 pi 公开 API 提供当前项目目录、确认后的顺序新建／恢复，以及有界的不可变历史／附件文本预览；不会自动加载历史工具，确认也不是所有权锁。

Marketplace 与 Open VSX 公开发布仍范围外。Windows 实机 F5／安装版 VSIX 与 Cursor 验收也在已接受的自用目标之外。[历史](docs/archive/2026-09-21-closed-wi-history.zh.md)中的旧验证 VSIX 仅通过解压包检查；当前 macOS 安装版 VSIX 验收另见上方记录。

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

在聊天顶部点击齿轮 → **界面设置 → 语言**，即可在正式侧栏与浏览器预览中切换 **English／简体中文**。默认英文；语言仅属于本次挂载，不持久化、不发送到 host。预览场景切换与 Reset 保留本页语言，重载后恢复英文。草稿、流式任务、模型设置与活动展开状态保持不变；消息、代码、工具／审批输入、历史原文和上游错误详情保持原文。在 `src/webview/i18n/ui-zh-cn.ts` 旁添加完整 `UiText` 语言包并注册到 `ui-language.ts`。

**无文件夹**场景现在显示普通欢迎页，可以先输入草稿，不再前置设置卡片。点击发送／Enter 后才显示“无法发送消息”提示；确定、关闭或 Escape 保留草稿。弹窗中保留“打开文件夹”，之后仍走既有资源选择。不会自动发送，无文件夹仍不能启动任务。

开发 React 前端时运行 Vite 预览：

```bash
npm run preview:webview
```

打开 Vite 输出的本地 URL。展开 **预览控制** 选择模拟场景、宽度（280／320／360／400／600px）、主题、Reset 或恢复；检查短视口时收起开发控件。委托 Q16 评估通过后，正式 `main.tsx`／`mount.tsx` 与合成 `preview/candidate-preview.ts` 均经公共入口挂载共享 `chat` 展示。正式入口使用真实 VS Code bridge；只有预览拥有合成场景、计时器及开发控件。生产依赖图测试排除预览和测试模块；当前宿主／安装验收见 [ACTIVE](ACTIVE.md)。

最短体验路径：

1. **新建对话／格式化回复／先活动后回复：** 输入并发送，检查安全 Markdown／复制与两级原文活动，调整下一轮模型／thinking，输入较新草稿并 Stop。不可信输出展示惰性 HTML／图片与危险 URL 拒绝；链接仅打开绝对 HTTP(S) 地址，复制失败／超时明确反馈。
2. **来源变化／附件：** 单个居中 `+` 提供文件／选区、移除、完整字面预览和附件历史。分别确认最新文件／旧选区，再明确发送；确认绝不自动发送。失败／容量／来源不可用／不确定投递夹具保留既有有界恢复语义。“模拟来源编辑”不接触编辑器。
3. **审批队列：** 在八项独立请求间选择（最早项 20 秒过期，其余 120 秒）。工具、请求目标、完整命令与精确范围默认可查看，长内容局部滚动，大输入按需展开原文。选择不审批、不续期。单次／符合条件的精确会话授权、拒绝、Stop 及输入区的 **权限** 查看／撤销均可操作；受控执行明确不是安全沙箱。
4. **已捕获审阅：** 展开紧凑计数入口，检查已捕获／工具报告／观察到／不可用标签，并分页查看 33 个合成结果。差异／源码操作明确为模拟，并报告原生打开不可用。可在任务、会话浏览期间组合“模拟已捕获修改”“模拟审阅丢失”与“模拟待审批操作”。短视口中新审批到达会收起展开审阅；用户重新展开后局部滚动，不遮挡审批按钮或 Stop。
5. **保存的会话／新建／恢复：** 历史默认收起，只替换中间消息区；历史图标、Back 或 Escape 恢复阅读位置／焦点。输入区、Stop 与到达的审批仍可操作。模拟交接可确认／取消／失败，只有提交切换才清空当前工作；恢复历史提供有界分页／原文分块。Reset、热刷新／卸载释放旧监听／定时器及身份。

消息、代码、工具／审批输入和历史快照保持原文。场景工厂位于 `scenarios.ts`，外部 host 模拟位于 `preview-bridge.ts`，开发外壳样式位于 `preview.css`；共享 `styles.css` 汇总既有覆盖顺序。预览**不会**启动 pi、使用 VS Code 能力、读取工作区文件、请求 provider，也不证明 F5／安装版行为。当前技术证据及宿主／安装验收由 [ACTIVE](ACTIVE.md) 记录。

`npm run watch` 使用 esbuild 监视 extension host 与 approval gate，并重建生产 Webview 输出。它是生产重建 watcher，不会启动浏览器预览服务器或提供浏览器 HMR；需要浏览器预览时运行 `npm run preview:webview`。

在本地 VS Code 窗口打开仓库，按 **F5**（Run Extension）。在扩展开发宿主中通过命令面板运行 **pi: Focus Chat**，或使用编辑器标题栏的 Pi 图标。

打开一个可信本地文件夹，选择是否允许 pi 项目级资源。宿主启动 pi 并显示就绪状态或有界错误。聊天复用已有 pi provider 配置与凭证；真实 provider 请求可能按其规则计费。无目录、多根、远程和未信任工作区不能启动运行时。

受控配置在覆盖范围内的操作前询问，仅自动允许 canonical 路径位于工作区内的普通文件读取。资源同意与工具授权独立。Stop 请求取消，不撤销已完成的修改；扩展不是沙箱。具体限制见[已批准的执行切片](docs/product-requirements.zh.md#req-006--执行审批策略)。

通过命令面板运行 **pi: Show Resource Loading Report** 查看只读加载报告。模板／skill 定义和扩展命令来自当前 runtime 的公开目录；AGENTS.md、skill 正文和全部扩展文件的加载若无法证明则标未知。清单登记／启用不等于已加载，报告不启动 runtime 或联网。

仅在 runtime 就绪且空闲时运行 **pi: Compact Context**。确认有损摘要（可能产生所选模型的正常费用），可添加有界指令；通过进度通知的 Cancel 或既有 Stop 请求取消。完成、失败与实际取消分别提示，未发送草稿保留，自动压缩与重试仍由上游负责。

输入独立 `@` 文件 query 后按 **Tab**，打开原生工作区模糊／路径发现。显式选择后附加成功仅移除 query token。发现只读名称、保留默认文件排除，最多展示 3000 安全路径并说明截断；取消／错误／失效保留草稿。敏感来源、大小和变化确认不变；有界列表外仍可使用既有文件附件选择器。

### 本地诊断导出

运行 **pi: Export Local Diagnostics**，先审查实际安装版本与既有 lifecycle flags 的冻结只读 JSON；审查后才点**导出已审查快照**。Cancel／关闭通知或取消目的地均不写文件。须选择**本地新文件**，拒绝覆盖已有文件／symlink。无源码、完整会话、凭据、标识／路径、env、日志／错误正文；无上传或后台收集。缺失版本 `null` 表示未知。取消在原子发布请求前生效，已发布文件不承诺撤回；失败重新运行恢复。[WI-088](docs/discussions/2026-10-02-wi-088-local-diagnostics.zh.md)保留 native 验收限制。

### Mermaid 回复图表

闭合 Mermaid flowchart／graph 与 sequence fence 可显式**渲染图表**；失败仍保留源码与**复制**。未支持、不安全、不完整或过大明确回退。沿用 CSP 本地渲染，不 source directive／callback／HTML／image／icon／隐式外部请求。限制包括 4096 UTF-16、40 行／statement、每行256、64 distinct／128 total words／40 edges；output 另有几何／element／byte 上限。取消与五秒结果截止丢弃迟到结果，不能抢占同步上游计算。图保留可读字号，可在局部可聚焦区域用方向键平移，不扩大页面；无新 host 权限／持久状态。[WI-087](docs/discussions/2026-10-02-wi-087-mermaid.zh.md)仍待原生验收。

### 已保存会话搜索

在对话历史显式输入名称／首条消息预览 query、仅命名筛选及 recent／oldest／name 排序后，按 Search／Enter 应用；未应用条件会标明，旧结果与分页仍使用上一次已应用搜索。Clear 恢复默认 catalogue。对完整批准当前项目 catalogue 先筛／排序再分页，不限当前页；不是全文／跨项目搜索。超过 5000 项或扫描截止明确失败，不冒用部分结果。query／筛选仅内存；恢复任意结果仍须既有交接确认。

### 模型与思考级别轮换

执行 **pi: Choose Model Cycling Subset**，在 native 多选中确认当前实际可用模型子集。初始为空、仅内存，工作区／runtime session 变化后重置。Escape 保留，确认空选择清空；2 分钟或状态变化后 picker 失效。**pi: Next Model / Previous Model** 按 catalogue 顺序仅轮换仍可用成员；**pi: Next Thinking Level / Previous Thinking Level** 轮换当前模型支持级别。空／不可用／受阻状态明确反馈；运行任务保留既有 next-turn 规则，失败明确、不假定应用。选择器与保存默认值不变。可经 VS Code 键盘设置绑定命令，不安装默认快捷键。

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

组包前必须先运行 `npm run compile`：缺少宿主 JS、webview JS／CSS 或三份 helper 之一时打包脚本会拒绝执行，而不是产出一个无法激活的包。`npm run verify:package-files` 检查同一清单，不组装归档。然后：

```bash
npm run package:vsix
```

`npm run package:vsix` 依据声明的 `files` 条目与固定版本的 pi 运行时子树组装 `dist/pi-vscode-validation.vsix`，包含其嵌套的生产依赖。传入 `--out <path>` 可选择其他输出位置。相同输入树下输出确定，打包脚本本身不发布、不签名、也不安装。若要本地安装到独立的扩展目录，可把 `--extensions-dir` 指向一个临时目录：

```bash
code --extensions-dir /tmp/pi-vsix-profile --install-extension dist/pi-vscode-validation.vsix
```

CLI 证明清单可安装，不证明激活或运行时行为。须分别验证 macOS 原生开发宿主与安装版宿主；Windows 实机验收在当前范围外。独立扩展目录不隔离 VS Code 应用级共享存储。

打包脚本调用 `zip` 命令。Windows 默认 shell 没有该命令，因此在那里打包会明确报错，而不会写出一个半成品归档；请在提供该命令的宿主上组包。

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
