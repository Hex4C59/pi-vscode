# WI-076：queued-input RPC acceptance

[English](2026-10-01-wi-076-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-076-acceptance.md](2026-10-01-wi-076-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01

- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 权威：限定范围历史证据；不是产品 UI 验收

## 处置

10 月 1 日 Agent 依据持续 goal 的限定授权关闭，不是维护者亲测。交付提交 `49fd804`；见[批准方案](2026-10-01-wi-076-approved-proposal.zh.md)。无 gate 关闭，不标记产品候选完成。

## 证据与复现

本 checkout 安装 declared 依赖后执行 `npm run spike:queued-input`。实际锁定 pi CLI（非 mock runtime）连接合成 loopback OpenAI-compatible provider。生成 gitignored `dist/wi076-queue-rpc/report.json`，可重新执行复现。Node v25.9.0、darwin arm64、pi 0.86.1。CLI SHA256：`e79626f2dd6f94aa45d30f3fa63cd84319a6eefcd150b353cfaf274366926774`。

忙碌普通 prompt 被拒；两条队列 ACK 后公开 pending count 为 2，尚未执行 provider 请求。clear_queue 原样返回 steering／follow-up，含中文／U+2028；clear→abort 后 pending 0。下一任务 provider 请求依次 base→steering→follow-up，无取回／拒绝消息重放；主场景共 4 请求。独立 held-provider deadline 实际拒绝，观察到子进程 close 和 owned 夹具删除；成功场景同样观察 close／删除。最终显式运行全部断言通过。

## 检查与语义审查

- `npm run compile`：通过。
- `npm run lint`：通过。
- `npm test`：1064 通过，0 失败／取消／跳过。
- `npm run spike:queued-input`：通过，含失败 deadline 清理。
- `npm run docs:verify`／`npm run docs:health`：0 错误；保留 Draft ADR 0010 两条既有提示，中英检查 0 警告／过期。
- 交付前 `npm run commit:check` 和完整 cached diff 审查：通过；记录提交前再次执行。

核对 runner／helper、脚本入口、中英 integration 路由与实际报告、本机公开 RPC 文档。新函数体均少于 50 物理行。无无关 source／公共 DTO／依赖／lockfile 修改。显式 opt-in runner 不由 npm test 收集。

## 限制与下一项

只是真实 runtime＋合成 provider，不是真实模型／extension-host／F5／安装 VSIX 验收。未交付产品队列 UI／附件／完整 PI-GAP-01。WI-077 Prepare 文字 steering／follow-up、队列展示、取回及 Stop／恢复闭环，须重新取 UI／宿主证据。保留 Draft ADR 0010 警告；无凭据／push／产品 session 文件操作／排除范围。
