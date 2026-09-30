# macOS 验证与自用验收（2026-09-30）

[English](2026-09-30-macos-verification-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-macos-verification-acceptance.md](2026-09-30-macos-verification-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 处置：代理依据维护者 `/goal` 完成全部剩余 macOS 验证与验收事项后结案
- 权威：WI-058 双窗口 F5／安装版、WI-036 窗口崩溃 F5／安装版、ADR 0005 真实 OAuth／端点／新 VSIX、以及自用 PRD 验收的历史证据；不接受公开发布、Windows、Cursor、跳过审批、额外 OS 或 gate 变更
- 验收身份：该 `/goal` 下的代理；不是维护者亲自跑过这些宿主

## 本记录关闭的范围

| 事项 | 结果 |
|---|---|
| WI-058 双窗口 macOS F5＋隔离安装版 VSIX、同一文件夹 | 两个 `recovery-v1/windows/<uuid>/` 域、两个自有 `pi` child、两个扩展宿主 owner PID |
| WI-036 窗口崩溃 F5＋隔离安装版 VSIX | SIGKILL 其中一个窗口的 `node.mojom.NodeService` 所有者；受害域 `child-exited` 回执；兄弟仍为 `owned` 且 `endRequested: false` |
| ADR 0005 真实端点＋真实 OAuth 交互＋新安装包 | 写入无 `apiKey` 的 `live-loopback`；一次 `/chat/completions` 返回 `live-endpoint-ok`；GitHub Copilot 登录显示原生设备码并打开浏览器 |
| 整份 Draft PRD 作为自用 macOS 安装版 | 已接受，standing non-goals 不变 |

Windows 实机 F5／VSIX 仍范围外。无 Git 提交或推送。本验证会话**未重跑**自动化 `compile`／`lint`／`npm test`；下列原生证据才是新事实。

## 共用包与宿主

- macOS 27.0.0 arm64，VS Code 1.139.1
- 隔离 VSIX（gitignored 跑证产物）149 922 470 字节，SHA-256 `9ea45ac170e86036324b87490d7d3036612a484a54a90a1ddae1911278121271`
- `verify-vsix` 通过：15 535 条目，钉死 pi **0.86.1**
- 隔离 `--user-data-dir` 在 `/private/tmp/pi-acc-*`；`PI_CODING_AGENT_DIR` 同树；`--use-inmemory-secretstorage`

F5 在父工作台对生成的 `launch.json` **Run Extension** 按下 **F5**（CDP＋osascript），得到 `[Extension Development Host] A`。第一窗口不是 CLI `--extensionDevelopmentPath` 替代。

## WI-058／WI-036 原生跑次

同一 profile 的两个窗口。fence 在 `User/globalStorage/pi-vscode-dev.pi-vscode/recovery-v1/windows/`。第二窗口在 Duplicate Workspace 或原生 Open folder 后标题常为 **Untitled (Workspace)**（VS Code 复用已打开的文件夹 A，而不是再挂一个标题为 `A` 的窗口）。两窗口仍各自有独立域和 `pi` child。

| 阶段 | 占用根 | 双域 | 崩溃 |
|---|---|---|---|
| 安装版（首次） | `/private/tmp/pi-acc-e6iQve` | `460840cd-…`／`e477fefc-…`；owner 14329／14490 | 受害 child 已死；兄弟仍活；回执 `child-exited` 143 |
| 安装版（重排确认） | `/private/tmp/pi-acc-02BBf7` | `ok: true`，`victimGone`／`siblingAlive` | 相同断言 |
| F5 | `/private/tmp/pi-acc-csw5Bn` | `d58963cb-…`／`fa1ad5be-…`；owner 18651／18625 | 受害 child 已死；兄弟仍活；回执 `child-exited` 143 |

本地 JSON：`dist/macos-acceptance-20260930/{installed,f5}-{dual,crash}.json`（gitignored）。

## ADR 0005 原生跑次

占用根 `/private/tmp/pi-acc-ywKbpR`（安装版 VSIX，隔离 `auth-user`）。

**真实自定义端点。** 设置页添加端点写入 `live-loopback`：`api: "openai-completions"`，无 `apiKey`。项目资源拒绝后真实发送，loopback 记录 **一次** `/chat/completions`，聊天正文含 `live-endpoint-ok`。

**真实浏览器登录。** Providers → GitHub Copilot → Sign in。原生提示 GitHub Enterprise URL（空则 github.com）。确认后显示 **Sign-in code: C649-184F** 且 `browserOpened: true`。隔离 `auth.json` 仍无键：该一次性 profile 未完成 GitHub 账号步骤。令牌、验证码与授权 URL 未进入 Webview。这记录 ADR 要求的宿主 OAuth 交互，不是隔离 profile 里已保存的 Copilot 会话。

## 自用 PRD

接受 2026-09-22 自用目标在 **macOS 本机 VS Code** 上的交付，含双窗口恢复、宿主丢失精确 child 清理、自定义端点写入＋真实调用、以及设备码／浏览器 OAuth 路径。standing non-goals 仍排除：额外扩展生态、Chat Participant、远程／多根、额外 OS、跳过审批、公开发布、图片／PDF／表格／语法高亮、历史回滚、框架更换。

## 限制

- 第二窗口标题常为 Untitled (Workspace)，不是第二个标题 `A`。
- F5 第二窗口使用父 profile 已装 VSIX 才能激活 Untitled 中的 Pi；第一窗口仍是 Extension Development Host。
- GitHub Copilot 设备码流程未写进隔离 `auth.json`。
- 无 Windows 宿主。不关闭 gate。不提交。
