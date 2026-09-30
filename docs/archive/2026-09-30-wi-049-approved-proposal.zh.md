# WI-049：组包必需资产范围批准

[English](2026-09-30-wi-049-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-049-approved-proposal.md](2026-09-30-wi-049-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 创建：2026-09-30
- 权威：历史批准范围，不是新的 Build 授权
- 归档原因：WI-049 实现与自动化证据完成；最终处置归[验收记录](2026-09-30-wi-049-macos-acceptance.zh.md) 与 [ACTIVE](../../ACTIVE.md)。

## 批准与追溯

ARCH-07 在架构待办中进入停车场。维护者 2026-09-30 要求完成 ACTIVE 剩余任务，即本 Build 授权。纯技术；无 PRD 切片、ADR 或 gate。解包运行的 `verify-vsix` 仍是独立证据通道。

## 目标与范围

组包收集入口与 CI 交付路径在缺少必需 runtime helper 或 Webview CSS 时失败。解包运行验证与构建测试分开取证。

## 方案

`collectPackageFiles` 要求宿主 JS、webview JS／CSS 与三份 helper。`npm run verify:package-files` 对同一清单做存在检查。CI 在 compile 之后运行该检查与 `verify:webview`。`package:vsix` 不调用 `verify-vsix`。

## 验收

隔离文件集合只选出宿主与 webview JS 时收集失败。选出 CSS 但省略 helper 同样失败。compile／lint／完整 `npm test`。

## 后续限制

WI-036 Build、先核验／先测量停车场项、ADR 0005、gate 与 ADR、整份 PRD 与推送仍在范围外。
