# WI-030 — OAuth 登录与一个 OpenAI 兼容端点

[English](2026-09-29-wi-030-oauth-endpoint.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-29-wi-030-oauth-endpoint.md](2026-09-29-wi-030-oauth-endpoint.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-29

- 类型：参考
- 状态：Archived
- 创建：2026-09-29
- 权威：WI-030 的历史范围与维护者关闭；当前工作见 [`ACTIVE.md`](../../ACTIVE.md)

## 关闭 — 2026-09-29

维护者表示 WI-030 已完成。这关闭剩余检查：设置页登录入口和添加端点。这是维护者对该切片的亲自确认。它不记录真实浏览器登录、真实端点调用、付费探测或新的安装包。ADR 0005 仍为 Draft。本次关闭不授权新 gate、提交或推送。WI-031 仍是当前工作。

批准行为仍在 WI-026 的编辑区设置页。带公开 OAuth 登录的供应商由宿主发起登录。宿主只打开不含用户信息的 http(s) 链接，并在原生提示中显示设备码。一个自定义 OpenAI 兼容端点包含显示名称、Base URL 和模型 id；API key 仍经宿主密码框和 `ModelRuntime.login` 保存。`models.json` 不写入 API key、请求头、shell 命令或环境变量插值。损坏的文件保持不变。删除仅限于该文件中的非内置供应商。

暂停前记录的代理检查：`compile`、`lint`、`npm test`（771/771）、`verify:webview`、`docs:verify`（0 个错误；两条 Draft ADR 警告）。本次关闭未重跑这些检查。

## 替换原因

ACTIVE 保留 WI-031 为当前项。暂停的 WI-030 提案与交接移到此处。
