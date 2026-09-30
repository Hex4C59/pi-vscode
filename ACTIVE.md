# pi-vscode — 当前工作（跨会话入口）

本文件维护当前任务与交接。规则见 [AGENTS](AGENTS.zh.md)、[内核](AGENTS.kernel.zh.md)与[协作指南](docs/guides/agent-collaboration.zh.md)。

## Agent 会话契约（摘要）

| 步骤 | Agent |
|---|---|
| 开场 | 必要阅读、Git 基线、当前 WI／批准／Gate／PRD 与验收核对。 |
| 提案 | Prepare 记录范围与 PRD 判定；Build 须批准；WIP 最多 1。 |
| 建造 | 按批准实现并实际验证；模拟／runtime／F5／安装分别取证。 |
| 收尾 | 记录验收身份、检查结果与未决项；按规则归档并清理资源。 |

## 当前无活动 WI（WIP=0）

无正在实施的 WI。此前批准的工作已记录结案；本次核对发现下方实现与验收证据缺口。后续修补须按协作指南记录范围与批准，历史授权仅适用于原切片。

## 当前焦点与未决项

维护者要把「设置里的本机插件清单」拆成小切片后串行实现；另停放作曲区模型控件展示。两队均**尚未批准 Build**。插件下次从切片 1（仅文档 Prepare）晋升，编号从 WI-059 起。模型控件见[讨论](docs/discussions/2026-10-01-model-chip-label.zh.md)；插件队列见[讨论](docs/discussions/2026-10-01-local-plugin-inventory.zh.md)。下载／市场仍排除。

界面日常名称与编号截图见[界面名词说明](docs/reference/plugin-parts.zh.md)。

[PRD](docs/product-requirements.zh.md) 当前记录 macOS 自用安装版 Accepted（代理受托身份）；逐项核对发现“所有需求均已满足”仍有以下缺口，详见[核对记录](docs/discussions/2026-09-30-requirements-implementation-check.zh.md)：

- **REQ-001，已确认实现缺项：** 正式聊天界面在拒绝 pi 项目资源后不显示所需状态提示；执行前项目身份可见性还需针对性评估。
- **REQ-002，已确认显示缺项：** 活跃模型投影优先使用显示名，跨供应商同名时无法唯一标出当前模型／供应商；不是运行时选错模型的证据。
- **REQ-009，验收证据缺口：** 当前 macOS 五类代表性验证引用的完整组合跑次来自 Windows；后续 [macOS 记录](docs/archive/2026-09-30-macos-verification-acceptance.zh.md) 只补部分场景，未证明完整矩阵。
- **待复核／文档漂移：** REQ-008 具体缺失能力披露目前只有通用警告；中文 REQ-009 保留已被英文及限定验收替代的 Prepare／待验证旧句，不把旧句当新增实现任务。

## 停车场

本机插件清单实现队列（一次只晋升一项；记录≠Build）。卸载＝从清单移除，不删磁盘文件。完整边界见[讨论](docs/discussions/2026-10-01-local-plugin-inventory.zh.md)。

| 顺序 | 切片 | 范围内 | 依赖 |
|------:|------|--------|------|
| 1 | 产品边界（Prepare，仅文档） | 清单≠当场加载；存储位置；启用含义；与受控／受信关系；PRD 切片；ADR 类 | — |
| 2 | 宿主清单存储 | 本地路径＋ enabled；损坏／过大不改写；密钥不进 Webview | 1 |
| 3 | 设置「插件」：空列表＋从磁盘添加 | 原生选择器写入清单；空／重复／无效路径 | 2 |
| 4 | 从清单移除 | 删清单项；披露磁盘仍在 | 3 |
| 5 | 启用／关闭 | 持久化标志；活 runtime 须空闲重建后才变 | 3 |
| 6 | 已启用项接到 runtime | 空闲启动／切换经公开 API 加载；覆盖警告；失败恢复不变；不跳过审批 | 1 与 5 |
| 7 | 作曲区入口收拢 | 权限区只留状态／恢复；管理在设置 | 6 |

**不进本队列：** 下载、市场、远程目录、自动更新。

### 作曲区模型控件（独立于上表）

维护者示例 `hellocode / gpt-6-sol · low` → **`GPT-6-Sol · Low`**。收起芯片、打开选择器标题与列表都不显示供应商；`gpt`→`GPT`，`sol`→`Sol`；英文推理强度 `Low`。去掉 Model／Thinking level／Open provider settings。名称＋强度居中，点击打开模型列表；滑条只改推理。不改 WI-042 身份。见[讨论](docs/discussions/2026-10-01-model-chip-label.zh.md)。记录≠Build。

**互斥：** 模型选择器与执行配置一次只开一个；打开后一个时先关掉前一个。尚未单独成 WI。

### Runtime 目录整理（纯技术，低优先级）

- **状态与优先级：** 维护者要求记录任务，尚未批准 Build；WIP=0。优先级低于 Webview 前端目录整理，前端目标结构见 [Webview README](src/webview/README.zh.md)。不占用 WI 编号，不改变既有产品队列顺序。
- **目标：** 在 `src/adapter/runtime/` 内按职责归组 RPC 相关文件，使运行时编排、RPC 协议处理与进程策略更容易定位；保持现有行为与模块对外接口。
- **候选范围：** 新增内部 `rpc/` 分组，优先评估 `rpc-replies.ts`、`rpc-frames.ts`、`rpc-events.ts`、`rpc-occupancy.ts`、`rpc-dialogs.ts`；`jsonl.ts`、`command-classification.ts`、`interaction-writer.ts`、`extension-feedback.ts` 等辅助文件先核对引用与职责，再决定归属，不仅凭文件名前缀移动。
- **组织约束：** 保留 `runtime/index.ts` 与宿主使用的入口；`pi-rpc-runtime.ts` 的编排归属和现有 `process/` 分组保持清楚；`rpc/` 初期为内部文件分组，不自动增加新的公共接口。所有权／恢复策略、跨层契约和运行时生命周期语义保持现状。
- **实施前准备：** 晋升时建立纯技术 Prepare 提案，核对架构依赖方向、目标文件及对应测试归属；列出 import、构建入口、测试收集与文档路径的调整清单，确认范围后再实施。初步 Decision 为 `none`，不据此关闭任何 gate。
- **验收：** 相关文件与专属测试归属清楚、无旧路径残留；运行 `npm run compile`、`npm run lint`、`npm test`，确认既有 RPC、取消／Stop 与进程策略验证通过；同步架构目录说明并运行 `npm run docs:verify`。本次记录不代表这些实现检查已经执行。

下列仍为 standing non-goals，不自动开 WI：额外扩展生态（上表本机清单除外）、编辑区 Chat Participant、remote／multi-root、额外平台（含 Windows 实机 F5／安装版 VSIX 与 Cursor 验收）、无产品依据的 delta 优化、全局启动默认持久化、跳过审批、图片／PDF／表格／语法高亮、历史回滚、框架更换、公开发布。已停止的逐断言审查不自动重启。

## 最近交接

### 2026-10-01 — 本机插件清单与模型芯片文案停放

维护者确认执行配置不像设置，想要设置里装／卸／开关插件；代理判断那是插件管理器，已拆成停车场 7 项（先本机清单，下载／市场另议）。同日维护者要求消息编辑区模型控件：不显示供应商、专用缩写全大写、名词与英文推理强度 Title Case（例：`GPT-6-Sol · Low`）；打开面板去掉 Model／Thinking level／Open provider settings；名称＋强度居中，点击弹出模型列表（列表同样无供应商）；滑条只改推理。已停放为独立展示切片，不改选型身份。同日维护者要求模型选择器与执行配置一次只开一个。另按维护者要求新增带编号截图的[界面名词说明](docs/reference/plugin-parts.zh.md)（英文权威原文 [plugin-parts.md](docs/reference/plugin-parts.md)）。WIP=0。未改 PRD／ADR／gate，无界面实现，无 Git 提交。

本次另按维护者要求将 Runtime 目录整理写入停车场，详见上方任务条目；仅记录后续整理范围，未移动源码或批准 Build。新增的 [Webview 目录说明](src/webview/README.zh.md)记录前端目标结构。此次文档检查 `npm run docs:verify` 与 `git diff --check` 通过；未运行代码构建或行为测试，未提交。

### 2026-09-30 — 文档同步与入口清理

中英文 README 已同步自用 macOS Accepted 状态；本入口合并重复状态说明，移出 Git 快照、详细验收交接与重复 WI 表。历史补入既有[压缩归档](docs/archive/2026-09-30-active-completed-compaction.zh.md)。本次仅改文档，未重跑 compile／lint／test，未提交或推送。`npm run docs:verify`、`npm run docs:health` 与 `git diff --check` 均通过（0 错误／提示）。

本次需求核对补录：读取 REQ-001～009 核心生产路径及历史验收，确认两项显示缺项和 macOS 五类验收证据空档，已补[双语记录](docs/discussions/2026-09-30-requirements-implementation-check.zh.md)。未改应用代码，未运行行为测试或实机验证，未提交或推送；`docs:verify`、`docs:health` 与 `git diff --check` 均通过（0 错误／提示）。

## 已完成 WI 索引

编号、验收记录与历史限制见[已关闭 WI 索引](docs/archive/2026-09-29-closed-wi-index.zh.md)；现行架构 gate 状态见 [gate 表](docs/reference/architecture-gates.zh.md)。
