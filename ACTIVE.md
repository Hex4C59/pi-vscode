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

已启用清单接到 runtime。维护者 `/goal` 完成 ACTIVE.md 全部任务并授权本 Build。

| 字段 | 内容 |
|---|---|
| **ID** | WI-064 |
| **阶段** | 建造 |
| **Gate ID** | none |
| **Decision** | Draft ADR 0010 |
| **PRD 判定** | 用户可见：REQ-010 切片 6，空闲受信应用已启用项 |

### 目标与范围

空闲受信启动或切换执行配置时，经公开 pi API 加载当时已启用的清单路径。沿用覆盖警告与原生加载确认。受控从不加载清单。多于 pinned 发行版允许的 `-e` 条数须可见失败。失败恢复规则不变。不跳过审批、不自动发现未列入路径。

### 方案与架构核对

宿主在空闲 Trusted apply 时读取清单 enabled 项。0 项时保留现有作曲区选择器通道。1 项时对该路径做现有确认后 `-e`。多于 1 且发行版只接受一个 `-e` 则可见失败，不静默丢掉。添加／开关本身仍不改写活 runtime。

### 验收

受控启动不带清单 `-e`。空闲切到 Trusted 且仅一项已启用时确认后加载该路径。多项已启用可见失败且不启动该 Trusted。compile／lint／`npm test`。不要求原生 F5。

### 范围外与批准边界

作曲区收拢、下载／市场、ADR 0010 Accepted。批准：维护者 `/goal` 完成 ACTIVE 全部任务。docs 目录整理仍停放、不自动启动。

## 当前焦点与未决项

正在做清单切片 6。模型芯片、选择器互斥、REQ-001／002、REQ-009 macOS 五类证据、Webview 与 Runtime 目录整理、docs 目录检索仍在停车场。下载／市场仍排除。界面名词见[说明](docs/reference/plugin-parts.zh.md)。

[PRD](docs/product-requirements.zh.md) 自用 macOS Accepted 仍有：REQ-001 拒绝资源后无持续提示；REQ-002 跨供应商同名标不清；REQ-009 macOS 五类完整矩阵证据仍缺。REQ-008／中文 REQ-009 文档漂移不当作新实现任务。

## 停车场

本机插件清单（一次只晋升一项）。边界见 [REQ-010](docs/product-requirements.zh.md)／[Draft ADR 0010](docs/decisions/0010-local-plugin-inventory.zh.md)。

| 顺序 | 切片 | 范围内 | 依赖 |
|------:|------|--------|------|
| 7 | 消息编辑区入口收拢 | 权限区只留状态／恢复；管理在设置 | 6 |

**不进本队列：** 下载、市场、远程目录、自动更新。

### 作曲区模型控件（独立）

`hellocode / gpt-6-sol · low` → **`GPT-6-Sol · Low`**。见[讨论](docs/discussions/2026-10-01-model-chip-label.zh.md)。**互斥：** 模型选择器与执行配置一次只开一个。

### Runtime 目录整理（纯技术，低于 Webview 目录整理）

见 [Webview README](src/webview/README.zh.md)。尚未批准独立 Build。

### docs 目录检索与归属整理（文档维护，待晋升）

2026-10-01 维护者要求把目录评估中的问题记录为后续任务。**仅授权记录；不改变当前 WI、既有队列顺序或 WIP=1，不沿用已有 `/goal` 批准自动启动本组 Build。** 晋升时按 Prepare→Build 确认具体范围。保留 architecture／decisions／guides／reference／discussions／archive 大分类。

| ID／优先级 | 问题与范围 | 完成标准 |
|---|---|---|
| DOC-NAV-01／优先 | archive 平铺记录多，方案、验收与旧交接混在一起，按 WI 检索成本高。优先整理 [归档索引](docs/archive/README.md)与[关闭 WI 索引](docs/archive/2026-09-29-closed-wi-index.md)的导航；不先批量移动文件。 | 可按 WI 找到已有方案、验收及相关历史记录；按记录类别找到非 WI 历史；缺失材料明确标注，不补造证据。保留历史状态、替代关系及当前权威文档入口，两个索引分工明确、不复制完整记录。 |
| DOC-NAV-02／其次 | discussions 同时容纳产品讨论、架构评估、技术调研与代码审计，索引区分不足。整理 [讨论索引](docs/discussions/README.md)，按主题／用途分组，允许交叉链接，不新增目录作为默认方案。 | 现有讨论均可从索引定位；分组可区分产品／UI、架构、调研及审计证据；保留“背景而非实现授权”的边界，不因记录已过期或篇幅长就归档，不隐藏未决问题。 |
| DOC-ORG-03／低，可不迁移 | docs 根目录的 [Git 提交约定](docs/git-commit-convention.md)与[双语文档指南](docs/bilingual-documentation.md)属于指南，与 guides 的归属略不一致。先评估移动收益及全部引用／校验配置影响，再提出保留或迁移方案。 | 记录保留或迁移的理由。若确认迁移，中英文成对移动，修复入站／相对链接、导航与必要校验配置，规则内容与权威性不变；若收益不足，明确保留并结束评估，不为一致性强制改路径。 |

**共同验收与边界：** 仅文档组织／检索，不改产品行为、批准状态、ADR 状态或历史事实，不删除历史，不为单份架构文档增设无必要层级。涉及双语索引或迁移时同步对应语言；完成后运行 `npm run docs:verify` 与 `npm run docs:health`，报告错误、警告与未验证项。Draft ADR 0010 的状态／索引警告不是本组目录缺陷，不以改成 Accepted 来消除。本次记录未执行上述整理。

下列仍为 standing non-goals：额外扩展生态（上表本机清单除外）、编辑区 Chat Participant、remote／multi-root、额外平台、跳过审批、公开发布。

## 最近交接

### 2026-10-01 — WI-064 晋升（已启用项接到 runtime）

维护者 `/goal` 串行完成 ACTIVE 全部任务。WI-063 已关闭。本切片只在空闲受信 apply 时经公开 API 加载已启用路径。

### 2026-10-01 — WI-063 关闭（启用／关闭）

Settings 可持久化 `enabled`。活 runtime 不变。ADR 0010 仍 Draft。见[验收](docs/archive/2026-10-01-wi-063-acceptance.zh.md)。

## 已完成 WI 索引

编号、验收记录与历史限制见[已关闭 WI 索引](docs/archive/2026-09-29-closed-wi-index.zh.md)；现行架构 gate 状态见 [gate 表](docs/reference/architecture-gates.zh.md)。最近关闭：WI-063。
