# WI-078：作曲区命令发现批准方案

[English](2026-10-02-wi-078-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-02-wi-078-approved-proposal.md](2026-10-02-wi-078-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-02

- 类型：参考
- 状态：Archived
- 创建：2026-10-02
- 权威：历史批准切片，不是整个 PI-GAP-02 验收

## 批准与归档原因

2026-10-02 Agent 依据持续产品切片 goal 关闭后归档。10 月 1 日授权涵盖 Prepare→Build 与限定范围验收；续跑 goal 批准裸补全统一空格。用户可见中英 PRD 行先于 Build 同步。Gate none、Decision none，WIP=1；不 push／amend／rebase／force，Draft ADR 0010 未接受。当前工作归 [ACTIVE](../../ACTIVE.md)，结果与限制见[验收](2026-10-02-wi-078-acceptance.zh.md)。

## 目标、范围与方案

前导 `/` 打开来自当前公开 `get_commands` 快照的有界菜单，列出扩展命令、模板和 skills 的名称、可选安全描述、来源与粗粒度位置。补全写入已确认草稿但不发送；仅没有后缀时补一个空格，已有参数／空白逐字保留，不猜参数元数据。空、不可用、过滤零结果和过期世代分别解释；不把清单／磁盘／市场项升级为可执行项，不暴露路径、嵌套 sourceInfo、凭据或 AGENTS.md 正文。实际加载报告继续停车，只关闭菜单切片。

## 方案与职责

pi 0.86.1 文档 RPC 示例仍用旧 path/location；公开 SlashCommandInfo／SourceInfo 和实际 RPC 用 sourceInfo。Adapter 校验两者，仅映射 user/project，temporary 不猜来源。宿主拥有世代、快照和校验，两种配置 ready／提交替换时刷新。DraftSubmission 是唯一宿主草稿 owner；补全仅一次带 revision 守卫的变更，client 预期确认一致。UI 本地过滤，仅类型导入 contracts；发送沿既有 idle prompt，WI-077 仍拒绝 slash 队列。不新增存储、依赖、进程策略或信任决定。

## 架构核对与证据

1–5：adapter 翻译、宿主准入、UI 展示；v3 类型／validator／消费者实现，契约 Living。6：PRD WI-078 REQ-004／009，不扩加载报告或包管理。7–11：世代／revision 丢弃过期结果，空／失败可区分；composition 覆盖 Stop 与迟到结果，四次真实 runtime 替换／退出及原生 cleanup 已观察。12–14：无持久化，含路径／凭据形状元数据屏蔽，浏览器拒绝额外 path，原生夹具菜单只有粗粒度位置；不是任意机密过滤认证。15：最多 512 行、有界名称／描述／草稿，本地过滤。16–19：compile／lint／tests、浏览器、实际 pi、macOS F5／安装 VSIX 分层；键盘／互斥与合成 IME 覆盖，OS IME 和额外宿主兼容未验。

## 实现前失败方式

清单伪装可执行；路径进入 Webview；发明 TUI 命令；补全发送／入队；绕过 slash 队列拒绝；替换后旧目录；空列表误标 loading；IME Enter 选择；弹出层并存。空格规则补充：缺分隔符、规范化 tabs/newlines、重复补全追加空格或发送。

## 可观察验收与排除

观察 `/`→来源→过滤→确认草稿不发送，裸空格／逐字后缀，空／错误／过期／配置差异，键盘／合成 IME／互斥。运行 compile、lint、npm test、浏览器中英窄屏／主题；隔离真实 pi 目录夹具、macOS F5／安装 VSIX分别记录可重放报告／截图与 cleanup，关闭 docs:verify／health。

排除下载／市场、额外生态、任意扩展兼容、Chat Participant、remote／multi-root、额外平台、跳审批、公开发布；不改 sibling pi。PI-GAP-01 附件／命令展开与 PI-GAP-02 加载报告继续停车。
