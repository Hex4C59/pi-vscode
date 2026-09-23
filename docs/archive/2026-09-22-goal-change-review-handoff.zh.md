# Goal 修改审查检查点 — WI-016

[English](2026-09-22-goal-change-review-handoff.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-22-goal-change-review-handoff.md](2026-09-22-goal-change-review-handoff.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-22
- 类型：参考
- 状态：历史检查点
- 记录：2026-09-22 UTC
- 权威：仅历史范围与可执行证据
- 替代：[ACTIVE](../../ACTIVE.md) 管理下一串行 Goal 切片及待接受事项。

## 归档原因

Goal 授权的脏编辑器保护与已应用审查代码／可执行检查完成，当前 Build 由会话连续性工作接替。**不代表 WI、PRD、ADR、gate 或维护者体验正式接受。** [PRD](../product-requirements.zh.md)、[架构](../architecture/vscode-extension-architecture.zh.md)与[消息契约](../reference/webview-messages.zh.md)保留现行要求及 ownership。

## 批准范围

WI-016 覆盖 REQ-007 和依赖的 REQ-005／006 生命周期／策略。T016-01 拦截具有未保存编辑器修改的可识别内置 write/edit 目标，包括等待审批期间变化及 grant 复用，不保存缓冲区。T016-02 在 host 内存捕获可靠 before/after，打开原生只读 diff／当前源，区分工具报告与工作区观察，并披露重叠、捕获限制与 runtime 丢失。

仅用 pi 0.86.1 公开 hook／RPC。不复制 agent loop，不解析 session 文件，不向 Webview 发秘密或任意文件／命令能力，不新增补丁审批、回滚、Git reset/stash、全盘监控或跨 runtime 快照持久化。公开执行前 hook 不是编辑器／写入原子锁；不透明 shell／扩展写入与并发阻止完整任务归因保证。

## T016-01 检查点

仓库自有忽略证据：`dist/goal-evidence-20260923/wi016-t01/`。固定文件 baseline 与 red/green 日志保留本地比较，不使用被禁止的 Git 操作。210/210 测试、0 skipped，compile／typecheck、lint、docs、diff 通过，Standards／Spec 发现已修复。实际 F5 和普通安装版以真实 pi＋合成 loopback provider 覆盖脏缓冲区、等待期间编辑、clean／dirty grant、write/edit、恢复及 Stop 草稿，不冒充真实模型。

T01 最终包 SHA-256 `e43c64e5f45a6b11627413ede0c3e58be1f3a727a68217a99f33e46356e4ceb9`，146,585,023 bytes／14,082 entries，现为较早检查点；无 final 后缀的早期包仅为中间产物。清理记录 35 个自有进程退出、6 个端口空闲、launch／夹具恢复。

## T016-02 检查点

证据：`dist/goal-evidence-20260923/wi016-t02/`。

- `tests-final.log`：229/229、0 skipped；`compile-final.log`／`lint-final.log` 通过。Host 14/14、adapter 1/1 覆盖精确快照对、失败后的部分副作用、不安全／超大来源拒绝、不淘汰保留、生命周期失效及展示裁剪之外的完成事件。
- 初次独立 Standards／Spec 审查发现 watcher 工作无界、重复原生打开、授权拒绝仍保留 preflight 快照、遗漏 preflight 重叠。经 red→green 修复为有界合并工作、单飞打开、丢弃被拒绝快照及保留重叠区间；`host-review.json` 与 UI 复审无未解决项。
- 整体回归发现 null-path 测试夹具与 DTO 断言错误，jsdom 断言报告导致分配耗尽；修复测试，未跳过。实机断连发现丢失提示随聊天面板隐藏；UI 修复有挂载与原生证据。
- `browser-evidence.json`：仅合成浏览器；三种主题×280／360／600px、480px 短视口、16 条分页及流式焦点／页码／草稿保留，不是原生／pi 证据。
- `f5-evidence.json`：实际 F5、只读内容／拒绝输入、历史／当前／删除源、失败 edit、观察、Stop 草稿、renderer 重载、runtime 丢失。首次 F5 code134 退出，在临时自有设置中关闭已安装 debugger 的 network view 后重试成功；只是 workaround 观察，不是已证实根因。Reload Webviews 保留 provider；新视图身份拒旧另由 host 测试覆盖。
- `installed-evidence.json`：普通隔离安装 profile、无开发路径；真实打包 pi／合成 provider，验证只读审查、18 次真实 write 与超出 16 条后的分页稳定、当前／删除源、失败 edit、等待审批 Stop、renderer 重载及可见的 runtime 丢失。
- `pi-vscode-t01602.vsix`：SHA-256 `f2d04b598453dfc522601ba1b21085e02201f9030b3f3b89ac276ad035b268ca`，146,590,937 bytes／14,082 entries。`package-content.json`／`package-assets.log` 证明本地／归档／安装的 host、gate、Webview 一致。Manifest 排除 installer metadata 后相同，包内 README 当前，preview／证据／秘密未入包，产物不需要 preview server。
- `cleanup.json`：38 个记录在案的自有进程退出、6 个端口空闲；launch／debug 设置与 result 夹具恢复，新观察夹具移除。未读取用户凭证、使用付费模型、修改相邻仓库、执行 Git 索引／提交／历史操作或发布。

## 保留条件

Goal evidence 根目录／profiles／安装产物，以及旧 `dist/wi015-evidence/`、`dist/component-check/`、`D:/DevCaches/pi-vscode-ui-20260922` 保留至维护者接受／保留期结束且唯一证据已保存。未建工作树。底层文件读取无法在响应期限后取消；句柄最终清理与 epoch 校验阻止迟到结果修改替换状态。

窄栏／键盘体验、dirty 恢复、审阅／丢失文案、ADR 0003 与 Open gate 仍由维护者接受。会话连续性及 REQ-001～009 其他明确缺口继续必需，不改写为仅待人工接受。[ACTIVE](../../ACTIVE.md) 仍为唯一当前入口。
