# WI-071：已批准的 Webview 目录整理

[English](2026-10-01-wi-071-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-071-approved-proposal.md](2026-10-01-wi-071-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Authority: 历史已批准范围，不是后续切片的新 Build 授权
- 归档原因：WI-071 已按 Webview README 树分组展示文件；其余 ACTIVE 任务独立。

## 批准与追溯

维护者 `/goal` 完成 ACTIVE.md 全部任务，在 WI-070 之后授权本 Build。纯技术：按已有 Webview 文件分组，不改用户可见行为、协议或契约。Decision：none。无 gate。无新 PRD 行。

## 目标与范围

把 `src/webview/` 落到 README 树：`chat/{composer,conversation,sessions,execution,workspace}`、`client/`、`i18n/`，确认复用的展示放入 `ui/`，`components/` 保留为展示层公共入口。保留生产／预览分界。不重命名 `candidate-*`。除必要路径更新外不改 CSS 级联语义。

## 方案

按功能 `git mv`，改写相对 import，在 `styles.css` 保留样式顺序，并满足 `architecture-boundaries` 公共入口规则，不为功能子目录新增模块。客户端类型放在 `client/types.ts`；Webview 层 `types.ts` 再导出。`UiLanguageState` 与 `i18n/ui-language.ts` 放在一起；`chat/types.ts` 再导出。

## 验收

`npm run compile`、`npm run lint`、`npm test`。生产仍从 `main.tsx` 挂载。无用户可见行为变化。路径更新后跑 `docs:verify`。

## 后续限制

Runtime rpc 分组。docs 目录检索与 PI-GAP 候选仍停放，除非另行晋升。
