# WI-022 — Windows 后台控制台诊断

[English](2026-09-28-wi-022-background-consoles.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-28-wi-022-background-consoles.md](2026-09-28-wi-022-background-consoles.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-28
- Type: Discussion
- Status: Superseded
- Created: 2026-09-28
- Authority: 诊断／证据，不是完整验收；[ACTIVE](../../ACTIVE.md)持有WI-022

> 历史归档：此前诊断与自定义源码修复提案已被“不依赖profile的CLI --no-daemon入口”取代。不是上游Bug关闭。当前状态见[持续记录](../discussions/2026-09-28-wi-022-background-consoles.zh.md)与ACTIVE。

## 批准与范围

维护者明确请求解决代理任务期间空白Windows终端反复出现／消失，授权定向后台启动修复与验证，不授权修改全局Terminal设置、隐藏其他窗口、用户profile／凭证、邻仓或Git提交。保留已完成原Goal及既有修改；这是新WI，不重开旧队列。

## 发现与可验证预测

区分三层：仓库直接子进程、嵌套工具／测试调用、代理执行工具最外层PowerShell。缺少windowsHide预期即使输出走pipe仍可能显示console；外层未隐藏预期即使修复子进程仍闪窗；PTY若可用应能替代该外层路径，不能未经验证就假设可用。

原生A/B已复现：默认启动PowerShell返回非零console handle和IsWindowVisible=true；同一启动加windowsHide:true后handle0／false，输出仍正常捕获。只记录PID、窗口handle及class，不读取用户窗口标题／内容。

执行工具外层PowerShell本身同样返回可见console；关闭login／profile处理不改变结果。两次tty:true在命令执行前即因CreateProcessW错误-1073283067失败，显式指定其他shell也没有改变错误中显示的实际可执行文件。这仅是本工具／环境观察，不泛化为Codex或Windows普遍不支持PTY。仓库参数不能改变外层进程创建；不把未验证配置开关或全局终端改动冒充已验证修复。

## 已完成仓库修复

在21个遗漏的后台启动点补上windowsHide:true，覆盖文档Git查询、测试／commit-check runner及helpers、公开runtime探针、spike helpers和直接RPC fallback。已有生产owned-runtime／session隐藏启动保持不变。两个透传测试recorder在启动前断言生产options，而非强制改成通过值。未压制输出／错误、引入shell拼接或通用进程框架，未替换SDK或改变权限／清理语义。

回归覆盖限定src／scripts的启动策略清单（不遍历symlink、.local-env、node_modules或dist），既有公共runner／checker seam，真实只读Git metadata成功／无效revision，以及runtime／session启动options。明确静态策略清单不是原生窗口证明；它先对遗漏点失败，修复后实际seam仍核对输出、退出失败和受控参数。

## 实际验证与限制

本地证据均位于dist/wi022-hidden-process-20260928/：

- baseline-status.txt、baseline-head.txt、baseline.patch保留起点；OWNERSHIP.txt记录唯一ignored证据根目录。
- visibility-baseline.json／console-probe.ps1：真实Windows默认／隐藏A/B。
- launch-policy-red.log、launch-policy-green.log（中途尚有spread-helper遗漏）、launch-policy-fixed-green.log：精确失败清单，随后22定向测试通过。
- compile.log、lint.log、test.log：compile／lint通过，673测试通过、零跳过；新增两个测试由原runner正常收集。
- native-runtime-report.json：真实发行pi0.86.1、隔离空HOME／agent／tmp／workspace，公开get_state成功并观察有界退出。隐藏observer仅附着记录中的自有RPC PID，观察handle0／visible=false。这不是mock，也不冒称安装VSIX／F5证据。
- native-runtime-observer-assumption-failure.log与native-observer-failure-cleanup.json：首次observer误以为handle0代表已脱离任何console，AttachConsole返回access denied。改为先明确detach observer自身，再检查自有child。失败探针的确切parent、CLI与esbuild服务经身份核对后清理；失败未改称通过。正确观测要求附着成功且无可见窗口，或权威no-console结果，不能接受普通access denied。
- outer-exec-no-login.json与executor-boundary.md：工具外层shell问题独立存在，不因子进程修复消失。

此窄自动化控制台修复不声称执行F5／安装包矩阵；生产owned-launch原本已隐藏，没有更改UI表面。用户所述整体症状**尚未完全解决**：执行工具须以不创建可见console的方式启动最外层shell，或提供能正常使用的无可见执行通道。该实现／配置在本仓库之外，现有工具没有提供已可用的对应选项。不得仅因仓库测试通过就关闭WI-022或声称全部闪窗已消失。

## 保留与下一边界

保留该根目录的唯一基线、失败／通过观测及合成夹具，直至证据不再需要或已可靠保存，删除前重查精确进程依赖。不关闭用户进程。最终进程／检查回执留同目录。未暂存、未提交、未推送。ACTIVE仍是唯一任务账本；下一必要修复在执行工具外层启动边界，不重复无效仓库重试，也不改全局Windows Terminal偏好。

## 后续：进程归属与可用规避措施（2026-09-28）

上次中断的observer（PID7096）已正常结束；entry-window-monitor.json捕获短暂WindowsTerminal窗口，但服务父链本身无法识别请求客户端。未停止用户进程。

本轮20秒仅名称／PID快照与窗口轮询（process-window-trace.json）发现常驻OpenConsole PID6460／20708均由Code.exe PID15132启动，与受控闪窗实例不同；截图本身不能识别精确实例。空闲采样无可见终端窗口。轮询可能漏掉极短进程，不读取标题、命令行或秘密。

controlled-exec-trace.json用一次无副作用普通exec命令对照：09:49:00 UTC，codex.exe PID12964启动pwsh.exe PID22720，后者启动conhost.exe PID22920。同时间出现新的OpenConsole／WindowsTerminal；捕获WindowsTerminal PID22696可见窗口及PID22720自己的PseudoConsoleWindow。服务启动的WindowsTerminal仅按时间关联，不伪称codex直接子进程。结合此前自身console探针，已复现普通执行入口闪窗，不代表所有消息发送触发源已查清。

现在已找到可用替代通道：mcp__node_repl直接读文件，并通过child_process.execFile与windowsHide:true执行。node-repl-hidden-entry.json记录5次自身console句柄0／visiblefalse，stdout、stderr及exit7保真；其中一次另见无归属短暂窗口，不能据此宣称全局无闪窗。AGENTS已记录本仓库的默认规避方式，权限与安全边界不变，不得换工具绕过拒绝。这取代此前“没有可用无可见通道”的结论，但未修补客户端普通启动器。WI-022保留未关闭，完整消息发送／客户端级验收仍未完成。未修改用户终端设置或安装。

## 新因果线索：此前终端修复

用户明确报告：此前终端正常，后来VS Code终端打不开，经Codex修复后开始闪窗。这是因果排查线索，不是某个设置已被改坏的证明。OpenConsole归属正常不能排除修复引入的启动回归。两个运行宿主实际路径均为VS Code安装中的node-pty/build/Release/conpty/OpenConsole.exe。已知设置文件的允许项检查只见C盘用户设置defaultProfile.windows=PowerShell，不能证明由那次修复改动。当前用户Console ForceV2为1，检查的委派值不存在；缺少修复前状态，不能据此重置。未修改用户设置、注册表或安装文件。读取此前Codex任务记录时localhost MCP传输不可用；需要定位原修复任务或其改动摘要，才能精确回退，不能杀正常终端宿主或盲目重置配置代替。

## 隔离终端对照（2026-09-28）

用户授权保留现有安装／设置，执行干净配置对照。证据与所有权在dist/wi022-hidden-process-20260928/isolated-terminal-comparison/。实际安装的VS Code1.139.1运行8组隔离检查，使用本地探针扩展、空扩展目录、合成HOME／appdata／工作区、离线偏好及NoProfile shell。每组均执行写入标记命令、核对准确readback、终端exit0关闭、自有Code进程exit0退出。最终进程检查排除观察器自身后无残留自有宿主／监视器。配置与唯一证据保留，清理条件见OWNERSHIP.txt。

前几组API检查仅证明终端可工作，不能证明profile解析：createTerminal传shellArgs后实际回退powershell.exe。后续workbench.action.terminal.new正式入口验证实际profile行为。同名PowerShell用户定义即使有自定义path，仍与默认source=PowerShell合并，重复测试均启动powershell.exe；独立名称profile才解析到指定D:/APP/base/PowerShell/7/pwsh.exe，显式shellPath也独立验证该程序。两者均正常工作。因此不能说干净设置必然打不开终端，也不能只凭profile标签／路径断言实际启动程序。这个隔离解析差异不能证明此前谁做了修复，也不证明Codex闪窗根因。

初始selected组捕获由测试终端PowerShell启动的conda.exe及相应可见console；后续同名／独立名称正式UI入口均未捕获可见终端窗口或conda子进程。保留间歇观测，不作普遍因果结论。窗口轮询有遗漏边界，未检查用户shell脚本、凭证或现有终端状态。未修改用户设置、注册表或安装二进制。此前独立复现的Codex普通exec闪窗仍未根治，WI-022不关闭。

## 用户要求切换掉OpenConsole（2026-09-28）

用户明确要求新开的VS Code终端不再创建OpenConsole.exe；这与消除所有Codex命令闪窗是不同目标。已安装VS Code1.139.1的设置定义与内置说明确认terminal.integrated.windowsUseConptyDll默认true，控制使用随VS Code提供还是Windows自带的conpty.dll。隔离ui-system-conpty设为false后，正式新建终端启动pwsh.exe与系统conhost.exe，未采样到自有OpenConsole.exe、未观测到可见终端窗口；合成命令准确readback，终端／自有Code均exit0。证据见isolated-terminal-comparison/system-conpty-acceptance.json及相邻trace／report；轮询不证明任意短进程绝对不存在。

通过后按此次明确请求，仅在C:/Users/hex4c59/AppData/Roaming/Code/User/settings.json加入terminal.integrated.windowsUseConptyDll=false。排除该键的解析对象完全一致，并核对精确文件readback；定点文本插入保留其余注释／格式。原键不存在，user-system-conpty-setting-change.json保存哈希与仅删除新增键的回滚说明，不复制私人设置内容。未修改注册表、删除程序、改名profile或结束用户进程。现有终端继续使用原宿主，不宣称现有OpenConsole立即消失，也未重载或验收当前用户窗口。新终端应采用新设置；若现有pty宿主缓存配置，需用户保存工作后自行重启。原Codex外层启动闪窗仍独立未解决。

## Codex daemon启动隔离：决定性A/B（2026-09-28）

本地CLI确认运行中的managed binary为0.157.1。官方文档网络不可用，按本地fallback技能使用精确版本CLI与固定commit官方Git源码。openai/codex标签rust-v0.157.1对应ac0e23e5232692b95268583c8278c50b8c436d2b，获取于自有稀疏引用codex-source-reference，不改用户仓库历史。观测到最新稳定标签0.158.0对应54e1bd264b4122fe9471ee7d54c4d021a76bb8ff，其pipe实现仍未设置Windows隐藏标志，因此不把升级当作已验证修复。初始源码API访问遭限流，仅采用随后Git对象读取的内容。

自有codex-launch-repro使用空CODEX_HOME与公开command/exec，不创建模型turn，不读凭证、不付费。真实0.157.1 app-server以windowsHide:true且非detached启动时，探针handle0／visiblefalse；保持程序、命令与环境相同，仅改detached:true后出现非零可见console与WindowsTerminal。两组均exit0，另用portable PowerShell的PTY也成功且不可见。两份自有server均exit0退出。这纠正了“只要pipe缺少flag就必然闪窗”的不完整推断：父进程console状态也有因果作用。源码pid_start.rs明确使用DETACHED_PROCESS | CREATE_BREAKAWAY_FROM_JOB，与失败启动条件吻合。

持久修复须保留managed-daemon的job脱离、进程身份、updater、socket与重连语义，同时阻止可见控制台；隔离隐藏stdio服务并不是完整替代。未修改Codex安装／服务配置，未停止用户daemon。部署需要限定修复共享Codex启动组件并安排维护重启，会影响本会话及其他连接，必须先确认中断授权，不能静默杀服务。此前VS Code设置与本缺陷无关，按明确请求保留。WI-022未关闭。证据／来源／自有退出回执见codex-detached-root-cause.json、codex-launch-repro/、codex-source-reference/OWNERSHIP.txt；唯一证据与源码保留至不再需要，删除前复查精确依赖。
