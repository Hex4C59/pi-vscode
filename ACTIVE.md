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

活跃模型身份用供应商／模型 id，不用显示名。维护者 `/goal` 完成 ACTIVE.md 全部任务并授权本 Build。

| 字段 | 内容 |
|---|---|
| **ID** | WI-069 |
| **阶段** | 建造 |
| **Gate ID** | none |
| **Decision** | none |
| **PRD 判定** | 用户可见：既有 REQ-002 在跨供应商同名时仍须标出唯一已应用模型 |

### 目标与范围

[`formatModelLabel`](src/adapter/runtime/pi-rpc-model-parse.ts) 把当前模型投影为 `provider / modelId`，不再优先 `name`。目录项 `label` 仍可用显示名。WI-066 芯片展示与 WI-042 radio 身份规则不变。不改宿主协议字段名，不把供应商画回芯片。

### 方案与架构核对

Adapter 在 start／get_state 投影时产出规范身份；Webview `appliedCatalogIdentity` 已按该字符串匹配。同名显示标签不再让当前模型无法唯一匹配。不改 pi 运行时选模。

### 验收

同名显示名的两个目录项下，投影为各自 `provider / modelId`；选择器只标一个 radio。compile／lint／`npm test`。不要求原生 F5。

### 范围外与批准边界

REQ-009、目录整理、docs 目录整理、芯片重新显示供应商。批准：维护者 `/goal` 完成 ACTIVE 全部任务。docs 目录整理仍停放、不自动启动。

## 当前焦点与未决项

正在做活跃模型规范身份。REQ-009 macOS 五类证据、Webview 与 Runtime 目录整理、docs 目录检索仍在停车场。下载／市场仍排除。界面名词见[说明](docs/reference/plugin-parts.zh.md)。

[PRD](docs/product-requirements.zh.md) 自用 macOS Accepted 仍有：REQ-009 macOS 五类完整矩阵证据仍缺。REQ-008／中文 REQ-009 文档漂移不当作新实现任务。

## 停车场

本机插件清单切片 1–7、模型芯片、弹出层互斥与拒绝资源提示已关闭；下载／市场仍排除。见 [REQ-010](docs/product-requirements.zh.md)／[Draft ADR 0010](docs/decisions/0010-local-plugin-inventory.zh.md)。

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

下列仍为 standing non-goals：额外扩展生态（本机清单除外）、编辑区 Chat Participant、remote／multi-root、额外平台、跳过审批、公开发布。

## 最近交接

### 2026-10-01 — WI-069 晋升（规范模型身份）

维护者 `/goal` 串行完成 ACTIVE 全部任务。WI-068 已关闭。本切片只改当前模型投影，不改芯片去供应商。

### 2026-10-01 — WI-068 关闭（拒绝资源提示）

拒绝后显示未加载项目本地 pi 资源。见[验收](docs/archive/2026-10-01-wi-068-acceptance.zh.md)。

## 已完成 WI 索引

编号、验收记录与历史限制见[已关闭 WI 索引](docs/archive/2026-09-29-closed-wi-index.zh.md)；现行架构 gate 状态见 [gate 表](docs/reference/architecture-gates.zh.md)。最近关闭：WI-068。
