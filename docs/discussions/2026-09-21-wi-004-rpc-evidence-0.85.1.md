# WI-004 Prepare — pinned pi `0.85.1` RPC evidence

English | [中文](2026-09-21-wi-004-rpc-evidence-0.85.1.zh.md)

- Type: Discussion
- Status: Accepted (evidence record)
- Created: 2026-09-21
- Authority: **context only** — does not authorize Build, close gates, or override [`ACTIVE.md`](../../ACTIVE.md) or the Draft PRD

## Purpose

Record **version-matched** public documentation for WI-004 (`prompt` + assistant `text_delta` streaming, `--no-tools` startup). Upstream `main` URLs alone do not prove behavior for the pinned npm package.

## Pin and reproducibility

| Source | Evidence |
|--------|----------|
| `package.json` / `package-lock.json` | `@earendil-works/pi-coding-agent@0.85.1` from the npm registry |
| Installed package (after `npm ci` / `npm install`) | `node_modules/@earendil-works/pi-coding-agent/package.json` reports `"version": "0.85.1"` |
| Git tag (read-only cross-check) | [pi `v0.85.1` — `packages/coding-agent/docs/rpc.md`](https://github.com/earendil-works/pi/blob/v0.85.1/packages/coding-agent/docs/rpc.md) |

This record is **documentation research** on the pinned release. It is not F5 end-to-end verification of WI-004 chat.

## WI-004-relevant RPC commands and events

From **`rpc.md`** in the `0.85.1` package (sections **Prompting → `prompt`** and **Event Types / `message_update`**):

| Topic | Documented behavior (0.85.1) | WI-004 use |
|-------|------------------------------|------------|
| `prompt` | Command response is emitted after the prompt is accepted, queued, or handled; events continue **asynchronously** after acceptance | Host treats `response.success` as acceptance only, not turn completion |
| `prompt` response | `success: true` = accepted/queued/handled; `success: false` = rejected **before** acceptance; post-acceptance failures use the event stream | Bounded error UX; no second response for the same request id on failure after acceptance |
| `turn_end` | Turn completes (assistant message and tool results) | Preferred turn boundary for stopping UI streaming growth (WI-004 proposal) |
| `message_update` | Streaming update; `assistantMessageEvent.type` includes `text_delta` with `delta` text chunks | Map to host-owned transcript projection for the webview |
| `agent_settled` | Session-level run fully settled; no automatic retry/compaction/queued continuation remains | Optional stricter boundary; WI-004 proposal names `turn_end` first — confirm in Build if both are needed |

Example shape for `text_delta` (abridged from `rpc.md`):

```json
{
  "type": "message_update",
  "assistantMessageEvent": {
    "type": "text_delta",
    "contentIndex": 0,
    "delta": "Hello "
  }
}
```

**Out of WI-004 Prepare scope (deferred):** `steer` / `followUp`, images, extension commands during streaming, toolcall deltas, compaction/retry events, `abort`.

## `--no-tools` CLI flag (0.85.1)

WI-004 proposes adding public `--no-tools` on the product RPC subprocess until REQ-006 approval UI exists.

| Source | Statement |
|--------|-----------|
| [`usage.md` — Tool Options](https://github.com/earendil-works/pi/blob/v0.85.1/packages/coding-agent/docs/usage.md) (`--no-tools`, `-nt`) | Disable **all** tools |
| [`settings.md` — tools section](https://github.com/earendil-works/pi/blob/v0.85.1/packages/coding-agent/docs/settings.md) | `--no-tools` disables all tools (alongside `--tools` allowlist and `--no-builtin-tools`) |

This is a **product safety slice**, not a sandbox claim. Declining project resources (WI-006/007) remains separate from disabling tools.

## Limits and open verification

- Observed only in **published docs** for `0.85.1`, not by sending a live `prompt` from pi-vscode in this Prepare pass.
- Does not close `gate-session-streaming`, `gate-webview-trust`, or `gate-runtime-host`.
- Build must still add [`webview-messages`](../reference/webview-messages.md) chat outline, strict allowlist tests, and concurrency/stale-event handling per [`ACTIVE.md`](../../ACTIVE.md).

## Links

- Current WI: [`ACTIVE.md`](../../ACTIVE.md) (WI-004 Prepare; Build not approved)
- PRD slice: [REQ-004 WI-004 proposed slice](../product-requirements.md#req-004--observable-task-execution)
- Integration playbook: [pi-integration § pi VS Code](../guides/agent/pi-integration.md#pi-vs-code-selected-approach-and-evidence)
