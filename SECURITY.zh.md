# 安全策略

[English](SECURITY.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[SECURITY.md](SECURITY.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-19

## 受支持版本

| 版本 | 支持 |
|------|------|
| `main` / `master`（最新） | 是 |
| 带 tag 的发布 | 发布后支持 |
| 更早 tag | 尽力而为 |

**尚无 Marketplace 发布。** 在存在版本 tag 之前，安全修复针对默认分支。

## 报告漏洞

**请勿在公开 GitHub Issue 中披露安全漏洞。**

1. 仓库公开后，在 [github.com/Hex4C59/pi-vscode](https://github.com/Hex4C59/pi-vscode) 使用 **Security → Advisories → Report a vulnerability**，**或**
2. 启用 [GitHub 私有漏洞报告](https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/configuring-private-vulnerability-reporting-for-a-repository) 并通过该流程提交，**或**
3. 通过 README 中列出的私有渠道联系维护者。

请尽量提供：描述与影响（`SecretStorage`、webview `postMessage`、子进程 RPC、工作区信任）；复现步骤（VS Code / Cursor 版本）；已知受影响 commit 或 tag。

## 范围外

- 上游 [pi](https://github.com/earendil-works/pi) 自身漏洞——向 pi 项目报告，除非仅由本扩展集成代码引入。
- 用户 API 密钥被盗、社会工程、或在本扩展文档化威胁模型之外滥用 pi 工具。
- 恶意工作区内容：本扩展**不是**对抗不可信仓库文件的沙箱；工具与 shell 仍由 pi 与用户设置决定（见架构文档）。

## 安全开发要求

贡献者须遵守 [`AGENTS.zh.md`](AGENTS.zh.md) L0：密钥仅 extension host；webview 仅展示；host 对 webview 入站消息做允许列表校验；勿在 host 内重写 pi agent 循环。

感谢您帮助保护用户安全。
