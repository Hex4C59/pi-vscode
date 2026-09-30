# WI-071：Webview 目录整理验收

[English](2026-10-01-wi-071-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-071-acceptance.md](2026-10-01-wi-071-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Disposition: 2026-10-01 由代理依据完成 ACTIVE 的 `/goal` 接受并关闭
- Authority: 本技术切片的历史证据；不是整份 PRD、gate 或 ADR 接受
- Scope: [批准提案](2026-10-01-wi-071-approved-proposal.zh.md)
- 验收身份：维护者要求完成 ACTIVE.md 全部任务的 `/goal` 下的代理；不是维护者本人实测

## 已批准行为

展示文件现按 [src/webview/README.md](../../src/webview/README.md) 组织。`components/` 仍是展示层公共入口。功能子目录只是内部分组。生产仍从 `main.tsx` 挂载。协议、CSS 级联顺序和用户可见行为未改。

## 归属

| 目录 | 内容 |
|---|---|
| `client/` | 桥接、解析、webview 客户端、快照辅助、客户端类型 |
| `chat/composer/` | 输入区、上下文、模型选择器／展示、输入区 CSS |
| `chat/conversation/` | 会话、Markdown、欢迎标志 |
| `chat/sessions/` | 导航、已保存历史、会话图标 |
| `chat/execution/` | 任务状态、审批、变更审阅、扩展交互、活动 CSS |
| `chat/workspace/` | 文件夹／资源提示与工作区就绪 |
| `ui/` | 共用 `chat-dialog` 与 `chat-preview` |
| `i18n/` | 语言包与 `UiLanguageState` |

`candidate-*` 名称未改。

## 验证

| 检查 | 实际结果 | 范围 |
|---|---|---|
| `npm run compile` | 通过 | 宿主／webview 打包与 `tsc --noEmit` |
| `npm run lint` | 通过 | `eslint src` |
| `npm test` | 1064 通过，0 失败／跳过 | 含架构公共入口、组包路径断言与 webview 规格 |
| `npm run docs:verify` | 0 错误；2 条 Draft-ADR-0010 警告 | anatomy、README 与讨论定位器的路径更新 |
| 原生 F5 | 未跑 | 本技术 WI 不要求 |

## 限制

功能文件夹不是新的模块接口。`components/index.ts` 仍再导出实现。Runtime rpc 分组是后续 WI。docs 目录检索与 PI-GAP 候选仍停放。

## 最终处置

WI-071 关闭。其余 ACTIVE 停车场从 Runtime rpc 分组开始。
