# 参与贡献 pi VS Code

[English](CONTRIBUTING.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[CONTRIBUTING.md](CONTRIBUTING.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-19

感谢关注本项目。进行中的工作见 [`ACTIVE.md`](ACTIVE.md)（同一时间只推进一个 WI）。

## 开 PR 之前

1. 阅读 [`AGENTS.zh.md`](AGENTS.zh.md)（[English](AGENTS.md)）了解工程与安全约束（extension host 与 webview、pi 集成）。
2. 阅读 [Agent 协作指南](docs/guides/agent-collaboration.zh.md)（[English](docs/guides/agent-collaboration.md)）了解工作项、gate 与 ADR。
3. 遵循 [`docs/git-commit-convention.zh.md`](docs/git-commit-convention.zh.md)（[English](docs/git-commit-convention.md)）：commit message 使用英文与 Conventional Commits。
4. 与 `ACTIVE.md` 中的**当前 WI** 对齐——未经维护者同意请勿提交大规模无关功能 PR。

## 当前适合贡献的内容

- 文档修正（修改需配对的中英页面时保持同步，见 [`docs/bilingual-documentation.zh.md`](docs/bilingual-documentation.zh.md)）。
- 与当前 WI 或停车场中已立项 WI 一致的工作。
- 与 `package.json` 现有脚本一致的测试与 CI 改进。

## 本地检查

```bash
npm install
npm run compile
npm run lint
npm run docs:verify
npm run spike:runtime   # optional; subprocess RPC probe, no LLM
```

CI 在 Pull Request 上运行 compile、lint 与文档校验（见 [`.github/workflows/ci.yml`](.github/workflows/ci.yml)）。

## pi 集成

- 自动化测试中勿调用真实付费模型，除非维护者书面例外。
- 勿提交 API 密钥、OAuth 令牌或 pi 认证文件内容。
- 本地 `../pi` 仅用于阅读上游源码；生产构建须使用 pin 的 npm 包（见 [`AGENTS.zh.md`](AGENTS.zh.md)）。

## 安全问题

请按 [`SECURITY.zh.md`](SECURITY.zh.md)（[English](SECURITY.md)）报告漏洞，勿在公开 issue 中披露。

## 提问

非敏感问题可使用 GitHub Issues。重大设计变更可能需要 ADR（[`docs/decisions/README.zh.md`](docs/decisions/README.zh.md)）。
