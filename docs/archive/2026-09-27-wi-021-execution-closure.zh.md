# WI-021 — 执行状态与原生 F5 收尾

[English](2026-09-27-wi-021-execution-closure.md) | 中文

- 翻译状态：Technically Verified
- 权威原文：[2026-09-27-wi-021-execution-closure.md](2026-09-27-wi-021-execution-closure.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-27

- Type: Reference
- Status: Archived
- Created: 2026-09-27
- Authority: 历史限定验收；当前工作归 [ACTIVE](../../ACTIVE.md)

## 关闭与委托

2026-09-27 UTC（宿主记录为 Asia/Shanghai 的 9 月 28 日），代理按本次委托完成评估并关闭 WI-021；不冒称维护者亲自执行。本项关闭 REQ-004 可观察 retry／compaction 与可靠 completed／stopped／failed 切片，包含投递 ACK 独立、新草稿保留及必要宿主 focus 兼容修复。不接受整份 Draft PRD、WI-019 Q16、第三方扩展交互、所有宿主／版本或任何架构 gate。

## 保留的批准提案

公开 pi 0.86.1 事件通过既有 Adapter 映射到 host 执行状态；仅 agent_settled 结束本轮，中间结束事件和 ACK 不证明完成，失败不能被晚事件改成成功。Stop 等待稳定结束或明确失败；新草稿保留。DraftSubmission 与执行协调器保持独立权威，UI 仅渲染 v2 校验投影；沿批准公共 runtime／host／client／bridge Seam 验证。不新增 provider loop、compaction、凭证访问或 session 文件产品接口。

必要依赖修复查询公开 VS Code 命令：仅展开已注册 Pi 专用容器，再聚焦已有视图；已有容器及发现错误继续传播。实测固定官方 1.105.1 的 Explorer 回退可用，现代宿主辅助侧栏默认不变。双语 PRD 已记录，不新增架构选择或依赖。原中文当前提案原样保留于文末；其中“待收尾”是关闭前状态，以上结论取代它。

## 验收证据

以下均在 dist/delegated-completion-20260928/，是本轮执行，不是历史通过。

| 要求／证据层级 | 实际观察 |
|---|---|
| 标准测试 | test-reviewed.log：450/450，零跳过；compile-reviewed.log、lint-reviewed.log、webview-reviewed.log 通过。覆盖 ACK／settled／错误／Stop／旧事件交错及新增回退／错误传播。 |
| 原生 F5 | host-stable/matrix-first-report.json 与 matrix-repeat-report.json：正常、Stop、retry、非重试失败、模型延后、精确 grant／write／原生 captured diff／revoke、compaction 与其中 Stop。隔离父 UI 按 F5，未修改内置调试器完成 attach。 |
| 原生失败恢复 | host-stable/f5-report.json 与 lifecycle.log：上述矩阵加 retry 中 Stop、核对自有 RPC 身份后终止、failed／readonly 草稿／发送禁用、显式完整宿主 reload 恢复。 |
| 安装 VSIX | host-installed/installed-compaction-report.json：独立安装当前包，在 1.139.1 完成主矩阵；current-install-hashes.json 核对 8 个生产产物与当前树相同。package/dependency-audit.json 本轮核对 14,070 个依赖文件；package/webview-vsix.log 通过。 |
| 浏览器候选 | workflow-browser/browser.json：真实 Chrome、5 宽度×3 主题×2 语言×5 状态，共 150 个 500px 高样本；retry／compaction／终态、Stop 可达与新草稿。已查看 280px 中文高对比截图。仅合成 bridge，不是 runtime 或完整 Q16。 |
| 复审 | Standards 发现 discovery 错误断言区分不足，已修复且独立复读确认；Spec 零发现。范围为本轮相对 59dbb09 的源码／需求差异，不冒称新全历史复审。 |
| 文档 | docs-verify-fixed.log：零错误，4 个既有 Draft ADR 提示；双语零错误／警告／stale。docs-health-fixed.log 零错误；diff-check.log 通过。最终归档检查记入 ACTIVE。 |
| 清理 | failed-inspector-cleanup.json 确认 4 个自有暂停 inspector 退出；最终定向进程核对无自有 node／Code。未触碰用户安装、秘密或既往证据。 |

代理查看两张原生截图，发现首张回退视图过短，实际拖动 sash 后重跑矩阵。截图仅证明可见布局／状态；行为由断言、debugger 日志与文件 readback 证明。不宣称原 1.139.1 debugger 已修好：隔离官方 1.105.1 满足真正原生 F5，1.139.1 另有安装证据。失败实验及诊断保留于[调查](../archive/2026-09-27-wi-021-native-f5.zh.md)。

## 保留边界与资源

不推导付费模型、外部扩展、发布、安全沙箱、通用回滚或全后代取消。streaming／trust gates 保持 Open，待完整正式决策；其他 WI 仍在 ACTIVE。

保留证据目录及 OWNERSHIP.txt。确认无依赖进程后，官方宿主解压目录移至 D:/Users/hex4c59/Temp/pi-vscode-delegated-f5-1.105.1-20260928，避免第三方 README 无效链接进入仓库文档发现；未放宽 checker，原 ZIP／哈希／迁移记录保留。仅在后续 F5 不再需要且进程全部退出后清理确切自有目录；唯一日志／截图保留到无需追溯。Git 未提交、未推送。

**关闭前中文提案**

**正在做（WIP=1）**

| 字段 | 内容 |
|------|------|
| **ID** | WI-021 |
| **标题** | REQ-004 执行状态与可靠终态 |
| **阶段** | Build；隔离固定官方宿主的原生 F5 与当前安装包主矩阵已通过；补生命周期、最终检查及委托收尾中，未关闭；WI-019 尚未切换正式 root |
| **PRD 判定** | 用户可见；REQ-004 明确 retry／compaction／completed／stopped／failed 与 ACK 独立，关联 REQ-005／003；不是重开 WI-010 或复用 WI-018 |
| **授权** | 2026-09-27 本次维护者明确授权补齐 REQ-004 已要求实现与验证；仅实现可由公开 0.86.1 事件支持的观察状态，不设计 upstream 行为或新的产品取舍 |
| **Gate ID** | gate-session-streaming；Open 条件不自动接受 |
| **Decision** | none：复用既有 runtime → host → versioned webview 契约；不改变信任、持久化、工具策略或 ADR 选择 |

**目标与范围**

展示真实 pi 的自动 retry、compaction 与终态；只有 `agent_settled` 才结束本轮，agent_end、retry_end、compaction_end 均不独自证明任务完成。Stop 请求持续 stopping 到真实完成或失败；失败不可被后续 settled／ACK 改成成功。已接受投递独立于任务结果，较新草稿保留。正式和候选复用同一 host/client 能力；不以候选模拟代替真实后端证据。本次必要宿主依赖修复包含实测发现的旧宿主视图回退：查询公开命令清单，缺专用容器时聚焦 Pi 视图，正常容器失败仍报告；使用隔离官方 1.105.1 原生 F5 验证，不改变默认辅助侧栏。此为本次委托下最小兼容修复，Decision 仍 none。不做扩展加载／交互预算选择、不升级依赖、不读写 pi session 文件、不重实现 retry／compaction 或 agent loop。

**方案与架构核对**

- Runtime Adapter 在既有公共 `createPiRpcRuntime` Seam 将 pi 0.86.1 公开 `auto_retry_*`／`compaction_*` 映射为有界工作阶段事件；保留 session 与替换 reader 失效保护。错误文本沿既有脱敏／限长入口处理。
- Host Provider 拥有执行状态与本轮终态，DraftSubmission 拥有投递／ACK／任务结果的独立账本；UI 只映射受校验的状态。保持 runtime/host/contracts/ui 的既有依赖方向，不增加第二套业务状态。
- v2 仅增加有限枚举值，同树 host、validator、formal/candidate 消费者一致更新；未知值继续拒绝，旧 view/generation 继续失效；不新增 inbound 权限操作。
- 架构维度 1–5／6–12／14–19：实际公共事件、并发／ACK／Stop／替换、错误恢复、清理、容量、消息版本与用户状态逐例验证。存储／权限维度无新增写入或授权。

**验收**

一次一个红→绿→必要重构。批准 Seam 沿用真实 client／校验 bridge、公开 runtime 的确定性外部进程 Adapter、Host Provider 公开消息及实际浏览器／隔离宿主。覆盖 retry／compaction 期间仍 busy、允许 Stop、不提前应用待定设置／接纳第二轮；completed／stopped／failed 可区别，错误＋settled 与 early settled＋ACK／断连／旧事件不会误判，较新草稿和 accepted delivery 保留。标准入口收集新增测试；compile／lint／npm test／verify:webview／docs:verify／diff-check，真实无秘密无付费合成 runtime 与所需 F5／安装包分别取证。双轴独立复审并修复本次发现；人工体验／gate 仍按自身条件验收。

**范围外与批准边界**

整个任务起点仍为 `86cd3b0fd2b4a4fda00c81e0a08745da06080c85`，clean；WI-019 32 个 tracked／untracked 路径为本次已有增量，不覆盖或回退。当前 WI-019 检查点 424/424 与两组 Chrome 证据保留在 `dist/authorized-completion-20260927/`；其完整候选 Q16 待维护者确认，正式页面未切换。后续 WI-013 产品／架构待决不默认批准。本项技术交付不等于完整 Goal 或 gate 关闭；不暂存／提交／推送／修改用户安装。
