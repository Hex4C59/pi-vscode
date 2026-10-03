# 八项有界交付目标

[English](2026-10-03-eight-gap-goal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-03-eight-gap-goal.md](2026-10-03-eight-gap-goal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-03
- Type: Reference
- Status: Active
- Created: 2026-10-03
- Authority: 本聊天 2026-10-03 `/goal` 的有界授权和恢复入口；不替代单项 Prepare 或证据

## 授权和恢复

维护者明确批准 PI-GAP-02、04、06、14、21、24、26（仅可审查、可取消的本地诊断导出）、27 在 ACTIVE 边界内串行实施、实际验证、代理验收及本地提交。一个 Agent、一个当前 WI，WIP=1；先完成每项 Prepare，再 Build。常规可逆细节已委托；重大产品、安全、信任、持久化取舍仍须另批。不 push、发布、合并、改写提交、升级上游、扩展平台、使用真实凭据或新增付费调用。诊断上传、完整会话／源码／凭据收集不在目标内。

恢复时读取 goal 状态、[ACTIVE](../../ACTIVE.md)、当前 WI、协作指南及工作区。八项都实际实现、验证、提交并满足关闭条件才能 complete；任何阻塞／缺证据仍未完成。代理验收必须标注“本次授权下的代理验收”，不是维护者亲自测试。模拟、真实 runtime、F5、安装 VSIX 分别取证。常规失败继续诊断，确实阻塞时保留未完成并按协作指南切换独立项。

## 初始状态和顺序

起点 `bc1a2d7`，分支 `master`。已声明／安装 pi 均为 `0.86.1`。暂存区为空。ACTIVE 与功能差距讨论英中两份既有未提交修改视作用户所有，不能顺带提交。原始补丁和状态保存在 Git 忽略的 `dist/goal-eight/startup/`；这是本地恢复工件，不是产品证据。

先做 [WI-082 / PI-GAP-02](2026-10-03-wi-082-resource-report.zh.md)，后续按依赖考虑 04、06、14、24、21、26、27；未调查项的可行性和验收均未证明。当前状态和未完成边界只在 ACTIVE 维护，已关闭记录经归档索引检索。


## 八切片实现检查点——验收未完成（2026-10-02 UTC）

八项批准实现均有本地提交，均未本轮代理验收／关闭：PI02 d03d7c4+0633e9f；PI04 77ca3c2；PI06 fa1d18d；PI14 66ba52b；PI24 4bb653c；PI21 4eb8d38；PI26本地5f2135f；PI27 d3ff0ea。最终干净d3ff0ea检查及真实RPC／SDK见WI089，两次history断言失败分留。浏览器仍模拟宿主，非native。26上传／敏感收集未批准且待完成；用户分组／gap改动未暂存。

实现后阻碍audit1：Goal turn01a0fdf1-76fa-7a42-b37c-2ec4e5947748。原用户Code存在，无安全隔离CUA PID／window绑定，无其他独立批准实现剩余。最小解锁为用户保存关闭原Code或工具安全绑定。Goal保持active，非complete；仅不同后续Goal turn增加audit，不计压缩或重复工具。连续三turn且无法有意义推进时按规则blocked；用户resume重启audit。当前WI089及前七native阻碍仍在ACTIVE。


实现后阻碍audit2（不同自动Goal续跑 01a0fedc-fc35-7863-aed2-2c9a3431e3b2）：上一turn完成实现／候选推进。本turn重新读Goal／ACTIVE／WI089、核对Git归属与仅binary进程清单。原Code仍存在，macOS安全绑定缺口未变，无新native证据或其他独立批准实现。这是同一外部条件下无进展，非等待自有运行job。三turn blocked阈值前保持Goal active，不宣称验收／关闭。


实现后阻碍audit3（不同自动Goal续跑 01a0fede-cadb-7393-85fa-412170a1875a）：上一turn无进展，非verified wait。重新读取Goal／ACTIVE／WI089及当前Git，binary-only清单仍有原用户Code。同一安全隔离native绑定缺口未变，无自有验证job运行，无独立批准实现剩余。连续三Goal turn确认此外部条件，已满足blocked阈值；应将Goal标blocked，不是complete。八项native验收／关闭仍未完成，26上传未批准，已有实现提交／工件／用户改动均保留。须用户保存关闭原Code或工具安全PID／window绑定后resume；blocked后resume须重新audit。

## 续跑原生调查 — 2026年10月3日

续跑时原日常Code进程已退出，旧“关闭原Code”解锁条件已不足。新隔离原binary F5 launcher成功启动，但CUA路径及bundle绑定均超时；维护者报告反复钥匙串提示。已停止本任务launcher（SIGTERM未退出，随后SIGKILL并观察close），未修改用户应用／状态／钥匙串。隔离日志显示内置GitHub认证读钥匙串，不证明准确弹窗／根因。WI089维护有界测试launcher凭据隔离修复。不得再次启动旧访问凭据的harness，也不得把参数接线测试当native验收。八项native关闭仍待完成；续跑审计依据新证据，不再沿用原进程假设。

有界launcher修复585bd06干净候选compile／lint／1269／文档通过。内存存储有界重试已成功绑定隔离Code窗口并实际按F5启动。英文版本报告及键盘只读拒绝属于native工件，不是WI完整验收。另发现F5分离参数误成multi-root而未允许资源；先写组合失败再使用atomic option。旧安全绑定阻碍已非现状，launcher检查后继续实际native。未重置系统钥匙串、不索取密码、不宣称系统钥匙串已修复。

atomic launcher f2b4462干净compile／lint／1269／文档／打包通过，实际F5现为单合成项目并经fixture显式许可获得真实runtime目录。native报告driver失败于旧edit boolean假设；源码核对为API即使readonly editor拒绝仍返回true。1011afa仅记录boolean，保留内容不变／reopen及实际键盘审查；预写组合允许内容保持，同时仍拒绝故意变更。开发compile／lint／1271／文档通过，干净候选重验进行中。旧失败未重标通过，WI089英文仅部分native，安装／中文／八项完整验收仍待完成。

## 首个有界关闭与串行交接 — 2026年10月3日

**仅PI-GAP-27／WI089依本次Goal明确委托代理验收**，不是维护者亲自测试。实际干净1011afa F5及本地安装VSIX英中版本、精确安装插件说明缺失、字面Plain Text、键盘只读及中文关闭重开已审查，按精确SHA／源码／路径／检查限制归档。源码0.0.1与安装0.86.1来自既有打包策略，不是最新版承诺。四组native截图／AX及安装来源与resource driver结果分开；F5 review marker及安装consent／catalogue超时仍失败，不关闭PI02。unknown／error／生命周期故障仍仅编码前组合证据，不编造native注入。关闭记录由archive index／PRD索引；当前WIP返回WI082资源原生专注验证，其余六个未完本地切片排队；PI26上传仍未批准。Goal仍active，**仅1/8有界关闭，未complete**。

本任务native job已终止，退出后观察到非fixture Code9702／title `pi-vscode`，来源未确证；任何输入前停手，不退出／使用该窗口。以后CUA前复核本任务进程仍活着，避免死测试被解析／启动为默认app。隔离fixture被选中时安全绑定现已可用；未重置系统钥匙串／改配置，不宣称所有提示消失。本Goal turn有验证、修复提交及有界关闭推进，不因剩余native需安全窗口就标blocked；下一turn先重核外部状态。


## 关闭提交与锁屏原生重试 — 2026年10月3日

PI27验收／归档提交f67bcec，串行ACTIVE交接2d4b871，三个原用户修改文件仍未暂存。干净2d4b871 docs:verify／docs:health通过、status为空、相对1011afa可执行源码diff为空（`dist/goal-eight/native-isolation/closure-candidate/`）；完整1271仍为可执行树相同1011afa的证据，不冒充文档HEAD重新完整运行。翻译source metadata在bbb6f70修正：首次正规化1011afa被source-drift正确拒绝，最终指向实际英文关闭提交。

binary-only清单现无Code实例；未改已提交launcher启动自有隔离F5父进程14301，fixture `/private/tmp/pi-resource-native-HXvFad`。CUA准确返回“The Mac is locked and automatic unlock could not unlock it.”，没有按F5、允许资源、审查报告或新增native验收。仅向自有launcher请求SIGTERM并确认session终止／process-exit code0；因无driver结果，harness自身exit1。`dist/goal-eight/wi082/native-locked-2d4b871/`保留fixture／log／exit。须用户手动解锁Mac；不索取密码、不改OS设置、不绕过锁屏。这是新的当前外部条件，不是旧非fixture进程阻碍；本轮有关闭提交及候选证据，未满足连续三轮无进展阈值。Goal仍active，七项native未完成。
