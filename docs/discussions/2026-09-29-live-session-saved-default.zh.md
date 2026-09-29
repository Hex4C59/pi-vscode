# 活跃运行会话模型与已保存默认的顺序

[English](2026-09-29-live-session-saved-default.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-29-live-session-saved-default.md](2026-09-29-live-session-saved-default.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-29

- 类型：讨论
- 状态：设计已确认；另开 WI 前不做 Build
- 创建：2026-09-29
- 权威：**仅作上下文**——不覆盖 [`ACTIVE.md`](../../ACTIVE.md)、PRD 或 ADR 0001–0004
- 相关：[WI-024 暂停提案](../archive/2026-09-28-wi-024-paused-proposal.zh.md)、[WI-025 归档](../archive/2026-09-29-wi-025-active-superseded.zh.md)、[CONTEXT.zh.md](../../CONTEXT.zh.md)

## 背景

2026-09-29 架构审查发现：两个值得保留的模块之间，缝是浅的。

- ProviderConfig 经进程内 SDK 持久化**已保存默认**。
- ModelSettings 经公开 RPC 应用**活跃运行会话模型**。

协调器（`PiChatViewProvider.loadStartupModels`、`syncSessionModelsAfterProviderConfig`）负责：写入 → 刷新活跃运行会话 → 子进程仍无模型时重启一次。WI-024 已记录设置走 SDK、作曲区读 RPC。PreviewBridge 的 `setDefaultModel` 只改 `providerConfig`，不跑这段顺序。

这不是把产品收成一个选择器。WI-025 已批准：已保存默认与活跃运行会话模型分开说明，不得把默认写成已经生效。

## 已确认（维护者，2026-09-29）

1. **冻结用户可见规则。** 启动前改已保存默认不启动会话。活跃运行会话就绪时，改已保存默认仍会尽量套上，必要时重启一次子进程。本切片只收这段顺序。
2. **词汇表。** `CONTEXT.md` 已定义 **Saved default** 与 **Live session model**。不为顺序模块另造第三个术语。
3. **时机。** 记录于 WI-026 仍为 Build 时：只做设计，不另开 WI，不改应用代码。WI-026 已于 2026-09-29 关闭。开启顺序抽取 WI 仍须维护者明确要求。
4. **组成。** 新模块拥有顺序。ProviderConfig（密钥／已保存默认持久化）与 ModelSettings（活跃运行会话应用）仍是注入的独立协作者。
5. **重启。** 顺序模块通过窄回调请求重启一次。协调器保留 `reconcileRuntime` 与工作区资格。顺序模块不调用 `runtime.start` / `stop`。
6. **测试。** 新测试打在顺序模块接口。ProviderConfig／ModelSettings 旧测试留下。协调器只测是否把意图转过去。
7. **本切片不做。** 目录解析合并、PreviewBridge 重写、双向 v3 准入、活跃运行会话流式／Stop 抽取。
8. **调用方操作。** 两个操作，沿用今天不同的重启规则：runtime 就绪加载（不重启）vs 写入已保存默认或凭据之后（仍无模型则重启一次）。不合成一个操作。
9. **发布。** 顺序模块通知已变化。仍由协调器包 view 身份并发送 `providerConfigState` 与活跃运行会话模型字段，与今天的 ModelSettings 相同。
10. **位置。** 模块放在 `src/extension/models/`，经该目录公共入口导出。不新建目录。

## 对收信路径的推论（由 4 与 8 得出，不是新的产品规则）

- `setDefaultModel`、`refreshProviderConfig`、`openProviderApiKey`、`logoutProvider` 走顺序模块（写入／刷新，再应用到活跃运行会话，必要时请求重启）。
- `setDefaultThinkingLevel` 仍只在 ProviderConfig 上持久化：不应用到活跃运行会话，不重启。
- 协调器创建 ProviderConfig 与 ModelSettings，注入顺序模块，并保留同一实例用于发布。

## 证据

- 胶水：`src/extension/piChatViewProvider.ts` 的 `loadStartupModels`、`syncSessionModelsAfterProviderConfig`。
- 启动加载不重启；写入后同步才可能重启一次。`setDefaultThinkingLevel` 只持久化，不同步活跃运行会话模型。
- 目前打在协调器上的测试：`src/extension/tests/provider-model-sync.spec.ts`。
- 预览漂移：`src/webview/preview/preview-bridge.ts` 的 `setDefaultModel`（本切片不做）。

## 当前倾向（不是实现批准）

设计已定，留给之后的技术 WI。WI-026 已于 2026-09-29 关闭；Build 仍等待维护者另开该 WI。维护者于 2026-09-29 确认本摘要。届时把 `provider-model-sync` 覆盖移到顺序模块接口，并更新架构文档的宿主能力表。无 ADR：冻结产品规则的进程内抽取，不是信任或 runtime 托管变更。

## 未决问题

无。维护者已于 2026-09-29 确认本摘要。Build 等待之后另开的 WI。
