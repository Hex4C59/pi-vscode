# WI-017 — 已保存会话连续性验收

[English](2026-09-28-wi-017-session-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-28-wi-017-session-acceptance.md](2026-09-28-wi-017-session-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-28
- Type: Reference
- Status: Archived
- Created: 2026-09-28
- Authority: 限定委托验收；ACTIVE持有剩余边界工作

## 决定与批准范围

2026年9月28日Asia/Shanghai，代理按本次委托完成评估并接受WI-017 T017-01～03。本记录替代已完成当前提案和[9月23日检查点](2026-09-23-goal-session-handoff.zh.md)的待体验接受条件，不改写旧证据，也不冒称维护者亲自检查。WI-010广泛边界、gates和整份Draft PRD仍独立。

保留公开pi SessionManager短时helper、agent RPC、host原生确认／Stop／identity和opaque UI能力。列表16条／页、anchored历史32行、literal8192 UTF16 chunk继续作为简单有界展示，不改变模型context。New／Restore是主动顺序交接，不是排他锁。Cancel和commit前失败保留旧会话／草稿；确认切换停止旧任务，清除临时grant／review／附件状态并进入controlled。历史扩展不自动加载，恢复对话不恢复代码。

根代理复核backend／worker边界和SDK使用、历史投影／预览、host交接settlement／revision、profile reset、挂载UI与既有public seam测试；不是独立全仓审查。未替换SDK／私有存储，未新增架构层或持久化；广泛边界ADR由WI-010处置。

## 本轮证据

根目录dist/delegated-completion-20260928/wi017-installed/与wi017-native/，后者与前者的详细命令／失败／清理统一由installed/EVIDENCE.md索引。两者均公开pi0.86.1、无秘密独立HOME／profile／project和localhost合成响应。installed为官方Code1.139.1实际独立CLI安装；native为官方未修改Code1.105.1调试器真实F5／主侧栏fallback，不以CLI development host替代。

| 范围 | 本轮实际证据 |
|------|--------------|
| 公开持久化与列表 | seed-sessions.mjs通过公开API创建18条目录fixtures、长历史和真实执行的terminal CLI --print会话，CLI退出后才恢复，不冒称TUI。公开当前项目列表排除独立foreign project。session-report验证16条列表、键盘第二页／返回、原生警告、Cancel／主动Restore及准确CLI-origin历史，未重放请求。 |
| 有界不可变历史 | session-report读取最近32条、向前共三页至最旧问题，七个literal chunk复原51850 UTF16原文；不替换为今天不同的文件，script样文本保持字面。检查缺失扩展／工具generic历史、隐藏custom entry排除及合成敏感详情redaction。Close返预览触发焦点且草稿保留；New Cancel保留历史／draft，确认New清除当前投影但不删除已存会话。 |
| Stop、终结与重新授权 | lifecycle-report跟踪自有supervisor／直接RPC PID，包括以Node运行的Code.exe。活动流New Cancel保留child／draft；确认New观察流关闭及旧RPC退出后才接受新runtime。New／Restore均需fresh工具审批，恢复后待审批Stop保留新草稿／已有文件效果；真实child loss和单独receipt-based Recover不重放。 |
| 实际不可用／恢复 | missing-report列出公开SDK创建且未使用的fixture，临时让其确切opaque文件不可用，得到no-switch错误且旧runtime／draft保留；finally恢复原文件名／字节，再UI Refresh／主动Restore恢复原历史且无重放。仅隔离可用性故障注入，不实现session文件解析／写入产品能力。 |
| 默认profile和历史能力 | 两域run-trusted-green经原生选择／同意加载本地公开扩展fixture，用真实加载计数并保存主动turn；证明New默认重置、恢复曾经trusted会话不重载旧扩展，以及直接从trusted Restore到controlled。fresh工具审批／Stop可用，计数佐证真实profile投影。 |
| renderer重建 | 两域run-reload：Developer: Reload Webviews保留host历史第二页及已确认draft，无重放；在恢复会话主动流中重建，保留同一task／新草稿，Stop终结且无额外请求。不冒称另外实测native host onDidDispose／新view。 |
| 实际视觉／键盘 | 两域fixed-build visual：三个实际内置主题×zh-CN／en，目录键盘／Escape返焦点、literal Ctrl+End滚动／Close返焦点、draft／input可见且无文档横溢出。installed289×506、native299×320；重生成contact sheets并结合原图检查24张目录／历史截图。极短native需要局部滚动，静态图不能独自证明状态转换。 |

修复后两域core／lifecycle／missing／visual均在663 tree／新包重跑，见run-*-profile-reset.log；旧661保留于pre-profile-fix-evidence/，不改称663。当前确定性测试另覆盖helper预算／取消、stale identity／chunk、不可用／不支持投影及host view-loss竞争，不冒称逐项真实provider故障。

## 实际缺陷与修复

实际trusted→New重新加载旧扩展；trusted-new-profile-red/保留计数、截图和New之后仍含trusted -e路径的真实RPC命令。host changeConversation沿用了executionProfile。两个public host seam测试分别复现New／Restore，并确认Cancel／inspect失败保留原trusted runtime／draft。

现在只在成功handoff commit点清除trusted profile／显示名／error并设controlledExecution为true，再启动替代runtime。首次部分修复仍因投影未更新失败，失败亦保留；完整修复profile-reset-green为663／663、零跳过，compile-profile-reset／lint-profile-reset通过。未削弱已接受安全规则或gate标准。

新wi013-package/pi-vscode-wi017-profile-reset.vsix共14085 entries，解包公开RPC readiness／gate handshake与Webview资产验证通过；profile-reset-artifact-hashes核对六个current／installed资产一致。只改独立自有安装。测试与产品故障分开：首个PID观察器错误假定node.exe；即时键盘滚动断言早于浏览器settlement；Windows PowerShell5不能stat SDK返回的301字符路径。精确自有parent观察、有界滚动等待和已验证PS7 literal-path helper不绕过产品guard；后者finally恢复文件且不读取格式。

## 边界与收尾

无跨项目全局发现、同时驱动／排他保证、live takeover、branch UI、历史代码rollback、自动扩展安装／加载、重演历史UI或额外附件持久化。历史文本来自公开pi历史，不来自今天文件；现有受控工具／非sandbox限制保持。

每轮关闭自有Code／provider并End→matching terminal receipt→Recover→empty。final-process-audit.json无自有进程、无held故障文件。保留两证据根及其SDK／CLI fixtures、profiles、脚本／图片／失败和新包，直到唯一证据已保存／保留期结束且无进程依赖。共用官方portable Code路径D:/Users/hex4c59/Temp/pi-vscode-delegated-f5-1.105.1-20260928仍供后续native矩阵。不创建worktree，不触碰用户秘密／付费模型／相邻仓库／用户安装或会话。

收尾同步PRD／架构／契约／索引／ACTIVE，docs:verify／docs:health／diff记录在本证据根；更广泛跨WI过期追踪交WI-010核对。不称运行远程CI／其他OS／fork。HEAD59dbb09及既有修改均保留，未暂存／提交／推送／发布。
