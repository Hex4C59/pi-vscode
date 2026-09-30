# WI-066：作曲区模型芯片展示验收

[English](2026-10-01-wi-066-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-066-acceptance.md](2026-10-01-wi-066-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01
- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 处置：2026-10-01 由代理依据完成 ACTIVE 的 `/goal` 接受并关闭
- 权威：本展示切片的历史证据；不是整份 PRD、gate 或 ADR 接受，也不关闭 REQ-002 同名缺口
- 范围：[已批准提案](2026-10-01-wi-066-approved-proposal.zh.md)
- 验收身份：代理依据维护者完成 ACTIVE.md 全部任务的 `/goal`；不是维护者本人测试

## 已批准行为

作曲区与设置里的 `ModelPickerView` 显示格式化模型 id、不显示供应商。英文思考强度 Title Case。打开的选择器没有 Model／Thinking level／Open provider settings；居中的名称＋强度打开列表；滑条只改思考。宿主 `chatModel` 仍是 `provider / modelId`。WI-042 radio 仍用稳定的 `provider:modelId`。

## 验证

| 检查 | 实际结果 | 范围 |
|---|---|---|
| `npm run compile` | 通过 | 宿主／webview 打包与 `tsc --noEmit` |
| `npm run lint` | 通过 | `eslint src` |
| `npm test` | 1059 通过，0 失败／跳过 | 芯片 `GPT-6-Sol · Low`、列表无供应商、待应用文案、中文思考标签 |
| 原生 F5 | 未跑 | 本 WI 不要求 |
| Vite preview | 本切片通过 | 空会话芯片 `Claude Sonnet · Medium`；打开选择器无 Model／Thinking level／Open provider settings；列表行 `Claude-Sonnet`／`GPT-5`／`Gemini-Pro` 无供应商。核对 280／320／360／400 暗色与 320 浅色／高对比。合成宿主，不是 F5 或安装包 |

## 限制

不关闭 REQ-002 跨供应商同名缺口。模型选择器与执行配置互斥仍属后续。

## 最终处置

WI-066 关闭。其余 ACTIVE 停车场从作曲区弹出层互斥开始。
