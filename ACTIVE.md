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

核对并补齐 REQ-009 当前 macOS 五类证据。维护者 `/goal` 完成 ACTIVE.md 全部任务并授权本 Build。

| 字段 | 内容 |
|---|---|
| **ID** | WI-070 |
| **阶段** | 建造 |
| **Gate ID** | none |
| **Decision** | none |
| **PRD 判定** | 用户可见验收证据：既有 REQ-009 要求 macOS 本机 VS Code 五类成功／失败、编程闭环与恢复，含一个真实扩展 |

### 目标与范围

对照 PRD 五类（供应商／模型、资源、扩展命令／工具／钩子、标准扩展 UI、已保存会话）加上编程闭环与重启／恢复，列出**当前** macOS 本机／安装包记录单元格。历史 Windows 通过不得改写成 macOS 通过。若某格仍缺当前 macOS 证据，本切片须补跑或明确该格仍缺且 WI 不得关闭。不改产品行为，不把 Draft ADR 0010 改成 Accepted。

### 方案与架构核对

只读现有归档与可重复的本机 runner。不发明未跑过的原生通过。不把 jsdom／Vite 当作 REQ-009 平台证据。

### 验收

一份按五类列出的当前证据表：每格是现有记录路径＋主机，或标明缺失。compile／lint／`npm test` 仅在补代码时需要。docs:verify。原生 F5／安装包仅在缺格需要时跑。

### 范围外与批准边界

目录整理、docs 目录整理、下载／市场、Windows。批准：维护者 `/goal` 完成 ACTIVE 全部任务。docs 目录整理仍停放、不自动启动。

## 当前焦点与未决项

正在核 REQ-009 macOS 五类证据。Webview 与 Runtime 目录整理、docs 目录检索仍在停车场。下载／市场仍排除。界面名词见[说明](docs/reference/plugin-parts.zh.md)。

[PRD](docs/product-requirements.zh.md) 自用 macOS Accepted 仍可能缺 REQ-009 五类完整矩阵。REQ-008／中文 REQ-009 文档漂移不当作新实现任务。

## 停车场

本机插件清单切片 1–7、模型芯片、弹出层互斥、拒绝资源提示与规范模型身份已关闭；下载／市场仍排除。见 [REQ-010](docs/product-requirements.zh.md)／[Draft ADR 0010](docs/decisions/0010-local-plugin-inventory.zh.md)。

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

### 2026-10-01 — WI-070 晋升（REQ-009 macOS 五类证据）

维护者 `/goal` 串行完成 ACTIVE 全部任务。WI-069 已关闭。本切片只核并补当前 macOS 证据，不改写历史 Windows 通过。

### 2026-10-01 — WI-069 关闭（规范模型身份）

活跃模型投影为 `provider / modelId`。见[验收](docs/archive/2026-10-01-wi-069-acceptance.zh.md)。

## 已完成 WI 索引

编号、验收记录与历史限制见[已关闭 WI 索引](docs/archive/2026-09-29-closed-wi-index.zh.md)；现行架构 gate 状态见 [gate 表](docs/reference/architecture-gates.zh.md)。最近关闭：WI-069。
