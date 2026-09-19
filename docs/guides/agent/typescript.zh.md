# TypeScript / Node Agent Playbook

[English](typescript.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[typescript.md](typescript.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-19

- 类型：指南
- 状态：Accepted
- 创建：2026-09-19
- 权威：产品使用 Node 上 TypeScript 时的约定

复制到产品仓 `docs/guides/agent/typescript.md`（及可选 `.zh.md`）。

## 默认

- 公共模块边界使用严格 `tsconfig` 与显式类型。
- 声称 WI 可验收前，运行仓库的 `lint`、`typecheck`、`test`。
- 影响信任边界的依赖须在架构或 ADR 中说明。

## 边界

- 除非架构与 `AGENTS.md` L0 允许，UI/renderer 勿直接 import Node 专用或 SDK 模块。
- 共享类型放在文档化的契约位置，勿重复 ad-hoc 定义。

## 会话

- 编辑应用路径下 `.ts` / `.tsx` 时加载本文件；新公共面配合 `docs/guides/architecture-governance.md`。
