# WI-083：手动上下文压缩

[English](2026-10-03-wi-083-manual-compaction.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-03-wi-083-manual-compaction.md](2026-10-03-wi-083-manual-compaction.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-03
- Type: Reference
- Status: Active
- Created: 2026-10-03
- Authority: PI-GAP-04 有界 Prepare／Build 记录

## Prepare、批准及现状

本次八项 `/goal` 批准 PI-GAP-04 在 ACTIVE 边界内实施、实际验证、代理验收及本地独立提交。PRD 判定：用户可见，REQ-004/005/009；Gate ID：none；Decision：none。Prepare 完成，Build 已授权。WI-082 未完成原生验收且已记录阻碍；串行选择本独立项，不删除其未完成范围。

pi 声明／安装均为 0.86.1。公开 `docs/rpc.md` 的 compact 支持可选 customInstructions；response 是操作完成，不是发送确认。公开 abort 调用 AgentSession.abort，会取消 compaction 并等待 idle。源码 compact 会先 abort，所以宿主和 adapter 必须仅在已有任务完全空闲时准入；不能用 compact 顺带停止用户任务。现有 adapter 以 occupancy 管理 prompt／命令／agent／Stop，宿主以 chatBusy、generation/runtimeSession 和模型／会话／profile 规则协调。既有 compaction_end 不能等同 agent_settled；扩展可能在压缩完成后启动其他 activity，不能伪造空闲。

## 已批准方案和所有者

原生命令 `pi: Compact Context`，先原生有损／可能使用当前模型产生正常费用的确认，可选原生自定义指令（UTF-8 4 KiB，上限在宿主和 adapter 双重检查），取消不调用 runtime。实际运行在现有任务状态显示 compacting，原生通知进度可取消；Cancel 和原有 Stop 都复用 clear_queue→abort 及已观察结算。成功、失败／不可用、已取消分别通知；不展示／保存压缩摘要全文。不修改自动压缩、重试配置或算法；普通发送、模型／会话／profile 变更继承现有忙碌规则。

Adapter 复用公开 compact，独立命令占用到实际 response；manual compaction_end 的 aborted 只用于取消证据，不能当整个 agent 结算。180 秒 deadline 后若完成不确定，走已有 fail-closed owned-runtime 关闭／恢复，不重试。真实结果／占用按 session／连接关联；后续扩展活动保持忙碌直到真实 agent_settled。Host 拥有 native 确认、进度生命周期、状态和 Stop 协调；Webview 不新增任意 RPC 能力或敏感指令内容。没有新依赖、持久化、信任或加载策略，不需要 ADR。

预计路径：runtimeLifecycle DTO、adapter occupancy／frame／runtime、宿主 native-compaction owner／provider／命令注册、编码前组合验证、隔离真实 runtime 脚本、双语需求和说明。架构 1–5/7–15 延续所有者、身份、占用、界限和恢复；16–19 取证未完成，不宣称已满足。

## 编码前失败方式

忙碌调用上游 compact 导致用户任务被 abort；确认后身份／模型改变仍执行；取消确认调用模型；重复压缩；指令过大／未保留原文；压缩 response 前被 agent_settled 释放；Stop 先清队列但未确认压缩退出；把请求取消当实际取消；成功与取消竞争误报；超时／丢连接仍释放或重试；扩展后续活动误报 idle；压缩改草稿／附件或丢待应用模型；自动压缩／重试回归；进度 listener 未释放；错误／摘要泄露凭据或源码全文；取消后旧进度覆盖新会话。

## 可观察验收和工件

先准备现有宿主→adapter→RPC 入口的组合验证再编码（不是代码后补单元测试）。区别确认取消、自定义指令、忙碌拒绝、运行／完成、实际 aborted、失败、Stop 顺序、失效身份、延迟／扩展后续 activity 和草稿保留，保留 TAP／JSON。真实 pi 使用隔离 HOME、agent、项目和本机 loopback 合成 provider，验证公开默认压缩及取消／失败，不使用真实账户或付费模型；保留 request/event 与进程退出。native F5／安装 VSIX 的入口／有损提示／运行／Cancel／Stop／完成和可读性分别取证，不能把替代 seam 当原生观察。compile／lint／npm test／docs:verify，关闭 docs:health；干净提交候选再检查。

工件根 `dist/goal-eight/wi083/`；尚无实现或本项通过证据。当前原生工具绑定隔离 Code 的限制可能影响本项验收，不能降低标准。下一步：编码前组合验证→实现→开发和真实 runtime 检查→独立本地提交→原生验收或如实保留阻碍。


## 开发实现与证据（2026-10-03）

编码前宿主／adapter 组合场景因缺少入口失败，实现后 5 项通过。原生命令确认有损／费用、有界保留可选指令、复查身份及空闲准入，通过可取消进度运行，不提交或丢弃草稿。Adapter 命令占用保持到实际 compact 响应；manual aborted 元数据区分取消，clear_queue 先于 abort，后续 agent 活动保持忙碌直到观察到结束。自动压缩／重试算法和设置未改。处理完成／结束投递竞态，不凭空标空闲；无法确认完成时关闭受拥有 runtime 并提示显式恢复。

开发 compile、lint、1229 项行为检查及 docs:verify 通过（保留既有 ADR 0010 两项提示），最终所有权修订后的重跑亦通过。隔离 HOME／agent／项目和合成本地 loopback 响应下的真实 pi 0.86.1 验证默认压缩完成、manual compaction_end.aborted 取消、会话过小失败；每个进程均观察到关闭，零真实模型调用。工件：dist/goal-eight/wi083/{red.log,green.log,compile.log,lint.log,tests.log,docs.log,runtime.log,runtime-compaction.json}。这是脏源码开发证据，不是提交候选或原生验收。

首轮 runtime probe 误以为每个摘要请求都有自定义指令。公开上游源码与请求显示 split-turn prefix 摘要不接收它们；双轮 fixture 证明普通历史摘要收到原样指令。保留公开上游行为，不替换压缩算法。取消依据 aborted 事件，不仅取消请求。F5／安装 VSIX UI、视觉／键盘／进度验收及干净提交候选检查仍待完成；WI-082 的隔离原生窗口绑定条件仍适用。本 WI 尚未验收、关闭或归档。


## 提交候选与保留阻碍

Prepare／记录提交 `2b46d72`；实现 `77ca3c22015cc731de69aca19a5cf69b6233bb2d`。Task-candidate 基线 `bc1a2d7b9c5174434036445db6c5f85624072a72`，PR head 不适用；独立干净本地 checkout 执行 compile、lint、1229 项测试、docs:verify、真实 pi 压缩 probe、既有队列 RPC 回归和打包，全部通过；wrapper 返回 0，检查前后源码状态为空。证据复制至 dist/goal-eight/wi083/candidate-evidence/，身份见 candidate-identity.json。复用 WI-082 的自有干净 checkout；此前证据保留原身份，但路径现在指向较新候选。挂载历史工件仅用于链接验证。

Native F5／安装 VSIX 交互、Cancel／Stop／键盘和视觉验收仍缺，受 WI-082 记录的隔离 Code CUA 绑定阻碍影响。不宣称代理验收或关闭。最小解锁：安全操作真实隔离 Code 窗口，在无真实账户或付费调用下执行记录中的原生验收。ACTIVE 保留未完成项；串行推进独立 PI-GAP-06／WI-084，须先完整 Prepare 再 Build。


## PI02关闭后的native Prepare恢复 — 10月3日

资源报告native F5／安装隔离已验证，旧绑定阻碍段落属历史。人类正常退出许可仅正常退出日常Code，不无关保存／丢弃／强杀或越过确认。当前WI083 native焦点保留既有范围、公开compact／abort所有权及真实RPC证据。native fixture方案仍调查，非已验证事实：复用合成loopback／provider／session API，内存隔离Code及审查命令／进度流程。harness代码前须确认模型配置／空闲合成历史及有界Cancel／Stop／完成观察，记录失败、先测试组合与工件计划；不推导真实模型／凭据或产品变更授权。

### 原生fixture Prepare——公开配置与失败方式

安装的pi 0.86.1 SettingsManager读取`defaultProvider`／`defaultModel`；既有真实RPC fixture已证实`models.json`的`queue-loopback`／`queue-fixture`、合成inline key及loopback OpenAI-completions端点。仅在全新隔离agent目录使用公开配置；两个合成历史轮次从真实composer输入，不操作会话文件。复用有界loopback fixture，摘要请求等待明确的本地release标记；记录合成请求及provider实际关闭。这是验证工具，不改变产品压缩算法。

工具代码前列失败方式：继承真实HOME／auth／环境、访问系统秘密存储、意外多工作区、安装验收误用开发产品、假executable冒充原生、缺失／提前review标记、请求超出既有1 MiB、未释放请求、子进程／driver失败或超时却报通过、未观察modal／progress结果、英中控件不可见、新源码与旧包身份混淆。先写F5／安装launcher子进程契约，验证内存秘密、禁用账户扩展、合成模型／默认设置及无完整review时明确失败。真实观察保留截图／AX、自有进程身份、普通UI操作、请求和逐案例review；composition仅证明隔离及失败诚实。确认关闭／输入取消不得发请求；历史过少显示失败；成功保留literal指令；hold压缩展示progress、Cancel／Stop及busy协调。还须review草稿保留与双语。不扩大真实账户、付费调用、资源授权或读取raw session。

原生driver只能focus真实chat并等待本地review记录，不替换window API、发送消息、批准资源或推断视觉验收。review-complete结果本身不是代理验收；关闭前仍须候选检查／包及真实native工件。干净`2d4d591`真实RPC重跑三案例与子进程关闭通过（`dist/goal-eight/wi083/native-prepare-candidate/`），仍仅RPC证据。

### 原生工具开发（非原生验收）

先写launcher子进程契约，因新harness缺失而失败；假executable两lane随后通过。再先写安装失败契约，复现provider实际关闭记录缺失，扩大自有资源cleanup边界后全部三个契约通过。driver不替换production API，只focus chat并要求十项明确review及工件引用；完成标为`review-complete`，不推断视觉验收。wrapper额外要求实际合成历史／摘要请求及literal自定义指令。loopback请求全部等待本地release标记，安装失败也记录自有provider关闭。仅隔离测试settings为受控验证禁用自动压缩，产品默认／自动压缩／重试不变。工件`dist/goal-eight/wi083/native-harness/{red.log,install-cleanup-red.log,green.log}`仅合成工具证据，不是F5／安装验收。

审查细化：先写nonzero-exit子进程契约，用合成请求及review记录暴露wrapper可忽略退出码7。现在同时要求实际native进程退出码0及review／请求证据，四项focused契约通过。F5父窗口在已review子窗口完成后也须正常退出，发signal不算成功。初版工具源码开发compile／lint／1274测试／文档通过，早于本退出码细化；最终候选仍须重跑。

### 真实F5尝试：测试模式拒绝原生modal（保留失败）

干净候选`ed7744b862b29d51cbe484e121b737396f26e4a7` compile／lint／1275测试／docs:verify／docs:health／打包通过，前后clean；VSIX SHA-256 `c6878bc9bcd1f491e9b0867fe343c30752d7d9784b7f95cd464eacff5a84c91a`。较早`964c410`检查至docs:health通过，但误用不存在的`package:validation`失败；ed7744b已正确重跑打包。工件`dist/goal-eight/wi083/native-candidate-ed7744b/`。

真实F5启动隔离fixture Lko3HZ，在Code1.140.0激活production扩展／pi0.86.1，查看合成项目root后仅选择该资源，模型为合成项，草稿保留。实际palette执行未展示modal，自有extension-host日志明确`DialogService: refused to show dialog in tests`并含有损提示。这证明`extensionTestsPath`开启的宿主测试模式不适合本次原生modal验收，不是产品确认通过。启动／关闭工件保留`dist/goal-eight/wi083/native-f5-ed7744b/`；从UI先正常退出子窗口再父窗口，wrapper退出1、provider实际关闭、请求0。未伪造review标记或验收。下一步先写契约拒绝test-mode参数，改为普通development扩展激活observer，保留真实window API及正常退出证据，提交／干净候选重跑后native重试。范围／公开API／数据权限不变。

modal-mode回归契约在修复前因test-path参数失败，去除该参数并让verifier普通activation调用observer后四项focused通过。不替换dialog service或product API；observer写review结果后窗口继续开放，由普通UI正常关闭。合成工件`native-harness/modal-mode-{red,green}.log`；真实native重试仍待完成。
