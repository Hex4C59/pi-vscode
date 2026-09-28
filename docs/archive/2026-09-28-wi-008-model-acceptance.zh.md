# WI-008——模型选择与就绪验收

[English](2026-09-28-wi-008-model-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-28-wi-008-model-acceptance.md](2026-09-28-wi-008-model-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-28
- Type: Reference
- Status: Archived
- Created: 2026-09-28
- Authority: 历史限定委托验收；ACTIVE拥有剩余工作

## 委托验收

2026年9月28日Asia/Shanghai，代理按本次明确委托完成评估，关闭WI-008已批准的模型选择／就绪切片；不是维护者亲自检查。REQ-002完整要求仍Draft；WI-009 thinking、WI-014／016／017、WI-010边界处置与三项广泛gates仍是独立剩余工作，不由共享控件或本关闭推断接受。

收尾逐项对照当前公开模型API、host状态协调、命名Webview意图、测试及实测证据，覆盖空闲／下一轮、审批／Stop、错误安全、无模型／缺凭证、失联恢复、键盘／焦点与有界布局。保留已有接受路径，不重建。最终根代理复核在本限定模型协调、晚到失效、焦点所有权、错误分类、空模型映射及未使用会话恢复范围未发现剩余实现缺陷；不是独立全仓审查。

## 证据与版本边界

以下均位于dist/delegated-completion-20260928/。长证据、失败及精确命令归wi008-installed/EVIDENCE.md与wi008-readiness/EVIDENCE.md，不建立第二任务账本。

| 条件 | 实际证据与限制 |
|---|---|
| 当前自动化树 | wi008-readiness/compile-auth-rejection.log、lint-auth-rejection.log、tests-auth-rejection.log：compile／lint与656／656测试通过，无跳过。确定性覆盖旧session／view、mutation／readback失败、待决清理、安全事件／拒绝分类及不重放；注入故障不是实际provider故障声明。 |
| 空闲／流式／Stop／审批／错误恢复 | wi008-native/report.json与wi008-installed/report.json：649树原生F5和安装分别验证请求模型、拒绝工具后续仍用旧模型至settlement、下一轮应用、Stop／草稿、显式重试、键盘及勾选符。 |
| 认证及所有权故障 | 两域fault-report.json：651树分别验证合成401安全提示、审批Stop零未批准写、actual owned exit清待决、不重放及独立受控恢复。 |
| 无模型／缺密钥／空恢复 | wi008-readiness/report.json与wi008-readiness-native/report.json：656树安装与原生F5分别验证无模型指引／Send禁用／零请求、未使用空会话恢复、缺密钥在provider请求前拒绝、合成配置后明确New确认并有意发送一条新请求。 |
| 呈现 | 三真实主题×双语共六张短窗模型菜单已逐张打开检查；另六项正式布局样本覆盖浮层、焦点和Enter。实际窗口1100×620、Webview约289×506；computed伪元素证明勾选符。关闭动画期间审批截图不作为稳定布局声明。 |
| 包身份 | wi008-readiness/package-auth-rejection.log：14085项及解压RPC／gate检查；最新包wi013-package/pi-vscode-wi008-auth-rejection.vsix。656-artifact-hashes.json证明六项安装产物匹配当前构建，原生域记录同一构建。 |
| 资源生命周期 | 两readiness域explicit-owner-cleanup.json与final-cleanup.log：End自有child、matching terminal receipt、再显式恢复。四个WI008域final-process-audit.json均为空。 |

这些是增量限定证据，不把649／651结果改称完整656重跑。已覆盖模型选择／呈现路径保留，后续错误／启动／恢复修改有分别656实测及当前完整回归。实际F5使用官方未修改Code1.105.1；安装版Code1.139.1；没有用CLI development host、mock浏览器或安装版冒充F5。localhost合成provider证明受控行为，不是全部provider兼容或外部凭证配置认证。

## 决定与修复

- 保留host权威已应用／待决状态、公开RPC readback、先模型后thinking串行应用、严格晚到失效；无mutation重试或全局默认持久化。
- Chromium为本次空闲选择禁用模型按钮时恢复丢失焦点，不抢较新草稿焦点；字面量CSS转义修为真实勾选符。两缺陷均有回归及实际宿主补证据。
- provider错误正文不进入Webview；认证／可用性／限流／一般错误映射固定提示。缺密钥prompt拒绝只在内部携带allowlisted authentication reason；投递仍rpc-rejected，无新Webview能力／版本或重放。
- 只识别pi0.86.1零能力unknown sentinel，不拒绝名为unknown的真实模型。证据来自公开RPC，没有检查session文件。
- [ADR0002](../decisions/0002-interaction-contract-route.zh.md)记录狭窄委托修正：正面观察owned exit后，新受控、非resume且从未提交的会话可替换为空，因为identity／path不保证持久化；已提交／受信／已resume／不确定情况仍严格恢复，不在失败后fallback。拒绝提交之后测试有意使用有丢失披露的明确New，而非静默空恢复。
- 原测试逐卡Date.now采样却比较不同卡期限偶发差一毫秒，现逐卡核对自身原期限；无容差或过期规则放宽。

## 限制、保留资源与清理

完整thinking归WI-009；附件／审阅／会话接受和广泛gates仍Open。不提供文件／网络沙箱、任意扩展兼容、全后代进程保证、回滚、机器锁或host崩溃后草稿持久化。mutation／readback竞态为确定性公共seam注入，实际认证／exit操作已分别列明。

保留wi008-installed/、wi008-native/、wi008-readiness/、wi008-readiness-native/及失败／通过报告、helper、截图、干净profile／HOME、公开RPC观察和wi013-package/命名VSIX。这些是代理自有证据，不是用户配置；审计时无活进程依赖。唯一证据安全保全并重查依赖后才清理，不按名称删除。既有WI-021官方外部F5工具沿用其归档清理条件。无.local-env遍历、真实秘密、付费模型、相邻仓库修改、暂存／提交／推送／发布；HEAD仍59dbb09，既有ACTIVE压缩／归档保留。

## 已批准提案（关闭前历史）

| 字段 | 内容 |
|------|------|
| **ID** | WI-008 |
| **标题** | 模型选择完整异常矩阵与委托验收 |
| **阶段** | Verify：已有空闲／下一轮主路径不重复实现；核对本轮源码及完整故障／审批／Stop证据，发现缺陷才修复 |
| **PRD 判定** | 用户可见，REQ-002；关联REQ-004／005／006 |
| **授权** | 本次明确决策、实现及实测验收委托持续有效，不是整份Draft PRD接受 |
| **Gate ID** | gate-webview-trust、gate-project-trust、gate-session-streaming；保持Open至各自条件满足 |
| **Decision** | 使用现有公开pi模型API、host权威状态与v3桥；不新增模型栈或全局默认持久化 |

### 目标与范围

完成模型选择剩余接受条件：当前模型与请求模型投影准确，空闲切换及运行中下一轮应用；故障、审批等待、Stop、断连与恢复时不误示成功、不改变正在运行请求、不丢草稿。对照现有测试与本轮证据逐项核对，不重做已实现能力。WI-009 thinking独立随后验收，不把同一UI顺带操作视为其全部关闭。

### 方案与架构核对

保留host协调及公开RPC readback，优先补可重复的确定性失败／竞态断言，再在隔离localhost合成provider下实际操作原生F5与安装包。断言请求记录、状态投影、审批及Stop时序；实际截图检查窄栏、短视口、主题、双语、菜单与键盘焦点。区分模拟浏览器、实际runtime、F5及安装证据；既往结果仅用于确定缺口，不冒充本轮通过。模型不可用、延迟回复或切换失败不得造成虚假已应用状态。

### 验收

已批准主路径及剩余故障／审批／Stop矩阵均有可追溯证据；可见状态与公开readback／provider请求一致；错误可恢复且草稿与焦点可用。必要修复具备红→绿测试、compile／lint／相关测试和新宿主／包验证。按本次委托记录实际接受范围；文档双语、归档、docs:verify／docs:health与diff检查通过后再切换WI。

### 范围外与批准边界

不新增provider或模型agent loop，不调用付费模型，不访问真实凭证，不改变工具审批／信任边界，不增加全局启动默认持久化；不在此关闭WI-009／014／016／017或广泛gates。无Git提交、暂存、推送或发布。
