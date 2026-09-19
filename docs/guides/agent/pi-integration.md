# Upstream agent SDK / RPC integration

English | [中文](pi-integration.zh.md)

- Type: Guide
- Status: Accepted
- Created: 2026-09-19
- Authority: patterns when the product talks to an upstream coding-agent runtime via SDK or RPC

Copy to `docs/guides/agent/pi-integration.md` when WI touches runtime integration.

## Principles

- **Adapter boundary** — map SDK/RPC types to product domain events; UI reads domain events, not raw SDK streams.
- **Session ownership** — do not read or write upstream session files for product session features unless architecture explicitly allows it.
- **No duplicate agent loop** — do not reimplement the upstream agent loop inside the app host; orchestrate via documented APIs.

## Spikes

- WI-001 spike should prove: process start/stop, one RPC round-trip, clean shutdown (no zombie child processes).
- Record minimum SDK/package version in architecture or an Accepted ADR when `gate-build-baseline` closes.

## Documentation

- Add reference pages (`Planned` → `Outline` → `Living`) before merging channel lists or DTOs in code.
- Scan `docs/guides/architecture-governance.md` for contract and ownership rows before adding IPC or persistence.
