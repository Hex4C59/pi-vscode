# WI-029 — RPC 运行时内部模块

[English](2026-09-29-wi-029-rpc-runtime-modules.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-29-wi-029-rpc-runtime-modules.md](2026-09-29-wi-029-rpc-runtime-modules.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-29
- Type: Reference
- Status: Archived
- Authority: 历史 WI-029 范围、实现交接与维护者关闭；现行工作见 [`ACTIVE.md`](../../ACTIVE.md)

## 关闭 — 2026-09-29

维护者在本会话明确接受 WI-029 结果。据此关闭已批准的 `createPiRpcRuntime` 三内部模块拆分。无新 ADR 或架构 gate。PRD 仍为 Draft；本切片无新需求。

关闭覆盖已记录的自动化检查与维护者技术接受。不表示真实 pi、F5 或安装 VSIX 行为，不授权提交或推送。WI-028 仍在停车场：实现完成、维护者接受待确认。

### 从 ACTIVE 移出的最终批准提案

基于工作树中已实现的进程策略拆分，继续重构。保持 `PiRuntimeLifecycle`、宿主调用方式及用户可见行为不变。在 `src/adapter/runtime/` 新增三个具体模块，不增加通用框架或对外接口：

1. **请求应答配对**拥有请求编号、待应答、分发、超时及清理。收回启动阶段可暂停的剩余时间预算；多个对话框未完成时不恢复，最后一个回复写入完成后才恢复。普通 prompt 的 ACK 超时、已识别扩展命令无人工等待 ACK 超时，以及现有请求校验差异保留。写入回调、背压和单次发送凭证仍由发送编排负责。
2. **帧翻译**拥有 JSONL 解析、分类、`ActivityProjection` 及有序 `RuntimeEvent` 映射。不访问子进程、不写入流、不执行审批回调。普通事件映射可直接输入 JSON 测试。
3. **任务忙闲**拥有发送、ACK、扩展命令、agent、Stop、对话框及审批占用的命名转换。发送准入、重启检查、释放分类和停止完成共用状态，不合并成一个 `isIdle`。任务结束与 ACK 到达相互独立；扩展命令结束不等于 agent 结束。

`pi-rpc-runtime.ts` 仍是编排者。五秒 Stop 总预算、连接失效先撤销再清理、旧连接结果隔离保持不变。Decision：none。

### 从 ACTIVE 移出的实现交接

三个模块为 `rpc-replies.ts`、`rpc-frames.ts`、`rpc-occupancy.ts`，不从 runtime 公共入口导出。中英文架构运行时职责说明已同步。代理侧：compile、lint、npm test（764/764；基线 746，新增 18 个无子进程模块测试，含生产依赖图）、docs:verify、git diff --check。未另记行为缺陷。未跑真实 pi、F5 或安装 VSIX。无付费模型调用，未提交、未推送。

## 替代原因

维护者关闭后压缩 ACTIVE。现行运行时职责仍见[架构](../architecture/vscode-extension-architecture.zh.md)的 RPC 进程策略一节。
