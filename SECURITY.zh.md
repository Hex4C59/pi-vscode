# 安全策略

[English](SECURITY.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[SECURITY.md](SECURITY.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-22

## 受支持版本

| 版本 | 支持 |
|------|------|
| `main` / `master`（最新） | 是 |
| 带 tag 的发布 | 发布后支持 |
| 更早 tag | 尽力而为 |

**尚无 Marketplace 发布。** 在存在版本 tag 之前，安全修复针对默认分支。

## 报告漏洞

通过维护者指定的[私密报告入口](https://github.com/Hex4C59/pi-vscode/security/advisories/new)提交。请勿在公开 Issue 中披露漏洞细节或凭证。

提供影响、复现步骤、宿主版本和已知受影响 commit／tag；重点说明 extension host、Webview、RPC 或工作区信任边界。使用已脱敏的最小复现，不附 API 密钥、认证文件或完整私密对话。

如入口不可用，可在公开 Issue 中仅请求恢复私密联系渠道，保留漏洞细节，待私密渠道可用后提交。维护者会在可行时确认收到并协调披露时间。

## 范围外

- 上游 [pi](https://github.com/earendil-works/pi) 自身漏洞——向 pi 项目报告，除非仅由本扩展集成代码引入。
- 用户 API 密钥被盗、社会工程、或在本扩展文档化威胁模型之外滥用 pi 工具。
- 恶意工作区内容：本扩展**不是**对抗不可信仓库文件的沙箱；工具与 shell 仍由 pi 与用户设置决定（见架构文档）。

## 安全开发要求

贡献者须遵守 [`AGENTS.zh.md`](AGENTS.zh.md) L0：密钥仅 extension host；webview 仅展示；host 对 webview 入站消息做允许列表校验；勿在 host 内重写 pi agent 循环。

这些边界持续生效；Gate 验收不会授权把凭证或高权限能力移入 Webview。
