# WI-067：作曲区选择器互斥验收

[English](2026-10-01-wi-067-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-067-acceptance.md](2026-10-01-wi-067-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01
- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 处置：2026-10-01 由代理依据完成 ACTIVE 的 `/goal` 接受并关闭
- 权威：本展示切片的历史证据；不是整份 PRD、gate 或 ADR 接受
- 范围：[已批准提案](2026-10-01-wi-067-approved-proposal.zh.md)
- 验收身份：代理依据维护者完成 ACTIVE.md 全部任务的 `/goal`；不是维护者本人测试

## 已批准行为

作曲区同一时刻最多打开模型选择器或执行配置之一。添加上下文、历史与设置不变。宿主协议不变。

## 验证

| 检查 | 实际结果 | 范围 |
|---|---|---|
| `npm run compile` | 通过 | 宿主／webview 打包与 `tsc --noEmit` |
| `npm run lint` | 通过 | `eslint src` |
| `npm test` | 1060 通过，0 失败／跳过 | 打开一面会关闭另一面 |
| 原生 F5 | 未跑 | 本 WI 不要求 |
| Vite preview | 本切片通过 | 打开权限后面模型选择器关闭，芯片保持收起。合成宿主，不是 F5 或安装包 |

## 限制

不把添加上下文菜单或会话历史与这两张卡片互斥。

## 最终处置

WI-067 关闭。其余 ACTIVE 停车场从 REQ-001 拒绝资源提示开始。
