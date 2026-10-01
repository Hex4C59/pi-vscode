# WI-077：文字 steering／follow-up 与取回批准方案

[English](2026-10-02-wi-077-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-02-wi-077-approved-proposal.md](2026-10-02-wi-077-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-02

- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 权威：限定范围历史方案；不是整份 PRD 或整个 PI-GAP-01 验收

## 批准与归档原因

10 月 2 日 Agent 依据 2026-10-01 持续产品切片 `/goal` 关闭。该 goal 授权从既有 PI-GAP 串行 Prepare→Build，不需逐次点名。本 WI 交付 PI-GAP-01 的纯文字 steering／follow-up、可见队列、取回与 Stop／恢复切片。附件及 slash／skill／模板展开继续停车。Gate none，Decision none。用户可见 PRD 行在 Build 前已同步。WIP=1、不 push、Draft ADR 0010 未改。

## 范围与方案

复用 pi 0.86.1 公开 `steer`、`follow_up`、`queue_update` 与 `clear_queue`。Adapter 翻译；宿主 `QueuedTextCoordinator` 拥有有界内存 ledger、session／view 世代与 Stop／recall 串行；`DraftSubmission` 仍是唯一已确认草稿 owner；Webview 只命名意图并渲染 `queuedTextState`。拒绝附件、首部 slash／skills／模板和可识别凭据。恢复是显式「放入草稿／丢弃」，不自动发送，不覆盖非空草稿。

## 验收与失败方式

实现前：队列语义混淆、ACK 当执行、忙碌／空闲准入竞态、重复点击／迟到 ACK、取回与消费、Stop clear／abort 失败、异步草稿覆盖、view／runtime／session 污染、额度丢失、未知状态自动重发。可观察发送→分开的待处理队列→消费／取回、Stop 与断线设计、compile／lint／npm test、浏览器 en／zh／窄屏／主题／键盘、真实 pi＋合成 provider、macOS F5 与安装 VSIX 及可重复工件。实现提交不含 ACTIVE；归档／关闭／晋升单独 `docs(active)`。

## 剩余范围与被替代交接

PI-GAP-01 附件和命令／模板展开仍未实现。断线恢复有设计与合成证据，未单独做活宿主断线。作曲区 320／400 px 未再取证。Follow-up 与已挂载忙碌作曲区共用路径；F5／安装证据点击的是 Steer，不是 Follow-up。下一项是 WI-078 作曲区 `/` 发现（PI-GAP-02），不重做本队列工作。Draft ADR 0010 保持 Draft。
