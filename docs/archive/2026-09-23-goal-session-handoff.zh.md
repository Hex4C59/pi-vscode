# Goal 会话连续性检查点 — WI-017

[English](2026-09-23-goal-session-handoff.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-23-goal-session-handoff.md](2026-09-23-goal-session-handoff.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-23
- Type: Reference
- Status: Historical checkpoint
- Recorded: 2026-09-23 UTC
- Authority: 仅历史范围与可执行证据
- Replacement: [ACTIVE](../../ACTIVE.md) 负责暂停中的当前工作入口、剩余范围与待验收事项。

## 归档原因

WI-017 代码与可执行验证完成。2026-09-23 维护者要求暂停实施、仅收尾文档，没有启动下一 WI。本记录替代阶段交接，**不代表 WI、PRD、ADR、gate 或维护者体验正式接受**。现行行为与边界仍由 [PRD](../product-requirements.zh.md)、[架构](../architecture/vscode-extension-architecture.zh.md)及[消息契约](../reference/webview-messages.zh.md)负责。

## 批准范围与边界

维护者 2026-09-22 UTC Goal 授权在 WI-016 可执行交付后落实 REQ-008 及关联 REQ-004／005／006 生命周期。T017-01 提供 pi 原生持久化、当前项目列表与新建。T017-02 在原生确认原入口退出、Stop settlement 及当前草稿 revision 检查后恢复选定会话。T017-03 按 32 行／页、8192 UTF-16 单位／字面预览块投影锚定历史，包括可验证的原始附件文本。

Host 拥有校验、确认、取消和 generation；adapter 在有界 helper 中调用声明 pi 0.86.1 公开 SessionManager API，agent 使用公开 RPC。不解析 session 文件格式，不增加另一套持久化，不复制 agent loop，不自动加载历史扩展，不跨项目选择。确认不是独占锁。恢复替换临时审批／grant、review 捕获、附件状态与延后模型设置，不回滚文件效果。不支持的历史内容明确说明，隐藏 custom 项不展示，缺失原文不从当前文件重建。

## 可执行检查与审查

证据根：`dist/goal-evidence-20260923/wi017-t01/`（仓库自有 ignored 输出，不是另一任务账本）。

- `compile-integrated-final.log`、`lint-integrated-final.log` 通过；`tests-integrated-final.log`：**308/308 通过，0 失败／跳过**。标准入口公开接缝覆盖 backend 边界／取消／身份、runtime 启动、host 交接／Stop／草稿／视图调度、字面历史与挂载 client。
- `review-final.json` 两轴复审均无未解决项。修复包含真实 helper settlement（不是未决 modal）、视图消失时列表取消、精确 host 自有 preparation 取消 revision、旧附件提示、只归一化 Windows 盘符的路径身份及 Windows CI 测试。主代理增加阻塞读取、重建视图读取和队列／barrier 环路回归；完成子代理部分 patch，不把子代理本身记为完成。
- RED／GREEN 日志保留回归。CI 已配置 Windows／Ubuntu，未声称远端执行。同期 runtime-spike 维护记录的两项 picker 失败已由整合后 308 项通过覆盖，不隐瞒或跳过。
- `adapter-session-integration.json` 使用真实 SDK／生产 helper／RPC。`terminal-session-integration.json` 使用真实终端 **CLI print mode** 而非 TUI：一次合成 loopback 模型调用创建保存会话，生产 backend 列举并恢复且不重放。长历史锚点追加后不漂移，并保留原始附件文本。

## 分层 UI 与安装证据

原生验证使用 Windows Node 24.12.0、声明 pi 0.86.1 和隔离 dummy profiles。合成 loopback 响应**不是真实模型证据**。

- 仅浏览器 `browser-sessions.json`：三主题 × 280／360／600px、短视口、键盘分块、字面 HTML、输入区可达；合成预览不是原生确认验证。
- 直接开发宿主：`native/dev-*.json`，不等同 F5。
- 实际 F5：`native/f5-launch.json` 记录按键触发父／子宿主。`native/` 下 `f5-final-client-handoff.json`、`f5-history-matrix.json`、`f5-active-stop-handoff.json` 覆盖 Cancel 保留草稿、已提交 New／Restore 清草稿、三页历史／七块原文、renderer 替换保留历史／草稿、不重放及新建前主动流关闭。
- 普通安装版：`native/` 下 `installed-final-client-handoff.json`、`installed-history-matrix.json`、`installed-active-stop-handoff.json`、`installed-runtime-loss.json`、`installed-grant-reset.json` 覆盖相同交接／历史，以及自有 runtime crash、未发送草稿保留／不重放、真实审批门控 write、新建后 fresh grants、待审批取消；已完成文件效果保留。
- 最终仅 README 更新重打包再次安装启动：`native/installed-final-package-smoke.json` 验证普通安装激活、真实 runtime、终端产生的列表项、生产资产 URL，以及与完整实测候选相同的可执行哈希。
- 早期自动化失败／超时日志保留。一次原生确认超时后定向重试成功，不声称根因。之前 F5 code134 workaround 证据单独保留，不描述为已证明产品修复。

## 文档收尾

按维护者要求暂停时，docs:verify／docs:health 通过：0 error、4 个既有 Draft ADR 提示，双语无错误／过期。限定文档 diff check 通过。全工作区 diff check 仍提示 src/extension/piChatViewProvider.ts:926 的既有文件尾空行；本次仅文档收尾，源码保持原样，没有重跑代码构建／测试。日志：`docs-closeout.log`、`docs-health-closeout.json`、`docs-diff-closeout.log`、`worktree-diff-closeout.log`。并行 UI 预览计划保留；该会话之前遇到的新归档翻译元数据缺失已由本双语归档修复。Goal 仍未完成，没有启动 WI-018 实现。

## 最终安装包

`pi-vscode-wi017-final.vsix`：**146,608,296 bytes／14,083 entries**，SHA-256 **952535225a3b470fb5576823c6ff93169353aa2a9f62302fc9650e124ea241e2**。`package-final.log`、`package-assets-final.log`、`install.log`、`package-content.json` 记录打包、资产、隔离安装与本地／归档／安装的 host、gate、session helper、Webview JS／CSS 精确一致。Manifest 比较排除安装 metadata；VSCE 改写链接后的 README 文案已核对。排除源文件、证据与私有材料，不依赖预览服务器。旧 VSIX 仅为中间证据，不是当前包；未发布。

## 清理、保留与人工验收

`cleanup-final.json`（2026-09-23T02:50:21Z）记录最后 12 个自有进程退出、六端口空闲、无残留自有 pi RPC，Goal 自有 models／settings／server 配置恢复，并链接开发、浏览器、F5、安装版独立清理记录。按命令行和创建时间确认归属。隔离 launcher 配置及 result 夹具已恢复，仓库 launch 配置未改。未创建工作树。

保留 `dist/goal-evidence-20260923/`（日志、包、隔离 profiles／workspace、合成 SDK／CLI sessions）及 `dist/session-integration-adapter.cjs` 至维护者接受或保留期结束且唯一证据保存。无测试服务存活。未用凭证、付费模型，未改相邻仓库、暂存区或提交。

维护者体验仍需确认窄栏／键盘列表及长历史导航；Cancel／New／Restore 草稿行为；原入口退出说明；审批／grant 重置与失败恢复。Gate／ADR 状态不变。REQ-004 执行状态、REQ-001／002／005 剩余失败矩阵及 REQ-006／009 trusted 扩展仍阻止总体 Goal 完成，不改写为仅待人工验收。
