# ARCH-04 model types and Webview DTO sharing

English | [中文](2026-09-30-arch-04-dto-coupling.zh.md)

- Type: Discussion
- Status: Closed
- Created: 2026-09-30
- Authority: WI-056 inventory; not an implementation approval, ADR or type split
- Related: [webview protocol](../reference/webview-messages.md)

## Question

Does sharing Webview DTO types with host model settings and the runtime lifecycle create a maintenance cost that justifies a conversion layer?

## What is shared

| Type | Defined in | Used by |
|------|------------|---------|
| `ModelCatalogEntry` | `webviewProtocol.ts` | Webview picker, `ModelSettingsSnapshot` via `Pick`, `PiRuntimeLifecycle` projection/mutation results, `findCatalogEntry`, provider config catalog |
| `ActivityItem` | same | Runtime events and workspace `activities` |
| `AttachmentDetails` | same | Prompt enrichment and attachment UI |
| `ChatLine` | same | Live messages and saved-history overview |
| `RuntimePhase` | same | Workspace `runtime` and re-exported from lifecycle |

`ModelSettingsSnapshot` is `Pick<WorkspaceStateMessage, chatModel | thinkingLevel | thinkingLevels | availableModels | modelBusy | modelError | pendingModel | pendingThinkingLevel>`. Host admission (`ModelSettingsContext`) is already a separate type: generation, session, ready, disposed, blocked, chatBusy, stopping.

`publish()` spreads `this.state` with `this.models.snapshot`. Shared field names are the conversion: there is no second mapper.

## Propagation

A display-only Webview field added to `WorkspaceStateMessage` does not automatically appear on `ModelSettingsSnapshot` unless someone adds it to the `Pick`. A field added to `ModelCatalogEntry` (for example an icon) would force catalog parse, settings snapshot, provider config and the picker together. That coupling is real and currently unused: the entry is only provider, modelId and label.

Runtime events use `ActivityItem` because the host projects the same bounded activity the Webview renders. Duplicating that shape would add a mapper owned by the coordinator with no second frontend.

## Conclusion

Shared value objects stay. Do not copy the catalog or activity types for a hypothetical extra client. If a Webview-only catalog field appears later, the conversion owner is host `publish()` / model snapshot mapping, not the adapter RPC layer. No split on this evidence.
