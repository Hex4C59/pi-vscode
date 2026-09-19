# AGENTS 内核（共享）

[English](AGENTS.kernel.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[AGENTS.kernel.md](AGENTS.kernel.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-19

- 类型：指南
- 状态：Accepted
- 创建：2026-09-19
- 权威：面向人类贡献者与编码 Agent 的跨项目规则
- 适用于：从本模板引导的每个产品仓库，以及编辑这些仓库的 Agent

将本文件（及 `AGENTS.kernel.zh.md`）复制到各**产品**仓库根目录。产品 `AGENTS.md` 补充项目事实、安全 L0、架构路径与 load map——**不得削弱**本内核。

## 权威栈（模式）

冲突时按此顺序——条目 (2)(3) 的具体路径写在产品 `AGENTS.md` 中：

1. 本内核与 `docs/guides/agent/` playbook 中的工程约束。
2. `Accepted` 后的产品需求文档（通常为 `docs/product-requirements.md`）。
3. 主系统架构（通常在 `docs/architecture/`）。
4. `ACTIVE.md` 中的当前工作项。
5. `docs/discussions/` 与 `docs/archive/` 仅作背景，**不是**实施依据。

关于事实、阶段或仓库状态，**仓库证据优先于迎合维护者表述**。产品取舍与是否开工仍由维护者决定。

## 阶段诚实

- 在验收、gate 关闭与维护者确认之前，不要将计划或受 gate 约束的能力描述为已交付。

## 不可协商（L0）

- 除非用户明确要求，不要创建、修改、合并或改写 Git 提交。

## 判断与诚实（L0）

- 仓库允许时给出**明确结论**（`yes` / `no` / `partly` / `not yet` / `unknown`）。勿因问题听起来像求肯定或求多做而默认附和。
- 论断须基于**本仓库**（`ACTIVE.md`、阶段、gate、文件、已运行命令）。勿为显得有用而编造缺口。
- 被问「还要优化什么」时，**可以**回答**当前无需实质改动**、**`ACTIVE.md` 队列已够**或**想法对本阶段过早**。仅当维护者**明确要求**头脑风暴、选项或 backlog 时才列可选想法。
- 维护者前提与文档/事实冲突时，**指出**并说明已核对内容；具体、专业，不 dismissive。
- 证据不足时说明缺什么；勿假装有把握。
- 本节不覆盖产品 `AGENTS.md` 中的安全 L0、维护者对**范围任务**的明确指示，或「未要求不 commit」。

**简例**

- 问：「加了 `docs:verify`，还要优化什么？」  
  **宜：**「当前 WI 前无必须项；可选：日后 CI 跑 `docs:verify`。」  
  **忌：**无依据地开新 WI 或大改。

- 问：「现在写 Accepted ADR？」  
  **宜：**「不行——spike 未确认；按 `ACTIVE.md` gate 仍为 `In spike`。」  
  **忌：**为讨好问题提前写 Accepted ADR。

更多模式：产品仓 `docs/guides/agent/judgment.md`；engineering-template 维护 `workflow/judgment.md`。

## 信任边界（抽象 L0）

具体规则写在产品 `AGENTS.md`。采用本内核的产品应落实相同**原则**：

- **低信任 UI** 不得接触凭据、任意宿主能力或直接访问上游 runtime API。
- **高信任宿主** 仅暴露**具名、白名单**的跨边界操作；在宿主侧校验输入。
- 当 SDK/RPC 已拥有 agent 循环、会话存储或 provider 栈时，**不要重复实现**——保持呈现层或集成层（除非产品 charter 另有说明）。
- runtime 以用户权限运行時，**不要暗示沙箱**；信任与权限须在 UI 与文档中可见。

## 分层模型（模式）

与框架无关（Electron、VS Code、Web、CLI）：

| 层 | 职责 |
|----|------|
| **UI** | 视图、输入、短期 UI 状态 |
| **Host** | 高权限能力、生命周期、经校验的 API 面 |
| **Adapter** | 上游 SDK/RPC → 内部事件；隔离版本变更 |
| **Runtime** | 上游模型、agent、工具、会话 |

流式与生命周期细节放在产品 playbook（如 `boundaries.md`），不写入本内核。

## ACTIVE 会话配对

维护者可仅 @ **`ACTIVE.md`** 开会话。Agent 必须：

1. 阅读 `ACTIVE.md`（会话契约摘要与当前 WI）。
2. 在提议或修改应用代码前**全文**阅读产品协作指南（如 `docs/guides/agent-collaboration.md`）。

仅当只读回答、无 WI 且无代码变更时可跳过第 2 步，除非涉及 gate、ADR 或关会话规则。

## 开始前

1. 阅读本内核、产品 `AGENTS.md`、`ACTIVE.md`、`README.md`、当前目录树、若有则 `package.json` 及相关测试。
2. 实现类会话须遵守 **ACTIVE 会话配对**，即使维护者未 @ 协作指南。
3. 保留用户无关的 Git 改动；使用仓库既定包管理器与脚本，不凭喜好换技术栈。
4. 若任务改变安全、持久化或上游集成策略，先澄清影响并记录决策，再大改。

## 架构治理

Agent **不会**保留聊天记忆。涉及**结构、边界、API、依赖、契约、所有权**以及并发、生命周期、安全、持久化、可观测、错误、测试、发布等质量属性时：

1. 优先读产品架构与 modules/reference 文档（若存在）。
2. 便携式清单：产品仓 `docs/guides/architecture-governance.md`；engineering-template 维护 `workflow/architecture-governance.md`。

在提议模块拆分、新公共面、跨层依赖或声称架构正确之前，**按清单扫描**并以文件路径标明 pass/gap。不要从 `Planned` 空壳臆造 owner 或 `Living` 契约。

## Playbook

详细约束在 `docs/guides/agent/` 下按主题渐进加载。产品 `AGENTS.md` 的 load map **必须**包含架构治理，并说明按路径打开哪个 playbook。

## 任务完成（内核）

1. WI 要求时须端到端可用，而非仅静态 UI。
2. WI 触及的行为须处理类型、错误、取消、清理与空状态。
3. 补充或更新相关测试并实际运行；若仓库定义了 lint/typecheck 须通过。
4. 未经明确验证不得扩大安全边界。
5. 用户可见行为或命令变更时更新文档（若适用）。

实质性文档变更后，运行仓库的文档校验命令（如 `npm run docs:verify`）。
