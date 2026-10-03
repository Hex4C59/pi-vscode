# WI-091 — PI-GAP-01 剩余队列输入

[English](2026-10-03-wi-091-queued-inputs.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-03-wi-091-queued-inputs.md](2026-10-03-wi-091-queued-inputs.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-04
- Type: Discussion
- Status: Archived
- Created: 2026-10-03
- Authority: 历史方案、批准及代理委托验收；当前行为归属 PRD 与 Living 消息契约
- Related: [ACTIVE](../../ACTIVE.md)、[功能差距](../discussions/2026-10-01-pi-feature-gaps.zh.md)、[WI-077 方案](../archive/2026-10-02-wi-077-approved-proposal.zh.md)

## 请求与批准

维护者于 2026-10-03 要求优先完成 PI-GAP-01。这选择了下一工作焦点；任务单另行要求的附件／命令边界随后经维护者回复「确认」批准，见下文。WI-090 停车，不验收或关闭。Prepare 未修改应用代码、依赖、凭据或 Git 提交，也未运行 runtime 探针。

Decision class：`none`；Gate ID：`none`。这是 REQ-004/005 及既有附件需求下的用户可见切片。Build 前须在双语 PRD 补充可观察行为、失败状态及 WI 追溯，并取得明确范围确认。既有纯文字验收与过去代理验收授权不接受本切片。

## Prepare 基线证据（历史）

- 声明及安装的 coding-agent 均为 0.86.1。`src/extension/queue/queuedTextSession.ts` 仅接纳文字，恢复目标须为空且无附件；`src/extension/queue/queuedTextLedger.ts` 拒绝 slash 开头输入，共享 32 条／256 KiB UTF-8 预算。
- 既有附件为整文件与固定选区文本，每份草稿最多 20 项／1 MiB；见 [README](../../README.zh.md) 与[附件契约](../reference/webview-messages.zh.md#wi-014-附件事务契约)。这不证明草稿能装入更小的队列预算。
- 已安装上游 `dist/core/agent-session.js` 的公开 `steer`／`followUp` 会展开 skill 命令及提示模板，拒绝扩展命令，并应用 input handlers；RPC `dist/modes/rpc/rpc-mode.js` 委托这些 API。展开可能改变文字，RPC 成功不证明模型已消费。这是静态发现，不是新 runtime 验证。
- 须同时复核既有[队列契约](../reference/webview-messages.zh.md)与 host ledger：只删除 slash 拦截会留下展开后输入归属／恢复的问题。不能借普通 `prompt` 绕过队列限制或立即执行扩展命令。

## 有界范围——2026-10-03 已确认

1. Steer 与 Follow up 均支持既有整文件／选区文本附件；不含图片、编辑器缓冲区保存、新持久化或新附件格式。保留源码变化确认；最终 revision／session／eligibility 检查后才接纳 host 不可变快照。完整编码输入或恢复保留超过既有队列预算时，发送前拒绝整个请求，不静默截断或提高预算。
2. 支持已发现的 skill 命令／提示模板及参数，由公开 pi API 展开。已识别但不可排队的内置／扩展命令显示明确忙碌错误并保留草稿，不执行、不转为普通聊天、不隐式延后。未知 slash 输入明确拒绝，不静默改释。遵守资源加载选择，不为补齐命令启用 Trusted 扩展。
3. 原始草稿文字／附件快照与上游展开后的队列文字分开保留。显示与取回区分 steering／follow-up，不将接纳当成执行。仅经显式动作恢复原输入及快照到空草稿；不覆盖新编辑、不静默重读变化文件、不自动发送。保留限于会话内 host 内存及既有有界预算；上游敏感展开不能原样投影至 Webview。
4. Stop 保持 clear_queue 后 abort。delivery-unknown 明确显示不确定，不自动重试，也不承诺恰好一次投递或安全重发。先通过代表性公开 API runtime 证据确认展开归属，再声称恢复正确；API 无法证明身份时保留不确定性，不根据相同字符串猜测。

## 责任、路径与失败方式

预期涉及：`src/extension/draft/` 的快照／提交责任、`src/extension/queue/` 的保留／恢复责任、`src/adapter/runtime/rpc/` 的公开 RPC 编码／生命周期、allowlist 契约、输入框／命令控件及中英文本、相关端到端工件、双语 PRD 与消息契约。实施前读取匹配的 TypeScript／testing／pi-integration／UI／architecture 路线。不增加通用 bridge、Webview 文件系统访问、直接会话文件编辑、pi agent loop 重实现或依赖升级。

实施前先写端到端失败场景：错误命令分类、模板缺失／变化、重复文字或转换后输入误归属、input handler 消费、展开后容量溢出、文件／选区变化确认、队列预算耗尽、准备与 Stop／会话切换竞争、晚 ACK／断线、部分 clear／abort 失败、取回与消费竞争、覆盖非空／新草稿、视图重建、凭据类展开、重复点击与不确定投递重放。失败请求须可恢复或明确不确定，不能静默丢失或重发。

## 可观察验收与交接

确认范围后：两种模式分别发送附件及代表性模板／skill 参数，观察展开和不同队列状态、消费／取回、Stop 与失败恢复，不重复发送；覆盖拒绝与容量边界。运行 compile、lint、相关测试及文档验证，浏览器中英／窄宽／键盘检查，隔离合成供应商下的真实 pi、macOS F5 与安装 VSIX。保留可重复日志／报告及源码／包身份，区分合成供应商与真实模型证据。缺真实宿主证据或维护者验收时 WI 保持未完成。

历史 Prepare 交接（已被下方批准替代）：仅 Prepare，等待上述四项范围确认。WI-091 未进行产品构建、行为测试、模型调用、F5 或安装 VSIX 验收。文档验证结果在聊天报告；通过不授权 Build，也不关闭 PI-GAP-01。既有 ACTIVE／功能差距及 WI-090 改动保留，与本方案分开。

## 批准与实施

2026-10-03 维护者回复「确认」，批准有界方案、实施及代理执行验证／交付；不授权 Git 提交或付费模型。无凭据公开 SDK 实验确认，无 tools／extensions／默认资源的内存 AgentSession 可经 steer／clearQueue 展开选定模板，不调用模型。有界隔离 helper 仅捕获当前 runtime 清单的选定资源，经公开 API 展开，再与显式附件快照合并后写入真实队列。资源正文为接纳时快照，不声称等同上游缓存资源。原输入分开保留，转换后／歧义上游身份显示 unknown，不猜测。沿用既有有界 helper 子进程策略，不扩张资源信任、不直接访问会话文件、不重实现 agent loop／provider。端到端测试及失败场景先于生产改动编写。

## 交付证据 — 2026-10-03

实施沿用批准的责任边界，不升级依赖或验收新 ADR／gate。helper 打包为 `dist/queued-input-worker.mjs`，VSIX 声明包含并要求此工件；普通 prompt 限额不变。host 独有 opaque 队列输入身份避免相同附件包折叠；原始保留及编码文字共计共享预算。adapter 释放／Stop 取消展开，最终接纳重新核对草稿／源／会话；不确定丢失保留原快照及较新未发送上下文，不重放。

实际检查针对基于 `ee99df0c81887d6c89112cf628289bb8c2c8b4ba` 的未提交开发树：

- `npm run compile`、`npm run lint`、`npm test` 通过：**1320 项，零失败／取消／跳过**，包括行为改动前编写的 13 个 provider／原生草稿／公开 SDK 集成场景。六份模式／资源恢复报告在 `dist/wi091-e2e/`；最终完整日志在 `dist/wi091-handoff/wi091-final-{compile,lint,tests}.log`。
- 固定 pi 0.86.1 的真实 runtime／生产 adapter，加可暂停的合成 loopback HTTP 供应商：模板／skill 展开及快照上下文、两类队列、显式 clear、非排队命令拒绝、先消费 steering 再 follow-up、先 clear 再 abort 通过。`dist/wi091-runtime/report.json`、`run.log` 及可重复 `run.mjs`；一个拥有的启动／关闭，**真实模型调用为零**。这不是原生 UI 证据。
- Headless Chrome 的实际预览入口：**18** 份 en／zh-CN × 暗／亮／高对比 × 280／320／400 px 队列渲染，无观察到横向溢出；Escape 关闭上下文选择器，Tab 聚焦按钮，显式 follow-up 取回恢复命令而不发送。`dist/wi091-browser/report.json`、截图及 `run.mjs`。预览为合成 host，不代表 SDK 或原生编辑器；人工查看了中文 280 px 高对比截图。
- 安装 macOS VS Code 1.140.0／arm64、pi 0.86.1：忙碌时添加原生选区、模板引导、显式取回原文字／快照并重新排队、skill 跟进、内置命令拒绝且保留草稿、Stop 取回两类、只读原文快照预览及中文恢复标签通过。`dist/wi091-native/installed-report.json`、`installed-run.log` 及截图；产品路径在独有 `queue-ext` 下，不是仓库源码。VSIX SHA-256 **33a3cab55aa2a95ff1a16718aec2a56a50e5e67ba955af16c756526594c5f4be**，150723897 字节；提取包验证也通过。

未单独重拍原生整文件 picker；整文件／固定选区接纳和恢复由集成矩阵覆盖，原生 lanes 验证固定选区。真实消费由独立 pi 探针验证，不从原生 pending／ACK 推断。未建立真实模型、日常 profile 安装、凭据迁移、公开发布、Windows／fork 兼容或干净提交 release 验收。保留 WI-090 及功能差距既有改动。旧 form／preview／settings 选择器、临时路径规范化、空草稿控件就绪及原生选区稳定等 harness 失败保留在本地逐次报告，只把成功完成的 lane 计为验收。独有原生进程清理另行核对。本地工件是 Git 忽略的开发证据，不是永久发布的 CI 包。

## 中间交接 — F5 完成前的 Verify（历史）

维护者确认授权代理验证，但必需的 F5 验收**尚未通过**，因此不关闭／归档 WI-091 或整个 PI-GAP-01 剩余范围。实际 F5 启动开发 checkout 并初始化／暂停真实 pi 任务；原生选区捕获反复因空范围拒绝，观察截图显示 harness 流程中合成编辑器的首行被未保存的空白行替代。后续整文件 picker 自动化也在接纳附件前超时。这不证明产品队列附件失败，也不足以证明 harness 根因；不把尝试／失败的 lane 算作通过。当前 F5 失败报告／日志：`dist/wi091-native/f5-report.json`、`f5-run.log`；逐次失败报告保留，最新运行 `cleanupRemaining: []`。

下一步：正确限定原生编辑器选区或 file-picker 交互，完成 F5 开发 checkout 两种模式、显式恢复／Stop 和冻结快照预览。不得削弱产品源校验、以直接 Webview 消息替代原生捕获、安装到日常 profile 或调用真实模型来获取通过。安装 VSIX 证据独立有效。

当前文档检查：`npm run docs:verify` 通过（零错误，既有 Draft ADR0010 两项警告）；`npm run docs:health` 通过（零错误／review notice，同样两项既有警告）。语义检查覆盖改动的 PRD 切片、README、当前队列契约、批准范围及证据；契约已明确标记 WI-077 纯文本限制为历史。未改无关 ADR0010，也不进行全库文档清理。`git diff --check` 通过。开发源码快照／manifest 和验证汇总在 `dist/wi091-handoff/`；未作 Git 提交，不将本地证据算作干净源码 release 验收。

## 完成与归档 — 2026-10-04（上海时间；UTC 为 10 月 3 日）

维护者追问为何停止验证后，代理继续解决原生 lane，而非把验收留给维护者。harness 的命令面板快捷键使用了错误的 macOS native key code，并把隐藏的 Quick Input 当成可见；随后 Enter 可能编辑所选合成文档而非选择命令。修正后的测试使用 macOS `KeyP` native code 35 与 `rawKeyDown`，等待**可见** Quick Input，再点击精确的原生命令行，不向隐藏 picker 发送 Enter。未削弱产品校验，也未为制造通过而修改应用代码；旧失败报告仍是历史失败。

2026-10-03 实际 **F5 通过**：独有 root `/private/tmp/pi-acc-URb8SZ`，VS Code 1.140.0／Darwin arm64，固定 pi 0.86.1。身份 helper 报告开发扩展路径 `/Users/hex4c59/Code/personal/TypeScript/pi-vscode`（源码版本 0.0.1），不是安装包。忙碌时添加原生固定选区、模板引导、显式取回原输入／快照后主动重新排队、skill 跟进、拒绝内置命令、先 clear 后 abort 的 Stop 取回两类、完整不可变原生快照预览及中文恢复标签均通过。原生快照为未保存的 38 字节选区，不是自动保存缓冲区。`dist/wi091-native/f5-report.json`、`f5-run.log`、七份 `f5-*.png` 行为截图及可重复 `run.mjs` 保留证据；`f5Dispatched: true`、`failures: []`、`cleanupRemaining: []`。独立安装报告仍归属其独有安装扩展路径，未用真实模型或日常 profile 安装。

批准的验收 lanes 已完成：集成／行为回归、公开真实 pi 探针、浏览器、实际 macOS F5 及安装 VSIX。依据维护者明确委托验证／交付的批准，**WI-091 与有界 PI-GAP-01 剩余范围验收关闭**。不包含图片、任意扩展命令、其他平台、干净提交 release 包装或新 gate／ADR。未独立重拍原生整文件 picker，其行为由集成测试覆盖，两类原生宿主验证固定选区队列；关闭不抹除这些证据边界。

归档原因：批准的 WI 及原生验证阻碍已完成，方案和中间交接不再是当前工作。当前行为／限额保留于 [PRD](../product-requirements.zh.md)、[消息契约](../reference/webview-messages.zh.md)及 [README](../../README.zh.md)。双语记录一同移动，更新已关闭 WI 索引，从 ACTIVE 移除 WI-091，不推进无关任务。WI-090 及用户既有改动保持。最终 compile／lint／回归及文档／健康检查结果保留于 `dist/wi091-handoff/`，源码 manifest、patch、新源码副本、原生包身份及旧失败工件可恢复；未授权或创建 Git 提交。

2026-10-04 上海时间最终交付（UTC 仍为 10 月 3 日）：compile／lint 及全部 1320 项回归通过；docs:verify／docs:health 通过，仅既有 Draft ADR0010 两项警告；git diff --check 通过。F5 及安装运行证据采集于 2026-10-03。最终重新构建的 extension、隔离展开 worker、Webview JS／CSS 与已验收安装 VSIX 逐字节一致（`dist/wi091-handoff/production-code-identity.json`）；之后仅改文档／归档。未将可选 CUA fixture 计入验收，其准确拥有的进程已清理。源码副本保存在压缩快照中，避免文档扫描误把复制的 Markdown 当成第二份仓库。
