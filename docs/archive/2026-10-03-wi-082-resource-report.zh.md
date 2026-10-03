# WI-082：实际资源加载报告

[English](2026-10-03-wi-082-resource-report.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-03-wi-082-resource-report.md](2026-10-03-wi-082-resource-report.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-03
- Type: Reference
- Status: Archived
- Created: 2026-10-03
- Authority: 仅历史PI-GAP-02有界Prepare／Build及委托验收

## Prepare 和批准

范围：PI-GAP-02，REQ-004/009。PRD 判定：用户可见；增加原生命令 `pi: Show Resource Loading Report` 和自动更新的只读文本报告。批准依据：[本次八项目标授权](../discussions/2026-10-03-eight-gap-goal.zh.md)。Phase：Prepare 完成，Build 已授权；Gate ID：none；Decision：none。只报告证据，不启动／重载 runtime，不读取上下文全文，不改变信任、依赖或持久化。

现状：WI-078 的 adapter 验证公开 `get_commands`，host `commandProjection` 以 runtime/session 身份限制快照；列表有 512 行上限，名称和可选说明已净化，路径不跨界。pi 声明／安装版本 `0.86.1`。安装包 `docs/rpc.md` 的 `get_commands` 与 `dist/modes/rpc/rpc-mode.js` 显示命令来自已登记扩展命令、已加载模板和 skill 定义。文档例子仍有旧 `path/location`，实现使用 `sourceInfo`，既有解析兼容两者。公开 RPC 不枚举 AGENTS.md 或所有扩展文件；不通过独立 ResourceLoader 冒充当前 runtime。

## 方案和边界

宿主复用现有快照，原生只读文档展示四类资源：AGENTS.md 实际加载未知；模板定义已加载及名称（不代表调用）；skill 定义已加载及名称（不证明正文已进入上下文）；扩展命令已登记及名称，全部扩展文件加载仍未知。单独列本机插件清单的登记／启用数量，绝不将清单或启用等同加载。无 runtime、正在启动、空目录、不可用与身份失效明确，重启／替换／语言变化更新报告。每类最多展示 100 名称并标省略数量；不含源路径、正文、提示词或凭据。原生文本避免消息脚本、HTML 或外部资源执行；失败可通过再次执行命令恢复。

所有者：adapter 继续提供公开 RPC 的已验证快照；host 负责身份、计数、翻译及只读文档生命周期；Webview 不新增能力或内容。预计修改 extension 注册／provider、新宿主报告模块、端到端式宿主组合验证与独立真实宿主验证脚本、包命令、双语 PRD／说明。不改变持久化／信任边界，不需 ADR。架构维度 1–5、7–15：延续原所有者、身份和界限；16–19 验证尚待完成，不宣称已经满足。

## 编码前失败方式

把清单当加载；把 skill 目录当正文已加载；把无扩展命令当没有加载扩展；AGENTS 猜测；旧 runtime／工作区快照仍显示可用；不可用变成零；未启动报告意外启动 runtime；名称或路径泄露；无限报告；语言变化丢状态；原生打开失败未处理；关闭／dispose 后更新；读报告改变草稿、发送或权限。

## 可观察验收和工件

先准备现有 host 测试入口的跨层行为验证，再实现；不在代码后补单元测试。验证四类证据、清单分离、空／错误／身份失效、英中、上限、打开失败和释放，输出可重复 TAP/JSON。实际 pi 使用隔离 HOME／agent 目录和项目的已知模板、skill、扩展命令，不调用付费模型；保留退出证据。macOS F5 与安装 VSIX 分别执行原生命令并观察只读报告、键盘、可读性、关闭和刷新；保存截图／日志和源码身份。运行 compile、lint、npm test、docs:verify，关闭时 docs:health。候选证据在提交后独立干净源码运行，不把既有脏树称作 clean。

工件根：`dist/goal-eight/wi082/`。已实现待验收；开发态 compile、lint、1224 个标准行为检查、3 个编码前准备的报告组合场景及 docs:verify 通过（保留 ADR 0010 两条既有提示）。隔离真实 pi 的 controlled／trusted 目录及进程退出检查通过，无模型调用。首次回归发现过早注册原生 provider 影响既有路径，改为首次打开才注册后全量通过。源树含用户既有修改，以上仅为开发证据。下一步：独立提交后的干净候选、F5／安装 VSIX 和代理验收；未满足关闭条件。

## 当前阻碍和串行交接（2026-10-03）

本地提交：Prepare／授权 `712abb9`，实现 `d03d7c4`，清单竞争守卫 `0633e9f`，验证脚本 `796de78`／`33a13d5`。独立候选 `33a13d5d38e8e64225da185be88620b38c8bcb4f`（base `bc1a2d7b9c5174434036445db6c5f85624072a72`）的源码干净；compile、lint、1224 项测试、docs:verify、隔离真实 pi 与组包各自通过。历史文档本地工件只为链接检查挂接，不算本次结果。最终 zsh 包装命令因使用只读变量 `status` 返回错误；各项检查通过的依据是 `&&` 链已到达成功组包和各自日志，而非包装命令的退出码。工件已复制到 `dist/goal-eight/wi082/candidate-evidence/`；原候选路径在 `candidate-path.txt`。

F5／安装 VSIX 未通过验收：初次启动因测试临时目录 Unix socket 过长失败，已缩短。已启动的隔离 Code 原实例无法被当前 CUA 绑定；改标识副本失败于签名／动态库校验。未改签名的本机安装副本能够启动，但 CUA 绑定仍超时。没有点击合成项目资源同意、没有报告视觉验收，也没有安装版通过结果。已结束本任务拥有的测试实例；不触碰用户 Code。不会放宽签名／执行权限来消除这个条件。

最小解锁条件：能够在隔离用户目录下绑定真实 Code 窗口、执行该项目同意及原生命令，完成 F5／安装 VSIX 报告检查与视觉／键盘观察。此项不关闭、不归档、不声称代理验收。按照协作指南记录阻碍后，当前焦点切到独立 PI-GAP-04（WI-083）；后续重新尝试原生环境，八项目标仍保留全部关闭条件。

## WI089关闭后的原生焦点恢复 — 2026年10月3日

WI089／PI27已有独立实际F5及安装版本UI验收，不验收PI02。当前native launcher修复585bd06／f2b4462／1011afa有干净compile／lint1271／文档／打包证据。内存SecretStorage恢复隔离绑定且不改钥匙串，atomic option恢复单合成项目；记录native edit success boolean同时仍断言内容不变／重开。F5实际观察unavailable→ready、一个template／skill定义、registered command及unknown body／context／file，英中报告与英文键盘只读；在另行版本UI审查期间review marker超时。实际安装package激活及初始报告打开，但resource consent／catalogue超时；两失败均保留，未编造PI02验收或finish marker。

本任务安装进程已退出，随后出现非fixture Code进程／title `pi-vscode`，来源未确证，不继续用户窗口操作或用户状态检查。测试进程已退出时不要调用app选择／状态：macOS工具可能解析／启动默认应用。以后每个native操作前复核本任务进程仍活着及窗口仍标识fixture，身份变化立即停手；不退出非fixture实例，不重置钥匙串／安全。最小下一步：可安全绑定的隔离实例，专注资源审查并在有界时限内完成英中／只读／关闭／刷新及实际F5／安装driver结果。其余七项目标仍未完成。上方旧阻碍段落属历史，不代表Code独占时绑定仍不可行。


10月3日从干净2d4b871重试：binary-only清单无既有Code，隔离F5父进程14301启动，但native工具报告Mac锁定且无法自动解锁。未运行driver或UI操作；已停止自有父进程并观察终止，保留native-locked-2d4b871工件。当前最小解锁条件为用户手动解锁Mac，不是重置钥匙串或终止用户app。解锁后复核无竞争Code及新的自有存活进程／fixture身份，再专注同一有界资源F5审查。不属于PI02验收。


当前阻碍经连续三Goal turn确认：native清单明确Mac锁定，无存活自有验证job。Goal等待手动解锁标blocked；WI082仍未完成Build，须native审查／driver验收。不授权钥匙串／安全修改。


10月3日恢复：Mac已解锁，但binary-only清单确认非fixture Code9702。旧Electron-only筛选漏掉实际MacOS/Code，不存在判断已在Goal纠正。不能安全隔离绑定时不重启／选择／输入。当前最小解锁为保存关闭非fixture Code或安全macOS窗口／PID绑定，不是重置钥匙串。无新增native验收，七项未完成。


安全绑定阻碍经三恢复turn确认：非fixture9702仍在，无自有存活测试。Goal blocked，WI082未完成；保留实际F5／安装要求，须用户保存关闭Code或安全macOS绑定。


## 正常退出授权与原生审查时限Prepare — 10月3日

人类明确授权正常退出日常Code，禁止强杀、自动保存／丢弃无关工作，未保存／任务确认时停手。实际Cmd+Q退出9702，无中途确认；binary-only清单空，三个原Git修改不变。未检查／保存用户源码或凭据。安全绑定阻碍已移除；Goal引擎可能仍保留blocked直到用户恢复，但可继续已授权验证。

错误shell cwd导致候选self-fetch其旧master d03d7c4并误调用旧launcher32087；native绑定前exit1，无UI操作／许可／验收，失败保留。以绝对根路径fetch纠正，确认57eac54干净且可执行树与1011afa相同、文档检查通过，再启动32359。实际F5获得ready目录、API内容不变／重开、英文键盘替换不改变文本及英中可读报告截图；完整中文键盘／重开前240s审查marker超时。保留失败并结束自有父进程，未编造finish。

有界验证修复仅脚本：资源许可仍240s，审查900s，自有进程总时限1800s（随后既有TERM／KILL清理）；不改产品／权限／runtime。编码前失败方式：安全逐步存活／AX往返期间审查超时、无限等待／孤儿、未经审查接受marker、延迟组合冒充native。先写生成driver虚拟时间组合，审查marker在300s后才可用，仍拒绝内容变更；改脚本前观察240s red。只证明时限行为，验收前仍须实际UI重验。


延迟marker组合在240s下red、900s后green，内容变更仍失败。四focused、脚本语法、compile／lint、标准完整1271、文档verify／health通过，review-deadline保留log。仅改有界验证时间，不改验收标准。下一步审查工具提交、干净提交候选检查，再实际F5／安装资源专注审查。


## 关闭 — 本次授权下的代理验收（2026年10月3日）

**仅PI-GAP-02依人类八项Goal明确委托代理验收并关闭，不是维护者亲自测试。** 不改gate／ADR、runtime／加载权限、存储、依赖或平台。PI27此前已验收；其余六项未完成，PI26上传／敏感收集仍未批准。

- **身份／检查：** 干净已提交9d7a3f8候选compile／lint／完整1271／docs:verify／docs:health／package:vsix通过，前后Git status空。应用实现仍d03d7c4＋0633e9f，后续native launcher修复不改报告行为。`dist/goal-eight/wi082/review-deadline/candidate/`保留完整源码／命令结果及VSIX SHA256 `05b9f9d70a8f342bb2cc72d87d29804f343deb04f3b2d7b3718637f9a944fcda`。
- **实际F5与安装：** 两独立native driver均passed；初始unavailable（非零加载）→ready，真实pi0.86.1 get_commands，一个合成模板／skill定义、已登记llama命令；AGENTS.md／skill正文／任意扩展文件仍unknown。inventory0登记／启用独立且不证明加载，sentinel正文／路径不进入报告。源码0.0.1与安装0.86.1符合既有打包策略。实际安装产品目录`/private/tmp/pi-resource-native-CX2Azy/extensions/pi-vscode-dev.pi-vscode-0.86.1`；development instrumentation仅verifier，不是产品源码。
- **交互／视觉：** 审阅四张实际截图，可读宿主深色Plain Text、解释折行、已加载定义／登记／未知清楚区分，不认证自定义Webview／CSS。两模式英中select-all＋合成粘贴后AX报告文本精确不变；API edit true另记，仍断言内容不变／重开而非仅靠boolean证明只读。语言实时更新；两模式中文关闭、原生命令重开精确相同。键盘证据是内容不变，不宣称捕获拒绝toast。
- **界限／生命周期：** 编码前生产组合覆盖当前／失效身份、unavailable／empty、有界名称／省略、数量、dispose／打开重试及不改任务。旧隔离真实RPC分记；native覆盖上述真实入口／转换，不冒充所有故障注入或非零inventory矩阵。未请求prompt／模型调用，未用真实账户／凭据或读取用户源码。不认证完整OS／网络、其他主题／宿主／平台或发布。

native工件`dist/goal-eight/wi082/native-f5-9d7a3f8/`与`native-installed-9d7a3f8/`保留截图、完整AX、文本相等review JSON与broker fixture／initial／loaded／install／observed／result／process-exit。完成英中实际审查且自有进程仍活着后才写finish，两harness session均exit0、native进程结束。此前失败／超时及wrong-ref工件仍失败，未覆盖。

干净候选重现：`node scripts/spikes/resource-report-native.mjs f5`并实际F5，或`installed <本地打包VSIX>`；核对隔离fixture身份／自有存活，Add context→Add file→核对合成目录→Allow resources（不发送消息）。审查加载、英文键盘替换、插件通用→语言→中文、实时报告／键盘／关闭重开，保留截图／AX／文本相等；之后才写该fixture finish并观察passed／退出。许可240s、审查900s、总1800s保持有界，不用日常Code／真实状态验收。

归档保留Prepare及阻碍／修复时间线作为历史；现行需求归REQ-004／009，下一WI083维护手动压缩native验收。人类正常退出授权仅正常退出，禁止强杀／无关保存丢弃或越过未保存／运行任务确认。9702实际正常退出无确认，原Git修改保留。不宣称系统钥匙串修复或所有提示消失。
