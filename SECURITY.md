# Security Policy

English | [中文](SECURITY.zh.md)

## Supported versions

| Version | Supported |
|---------|-----------|
| `main` / `master` (latest) | Yes |
| Tagged releases | Yes, when published |
| Older tags | Best effort |

There is **no Marketplace release yet**. Security fixes target the default branch until version tags exist.

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

1. Use **Security → Advisories → Report a vulnerability** on [github.com/Hex4C59/pi-vscode](https://github.com/Hex4C59/pi-vscode) once the repository is published, **or**
2. Enable [GitHub private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/configuring-private-vulnerability-reporting-for-a-repository) and report through that flow, **or**
3. Contact the maintainer through a private channel listed in the repository README.

Include:

- Description and impact (especially `SecretStorage`, webview `postMessage`, subprocess RPC, workspace trust).
- Steps to reproduce (VS Code / Cursor version, extension host vs webview).
- Affected commit or tag, if known.

We will acknowledge when possible and coordinate disclosure timing with you.

## Out of scope

- Vulnerabilities in upstream [pi](https://github.com/earendil-works/pi)—report to the pi project unless introduced solely by this extension’s integration code.
- Stolen user API keys, social engineering, or abuse of pi tooling outside this extension’s documented threat model.
- Malicious workspace content: the extension is **not** a sandbox against untrusted repository files; tools and shell remain governed by pi and user settings (see architecture docs).

## Secure development expectations

Contributors must follow [`AGENTS.md`](AGENTS.md) L0:

- Secrets stay in the **extension host** (`SecretStorage` / env)—never in webview HTML, webview storage, or outbound `postMessage` payloads to the webview.
- Webview is presentation-only until `gate-webview-trust` closes; validate all inbound webview messages on the host with an allowlisted protocol.
- Do not reimplement pi’s agent loop in the extension host; use documented SDK/RPC.

Thank you for helping keep users safe.
