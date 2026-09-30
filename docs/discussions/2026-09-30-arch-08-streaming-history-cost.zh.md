# ARCH-08 流式与历史预览成本

[English](2026-09-30-arch-08-streaming-history-cost.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-arch-08-streaming-history-cost.md](2026-09-30-arch-08-streaming-history-cost.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：讨论
- 状态：Closed
- 创建：2026-09-30
- 权威：WI-053 证据；不是实施批准、ADR 或优化
- 相关：[核心边界审查](2026-09-30-core-boundaries-audit.zh.md)
- 环境：Node v25.9.0，本工作树，2026-09-30。仅进程内合成 CPU。不是已复现的 UI 卡顿。未测量 VS Code `postMessage` IPC。

## 热路径上已有的产品界限

| 界限 | 所有者 |
|------|--------|
| 最近 32 条消息 | `text_delta`／`message_final` 的 `messages.slice(-32)` |
| 助手正文 65 536 字符 | 同一处理 |
| 64 条活动 | `activity` 处理 |
| 历史预览窗口 8 192 字符 | `projectSavedHistoryPreview` |
| 历史概览 4 096 字节 | `bounded` |

这些是回复／响应预算，不是处理成本预算。

## 流式发布与渲染

每个 `text_delta` 复制消息数组、追加，并 `publish()` 投递完整 workspace 对象（不像 interaction／profile／provider 那样用 JSON 指纹跳过）。Webview 把该对象存为 `workspace`；`CandidateConversation` 每次重组全部 activity 再 map 每一行；凡有正文的助手消息都无 memo 地调用 `Lexer.lex`。

本机进程内平均：

| 负载 | 结果 |
|------|------|
| `JSON.stringify` 32 条 × 1 KiB + 64 条活动 | 52 KiB，0.06 ms |
| 32 × 8 KiB | 281 KiB，0.17 ms |
| 32 × 32 KiB | 1.07 MiB，0.39 ms |
| 32 × 65 536（产品上限） | 2.12 MiB，0.41 ms |
| 一条增长中的 65 536 字符消息 | 66 KiB，0.03 ms |
| `Lexer.lex` 关闭 GFM 的 markdown 1 KiB／8 KiB／32 KiB／65 536 | 0.28／0.29／1.07／1.99 ms |
| 十六条 65 536 字符助手 lex（32 行混合记录的上限） | 32 ms |
| 会话 Map 重组 32×64 | 0.007 ms |

已测最贵步骤是每次快照对每条助手正文重新 lex，产品上限约 32 ms。典型单消息流式约 2 ms lex 加约 66 KiB 载荷。2 MiB 快照的宿主到 Webview IPC 未测。会话遍历可忽略。

## 历史预览

`selectSession` 始终经公开 SessionManager `list`，校验每个列表项，再 `open` 目标。本切片未对大量 session 目录跑真实 SDK list（那会碰到 session 文件；解析它们超出范围）。排序 1 000 条合成 metadata 低于 2 ms。

`projectSavedHistoryPreview` 为 `totalChars` 遍历分片并只保留 8 192 窗口。一条 1 MiB 字符串：0.006 ms。现有 600 × 1 MiB 共享块夹具（逻辑约 629 MiB，不 join）：0.39 ms，与「不得物化全文」的测试一致。

## 结论

不据此优化。只有在真实宿主于 32×64 KiB 上限出现卡顿，或测到每 delta 2 MiB IPC 之后，才把 `ReplyMarkdown` lex memo 或缩小 delta 载荷列为后续切片。历史预览已经避免拼接巨大文本；多 session 的 SDK list 成本仍未测量，也不是自行解析 session 文件的许可。
