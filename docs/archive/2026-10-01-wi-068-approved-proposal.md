# WI-068: Approved declined project-resource notice

English | [中文](2026-10-01-wi-068-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Authority: historical approved scope, not a new Build authorization for later slices
- Archival reason: WI-068 declined-resource notice is implemented and tested; remaining ACTIVE tasks are independent.

## Approval and Traceability

The maintainer `/goal` to complete every ACTIVE.md task authorized this Build after WI-067. User-visible: existing REQ-001 declined-resource indication. Decision: none. No gate.

## Goal and Scope

Settled `choice === "decline"` shows a persistent status notice. Do not restore `WorkspaceSetup`, add a change-choice control, or change the host consent protocol. Allow does not gain a notice.

## Approach

Webview presentation in `ProjectResourceConsent` using the existing `choice` field. Copy states that project-local pi resources are not loaded; it does not describe a sandbox.

## Acceptance

`#declined-resources` after decline+ready; absent on allow and before a choice. compile/lint/`npm test`. Native F5 not required.

## Subsequent Limits

REQ-002 duplicate-label identity, REQ-009 remainder, directory organization.
