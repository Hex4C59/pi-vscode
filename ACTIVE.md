# pi-vscode — 当前工作（跨会话入口）

本文件是唯一当前工作入口，不是需求／架构权威或追加日志。规则见 [AGENTS](AGENTS.zh.md)、[内核](AGENTS.kernel.zh.md)与[协作指南](docs/guides/agent-collaboration.zh.md)。更早检查点见 [9月27日](docs/archive/2026-09-27-active-checkpoint-history.zh.md)；WI-010 收尾见 [归档](docs/archive/2026-09-28-wi-010-goal-closure.zh.md)。WI-025 第二～五轮完整记录与已替代交接见 [2026-09-29 WI-025 归档](docs/archive/2026-09-29-wi-025-active-superseded.zh.md)。

## Agent 会话契约（摘要）

| 步骤 | Agent |
|---|---|
| 开场 | 必要阅读、Git基线、当前WI／批准／Gate／PRD与验收核对；不把历史提案当当前授权。 |
| 提案 | Prepare保留范围与PRD判定；新增Build范围须批准；WIP最多1。 |
| 建造 | 按批准实现并实际验证；模拟／runtime／F5／安装分别取证，不虚报接受。 |
| 收尾 | 对照批准、记录代理或维护者的实际验收身份；正常ADR／gate、双语归档、检查与资源清理。 |

## 正在做（WIP=1）

| 字段 | 内容 |
|---|---|
| **ID** | WI-025 |
| **标题** | 侧栏视觉工艺：空白会话与封闭 token 阶梯 |
| **阶段** | Build；维护者 2026-09-28 在任务消息中授权本次 Build（「本消息即维护者对本次 Build 的授权」） |
| **PRD 判定** | 用户可见：新增 PRD「侧栏视觉工艺切片（WI-025）」双语段落与追溯行；视觉主切片及本次明确授权的准备阶段交互修正；沿用 REQ-001／002／003 的宿主准入、既有消息与审批语义 |
| **Gate ID** | 无；不触及 runtime／信任／生命周期 gate，ADR0003 React 前端方向不变 |
| **Decision** | none |
| **批准范围** | `theme.css` 增 `--ui-brand` 与间距／字号／圆角／阴影 token；候选空白会话、会话栏、作曲区重排；候选已有表面（会话历史、消息、activity、审批、change review、附件芯片、设置／交接对话框、无文件夹／无模型／runtime 错误、权限入口）收进封闭阶梯；中英 UI 字符串同步；更新测试与预览检查。2026-09-28 维护者追加：整个 UI 改灰白单色、重做设置对话框版式、修复作曲区「+」与模型选择器不可点（WI-024 未提交宿主改动的调度回归，只改执行顺序，不改消息契约）。本次反馈「未打开文件夹时…帮我解决」追加授权：无文件夹的 + 可展开并引导打开文件夹；模型入口使用已有全局配置选择默认模型，不启动 runtime、不改信任／附件准入。本次维护者另授权缩小编辑器标题栏打开 Pi 的入口图标：深／浅色 SVG 各增加对称留白，图案缩至原来的 80%，点击区域保持宿主尺寸。2026-09-29 维护者授权修复打开文件夹后的大段资源说明与作曲区禁用：初次资源选择移至首次发送／添加附件的简短对话框，完整说明折叠；准备阶段可编辑草稿、打开附件菜单和选择全局默认模型。保留显式 allow／decline、宿主准入和再次发送／添加动作，不自动加载资源或重放任务。**不**授权新功能、宿主消息、密钥、审批语义、pi runtime、布局容器、OAuth、Plan 模式、全窗聊天、自定义皮肤、插画、提交／推送 |

**Build 切片（摘要）：** 第二～五轮（导航／历史、会话内容、任务状态与操作区、设置与确认对话框）与第六轮附件一致性修复已交付；逐轮方案、结果、验证与更早交接见 [WI-025 归档](docs/archive/2026-09-29-wi-025-active-superseded.zh.md)。合成预览：`/navigation-review.html`、`/settings-review.html`、`/consistency-review.html`。

### 启动前推理强度（2026-09-29，已授权 Build）

维护者明确要求“会话启动前也能选择并保留强度”。仍属 WI-025／WIP=1；本切片取代第六轮对必要默认设置宿主改动的限制，仅授权默认模型／强度投影、校验、持久化及共用选择器，不改变认证、资源同意、权限或执行生命周期。PRD 判定：用户可见，REQ-002／REQ-003；双语要求同步。

方案：ProviderConfig 通过 pi 0.86.1 公开 SettingsManager 的逐模型 thinking 设置保存用户选择；公开 pi-ai 能力／归一化函数提供真实支持档位，作为同版本显式依赖，不复制供应商判断。未选模型／能力缺失禁用强度，保存失败保持旧投影并显示有限错误。模型切换读各自保存值，新会话沿用上游默认加载，恢复历史仍保留历史会话值。准备阶段与就绪阶段共享 ModelPicker 展示，UI 不伪造 workspace/runtime ready。新增精确白名单意图绑定 provider/model，拒绝过期模型或不支持档位；设置写入期间拒绝重入。无会话启动、模型调用或项目资源读取。

架构核对：模块／接口／依赖／所有权 pass（ProviderConfig 管全局默认，ModelSettings 管活跃会话；共享 DTO 仅类型）；契约／并发／错误／数据 pass；安全无密钥投影；decision none。验收：红→绿行为测试、compile／lint／npm test／verify:webview／docs:verify；预览与宿主证据单列。

### 第六轮：整体一致性与真实宿主核查（2026-09-29）

维护者授权整体检查、必要展示层修复、相关测试及文档，仍属 WI-025。范围：前五轮盘点；附件列表／预览／历史、跨区域布局、嵌套 Escape 与焦点、主题／窄宽／短视口／动效；小范围展示问题直接修复。不改宿主协议、认证、权限、runtime、存储、执行生命周期。

方案：附件内部呈现由 CandidateContext 负责，跨区域预算仍由 Candidate 负责。验收：compile、lint、npm test、verify:webview、docs:verify；合成宿主 280／320／400px、三主题；F5 与安装包分列。**第六轮交付证据表、F5 流程与未验清单**见 [归档](docs/archive/2026-09-29-wi-025-active-superseded.zh.md)。

### 目标与范围

空闲空白会话看起来像随时能开工的编程工具：元素很少、位置准、间距只来自 token，有 π 的辨识度但不打扰读代码。依据 skill [pi-sidebar-ui](.agents/skills/pi-sidebar-ui/SKILL.md) 与 [tokens](.agents/skills/pi-sidebar-ui/tokens.md)；讨论见 [UI 规则](docs/discussions/2026-09-28-agent-ui-rules.zh.md)。

1. **Token 先行**：`--ui-brand` = 宿主前景色（灰白单色，维护者 2026-09-28 否决珊瑚橘；高对比下作曲区焦点退回 `--ui-focus`），按钮 `--ui-accent*` 用宿主次级按钮色、`--ui-space-1..5`（4／8／12／16／24）、`--ui-font-chrome／body／empty`（12／13／17）、`--ui-radius`（6）与 `--ui-radius-lg`（8）、`--ui-shadow`（`--vscode-widget-shadow`）。移除 `--ui-gap: 10px`。
2. **空白会话**：顶栏左标题、右细线历史／新建／设置；画布中心略偏下 36px 单色 π（`assets/pi.svg` 蒙版）+ 一句问候；删除副标题 “Ask a question or describe a change.” 及中文。
3. **作曲区**：底部 8px inset，比页面略深（`--ui-bg` 混黑一步，高对比用 `--ui-input`），1px 边框，8px 圆角；上输入、下工具栏（附件＋｜模型｜权限｜发送），权限入口改入工具栏流式布局。发送 `--ui-brand` 实心；禁用时退为中性；Stop 同位实心方块图标。
4. **其余表面**：只替换间距／字号／圆角／阴影数值为 token，不改 DOM 语义与行为；审批（警告边）、错误（危险底＋左边线）、Stop 保持比空闲铬件醒目。

### 方案与架构核对

- 只动 `src/webview/**` CSS／TSX 与 UI 字符串；宿主、契约、runtime 不变。
- 解释口径：4px 仅用于芯片、图标及紧凑控件内边距；布局间距用 8／12／16／24。
- 保留例外：PRD 已确认的 thinking 滑条不改；仅 baseline 测试夹具旧样式不在候选表面。
- 风险：字号 10–11→12 增高审批／短视口预算；需在 280px 与短视口目视确认 Stop／审批仍可达。

### 验收

| 项 | 可观察标准 |
|---|---|
| 空白会话 | 只一句问候（无副标题）；π 用 `--ui-brand`；无推荐问题／功能介绍／发光 |
| 作曲区 | 底部钉住；280／320／400px 工具栏不重叠、无整页横滚；发送为 brand 实心，Stop 醒目 |
| Token | 改动的候选 CSS 不含 3／5／6／7／10／11px 间距或字号；圆角只 6／8；发布样式无色相（警告／错误除外） |
| 设置对话框 | 标题栏＋细线分区；刷新为标题行图标；供应商状态无嵌套框；按钮中性 |
| 作曲区可用 | 供应商刷新挂住时 runtime 仍发布就绪；无文件夹时 + 展开并提供文件夹恢复、默认模型可选 |
| 主题 | light／dark／high-contrast 同一布局；焦点可见；`prefers-reduced-motion` 生效 |
| 回归 | `compile`／`lint`／相关 `npm test`／`verify:webview`；`preview:webview` 截图核对 |
| 待维护者 | F5 实机目视（未验收，不写成已接受） |

### 范围外与批准边界

除上文已授权的启动前强度切片外，不做新功能、不改宿主消息／密钥／审批语义／pi runtime／辅助侧栏容器；不做 OAuth、Plan 模式、全窗聊天、自定义暗色皮肤、插画；不提交、不推送。不把 WI-023／WI-024 的 F5 写成已验收。

## 当前焦点与未决项

- [x] WI-025 Prepare 写入 ACTIVE；维护者任务消息授权 Build。
- [x] PRD 双语切片段落与追溯行。
- [x] Token → 空白会话／作曲区 → 其余表面实现。
- [x] Critique 清单逐项核对；首稿后摘掉一件装饰（π 旁光标）。
- [x] 测试与检查：`compile`／`lint`／`npm test`／`verify:webview`／`docs:verify`（730/730 为启动前强度切片后全量基线，见交接）。
- [x] `preview:webview` 280／320／400 × 三主题目视（合成宿主，非 F5）。
- [x] 启动前默认模型强度：维护者实测确认（见最近交接；不替代 F5／VSIX 证据）。
- [ ] 维护者 F5 视觉验收（待确认；未关闭 WI-025）。

### 全量测试修复（2026-09-29 追加授权）

维护者授权修复 21 项失败：跨平台夹具、脚本入口与 socket 路径长度兼容；不降低断言、不改 UI 语义。验收为全量 `npm test` 零失败及 compile、lint、verify:webview、docs:verify。交付记录见 [归档](docs/archive/2026-09-29-wi-025-active-superseded.zh.md)。

## 最近交接

2026-09-29 — 启动前强度补齐与维护者确认：

维护者反馈“我测试了，可以的”，启动前选择并保留强度切片已获实测确认。未提供 F5／VSIX 方式，因此仅记录功能确认，不关闭 WI-025。实现：准备与运行阶段共用 ModelPickerView／三色滑条；`setDefaultThinkingLevel` 绑定默认模型身份；ProviderConfig 使用 SettingsManager 逐模型存储与 pi-ai 0.86.1 能力 API。证据：`npm test` 730/730；隔离 RPC 确认 thinkingLevel=high；Chrome 合成宿主 `settings-review.html?state=pre-session`。详见 [归档](docs/archive/2026-09-29-wi-025-active-superseded.zh.md) 若需完整验证段落。

2026-09-29 — 剩余提交与当前 Git 状态：

维护者授权提交剩余改动：兼容性修复及双语架构说明为 `03e1271`；侧栏 UI 与测试为 `ca5b001` 等分组提交；全量测试修复另计。未推送。WI-025 仍为 Build；F5／安装包及维护者视觉验收限制不变。更早提交授权、第六轮证据表与 skill 过程交接见 [归档](docs/archive/2026-09-29-wi-025-active-superseded.zh.md)。

## 停车场

额外扩展生态、编辑区panel／Chat Participant、remote／multi-root支持、额外平台、无产品依据的delta优化、全局启动默认持久化、跳过审批、图片／PDF／表格／语法高亮、历史回滚、框架更换及发布不属于本次批准队列；不得据此自动新建或实施WI。OAuth 订阅登录与自定义 OpenAI-compatible 端点属 WI-024 后续候选，不自动开工。对照 Claude Code 的侧栏质感见[讨论](docs/discussions/2026-09-28-claude-code-ui-comparison.zh.md)。侧栏视觉规则已收入 skill [pi-sidebar-ui](.agents/skills/pi-sidebar-ui/SKILL.md)，现由 WI-025 实施；依据见[讨论](docs/discussions/2026-09-28-agent-ui-rules.zh.md)。

**WI-024（暂停，未关闭）**：扩展内 API Key＋默认模型已实现并提交，混合布局／模型同步修复已于 2026-09-29 分组提交（`bed0e8d`／`2149560`）；批准边界与交付见[暂停提案](docs/archive/2026-09-28-wi-024-paused-proposal.zh.md)。待办：维护者 F5 确认设置分区（渐进展开）、Add key、模型选择器恢复；WI-023 F5（设置布局／模型选择器可见）另行待办。恢复前不得并入 WI-025 验收。

## 已完成 WI 索引

为兼容当前 Cursor 预览，链接直接打开归档文件。表中早期 gate Open／待决描述是相应验收日期的历史，不是当前状态；当前全部六项 gate Accepted，见 ADR0001／0004。

| WI | 结果 | 完成／验收 | 历史 |
|----|------|------------|------|
| WI-001 | 扩展壳、辅助侧栏与 RPC 探针；ADR 0001 | 2026-09-19 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-002 | 版本化 ping/pong Webview 桥 | 2026-09-19 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-003 | Project trust 技术 spike；gate 仍 Open | 2026-09-19 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-004 | REQ-004 最小流式聊天；gate 仍 Open | 2026-09-21 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-005 | 文档健康第一阶段 | 2026-09-19 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-006 | 工作区与项目资源选择 UI | 2026-09-21 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-007 | 根据资源选择启动 pi RPC | 2026-09-21 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-010 | thinking／受控工具／Stop 四项 F5 已确认；限定切片关闭，ADR pending／gate Open | 2026-09-21 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-011 | 模块内测试迁移、递归 runner 与 scripts 分组；限定技术切片收尾 | 2026-09-22 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-012 | 最小 P1–P3 探针切片关闭；P3／完整兼容缺口保留，不是产品验收 | 2026-09-22 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-020 | 跨模块公共入口与模块类型契约；唯一 P2 已修复，双轴零发现 | 2026-09-26 维护者技术验收；ADR／gate 不变 | [记录](docs/archive/2026-09-26-wi-020-public-entries.zh.md) |
| WI-021 | REQ-004 retry／compaction／可靠终态与必要 focus 回退修复；原生 F5／安装分别验证 | 2026-09-27 UTC 代理按本次委托完成评估；gates 不变 | [记录](docs/archive/2026-09-27-wi-021-execution-closure.zh.md) |
| WI-019 | Q16 委托评估、共享正式 chat、实机浮层／资源修复与独立 F5／安装验收 | 2026-09-27 UTC 代理按本次委托完成评估；ADR／gates 不自动关闭 | [记录](docs/archive/2026-09-27-wi-019-formal-chat.zh.md) |
| WI-015 | React／TypeScript／Vite 迁移验收；ADR 0003 Accepted | 2026-09-27 UTC 代理按本次委托完成评估；广泛 gates 保持 Open | [记录](docs/archive/2026-09-27-wi-015-react-acceptance.zh.md) |
| WI-013 | 受信扩展加载、标准交互、工具审批与自有runtime恢复；ADR0002 Accepted | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；广泛gates保持Open | [记录](docs/archive/2026-09-28-wi-013-acceptance.zh.md) |
| WI-008 | 模型选择／就绪、故障／审批／Stop、认证错误安全与必要实机修复 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；WI-009及广泛gates不自动关闭 | [记录](docs/archive/2026-09-28-wi-008-model-acceptance.zh.md) |
| WI-009 | thinking能力／下一轮意图、审批／Stop／退出恢复、键盘焦点与短窗错误修复 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；完整REQ／广泛gates不自动关闭 | [记录](docs/archive/2026-09-28-wi-009-thinking-acceptance.zh.md) |
| WI-014 | 显式文件／选区混合附件、逐项确认、完整预览／历史／容量恢复与丢失提示 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；审阅／会话及广泛gates不自动关闭 | [记录](docs/archive/2026-09-28-wi-014-attachment-acceptance.zh.md) |
| WI-016 | 受控dirty保护／准确readonly历史diff、分页及丢失恢复；短窗裁切红→绿 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；WI-017与广泛gates仍独立 | [记录](docs/archive/2026-09-28-wi-016-review-acceptance.zh.md) |
| WI-017 | 当前项目／CLI-origin会话、顺序交接、原文历史与异常恢复；trusted默认重置红→绿 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；广泛gates独立 | [记录](docs/archive/2026-09-28-wi-017-session-acceptance.zh.md) |
| WI-010 剩余边界／原Goal | 三项剩余gate、ADR0004、Living契约、实际分层验证与全局收尾 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估 | [记录](docs/archive/2026-09-28-wi-010-goal-closure.zh.md) |
| WI-022 | Windows后台终端闪现；默认CLI `--no-daemon` 规避，维护者确认关闭 | 2026-09-28 维护者确认已解决 | [记录](docs/archive/2026-09-28-wi-022-closure.zh.md) |
