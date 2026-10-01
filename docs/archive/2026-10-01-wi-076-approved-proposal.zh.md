# WI-076：queued-input RPC approved proposal

[English](2026-10-01-wi-076-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-076-approved-proposal.md](2026-10-01-wi-076-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01

- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 权威：限定范围历史证据；不是产品 UI 验收

## 批准与归档原因

技术前置验证后关闭。10 月 1 日持续 goal 明确授权从既有 PI-GAP 串行 Prepare→Build 晋升，不需逐次点名。本 WI 只选择 PI-GAP-01 的公开 RPC 真实证据，产品切片独立跟进；不代表候选完成。Gate none、Decision spike-only、PRD 判定纯技术。WIP=1、不 push、不改 ADR 状态。

## 范围与方案

当前 declared／installed pi 0.86.1 CLI 连接隔离的合成 loopback provider。复用生产 LF JSONL reader，隔离 HOME、agent 状态、cwd、env。验证忙碌普通 prompt 拒绝、steering／follow-up ACK 与实际投递、clear_queue 原样返回文字，以及 clear→abort。观察公开状态、请求顺序、agent_settled、process close，并删除 owned 临时夹具。无真实凭据／付费模型／产品 session 文件访问／生产契约改变。

## 验收与失败方式

实现前列出：错误忙碌准入、队列语义混淆、ACK 冒充执行、取回文字丢失／损坏、abort 重放、旧消息污染、Unicode 分帧、失败残留进程／文件、误读真实用户状态／联网。断言必须可观察，失败非零；含 provider 保持等待时的 deadline、实际 child close 与夹具删除。gitignored dist/wi076-queue-rpc/report.json 记录 exact version／hash、宿主和限制。执行 compile、lint、npm test、显式 spike、docs:verify，关闭 docs:health。纯技术不要求 F5。交付不含 ACTIVE；归档／关闭／晋升单独 docs(active)。

## 剩余范围与被替代交接

队列准入、展示、取回、Stop、失败／恢复的用户可见闭环留给下个独立 WI，Build 前同步中英 PRD。本 probe 不推导附件或 UI 验收。下载／市场、额外生态／平台、Chat Participant、remote／multi-root、跳过审批、公开发布仍排除；Draft ADR 0010 保持 Draft。

归档原 10 月 1 日 WI-074 交接：26 份讨论及中文对已按用途导航，未移动／归档讨论。见[验收](2026-10-01-wi-074-acceptance.zh.md)。WI-072 的 compile／lint／1064 测试证据见其[验收](2026-10-01-wi-072-acceptance.zh.md)，不当作文档切片重新跑的代码测试。
