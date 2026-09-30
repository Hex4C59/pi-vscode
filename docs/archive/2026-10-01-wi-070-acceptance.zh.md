# WI-070：macOS REQ-009 五类证据验收

[English](2026-10-01-wi-070-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-070-acceptance.md](2026-10-01-wi-070-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01
- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 处置：2026-10-01 由代理依据完成 ACTIVE 的 `/goal` 接受并关闭
- 权威：本验证切片的历史证据；不是整份 PRD、gate 或 ADR 接受
- 范围：[已批准提案](2026-10-01-wi-070-approved-proposal.zh.md)
- 验收身份：代理依据维护者完成 ACTIVE.md 全部任务的 `/goal`；不是维护者本人测试

## 主机与安装包

- Darwin 27.0.0 arm64，VS Code 1.139.1，pi **0.86.1**
- 隔离安装包 `dist/wi070-macos-matrix/pi-vscode.vsix`（gitignored）：149 927 076 字节，SHA-256 `de5dff2cf6e600a9e483100378bc4d3f15786910734ee792bb2d046639642f12`
- 配置根 `/private/tmp/pi-acc-ufh7Xq`；`PI_CODING_AGENT_DIR` 在该树内；`--use-inmemory-secretstorage`
- 真实扩展：未改的 `pi-system-prompt-manager` 0.1.1，commit `9c8f546b875f929ad5d573fe30e7a7fd6e3ae924`
- 跑次脚本与截图留在 gitignored 的 `dist/wi070-macos-matrix/`；本记录是提交进库的证据表

未重跑原生 F5。自用验收主机是安装包。

## 当前 macOS 证据表

| 格子 | 主机 | 结果 | 记录 |
|---|---|---|---|
| CF-01 供应商／模型成功 | installed-vsix | `live-endpoint-ok`；芯片 `Offline-Fixture`；无静默替换 | `dist/wi070-macos-matrix/cf02-allow.png` |
| CF-01 供应商／模型失败 | installed-vsix | 空目录；芯片 `Model not configured`；无 `live-endpoint-ok` | `dist/wi070-macos-matrix/cf01-empty.png` |
| CF-02 资源允许 | installed-vsix | POST 正文含 `WI070_AGENTS`、`WI070_SYSTEM`、`WI070_PROMPT`；skill **名** `fixture-skill` 出现 | `dist/wi070-macos-matrix/cf02-allow-body.json` |
| CF-02 资源拒绝 | installed-vsix | `#declined-resources` 提示；无 `WI070_SYSTEM`／`WI070_PROMPT`；按上游仍可有 AGENTS | `dist/wi070-macos-matrix/cf02-decline.png`、`cf02-decline-body.json` |
| CF-03 扩展命令 | installed-vsix | 原生 sheet `Load trusted extension`；徽章 **Trusted execution**；真实扩展处理 `/sysprompt` | `dist/wi070-macos-matrix/cf03-trusted.png` |
| CF-04 标准扩展 UI | installed-vsix | 侧栏 select：System prompt、surgical／concise／plan-first、Submit／Cancel | `dist/wi070-macos-matrix/cf04-dialog.png` |
| CF-05 已保存会话 | installed-vsix | 聊天历史列出同项目 `ping isolated runtime` | `dist/wi070-macos-matrix/cf05-sessions.png` |
| 编程闭环（发送／流式／完成） | installed-vsix | 三轮 `live-endpoint-ok`；`/sysprompt` 期间可见 Stop | `dist/wi070-macos-matrix/cf02-allow.png`、`cf04-dialog.png` |
| 恢复 | installed-vsix | SIGKILL 自有 child；恢复条；Recover controlled execution | `dist/wi070-macos-matrix/recovery.png` |

Windows WI-008／009／010／013／014／016／017 记录仍是 Windows，不改写成 macOS。

`report.json` 中 owned 根 `/private/tmp/pi-acc-ufh7Xq` 的 runner 矩阵快照：

```json
{
  "cf01Success": { "pass": true, "host": "installed-vsix", "record": "cf02-allow.png" },
  "cf01Failure": { "pass": true, "host": "installed-vsix", "record": "cf01-empty.png" },
  "cf02Allow": { "pass": true, "host": "installed-vsix", "record": "cf02-allow-body.json" },
  "cf02Decline": { "pass": true, "host": "installed-vsix", "record": "cf02-decline.png" },
  "cf03": { "pass": true, "host": "installed-vsix", "record": "cf03-trusted.png" },
  "cf04": { "pass": true, "host": "installed-vsix", "record": "cf04-dialog.png" },
  "cf05": { "pass": true, "host": "installed-vsix", "record": "cf05-sessions.png" },
  "codingLoop": { "pass": true, "host": "installed-vsix", "record": "cf02-allow.png" },
  "recovery": { "pass": true, "host": "installed-vsix", "record": "recovery.png" }
}
```

## 验证

| 检查 | 实际结果 | 范围 |
|---|---|---|
| 隔离安装包 | 上表通过 | 当前 HEAD 包；回环供应商；捕获 POST 正文 |
| 原生 F5 | 未跑 | 自用主机是安装包；安装格齐后不要求 F5 |
| `npm run compile`／`lint`／`npm test` | 未重跑 | 未改应用源码 |

## 限制

- 捕获的 POST 没有 skill **正文** 标记 `WI070_SKILL`；允许路径只出现 skill **名**。不声称显式 skill 正文调用。
- 附件挑选与变更审阅（WI-014／016）未在 macOS 重跑。此处编程闭环是发送→流式→完成，以及扩展 select 期间的 Stop。
- CF-05 是本次安装包同项目历史，不是 macOS 上的终端 pi 顺序交接。
- 双窗口崩溃恢复仍以 2026-09-30 macOS 记录为准；本切片在单窗口 SIGKILL 自有 child。
- jsdom／Vite 不作平台证据。Draft ADR 0010 仍为 Draft。

## 最终处置

WI-070 关闭。其余 ACTIVE 停车场从 Webview 目录整理开始。
