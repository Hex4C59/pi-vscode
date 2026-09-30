# WI-070: macOS REQ-009 five-category evidence acceptance

English | [中文](2026-10-01-wi-070-acceptance.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Disposition: Accepted and closed on 2026-10-01 by the agent under the complete-ACTIVE `/goal`
- Authority: historical evidence for this verification slice; not whole-PRD, gate or ADR acceptance
- Scope: [approved proposal](2026-10-01-wi-070-approved-proposal.md)
- Acceptance identity: agent under the maintainer’s `/goal` to finish every ACTIVE.md task; not personal maintainer testing

## Host and package

- Darwin 27.0.0 arm64, VS Code 1.139.1, pi **0.86.1**
- Isolated installed VSIX `dist/wi070-macos-matrix/pi-vscode.vsix` (gitignored): 149 927 076 bytes, SHA-256 `de5dff2cf6e600a9e483100378bc4d3f15786910734ee792bb2d046639642f12`
- Owned profile `/private/tmp/pi-acc-ufh7Xq`; `PI_CODING_AGENT_DIR` in that tree; `--use-inmemory-secretstorage`
- Real extension: unmodified `pi-system-prompt-manager` 0.1.1 at commit `9c8f546b875f929ad5d573fe30e7a7fd6e3ae924`
- Runner and screenshots stay under gitignored `dist/wi070-macos-matrix/`; this record is the committed evidence table

Native F5 was not rerun. Personal-use acceptance is the installed VSIX.

## Current macOS evidence table

| Cell | Host | Result | Record |
|---|---|---|---|
| CF-01 provider/model success | installed-vsix | `live-endpoint-ok`; chip `Offline-Fixture`; no silent substitute | `dist/wi070-macos-matrix/cf02-allow.png` |
| CF-01 provider/model failure | installed-vsix | Empty catalogue; chip `Model not configured`; no `live-endpoint-ok` | `dist/wi070-macos-matrix/cf01-empty.png` |
| CF-02 resources allow | installed-vsix | POST body contains `WI070_AGENTS`, `WI070_SYSTEM`, `WI070_PROMPT`; skill **name** `fixture-skill` present | `dist/wi070-macos-matrix/cf02-allow-body.json` |
| CF-02 resources decline | installed-vsix | `#declined-resources` notice; `WI070_SYSTEM` and `WI070_PROMPT` absent; AGENTS still present per upstream | `dist/wi070-macos-matrix/cf02-decline.png`, `cf02-decline-body.json` |
| CF-03 extension commands | installed-vsix | Native sheet `Load trusted extension`; profile badge **Trusted execution**; `/sysprompt` handled by the real extension | `dist/wi070-macos-matrix/cf03-trusted.png` |
| CF-04 standard extension UI | installed-vsix | Sidebar select: System prompt, surgical/concise/plan-first, Submit/Cancel | `dist/wi070-macos-matrix/cf04-dialog.png` |
| CF-05 saved sessions | installed-vsix | Chat history lists `ping isolated runtime` same-project row | `dist/wi070-macos-matrix/cf05-sessions.png` |
| Coding loop (send/stream/complete) | installed-vsix | Three completed turns with `live-endpoint-ok`; Stop visible while `/sysprompt` ran | `dist/wi070-macos-matrix/cf02-allow.png`, `cf04-dialog.png` |
| Recovery | installed-vsix | SIGKILL of owned child; recovery banner; Recover controlled execution | `dist/wi070-macos-matrix/recovery.png` |

Windows WI-008/009/010/013/014/016/017 records remain Windows. They are not relabeled as macOS.

Runner matrix snapshot from `report.json` for owned root `/private/tmp/pi-acc-ufh7Xq`:

```json
{
  "cf01Success": { "pass": true, "host": "installed-vsix", "record": "cf02-allow.png" },
  "cf01Failure": { "pass": true, "host": "installed-vsix", "record": "cf01-empty.png" },
  "cf02Allow": { "pass": true, "host": "installed-vsix", "record": "cf02-allow-body.json" },
  "cf02Decline": { "pass": true, "host": "installed-vsix", "record": "cf02-decline.png" },
  "cf03": { "pass": true, "host": "installed-vsix", "record": "cf03-trusted.png" },
  "cf04": { "pass": true, "host": "installed-vsix", "record": "cf04-dialog.png" },
  "cf05": { "pass": true, "host": "installed-vsix", "record": "cf05-sessions.png" },
  "codingLoop": { "pass": true, "host": "installed-vsix", "record": "cf02-allow.png" },
  "recovery": { "pass": true, "host": "installed-vsix", "record": "recovery.png" }
}
```

## Verification

| Check | Actual result | Scope |
|---|---|---|
| Isolated installed VSIX | pass for the table above | Current HEAD package; loopback provider; captured POST bodies |
| Native F5 | not run | Installed VSIX is the personal-use host; F5 not required once installed cells exist |
| `npm run compile` / `lint` / `npm test` | not rerun | No application source change |

## Limits

- Skill **body** marker `WI070_SKILL` was not in the captured POST; allow showed the skill **name** only. Explicit skill-body invocation is not claimed.
- Attachment picking and change-review (WI-014/016) were not re-run on macOS. The coding-loop cell here is send → stream → complete plus Stop during the extension select.
- CF-05 is same-project history after this installed run, not a terminal-pi sequential handoff on macOS.
- Dual-window crash recovery remains the 2026-09-30 macOS record; this slice SIGKILL’d the owned child in one window.
- jsdom/Vite are not used as platform evidence. Draft ADR 0010 stays Draft.

## Final disposition

WI-070 is closed. Remaining ACTIVE parking starts at Webview directory organization.
