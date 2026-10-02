# WI-082：实际资源加载报告

[English](2026-10-03-wi-082-resource-report.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-03-wi-082-resource-report.md](2026-10-03-wi-082-resource-report.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-03
- Type: Reference
- Status: Blocked
- Created: 2026-10-03
- Authority: PI-GAP-02 有界 Prepare、Build 与验证记录

## Prepare 和批准

范围：PI-GAP-02，REQ-004/009。PRD 判定：用户可见；增加原生命令 `pi: Show Resource Loading Report` 和自动更新的只读文本报告。批准依据：[本次八项目标授权](2026-10-03-eight-gap-goal.zh.md)。Phase：Prepare 完成，Build 已授权；Gate ID：none；Decision：none。只报告证据，不启动／重载 runtime，不读取上下文全文，不改变信任、依赖或持久化。

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
