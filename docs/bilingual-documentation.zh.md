# 双语文档指南

[English](bilingual-documentation.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[bilingual-documentation.md](bilingual-documentation.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-19

- 类型：指南
- 状态：Accepted
- 创建：2026-09-19
- 权威：本产品仓库的语言配对规则

## 核心策略

- **英文为权威。** 中文为同目录下的 `*.zh.md`。
- H1 后紧跟语言切换：英文页链到 `basename.zh.md`；中文页链到 `basename.md`。
- 中文文件声明：翻译状态、权威原文、原文版本、最近同步。
- 有效翻译状态：`Machine Draft`、`Human Reviewed`、`Technically Verified`、`Stale`。
- 若冲突，先改英文，再同步中文。

## 机械检查

运行 `npm run docs:verify`（含 `docs:i18n:check`）。新增权威英文文档时，编辑 `scripts/docs/docs-i18n-config.mjs` 中的必需配对列表。

## 翻译生命周期（中文 `*.zh.md`）

1. **Machine Draft** — 初稿；英文未稳定前原文版本用 `Uncommitted baseline`。
2. **Human Reviewed** — 维护者通读中文；原文版本设为所审英文文件的 git commit；更新最近同步。
3. **Technically Verified** — 可选：英文大改后重跑 `docs:verify`。
4. **Stale** — 英文已漂移；修中文或标 Stale。

## 译文中的代码块

| 围栏标记 | 正文须与英文一致？ |
|----------|-------------------|
| `bash`、`json`、`typescript` 等 | **是** |
| `text` | **是** |
| `text prompt` | **否** — 维护者话术；同一序号英中均标 `prompt` |
| `text localized` | **否** — 标签可译、路径保留；两侧均标 `localized` |
| 前面紧邻 `<!-- docs-i18n: localized-mermaid -->` 的 `mermaid` | **否** — 可翻译图中标签，节点 ID 与连线保持一致；英中两侧均加注释，围栏仍须写成纯 `mermaid`，以便 Markdown 预览渲染 |

未标记的 Mermaid 图体不一致仍会报告警告；仅匹配的一对 Mermaid 围栏可使用此显式豁免。

## 范围

本指南适用于**文档**，不适用于应用内面向用户的 UI 文案（在产品 PRD 中单独定义 UI i18n）。
