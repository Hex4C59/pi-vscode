# WI-060：宿主清单存储验收

[English](2026-10-01-wi-060-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-060-acceptance.md](2026-10-01-wi-060-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01
- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 处置：2026-10-01 由代理依据完成 ACTIVE 的 `/goal` 接受并关闭
- 权威：本宿主存储切片的历史证据；不是设置 UI、运行时加载、整份 PRD、gate 或 ADR 接受
- 范围：[批准提案](2026-10-01-wi-060-approved-proposal.zh.md)
- 验收身份：代理依据维护者完成 ACTIVE.md 全部任务的 `/goal`；不是维护者亲自测试

## 已批准行为

`loadPluginInventory`／`replacePluginInventory` 把 `{ schemaVersion: 1, entries: [{ path, enabled }] }` 存在 `globalStorageUri/plugin-inventory-v1.json`。缺文件为空。损坏和过大的文件保持不改写。

## 验证

| 检查 | 实际结果 | 范围 |
|---|---|---|
| `npm run compile` | 通过 | 宿主／Webview 包与 `tsc --noEmit` |
| `npm run lint` | 通过 | `eslint src` |
| `npm test` | 1033 通过，0 失败／跳过 | 六条新清单存储用例加既有套件 |
| 原生 F5／安装版 VSIX | 未运行 | 本切片无 UI |

## 限制

无设置分类。无 Webview 清单投影。无 `-e` 应用。ADR 0010 保持 Draft。

## 最终处置

WI-060 关闭。下一项是切片 3（设置空列表＋从磁盘添加）。
