# ADR 0004：端到端信任与会话生命周期边界

[English](0004-trust-and-lifecycle.md) | 中文

- Type: ADR
- Status: Accepted
- Created: 2026-09-28
- 决策批准：2026-09-27 UTC，维护者明确委托范围内决策与基于证据的验收；不表示维护者亲自检查
- 验证与决定：2026-09-28 Asia/Shanghai，代理按本次委托完成评估
- Gates：`gate-webview-trust`、`gate-project-trust`、`gate-session-streaming`
- 工作项：WI-010 剩余广泛边界；[已关闭范围与Goal最终记录](../archive/2026-09-28-wi-010-goal-closure.zh.md)
- 翻译状态：Machine Draft
- 权威原文：[0004-trust-and-lifecycle.md](0004-trust-and-lifecycle.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-28

## 背景

此前 WI-010 受控执行切片及 ADR0001–0003 没有解决这三个完整边界问题。附件、审阅、会话与受信扩展工作扩大了协议双向表面。单凭测试、截图或这些 WI 的关闭不能建立组合结论。本决定对照 [gate 登记表](../reference/architecture-gates.zh.md) 的准确问题、现行 [Living v3 契约](../reference/webview-messages.zh.md)、源码及分层证据进行审查。

## 决定与理由

1. **低信任展示，host 权威。** 保留 exact、版本化 v3 命名意图 allowlist。Host 校验 unknown、当前 view／generation、IDs 及操作资格；browser 校验有界 host 投影再渲染。没有通用命令、路径、文件系统、shell 或 SDK 能力桥。资产／CSP 限定打包 renderer。凭证留在 host／runtime 配置，不进入 UI 投影。拒绝 Webview v1/v2；独立审批 gate 协议仍为 v1。配对软件包替换是迁移边界，不增加旧协议适配器。
2. **三种不同授权。** 仅本地 extension host 中一个已信任的本地 file-scheme 文件夹可执行。无文件夹、多根、remote host、非 file URI 明确拒绝，不声称部分支持。资源选择仅驻 host 内存、绑定 workspace generation，通过公开 pi 资源 flags 实现：allow 不等于逐工具批准，decline 不排除全部上下文文件，也不是 OS 沙箱。工作区变化撤销接纳并要求重新选择；不伪造／持久化 upstream trust。受控与显式加载的受信代码遵循 ADR0002，不声称审批 hooks 能沙箱化任意扩展。
3. **一个权威生命周期。** 公开 pi RPC 拥有 agent 执行、retry、compaction 与持久会话。Host 拥有产品状态，adapter 关联请求／事件，区分 prompt ACK 与权威 `agent_settled`。有界投影保留顺序、拒绝陈旧工作；Stop 取消审批／交互接纳、清队列并请求 abort，有界等待、不重放任务。失败／未确定完成不得冒充成功或静默重试副作用。
4. **诚实清理与恢复。** 保留 ADR0002 在所有权／transport 丢失后的 exact-child 观察与持久 unknown-runtime fence。不自动杀死不确定工作，不由 PID 消失推断终止，不因 reload 清 fence。显式 End、原生警告、匹配终止回执、另行 Recover 才能恢复。工作区变为不可信／空时仍可 End／Recover 已保留的子进程，但不能启动新 runtime 或授予资格／资源 consent。正常 provider teardown 仍有明确有界 stop owner。不保证全部后代取消或回滚。

这是满足已批准 REQ-001～009、且无需重建 pi 或增加竞争持久层的最简单现有边界。不引入新框架、分布式 owner 注册表、隐式信任、retry 引擎或 session 文件实现。

## 比较过的替代方案

- 由既有 WI 关闭或截图直接接受 gates：拒绝，无法覆盖全部生产端或证明异步所有权、信任迁移及进程清理。
- 宽松 bridge、兼容 fallback、UI-side runtime：拒绝，会扩大权限并削弱版本／错误所有权。
- 信任变化／Stop 不确定时自动 kill，reload 自动恢复：拒绝，会改变 ADR0002 的副作用与不确定性契约。实际受限清理缺陷只修复窄 host guard。
- 要求穷尽所有 provider、OS、fork、所有可能时序才能接受任何架构结论：拒绝，这是不同的普遍支持承诺，不是登记的问题。已覆盖拒绝策略、具体事件类别及失败迁移；新增依赖／宿主支持须新证据。

## 证据与修复

详细索引：dist/delegated-completion-20260928/wi010-installed/EVIDENCE.md。其按日期分段保留早期665／669结果；最终 producer/menu 构建 **671 测试通过**，compile／lint 通过，无跳过。日志 producer-menu-green.log、producer-menu-compile.log、producer-menu-lint.log；不声称历史宿主运行采用了后来的产物。

- **源码／测试边界审查：** exact 双向校验、DTO 生产端、host guards、附件／审阅／会话预算与 stale 测试。发现并修复 model fallback 超200字符、脱敏扩张超 final65536／activity16384上限、UTF-8 扩展展示名和 workspace 展示名问题。原生完整路径／cwd 不截短。保留 red 与修复结果；model trigger／菜单溢出在实际宿主修复重测。
- **公开 upstream：** wi010-pi-resources/run.log 是 pi0.86.1 新六场景资源矩阵，含实际公开 SDK／RPC 和 context readback；执行／交互／会话证据另见切片归档。不调用付费 provider、SDK 内部接口，不以 session 文件实现产品能力。
- **原生 F5：** wi010-native 使用未修改的官方 Code1.105.1、真实 F5 attach，不是 CLI development host。未声称现代1.139.1 debugger 缺陷已 upstream 修复；受支持官方1.105.1提供实际 F5 lane。
- **安装版：** wi010-installed 使用官方 Code1.139.1 与隔离 VSIX。trust-report.json、workspace-full-report.json、security-report.json、security-full-report.json、streaming-report.json 分别证明实际信任／文件夹迁移、显式清理、CSP、观测到的 DTO canary 及 normal／Stop／retry／error／compaction。CSP／DOM 观测不单独证明全部秘密隔离，须合并源码／校验审查。
- **当前包映射：** wi013-package/pi-vscode-wi010-producer-menu.vsix、assembly-wi010-producer-menu.json、producer-artifact-hashes.json、audit-producer-artifacts.ps1。重新审查14070个固定依赖条目，包共14085项。公开 runtime 启动／审批 handshake 与 renderer 检查见 wi010-pi-resources/verify-vsix-menu.log、verify-webview-menu.log。安装 manifest 含 VS Code 添加的 metadata，单独比较声明内容，不谎称原始字节相同。
- **披露产物差别：** 功能 bounds-report.json 跑 producer-layout；hash 证明最终 producer-menu 的 host／runtime／renderer JS／SVG 相同，只有 CSS 不同。最终 bounds-visual-report.json 在两种实际宿主、三主题／两语言、窄短视口另验 CSS，含动画完成后菜单截图、完整标签、thinking 可见、键盘滚动／焦点返回及草稿保留。已打开查看截图；行为由进程／readback 断言证明。
- **清理：** explicit-owner-cleanup.json 记录 End→terminal→Recover；final-process-audit.json 记录这些根目录 live／CIM 自有进程为零。被放弃 browser 的 GPU helper 单独核对历史 owner 后终止，不是靠 PID 推断产品 fence 恢复。

先前验收切片保留各自版本／日期及限制：[执行／原生 F5](../archive/2026-09-27-wi-021-execution-closure.zh.md)、[受信交互／恢复](../archive/2026-09-28-wi-013-acceptance.zh.md)、[附件](../archive/2026-09-28-wi-014-attachment-acceptance.zh.md)、[审阅](../archive/2026-09-28-wi-016-review-acceptance.zh.md)、[会话](../archive/2026-09-28-wi-017-session-acceptance.zh.md)。它们补充而不替代新 WI-010 验证。

## 架构治理审查

逐一考虑19维。pass 仅针对本边界决定，不代表全部产品／发布成熟度。模块路径是仓库证据；上述报告分别位于两个 WI-010 宿主根目录。

| 维度 | 状态 | 磁盘证据 | 剩余风险／处置 |
|---|---|---|---|
| 1 模块划分 | pass | src/extension/、src/adapter/runtime/、src/webview/；架构 owner 表 | host 协调者仍集中；不做无关重构 |
| 2 公共接口 | pass | src/extension/bridge/webviewMessages.ts；contracts/webviewProtocol.ts | 仅命名意图，无通用能力 |
| 3 依赖 | pass | 构建与 verify-webview-menu.log；分层方向 | browser 不引入 privileged runtime，未来变更重查 bundle |
| 4 契约 | pass | Living webview-messages.md、exact validators／tests | 旧信封归档，不兼容 |
| 5 所有权 | pass | piChatViewProvider.ts、ADR0002、explicit-owner-cleanup.json | exact child，不保证全部后代 |
| 6 需求范围 | pass | Draft PRD 批准的 REQ-001～009 切片及关闭归档 | 不接受整份 Draft PRD |
| 7 领域模型 | pass | workspace／view／runtime／session 类型及契约 identity | 身份不可互换 |
| 8 状态机 | pass | host／adapter lifecycle tests、trust／workspace reports | unknown runtime 须有效回执才解除 fence |
| 9 并发 | pass | generation／view／request guards、671测试、streaming／session证据 | 不声称穷尽所有调度 |
| 10 错误恢复 | pass | restricted-cleanup red／green、ADR0002、streaming-report.json | 不重试不确定 mutation，不回滚 |
| 11 生命周期清理 | pass | explicit-owner-cleanup.json、final-process-audit.json、lifecycle tests | OS／用户自有进程不在范围内 |
| 12 安全信任 | pass | validators、producer审查修复、CSP／DTO报告、公开资源矩阵 | 扩展非 OS 沙箱；受信代码有权限 |
| 13 数据持久化 | pass | 公开 session APIs、WI017归档、附件／审阅 host-memory owner | 不增加 session 文件读写；披露内存丢失 |
| 14 可观测隐私 | pass | activityProjection.ts、producer脱敏测试、有界错误 | 只用 synthetic canary，不收集真实秘密 |
| 15 背压 | pass | adapter limits、附件／交互预算、bounds reports | 明确拒绝／截断，不提供无限历史 |
| 16 测试 | pass | 671日志；独立 public-runtime／F5／installed 报告 | 模拟不替代实际宿主 |
| 17 构建发布升级 | pass | package pins、assembly审查、VSIX公开runtime探针 | 本地验收，不发布，不声称其他平台 |
| 18 兼容版本 | pass | v3-only契约；pi0.86.1；Code1.105.1 F5／1.139.1安装 | forks及其他组合需另证 |
| 19 UX／可访问性 | pass | bounds-visual-report.json、已查看截图、WI014／016／017矩阵 | 键盘／主题证据，不是普遍辅助技术认证 |

**结论：** 这些边界的 document-first 对齐已完成；决策类 `adr-after-approval`，批准来自明确委托。审查范围达到 **Evolvable**：有 Living 契约、执行性测试、实际依赖／宿主／安装包证据及 ADR 理由。接受三个准确 gate 结论；不自动关闭 Goal 最终记录，也不声称全部产品／环境交付。

## 后果与重验

后续必须保留 host 所有权、精确 v3 校验、有界脱敏 producer、公开 pi 集成及 receipt-based recovery。协议扩权、存储／owner 变化、pi 升级或生命周期语义变化需重审 ADR／gates。新增支持 provider／平台／fork 需对应验证。错误 harness 假设与产品回归保留为证据，不能静默改称通过。本决定未授权真实凭证、付费调用、邻仓修改、Git 提交或发布。
