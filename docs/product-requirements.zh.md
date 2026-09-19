# pi VS Code — 产品需求

[English](product-requirements.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[product-requirements.md](product-requirements.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-19

- 类型：产品需求
- 状态：**Draft**
- 创建：2026-09-19
- 权威：**`Accepted` 后**为用户可见范围与验收；此前仅为提纲，非实现权威
- 相关：[`../ACTIVE.md`](../ACTIVE.md)、[`architecture/`](architecture/)、[`guides/agent-collaboration.md`](guides/agent-collaboration.md)

> **Draft：** 在提升本文档前，Agent 不得将此处当作已交付产品行为。工具链与 spike 以 **`ACTIVE.md` WI-001** 为准。

## 与当前工作的追溯

PRD 切片与 **WIP=1** 对齐。声称用户可见交付须同时满足 **Accepted PRD 章节** 与 **`ACTIVE.md` 验收**。

| WI ID | PRD 章节 | 验收（与 `ACTIVE.md` 一致或链接） |
|-------|----------|-----------------------------------|
| WI-001 | *（无 — 技术 spike）* | 见 `ACTIVE.md` 验收列表 |
| <!-- WI-002 --> | <!-- § 用户可见 … --> | <!-- WI 开启时复制验收项 --> |

**停车场** 想法留在 `ACTIVE.md`，直到有 WI 负责并在本表登记。

## 产品摘要（Draft）

已在 VS Code 中开发、希望用 **pi** 作为 coding agent 的用户，在编辑器旁获得 **侧栏聊天**（默认辅助侧栏），且聊天 UI 不直接接触密钥或 pi runtime。长期能力与 **pi-desktop** 对齐处尽量一致；VS Code 布局（左 Explorer、右聊天）优先于与 Electron 像素级一致。

## 用户可见需求（提纲）

用编号需求前请确认能持续维护。写**可观察行为**，不写实现。

| ID | 需求（Draft） | 备注 |
|----|---------------|------|
| REQ-001 | <!-- 例如：用户可以 … --> | <!-- WI-001 不做 --> |

## 非目标

- 默认使用编辑区标签聊天（停车场）
- 仅使用 VS Code 内置 Chat Participant 作为唯一 UI（停车场）
- 在本扩展内重实现 pi agent 循环、provider 或会话文件格式
- WI-001：真实聊天、会话或超出 dev spike 的付费 provider

## 初始化阶段不在范围内

WI-001（工具链 + spike）期间 REQ 行可留空或标 `deferred`。勿为纯 spike 将本文标为 `Accepted`。

## 提升为 `Accepted`

1. 维护者确认提纲与即将验收的 WI「完成」含义一致。
2. 将本文元数据 **Status** 改为 `Accepted`。
3. **追溯**表须链接负责 WI 与验收项。
4. 运行 `npm run docs:verify`。若用双语文档，将 `product-requirements.md` 加入 `scripts/docs-i18n-config.mjs`。
5. Agent 可引用 REQ ID 描述用户可见范围；结构与边界仍以架构与 gate 为准。

若要降级或替代：设 `Status: Superseded`，必要时将叙述移入 [`archive/`](archive/)，并开新 Draft PRD 或 WI。
