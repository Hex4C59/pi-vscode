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


锁屏native audit2（下一自动Goal续跑，10月3日）：上一turn通过有界关闭／提交及提交候选检查推进，不是verified wait。重新读取Goal／ACTIVE／WI082与Git；本审计记录前仅三个原用户修改，index为空。当前native `cua.getState()`返回无app及明确Mac锁定错误；无自有native job存活，没有仅为重试锁屏而重启launcher。剩余七项均须实际native验收，没有独立批准实现或关闭可替代。同一当前外部条件连续两Goal turn出现，Goal保持active；最小解锁仍为用户手动解锁Mac。本审计turn无进展，非验收或运行进程等待。


锁屏native audit3（连续第三Goal turn，10月3日）：上一审计turn无进展，非verified wait。重读ACTIVE／WI082，index为空、原用户修改保护。native清单再次返回同一Mac锁定错误及无app；自有测试已终止，无存活job可poll。剩余七项均须native验收，无独立批准工作可替代。连续三轮确认锁屏条件，Goal标blocked非complete，最小外部变化为用户手动解锁Mac；不索取凭据、不绕过锁屏。完整目标、PI27关闭及剩余实现／证据保留；续跑后重新blocked审计。


## 恢复审计与进程清单纠正 — 2026年10月3日

Goal已恢复ACTIVE，现重新开始blocked审计。native清单返回apps且无锁屏错误，锁屏不再是当前阻碍。binary-only `ps -axo pid=,comm=`显示非fixture Code9702，实际路径`/Applications/Visual Studio Code.app/Contents/MacOS/Code`。早先仅匹配Electron的筛选漏掉实际Code程序，旧“无既有Code”不能作为不存在证据；旧锁屏工具观察与自有fixture退出仍有效，但不证明Code独占。以后清单匹配实际Code执行路径，不读进程参数／用户状态。

无自有native job存活；9702存在时macOS CUA不能选隔离窗口／PID，未选择／输入／退出它，也未重启隔离launcher。最小解锁为用户保存关闭非fixture Code，或工具提供安全macOS窗口／PID绑定。七项native验收仍未完成，PI27验收不变。本轮获得纠正后的权威证据，不是新native验收；Goal保持active并重新审计。


恢复后安全绑定audit2（10月3日）：上一turn通过纠正无效Electron-only清单及旧锁屏条件推进。重读ACTIVE／WI082／Goal与Git；精确binary-only Code筛选再次确认非fixture9702。无存活自有fixture，无其他独立批准实现剩余，七项native验收不能替代。未CUA选择、用户窗口输入／退出或重启launcher。本turn无进展，非verified wait；恢复后连续第二turn确认同一安全绑定外部条件。Goal仍active，待用户保存关闭Code或工具安全macOS窗口／PID绑定。


恢复后安全绑定audit3（10月3日）：上一turn无进展，非verified wait。重读ACTIVE／WI082／Goal与Git；精确执行路径清单仍确认非fixture Code9702，无自有native job。同一安全隔离绑定条件连续三恢复Goal turn存在，无独立批准实现可替代七项缺失native验收。Goal应标blocked而非complete；PI27关闭、全部实现提交／证据及用户修改保留。最小解锁仍为用户保存关闭非fixture Code或工具安全macOS窗口／PID绑定，不操作／退出用户实例或放宽OS安全；后续resume重新审计。


## 正常退出授权、PI02关闭及串行WI083交接 — 10月3日

人类授权所提日常Code正常退出策略：禁止强杀、无关自动保存／丢弃、越过未保存／任务确认。实际Cmd+Q退出9702无该类提示，三个原Git修改不变。安全隔离native绑定现可用；wrong-ref误launcher及实际审查超时失败保留。有界审查时间修复9d7a3f8干净compile／lint1271／文档／打包通过；真实独立F5／安装资源driver现均passed，英中键盘内容不变／实时刷新／中文关闭重开及实际安装目录／SHA已审阅。PI02按本Goal代理委托关闭归档16e786d，不是维护者亲自测试。**仅2/8关闭（PI02、PI27），六项未完**，26上传未批准。Goal工具保存的blocked不代表当前隔离仍不可用；如实记录授权与继续执行，不假称工具状态已变。

当前WIP转WI083手动压缩native验收。两资源job终止、自有Code进程无；不查询死app binding。本Goal正常退出授权继续保留，UI前存活／完整fixture窗口检查及有界审查时限保持。既有WI083 Build／公开RPC证据保留，先调查并记录native合成loopback fixture Prepare再编写harness；无付费调用／真实账户。

### WI083原生工具续跑——10月3日

四项test-first子进程契约覆盖隔离lane、安装cleanup、缺失review及nonzero退出诚实。本地提交`964c410`／`ed7744b`／`c1b4cd5`提供有界合成压缩observer并修复真实宿主modal被抑制问题。ed7744b干净检查／打包通过，实际F5因Code test模式拒绝modal而失败，保留非验收。普通UI退出仅关闭自有子／父窗口，未强杀或无关保存／丢弃。c1b4cd5去除test mode、保留真实native API，正重跑干净候选后重试。维持WIP1 WI083、2/8已验收，不新增批准请求、不标Goal完成或推断外部阻碍。真实native矩阵及另五个未完切片仍必须完成。


## PI04关闭及串行WI084交接——2026年10月3日

PI04／WI083经干净c1b4cd5检查、独立实际macOS F5／安装十项英中UI审阅，按本Goal代理委托通过并归档78a9d2e。仅合成loopback、真实模型0，正常退出自有窗口、provider实际关闭；准确源码／VSIX身份及早期失败保留。**PI02／04／27共3/8关闭，五项未完成**，上传／敏感收集未批准。当前WIP1 WI084文件补全，基于既有fa1d18d恢复native Prepare；旧安全绑定阻碍解除，真实QuickPick／附件／继承变化确认尚未验收。不宣称Goal完成，不需再次批准。


WI084 native续跑：harness27623b4干净1279／打包通过；实际F5成功capture却renderer旧token未移除，失败保留（正常Cmd+Q主进程SIGSEGV、exthost0、provider关闭0请求）。mounted回归RED→修复158c95e GREEN1281／compile／lint／docs，新干净候选重跑后独立F5／安装重试。当前仍仅WI084、3/8关闭，无新外部阻碍／批准请求。


WI084以b7f02ae本次代理关闭：干净9ec5339及独立实际F5／安装十案与各18native geometry图；旧失败保留，未改全1282重跑通过。正常UI退出／wrapper0，provider关闭一次合成请求／零真实调用。4/8关闭（PI02／04／06／27），唯一WI085模型轮换native Prepare；四项未完、PI26上传未批准，无自有native遗留job。


WI085以816654c代理关闭：干净e77135c检查1287／公开RPC／打包及独立实际F5／安装十案英中原生，applied与pending区分直到实际结算。两主／wrapper0／provider关闭一次合成零真实，无遗留job。5/8关闭PI02／04／06／14／27，唯一WI086会话metadata搜索native Prepare，三项未完，PI26上传未批准。


WI086关闭f0d13c7：干净d654011检查1292／实际公开SDK／打包及独立实际F5／安装十案与各18native视觉。首轮未改frozen-history失败保留，聚焦完整重跑通过根因未证。main／wrapper0／provider关闭零推理，自有job已消失。6/8关闭PI02／04／06／14／24／27；仅WI087／Mermaid原生Prepare，两项未完，PI26上传未批。
