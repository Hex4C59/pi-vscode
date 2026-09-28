# WI-013：第三方扩展目标调查

[English](2026-09-27-wi-013-target-research.md) | 中文

- 翻译状态：Technically Verified
- 权威原文：[2026-09-27-wi-013-target-research.md](2026-09-27-wi-013-target-research.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-27

- Type: Discussion
- Status: Archived
- Created: 2026-09-27
- Authority: 来源调查／限定运行时观察，不是产品／宿主／gate 验收
- Scope: 受托主来源调查，随后由主代理选择目标并验证公开 RPC；WI／ADR 完整验收另行处理

> 2026-09-28 归档：调查及旧提案已由 WI-013／014／017／021 验收和 [ADR0004](../decisions/0004-trust-and-lifecycle.zh.md) 的边界决定替代。下文的当前／待执行／未决均保留原调查时点，不是现在的工作入口；当前状态仅见 [ACTIVE](../../ACTIVE.md)。未执行的历史候选夹具不冒充实际结果，现行验证映射见各验收记录。

## 结论

推荐真实目标 **pi-system-prompt-manager 0.1.1**，固定 commit **9c8f546b875f929ad5d573fe30e7a7fd6e3ae924**，通过安装的 pi **0.86.1** 公开 RPC 隔离测试。真实编码提示管理流程需要 select、input、editor、confirm，以及 notify／setStatus 反馈，confirm-only 不覆盖其实际创建／编辑／删除流程。必须在加载前核对有效 HOME，来源建议本身不证明兼容。对照 @tmustier/pi-code-actions 的正常流程需要 custom TUI 与助手历史，不为增加数量而引入。

## 不可变目标标识与主来源

### 首选：pi-system-prompt-manager

仓库 tombystrican/pi-system-prompt-manager；上述 commit 中 package version 为0.1.1，不声称 npm tarball 等价。公开入口 extensions/system-prompt-manager.ts 默认导出，pi.extensions 声明 ./extensions。实际 LICENSE 为 MIT，复制分发须保留通知。使用 Node fs／os／path 及仅类型的公开 ExtensionAPI／ExtensionContext；无普通运行时包依赖，coding-agent peer 为 *。这是独立可用的提示库扩展，不是官方例子或合成夹具。精确 manifest、完整源码、LICENSE 的固定链接见英文 S1～S3。

### 对照：@tmustier/pi-code-actions

仓库 tmustier/pi-extensions，0.1.6，commit 4a63a2ebd3683d86597e226c7ff778ea4837dd73，入口 code-actions/index.ts，注册 /code。package 与仓库 LICENSE 均为 MIT；coding-agent／pi-tui peers 为 *，开发依赖0.87.0不能证明0.86.1兼容。通过公开 sessionManager.getBranch() 取助手代码片段，没有助手历史时只有警告，不是有效交互覆盖；没有直接读取 session 文件。主来源精确 manifest／handler／UI／LICENSE／actions 链接见英文 C1～C5。

## 实际处理器要求的交互

以下首先是固定源码 S2 的推断；所有 dialog 均 await，包含嵌套创建 helper，没有提供 timeout 或 AbortSignal。

| 路径 | 方法与取消行为 |
|---|---|
| /sysprompt 菜单 | select；undefined立即返回；选 Add await创建；选预设写状态并反馈 |
| add 名称 | input；取消／空值返回，重复名提示后返回 |
| 可选描述 | input；取消变空描述，继续，不是整条取消 |
| 内容 | editor；取消／空值返回，不创建 |
| 应用模式 | select；取消默认 append，仍保存并激活 |
| edit surgical | editor 预填内容；取消／空值不变，非空保存 |
| remove surgical | confirm；false／取消返回，true删除，必要时清除激活状态 |
| list／on／off／名称 | notify／setStatus与同步本地状态，没有普通模型请求 |

建议覆盖 seeded surgical 与独立测试提示，含菜单／名称取消、描述取消后 editor 取消、编辑预填／更新、模式取消、删除拒绝／允许，并通过 list／状态反馈与隔离持久化核对，不编造通用完成事件。对照 /code 的 pickSnippet 使用 custom，公开 RPC 返回 undefined；显式索引可绕过 picker，但接受 Run 会执行 shell并打开 custom，Copy 调用外部剪贴板，Insert 使用 RPC 退化的 getEditorText／setEditorText。故不选为最小目标；本次不执行其 shell／剪贴板路径。

## 隔离与公开运行时边界

首选目标硬编码 join(homedir(), ".pi", "agent")，只设置 PI_AGENT_DIR 不足以隔离。它在加载时即可写默认 system-prompts.json，另有 system-prompt-state.json；不创建父目录且吞掉写失败，单凭成功通知不能证明持久化。必须先隔离有效 HOME 并创建 .pi/agent。这里是扩展自有 JSON，不是 pi session 文件。

完整源码没有 exec／child_process／网络client／模型调用／sendUserMessage／customTUI／直接 session 文件访问。before_agent_start hook 会改变后续任务系统提示，但管理命令不自行发起该任务。本检查只走公开 RPC prompt 的注册命令，不发普通模型提示；这不是 OS 网络沙箱证明。

根 package 与安装包均0.86.1。其公开 rpc.md 支持四类标准 dialog、RPC hasUI:true、custom返回undefined及fire-and-forget反馈。npm版本元数据 gitHead为13cbf77df2396303013a41646bcfa77b4271ae56；英文P1／P2给出固定公开RPC文档与版本元数据链接。固定远端文档与安装文档按换行归一化匹配。prompt成功可能表示accepted／queued／handled，不是统一命令完成；dialog ID只关联答复，不推出closed／outcome事件、全局取消或恢复架构。

## 调查验证与所有权限制

sidecar只在内存读取固定主来源与安装manifest／RPC文档；未加载扩展、运行宿主／探针／模型、安装依赖、clone或worktree，未读取凭证／秘密配置／.local-env，未修改其他文件或Gitindex。它只写英文调查。主代理负责翻译、选择与实际运行；下节独立记录后来发生的运行，不能反推sidecar做过。

sidecar文档检查通过内存排除.local-env的导出ignore集，未改配置；结构0错误、ADR0002的2个既有提示，i18n零错误／警告。不把此检查当兼容、WI关闭或归档证据。

## 选定目标与主代理实际验证

代理按本次决策委托选定首选固定目标。一个真实扩展的正常流程已覆盖全部四类标准dialog；追加customTUI对照只增加不支持范围，不提高本轮代表性。这是目标选择，不是confirm-only产品切片或通用兼容认证。profile／传输／恢复预算与完整产品接入仍在WI-013 Prepare。

未修改manifest、入口与MIT许可已下载到dist/delegated-completion-20260928/wi013-real-target/target/，source-manifest.json记录固定URL及SHA-256。加载前用相同清洁环境子进程证明os.homedir()等于自有home，见home-preflight.json；HOME和USERPROFILE均隔离且.pi/agent存在。实际pi0.86.1公开CLI使用offline／no-session／no-tools／no-discovery及唯一显式入口；未发送普通模型提示，无agent／tool执行事件。

probe.log／report.json通过真实菜单取消、名称取消、描述取消继续editor再取消、模式取消仍append保存、list读回、编辑预填／取消／更新、删除拒绝／允许，以及Stop时先取消描述、拒绝随后editor再观察已审阅awaited handler返回。只读取精确自有扩展库文件佐证持久化，没有读写pi session文件实现产品功能。探针完成后自有子进程SIGTERM退出。这不是宿主／profile／恢复验收，也没有新增通用command-settled断言。

## 加载与错误可观测性探针

主代理另用安装的0.86.1公开CLI／RPC运行五个自有合成入口，HOME／agent／cwd隔离，不发模型提示、不启用工具。证据为dist/delegated-completion-20260928/wi013-load-failures/report.json与asserted-probe.log。首次观察在预期启动退出处停止，first-observation.json／log保留结果；修正探针区分预期初始化失败与探针故障，并对每类结果断言：

- factory在注册前抛错，或注册命令后抛错，均以code1退出且无RPC应答；stderr含加载失败。无需解析错误文案即可判断启动未成功。
- session_start hook抛错产生公开extension_error，但get_state／get_commands仍成功。因此命令目录存在不等于初始化健康。
- 注册命令抛错产生extension_error，其prompt应答却仍success。不能让prompt成功覆盖错误事件或证明操作成功。
- 健康入口可在session_start调用公开getAllTools／getCommands，通过普通UI notify发送有界目录。这支持adapter握手设计，但不是认证，也不证明受信扩展不能伪造反馈。

仍存活的子进程均由探针所有者关闭并观察到SIGTERM退出；factory失败进程自行退出。结果用于后续ready／错误契约，不是产品兼容验收。当前生产adapter尚未处理一般extension_error，不声称侧栏已经正确呈现这些错误。目录API来源为安装包公开docs/extensions.md的“pi.getActiveTools() / pi.getAllTools() / pi.setActiveTools(names)”小节；错误事件来源为docs/rpc.md的extension_error小节。

## 宿主丢失后的观察可行性

另一个Windows三进程探针使用自有合成host、独立被动supervisor和真实公开pi0.86.1子进程，执行前述不合作合成命令。只结束host后，supervisor仍持有的pi child对新get_state公开请求作出应答，原命令未返回；观察期间没有自动终止child。随后独立的显式测试控制请求终止所持child，仍存活的supervisor记录实际SIGTERM退出。dist/delegated-completion-20260928/wi013-owner-loss/内report.json、probe.log和owned-process-audit.json记录断言及最终空PID审计。

这里只证明本机Windows上独立观察者的生存能力，不是生产恢复验收。夹具receipt故意不实现崩溃持久化协议；尚未加入应用进程owner、持久化、跨窗口准入规则或用户恢复操作。supervisor在记录退出前失败仍是unknown；持久准入、失败窗口与恢复域须在Build前决定。不以记录PID后发现其不存在替代所持child退出观察。临时路径均归探针所有，证据复核且无进程依赖前保留。

## Build检查点——宿主seam，不是验收

选定恢复设计现已记入Draft ADR 0002与v3契约；上文探针限制描述探针当时范围，不是当前待决阻塞。实现仍未完成。独立supervisor的9/9合成进程定向测试通过，覆盖owner丢失与显式终止；限定TypeScript／ESLint通过。证据为dist/delegated-completion-20260928/wi013-supervisor/supervisor-focused-execpath-final-20260927.log。实际runtime通过process.execPath及公开CLI入口启动。activation现已注入globalStorageUri下recovery-v1 owner，并构建／打包runtime-supervisor.mjs。该接线与定向测试仍不证明安装版恢复。

宿主现持有交互coordinator与v3投影，renderer替换保留当前表单，拒绝旧页面／重复应答，Stop观察前先取消表单，并区分注册命令完成与助手回复。原生显式文件选择和信任确认可在ready空闲时切换runtime，保留未发送文本及公开live-session指针；路径仅留宿主。已退休回复的迟到失败原会阻断新coordinator；新增失败测试复现后，用delivery revision隔离修复。上述仅是实现seam，不是第三方兼容或视觉验收。

dist/delegated-completion-20260928/wi013-recovery-tests/中的证据包括red／green-provider-chat、red／green-provider-interactions、red／green-provider-stop-interactions、red／green-provider-profiles和red／green-coordinator-retired日志。此前宿主目录定向72项、coordinator复核15项通过。恢复控制与共享UI整合后，当前compile、lint和全仓561项测试通过，见compile-owner-ui-final.log、lint-owner-ui-final.log、tests-owner-ui-deduplicated.log。首轮完整整合有3个失败：流式期间重复广播未变化的扩展投影，以及旧DTO类型清单。投影去重修复前两个流量回归，未放宽断言；DTO清单加入两个v3新投影。定向浏览器测试同时断言没有运行时错误。首次自定义测试命令误打包React而留下MessageChannel句柄，已记录并终止精确自有测试进程；修正runner遵循仓库React externals。新selector夹具位于自有dist/tests-fixtures/extension-loading，精确测试创建目录仅在使用完后移除。此前并行编辑中的全量失败继续保留，不用定向通过替代。

恢复控制现区分原生确认End和显式受控恢复，必须核对匹配终态ownership，不接受End应答代替。启动验证失败、提示交付不确定、命令lease期间dispose会自动终止managed child的问题已复现并修复，改为保留child／fence。wi013-owned-adapter/实际使用构建supervisor、当前adapter、公开pi0.86.1与固定真实目标：select取消及list返回两次handler lease，无模型执行；正常空闲退役先观察退出再清fence，精确路径进程审计为空。此无秘密隔离探针保留HOME／agent／workspace及证据至复核，不是原生F5或安装包验收。

有界标准反馈现已接入，包括只呈现editor-text而不修改草稿；8项纯store测试覆盖容量、keyed清除／替换、omission和不安全内容。真实目标owned-adapter探针已按当前源码重跑并观察notify反馈，旧report已保留。reply callback／drain容量及deadline、可暂停startup readiness分别测试，不混同人工等待；文本回复promise传播问题已红→绿修复。当前compile／lint／577项全仓测试通过，见compile-feedback-transport.log、lint-feedback-transport.log、tests-feedback-transport.log。

另用实际隔离Chromium加载production bundle与合成v3 bridge，覆盖四种表单及280×500、320×420、360×800。初始仅几何检查漏掉焦点字段被裁切；查看截图发现后，用焦点字段几何复现，再以focus及nearest滚动／margin修复。修正后12组几何与真实select／confirm／input／editor键盘提交、Escape取消通过；已打开查看截图。wi013-browser/保留失败／部分修复／通过report、截图、localhost／profile归属及最终精确profile空进程审计。仅深色英文浏览器证据，不替代全部主题语言或原生宿主。

进一步生命周期复核复现本地overflow barrier没有可达恢复控制的问题。宿主现只撤销一次交互transport，managed adapter保留child／fence至显式终止；定向测试禁止隐式End／recover。

两个新原生F5使用官方1.105.1调试器及隔离parent profile，并记录实际构建产物哈希。wi013-native-f5/的10项记录通过：原生F5启动、真实localhost回复、Stop／草稿保留、retry、非重试失败、延后模型切换、gated write／captured diff、撤销、compaction及其中Stop。wi013-native-extension/通过宿主公开文件选择器（隔离profile启用受支持files.simpleDialog.enable）和原生信任确认，实际加载固定真实扩展，再从UI取消select菜单；awaited command完成，没有假“无助手回复”错误。截图已打开查看。仅对应原生限定结果，不是安装版或完整扩展验收。

关闭各隔离宿主后，独立supervisor／child及未决fence按设计保留。实际恢复store在隔离f5-parent profile（child window复用该自有browser），不是传入的dev-profile路径。随后测试所有者通过owned control API显式End，核对匹配terminal receipt后另行retire fence；最后大小写不敏感的自有进程审计为空。此为实际F5所属进程路径证据，不是Webview End／Recover交互验收。所有profile和trace保留为证据。

原生截图还暴露空闲反馈面板占位过大的问题。红→绿修复为idle反馈可检查但默认折叠，可操作／错误交互打开。当前compile／lint／580项测试通过，见compile-overflow-disclosure.log、lint-overflow-disclosure.log、tests-overflow-disclosure.log；实际浏览器几何／键盘矩阵已在该修改后重跑。上述两轮native运行早于最后呈现修改，不冒称验证了更新后bundle。

仍须完成余下生命周期／恢复边界复核、更广原生真实目标dialog及Webview恢复矩阵、完整主题／语言／组合布局验收、最终原生F5及新安装包证据，以及ADR／gate／WI验收。没有额外关闭WI。失败supervisor夹具保留dist/tests-fixtures/runtime-supervisor下fence-Aj5lMM与fence-FoQVjc；它们是证据，不是获准存活的产品runtime。核对来源／证据且确认无进程依赖前保留。

### 原生与安装版恢复矩阵；空会话缺陷

后续wi013-native-extension-matrix/实际固定目标10项限定检查通过：原生选择／确认、四种表单、可选字段取消后续、editor预填／更新readback、否／是确认、Stop取消，以及隔离不合作注册命令。未确认Stop保留草稿并阻止Send／恢复；原生确认End后，只有观察到exit才允许另行主动受控恢复，随后新合成任务成功。截图已查看。失败尝试保留：一次夹具等待了刻意折叠的profile控件，另一次混用外页与iframe坐标。另有真实组合布局缺陷：blocked交互／恢复截图中composer超出视口。320×420浏览器红→绿复现后加入operations滚动区，修复后原生完整矩阵通过，没有放宽断言。随后文案修正为runtime连接不可用，不再声称未观察的child已经结束。compile-recovery-layout.log、lint-recovery-layout.log、tests-recovery-layout.log记录compile／lint及581项测试通过；原生矩阵仅早于最后文案修正。

wi013-package/pi-vscode-wi013.vsix由重新核对的14,070个生产依赖文件与当前声明产物组装，没有遍历排除的秘密配置。14,085个归档条目的资源校验通过。官方Code 1.139.1 CLI安装至wi013-installed/，包含supervisor的10个安装产物哈希与构建一致。首次直接调用可执行文件错误地打开GUI；记录并停止精确自有进程后，使用官方cli.js入口及ELECTRON_RUN_AS_NODE成功安装。未修改用户既有安装。

安装版attempt-3-pass/独立于F5通过10项：先真实localhost回复，再执行相同目标dialog、Stop、原生End、观察exit后恢复及新受控任务。恢复截图已打开查看。关闭隔离宿主后按设计保留owner；通过owner API显式End并另行retire得到匹配receipt，最后进程审计为空。此清理与成功的Webview恢复流程分别取证。profile、包、失败尝试与trace作为自有证据保留，核对完成且确认无进程依赖后再清理。

此前安装attempt-1暴露夹具焦点错误：新宿主的工作区信任modal仍在前台。关闭该editor再打开命令面板后夹具恢复。attempt-2暴露真实产品缺陷：fresh ready后首条assistant消息之前切换配置，试图恢复pi尚未持久化的会话，触发身份校验失败。本地pi 0.86.1 SessionManager._persist确认延迟至存在assistant才持久化。上述非空会话矩阵不能覆盖或豁免此缺陷。正在进行限定修复与回归测试；保存会话身份校验必须严格，不授权直接访问session文件。WI-013及ADR／gates仍未关闭。限定ownership模块静态复核没有发现具体可执行问题，但不是运行证据或整体功能验收。

随后安装attempt-5-full-themes-pass/重跑功能矩阵，并在实际宿主Light Modern、Dark Modern、Default High Contrast主题与中英文下检查活动input／editor／select／confirm。原生主题设置只写入自有profile／workspace，断言宿主实际body主题class、字段边界与活动值不变。远端literal标题不翻译。已打开查看浅色中文editor与高对比英文confirm代表截图。同轮还检查设置Escape／焦点、草稿保留、权限菜单边界、键盘thinking选择及Enter提交。此为正常高度窄侧栏检查，尚非短窗口验收。显式owner清理观察匹配receipt后，最后自有进程审计为空。

空会话修复前的最后安装轮次对精确自有原生窗口实际调整至1100×620后重复矩阵，不是模拟Webview视口：11项功能／呈现检查点、30项活动表单样本（包括两次确认）、6项普通呈现样本通过。已打开查看短窗口浅色中文editor截图，焦点editor与composer在各自滚动区域保持可达。resize helper最初因通配标题匹配三个自有native handle而拒绝操作；attempt-6-resize-fixture/保留失败。限定已验证自有进程的workspace窗口后只匹配一个handle，没有操作无关窗口。最后显式所有权清理及大小写不敏感进程审计完成。上述安装结果均对应冻结的581测试版本包，不冒称已覆盖正在进行的空会话修复。

### 重启检查点整合与后续实际宿主证据

空会话缺陷已按ADR的有界state／stats／state检查点修复。初版采用get_messages；整合复核发现长历史会撞上既有reader预算而不必要地撤销runtime。9MiB回归复现内容请求后，改用公开get_session_stats消除此问题。compaction后的活动branch与全部entry计数保持区别。拒绝保留旧runtime／草稿，严格saved identity不变。定向证据在dist/wi013-checkpoint-evidence/。整合compile、lint及全部620项测试通过，见compile-restart-checkpoint.log、lint-restart-checkpoint.log、tests-restart-checkpoint.log。

修订pi-vscode-wi013-checkpoint.vsix全新安装到wi013-installed-checkpoint/，10个安装产物哈希匹配。任何prompt前原生选择trusted再切回controlled均成功并保留未发送文本；随后完整目标／Stop／End／恢复、三主题双语及实际短窗口矩阵亦通过：12个检查点、30个活动表单样本、6个普通呈现样本。另在wi013-native-checkpoint/用官方1.105.1调试器实际F5独立通过11项，包含fresh-empty往返与完整目标／恢复流程。首次F5夹具在workbench页面出现前连接CDP，加入有界实际页面等待后修复，原始失败保留。两轮修订版实测均显式结束残留自有child、观察匹配receipt、另行retire fence，最后精确路径进程审计为空。这些检查早于下一轮生命周期边界复核，本身不关闭ADR／gates。

另有冻结包证据保留在wi013-installed/：renderer-recreation-report.json记录实际Developer Reload Webviews命令、不同Webview frame恢复未决真实目标description表单且未提前settle，随后取消后续并完成handler。恢复表单截图已查看。host-reopen-report.json记录关闭整个宿主且保留未决自有child，再用相同隔离profile打开新宿主，Send／恢复被阻止、原生End、观察exit、单独受控恢复及主动新任务成功。新宿主正确要求重新明确选择项目资源；初次夹具遗漏此选择，失败保留在host-reopen-attempt-1/，没有以恢复旧权限状态绕过。最后清理同样观察精确owned exit，进程审计为空。

仍须生命周期边界诊断（包括启动人工等待期间失败、有界取消）、必要最终重构建／重验、验收复核与WI／ADR／gate收尾。尚无已确认外部硬阻塞。新增证据目录只保留agent自有测试／输出，唯一证据妥善保留且排除进程依赖后可清理。

后续生命周期边界复核复现并修复启动dialog handler抛错、readiness暂停期间startup extension_error、identity预算耗尽但adapter未撤权的问题。故障现使startup结束并撤销transport，同时保留owned child／fence至显式恢复。标准dialog自动取消（无handler、controlled profile、aborting）现共享replay registry与有界writer；有效／畸形请求的pending取消均保留outstanding lease，disposal不能静默自动End不确定工作。定向测试断言无自动End／recover／直接kill，同时保留健康无限人工等待及Stop取消链。证据：dist/wi013-checkpoint-evidence/dialog-fault-regression-results.txt及内存测试loader。根代理整合compile／lint及全部630项测试通过，见compile-dialog-faults.log、lint-dialog-faults.log、tests-dialog-faults.log。本次后续只改runtime实现／测试，不冒称上述620版本原生／安装报告覆盖此后修改。仍须更新实际runtime／F5／包验证与验收复核。approval gate答复transport是不同的既有路径，不在此次标准dialog修复中改变。

### 验收复核发现与真实启动探针

冻结630测试版本包pi-vscode-wi013-dialog-faults.vsix在wi013-installed-dialog-faults/独立通过安装完整矩阵，10个安装产物哈希匹配，包含实际短窗口／主题表单与显式owner清理；深色英文input截图已查看。该证据早于下述复核修正，不作为后续修正验收。

对baseline HEAD 59dbb09及当前未跟踪实现的两份独立只读限定复核发现具体问题。Spec轴：带凭证样式词语的用户literal答复被静默丢弃；UTF-8超限答复在host拒绝前把表单禁用；Stop采用连续五秒预算而非选定单一deadline。Standards轴：owner.launch在启动取消后返回可能重新接入过期transport；同一静默丢弃答复违反诚实失败规则。这些是限定源码推导发现，不是全分支审查或运行测试。literal答复已红→绿修复：用户编写的有界字符串保持原样，runtime传入metadata的凭证过滤仍有效。无效答复在消耗capability前抛错。green-literal-answers.log记录10项dialog测试通过，红证据保留。UI预算、runtime竞态／deadline在互不重叠源码范围内继续修正。

wi013-real-dialog-faults/通过built supervisor与自有fixture扩展运行实际公开pi。host dialog handler失败与pending startup表单期间extension_error均使readiness失败，并保留精确pending owner直至显式End／receipt／recover。接下来的无handler用例并未证明成功取消／ready：在session_start内部await UI的扩展在ready前退出。初次cleanup断言遮盖原始失败；第二次同时记录启动结果与terminal receipt，取得证据后才retire。失败日志／源码均保留，最后进程审计为空。核对固定公开RPC实现后确认初始化次序限制，已记录ADR0002。不得宣称四用例启动探针全通过，也不以合成单测替代此失败的真实次序。

### 复核修正已整合；仍有custom-tool准入缺陷

复核的四个独立问题已分别红→绿修正：有界literal答复、双语可编辑／取消的UTF-8超限错误、取消后晚到的owned launch、单一绝对五秒Stop观察deadline。根代理compile／lint及642项测试通过。随后实际公开pi探针通过两个startup失败路径与三个注册命令路径（自动取消、17秒人工等待、精确传输带凭证样式词语的合成literal），另有真实晚到owned launch取消实测，无重新接入／事件／自动End。失败的awaited-startup探针独立保留，没有改称通过。

642版本原生F5通过13项，含超限input／editor修正；其新安装矩阵在错误修正及主题／语言切换后发现短窗口再聚焦缺陷。第一张截图还显示夹具焦点竞态，但等待设置焦点恢复后几何断言仍失败。第二张截图确认真实聚焦editor上沿被滚动区裁切。增加再聚焦回归先失败，再通过每次活动表单focus时nearest滚动修复。compile-form-refocus.log、lint-form-refocus.log、tests-form-refocus.log记录compile／lint及全部643项测试通过。更新pi-vscode-wi013-refocus.vsix通过安装14项、30项活动表单主题／语言样本和6项普通呈现样本，实际窗口1100×620，10个安装产物哈希匹配。另以未修改官方调试器重新执行原生F5，加入修正后字段focus／边界断言。wi013-native-review/保留642 baseline；wi013-installed-review/保留两次失败再聚焦及成功643报告。两者均显式End、匹配receipt、另行retire后最终精确路径进程审计为空。原生超限editor截图已打开查看。

进一步实际custom-tool探针发现合成gate测试未发现的实现缺口：adapter对trusted扩展仍传入只有controlled内置工具的--tools allowlist。pi 0.86.1公开选项也过滤扩展／custom tools，导致owned_counter不在公开getAllTools或合成provider inventory中。tool-not-found且审批callback零次不是拒绝审批证据。严格Deny／Allow-once／再次Deny探针正确失败，已显式清理，进程／端口审计为空。证据：wi013-custom-tool-probe/EVIDENCE.md与report.json。正在限定修正启动参数并重跑；不会以custom tool不可用来验收gate／ADR／WI。

custom-tool修正现已实现：controlled仍传入精确八工具CLI allowlist；trusted省略会过滤inventory的该选项，依靠未改变的bundled gate公开inventory验证／激活。未放宽数量上限、override拒绝、membership或审批政策。启动参数回归由红转绿。全新实际pi attempt2确认精确八内置工具加owned_counter、三个不同custom审批请求、Deny零执行、Allow once执行一次、相同载荷再次Deny后总次数仍一。先取得匹配terminal证据再retire，最后进程／provider listener审计为空。原始失败保留attempt1。根代理整合compile／lint及全部645项测试通过，见compile-custom-admission.log、lint-custom-admission.log、tests-custom-admission.log。仍须更新原生／安装版runtime准入验证；643视觉矩阵保留其精确版本范围。dist/wi013-answer-ui-tests/及dist/wi013-runtime-review-tests/的定向复核bundle保留用于红绿复现，唯一证据保存并排除进程依赖后可清理。所有复核／取证agent均已关闭。本检查点没有再关闭WI／ADR／gate。
