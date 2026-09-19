# WI-001 runtime spike evidence

- Date: 2026-09-19
- Command: `npm run spike:runtime`
- Mechanism: spawn `@earendil-works/pi-coding-agent` `dist/bundle/cli.js --mode rpc --no-session`, send `get_state`, SIGTERM within 5s
- Result: **OK** — `get_state succeeded; process exited within timeout`
- Package pin: `@earendil-works/pi-coding-agent@0.85.1`
- Notes: no LLM/provider calls; gates **Accepted** via ADR [0001-build-baseline](../decisions/0001-build-baseline.md) (2026-09-19)
