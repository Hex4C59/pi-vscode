# WI-034 macOS 代理受托评估

[English](2026-09-30-wi-034-macos-evaluation.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-034-macos-evaluation.md](2026-09-30-wi-034-macos-evaluation.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30

- 类型：Reference
- 状态：Archived
- 创建：2026-09-30
- 权威：限定切片的代理受托接受与关闭历史；现行工作见 [ACTIVE](../../ACTIVE.md)

## 2026-09-30 最终委托接受

维护者在初次证据交接后明确要求「你帮我审查完就不要我来独立接受了」，将 WI-032／WI-033／WI-034 的最终判断委托给代理。本记录自此为**代理受托接受并关闭**，不是维护者亲自测试，不再等待其独立接受。此前仅评估／待接受措辞在下方保留为初次取证时的历史，不是当前阻塞。因 WI 已关闭，双语记录成对从 discussions 归档。

接受并关闭已批准的确定性 VSIX 组包切片。组包规范测试、真实归档验证与解包后的 RPC／gate 就绪、隔离扩展安装、macOS 原生 F5／安装版激活渲染均通过。真实模型聊天与完整 REQ-009 验收不在本次关闭内。user-data 未隔离应用级共享存储的限制保留，批准切片所需的扩展安装隔离已成立。

只接受本 WI 的批准切片，不接受整份 Draft PRD，不改 gate／ADR，不提交 Git；原生未验证项不会因委托而变成通过。


## 授权与结论

9 月 30 日授权由代理在 macOS 评估本 WI，Windows 在验收范围外。这是**代理受托评估**，不是维护者接受、WI 关闭、整份 PRD 接受或 gate 变更。

组包、原生 F5 激活与渲染、独立安装版激活与渲染通过。两份宿主截图均为无文件夹窗口的实际 Pi 侧栏；不证明真实模型调用、可信工作区运行时生命周期或 WI-032／WI-033 故障路径。

## 本轮证据

平台：macOS 27.0（26A428）、arm64；VS Code 1.139.1、commit `04c0d99f4fb0d8afe6ce4f0c58e31e183ac3e4b1`；pi 0.86.1。本地产物在 `dist/delegated-macos-20260930/wi-034/`，属于忽略的构建证据，未提交。

| 检查 | 实际结果 |
|---|---|
| `npm run compile` | 当前构建与三组 TypeScript 检查通过 |
| `node --test scripts/packaging/package-vsix.spec.mjs` | 11 通过，0 失败／跳过 |
| `npm run package:vsix -- --out dist/delegated-macos-20260930/wi-034/pi-vscode.vsix` | 14,100 源条目；归档 149,811,688 字节 |
| 归档 SHA-256 | `b89582b84edbe4b7df59e0c1f1c26d870cc470eade38393995de432316d94aba` |
| `node scripts/packaging/verify-vsix.mjs dist/delegated-macos-20260930/wi-034/pi-vscode.vsix` | 15,535 归档条目；解包后的真实 pi RPC 就绪及 gate 握手通过 |
| `code --user-data-dir <本轮 installed-user> --extensions-dir <本轮 installed-extensions> --install-extension <本轮 VSIX> --force` | 退出 0，安装成功 |
| `code --extensions-dir <本轮 installed-extensions> --list-extensions --show-versions` | 仅 `pi-vscode-dev.pi-vscode@0.86.1` |
| 原生 F5 | 仓库父窗口的真实 F5 按键打开 Extension Development Host；Pi 原生标签加载实际 Webview；已查看 `f5-pi.png`；`f5-exthost.log` 记录 `onView:pi-vscode.chat` 激活 |
| 安装版宿主 | 单独原生进程，不带 `--extensionDevelopmentPath`；Pi 标签加载实际 Webview；已查看 `installed-pi.png`；`installed-exthost.log` 记录激活 |
| `npm run lint`；`npm test` | 通过；867 通过，0 失败／跳过 |

安装扩展目录为仓库绝对路径下的 `dist/delegated-macos-20260930/wi-034/installed-extensions`。实际 GUI 用户目录为 `/tmp/pi-w034.BE9NIf/dev-user` 与 `/tmp/pi-w034.BE9NIf/installed-user`；开发窗口扩展目录另用空的 `/tmp/pi-w034.BE9NIf/dev-ext`。未安装到维护者既有 profile。19434／19435 端口只用于本轮窗口查询和截图。

## 启动失败与限制

最初 GUI 启动继承了 `ELECTRON_RUN_AS_NODE=1`，启动器虽返回 0，但没有原生窗口。移除该变量后的直接原生启动又因仓库内用户目录超过 macOS Unix socket 长度上限而以 `EINVAL` 失败。短的一次性用户目录解决了该失败。这些是环境准备失败，不算宿主通过证据。

模拟命令面板快捷键未选中 Pi，反而进入内置 Copilot UI；未登录，已关闭其对话框。成功展示证据使用实际 Pi 原生标签，不使用该失败快捷键。F5 本身经真实工作台按键触发，没有用 CLI `--extensionDevelopmentPath` 启动替代。

最终检查：docs:verify／docs:health 零错误，仅 ADR 0005／0006 四条既有 Draft 提示。7 个安装版生产产物（host、supervisor、worker、gate、3 个 Webview 资源）与当前构建逐字节一致。Browser.close 在回复前断开取证客户端（客户端退出 13），但两个自有原生 job 随后均退出 0；宿主日志确认父窗口／开发窗口／安装窗口的 extension host 退出，按实际可执行文件筛选的进程查询确认无本轮自有 GUI 进程。保留一次性 profile 与安装产物供取证；未关闭既有窗口。

隔离限制：VS Code 1.139.1 本身会在既有 HOME 下初始化应用级共享存储 `.vscode-shared/sharedStorage/state.vscdb`，两个本轮 main 日志均有记录。因此独立 user-data／extensions 目录证明扩展安装隔离，**不是**完整 HOME／应用状态隔离。截图中的最近项目元数据来自该共享状态；未登录、未调用模型。

维护者接受仍待定；本次评估未改生产代码、PRD、ADR、gate 或 Git 提交。
