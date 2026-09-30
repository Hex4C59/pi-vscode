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

WI-059（清单产品边界，仅文档）已关闭。维护者 `/goal` 要求串行做完本入口全部任务，每完成一项再提交。下一项是清单切片 2（宿主存储），晋升为 WI-060 前须写入可审查提案。历史授权仅适用于原切片。

## 当前焦点与未决项

插件清单队列从切片 2 继续；模型芯片展示、选择器互斥、REQ-001／002 显示缺项、REQ-009 macOS 五类证据、Webview 目录整理与 Runtime rpc 分组仍在停车场。下载／市场仍排除。界面名词见[说明](docs/reference/plugin-parts.zh.md)。

[PRD](docs/product-requirements.zh.md) 自用 macOS Accepted 仍有：

- **REQ-001：** 拒绝项目资源后正式聊天界面无持续状态提示。
- **REQ-002：** 活跃模型投影跨供应商同名时无法唯一标出。
- **REQ-009：** 当前 macOS 五类代表性验证完整矩阵证据仍缺。
- **待复核／文档漂移：** REQ-008 具体缺失能力披露、中文 REQ-009 旧句；不当作新实现任务。

## 停车场

本机插件清单（一次只晋升一项）。卸载＝从清单移除。边界见 [REQ-010](docs/product-requirements.zh.md)／[Draft ADR 0010](docs/decisions/0010-local-plugin-inventory.zh.md)。

| 顺序 | 切片 | 范围内 | 依赖 |
|------:|------|--------|------|
| 2 | 宿主清单存储 | 本地路径＋ enabled；损坏／过大不改写；密钥不进 Webview | WI-059 |
| 3 | 设置「插件」：空列表＋从磁盘添加 | 原生选择器写入清单；空／重复／无效路径 | 2 |
| 4 | 从清单移除 | 删清单项；披露磁盘仍在 | 3 |
| 5 | 启用／关闭 | 持久化标志；活 runtime 须空闲重建后才变 | 3 |
| 6 | 已启用项接到 runtime | 空闲受信启动／切换经公开 API 加载；覆盖警告；失败恢复不变；不跳过审批 | 1 与 5 |
| 7 | 消息编辑区入口收拢 | 权限区只留状态／恢复；管理在设置 | 6 |

**不进本队列：** 下载、市场、远程目录、自动更新。

### 作曲区模型控件（独立）

`hellocode / gpt-6-sol · low` → **`GPT-6-Sol · Low`**。芯片、选择器标题与列表不显示供应商。见[讨论](docs/discussions/2026-10-01-model-chip-label.zh.md)。记录≠当前 Build。

**互斥：** 模型选择器与执行配置一次只开一个。尚未单独成 WI。

### Runtime 目录整理（纯技术，低于 Webview 目录整理）

见 [Webview README](src/webview/README.zh.md)。`src/adapter/runtime/` 内按职责归组 RPC 文件；不改对外接口。尚未批准 Build。

下列仍为 standing non-goals：额外扩展生态（上表本机清单除外）、编辑区 Chat Participant、remote／multi-root、额外平台、无产品依据的 delta 优化、全局启动默认持久化、跳过审批、图片／PDF／表格／语法高亮、历史回滚、框架更换、公开发布。

## 最近交接

### 2026-10-01 — WI-059 关闭（清单产品边界）

维护者 `/goal` 完成 ACTIVE 全部任务并逐项提交。WI-059 仅文档：清单≠当场加载；存储为本 VS Code 配置 `globalStorageUri`；启用＝下一次空闲受信资格；受控忽略清单；原生加载确认保留；只记路径。已写入 REQ-010 与 Draft ADR 0010。无代码。`docs:verify` 0 error／2 Draft-ADR warning；`docs:health` 0 error。未跑 compile。下一项切片 2。

### 2026-10-01 — 本机插件清单与模型芯片文案停放

维护者要把设置里的本机清单拆成串行切片；模型芯片不显示供应商、Title Case。另停放选择器互斥、Runtime 目录整理与 Webview 目标结构。未改 gate。界面名词说明见 [plugin-parts](docs/reference/plugin-parts.zh.md)。

## 已完成 WI 索引

编号、验收记录与历史限制见[已关闭 WI 索引](docs/archive/2026-09-29-closed-wi-index.zh.md)；现行架构 gate 状态见 [gate 表](docs/reference/architecture-gates.zh.md)。最近关闭：WI-059。
