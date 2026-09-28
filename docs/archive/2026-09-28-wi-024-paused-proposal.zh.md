# WI-024 — 供应商／模型配置（暂停提案）

[English](2026-09-28-wi-024-paused-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-28-wi-024-paused-proposal.md](2026-09-28-wi-024-paused-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-28
- Type: Reference
- Status: Archived（WI 暂停，**未关闭**）
- Created: 2026-09-28
- Authority: 仅历史提案与交接；暂停项、待办 F5 与批准边界摘要见 [`ACTIVE.md`](../../ACTIVE.md) 停车场

## 归档原因

2026-09-28 维护者授权独立的侧栏视觉工艺 WI（WI-025），并要求 WI-024 的 F5 留在停车场、不并入该切片。WIP=1，因此 WI-024 移出「正在做」。这是暂停而非验收：维护者 F5 仍待办。

## 批准范围（不变）

- **PRD 判定：** 用户可见。对本个人目标切片收窄 D-04「延后登录 UI」，允许扩展内配置 API Key 与默认模型；不改审批语义，密钥不进 Webview。
- **Gate／Decision：** 无新 gate／ADR；沿用 Living 契约与 ADR 0001／0004；密钥仍在宿主。Decision：none。
- **范围：** 齿轮设置内供应商状态、宿主 InputBox 写 `~/.pi/agent/auth.json`、默认模型写 settings、配置后刷新模型列表。**不**授权 OAuth、自定义 `models.json`、平行 SecretStorage、付费探针、提交／推送。

### 已交付

1. 界面设置「供应商与模型」分区：API Key 供应商状态（ready／未配置、来源标签）、Add key／Remove、默认模型下拉。
2. 密钥只经宿主原生密码 InputBox，走公开 `ModelRuntime.login`／`logout`；Webview 只发 `providerId` 意图。
3. 默认模型经 `SettingsManager.setDefaultModelAndProvider` 持久化；就绪时应用到当前会话。
4. 无模型 banner 可打开设置。

消息：出站 `providerConfigState`；入站 `openProviderApiKey`／`logoutProvider`／`setDefaultModel`／`refreshProviderConfig`。

### 验收

| 项 | 可观察标准 |
|---|---|
| 设置入口 | 齿轮内可见供应商选择、已配置摘要与默认模型控件 |
| 密钥路径 | Add key 弹出宿主密码框；之后 Webview／消息中无密钥 |
| 模型恢复 | 已开文件夹且 runtime 就绪时，配置后 `ModelPicker` 出现真实模型 |
| 回归 | compile／lint／相关 npm test／verify:webview；必要 F5 目视 |
| 明确未验收 | OAuth、自定义端点、ambient 云凭证、付费调用 |

## 暂停时状态

- 已完成：Prepare／Build 授权；实现与自动化检查（`compile`／`lint`／`npm test` 679/679／`verify:webview`／`docs:verify`）；维护者确认混合布局（[讨论](../discussions/2026-09-28-wi-024-provider-settings-layout.zh.md)）；实现提交已授权并完成（不含 `.vscode/launch.json`）。
- 暂停时未提交：`candidate.css`、`interface-settings.tsx`、`piChatViewProvider.ts`、`modelSettings.ts` 中混合布局与模型同步修复及其测试。
- **待办：** 维护者 F5 确认设置分区（渐进展开）、Add key、模型选择器恢复。独立的 WI-023 F5（设置布局／模型选择器可见）也仍待办。

## 被替代的交接

**2026-09-28 — 设置有模型但作曲区仍未配置。** 根因：设置页用宿主 SDK 写 auth／默认模型，作曲区读 RPC 会话；`setDefaultModel` 经 `models.select`，RPC 目录为空时静默不调用 `set_model`。修复：`applyConfiguredModel` 不再要求目录；配置后同步会话，仍无模型则重启 runtime。检查：相关 model-settings 测试通过。待维护者 F5。

**2026-09-28 — 作曲区仍无模型（二次修复）。** 探针：本机 `~/.pi/agent` 已有 hellocode/gpt-6-sol，pi RPC（含 PI_OFFLINE）能返回该模型，问题在扩展侧同步。加固：runtime 就绪后 await load／refresh，缺 chatModel 则 apply 默认；刷新供应商也会同步；`getWorkspaceState` 在 ready 且无模型时补同步；重启后再次 apply。**后被 WI-025 取代：** 等待 SDK 刷新会挂住会话切换，导致「+」与模型选择器被禁用；现改为发布就绪后在后台同步（见 `ACTIVE.md`）。
