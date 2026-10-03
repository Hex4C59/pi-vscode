# WI-084 — PI-GAP-06 工作区文件补全

[English](2026-10-03-wi-084-file-completion.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-03-wi-084-file-completion.md](2026-10-03-wi-084-file-completion.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-03
- Type: Reference
- Status: Accepted
- Created: 2026-10-03
- Authority: 历史Prepare及本次Goal代理验收

以下保留有日期的历史Prepare与checkpoint，末尾关闭段拥有本WI验收。

## 范围、批准和现有实现

10 月 3 日有界 goal 明确批准 ACTIVE 内 PI-GAP-06、实际验证、代理验收和本地提交。WIP=1；WI-082／083 保留原生验收未完成，不视为关闭。Decision: none；Gate ID: none；PRD：用户可见 REQ-004/009 附件发现。Prepare 完成；该有界请求已批准 Build，本记录不是交付证据。

既有 DraftSubmission 拥有已确认草稿 revision、准备取消、附件限制和原子捕获／复查。整文件经原生选择后使用 captureFile、realpath／工作区边界、敏感路径／内容拒绝、编辑器快照和大小检查；发送时保留源码变化确认。CommandInput 已有 slash 补全及 IME／Enter，WebviewClient 发送具名、版本化、身份关联操作；未发现既有 @ 文件补全。

安装的 @types/vscode 公开声明提供 workspace.findFiles、单文件夹 RelativePattern、exclude undefined 时的默认 files.exclude（不是 search.exclude）、maxResults 和取消 token。原生 createQuickPick 支持初值、label／路径模糊匹配、键盘选择和取消。这些是公开 host API，不重写 pi 循环；内容仍经现有 capture owner。无依赖／上游升级、源码正文索引、持久目录、watcher 或新增执行／加载权限。

## 批准方案和所有者

Composer 光标处独立 @ token 提供显式 Tab 文件发现补全，安静本地化提示说明按键；不劫持邮箱、IME、slash 或普通 Enter。Tab 打开以 token query 为初值的 host-native 模糊／路径 QuickPick；必须显式选择，不在输入时自动附加。Renderer 仅发送有界 caret、当前 draft revision 及既有 generation／view envelope，不发送文件系统路径或任意读取请求。Host 从已确认草稿推导 token，拒绝失效／非法请求。

仅在一个合格、受信任本地工作区，用 RelativePattern 和默认文件排除发现。最多枚举 3001 路径，展示 3000 安全相对名，明确截断以及过滤仅覆盖有界列表而非完整项目搜索。发现不读源码正文。复用既有附件路径策略排除敏感／非法／越界路径名；显式选择后的 captureFile 才权威检查 symlink 目标与实际内容。有界列表找不到文件时仍可用既有原生整文件选择。路径留在 native QuickPick，不传给 Webview。

发现使用 DraftSubmission 既有准备 lease；仅捕获／复查成功后，原子附加整文件并从已确认草稿移除精确 @ query token，保留其他文字及附件。取消、无匹配、失败、来源拒绝、超限、身份／文本变化均保留草稿，不部分附加。既有整文件变化确认、发送、恢复和历史规则不变。Deadline／取消／dispose 使搜索与 QuickPick listener 失效，无自动重试或发送。新 host 操作具名 allowlist 并记录在打包消息契约，无浏览器文件系统访问。

预计路径：协议／parser／client、composer 输入和继承 token 的本地化提示、host 文件发现 owner、DraftSubmission 捕获集成、编码前组合／mounted 验证、双语需求／README／契约。Host 拥有文件系统能力，renderer 仅显式意图；架构信任、身份、取消、界限、所有者方向保持，实际宿主／视觉证据未完成。不可把窗口绑定限制当 UI 通过。

## 编码前失败方式

输入／邮箱／IME 意外读取；Enter 发送而非补全或 slash 回归；未确认文本或伪造 caret／path 附加；其他项目／view／session 收结果；越界／敏感／symlink／内容绕过 capture；截断后暗示完整目录；排除／隐藏文件或无匹配误报；大量名称／listener／timeout 无界；取消丢草稿；捕获中附件／源码变化部分或失效附加；移除 query 吃掉其他文字或后来编辑；重复 Tab 重复附加；准备、忙碌任务、Stop、模型／会话／profile 竞态；缺 native API 或发现失败无恢复；长名／语言／主题／键盘焦点不可用。

## 可观察验收和工件

代码前准备 host→draft 附件组合与 mounted composer／client 场景。验证光标 @、邮箱／IME／slash／Enter 区分、query／路径 native 模糊选择、默认排除／单文件夹边界、明确截断、选择前不读正文、敏感／越界／symlink／变化／超大拒绝、取消／失效／编辑／重复／超时／释放、原子保留草稿与继承源码变化确认。仅隔离合成文件，保留可重复 TAP／JSON，不枚举真实用户敏感文件。

compile／lint／npm test／docs:verify，干净提交候选检查和打包；macOS F5／安装 VSIX 的 native picker 键盘／取消／选择／附件流程分别取证。改动提示在 280／320／400px、浅／深／高对比、英中下截图。需要真实 pi 交付时仅合成 loopback，不使用真实账户或付费模型。原生验收仍受既有隔离 Code 绑定阻碍；缺证据明确未验证。工件 dist/goal-eight/wi084/；Prepare 时尚无代码或通过证据，后续实现状态见下方开发检查点。


## 开发检查点

代码前准备四项 host／draft 组合和两项 mounted-production 场景，预期 red 是缺发现／Tab 意图，实现后六项通过。Compile、lint、1235 标准检查及 docs:verify 通过。完整检查发现私有跨模块导入及 browser 从 host 契约导入值；改经公开入口和独立 renderer-only 提示 parser，保留 host 权威推导，未弱化边界测试。最终提示可用性／文档重跑亦通过 compile、lint、1235 检查及 docs:verify。浏览器截图先于该可用性修订，是开发证据而非提交候选验收。

真实浏览器合成宿主截图覆盖 18 组合（280／320／400、深／浅／高对比、英中）及长路径；已检查 contact sheet／geometry，无 composer 横向溢出，Send 可达，提示安静换行。部分既有欢迎动画是中间帧，不作运动证据。工件 dist/goal-eight/wi084/browser/{matrix.json,contact-sheet.jpg,*.png}。原生 picker 仍仅 host 组合证据，不是 F5／安装 VSIX，隔离 Code 绑定条件保留。搜索／选择 deadline 为 15 秒／2 分钟，失效 lease／dispose 释放控件。无验收、关闭或干净候选声明。下一步本项 diff 审查／本地提交、干净候选和原生验证。


## 干净候选与串行交接

实现提交 `fa1d18d97ef80ba95b0f814548a8b8cb56da7907` 在隔离干净候选执行 compile、lint、1235 检查、docs:verify、docs:health 与 VSIX 打包均通过，前后源码状态为空。工件：`dist/goal-eight/wi084/candidate-evidence/verified-candidate/` 与 `candidate-identity.json`。候选目录后续可复用；本次身份以保存记录而非后续 HEAD 为准。隔离原生窗口绑定阻碍不变；F5／安装版 native 文件 picker、键盘及附件交互未验证，无代理验收或关闭。保留 PI-GAP-06 未完成，唯一当前 WI 转向独立 WI-085／PI-GAP-14。


## 恢复native Prepare——2026年10月3日

原有有界授权继续，WI082／083／089关闭，当前仅WI084；旧blocked为历史，隔离已可用。已审阅FileDiscovery公开RelativePattern／默认排除3001／3000、15秒搜索／2分钟QuickPick，DraftSubmission lease／原子token移除／capture／重验证／继承源变化确认，FileAttachment realpath项目内／敏感路径内容／262144字节。无产品／API／依赖／架构或信任持久化变化。

独立F5／安装fixture复用普通observer：空合成HOME／agent、内存SecretStorage、禁账户，无extensionTestsPath／API替换／自动批准。自有项目含嵌套／中文／长文件、排除文件、无凭据虚假敏感路径、超大文本及指向项目外自有fixture文件symlink；仅明确确认变化后的合成Send用既有held loopback。observer只记录身份、等待逐案review及正常退出。

harness编码前四项子进程契约因缺实现失败（red.log），非native。失败方式：真实文件账户、自动picker批准Send、文件provider时间无界、旧标记／非零退出冒充、安装身份不符、确认前投递、排除敏感超大symlink绕过、取消丢token草稿／重复附件、no-match键盘未实际观察、模拟升级native。待实际验收Cancel／模糊键盘选择／no-match／原子草稿附件／排除敏感metadata／超大外部拒绝／变化拒绝及确认／英中；旧18浏览器宽主题语言预览不升级，native受影响hint280／320／400及主题单独取证。保留准确源码包环境命令／请求截图AX，全部native尚待。

harness开发checkpoint：四项合成子进程契约RED→GREEN，compile／lint／1279收集测试／docs:verify通过。不宣称native；普通observer无API替换，自有合成fixture，wrapper要求实际成功退出及变化内容请求。接下来提交审阅／隔离干净候选，再真实F5／安装。


### 实际F5缺陷及修复Prepare

干净27623b4 compile／lint／1279／docs／health／打包通过，VSIX8471b178791ed0ee29b9a3020b4f946267a3a70775635edd77ddba75275d8ab0。真实F5 fixture5gIQpm／PID74693在已批准自有项目验证Tab带query、Esc保草稿、no-match0、安全列表4排除.env／excluded、键盘模糊选择／实际附件29字节。但成功后renderer仍显示KEEP_DRAFT_中 @nest，未移除精确token。不验收：截图AX及正常子父退出保留，wrapper1／provider关闭0请求。检查根因：host原子移除正确，WebviewClient completeFileReference未记录host草稿转换，applyAttachmentState仅协调commandCompletion，随后syncDraft把旧renderer文本发回。属产品协调缺陷，非keychain／harness。

在既有批准范围复用command completion的身份／revision／sequence／before／after确认lease，UI token仅计算预期文本，host仍权威、renderer不发path／query。保留Cancel／error／新编辑／generation失效，防重复pending。修复前生产mounted响应场景先覆盖成功／无旧文本重发／无自动Send、取消、新编辑，保留RED→GREEN。仍须新提交候选和两真实lane，旧失败不得升级。

退出精度：自有子父窗口实际使用Cmd+Q，但process-exit.json为code:null／signal:SIGSEGV，不是成功正常进程退出。保留此宿主crash及协调缺陷为失败lane，不验收或声称exit0；若重现继续诊断。

修复开发结果：mounted成功场景RED复现native旧token，复用pending草稿转换lease／既有准确revision／sequence／文本guard及identity reset。成功及取消／新编辑GREEN，compile／lint／1281／docs通过；首次compile因测试findLast不属声明lib失败，测试改reverse／find未升级编译器。仍属mounted非native修复验收。exthost退出0与Code主进程SIGSEGV分别记录，crash根因未证实。


### 原生修复候选审查超时与有界重试Prepare

干净候选158c95e通过compile／lint／1281行为检查／文档与health／打包，VSIX SHA256为613a923e8aa22368cb0b3937aa65418ec8efe8c2275abca75abfd44e865a7a2d。实际F5 fixture CNajUd验证token移除、取消／no-match、安全发现、超大／外部拒绝、源变化确认及一次明确确认的合成loopback请求。英中native提示在280／320／400 CSS像素及Dark 2026／Light Modern／Dark High Contrast取得截图AX和geometry并审阅实际contact sheet。它们是**失败lane**中的观察，不是验收：普通observer的25分钟期限在最终标记前到期。主Code退出0，provider关闭，一次合成请求／零真实调用。完整工件dist/goal-eight/wi084/native-f5-158c95e/含broker结果／退出、截图AX矩阵及审阅geometry。先前SIGSEGV未重现，原因仍未证实。

工具修改前失败方式：合法有界31分钟显式审查被过早拒绝；仅增加observer预算不能接受缺案、宿主非零退出、安装失败或未确认投递。实现前新增合成时钟契约，以Native review deadline exceeded失败（native-harness/review-budget-red.log），不冒充native。Prepare：仅本文件补全observer改50分钟，自有进程wrapper改60分钟，保留取消、最终退出／结果核对、凭据隔离及十案。产品发现／picker期限不变，不改API、产品、信任、资源、数据或持久化边界。重跑契约与仓库检查、审阅提交局部diff，再干净候选及独立新F5／安装lane。尚无代理验收或关闭。


## 独立原生验收与关闭——2026年10月3日

干净候选9ec533987055be301a6354ca859b3a475f9d4ed0 compile／lint／文档／health／打包通过。首次全测既有old-model断言失败；独立四案及未改源码全1282重跑通过，保留两日志，不声称时序原因已证实。VSIX SHA25698cf189c7d0f77df6395d15e47b7fba96437b94fa12c8ca9745613970cf8f26c；dist/goal-eight/wi084/native-candidate-9ec5339/。

独立实际F5 tUCUD2／安装IqMcWa十案均审阅：Tab seed、Esc精确保草稿、零匹配、安全四名称排除虚假敏感／默认排除、模糊键盘捕获、精确原子token移除、超大／外部symlink拒绝、变化确认前零请求，明确Use latest contents／Send后一次变化内容合成请求及任务完成；中文picker／取消／捕获同样。Code1.140.0／pi0.86.1，F5产品0.0.1干净clone，安装产品0.86.1位于fixture extensions根及成功日志。两review-complete后正常UI退出，主／wrapper0，provider观察关闭一次合成请求／零真实模型调用，无自有job遗留。

每lane独立18实际native截图AX及测量geometry，280／320／400 CSS像素×Dark2026／LightModern／DarkHighContrast×英中。提示换行控件边界可见；编辑器／焦点生命周期令捕获附件不可用，Send正确禁用，矩阵不冒充投递（早先明确确认投递单独证据）。F5主题误入Marketplace两次，立即Esc无选择安装；可能主题搜索，不能声称宿主零网络。安装lane观测焦点仅本地主题。dist/goal-eight/wi084/native-f5-9ec5339/及native-installed-9ec5339/保留review／截图AX／contact sheet／geometry／请求及broker身份安装结果退出关闭；旧失败mock浏览器RPC不升级。

重现干净9ec5339检查打包，node scripts/spikes/file-completion-native.mjs f5实际F5／明确fixture资源；独立node scripts/spikes/file-completion-native.mjs installed dist/pi-vscode-validation.vsix。实际十案与矩阵后写review再正常退出，无自动批准／跨lane复用标记。

**本次授权下的代理验收：** PI-GAP-06／REQ-004/009验收、WI084关闭，非维护者亲测。实现fa1d18d／原生发现修复158c95e／工具9ec5339；敏感大小源变化恢复／发现picker期限／排除／附件所有权不变，无API数据加载执行持久化架构新选择，Gate／Decision none。另四项未完、PI26上传未批准，整体Goal／ACTIVE未complete。语义审阅对照源码协调测试工件，修正需求导航、保留失败；无关ADR0010／WI088 metadata警告延期。
