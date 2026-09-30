# 已关闭工作项编号索引

[English](2026-09-29-closed-wi-index.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-29-closed-wi-index.md](2026-09-29-closed-wi-index.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-29
- Type: Reference
- Status: Archived
- Authority: 仅历史查找；现行工作见 [`ACTIVE.md`](../../ACTIVE.md)

## 替代原因

2026-09-29 维护者要求压缩 ACTIVE。已完成 WI 表已变成会话入口目录。编号查找归此处；ACTIVE 只保留短指针和最近关闭的一行。压缩本身不关闭 WI-023／024／026，不改 gate 或 ADR，不授权提交。同日稍后维护者确认这三项的 F5 视觉接受，对应行见下表。

早期行里仍写 gate Open 的，是该 WI 验收当日的快照，不是当前状态。现行六项架构 gate 均为 Accepted，见 ADR 0001 与 ADR 0004。

## 用法

打开链接记录查看范围、证据和限制。不要按本表实施。按文件罗列的归档目录仍在 [归档 README](README.zh.md)。

## 已关闭 WI 查找

| WI | 结果 | 完成／验收 | 历史 |
|----|------|------------|------|
| WI-001 | 扩展壳、辅助侧栏与 RPC 探针；ADR 0001 | 2026-09-19 | [记录](2026-09-21-closed-wi-history.zh.md) |
| WI-002 | 版本化 ping/pong Webview 桥 | 2026-09-19 | [记录](2026-09-21-closed-wi-history.zh.md) |
| WI-003 | Project trust 技术 spike；当时快照仍写 gate Open | 2026-09-19 | [记录](2026-09-21-closed-wi-history.zh.md) |
| WI-004 | REQ-004 最小流式聊天；当时快照仍写 gate Open | 2026-09-21 | [记录](2026-09-21-closed-wi-history.zh.md) |
| WI-005 | 文档健康第一阶段 | 2026-09-19 | [记录](2026-09-21-closed-wi-history.zh.md) |
| WI-006 | 工作区与项目资源选择 UI | 2026-09-21 | [记录](2026-09-21-closed-wi-history.zh.md) |
| WI-007 | 根据资源选择启动 pi RPC | 2026-09-21 | [记录](2026-09-21-closed-wi-history.zh.md) |
| WI-008 | 模型选择／就绪、故障／审批／Stop、认证错误安全与必要实机修复 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；WI-009及广泛gates不自动关闭 | [记录](2026-09-28-wi-008-model-acceptance.zh.md) |
| WI-009 | thinking能力／下一轮意图、审批／Stop／退出恢复、键盘焦点与短窗错误修复 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；完整REQ／广泛gates不自动关闭 | [记录](2026-09-28-wi-009-thinking-acceptance.zh.md) |
| WI-010 | thinking／受控工具／Stop 四项 F5 已确认；限定切片关闭，当时 ADR pending／gate Open | 2026-09-21 | [记录](2026-09-21-closed-wi-history.zh.md) |
| WI-010 剩余边界／原Goal | 三项剩余gate、ADR0004、Living契约、实际分层验证与全局收尾 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估 | [记录](2026-09-28-wi-010-goal-closure.zh.md) |
| WI-011 | 模块内测试迁移、递归 runner 与 scripts 分组；限定技术切片收尾 | 2026-09-22 | [记录](2026-09-21-closed-wi-history.zh.md) |
| WI-012 | 最小 P1–P3 探针切片关闭；P3／完整兼容缺口保留，不是产品验收 | 2026-09-22 | [记录](2026-09-21-closed-wi-history.zh.md) |
| WI-013 | 受信扩展加载、标准交互、工具审批与自有runtime恢复；ADR0002 Accepted | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；广泛gates当时保持Open | [记录](2026-09-28-wi-013-acceptance.zh.md) |
| WI-014 | 显式文件／选区混合附件、逐项确认、完整预览／历史／容量恢复与丢失提示 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；审阅／会话及广泛gates不自动关闭 | [记录](2026-09-28-wi-014-attachment-acceptance.zh.md) |
| WI-015 | React／TypeScript／Vite 迁移验收；ADR 0003 Accepted | 2026-09-27 UTC 代理按本次委托完成评估；广泛 gates 当时保持 Open | [记录](2026-09-27-wi-015-react-acceptance.zh.md) |
| WI-016 | 受控dirty保护／准确readonly历史diff、分页及丢失恢复；短窗裁切红→绿 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；WI-017与广泛gates仍独立 | [记录](2026-09-28-wi-016-review-acceptance.zh.md) |
| WI-017 | 当前项目／CLI-origin会话、顺序交接、原文历史与异常恢复；trusted默认重置红→绿 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；广泛gates独立 | [记录](2026-09-28-wi-017-session-acceptance.zh.md) |
| WI-019 | Q16 委托评估、共享正式 chat、实机浮层／资源修复与独立 F5／安装验收 | 2026-09-27 UTC 代理按本次委托完成评估；ADR／gates 不自动关闭 | [记录](2026-09-27-wi-019-formal-chat.zh.md) |
| WI-020 | 跨模块公共入口与模块类型契约；唯一 P2 已修复，双轴零发现 | 2026-09-26 维护者技术验收；ADR／gate 不变 | [记录](2026-09-26-wi-020-public-entries.zh.md) |
| WI-021 | REQ-004 retry／compaction／可靠终态与必要 focus 回退修复；原生 F5／安装分别验证 | 2026-09-27 UTC 代理按本次委托完成评估；gates 不变 | [记录](2026-09-27-wi-021-execution-closure.zh.md) |
| WI-022 | Windows后台终端闪现；默认CLI `--no-daemon` 规避，维护者确认关闭 | 2026-09-28 维护者确认已解决 | [记录](2026-09-28-wi-022-closure.zh.md) |
| WI-023 | 设置布局与模型选择器可见；维护者 F5 视觉验收。记录中的剩余项只有这次 F5 | 2026-09-29 维护者确认；安装 VSIX 不在本次证据内 | [记录](2026-09-28-wi-024-paused-proposal.zh.md) |
| WI-024 | 扩展内 API Key 与默认模型；维护者 F5 视觉验收设置分区、Add key 与模型选择器恢复 | 2026-09-29 维护者确认；OAuth、自定义端点、付费调用和安装 VSIX 不在本次接受内 | [记录](2026-09-28-wi-024-paused-proposal.zh.md) |
| WI-025 | 侧栏视觉工艺、准备阶段修正与启动前强度；维护者 F5 视觉验收 | 2026-09-29 维护者确认；VSIX／真实模型完整链不在本次验收证据内 | [记录](2026-09-29-wi-025-active-superseded.zh.md) |
| WI-026 | 编辑区设置页方案 A；维护者 F5 视觉验收 | 2026-09-29 维护者确认；安装 VSIX 不在本次证据内 | [记录](2026-09-29-wi-026-active-superseded.zh.md) |
| WI-027 | 收回附件预览失败句与交互文案到 UiText；维护者接受该展示切片 | 2026-09-29 维护者确认；F5／安装 VSIX 不在本切片内 | [记录](2026-09-29-wi-027-ui-text.zh.md) |
| WI-028 | 分离 RPC 运行时与进程策略；维护者技术接受 | 2026-09-29 维护者确认；Linux 隔离 spike／F5／安装 VSIX 不在本次证据内 | [记录](2026-09-29-wi-028-runtime-process.zh.md) |
| WI-029 | RPC 运行时拆成应答配对、帧翻译与任务忙闲；维护者技术接受 | 2026-09-29 维护者确认；真实 pi／F5／安装 VSIX 不在本次证据内 | [记录](2026-09-29-wi-029-rpc-runtime-modules.zh.md) |
| WI-030 | OAuth 登录与一个 OpenAI 兼容端点；维护者完成剩余的设置页检查 | 2026-09-29 维护者确认；真实浏览器登录、真实端点调用和新的安装包不在本次关闭内 | [记录](2026-09-29-wi-030-oauth-endpoint.zh.md) |
| WI-031 | 会话 worker 报文共用一份校验；协议版本和用户可见行为不变；维护者技术接受 | 2026-09-29 维护者确认；F5／安装 VSIX 不在本切片内 | [记录](2026-09-29-wi-031-session-worker-protocol.zh.md) |
| WI-032 | 六入口共用宿主凭据规则；限定技术切片接受 | 2026-09-30 代理按维护者最终委托接受；原生敏感交互仍未验证 | [记录](2026-09-30-wi-032-macos-evaluation.zh.md) |
| WI-033 | 运行时报文校验与真实 pi 字节注入；非 JSON 忽略规则保留 | 2026-09-30 代理按维护者最终委托接受；不是原生活跃宿主坏帧注入 | [记录](2026-09-30-wi-033-macos-evaluation.zh.md) |
| WI-034 | 确定性 VSIX 组包、解包 RPC／gate 与 macOS F5／隔离安装激活 | 2026-09-30 代理按维护者最终委托接受；不是完整 REQ-009 或整份 PRD 接受 | [记录](2026-09-30-wi-034-macos-evaluation.zh.md) |
| WI-035 | 回执保障启动交接、活所有者安全、实际 macOS F5／隔离安装证据；ADR 0006 Accepted | 2026-09-30 代理依据维护者本次明确委托接受；共享域与会话内恢复不变 | [记录](2026-09-30-wi-035-macos-acceptance.zh.md) |
| WI-036 | 宿主丢失时清理精确自有子进程；ADR 0008 Accepted | 2026-09-30 代理；窗口崩溃 F5／安装已记录 | [记录](2026-09-30-wi-036-macos-acceptance.zh.md) |
| WI-037 | 有界 thinking 流式与完整引号凭据值脱敏（RUNTIME-01／02） | 2026-09-30 代理依据本次明确的实机取证并完结委托接受；助手正文逐 delta 仍范围外 | [记录](2026-09-30-wi-037-macos-acceptance.zh.md) |
| WI-039 | 交付 VSIX 包含自身 bundle 会加载的运行时依赖闭包（PACKAGE-01） | 2026-09-30 代理依据本会话完成 ACTIVE 收尾并提交的要求接受；ARCH-07 仍停车场 | [记录](2026-09-30-wi-039-macos-acceptance.zh.md) |
| WI-038 | 跨宿主 endpoint 写入互斥及明确冲突／清理结果（ARCH-05）；ADR 0007 Accepted | 2026-09-30 代理依据本会话完成 ACTIVE 收尾并提交的要求接受；ADR 0005 与输出预算仍范围外 | [记录](2026-09-30-wi-038-macos-acceptance.zh.md) |
| WI-040 | 并发预检查下待审批卡最多八张（CORE-01） | 2026-09-30 代理依据本会话完成 ACTIVE 收尾并提交的要求接受；无 gate 或 ADR | [记录](2026-09-30-wi-040-macos-acceptance.zh.md) |
| WI-041 | session-worker inspect／history／preview 请求关联与预览游标不变量（CORE-02） | 2026-09-30 代理依据本会话完成 ACTIVE 收尾并提交的要求接受；无 gate 或 ADR | [记录](2026-09-30-wi-041-macos-acceptance.zh.md) |
| WI-042 | 模型选择器已应用 radio 使用稳定供应商／模型 id 身份（UI-01） | 2026-09-30 代理依据本会话完成 ACTIVE 收尾并提交的要求接受；无 gate 或 ADR | [记录](2026-09-30-wi-042-macos-acceptance.zh.md) |
| WI-043 | 模型弹层 Escape 忽略已消费事件（UI-02） | 2026-09-30 代理依据本会话完成 ACTIVE 收尾并提交的要求接受；无 gate 或 ADR | [记录](2026-09-30-wi-043-macos-acceptance.zh.md) |
| WI-044 | Vite 配置纳入提交检查实现输入（TOOL-01） | 2026-09-30 代理依据本会话完成 ACTIVE 收尾并提交的要求接受；无 gate 或 ADR | [记录](2026-09-30-wi-044-macos-acceptance.zh.md) |
| WI-045 | 缺失审阅路径正文与 tooltip 共用翻译入口（UI-03） | 2026-09-30 代理依据本会话完成 ACTIVE 收尾并提交的要求接受；无 gate 或 ADR | [记录](2026-09-30-wi-045-macos-acceptance.zh.md) |
| WI-046 | 诊断探针拥有 child／pipe 错误、boolean success 与观察退出（RUNTIME-03／04／05） | 2026-09-30 代理依据本会话完成 ACTIVE 收尾并提交的要求接受；无 gate 或 ADR | [记录](2026-09-30-wi-046-macos-acceptance.zh.md) |
| WI-047 | endpoint 写入输出须在提交前落入 1 MiB 读取预算（ARCH-06） | 2026-09-30 代理依据本会话完成 ACTIVE 收尾并提交的要求接受；无 gate 或 ADR | [记录](2026-09-30-wi-047-macos-acceptance.zh.md) |
| WI-048 | 默认保存失败不把请求中的模型应用到实时会话（ARCH-02 补充） | 2026-09-30 代理依据本会话完成 ACTIVE 收尾并提交的要求接受；无 gate 或 ADR | [记录](2026-09-30-wi-048-macos-acceptance.zh.md) |
| WI-049 | 组包入口缺必需 helper 或 CSS 时失败（ARCH-07） | 2026-09-30 代理依据本会话完成 ACTIVE 收尾并提交的要求接受；无 gate 或 ADR | [记录](2026-09-30-wi-049-macos-acceptance.zh.md) |
| WI-050 | 未收集的 `.spec.tsx` 使发现失败而不是被跳过（TOOL-02） | 2026-09-30 代理依据本会话完成 ACTIVE 收尾并提交的要求接受；无 gate 或 ADR | [记录](2026-09-30-wi-050-macos-acceptance.zh.md) |
| WI-051 | Composer 标志与 FileSnapshot 校验器未确认生产错误配对 | 2026-09-30 代理依据本会话完成 ACTIVE 收尾并提交的要求接受；无 gate 或 ADR | [记录](2026-09-30-wi-051-macos-acceptance.zh.md) |
| WI-052 | 启动、诊断、artifact 与 test／Git 成本目前不需要库内预算 | 2026-09-30 代理依据本会话完成 ACTIVE 收尾并提交的要求接受；无 gate 或 ADR | [记录](2026-09-30-wi-052-macos-acceptance.zh.md) |
| WI-053 | 流式发布与历史预览成本目前不值得优化 | 2026-09-30 代理依据本会话完成 ACTIVE 收尾并提交的要求接受；无 gate 或 ADR | [记录](2026-09-30-wi-053-macos-acceptance.zh.md) |
| WI-054 | 准入所有者已列表；busy 标志保持分离（ARCH-01） | 2026-09-30 代理依据本会话完成 ACTIVE 收尾并提交的要求接受；无 gate 或 ADR | [记录](2026-09-30-wi-054-macos-acceptance.zh.md) |
| WI-055 | 运行时可选项留在同一 lifecycle；不拆分（ARCH-03） | 2026-09-30 代理依据本会话完成 ACTIVE 收尾并提交的要求接受；无 gate 或 ADR | [记录](2026-09-30-wi-055-macos-acceptance.zh.md) |
| WI-056 | 模型与 Webview 共享值对象保留；未复制 DTO（ARCH-04） | 2026-09-30 代理依据本会话完成 ACTIVE 收尾并提交的要求接受；无 gate 或 ADR | [记录](2026-09-30-wi-056-macos-acceptance.zh.md) |
| WI-057 | 已保存默认应用顺序抽出；用户可见规则冻结（ARCH-02） | 2026-09-30 代理依据完成剩余任务的 goal 接受；无 gate 或 ADR | [记录](2026-09-30-wi-057-macos-acceptance.zh.md) |
| WI-058 | 每个 VS Code 窗口独立恢复域；ADR 0009 Accepted | 2026-09-30 代理；双窗口 F5／安装已记录 | [记录](2026-09-30-wi-058-macos-acceptance.zh.md) |
| WI-059 | 本机插件清单产品边界（仅文档）；Draft ADR 0010 | 2026-10-01 代理依据完成 ACTIVE 的 `/goal`；无存储／UI／加载 | [记录](2026-10-01-wi-059-acceptance.zh.md) |
| WI-060 | 宿主插件清单文件存储 | 2026-10-01 代理依据完成 ACTIVE 的 `/goal`；无设置 UI 或运行时加载 | [记录](2026-10-01-wi-060-acceptance.zh.md) |
| WI-061 | 设置「插件」空列表与从磁盘添加 | 2026-10-01 代理依据完成 ACTIVE 的 `/goal`；无移除、启用或运行时加载 | [记录](2026-10-01-wi-061-acceptance.zh.md) |
| WI-062 | 从插件清单移除 | 2026-10-01 代理依据完成 ACTIVE 的 `/goal`；磁盘文件仍在；无启用或运行时加载 | [记录](2026-10-01-wi-062-acceptance.zh.md) |
| WI-063 | 启用或关闭清单项 | 2026-10-01 代理依据完成 ACTIVE 的 `/goal`；活 runtime 不变；无 `-e` 应用 | [记录](2026-10-01-wi-063-acceptance.zh.md) |
| WI-064 | 空闲受信应用已启用清单项 | 2026-10-01 代理依据完成 ACTIVE 的 `/goal`；最多一个额外 `-e`；保留加载同意 | [记录](2026-10-01-wi-064-acceptance.zh.md) |
| WI-065 | 消息编辑区执行配置收拢 | 2026-10-01 代理依据完成 ACTIVE 的 `/goal`；作曲区无选择器；添加留在设置 | [记录](2026-10-01-wi-065-acceptance.zh.md) |
| WI-066 | 作曲区模型芯片展示 | 2026-10-01 代理依据完成 ACTIVE 的 `/goal`；格式化 id、无供应商；保留 WI-042 身份 | [记录](2026-10-01-wi-066-acceptance.zh.md) |
| WI-067 | 作曲区模型选择器与执行配置互斥 | 2026-10-01 代理依据完成 ACTIVE 的 `/goal`；一次只开一张 | [记录](2026-10-01-wi-067-acceptance.zh.md) |

## 不在本索引

- **WI-018** 从未登记，不再使用。
