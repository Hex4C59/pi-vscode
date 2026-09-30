# WI-063：清单启用／关闭验收

[English](2026-10-01-wi-063-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-063-acceptance.md](2026-10-01-wi-063-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01
- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 处置：2026-10-01 由代理依据完成 ACTIVE 的 `/goal` 接受并关闭
- 权威：本启用切片的历史证据；不是运行时加载、整份 PRD、gate 或 ADR 接受
- 范围：[批准提案](2026-10-01-wi-063-approved-proposal.zh.md)
- 验收身份：代理依据维护者完成 ACTIVE.md 全部任务的 `/goal`；不是维护者亲自测试

## 已批准行为

「插件」每行有已启用开关。宿主按不透明 `id` 改写 `{path, enabled}`。启用是下一次空闲受信资格，不是当场加载。活 runtime 与执行配置保持不变。

## 验证

| 检查 | 实际结果 | 范围 |
|---|---|---|
| `npm run compile` | 通过 | 宿主／Webview 包与 `tsc --noEmit` |
| `npm run lint` | 通过 | `eslint src` |
| `npm test` | 1045 通过，0 失败／跳过 | 宿主关闭／未知用例、Webview 开关意图，加既有套件 |
| Vite 预览 `settings-review.html` | 英文深色关闭开关；中文浅色 280px 含开关与移除 | 仅呈现 |
| 原生 F5／安装版 VSIX | 未运行 | 宿主存储由自动化测试覆盖 |

## 限制

无 `-e` 应用。ADR 0010 保持 Draft。

## 最终处置

WI-063 关闭。下一项是切片 6（已启用项接到 runtime）。
