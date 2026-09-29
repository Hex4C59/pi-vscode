# pi-vscode — 当前工作（跨会话入口）

本文件是唯一当前工作入口，不是需求／架构权威或追加日志。规则见 [AGENTS](AGENTS.zh.md)、[内核](AGENTS.kernel.zh.md)与[协作指南](docs/guides/agent-collaboration.zh.md)。已关闭编号查找见 [归档索引](docs/archive/2026-09-29-closed-wi-index.zh.md)。

## Agent 会话契约（摘要）

| 步骤 | Agent |
|---|---|
| 开场 | 必要阅读、Git基线、当前WI／批准／Gate／PRD与验收核对；不把历史提案当当前授权。 |
| 提案 | Prepare保留范围与PRD判定；新增Build范围须批准；WIP最多1。 |
| 建造 | 按批准实现并实际验证；模拟／runtime／F5／安装分别取证，不虚报接受。 |
| 收尾 | 对照批准、记录代理或维护者的实际验收身份；正常ADR／gate、双语归档、检查与资源清理。 |

## 正在做（WIP=1）

| 字段 | 内容 |
|---|---|
| **ID** | WI-028 |
| **标题** | 分离 RPC 运行时与进程策略 |
| **阶段** | Build；维护者明确要求实施本轮完整计划。 |
| **PRD 判定** | 纯技术：保留生产 Stop、托管与恢复行为；统一仅 spike 的等待时机，无新 REQ。 |
| **Gate ID** | 无新 gate，遵循 ADR 0002。 |
| **Decision** | none。 |

### 目标与范围

必填 process 接口（launch/release/inspect/end/recover），托管、直接启动、内存测试实现；迁移生产入口与 attachment spike，删除 runtime 中 owner/spawn 分支。

### 方案与架构核对

运行时统一五秒 Stop 观察预算。托管不确定工作不得自动结束；空闲清理保留 end → recover。接口与并发／生命周期证据见[讨论](docs/discussions/2026-09-29-runtime-owner-seam.zh.md)的当前 WI-028 部分。较早停车场设计由本轮明确批准的计划取代。

### 验收

compile、lint、npm test、生产依赖图、docs:verify。Linux 隔离 attachment spike 在 Mac 不绕过保护；F5／VSIX 未验证单列。实现及自动化验证完成后保留维护者接受状态。

### 范围外与批准边界

本轮完整计划已由维护者明确批准实施。无提交，无 pi／协议／存储升级。既有工作树变更均按用户所有保留；WI-027 提案及待确认状态保留在停车场，不推断已接受或关闭。

## 当前焦点与未决项

- [x] WI-028 实现与自动化回归；实际检查见最近交接。
- [ ] WI-028 维护者结果接受；Linux spike、F5／VSIX 无新运行证据。

- [x] WI-027 实现与自动化检查。关闭待维护者确认。
- [x] WI-026、WI-023、WI-024 的维护者 F5 视觉接受。
- [x] 「生产聊天成为唯一组合」：维护者 F5 与安装包（VSIX）验收。
- [ ] WI-026／023／024 当时未含安装 VSIX。OAuth 与自定义 OpenAI-compatible 端点仍未开工。

## 最近交接

### 2026-09-29 — WI-028 RPC 与进程策略分离

Decision：none。必填 RuntimeProcess；RPC 只持有输入／输出／loss 订阅，生产组合托管策略，spike 显式直接策略。策略拥有清理与恢复屏障，运行时共用五秒 Stop。普通测试共用内存连接；原生策略／生产组合另测，包括启动返回后接入前的取消间隙。代理侧：compile、lint、npm test（746/746，含生产依赖图）、docs:verify、docs:health、git diff --check、spike-attachment --build 与脚本语法检查通过。测试过程中既有 operations-preview 用例输出两次 `Node is not defined` jsdom 诊断，但所有测试通过；本次未改 Webview。未运行 Linux 隔离 spike、F5 或安装 VSIX；无真实 pi／模型新证据。未提交、未推送。WI-027 待维护者确认，旧提案及交接保留于停车场。

### 2026-09-29 — 删聊天展示浅包装

无新 WI；Decision：none。删除 `mountApp`、`ModelPicker`、`DefaultModelPicker`、`CandidateReview`。禁用合成与 review 计数留在 `ModelPickerView`／`ChangeReview`。Saved default 与 Live session model 仍是两条意图。代理侧：`compile`、`lint` 通过。`npm test` 第一次 735/736，失败在未改动的 `src/extension/tests/sessions.spec.ts`（stale preview）；重跑 736/736。`verify:webview` 通过。未做 F5 或安装包验收。未提交、未推送。无新 ADR 或 gate。PRD 仍为 Draft。

## 停车场

### 2026-09-29 — WI-027 收回投递／交互文案

Decision：none。按维护者确认的「不同表面保留不同句」：删除 `attachmentError` 与 `interactionCopy`／`executionProfileCopy`；`preview.error` 只存 host code；预览用长恢复句、状态／历史用短标签，句子只在 `ui-text.tsx`＋`ui-zh-cn.ts`。调用方不再传 `language`。代理侧：`compile`、`lint`、`npm test`（736/736）、`verify:webview` 通过。未跑 `docs:verify`（ACTIVE 以外无文档对）。未做 F5／VSIX。未提交。工作树里聊天浅包装／夹具退役改动仍在，本 WI 只去掉了 `language` prop。


#### WI-027 暂停，保留原批准与验收

| 字段 | 内容 |
|---|---|
| **ID** | WI-027 |
| **标题** | 收回 Attachment snapshot 与交互文案 |
| **阶段** | Build；2026-09-29 维护者确认「不同表面保留不同句」，收进现有 UiText。 |
| **PRD 判定** | 用户可见：关联 REQ-003／006。界面中英切换覆盖范围扩大到附件预览失败句与扩展交互／执行配置；无新 REQ。可见句子保持现有英文与中文，不合并不同表面的措辞。 |
| **Gate ID** | 无。 |
| **Decision** | none。 |

#### 目标与范围

投递码与扩展交互文案只在 `UiText`＋`ui-zh-cn.ts` 对照。调用方不再自带第二套语言表。

**工作树：** 既有聊天浅包装／夹具退役改动不是本 WI；只在本切片需要处去掉 `language` prop。

#### 方案与架构核对

删除 `attachmentError`（投影层英文字符串）。`preview.error` 只保留 host code，由 `candidate-context` 按预览表面选择长恢复句。状态／历史继续用短标签（同一码若句子不同则用不同键）。`extension-interactions.tsx` 的 `interactionCopy`／`executionProfileCopy` 并入 UiText，去掉 `language` prop。未知 AttachmentCode：短标签仍字面显示；预览失败仍用原来的通用恢复句。扩展 title／option／origin／反馈正文不翻译。

#### 验收

`attachmentError`／`interactionCopy`／`executionProfileCopy` 无产品代码；中文包仍 `Record<UiText, string>`；既有 attachment／interaction 行为测试在英／中文下通过；compile、lint、相关 npm test。本切片不要求 F5／VSIX。

#### 范围外与批准边界

不做：新 i18n 框架、改 host 协议、把短标签与长恢复句挤成一句、收 `change-review`／workspace blockedCopy、停车场顺序抽取、commit。



**架构（已确认，未开工）**：把已保存默认应用到活跃运行会话模型的顺序抽取，用户可见规则冻结。维护者 2026-09-29 确认设计。词汇见 [CONTEXT](CONTEXT.zh.md)；讨论见 [2026-09-29](docs/discussions/2026-09-29-live-session-saved-default.zh.md)。WI-026 已关闭。不自动开 WI。

运行时进程接口重构已由维护者指定为 WI-028；当前批准以上方与本轮计划为准。

额外扩展生态、编辑区聊天／Chat Participant、remote／multi-root支持、额外平台、无产品依据的delta优化、全局启动默认持久化、跳过审批、图片／PDF／表格／语法高亮、历史回滚、框架更换及发布不属于本次批准队列；不得据此自动新建或实施WI。OAuth 订阅登录与自定义 OpenAI-compatible 端点属 WI-024 之后的候选，不自动开工。对照 Claude Code 的侧栏质感见[讨论](docs/discussions/2026-09-28-claude-code-ui-comparison.zh.md)。

## 已完成 WI 索引

完整编号索引见 [归档](docs/archive/2026-09-29-closed-wi-index.zh.md)（Cursor 预览直接打开该文件）。表中早期 gate Open 措辞是相应验收日期的历史，不是当前状态；当前全部六项 gate Accepted，见 ADR0001／0004。

| WI | 结果 | 完成／验收 | 历史 |
|----|------|------------|------|
| WI-026 | 编辑区设置页方案 A；维护者 F5 视觉验收 | 2026-09-29 维护者确认；安装 VSIX 不在本次证据内。同日 WI-023／024 的 F5 视觉也已确认 | [记录](docs/archive/2026-09-29-wi-026-active-superseded.zh.md) |
