# WI-016 — 受控写入与捕获审阅验收

[English](2026-09-28-wi-016-review-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-28-wi-016-review-acceptance.md](2026-09-28-wi-016-review-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-28
- Type: Reference
- Status: Archived
- Created: 2026-09-28
- Authority: 限定委托验收；ACTIVE持有剩余工作

## 决定与批准范围

2026年9月28日Asia/Shanghai，代理按本次委托完成评估并接受WI-016 T016-01／02。本记录归档其已完成提案与验证，不冒称维护者亲自检查。不因此接受WI-017会话验收、WI-010广泛边界处置、广泛gates或整份Draft PRD。

保留公开pi执行前hook、host dirty检查、有界内存before/after快照与原生readonly diff。批准范围要求内置write/edit在审批前及实际执行前均拒绝dirty目标，包括grant复用；不自动Save。用户明确处理后可新任务重试。当前source改变／消失不能替换历史捕获对，source导航不是代码恢复。工具报告与workspace观察须明确区分；分页、键盘、草稿／Stop、重建及丢失恢复可操作。

根代理复核editor-tools、write保护、审批编排、快照／容量、readonly内容提供者、共享React和已注册seam测试，未发现还需新增host／adapter能力；不是独立全仓审查。架构所有权与依赖方向不变，局部CSS修复不需新ADR。

## 本轮实际证据

根目录dist/delegated-completion-20260928/wi016-native/与wi016-installed/；后者EVIDENCE.md记录脚本、失败与清理条件。两者用公开pi0.86.1和localhost合成provider，独立无秘密HOME／profile／workspace。native为官方未修改Code1.105.1调试器实际F5、主侧栏fallback；installed为官方Code1.139.1独立CLI安装VSIX，互不替代。

| 验收 | 本轮证据 |
|------|----------|
| dirty与主动恢复 | history-report／visual-report：实际原生编辑器未保存文本与磁盘均保留，无审批且真实工具拒绝；明确原生Save后新任务Allow once成功。guard-report：审批期间再编辑由最终检查拒绝，精确session grant不能绕过dirty，clean重试成功；内置edit另有成功和dirty拒绝。 |
| 准确readonly捕获 | History流程实际打开原生diff，before为保存文本，after为工具写入。可见modified diff键入被拒绝，显示文本／disk不变。外部再写不替换旧对，current source读最新文本；只删除确切自有目标后旧对仍可读，source报告不可用且不重建文件。 |
| 失败与归因 | fault-report：真实公开edit不匹配为Failed＋Unchanged，native diff和disk一致。慢任务中外部写为Observed workspace change／No before snapshot，无捕获diff按钮和伪工具归因。Stop保留外部内容及新草稿。 |
| 分页、grant与生命周期 | lifecycle-report：18次实际write、第一页稳定、键盘Next／First；实际Developer: Reload Webviews保留review ID／draft且无重放。撤销grant后重新审批，Stop取消未批准写。实际自有child End清除review、失效已打开native快照，草稿保留；单独Recover无重放／伪旧快照。 |
| 窄栏短窗键盘／视觉 | 两域修复后visual-report：三个实际内置主题×zh-CN／en；Enter展开、返焦点、Tab／Enter原生diff、Focus Chat、草稿／输入和无文档横溢出。installed289×506，native299×320，native丢失探针299×304。经review-six-current-crops.png及单张原图检查十二图，并检查两域short-loss图；短窗需要局部滚动，不宣称内容同时全部可见。 |
| 当前检查／产物 | compile-layout／lint-layout通过，tests-layout为661／661、零跳过。新wi013-package/pi-vscode-wi016-review-layout.vsix共14085 entries，解包公开RPC readiness／gate handshake和Webview资产校验通过；layout-artifact-hashes／layout-build-hashes核对六个当前可执行／资产一致。 |

两域修复后run-guard-layout、run-lifecycle-layout、run-fault-layout、run-visual-layout通过，后者也重复完整history／readonly／source改变和删除。当前确定性套件覆盖容量、不安全capture、重叠、迟到结果、host view销毁／新identity、watcher／provider释放。实际Reload Webviews证明renderer重建，不冒充额外实测host onDidDispose／新view。确定性竞争／容量测试不冒充真实provider故障；会话切换另由WI-017验收。

## 缺陷诊断与最小修复

首轮短窗丢失探针只有视口几何，虽通过但截图暴露祖先裁切：native高304px时操作区仅17.125px，只露提示一行碎片。保留loss-clipping-red/回归，交集全部滚动／裁切祖先并要求至少两行完整文字，修复前失败。candidate.css让无审批但有review时同样使用现有紧凑context／textarea预算，不删除错误说明或host状态。native绿为50.578px、完整三行，draft仍可见；新包installed同断言通过。可执行探针／宿主harness保留于证据根，不称为jsdom布局覆盖。

其他自动化失败亦保留：Workspace Trust modal拦截、Monaco NBSP、短窗审批按设计折叠review、diff容器先于文本出现。修复harness使用实际关闭／展开、字面规范化和有界预期文本等待，无强制隐藏点击或放宽接受标准；旧报告和失败图独立保留。

## 边界、清理与收尾

只覆盖可识别受控内置write/edit，不保证shell／custom tool／全部并发写；最终dirty检查与写入不是原子锁。capture仍有界：每文本image256KiB、总8MiB、128条metadata；不可用／重叠／观察限制明确。无逐hunk决策、自动Save、rollback、Git reset/stash、完整任务归因或跨runtime快照持久化。

每轮关闭自有Code／provider，再owner End→matching terminal receipt→Recover→empty。final-process-audit.json两域自有进程为空。保留这两个根及新包的唯一脚本／报告／截图／失败、独立profiles／合成fixtures，至证据已另存／保留期结束且无进程依赖。共用官方portable Code路径D:/Users/hex4c59/Temp/pi-vscode-delegated-f5-1.105.1-20260928仍供后续native矩阵，不在本WI清理。未创建worktree，不触及用户安装／会话／凭证、付费模型或相邻仓库。

限定语义复核更新PRD追踪、archive索引与ACTIVE；docs:verify／docs:health／diff结果在本WI证据根。更广泛跨WI过期追踪保留给已授权WI-010统一核对，不静默接受。HEAD仍59dbb09，index为空，保留既有修改，未提交／推送／发布。
