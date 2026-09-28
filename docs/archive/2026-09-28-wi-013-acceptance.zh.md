# WI-013 — 受信加载、标准交互与恢复验收

[English](2026-09-28-wi-013-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-28-wi-013-acceptance.md](2026-09-28-wi-013-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-28

- Type: Reference
- Status: Archived
- Created: 2026-09-28
- Authority: 限定委托验收与证据；[ACTIVE](../../ACTIVE.md)管理剩余工作

## 验收与批准范围

2026年9月28日Asia/Shanghai，代理按维护者本次明确决策／验收委托完成评估并关闭WI-013，不冒称维护者亲自检查。接受[ADR0002](../decisions/0002-interaction-contract-route.zh.md)的有界受信加载、标准交互及自有runtime恢复决定；不自动接受整份Draft PRD或广泛Webview／项目信任／会话流gate。WI-008／009／014／016／017及WI-010更广边界处理仍为明确剩余工作。

批准REQ-006／009切片：原生选择一个本地扩展入口并信任确认，默认受控，资源同意与工具审批分离；固定pi0.86.1公开CLI／RPC；核对MIT的pi-system-prompt-manager0.1.1、commit9c8f546b875f929ad5d573fe30e7a7fd6e3ae924；四种表单和有界literal反馈；已知custom tool逐次审批；有限队列／重放／传输预算；区分command handler／agent／dialog责任；跨renderer／host丢失保持诚实Stop未确认，另行确认End与受控恢复。精确DTO／数值政策只由消息契约／ADR维护。

## 证据核对

除特别注明外，路径均在dist/delegated-completion-20260928/。自动检查不替代独立实际宿主证据。

| 条件 | 已运行证据与结论 |
|---|---|
| 构建、类型、lint、确定性行为 | wi013-recovery-tests/compile-custom-layout.log、lint-custom-layout.log、tests-custom-layout.log：最终整合646项全通过，无跳过。覆盖精确DTO、过期／重复答复、overflow／identity预算、有界反馈／write、startup故障、late launch、单一绝对Stop deadline、空会话检查点、owner／store故障与清理。 |
| 真实第三方目标与公开结果 | wi013-real-target/、wi013-owned-adapter/固定来源／许可并运行未修改目标及公开RPC；下列原生／安装记录还执行四表单、editor readback、两种确认、取消后续与Stop。 |
| 实际runtime失败与literal答复 | wi013-real-dialog-faults/report.json：handler抛错、pending表单期间extension_error保留owner至显式End；三个注册命令路径证明自动取消、17秒人工等待及精确合成literal答复。late-launch-report.json证明真实取消后晚到launch保持分离且不自动End。失败awaited-startup结果单独保留，未计为通过。 |
| 真实pi的custom tools | wi013-custom-tool-probe/attempt2/：精确八内置加已知custom tool；Deny零执行、Allow once一次、相同请求再次Deny后总数仍一。原始--tools过滤失败在attempt1。未放宽gate保护。 |
| 真实原生F5 | wi013-native-review/f5-report.json：官方未修改Code1.105.1调试器、原生F5、fresh-empty切换、真实目标四表单／Stop／End／恢复、custom tool宿主UI拒绝／单次／再拒绝。646呈现修正在f5-layout-report.json单独验证，包含literal输入可见边界及执行readback，不用CLI development host替代。 |
| 安装包 | wi013-installed-review/installed-visual-report.json：Code1.139.1独立安装包，完整目标／恢复／custom审批。installed-layout-report.json把最终646呈现修正绑定实际1100×620、可阅读的完整固定输入及可达决定按钮；三主题双语与键盘／模型设置检查通过。646-artifact-hashes.json与当前构建匹配；pi-vscode-wi013-custom-layout.vsix资源校验通过。 |
| 视觉／交互委托评估 | 代理截图并查看窄／短表单、中英浅深色／高对比、超限答复编辑／取消、修正后refocus、custom审批警告／输入／按钮及恢复草稿。样本精确范围在报告中；截图不能独自证明投递、持久化或退出。 |
| renderer／整宿主恢复 | wi013-installed/renderer-recreation-report.json、host-reopen-report.json：实际Reload Webviews更换frame并恢复未决表单；整个宿主重开观察旧owner，须原生End、观察exit后另行受控恢复／资源选择，无自动重放或重新授权。较早版本报告只覆盖未变更seam，不冒称覆盖后来呈现修正。 |
| 同域并存窗口 | wi013-multiwindow/report.json：第二自有workspace／窗口不能准入runtime，精确run／host／child fence不变；只关闭第二窗口后，第一窗口在同run上完成新的主动请求。不冒称连续进程创建trace。archive-installed-hashes.json独立核对十个安装产物与指定645包一致。 |
| 清理／包身份 | 自有宿主／provider关闭，显式owner End、匹配terminal receipt、单独retire均记录；最后精确路径审计为空，含custom provider listener。包manifest／hash区分643／645／646证据，不把旧结果套给新代码。 |

## 决策、失败与纠正

[目标调查](../archive/2026-09-27-wi-013-target-research.zh.md)保留可复现红绿失败与版本范围。独立Standards／Spec复核发现四个不同问题：late owned launch重接入、Stop预算累加、literal答复静默丢弃、超限答复锁死表单，均已复现修复。实测另发现未持久化fresh session恢复、focus／组合恢复布局裁切、custom tool CLI过滤、custom审批详情拥挤；修正后重跑，未放宽验收。

空闲切换使用公开state／stats／state，不读session文件、不取无界历史。trusted省略CLI内置专用allowlist，使公开注册inventory可受gate校验；controlled保留精确八项。custom警告与输入共享滚动详情，决定按钮保持可达。没有引入生产合成runtime或修改pi兼容内部。

## 排除项与诚实限制

不支持任意TUI、普遍扩展兼容、认证扩展来源、远端exactly-once、取消detached代码／后代、回滚、安全沙箱、断电持久性、恶意同用户篡改store或observer同时崩溃恢复。观察者不能给出匹配证据就保持阻塞。pi0.86.1在挂stdin reader前await扩展绑定，session_start内部await UI通常不能服务；ADR0002披露该失败，不伪称成功。选定真实目标必需表单由注册命令发起且通过。

未调用付费／外部模型provider，未读取用户凭证／遍历.local-env、修改相邻仓库、污染既有profile／session、发布或Git提交／推送。localhost合成provider证据不是OS网络沙箱或每个provider认证。

## 保留与文档处理

保留所列wi013-*下唯一失败／成功报告、截图、包／CLI哈希、fixture源码、隔离profile／HOME及恢复诊断。另有dist/wi013-checkpoint-evidence/、dist/wi013-answer-ui-tests/、dist/wi013-runtime-review-tests/定向输出；更早失败supervisor夹具路径沿目标调查保留。外部官方F5工具遵循WI-021归档的所有权／清理条件。最终路径无活进程依赖；唯一证据保存并再次排除进程依赖后才清理，不按名称删除。

旧路线／候选文字在[候选归档](2026-09-28-wi-013-superseded-candidates.zh.md)；ADR仍在decisions保持当前范围／状态。改后docs:verify／docs:health及diff结果记录ACTIVE；本归档不暗示暂存、提交、推送或gate关闭。

## 关闭前的已批准提案（历史，不是当前工作）

## 正在做（WIP=1）

| 字段 | 内容 |
|------|------|
| **ID** | WI-013 |
| **标题** | 受信扩展加载与代表性 pi 标准交互 |
| **阶段** | Build：本次委托下已记录目标、数值预算、v3 DTO、custom-tool覆盖与持久恢复选择；按公开seam红→绿实施及实测 |
| **PRD 判定** | 用户可见：REQ-006／009 及 REQ-004／005 相关交互状态、取消与恢复 |
| **授权** | 本次明确委托代理选择真实扩展目标、必需交互、DTO／队列／溢出／恢复预算，完成实施与实测验收；不是整份 Draft 接受 |
| **Gate ID** | gate-webview-trust、gate-project-trust、gate-session-streaming；均保持 Open 至各自完整条件满足 |
| **Decision** | pending-adr：ADR 0002，按正常治理记录本次精确决定／证据；不绕过公开 API 与安全边界 |

### 目标与范围

完成当前尚未实现的 trusted loading profile、显式空闲切换、失败恢复及一般扩展交互。已复核 pi 0.86.1 公开 RPC，并选定 pi-system-prompt-manager 0.1.1 固定 commit 9c8f546b875f929ad5d573fe30e7a7fd6e3ae924（MIT），详见[目标调查与本轮实际验证](../archive/2026-09-27-wi-013-target-research.zh.md)。隔离有效 HOME 后未修改目标源码的四类标准交互、取消差异、编辑／删除／持久化与 Stop 取消链公开 RPC 实测通过；加载错误、命令错误与宿主退出后独立观察 exact child 的可行性亦已实测。尚不是产品／宿主验收；恢复域与持久准入设计已在ADR0002决定并实现，完整验收仍待当前缺陷修复与余下边界核对。按实际必需交互确定支持集合；不预设“单扩展＋confirm”足够，也不承诺任意 TUI 或生态兼容。

### 方案与架构核对

现有 [ADR 0002](../decisions/0002-interaction-contract-route.zh.md)、[候选契约](../reference/webview-messages.zh.md) 与 pi 兼容调查只提供未接受候选。比较可行方案后由代理作出有理由的最简单可靠选择：受信 profile 的加载与审批覆盖；host-owned operation／interaction 关联与一次性答复；精确 DTO、数字预算、排队／溢出／过期／重放；取消不合作、子进程退出与所有权丢失区别、显式 reload 恢复边界。公开 API 不提供的远程事实保持 unknown，不推测成功、不重建 pi 内核，不依赖上游增强作为通用前置。ADR 0002 已记录本次选定四类表单、1+7队列／有界ID保留、v3迁移、独立handler lease及被动supervisor＋持久fence方向；共享恢复域一次一个runtime的权衡已同步PRD，不冒称实现或验收。精确DTO／custom-tool审批覆盖及19维治理结论已冻结在契约“WI-013选定v3接入契约”，现转Build；本次委托提供方案与实施授权，不等于ADR／gate验收。

### 验收

先把选定目标、版本／许可、能力证据、产品权衡与预算写入双语 PRD／ADR／契约，再按依赖红→绿实施；独立复审并补边界缺陷。确定性测试覆盖校验、竞态、晚到／重复、预算、取消及清理；真实 pi 与选定真实扩展在无秘密／localhost 合成条件下验证加载、标准交互、Stop／失败恢复／退出或失联，不把 mock 当实测。实际原生 F5 与新安装包分别验证 UI／键盘／审批／恢复及资源释放；关闭满足条件的 WI／ADR／gate，保留不满足项的精确证据。compile／lint／tests／打包／docs:verify／docs:health／diff 按改动执行。

### 范围外与批准边界

禁止付费调用、用户秘密、相邻仓库修改、发布／提交／推送、pi 内部模块／loop／provider／compaction 重实现、通过 session 文件实现产品功能。扩展加载不是安全沙箱，不能把关联 token 当认证，也不暗增持久化或自动杀掉未知所有权的进程。超出已接受需求／强制规则的改变仍需最小必要确认。WI-008／009／014／016／017 后续仍逐项核对，不被本 WI 隐去。
