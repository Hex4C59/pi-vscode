# WI-068：拒绝项目资源提示验收

[English](2026-10-01-wi-068-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-068-acceptance.md](2026-10-01-wi-068-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01
- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 处置：2026-10-01 由代理依据完成 ACTIVE 的 `/goal` 接受并关闭
- 权威：本展示切片的历史证据；不是整份 PRD、gate 或 ADR 接受
- 范围：[已批准提案](2026-10-01-wi-068-approved-proposal.zh.md)
- 验收身份：代理依据维护者完成 ACTIVE.md 全部任务的 `/goal`；不是维护者本人测试

## 已批准行为

拒绝后，生产路径 `ProjectResourceConsent` 的 settled 阶段显示 `#declined-resources`，文案为「未加载项目本地 pi 资源。」。允许与未选择路径不显示。无改选控件、不恢复 `WorkspaceSetup` 卡片、不改宿主协议。

## 验证

| 检查 | 实际结果 | 范围 |
|---|---|---|
| `npm run compile` | 通过 | 宿主／webview 打包与 `tsc --noEmit` |
| `npm run lint` | 通过 | `eslint src` |
| `npm test` | 1061 通过，0 失败／跳过 | 拒绝显示提示；允许／未选择不显示；zh-CN 文案 |
| 原生 F5 | 未跑 | 本 WI 不要求 |
| Vite preview | 本切片通过 | 合成 `settings-review.html?state=resources`：Continue without 显示英文静音提示；中文显示「未加载项目本地 pi 资源」。不是 F5 或安装包 |

## 限制

不增加改选控件，不恢复 `WorkspaceSetup`，不声称任务前已披露文件夹身份。资源信任仍不是沙箱。

## 最终处置

WI-068 关闭。其余 ACTIVE 停车场从 REQ-002 同名身份缺口开始。
