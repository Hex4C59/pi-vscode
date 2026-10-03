# WI-086 — 当前项目已保存会话搜索

[English](2026-10-02-wi-086-session-search.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-02-wi-086-session-search.md](2026-10-02-wi-086-session-search.md)
- 原文版本：f0d13c7
- 最近同步：2026-10-03
- Type: Discussion
- Status: Accepted
- Created: 2026-10-02
- Authority: 历史Prepare及Goal有界代理验收
- Related: [ACTIVE](../../ACTIVE.md)、[Goal](../discussions/2026-10-03-eight-gap-goal.zh.md)、[需求](../product-requirements.zh.md)

## Prepare、现状与授权

有界 Goal 批准当前项目搜索、命名筛选／排序，不做全局发现或自动恢复。WI-085 已提交、干净候选通过但保留原生阻碍，本项为唯一当前 WI。已核对 SessionBackend／worker protocol、公开 pi 0.86.1 SessionManager.list 签名、metadata／边界、host catalogue／恢复、client 分页与 CandidateSessions。worker 已用公开 SessionManager.list(cwd, undefined, progress, signal) 获取整个当前项目 catalogue，逐项核对 canonical cwd、投影有界名称／首条消息，再按 16 项 recent-first 分页。不用 listAll、不解析会话文件；保留恢复确认和 stop／inspect／start 顺序交接。

## 方案、合同与需求／架构影响

搜索整个批准 catalogue 的既有有界标题／名称与首条消息预览，不是当前页；明确 metadata 搜索，不宣称 transcript 全文。无 allMessagesText／整会话／正文索引／持久 query。字面 Unicode 规范化、不区分大小写；named-only 仅非空白名称；recent／oldest／name 排序、id 稳定决胜。先筛选排序再 16 项分页；total 为筛选计数，目录变化后超出页 clamp 至末页。query 最多 256 UTF-16 字符，固定 boolean／sort 枚举，host exact allowlist。

v3 具名 searchSavedSessions 仅传 query／named／sort，host 拥有已应用 criteria；新搜索重置 page／catalogue。既有刷新／分页／rename 刷新沿用 criteria。session state 增加可选 metadata DTO，保持旧 fixture／默认兼容。紧凑 form 显式 Search／Enter、Clear、命名 checkbox 与 sort；输入不自动请求或恢复。busy 禁用控制；无结果区别于无会话，错误可重试；新搜索失败不冒用旧行。工作区／generation 替换、取消／dispose 和恢复保持原串行 owner。

公开 progress／取消加返回数组校验，将完整枚举限制为 5000 项，保留既有 15 秒 worker 截止；超额／无法证实完成必须 catalogue-too-large／unavailable，不把截断搜索说成完整。无跨项目 list、新会话目录、正文搜索、资源同意或持久化变更。REQ-008/009 用户切片；worker 转换、host 状态准入、UI 仅展示，沿用 VS Code tokens。

## 编码前失败方式

仅筛当前页、旧 criteria 分页、总数／tie 错、越界页、命名空白、Unicode／大小写错、regex／脚本解释、超长／畸形／额外字段、超预算静默截断、取消／迟到覆盖、跨项目行泄漏、扫描错误说为空、新查询失败显示旧行、自动恢复、确认／Stop／rename 协调丢失、query 持久／日志或收集全文、Enter 误发 chat、翻译／窄／HC 裁切或焦点键盘不可用。

## 可观察验收与工件

编码前准备 worker→公开 SDK 边界组合（超过 16 项合成会话），跨页 query／named／sort／count／clamp、畸形 query／超过 5000 失败；provider→backend 搜索／分页／刷新／错误／迟到与恢复确认；mounted production 输入／应用／清空／控制／空／错误／键盘和具名 client intent。不在代码后补单元测试。compile／lint／npm test／docs:verify、提交后干净候选／打包；真实隔离 SDK worker 只读由公开 SessionManager 创建的合成会话，观察 child 关闭，留 JSON／TAP。真实浏览器英中、280／320／400、三主题／键盘仅合成 host 渲染；F5／安装 VSIX 单独要求项目搜索／筛选／排序／分页／恢复确认，隔离 Code 绑定仍受阻，不是验收。工件 dist/goal-eight/wi086/；Prepare 无实现或通过声明。


## 开发检查点

编码前准备六项 worker／host／mounted 场景。初始 host 与 mounted red 为有效缺失功能失败，worker fixture 最初参数顺序错误；修正后将已准备场景对归档的实现前 e4b3e35 重放，六项均因缺失搜索行为／schema 失败。red.log 与 red-corrected-baseline.log 分开，不把最初 worker 错误冒充功能证明。现六项通过，未在代码后补单元测试。标准检查发现旧 list 要求精确原 signal：保留旧请求原 signal，仅 search 请求组合预算取消。spike 转发器还须 windowsHide 显式放最后，已修正，未削弱策略测试。

compile／lint／1248 检查在受限环境、隔离 HOME、空 auth、独立 PI agent／tmp 下通过，无继承 tokens／proxy／options（compile-isolated.log、lint-isolated.log、tests-isolated.log、check-isolated-exit.txt）。更早标准运行继承 shell 环境，不作为隔离用户状态证据；后续干净候选也使用受限环境。worker／backend 为组合而非原生证据。node scripts/spikes/spike-session-search.mjs 使用公开 SessionManager 创建、生产 worker／backend：当前项目 40 合成会话及另一项目 sentinel，20 命名项、跨页匹配、排序／计数／页 clamp、无结果、>5000 明确拒绝。七个 owned workers 均观察关闭，无推理或真实账户。JSON／TAP 在 dist/goal-eight/wi086/。

真实浏览器英中、280／320／400、浅／深／HC 截图已覆盖；长暂存 query／命名／排序表单无横向溢出，中性 checkbox 与未应用提示明确旧结果／分页仍用已应用条件。PreviewBridge 尚未实现新搜索操作，截图仅证明控件渲染／暂存／焦点，不证明应用后结果；production mounted client／host／worker 证据分开。原生 F5／安装搜索、分页／恢复同意仍受隔离 Code 绑定阻碍，不豁免验收。实现未提交，下一步 scoped 审查／本地提交／干净候选。


## 提交候选与交接

实现 4bb653cfc6e01676183a5183de76aec10907ae1a；完整 scoped staged diff／commit:check 已审查，用户 gap 讨论／ACTIVE 分组保留。末次审查把 5000 上限限定为搜索，旧非搜索 list／inspect 语义不变。两次开发完整复查在未修改 frozen-history 的最后消息断言失败；聚焦、66ba52b 完整基线及随后当前完整运行通过。失败／聚焦／基线日志保留；间歇根因未确定，不放宽断言。

/tmp/pi-resource-candidate-vQqd8G 干净源码候选：curated env／隔离 HOME／空 auth／agent／tmp 下 compile／lint／1248／docs:verify（旧 ADR 两警告）／docs:health／实际 SDK／package:vsix 通过。前后 status 空，源码 SHA／命令／版本／日志在 dist/goal-eight/wi086/candidate-evidence/verified-candidate 与 candidate-identity.json。7 个 worker 实际关闭、零推理；打包不等于安装。候选英中 280px HC／键盘焦点证实暂存控件无溢出；旧 18 图开发矩阵分开，不是提交后矩阵。preview 不处理搜索操作。

本次授权下的代理验收：组合／公开 SDK 与有界候选检查支持该切片；native F5／安装搜索／筛排页／恢复确认／视觉仍未验证。不是维护者亲测，不关闭 WI。PI-GAP-24 保留阻塞待安全隔离 native app 绑定解锁；WIP=1 继续独立 Mermaid 调查。


## 重新启动原生 Prepare — 2026-10-03

旧 app 绑定阻碍已解除，WI-085 已关闭。本项是原有有界授权下唯一 WI，不增加产品范围；4bb653c 既有实现不变。公开 pi 0.86.1 SessionManager.create／appendMessage／appendSessionInfo／appendModelChange／appendThinkingLevelChange 在隔离 HOME／agent 创建 40 项自有当前项目会话及三项可辨识其他项目 sentinel。不直接编辑会话文件，不用 listAll／凭据／推理，不自动恢复；现有原生明确恢复确认是唯一同意入口。

工具编码前准备 subprocess 契约：隔离 F5／安装、公开 SDK seed 收据、缺少逐项 review、安装失败、native 非零退出、零推理、provider 清理。失败方式：seed 错项目／模型、其他项目泄漏、仅当前页匹配、暂存条件误当应用条件、页／数／tie／排序错误、取消改变当前会话、确认前恢复、SDK 失败静默、无证据接受、旧 app 绑定、自有进程泄漏。普通 observer 只要求明确逐项 review，不替换 VS Code API 或批准 UI。

原生可观察验收：40 项仅当前项目；跨页 literal query；named 筛选；name／recent／oldest 排序；先筛后页及刷新一致；清空／无匹配；取消保留当前会话；明确恢复合成会话且无自动恢复；英中键盘及受影响窄／主题视觉。独立 F5 与安装 VSIX 须实际源码／包身份、PNG／AX、零 loopback 推理、正常自有退出与 provider 关闭。模拟契约、实际公开 SDK、F5、安装证据分层；原生仍待执行。


## 原生工具检查点

五项编码前契约因缺工具失败（red.log）。首次实现四项合成 subprocess 失败：假仓库 ESM 标记影响假 Code 可执行文件加载；只将标记移到假 SDK 目录修复。现五契约通过，包括公开 SDK create 调用当前40／其他3、缺 review、安装失败、非零退出及清理。开发 compile／lint／1292／docs 通过；native 与提交候选仍待执行。日志 dist/goal-eight/wi086/native-harness/。


## 原生验收与关闭 — 2026-10-03

干净候选d654011（原实现4bb653c）compile／lint／1292标准检查／docs:verify／docs:health／打包／实际公开SDK probe通过，前后源码干净。首轮完整运行未改frozen-history最后消息断言失败，聚焦及未改源码完整重跑通过；test-first-failed.log／focused-history.log保留，根因未证明，不弱化断言或称每次通过。VSIX SHA256563ddcf26fbc34b36a807443cd8a6cfee1c5bb0186381e5c6ef2fcbb4f3e3742；命令日志dist/goal-eight/wi086/native-candidate/。五编码前工具契约RED→GREEN；假ESM首次错误单独保留，不冒充native。

独立实际macOS F5 pBEoef／安装cEsfq6，Code1.140.0／pi0.86.1；公开SDK各seed当前40／其他3，native16／16／8页40唯一行，FOREIGN_ONLY及assistant-only SYNTHETIC_REPLY无匹配。Enter named0001跨页找到且不恢复；named/name20项16+4递增，recent0039递减／oldest0001递增。刷新回第一页保留named/name条件；Clear重置空／非named／recent；无匹配明确，暂存条件未Search／Enter前明确未应用，不发送chat。实际macOS恢复modal Cancel保留Untitled及KEEP_SESSION_DRAFT；明确恢复自有Named0039清草稿显示2条历史、零推理。无真实用户会话／凭据／账户。

各lane十八实际native PNG／AX及只读iframe尺寸：英中280／320／400×Dark2026／LightModern／DarkHighContrast，contactsheet已视觉审查。标签换行、搜索操作筛排分页有界；行与英文默认sort尾部可省略，完整AX／展开选项可用。中文Enter查询／长暂存query Tab／展开sort Escape及安装英文展开长query焦点实际记录。工件dist/goal-eight/wi086/native-f5-d654011/和native-installed-d654011/含逐案身份安装seed结果退出provider。F5产品0.0.1干净clone，安装产品0.86.1自有extensions根，仅observer为开发。review-complete后正常Cmd+Q；main／wrapper0，provider关闭零请求／真实调用，自有PID23067／25368已消失。

限制：畸形／超预算／过期失败为组合及实际SDK证据，非native强制失败。Code内置认证禁用警告保留，不宣称修OS keychain或宿主零网络。F5首次command焦点文字进入暂存query，Clear安全重置后核对真正command焦点；marketplace只高亮未执行。初次typed只读Console表达式不完整，改完整可访问输入，无产品修改。安装theme快捷键首次symbolsearch，Escape重建焦点后选本地theme；尝试不当成功证据。

重现：干净提交检查／打包，node scripts/spikes/spike-session-search.mjs实际SDK worker；node scripts/spikes/session-search-native.mjs f5实际F5／资源同意／十案；独立node scripts/spikes/session-search-native.mjs installed dist/pi-vscode-validation.vsix。只公开SDK seed，不直改会话文件；lane实际观察后写review再正常退出。

**本次授权下的代理验收：** PI-GAP-24／REQ-008/009有界切片接受，WI086关闭，非维护者亲测。metadata／当前项目／已应用criteria／恢复所有权保留，无正文全局持久发现／权限／上游架构变化，Gate／Decision none。语义健康检查核对需求／worker／host／client／工件，修导航归档旧检查点，保留历史失败及延期无关ADR0010／WI088警告。余PI21／PI26local，上传敏感收集未批，Goal／ACTIVE未complete。
