# WI-072: Approved runtime RPC grouping

English | [中文](2026-10-01-wi-072-approved-proposal.zh.md)

- Type: Reference
- Status: Archived
- Created: 2026-10-01
- Authority: historical scoped record; not new implementation or product authorization

## Approval and archival reason

Archived after WI-072 delivery. The maintainer's October 1 prompt explicitly authorized this technical Build and separate implementation/ACTIVE commits. No new PRD behavior, gate or ADR. Prior broad-goal wording is historical, not authority for product candidates.

## Goal, approach and acceptance

Check actual imports before grouping jsonl, rpc-frames, rpc-replies, rpc-events, rpc-occupancy, rpc-dialogs, interaction-writer, pi-rpc-runtime, pi-rpc-model-parse and pi-rpc-probe plus corresponding tests under runtime/rpc, following process/. Keep activity projection, feedback, classification, errors, startup-model reader and process/ outside rpc. Keep runtime/index.ts and types.ts public; rpc is internal, not a new module interface. Preserve behavior, RPC contracts and packaged helper semantics. Update imports, hardcoded probe/packaging paths and documentation links. Run compile, lint, npm test, docs:verify and close-time docs:health; no F5 required.

## Import-based placement decision

Keep pi-rpc-runtime.ts and rpc-frames.ts at the module root: they coordinate the excluded root helpers. Moving them would violate the unchanged public-entry checker; routing through the parent entry would cycle or enlarge the public surface. Thus eight helpers move, with twelve existing specs. Environment types stay beside the root runtime implementation. This uses the approved import-first placement discretion, not a boundary-check exemption.

## Superseded handoffs

Earlier ACTIVE checkpoints recorded WI-071 closure and WI-072 promotion under the old broad goal. A prior record-only update added system-prompt scope to PI-GAP-16 and PI-GAP-28 input recall. Those candidates remain parked; the new prompt does not authorize them. Complete original Chinese proposal/handoffs remain in the paired record.
