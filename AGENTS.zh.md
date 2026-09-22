# AGENTS.md

[English](AGENTS.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[AGENTS.md](AGENTS.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-22

**pi VS Code** 的项目专用 Agent 工作规则。通用规则见 [`AGENTS.kernel.zh.md`](AGENTS.kernel.zh.md)（英文：[`AGENTS.kernel.md`](AGENTS.kernel.md)）——从 engineering-template 复制该对，内核升级时保持同步。

详细 playbook 在 `docs/guides/agent/`（见 **加载地图**）。

## 文档职责与冲突优先级

针对不同问题，应使用相应文档。以下列表也按冲突时的优先级从高到低排列：

1. **`AGENTS.kernel.md` 与 `docs/guides/agent/` playbook** 规定必须遵守的安全、工程、测试、协作及 Agent 操作规则。工作项或历史讨论不能绕过这些规则。
2. **状态为 `Accepted` 的 `docs/product-requirements.md`** 规定已批准的用户可见行为、产品范围及验收。PRD 仍为 `Draft` 时，其中的候选内容不会自动成为已批准范围。对于单独获批的切片，应核对 `ACTIVE.md` 中的批准范围和对应需求；切片批准不代表整份 PRD 已被接受。
3. **`docs/architecture/vscode-extension-architecture.md`** 规定系统结构、分层、依赖方向、信任边界和职责所有者。计划中的架构本身不证明已经实现或交付。
4. **`ACTIVE.md`** 规定当前 WI、阶段、已批准范围、验收和交接。它不能静默改变更高优先级规则、Accepted 产品需求或架构边界。
5. **`docs/discussions/` 与 `docs/archive/`** 保存调查、历史证据和过去上下文。除非某项结论已经进入当前权威文档或 Accepted ADR，否则它不构成当前实现授权。

只有文档针对**同一个问题**提出无法同时满足的要求时，才算发生**冲突**。不同文档回答不同问题属于互相补充，不是冲突。例如：PRD 可以要求提供 Stop，架构可以规定由 extension host 协调 Stop，`ACTIVE.md` 可以把当前 WI 限定为 Stop 的一个切片；三者可以同时成立。

发现真实冲突时：

1. 暂停执行冲突部分，并指出具体要求和文件。
2. 按上述优先级处理；不要静默猜测，也不要把低优先级上下文当作当前权威。
3. 在已授权任务允许时，修正或标记低优先级的过期文字。
4. 如果解决方案改变产品取舍或重要架构决策，继续前须取得维护者确认，并按正常 PRD／ADR 流程记录。

## 项目事实

- 在用户写代码时，于 **侧栏 Webview** 中呈现 [pi](https://github.com/earendil-works/pi)；默认 **辅助侧栏（右侧）**，**主侧栏（左）保留资源管理器**（对标 Copilot / Codex 布局）。
- **交付状态：** 以当前 WI 和验证记录为依据；计划功能、局部实现和测试通过不等于完整验收。
- **兼容范围：** 声明支持的 VS Code 版本范围见 [`package.json`](package.json)。Cursor、Windsurf 等兼容编辑器仅尽力支持，需要独立证据。修改侧栏位置时，应核实目标宿主是否支持辅助侧栏，并记录主侧栏回退方案；版本声明本身不证明侧栏位置受支持。
- **参考客户端：** [pi-desktop](https://github.com/earendil-works/pi-desktop) 用于参考产品目标与 pi 边界，不用于照搬 Electron IPC 模式。相邻仓库未经维护者要求均只读；`../pi` 的具体使用规则见下方 pi 集成参考。

## 必须遵守的产品安全规则（L0）

- **密钥**仅 extension host（`SecretStorage` 等），不得进入 webview HTML、webview 存储或发往 webview 的 `postMessage`。
- **Webview** 仅展示：无 Node、无 pi SDK、无直连 `fs`/`child_process`。host 校验入站消息；真实聊天前须有允许列表、版本化协议（`gate-webview-trust`）。
- **勿在本仓重实现** pi agent 循环、provider 或压缩——仅通过文档化 SDK/RPC 编排（`docs/guides/agent/pi-integration.md`）。
- **会话存储：** 除非 Accepted ADR 明确允许，会话功能不随意读写 pi 会话文件；用 SDK/RPC 会话 API。
- **沙箱诚实性：** 扩展不是对抗恶意工作区内容的安全边界；工具与 shell 仍由 pi 与用户信任设置决定。

内核 L0（提交、 judgment）仍以 `AGENTS.kernel.md` 为准。

## 系统分层与职责

- **UI：** 侧栏 `WebviewView`（优先辅助侧栏）— 聊天 UI、流式展示、临时 UI 状态。
- **Host：** VS Code extension host — 激活、命令、配置、密钥、工作区策略、webview 生命周期、消息桥。
- **Adapter：** pi SDK 或子进程 RPC ↔ 供 host/webview 使用的领域事件。
- **Runtime：** pi coding-agent（上游包或子进程）。

修改流式处理、Stop、视图重建或运行时替换时，阅读[架构文档](docs/architecture/vscode-extension-architecture.zh.md)中的生命周期说明及 [Webview 消息契约](docs/reference/webview-messages.zh.md)。

## 开始任务时

1. 按 `AGENTS.kernel.zh.md` 的“开始任务时”要求读取基础上下文，包括当前仓库脚本和相关测试。
2. 实现代码或继续 WI 前，完整阅读 [`ACTIVE.md`](ACTIVE.md) 中的当前提案及[协作指南](docs/guides/agent-collaboration.zh.md)。只读问答适用内核规定的有限例外，不要把每个问题都转成实现任务。
3. 按下方加载地图读取所有适用路线；仅在当前问题需要历史证据时读取归档材料。
4. 修改应用代码前核对已记录的批准范围。Prepare 提案不是 Build 授权；进入实现前必须取得并记录维护者批准。

仅 @ `ACTIVE.md`（或说「继续 pi VS Code」）只是提供会话入口，不免除必读规则或审批。保持一个当前 WI（WIP=1）；记录讨论不等于授权实现。创建 Git commit 仍须维护者明确要求。

## 对话记录

在讨论形成阶段性结论、方案获得确认及 WI 收尾时，遵循[协作指南 §7](docs/guides/agent-collaboration.zh.md#7-agent-义务)，包括仅讨论的会话。Agent 负责分类、记录和范围内归档；维护者负责决策与验收。落盘前阅读该指南，不要求维护者选择目录或重复批准常规记录整理。

## 加载地图

根据当前任务实际修改的内容选择对应行。一项任务可能同时符合多行，此时应读取所有适用路线，但默认不必从头到尾阅读整张表。基础必读仍由 `AGENTS.kernel.md` 规定。当范围、约束、契约和所需证据已经明确时停止展开链接；证据缺失或冲突时必须报告，不得猜测。

| 当前任务涉及…… | 先阅读 |
|------------------|--------|
| 修改 TypeScript 源码、依赖、编译器或构建配置 | [`docs/guides/agent/typescript.zh.md`](docs/guides/agent/typescript.zh.md) |
| 修改程序行为、修复回归，或者添加、移动、收集测试 | [`docs/guides/agent/testing.zh.md`](docs/guides/agent/testing.zh.md) |
| 接入或验证 pi 运行时，包括 SDK、RPC 和技术探针 | [`docs/guides/agent/pi-integration.zh.md`](docs/guides/agent/pi-integration.zh.md) |
| 编写或审阅 Agent 会读取的文档 | [writing-for-agents](.agents/skills/writing-for-agents/SKILL.md)；按需加载、唯一来源和可核对的完成条件 |
| 检查文档是否过期、修复文档结构，或者收尾当前 WI | [`docs/guides/documentation-health.zh.md`](docs/guides/documentation-health.zh.md) |
| 判断某项工作现在是否值得做、下一步做什么，或者是否继续 | [`docs/guides/agent/judgment.zh.md`](docs/guides/agent/judgment.zh.md) |
| 调整系统分层、模块职责、跨层接口、数据保存方式或其他重要架构边界 | [`docs/guides/architecture-governance.zh.md`](docs/guides/architecture-governance.zh.md)、[`docs/architecture/vscode-extension-architecture.zh.md`](docs/architecture/vscode-extension-architecture.zh.md) |
| 改变用户能够看到、操作或感知的产品行为 | [`docs/product-requirements.zh.md`](docs/product-requirements.zh.md)、[架构文档](docs/architecture/vscode-extension-architecture.zh.md) |
| 新增、调查或更新架构验证关卡（Gate） | [`docs/reference/architecture-gates.zh.md`](docs/reference/architecture-gates.zh.md) |
| 创建 Git commit 或编写 commit message | [`docs/git-commit-convention.zh.md`](docs/git-commit-convention.zh.md)（commit message 仅使用英文） |

示例：把 Webview 从内联 HTML／JavaScript 改造成独立构建的 TypeScript 前端，会同时涉及 TypeScript／构建配置、架构边界、测试及可能的 Gate 证据，因此所有匹配的路线都适用。

索引：[`docs/guides/agent/README.zh.md`](docs/guides/agent/README.zh.md)。

## 交付前检查

完成修改后，先遵守 `AGENTS.kernel.zh.md` 中“交付前检查”的通用要求，再根据本次修改执行相应检查，不能改完文件就直接宣称任务完成：

- **修改文档：** 运行 `npm run docs:verify`，检查文档结构、链接和中英文同步。涉及 WI 收尾或归档时，还须按协作指南运行 `npm run docs:health`。这些命令不能代替对文档内容和证据的核对。
- **修改扩展代码：** 运行 `npm run compile`（构建及 TypeScript 类型检查）、`npm run lint`（静态代码检查）及相关行为测试；本仓常规测试入口为 `npm test`。编译和 lint 通过不代表功能行为正确，具体测试要求见[测试指南](docs/guides/agent/testing.zh.md)。
- **涉及真实宿主或安装包行为：** 按任务验收范围进行必要的 F5／已安装 VSIX 验证。自动化测试不能代替真实环境中尚未验证的行为；开发态 F5 也不等于已安装 VSIX 验收。
- **报告结果：** 列出实际执行的检查、结果及未验证部分；无法运行的检查应说明原因，不得把历史结果写成本次通过。检查通过不自动关闭 WI 或 Gate，仍须遵循各自的验收与决策规则。

仅修改文档时，不必因此运行与本次改动无关的代码构建或行为测试。

## 涉及 pi 时的参考与规则

当任务涉及 pi 的 SDK、RPC、CLI、事件、工具或会话行为时，按以下来源查证：

- **查看上游源码和文档：** 本机相邻目录 `../pi` 是 pi 的源码仓库，仅用于阅读、技术调查和对照公开行为。除非维护者明确要求，否则不得修改该仓库。
- **遵循集成规则：** 开始修改 pi 集成代码或运行相关技术探针前，先阅读 [`docs/guides/agent/pi-integration.zh.md`](docs/guides/agent/pi-integration.zh.md)。遵守上文的产品安全规则；上游行为须从包文档和公开 API 查证，不得臆测会话文件布局或依赖未公开的内部模块。
- **确认当前依赖版本：** 当前使用的 pi npm 包及其精确版本以 [`package.json`](package.json) 为准。生产构建必须使用已声明的正式 npm 依赖，不得依赖本机的 `../pi` 路径。
- **升级 pi 版本：** 升级前后应根据受影响范围重新检查公开 API、CLI 参数、RPC 协议和生命周期行为，并记录新证据；旧版本的技术探针结果不能自动证明新版本行为相同。
- **了解已有架构决定：** 为什么选择子进程 RPC，以及 WI-001 当时验证了什么，见 [`docs/decisions/0001-build-baseline.zh.md`](docs/decisions/0001-build-baseline.zh.md)。对应的最小运行时宿主关卡是 [`gate-runtime-host`](docs/reference/architecture-gates.zh.md)，它已接受子进程启动、一次 RPC 往返和有界关闭这一基础结论，但不代表完整聊天生命周期已经验证。
