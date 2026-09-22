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

Use the maintainer-designated [private report form](https://github.com/Hex4C59/pi-vscode/security/advisories/new). Keep vulnerability details and credentials out of public issues.

Include the impact, reproduction steps, host version and affected commit/tag when known, especially for extension-host, Webview, RPC or workspace-trust boundaries. Use a redacted minimal reproduction; exclude API keys, auth files and complete private conversations.

If the form is unavailable, request a private contact route in a public issue without disclosing the vulnerability, and retain the details until that route is available. The maintainer will acknowledge when possible and coordinate disclosure timing.

## Out of scope

- Vulnerabilities in upstream [pi](https://github.com/earendil-works/pi)—report to the pi project unless introduced solely by this extension’s integration code.
- Stolen user API keys, social engineering, or abuse of pi tooling outside this extension’s documented threat model.
- Malicious workspace content: the extension is **not** a sandbox against untrusted repository files; tools and shell remain governed by pi and user settings (see architecture docs).

## Secure development expectations

Contributors must follow [`AGENTS.md`](AGENTS.md) L0:

- Secrets stay in the **extension host** (`SecretStorage` / env)—never in webview HTML, webview storage, or outbound `postMessage` payloads to the webview.
- Webview remains presentation-only; validate all inbound webview messages on the host with an allowlisted protocol.
- Do not reimplement pi’s agent loop in the extension host; use documented SDK/RPC.

These boundaries remain in force after gate acceptance; closing a gate does not authorize moving credentials or privileged capabilities into the Webview.
