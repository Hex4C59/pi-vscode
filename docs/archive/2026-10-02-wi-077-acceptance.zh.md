# WI-077：文字 steering／follow-up 与取回验收

[English](2026-10-02-wi-077-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-02-wi-077-acceptance.md](2026-10-02-wi-077-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-02

- 类型：参考
- 状态：Archived
- 创建：2026-10-02
- 权威：限定范围历史证据；不是整个 PI-GAP-01 或整份 PRD 验收

## 处置

10 月 2 日 Agent 依据持续产品切片 goal 关闭，不是维护者亲测。实现提交含 `fc9e0ab`、`6ade3e7`、`d2f39d3`、`2f27b83`、`1fdd692`、`14be1cc`、`3d24f3b`、`65498d9`（不含 ACTIVE）。见[批准方案](2026-10-02-wi-077-approved-proposal.zh.md)。无 gate 关闭。PI-GAP-01 剩余范围继续停车。

## 证据与复现

锁定 pi **0.86.1**，VS Code **1.139.1**，Darwin arm64。隔离合成 OpenAI-completions loopback；资源拒绝。VSIX SHA-256 `98d240bf127d84b84af1894552751ae706382545ce79a3bbaef01ad5ebcf7557`（gitignored `dist/wi077-queued-host/pi-vscode.vsix`）。

| 层级 | 观察 | 记录 |
|------|------|------|
| jsdom／已挂载作曲区 | 忙碌时 Steer／Follow-up；Enter 不发送；键盘可达 | `src/webview/tests/queued-text-mounted.spec.ts`；`65498d9` |
| 浏览器 preview | en／zh-CN、280 px、dark／light、高对比；Steer pending、Stop→放入草稿 | gitignored `dist/wi077-queued-ui/` |
| 安装 VSIX | Working… → Steering `WI077_STEER_from_installed` → Stop Recalled → Use in draft 恢复作曲区 | `installed-steer.png`、`installed-recall.png`、`installed-use-in-draft.png`、`report.json` |
| macOS F5 | Extension Development Host；Steering `WI077_STEER_from_f5`；Recalled text；Use in draft 恢复精确文字 | `f5-steer.png`、`f5-recall.png`、`f5-use-in-draft.png`、`report.json`（`phase: queue-f5`，`ok: true`） |

F5 复现（gitignored runner）：`npm run compile` 且该证据目录已有打包 VSIX 后执行 `ACCEPT_PHASE=queue-f5 node dist/wi077-queued-host/run.mjs`。安装车道用 `ACCEPT_PHASE=queue`。报告可重新生成，不入库。

## 检查与语义审查

- `npm run compile`：F5 前通过（esbuild + 宿主／Webview／测试 tsc）。
- `npm run lint`：关闭时通过（`eslint src`）。
- `npm test`：关闭时 1140 通过，0 失败／取消／跳过。
- `npm run docs:verify`／`npm run docs:health`：0 错误；保留 Draft ADR 0010 两条既有提示；中英 0 警告／过期。

F5 窗口标题为 `[Extension Development Host] A`。待处理 UI 显示 Steering 与 `WI077_STEER_from_f5` 及 Recall pending text；Stop 后 Recalled text 与 Use in draft；作曲区恢复 `WI077_STEER_from_f5`。宿主 toast「Extensions have been modified on disk」未中断队列闭环。

## 限制与下一项

合成 provider，不是付费／真实模型。F5／安装宿主未单独点击 Follow-up。活宿主断线、作曲区 320／400 宽度、PI-GAP-01 附件／命令未验收。无凭据、push、产品 session 文件操作或排除范围。下一项是作曲区 `/` 发现（PI-GAP-02）。
