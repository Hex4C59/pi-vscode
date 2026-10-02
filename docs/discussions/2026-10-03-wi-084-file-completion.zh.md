# WI-084 — PI-GAP-06 工作区文件补全

[English](2026-10-03-wi-084-file-completion.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-03-wi-084-file-completion.md](2026-10-03-wi-084-file-completion.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-03
- Type: Reference
- Status: Active
- Created: 2026-10-03
- Authority: 八项有界 goal 下 PI-GAP-06 Prepare；实现与证据尚待完成

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
