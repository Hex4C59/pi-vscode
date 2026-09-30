# WI-070: Approved macOS REQ-009 five-category evidence

English | [中文](2026-10-01-wi-070-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Authority: historical approved scope, not a new Build authorization for later slices
- Archival reason: WI-070 recorded current macOS installed-VSIX five-category evidence; remaining ACTIVE tasks are independent.

## Approval and Traceability

The maintainer `/goal` to complete every ACTIVE.md task authorized this Build after WI-069. User-visible: existing REQ-009 macOS five-category success/failure, coding-loop turn and recovery, including one real extension. Decision: none. No gate.

## Goal and Scope

Produce a current macOS evidence table for the five REQ-009 categories plus a send/stream/complete turn and restart/recovery. Historical Windows passes stay Windows. jsdom/Vite are not platform evidence. Do not change product behavior or accept Draft ADR 0010.

## Approach

Package the current HEAD as an isolated VSIX. Run an installed VS Code profile against a loopback provider that captures `/chat/completions` bodies. Allow and decline project resources in separate profiles. Load reviewed `pi-system-prompt-manager` 0.1.1 at commit `9c8f546b875f929ad5d573fe30e7a7fd6e3ae924` after native trust confirmation. Empty `models.json` is the model-failure fixture.

## Acceptance

Each required cell names a current macOS installed-VSIX record path and host, or the WI cannot close.

## Subsequent Limits

Webview and Runtime directory organization. Docs directory navigation stays parked unless separately promoted.
