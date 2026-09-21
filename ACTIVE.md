# pi-vscode — 当前工作（跨会话入口）

本文件是当前工作入口，不是需求／架构权威，也不是历史日志。维护者新会话只需 **@ 本文件**；Agent 完整读取当前 WI，再按 [`AGENTS.zh.md`](AGENTS.zh.md) 渐进加载。完整流程见[协作指南](docs/guides/agent-collaboration.zh.md)；已关闭历史见[归档索引](docs/archive/README.zh.md)。

## Agent 会话契约（摘要）

| 步骤 | Agent |
|------|-------|
| **开场** | 读取本文件当前 WI 与最近交接；复述阶段、Gate、PRD 判定、焦点与验收。 |
| **渐进加载** | 按任务路由展开；归档仅在需要既往证据时读取。 |
| **提案** | Prepare 在本文件保留完整可审阅提案；维护者确认后才 Build。 |
| **建造** | 按已批准范围实现并运行检查。 |
| **收尾** | 核对验收；关闭 WI 时长文归档；`docs:verify` 与适用的 `docs:health`。 |

- **WIP=1：** 同时只有一个「正在做」。
- **Gate：** 未经 Accepted ADR 关闭的 gate 不得当作已交付能力。
- **提交：** 未经维护者明确请求不得创建或修改 Git commit。

## 正在做（WIP=1）

| 字段 | 内容 |
|------|------|
| **ID** | 未指定（WI-010 已关闭；下一实施 WI 未开启） |
| **阶段** | Prepare／等待维护者确定后续焦点；无进行中的 Build |
| **Gate ID** | `gate-project-trust`、`gate-webview-trust`、`gate-session-streaming`（均 Open） |
| **Decision** | 下一 WI 未定；WI-010 遗留 `pending-adr` 不关闭 |
| **PRD 判定** | 待定（下一 WI 未定）；不新增需求或实施授权 |

### 目标与范围

本次仅关闭 WI-010；WI-008／WI-009 保留待验收状态，不因收尾而关闭或推断追加批准。下一步建议先完成下方既有延期 F5，再由维护者确认其关闭；不是自动开启新工作。

### 方案与架构核对

WI-010 于 2026-09-21 获四项 F5 确认后，维护者要求“进入收尾吧”；范围、批准、实现与分层证据已移入[既有历史](docs/archive/2026-09-21-closed-wi-history.zh.md#wi-010)。其决策类 `adr-after-approval`、Decision `pending-adr` 与三个 Open gate 保留，不宣布完整边界通过。

### 验收

当前仅文档收尾检查；后续已有待验收项见下方 WI-008／WI-009 与未决清单。新 WI 的目标与验收须先提案、再获批准。

### 范围外与批准边界

不启动新 Build，不把待确认 WI 标为已验收，不改源码、package、已批准计划或 Git commit。

## WI-008／WI-009 状态（延后选择主路径 F5 已确认；待收尾、非并行 Build）

- **批准：** 两者 Build 均于 2026-09-21 批准。WI-008 为 REQ-002 模型／thinking Popover 的 RPC／host／协议；WI-009 为 REQ-002／REQ-004 聊天优先重设计，并追加批准流式期间选择仅下一轮生效。Decision `none`；`gate-webview-trust`／`gate-session-streaming` Open。初版样式被重设计覆盖不是关闭依据。
- **已实现范围：** 紧凑状态头、设置空态卡、右侧用户 pill、助手消息、sticky composer、合并 model · thinking chip、锚定 Popover、可折叠模型列表与离散滑块。固定 `#168BFF` 粗滑块填充／头、无黄色轮廓，保留蓝色键盘焦点；其余主题 token，nonce CSP、`textContent`、无框架外链。不是原生 Quick Pick。
- **模型契约：** ready、generation 匹配、非 workspace busy／modelBusy 才可选；空闲立即应用，chatBusy 时分别保留最新 pendingModel／pendingThinkingLevel，applied chip 不变。当前 session `agent_settled` 后模型→刷新能力→重新校验 thinking，应用期间禁发／禁选。不支持／失败显示有界错误并回读，不重试修改或虚报成功；回读失败清空未知 applied。无模型可用有界提示，不泄露凭证。
- **生命周期：** generation／runtime session／catalog token 防迟到；视图重建保留宿主 pending，工作区／资格变化、运行时替换／重启与 dispose 清除。公开 RPC 为 `get_available_models`、`get_available_thinking_levels`、`set_model`、`set_thinking_level`；不重写循环或让 Webview 直连 pi。详见 [PRD](docs/product-requirements.zh.md) 与 [消息契约](docs/reference/webview-messages.zh.md)。
- **已获维护者 F5 验收：** 空闲模型／thinking 切换后成功流式回复、模型折叠、Esc／键盘、浅色主题、无目录／未信任／资源设置；粗蓝色滑块样式获批准。
- **追加 F5 确认（2026-09-21 19:44）：** 维护者确认回复过程中更换模型／thinking 不影响当前回复，结束后新配置生效，下一条消息正常使用新配置。此主路径不再待确认，无须重复验收。
- **证据边界：** 本次确认不扩大为故障注入、RPC 失败回读、重启清理或审批／Stop 交错的完整手动矩阵；这些边界保留已有自动化证据及未独立手测说明，收尾时分别记录。
- **原范围外保留：** 全局启动默认持久化（仍仅读取既有 defaultProvider/defaultModel）、登录／配置 UI、在线刷新模型、循环按钮替代列表／滑块、编辑区 Panel／Chat Participant、附件／历史／Markdown。Thinking 正文、工具审批与 Stop 由 WI-010 承接，不倒算为旧 WI 交付。
- **关闭条件：** 两者剩余 F5 与全量检查汇总后，由维护者明确确认一起关闭，再归档；本次未归档或标为已关闭。pi 当前 `0.86.1`；[WI-004 RPC 证据（0.85.1）](docs/discussions/2026-09-21-wi-004-rpc-evidence-0.85.1.zh.md) 保持历史。

## 当前焦点与未决项

- [x] WI-010：维护者确认 thinking／状态、文件读取／工具卡正常，拒绝写入无副作用后允许写入正常，长时间无害命令 Stop 正常；已按明确收尾请求关闭限定切片。
- [x] 既有证据保留：73 tests、compile／lint、九个真实审批夹具、offline loopback 推理、完整 VSIX 独立解压验证；本次文档收尾未重跑。
- [x] WI-008／WI-009 延后选择主路径 F5：维护者 19:44 确认当前回复不变、结束后应用、下一条使用新设置。
- [ ] WI-008／WI-009 收尾：汇总已确认验收与自动化证据、保留边界限制，再归档。
- [ ] 已安装 VSIX 的激活／运行验证仍无证据；开发态 F5 不等于安装包验收或发布。
- [ ] WI-010 其余手动矩阵：授权复用／撤销／重置、改变范围重新询问、剩余审批／生命周期／键盘主题覆盖未获完整确认；保留为边界验证，不伪装已验收。
- [ ] 完整边界验证与 ADR（WI-010 `pending-adr`）；三个 gate Open，不因 WI 关闭、自动化或打包通过而关闭。
- **仍有效限制：** 最终受控策略仅 canonical 工作区普通文件 `read` 自动允许，搜索／列目录询问，不存在目标仅单次授权；缺 gate／握手拒绝启动，不回退可用聊天。无沙箱、无回滚／全部后代进程取消保证；可信用户凭证命令不受工具审批约束。详见 [PRD](docs/product-requirements.zh.md)、[架构](docs/architecture/vscode-extension-architecture.zh.md)、[契约](docs/reference/webview-messages.zh.md) 及 [gate](docs/reference/architecture-gates.zh.md)。[WI-003](docs/archive/2026-09-21-closed-wi-history.zh.md#wi-003)／[WI-004](docs/archive/2026-09-21-closed-wi-history.zh.md#wi-004) 的历史限制仍保留。

## 停车场

- 编辑区标签聊天（Claude Code 式 panel 默认）、Chat Participant API。
- 流式 UI 限速／合并 delta（观感优化）。
- 将模型／thinking 写回 settings.json 启动默认。
- provider 错误文案进一步友好化（WI-004 已部分覆盖）。

## 最近交接

### WI-010 限定切片收尾（2026-09-21，最新）

- 预览链接兼容修正（2026-09-21）：按维护者反馈，仅移除完成索引 8 个“记录”链接的章节锚点，保留相对路径与历史内容；绕过当前 Cursor 对带锚点相对链接的处理问题。实际预览点击待维护者复验，不改变 WI／gate 状态。

- 按维护者四项 F5 确认及“进入收尾吧”关闭 WI-010；长提案、批准、既有自动化／打包证据和旧交接并入既有双语历史，更新归档索引与完成索引；同步双语 PRD／架构／消息契约的状态与最终范围。
- 未将四项检查扩大为已安装 VSIX 或完整审批矩阵验收；WI-008／WI-009 延后设置待验收，基础 UI／空闲切换验收保留。PRD Draft、架构 Proposed／Direction、契约 Outline、gate Open、ADR pending 均不提升。
- 本次仅文档，不改源码、package、已批准计划或 Git commit。语义核对覆盖 WI-010 相关文档、状态与活动 DTO／测试；仓库 README 的旧脚手架状态另记为待后续文档同步，不在本次限定归档中扩大修改。
- 本次 `npm run docs:verify` 通过：structure／i18n 均 0 errors、0 warnings、0 stale notices；`npm run docs:health` 通过：combined errors 0、review notices 0，扫描 29 文件。首次检查提示空闲交接缺当前项字段，已补齐未指定／未授权的 Prepare 入口后复查通过；未伪造新 WI。此前 73/73、compile／lint、审批／offline／VSIX 均为已有报告，非本次重跑。

### 测试约定采用与后缀补齐（2026-09-21）

- 维护者批准双语 [testing playbook](docs/guides/agent/testing.zh.md)、加载地图／索引／TypeScript 指引及后缀解释；纯技术文档，不新增并行 WI，不关闭 gate。保留当前 `*.test.ts`／`*.test.mjs` 布局与 runner，不新增 Cursor rules，不迁移框架。
- 指南区分当前收集与未来模块内 tests 迁移；解释 `.spec`、`.e2e`、`.expected.e2e`、`.snapshot`、`.bench`、`.perf` 及 host/client/compat，未来端到端统一 `.e2e.ts`；明确收集排除、前置条件、首次启用／跳过证据。此前 61/61、compile／lint／docs 检查通过，后缀纯文档会话未重跑代码测试／F5。此前 ACTIVE 长度警告是历史检查结果，后续压缩重复内容已处理。

## 已完成 WI 索引

为兼容当前 Cursor 预览，历史链接直接打开归档文件，不附章节锚点；打开后搜索对应 WI 编号即可定位。

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
