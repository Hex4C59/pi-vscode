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
