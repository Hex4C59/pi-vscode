# WI-031 — 共用会话 worker 协议

[English](2026-09-29-wi-031-session-worker-protocol.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-29-wi-031-session-worker-protocol.md](2026-09-29-wi-031-session-worker-protocol.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-29

- 类型：参考
- 状态：Archived
- 创建：2026-09-29
- 权威：WI-031 的历史范围与维护者关闭；当前工作见 [`ACTIVE.md`](../../ACTIVE.md)

## 关闭 — 2026-09-29

维护者表示 WI-031 已完成。这是对该批准切片的亲自技术接受：会话 worker 报文共用一份校验，用户可见行为和协议版本不变。Decision：none。无新 ADR 或 gate。本次关闭不授权提交或推送，也不建立 F5 或安装包行为。这两项本来就不在本切片内。

宿主和 worker 现共用 [`session-worker-protocol.ts`](../../src/adapter/sessions/session-worker-protocol.ts)。协议版本仍为 1。会话列表页仍是 16，历史页仍是 32。错误映射、精确字段、Unicode 码点与预览 UTF-16 长度保持不变。共用模块只导入宿主拥有的会话 DTO 类型。它不导入 pi SDK、进程入口或文件系统操作，也没有启动副作用。宿主仍拥有进程启动、环境覆盖、超时、取消、关闭等待和本地错误。Worker 仍拥有 SessionManager、文件身份、历史投影和流读写。

本次关闭未重跑、此前记录的代理检查：`compile`、`lint`、`npm test`（775/775，0 skipped）、`docs:verify`（0 个错误；既有 Draft ADR 0005 两条警告）、`git diff --check`。

## 替换原因

ACTIVE 回到没有当前 WI。提案与实现交接移到此处。
