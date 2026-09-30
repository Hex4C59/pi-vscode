# WI-069：规范活跃模型身份验收

[English](2026-10-01-wi-069-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-069-acceptance.md](2026-10-01-wi-069-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01
- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 处置：2026-10-01 由代理依据完成 ACTIVE 的 `/goal` 接受并关闭
- 权威：本投影切片的历史证据；不是整份 PRD、gate 或 ADR 接受
- 范围：[已批准提案](2026-10-01-wi-069-approved-proposal.zh.md)
- 验收身份：代理依据维护者完成 ACTIVE.md 全部任务的 `/goal`；不是维护者本人测试

## 已批准行为

`formatModelLabel` 把活跃模型投影为 `provider / modelId`。显示名只留在目录 `label`。作曲区芯片（WI-066）与选择器 radio 身份（WI-042）不变。不声称运行时选了另一个模型。

## 验证

| 检查 | 实际结果 | 范围 |
|---|---|---|
| `npm run compile` | 通过 | 宿主／webview 打包与 `tsc --noEmit` |
| `npm run lint` | 通过 | `eslint src` |
| `npm test` | 1064 通过，0 失败／跳过 | 同名显示名投影为不同身份；规范身份仍只标一个 radio |
| 原生 F5 | 未跑 | 本 WI 不要求 |

## 限制

若 Webview 的 `chatModel` 只是重复的显示名，仍不会标 radio。生产宿主投影不再发出该字符串。芯片仍不显示供应商。

## 最终处置

WI-069 关闭。其余 ACTIVE 停车场从 REQ-009 macOS 证据余项开始。
