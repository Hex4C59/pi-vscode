# WI-037：macOS 评估与验收

[English](2026-09-30-wi-037-macos-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-037-macos-acceptance.md](2026-09-30-wi-037-macos-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30

- 类型：参考
- 状态：已归档
- 创建：2026-09-30
- 处置：2026-09-30 由代理依据本次明确的实机取证并完结委托接受并关闭
- 权威：本批准切片的历史证据；不是整份 PRD、发布、gate 或其他 WI 的接受
- 范围：WI-032 既有凭据模式内的 RUNTIME-01／02；REQ-004 展示脱敏
- 验收身份：代理依据维护者 2026-09-30 明确要求完成实机取证并关闭任务，不伪称维护者亲自测试

## 批准行为与实现

共用展示脱敏隐藏完整引号凭据值，包含空白和转义引号；未闭合引号值隐藏余文。有效 JSON 经解析后只替换凭据值。Thinking 在宿主／适配层保留与 `ActivityItem.text` 分离的有界原始上下文，已识别的 Bearer、私钥或凭据字段值的后续片段不得泄露。每个已准入 thinking 条目原始上下文最多 16,384 个 UTF-16 单元。助手正文逐 delta 流式仍是已披露的范围外问题。未改 Webview DTO、pi API、gate 或 ADR。

## 自动化验证

记录于 Build，早于本次实机关闭。本次关闭未重跑应用 compile、lint 或 `npm test`。

| 检查 | 实际结果 | 范围 |
|---|---|---|
| `npm run compile`／`npm run lint`／`npm test` | 927 通过，0 失败／跳过；新增 32 项 | 经生产 decoder 与模拟宿主 `postMessage` 的 thinking 帧与宿主凭据投影回归 |
| 定向凭据／thinking 规格 | 92 通过 | 共用规则、thinking 脱敏与宿主投影 |
| 实现差异的 `git diff --check` | 通过 | 空白；不是行为证据 |

## 实机环境与来源

macOS 27.0.1（26A434），arm64；VS Code 1.139.1；已发布 pi 0.86.1。隔离根 `/private/tmp/pi-w037-6Uy3tX` 持有独立的 parent／dev／installed 用户数据及专用 `PI_CODING_AGENT_DIR`。未使用平时的 VS Code profile。无真实凭据、用户配置、付费调用或不受控网络。

更早一次隔离 `HOME` 的启动弹出 macOS **Keychain Not Found／Code Key**。该路径已放弃。接受所用的运行保留登录 `HOME`，并以 `--use-inmemory-secretstorage` 与 `--password-store=basic` 启动；若对话框再次出现只点 **Cancel**，从未使用 **Reset To Defaults**。接受运行未再弹出该对话框。

此前一次 F5 使用 `/tmp` 别名，gate 工作目录匹配失败，不记为通过。接受运行使用规范路径 `/private/tmp/...`，与 WI-035 记录的 macOS 别名教训相同。

实际 F5 由隔离父窗口通过指向本扩展源码的 scratch `launch.json`（`noDebug`）发出。Extension Development Host 复用父窗口远程调试端口 19470；这仍是真实 F5，不是用 CLI `--extensionDevelopmentPath` 替代。资源同意选择 **Continue without**。

安装版使用本 WI 已组好的 VSIX，以及隔离 `--extensions-dir` 列出的 `pi-vscode-dev.pi-vscode@0.86.1`。归档 149,813,579 字节；SHA-256 `a317981a706d1754208f099e4a5e5139fbb502dd6ade10ff4a78b068b960056f`。本次取证复用该归档（`WI037_SKIP_PACKAGE=1`），未重新组包。同会话更早 `verify-vsix` 已对该归档通过（15,535 条目，锁定 pi 0.86.1）。

回环 OpenAI 兼容 SSE 提供合成 `reasoning_content` 分片 `SYNTHETIC_PREFIX`／`SYNTHETIC_TAIL`／`SYNTHETIC_ALPHA`／`SYNTHETIC_BETA`，以及最终 `synthetic-complete`。观察到两次 completion 请求（F5 与安装版各一次）。

## 实际 thinking 脱敏证据

两个宿主的增量 thinking 投影相同。thinking 与正文均未出现 `SYNTHETIC_` 文本。

| 宿主 | 增量 thinking 帧 | 最终正文 |
|---|---|---|
| F5 | `""` → `use Bearer [redacted]` → `use Bearer [redacted] later; note password="[redacted]` → `use Bearer [redacted] later; note password="[redacted]" tail` | `synthetic-complete`；leaked false |
| 隔离安装版 | 相同四帧 | `synthetic-complete`；leaked false |

工作区截图显示折叠的 thinking 摘要 `use Bearer [redacted]`。CDP 展开 thinking 详情后记录了完整脱敏字符串，包括引号内的 password 值。本地原始证据仅留在被忽略的构建输出中：

```text
dist/delegated-macos-20260930/wi-037/report.json
dist/delegated-macos-20260930/wi-037/f5-after-stream.png
dist/delegated-macos-20260930/wi-037/installed-after-stream.png
```

被忽略的本地产物不是入库证明；以上标识与观察才是可保留摘要。

与接受根匹配的自有 Code 进程已停止；`cleanupRemaining` 为空。残留 `/tmp` 目录只是本地残留，不是活运行时。

## 失败、清理与限制

- 隔离 HOME 的钥匙串对话框和 `/tmp` 别名导致的 gate 工作目录失败已在取证脚本中纠正；那些尝试不是通过。
- 折叠的 thinking 界面在展开详情前不显示完整脱敏段落；通过依据是 CDP 帧加上折叠摘要截图。
- JSON／非结构化引号边界、overflow 与 reset 隔离仍是自动化证据，未在实机重放。
- 助手正文逐 delta 流式仍范围外。WI-036 仍在停车场。Windows F5／安装仍范围外。
- 不改变整份 Draft PRD、gate 或 ADR 状态。未提交或推送 Git。

## 最终处置

代理依据 2026-09-30 明确的实机取证并完结要求，接受并关闭 WI-037。实现、927 项自动化测试，以及分别捕获的 macOS F5 与隔离安装版 thinking 脱敏流满足本批准切片。文档验证／健康见 ACTIVE 关闭检查。只接受此项 REQ-004 修复。
