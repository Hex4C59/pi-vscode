# WI-072: Approved runtime RPC grouping

[English](2026-10-01-wi-072-approved-proposal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-072-approved-proposal.md](2026-10-01-wi-072-approved-proposal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01

- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 权威：历史切片记录；不构成新的实现或产品授权

## 归档原因与本轮批准

WI-072 已交付。本轮 2026-10-01 提示明确批准本技术切片与拆分提交；旧全目标措辞不是产品候选授权。八个 helper 移动，pi-rpc-runtime.ts／rpc-frames.ts 依实际 import 留根目录：避免跨模块根非入口 import、父入口循环与接口扩张；类型仍与根实现同目录。未放宽架构检查。

## 目标、方案与验收



按 `src/adapter/runtime/` 现有 `process/` 先例，把 RPC 传输与会话文件归组到内部目录。维护者 `/goal` 完成 ACTIVE.md 全部任务并授权本 Build。WI-071 已关闭。

| 字段 | 内容 |
|---|---|
| **ID** | WI-072 |
| **阶段** | 建造 |
| **Gate ID** | none |
| **Decision** | none |
| **PRD 判定** | 纯技术：按职责分组 `src/adapter/runtime/` 内 RPC 文件，不改用户可见行为、协议或契约 |

**目标与范围**

把散落在 `src/adapter/runtime/` 根目录的 RPC 传输／会话文件归入内部目录（建议 `rpc/`，与已有 `process/` 并列），包括 `jsonl.ts`、`rpc-frames.ts`、`rpc-replies.ts`、`rpc-events.ts`、`rpc-occupancy.ts`、`rpc-dialogs.ts`、`interaction-writer.ts`、`pi-rpc-runtime.ts`、`pi-rpc-model-parse.ts`、`pi-rpc-probe.ts` 及对应测试。移动前按实际 import 核对：不要把活动投影、扩展反馈、命令分类、错误归一化、启动模型读取或 `process/` 误并入 RPC 目录。保留 `runtime/index.ts` 与 `runtime/types.ts` 作为模块公共入口。不为 `rpc/` 自动新增模块接口，除非公共入口检查要求。不改行为、RPC 契约、打包 helper 语义或测试收集合同以外的必要路径更新。

**方案与架构核对**

先列文件与消费者，再 `git mv`、改写相对 import，更新硬编码路径断言（架构边界、探针、打包、文档定位器）。`adapter/runtime` 仍是架构模块；子目录默认只是内部分组。架构层边界仍以 [vscode-extension-architecture](../architecture/vscode-extension-architecture.zh.md) 为准。

**验收**

移动后 `npm run compile`、`npm run lint`、`npm test` 通过。无用户可见行为变化。路径变化则跑 `docs:verify`。WI 关闭跑 `docs:health`。

**范围外与批准边界**

docs 目录整理、PI-GAP-01–28、下载／市场。批准：维护者 `/goal` 完成 ACTIVE 全部任务。docs 目录整理与 PI-GAP 仍停放、不自动启动。


**原交接（已替代）**


2026-10-01 维护者要求继续记录功能候选：系统提示词管理已补入 PI-GAP-16，输入历史召回新增 PI-GAP-28；仅记录，不启动 Build，不改变当前 WI 或既有队列。

**2026-10-01 — WI-072 晋升（Runtime RPC 目录整理）**

维护者 `/goal` 串行完成 ACTIVE 全部任务。WI-071 已关闭。本切片只整理 `src/adapter/runtime/` 内 RPC 文件位置，不改行为。docs 目录整理与 PI-GAP 仍停放。

**2026-10-01 — WI-071 关闭（Webview 目录整理）**

展示文件已按 README 树分组。见[验收](../archive/2026-10-01-wi-071-acceptance.zh.md)。



## import 归属决定

两项保留理由见上文本轮批准说明；其余八项归组，不新设公共接口。

## 替代交接

完整旧交接已在上文保留；本轮授权边界取代旧全目标措辞。
