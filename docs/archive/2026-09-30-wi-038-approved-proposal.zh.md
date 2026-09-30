# WI-038：跨宿主 endpoint 写入批准范围

[English](2026-09-30-wi-038-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-038-approved-proposal.md](2026-09-30-wi-038-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 创建：2026-09-30
- 权威：历史批准范围，不是新的 Build 授权
- 归档原因：WI-038 实现与所需证据完成；最终处置归[验收记录](2026-09-30-wi-038-macos-acceptance.zh.md)、[ADR 0007](../decisions/0007-endpoint-write-transaction.zh.md) 与 [ACTIVE](../../ACTIVE.md)。

## 批准与追溯

维护者确认 WI-038 Build，覆盖 ARCH-05／REQ-002，包括立即拒绝争用、遗留锁保守恢复与外部写入尽力检测。本会话要求完成 ACTIVE 剩余任务、写收尾并在每项后提交 Git，即关闭授权。实机证据取于 Build，含 WI-039 之后的隔离安装版重跑。本次关闭不伪称维护者亲自重跑这些宿主。

## 目标与范围

同一 `models.json` 的自定义 endpoint 添加／删除在扩展宿主之间互斥。争用或检测到外部版本变化时明确失败，不改文件、不启动登录／注销。干净提交、未提交与已提交但清理失败分开；只有干净提交继续凭据动作。遗留锁保留，直至写入宿主关闭并由维护者核对。

范围外：ARCH-06 输出预算、ADR 0005 接受、Webview 解锁能力、自动接管遗留锁，以及排除不参与锁协议的外部写入。

## 方案

`customEndpoints.ts` 继续负责文档校验与合并。`endpointFileTransaction.ts` 拥有规范化路径身份、相邻 `.models.json.pi-vscode.lock` 目录、替换与自有清理。`ProviderConfig` 只在干净提交后继续重载／登录／注销。锁元数据为随机身份与 PID。目录别名共享锁；不明确的链接目标拒绝写入。

## 验收

独立进程 add/add、add/remove、remove/remove；明确争用、冲突与清理结果；故障后续动作抑制；路径身份与遗留锁测试；compile／lint／完整测试／文档检查；分开记录的 macOS 开发宿主与隔离安装版双窗口证据。

## 后续限制

忽略锁的外部写入仍可在最终检查与 rename 之间竞争。崩溃遗留需要手工恢复。WI-039 的组包修复解除了安装版取证阻断，不改变本并发决定。
