# WI-067: Approved composer picker mutex

English | [中文](2026-10-01-wi-067-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Authority: historical approved scope, not a new Build authorization for later slices
- Archival reason: WI-067 composer mutex is implemented and tested; remaining ACTIVE tasks are independent.

## Approval and Traceability

The maintainer `/goal` to complete every ACTIVE.md task authorized this Build after WI-066. User-visible: existing REQ-002 model picker and REQ-006 Execution profile. Decision: none. No gate.

## Goal and Scope

Opening the model picker closes Execution profile. Opening Execution profile closes the model picker. Add-context menu, history, and Settings stay out. No identity, Trusted-load, or approval changes.

## Approach

Composer-local coordination: `ModelPickerView` can be given open/onOpenChange; permissions `details` stay native and close the picker on toggle. Session identity reset closes both.

## Acceptance

At most one of the two cards is open. compile/lint/`npm test`. Native F5 not required.

## Subsequent Limits

REQ-001 declined-resource notice, REQ-002 duplicate-label identity, REQ-009 remainder, directory organization.
