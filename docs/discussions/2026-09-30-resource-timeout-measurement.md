# Resource and timeout measurement

English | [中文](2026-09-30-resource-timeout-measurement.zh.md)

- Type: Discussion
- Status: Closed
- Created: 2026-09-30
- Authority: WI-052 evidence; not an implementation approval, ADR or budget change
- Related: [tooling audit](2026-09-30-tooling-config-audit.md), [runtime helpers audit](2026-09-30-runtime-helpers-audit.md)
- Environment: Node v25.9.0, this working tree, 2026-09-30. Not a hang, exhaustion or deadlock incident.

## Question

Do startup settings read, diagnostic stderr accumulation, artifact inflate, and synchronous test/Git calls need in-repo size or time budgets before any repair? ARCH-08 streaming/history cost is out of this slice.

## Startup settings

`readPiStartupModelArg` uses `fs.readFileSync` on `settings.json` with no byte cap. This machine's file is **355 bytes** (0.23 ms). Synthetic UTF-8 reads: 1 KiB 0.03 ms, 1 MiB 0.43 ms, 8 MiB 3.6 ms. A huge file at that path would still load whole into the extension host. Observed/typical cost does not require a budget. Do not treat unmeasured malicious substitution as a current stall.

## Diagnostic stderr

The diagnostic probe concatenates every `stderr` chunk into a string and only slices 500 characters on the returned detail. `get_state` wait and stop each default to **5 s**. Concatenating 1 MiB / 8 MiB in 4 KiB chunks took 0.63 ms / 2.7 ms; the cost is memory, not CPU. Pipe flood during the wait could grow without a cap.

Production RPC does not accumulate stderr (`pi-rpc-runtime` / `child-link` drain). Session-worker stderr is already capped at **64 KiB**. A probe-only cap matching that limit would be hardening, not repair of a demonstrated exhaustion. Not implemented here.

## Artifact read and inflate

`verifyWebviewArchive` reads the whole archive, then `inflateRawSync(..., { maxOutputLength: size })` using the ZIP-declared uncompressed size (uint32, theoretical max 4 GiB−1). Current `dist/webview`: `webview.js` 423 654 bytes, `webview.css` 70 867, `webview-pi.svg` 290.

`verify-vsix.mjs` also whole-file reads, then inflates **without** `maxOutputLength`. This tree's `dist/pi-vscode-validation.vsix` is **149 811 688 bytes**, 15 535 entries; `readFileSync` 39 ms. Highly compressible 1 MiB / 16 MiB zero payloads inflated in 0.4–11 ms bounded or unbounded.

An independent small output budget would reject this legitimate VSIX. ZIP-bomb risk on `verify-vsix` remains untriggered. No exhaustion is claimed. No budget added.

## Test and Git timeouts

`executeTests` `spawnSync`s `node --test` with no `timeout` and no `--test-timeout`. `commit-check` `spawnSync`s git the same way. A hang waits for the OS or the outer job.

This close's full `npm test` was **12 849 ms** (1016 pass). `git diff --cached --name-status -z` was 9 ms on an empty index. CI `.github/workflows/ci.yml` sets no `timeout-minutes`; GitHub-hosted jobs default to **6 hours**. In-library timeouts are not required for current durations.

## Conclusion

No in-repo size or time budget is necessary to fix a current stall, exhaustion or deadlock. Remaining hardening (probe stderr cap, `verify-vsix` inflate bound) is optional and separate from ARCH-08 measurement.
