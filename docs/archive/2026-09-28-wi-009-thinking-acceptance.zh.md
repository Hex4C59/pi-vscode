# WI-009——thinking选择验收

[English](2026-09-28-wi-009-thinking-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-28-wi-009-thinking-acceptance.md](2026-09-28-wi-009-thinking-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-28
- Type: Reference
- Status: Archived
- Created: 2026-09-28
- Authority: 历史限定委托验收；ACTIVE拥有剩余工作

## 决策与验收

2026年9月28日Asia/Shanghai，代理按本次委托完成评估并关闭WI-009，不代表维护者亲自检查。接受REQ-002／004已批准thinking切片，不接受整份Draft PRD或广泛gates；WI-014／016／017及WI-010边界／gate处置仍独立待办。

保留公开pi能力查询与mutation/readback、host权威的应用值／下一轮意图、模型优先能力刷新及已接受正式slider。pointer移动连续预览，release提交支持的离散级别，键盘按离散级别变化。不新增provider逻辑、全局默认持久化、session文件访问或认证界面。

根代理复核ModelSettings、runtime投影、共享控件焦点／预览所有权与注册回归对照批准验收，未发现剩余范围内实现缺陷。这不是独立全仓复审。失败mutation/readback、过期generation/session、view重建、队列清除与晚完成由确定性测试覆盖，不宣称注入竞态是独立真实provider故障。

## 证据与版本边界

以下路径均在dist/delegated-completion-20260928/；命令、失败与来源详见wi009-installed/EVIDENCE.md及wi009-native对应文件。

| 范围 | 实测证据与限制 |
|---|---|
| 当前检查 | compile-visual.log、lint-visual-final.log、tests-visual-final.log：compile／lint及660/660测试通过，零skip；焦点与重复错误回归均保留red/green。 |
| thinking主路径，659树 | 安装matrix-report.json/run-matrix.log与原生report.json/run.log：连续两次键盘无需重新聚焦、保草稿、Escape返回trigger、pointer预览不提前改变应用值而release才提交；实际请求确认medium/high。流式off→high→medium latest-wins pending，当前请求仍high，Stop保草稿后明确下一请求medium。模型改plain后off-only，明确拒绝pending high、range禁用，下一实际请求没有reasoning_effort。 |
| 审批与实际退出，659树 | 两根fault-report.json/run-faults.log：Deny后的工具继续请求保持medium、不提前应用high；审批Stop取消未批准写入，medium只用于下一请求。实际owned child End清除pending high、保草稿、独立恢复、不重放。provider参数及result.txt不存在支撑断言。 |
| 稳定界面，660树 | 两根visual-report.json/run-visual.log：真实短窗、三宿主主题×双语、不支持模型／错误、禁用range、菜单几何、保草稿及Escape。安装6图逐张查看。官方原生F5的primary-sidebar fallback更短，实际滚动完整错误并断言几何，6张-error-scroll图在pi联系图中查看。中文展示仍保留host英文诊断原文，不宣称完整错误本地化。 |
| 包 | wi013-package/pi-vscode-wi009-visual.vsix；package-visual.log确认14085条目与提取RPC就绪／私有gate握手；660-artifact-hashes.json确认六项安装产物匹配。 |
| 生命周期 | 两根各轮明确End保留的owned child、观察matching terminal receipt后recover；最新final-process-audit.json为空。宿主／provider退出不代替真实child所有权清理。 |

真实原生F5使用官方未修改Code1.105.1、实际Debug Start/F5，不是CLI development host。安装版Code1.139.1使用独立profile与真实VSIX。全部请求使用隔离无秘密配置、localhost合成provider及pi0.86.1。测试、runtime请求、F5、安装及截图是不同证据层。659主路径／故障矩阵不冒称完整660重跑：之后唯一生产修改是菜单打开时去除重复错误，具备当前回归及新的F5／安装视觉证据。

## 缺陷、失败与权衡

- 实际第一次thinking键盘应用禁用range后Chromium把焦点移到BODY；仅恢复拥有本次应用的控件，尊重更新的draft焦点，Escape转回trigger，流式选择不持有延迟焦点。
- 安装Webview289×506中内外重复错误将中文popover顶推至-5.4375px；打开仅显示菜单内错误、关闭恢复外部错误。不做广泛布局重构且保留错误；当前几何在视口内。
- 保留初始关闭标签读取、原焦点失败、视觉裁切及原生resize／profile-theme失败。观察改为可见应用trigger、精确development窗口身份、真实native picker选择内置主题；失败不计产品通过。首张原生联系图误裁了内置Chat，明确不作pi证据；已更正pi图保留真实fallback。
- 原mounted-model测试要求打开菜单时外部重复错误仍可见；替换为断言打开popover中的同一错误，不是删除错误断言制造通过。

## 已替代提案与交接

原ACTIVE提案包括空闲thinking切换、latest-wins下一轮意图、模型能力刷新／不支持失败、审批／Stop、runtime-loss清除、连续预览／离散release、键盘焦点、窄栏短窗主题双语。要求localhost实际请求参数、公开RPC投影、独立F5与安装、红绿修复及文档检查；本切片已满足。659中间交接缺少的审批／退出与稳定布局证据由上述记录替代。

不包括重实现provider／agent loop、秘密、付费模型、全局默认持久化、无关范围或广泛gate关闭。附件／审阅／会话及跨边界剩余工作保留于[ACTIVE](../../ACTIVE.md)。

## 保留与收尾检查

保留wi009-installed/、wi009-native/及所列WI009包作为代理自有唯一通过／失败证据、无秘密profiles与复现helper。当前无进程依赖；清理前保全唯一证据并确认无依赖，不按名称删除。共享官方F5宿主路径及清理条件沿用WI-021验收记录。没有暂存、Git提交、推送、合并或发布。收尾运行docs:verify、docs:health及diff-check，记录在WI009证据中，不另建任务账本。
