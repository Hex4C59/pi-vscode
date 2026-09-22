# 架构 gate 跟踪表

[English](architecture-gates.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[architecture-gates.md](architecture-gates.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-22
- 类型：Reference
- 状态：Living
- 创建：2026-09-19
- 上次评审：2026-09-22（澄清状态语义与 gate 范围；未改变状态）
- 权威范围：哪些架构风险须有证据及 Accepted ADR 后，相关结论才可视为已成立
- 相关：[`../architecture/vscode-extension-architecture.zh.md`](../architecture/vscode-extension-architecture.zh.md)、[`ACTIVE.md`](../../ACTIVE.md)

## 架构 gate 是什么

架构 gate 是针对重要技术风险或边界进行跟踪的问题。它记录仓库何时具备足够证据和明确决策，使后续工作可以依赖一项范围明确的架构结论。

Gate 不是测试、工作项，也不等同于功能完成：

- **测试**为其覆盖的场景提供证据；它不能证明所有宿主、安装包、provider、生命周期交错或安全性质。
- **技术探针（spike）**是有边界的小型实验，用来发现真实依赖、宿主、构建或进程边界中的未知行为。它提供事实，但不自动成为产品代码或验收。
- **工作项（WI）**定义一块有范围的工作及其验收。一个 gate 可以跨多个 WI 收集证据；WI 完成不会自动接受相关 gate。
- **人工验收**为隔离测试不能证明的事项提供证据，例如真实 VS Code 扩展开发宿主或已安装 VSIX 中的行为。其范围必须被记录，不能随意外推。
- **ADR**记录维护者确认的架构选择、理由、备选项、后果、证据和已知限制。ADR 必须为 `Accepted`，gate 才能成为 `Accepted`。

证据支持决策，但任何一种证据都不会自动改变 gate 状态。尤其是，测试通过不会自动完成 WI 或接受 gate；F5 中行为正常也不代表已安装产物或完整边界均已验证。

口语中可以把 Accepted gate 说成“已关闭”，但本表保存的正式状态名是 `Accepted`。接受仅适用于该 gate 的精确范围；不得扩大成相邻产品功能、安全性质或部署环境均已完成的声明。

## 状态取值

### `Open`

该架构结论尚未成立。方案可能尚未确定，也可能已有部分实现或表面可用，但仍缺证据、边界分析、维护者确认或 Accepted ADR。

`Open` **不表示**没有代码或测试。它表示后续工作不得把完整 gate 结论当作已确定事实，文档也不得把该范围描述为已获架构接受。

### `In spike`

一个范围明确的技术调查正在进行。探针必须说明要回答的问题、版本／环境、成功与失败观察，以及它不能证明什么。例如验证上游 API、子进程关闭、Webview CSP／资源加载或已打包产物的行为。

`In spike` 不表示“快要 Accepted”，也不表示用户功能已经交付。失败或无结论的探针可以让 gate 回到 `Open`；成功探针只是待评审的证据，不会自动改变状态。

### `Accepted`

该 gate 的精确结论已有足够的范围化证据，已知限制已经记录，维护者已经确认架构选择，并且 ADR 列链接一份 **Accepted** ADR。后续工作可依赖这一狭义结论，直到它被取代；但不得忽略 ADR 中的排除项，也不得据此声称更广泛的产品成熟度。

因此，把 gate 改为 `Accepted`，既需要与风险相匹配的证据，也需要 [`../decisions/README.zh.md`](../decisions/README.zh.md) 所述的正式决策记录。验证或批准未完成时，保持 `Open` 或 `In spike`，并在 `ACTIVE.md` 记录缺少的条件。

## 状态摘要

| Gate ID | 跟踪的问题 | 状态 | ADR | ACTIVE |
|---------|------------|------|-----|--------|
| `gate-extension-host-baseline` | 扩展能否在支持的 VS Code extension host 基线中构建、激活和运行？ | `Accepted` | [0001](../decisions/0001-build-baseline.zh.md) | — |
| `gate-sidebar-chat-shell` | Pi Webview View 能否贡献并显示在辅助侧栏，并保留已记录的回退方向？ | `Accepted` | [0001](../decisions/0001-build-baseline.zh.md) | — |
| `gate-runtime-host` | pi 采用哪种宿主边界，能否启动、完成一次 RPC 往返并在有界时间内关闭？ | `Accepted` | [0001](../decisions/0001-build-baseline.zh.md) | — |
| `gate-webview-trust` | 低信任 Webview ↔ 高权限 extension host 的边界是否已完整定义并得到充分验证？ | `Open` | — | — |
| `gate-project-trust` | VS Code 工作区信任、pi 项目资源同意和工具审批是否已分离，并通过公开 API 正确映射？ | `Open` | — | — |
| `gate-session-streaming` | 端到端聊天流及其完成、取消、替换和失败生命周期是否已得到充分验证？ | `Open` | — | — |

## Gate 详细说明

### `gate-extension-host-baseline`

**问题。** 建立可复现的 extension host 基础：TypeScript strict 检查、manifest 入口对应的 esbuild 输出、Extension Development Host 中的 F5 激活，以及 VS Code 1.85+ 的基础构建／打包方向。

**已接受的证据与决策。** WI-001 记录了构建配置和维护者观察到的 F5 激活；[ADR 0001](../decisions/0001-build-baseline.zh.md) 于 2026-09-19 接受该基线。

**不代表。** 它不证明所有兼容分叉、操作系统或已安装 VSIX 场景；不接受最终用户聊天、Webview 信任、运行时流式或发布就绪。后续打包证据有其自身记录范围，不会重写 WI-001 的历史证据。

### `gate-sidebar-chat-shell`

**问题。** 建立扩展可以通过 `WebviewViewProvider` 注册 `pi-vscode.chat`，优先放在辅助侧栏，保留主侧栏回退方向，并显示初始 Webview 壳。

**已接受的证据与决策。** WI-001 包含维护者在 F5 中观察 Pi 占位视图的证据；[ADR 0001](../decisions/0001-build-baseline.zh.md) 接受该壳和位置选择。

**不代表。** 该 gate 覆盖的是初始壳，不是后来的完整聊天 UI。它不接受完整 `postMessage` 信任边界、流式、受控执行、无障碍矩阵或当前视觉实现。

### `gate-runtime-host`

**问题。** 选择扩展承载 pi 的边界，并证明最小生命周期：定位并启动固定版本的 runtime、交换一次 LF 分隔的 JSON RPC 请求／响应，并在有界时间内终止。

**已接受的证据与决策。** WI-001 runtime 探针对当时固定的包执行了 `get_state` 和有界关闭；[ADR 0001](../decisions/0001-build-baseline.zh.md) 选择子进程 RPC 边界，而不是在 extension host 中重写 agent 循环。

**不代表。** 它不证明长生命周期会话、所有 provider、完整 Stop 语义、重试／压缩顺序、工具审批、崩溃恢复或所有后代进程均能取消。特定包版本的历史证据仍仅适用于所记录的版本与环境。

### `gate-webview-trust`

**问题。** 建立浏览器式 Webview 代码与高权限 extension host 之间的信任边界。目标结论包括：版本化且有 allowlist 的消息契约；对所有入站 `unknown` 值进行运行时校验；严格 CSP 和受控本地资源；Webview 中没有凭证、Node API、文件系统／shell 或 pi SDK；有界且由 host 拥有的出站 DTO；拒绝过期视图／代次；不存在通用命令或 RPC 桥。

**预期证据。** 契约及解析器测试、畸形／未知／超限／过期消息覆盖、CSP 与资源加载检查、密钥隔离审查、生命周期清理检查，以及适用的 F5 或打包宿主验证。所有权必须保持为 `src/webview/` 只表达 UI 意图，`src/extension/` 持有高权限校验与状态。见 [`webview-messages.zh.md`](webview-messages.zh.md)。

**当前状态与限制。** 已有大量协议、CSP、代次、有界投影和 UI 证据，但契约仍为 `Outline`，架构记录仍保留未完成的真实宿主／分叉及生命周期／安全边界验证，也没有 Accepted ADR 接受完整信任结论。因此该 gate 保持 `Open`；不能把已有聊天行为外推为完整 Webview 信任验证。

### `gate-project-trust`

**问题。** 使用公开 API 建立 VS Code 工作区到 pi 项目资源同意的映射，同时区分三个概念：VS Code 工作区信任、pi 项目资源同意和逐工具审批。边界必须覆盖无目录、多根、远程 extension host、非 `file` URI、信任变化、工作区代次／替换，以及 allow／decline 行为；不得伪造或持久化上游信任。

**预期证据。** 支持的 pi 资源 flag／行为的公开 API 证据、宿主状态和过期操作测试、真实 VS Code 信任／重载与目录转换检查，以及明确说明 allow 和 decline 授权什么、不授权什么的决策。

**当前状态与限制。** 工作区资格和内存内资源选择已在限定切片中实现并测试，但真实宿主覆盖和完整边界决策仍未完成。允许资源不等于工具授权；拒绝资源也不表示所有项目上下文均被排除。两种选择都不是文件系统／网络沙箱。该 gate 保持 `Open`。

### `gate-session-streaming`

**问题。** 建立 `Webview → host → adapter → runtime` 及返回方向的端到端生命周期：prompt 接受与完成的区别、事件关联及顺序、有界投影、权威 settled 边界、重试／压缩／排队续跑、Stop 与取消、runtime 失败、session／runtime 替换、过期事件、清理及可恢复错误。

**预期证据。** Adapter 与 host 对事件顺序、迟到完成、取消及替换的测试；上游语义的真实 runtime 探针；流式／Stop／失败可观察行为的 F5 检查；适用的打包宿主证据；以及固定完成边界与所有权的 Accepted 决策。

**当前状态与限制。** 纯文本流式、活动投影、`agent_settled`、受控执行和 Stop 已有有界实现及记录的自动化／探针／F5 证据。但已安装 VSIX 验证、外部 provider 广度、完整生命周期交错和待决边界 ADR 仍未完成。可见文本 delta 或某个 WI 完成，不能单独接受完整 session 生命周期，因此该 gate 保持 `Open`。

## 新增或替代 gate

只有新发现的问题属于重要架构风险或边界，而且需要阻止后续工作过早把它当作已确定事实时，才新增 gate。典型候选涉及信任、进程或部署模型、持久化、上游集成、生命周期／并发，或其他难以逆转且可能需要跨多个改动收集证据的基础。普通功能任务、视觉选择、重构和孤立回归应放在 WI 与测试中，而不是建立新 gate。

新增前须完成以下步骤：

1. **检查现有覆盖。** 如果新问题属于相同风险并共享同一决策，应优先澄清现有 gate。不要为了跟踪实现工作而创建以 WI、框架或拟议答案命名的 gate。
2. **定义稳定问题。** 使用 `gate-<架构主题>`，摘要描述需要建立的风险结论，而不是预设方案；例如描述交付边界，而不是 `gate-use-react`。
3. **定义证据与排除项。** 详细条目必须说明问题、预期证据、当前状态／限制，以及即使 Accepted 也不能据此证明什么。证据应匹配具体风险，而不是套用一份万能清单。
4. **关联活动所有权。** 在 `ACTIVE.md` 的相关当前 WI 中记录 Gate ID、决策类和缺失条件。一个 gate 可以跨多个 WI，但 WIP=1 下仍然只有一个当前 WI。
5. **保守起步。** 新 gate 通常从 `Open` 开始。只有一个说明了问题、环境和限制的有界调查确实正在进行时，才使用 `In spike`。不能仅因已有实现就把新 gate 直接建成 `Accepted`。
6. **要求正式决策。** 只有维护者确认架构选择、足够的范围化验证已经记录，并且摘要链接 Accepted ADR 后，才能变为 `Accepted`。

框架选择或其他值得 ADR 记录的决策，不会自动需要独立 gate。如果该选择已被现有 gate 包含，或可在一个 WI 内接受而不会成为可复用的跨 WI 风险边界，应在适当的 ADR／WI 中记录即可。例如 Webview 框架评估应先核对 `gate-webview-trust`；只有调查证明存在独立的打包／部署风险及其单独验收边界时，才有理由建立独立的交付 gate。

合并、拆分、重命名或取代 gate 时，不得抹除历史。旧 ID 及其处置结果必须仍可发现，并链接替代 gate 与 ADR；同步更新引用和 `ACTIVE.md`，同时按原有限制保留特定版本的证据。

## 状态变更规则

只有在按 gate 精确范围核对当前证据与限制后，才可更新状态。`Accepted` 必须在摘要中链接 Accepted ADR。活动调查或缺失验收条件记录在 `ACTIVE.md`；保留特定版本的探针证据，不得静默把它当成永久事实。

**WI-001：** 上述三个基础 gate 已由 [ADR 0001](../decisions/0001-build-baseline.zh.md) 于 2026-09-19 接受。最终用户聊天仍受保持 Open 的 `gate-webview-trust`、`gate-project-trust` 和 `gate-session-streaming` 结论约束。
