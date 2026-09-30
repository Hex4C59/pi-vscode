# pi-vscode — 当前工作（跨会话入口）

本文件维护当前任务与交接。规则见 [AGENTS](AGENTS.zh.md)、[内核](AGENTS.kernel.zh.md)与[协作指南](docs/guides/agent-collaboration.zh.md)。

## Agent 会话契约（摘要）

| 步骤 | Agent |
|---|---|
| 开场 | 必要阅读、Git 基线、当前 WI／批准／Gate／PRD 与验收核对。 |
| 提案 | Prepare 记录范围与 PRD 判定；Build 须批准；WIP 最多 1。 |
| 建造 | 按批准实现并实际验证；模拟／runtime／F5／安装分别取证。 |
| 收尾 | 记录验收身份、检查结果与未决项；按规则归档并清理资源。 |

## 正在做（WIP=1）

从清单移除。维护者 `/goal` 完成 ACTIVE.md 全部任务并授权本 Build。

| 字段 | 内容 |
|---|---|
| **ID** | WI-062 |
| **阶段** | 建造 |
| **Gate ID** | none |
| **Decision** | Draft ADR 0010 |
| **PRD 判定** | 用户可见：REQ-010 切片 4，从清单移除 |

### 目标与范围

Settings **Plugins** 每项可移除。宿主从 `plugin-inventory-v1.json` 删掉该条目。可见披露磁盘文件仍在。不删除扩展文件、不卸载 pi 全局包、不改写活 runtime、不打开加载确认。

### 方案与架构核对

投影增加不透明 `id`（由绝对路径派生，不是路径本身）。`removePluginInventoryEntry` 携带 `{id}`。宿主映射后 `replacePluginInventory`。未知 id 报错且不改写。损坏／过大仍 `existing-unusable`。Webview 不接收路径。

### 验收

有一项时移除后列表空且文件少一条；磁盘文件仍在；未知 id 不改写；busy／existing-unusable 禁用移除。`compile`／`lint`／`npm test`。预览核对移除与磁盘仍在的披露。不要求原生 F5。

### 范围外与批准边界

启用开关、runtime `-e`、作曲区收拢、下载／市场、ADR 0010 Accepted。批准：维护者 `/goal` 完成 ACTIVE 全部任务。

## 当前焦点与未决项

正在做清单切片 4。模型芯片、选择器互斥、REQ-001／002、REQ-009 macOS 五类证据、Webview 与 Runtime 目录整理仍在停车场。下载／市场仍排除。界面名词见[说明](docs/reference/plugin-parts.zh.md)。

[PRD](docs/product-requirements.zh.md) 自用 macOS Accepted 仍有：REQ-001 拒绝资源后无持续提示；REQ-002 跨供应商同名标不清；REQ-009 macOS 五类完整矩阵证据仍缺。REQ-008／中文 REQ-009 文档漂移不当作新实现任务。

## 停车场

本机插件清单（一次只晋升一项）。边界见 [REQ-010](docs/product-requirements.zh.md)／[Draft ADR 0010](docs/decisions/0010-local-plugin-inventory.zh.md)。

| 顺序 | 切片 | 范围内 | 依赖 |
|------:|------|--------|------|
| 5 | 启用／关闭 | 持久化标志；活 runtime 须空闲重建后才变 | 3 |
| 6 | 已启用项接到 runtime | 空闲受信启动／切换经公开 API 加载；覆盖警告；失败恢复不变 | 1 与 5 |
| 7 | 消息编辑区入口收拢 | 权限区只留状态／恢复；管理在设置 | 6 |

**不进本队列：** 下载、市场、远程目录、自动更新。

### 作曲区模型控件（独立）

`hellocode / gpt-6-sol · low` → **`GPT-6-Sol · Low`**。见[讨论](docs/discussions/2026-10-01-model-chip-label.zh.md)。**互斥：** 模型选择器与执行配置一次只开一个。

### Runtime 目录整理（纯技术，低于 Webview 目录整理）

见 [Webview README](src/webview/README.zh.md)。尚未批准独立 Build。

下列仍为 standing non-goals：额外扩展生态（上表本机清单除外）、编辑区 Chat Participant、remote／multi-root、额外平台、跳过审批、公开发布。

## 最近交接

### 2026-10-01 — WI-062 晋升（从清单移除）

维护者 `/goal` 串行完成 ACTIVE 全部任务。WI-061 已关闭。本切片只做移除清单项并披露磁盘仍在。

### 2026-10-01 — WI-061 关闭（设置插件空列表＋添加）

Settings **Plugins** 空列表与从磁盘添加。投影仅 basename。添加不加载、不确认。ADR 0010 仍 Draft。见[验收](docs/archive/2026-10-01-wi-061-acceptance.zh.md)。

## 已完成 WI 索引

编号、验收记录与历史限制见[已关闭 WI 索引](docs/archive/2026-09-29-closed-wi-index.zh.md)；现行架构 gate 状态见 [gate 表](docs/reference/architecture-gates.zh.md)。最近关闭：WI-061。
