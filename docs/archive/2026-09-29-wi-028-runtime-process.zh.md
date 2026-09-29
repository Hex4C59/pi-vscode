# WI-028 — 分离 RPC 运行时与进程策略

[English](2026-09-29-wi-028-runtime-process.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-29-wi-028-runtime-process.md](2026-09-29-wi-028-runtime-process.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-29
- Type: Reference
- Status: Archived
- Authority: 历史 WI-028 范围、实现交接与维护者关闭；现行工作见 [`ACTIVE.md`](../../ACTIVE.md)

## 关闭 — 2026-09-29

维护者在本会话明确接受 WI-028 结果。据此关闭已批准的 RPC 编排与进程策略分离。无新 ADR 或架构 gate；托管／恢复仍以 ADR 0002 为准。PRD 仍为 Draft；本切片无新需求。

关闭覆盖已记录的自动化检查与维护者技术接受。不表示 Linux 隔离 attachment spike 已执行，也不表示 F5 或安装 VSIX 行为，不授权提交或推送。WI-027 仍在停车场等待维护者关闭。

### 从 ACTIVE 移出的最终批准提案

必填 `RuntimeProcess`（launch／release／inspect／end／recover），以及托管、直接启动、内存测试实现。生产入口与 attachment spike 迁到显式策略；RPC 运行时去掉 owner／spawn 分支。

运行时统一五秒 Stop 观察预算。托管不确定工作不得自动结束；空闲清理保留 end → recover。接口与并发／生命周期证据见[讨论](../discussions/2026-09-29-runtime-owner-seam.zh.md)的 WI-028 部分。Decision：none；遵循 ADR 0002。无 pi／协议／存储升级，无提交。

### 从 ACTIVE 移出的实现交接

`createPiRpcRuntime` 只持有 stdin／stdout／loss 订阅。生产组合托管策略，attachment spike 显式选择直接策略。策略拥有清理与恢复屏障。普通测试共用内存连接；原生策略与生产组合另测，包括启动返回后接入前的取消间隙。实现时代理侧：compile、lint、npm test（746/746，含生产依赖图）、docs:verify、docs:health、git diff --check、`spike-attachment --build` 与脚本语法检查。既有 operations-preview 用例输出两次 `Node is not defined` jsdom 诊断，全部测试通过。未改 Webview。未运行 Linux 隔离 spike、F5 或安装 VSIX。无新的真实 pi／模型证据。未提交、未推送。

同日稍后 WI-029 在此接缝上抽取三个内部 RPC 模块；该关闭另行记录。

现行职责仍见[架构](../architecture/vscode-extension-architecture.zh.md)的 RPC 进程策略一节。

## 替代原因

维护者关闭后压缩 ACTIVE。讨论记录仅作调查历史，不是当前工作权威。
