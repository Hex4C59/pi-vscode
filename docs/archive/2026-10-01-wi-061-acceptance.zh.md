# WI-061：设置「插件」空列表与从磁盘添加验收

[English](2026-10-01-wi-061-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-061-acceptance.md](2026-10-01-wi-061-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01
- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 处置：2026-10-01 由代理依据完成 ACTIVE 的 `/goal` 接受并关闭
- 权威：本设置添加切片的历史证据；不是移除／启用、运行时加载、整份 PRD、gate 或 ADR 接受
- 范围：[批准提案](2026-10-01-wi-061-approved-proposal.zh.md)
- 验收身份：代理依据维护者完成 ACTIVE.md 全部任务的 `/goal`；不是维护者亲自测试

## 已批准行为

设置 **插件** 以仅 basename 的 `displayName` 行列出宿主清单。**从磁盘添加** 使用原生选择器和 `inspectPickedExtension`（不调用 `confirm`），向 `plugin-inventory-v1.json` 追加 `{path, enabled: true}`。重复、无效、取消、损坏和过大情况不会改写可用文件，除非是明确的追加。活 runtime 与执行配置保持不变。

## 验证

| 检查 | 实际结果 | 范围 |
|---|---|---|
| `npm run compile` | 通过 | 宿主／Webview 包与 `tsc --noEmit` |
| `npm run lint` | 通过 | `eslint src` |
| `npm test` | 1040 通过，0 失败／跳过 | 宿主添加／空／重复／取消用例、Webview Plugins 解析与导航，加既有套件 |
| Vite 预览 `settings-review.html` | 空列表、从磁盘添加、重复路径提示；英文深色、中文浅色、280px 堆叠导航、高对比 | 仅呈现；预览无原生选择器 |
| 原生 F5／安装版 VSIX | 未运行 | 原生选择器与宿主存储由自动化宿主测试覆盖 |

## 限制

无移除控件。无启用开关。无 `-e` 应用。ADR 0010 保持 Draft。

## 最终处置

WI-061 关闭。下一项是切片 4（从清单移除）。
