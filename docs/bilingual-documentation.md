# Bilingual documentation guide

English | [中文](bilingual-documentation.zh.md)

- Type: Guide
- Status: Accepted
- Created: 2026-09-19
- Authority: language pairing for this product repository

## Core policy

- **English is authoritative.** Chinese is `*.zh.md` in the same directory.
- Language switcher immediately after the H1: English page links to `basename.zh.md`; Chinese page links to `basename.md`.
- Chinese files declare: 翻译状态, 权威原文, 原文版本, 最近同步.
- Valid 翻译状态: `Machine Draft`, `Human Reviewed`, `Technically Verified`, `Stale`.
- If versions conflict, fix English first, then sync Chinese.

## Mechanical checks

Run `npm run docs:verify` (includes `docs:i18n:check`). Edit required pairs in `scripts/docs-i18n-config.mjs` when you add authoritative English docs.

## Translation lifecycle (Chinese `*.zh.md`)

1. **Machine Draft** — First pass; use 原文版本 `Uncommitted baseline` until English is stable.
2. **Human Reviewed** — Maintainer read Chinese; set 原文版本 to the reviewed English file’s git commit; update 最近同步.
3. **Technically Verified** — Optional: re-ran `docs:verify` after English edits.
4. **Stale** — English drifted; fix Chinese or mark Stale (`docs:i18n:check` errors on drift otherwise).

## Code fences in translations

| Fence tag | Body must match English? |
|-----------|---------------------------|
| `bash`, `json`, `typescript`, … | **Yes** |
| `text` | **Yes** (warning if mismatch) |
| `text prompt` | **No** — copy-paste maintainer prompts; tag **both** en and zh at the same index |
| `text localized` | **No** — translated labels; keep path tokens identical; tag **both** sides |

## Scope

This guide applies to **documentation**, not user-facing UI copy inside applications (define UI i18n separately in the product PRD).
