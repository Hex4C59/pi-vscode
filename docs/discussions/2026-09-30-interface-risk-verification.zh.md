# 接口风险核验：Composer 标志与 FileSnapshot 校验器

[English](2026-09-30-interface-risk-verification.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-interface-risk-verification.md](2026-09-30-interface-risk-verification.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：讨论
- 状态：Closed
- 创建：2026-09-30
- 权威：WI-051 证据；不是实施批准、ADR 或接口改设计
- 相关：[UI 审查](2026-09-30-ui-components-audit.zh.md)、[核心边界审查](2026-09-30-core-boundaries-audit.zh.md)

## 问题

生产调用方是否把 Composer 准入标志与 workspace 分开组合，或把选区 `FileSnapshot` 交给整文件校验器？

## Composer 标志

生产只从 `Candidate` 挂载 `MessageComposer`。该函数派生：

| 标志 | 来源 |
|------|------|
| `canPrepare` | 同一 workspace 快照上的 `needsWorkspacePreparation(state)` |
| `canBrowse` | `state.status === "eligible"` 且已记录选择，且无客户端错误 |
| `canCompose` | `canBrowse` 且 `runtime === "ready"` 且不忙 |
| `sendBlocked` | 准备阶段：空文本／忙／错误；否则 `availability(snapshot).sendDisabled` |
| `attachmentDisabled`／`showStop`／会话切换 | 同一客户端快照上的 `availability(snapshot)` |

`ComposerProps` 仍是扁平包，类型上允许矛盾组合。预览没有第二处 composer 挂载。没有生产调用方在同一次渲染里提供与 workspace 不一致的标志。收紧类型会波及全部 composer 测试夹具；没有错误配对时不付这个成本。

## FileSnapshot 校验器

`FileSnapshot` 是捕获的文档载荷。`DraftAttachment` 是可判别联合：`kind: "file"` 与带 `authorized` 修订的 `kind: "selection"`。

| 所有者 | 配对 |
|--------|------|
| `captureFile` | 包装为 `kind: "file"` |
| `captureSelection` | 包装为 `kind: "selection"`，`authorized: source` |
| `addAttachment`／`confirmAttachment`／提交再校验 | `a.kind === "file"` → `validateEditorSnapshot`／`revalidateFile`；否则 `validateSelectionDocument`／`selectionSourceRevision` |

`validateEditorSnapshot` 的类型仍接受任意 `FileSnapshot`，包括 `text` 为选区的那份。生产从未在无 `kind === "file"` 时调用它。选区侧身份已有 `SelectionSourceRevision`。在没有错误配对证据时，给 `FileSnapshot` 打品牌或拆类型会牵动捕获、草稿与测试。

## 结论

未确认生产组合错误。不据此收紧 Composer props 或拆分 `FileSnapshot`。ARCH-01～04 所有者盘点仍分开进行。
