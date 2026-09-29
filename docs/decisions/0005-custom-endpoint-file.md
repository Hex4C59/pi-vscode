# ADR 0005: Custom OpenAI-compatible endpoints in models.json

English | [中文](0005-custom-endpoint-file.zh.md)

- Type: ADR
- Status: Draft
- Created: 2026-09-29
- Decision approval: 2026-09-29, maintainer confirmed the WI-030 implementation plan
- Verification: pending. Compile, lint, tests and documentation checks are recorded in ACTIVE when run. Maintainer inspection of the settings controls, a live browser sign-in and a live endpoint call are not yet recorded.
- Gates: none. Existing `gate-webview-trust` still applies: secrets stay out of the Webview.
- Work item: WI-030

## Context

WI-024 stored API keys through public `ModelRuntime.login` into pi auth storage and left OAuth and custom endpoints out. pi 0.86.1 documents custom OpenAI-compatible providers in `~/.pi/agent/models.json` and reloads that file from `ModelRuntime.refresh()`. The installed package exposes no public writer for the file. `ModelConfig` only loads it.

OAuth for built-in providers already persists through the same `login(..., "oauth")` path as API keys. That path is not a new store.

## Decision

1. **OAuth uses the existing login.** When a provider exposes public `auth.oauth.login`, the host calls `ModelRuntime.login(providerId, "oauth", interaction)`. The host opens only http(s) URLs with no userinfo, shows a device code in a native prompt, and does not place tokens, codes or authorization URLs in the Webview or logs.
2. **One endpoint writer.** The extension host is the only product writer of custom endpoint entries in pi's `models.json`. Each entry is `api: "openai-completions"` plus a display name, base URL and one model id. It does not write `apiKey`, headers, shell commands or environment interpolation. The API key still goes through `ModelRuntime.login(..., "api_key")` into auth storage.
3. **Merge or refuse.** A missing file may be created. A valid JSON object is rewritten with the other providers preserved. A file that is not safe JSON, is larger than 1 MiB, or contains a non-object provider entry is left unchanged. Built-in provider ids are not added or removed. Removal deletes only one non-built-in provider object from that file, then logs the provider out.

## Rationale

The RPC child loads `models.json` itself. An in-memory `registerProvider` call would not survive the child or the next host start. Writing the documented file, without putting the secret in it, keeps one credential authority and stays inside the public provider stack.

## Alternatives considered

- Leave endpoints as a hand-edited file: rejected because the maintainer asked for the settings task to be completed.
- Store the API key in `models.json`: rejected because WI-024 already keeps secrets in pi auth storage and out of the Webview.
- Parallel SecretStorage: rejected in WI-024 and unchanged here.
- A full `models.json` editor for every API, header and compatibility flag: rejected for this slice.

## Consequences

Rewriting a valid file changes JSON formatting and drops comments, because comments are not safe to round-trip with `JSON.parse`. Comment-only or invalid files are not rewritten. Confirmation of this plan is the decision approval. The ADR stays Draft until the WI-030 verification recorded in ACTIVE is complete; it does not accept a gate.
