# 截至 WI-004 的已关闭工作项历史

[English](2026-09-21-closed-wi-history.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-21-closed-wi-history.md](2026-09-21-closed-wi-history.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-21
- 类型：归档
- 状态：Historical
- 创建：2026-09-21
- 权威：仅作上下文；当前工作仍以 [`ACTIVE.md`](../../ACTIVE.md) 为准
- 归档原因：WI-001/002/003/005/006/007/004 已关闭；其长讨论稿、验收证据与旧交接不再属于当前工作入口。

> 不得按本文件直接实现。它保留历史范围、批准、证据和限制；现行需求、架构、gate、ADR 与 `ACTIVE.md` 优先。

<a id="wi-001"></a>
## WI-001 — 构建基线与运行时探针

- **结果：** Accepted [ADR 0001](../decisions/0001-build-baseline.zh.md) 记录扩展壳、辅助侧栏基线与子进程 RPC 方向。
- **已关闭 gate：** `gate-extension-host-baseline`、`gate-sidebar-chat-shell`、`gate-runtime-host`。
- **证据：** TypeScript/esbuild 扩展壳、F5 占位页、一次带有界关闭的 `get_state` 子进程探针。
- **限制：** 未交付用户聊天、流式、模型选择、会话或 webview 信任关闭。历史 runtime spike 证据已合并入 ADR 0001；原始日志与精确原始环境记录未保留。

<a id="wi-002"></a>
## WI-002 — 版本化 ping/pong Webview 桥

- **批准范围：** nonce CSP Webview 桥与一条版本化、允许列表 ping/pong 往返；无 pi 运行时、密钥、通用命令或聊天。
- **验收：** 维护者于 2026-09-19 在 F5 观察到 `Connected (ping/pong only)`，并确认视图仍不能发送真实聊天。自动化检查拒绝畸形、未知及扩展字段消息。
- **决策：** `none`；`gate-webview-trust` 保持 Open，未写 ADR。
- **历史方案：** 宿主将入站数据视为 `unknown`，行动前严格校验 envelope；Webview 无 Node、文件系统、shell 或 pi SDK。

<a id="wi-003"></a>
## WI-003 — Project trust 技术 spike

- **决策类：** `spike-only`；维护者批准范围，并于 2026-09-19 验收技术结果。`gate-project-trust` 保持 Open。
- **问题：** 固定 pi `0.85.1` RPC 能否在启动及跨 `cwd` 会话切换时应用明确项目资源选择，而不直接读写 pi 会话或信任文件？
- **方法：** 隔离临时 home/cwd/config；公开 `PI_CODING_AGENT_DIR`；最终运行设置 `PI_OFFLINE=1`、`PI_TELEMETRY=0`；会话 fixture 与 remembered trust 仅经公开 API/hook 创建。未调用模型或安装项目包。
- **六组观察：** 全局 `always` 默认／`--approve`／`--no-approve`、remembered trust 加 `--no-approve`、全局 `never` 默认、全局 `never` 加 `--approve`。项目 extensions、skills、prompt templates、`APPEND_SYSTEM` 标记服从明确选择；`--no-approve` 覆盖全局 `always` 和 remembered trust。切换 cwd 后旧项目命令消失；每次切换观察到两次 resume 事件，调用方不能假设只有一次。
- **仍有效限制：** 拒绝项目资源后，全局扩展与 `AGENTS.md` 上下文仍存在。项目 settings 效果与 themes 未独立观察；项目包刻意未安装。系统提示证据来自 `session_start`/`getSystemPrompt`，不是 provider 请求。没有 OS 网络沙箱或独立流量审计。早期探索尚未设置 `PI_OFFLINE`；只有最终重跑使用该开关。
- **验证：** 六组真实运行时场景与策略／生命周期测试，覆盖成功、超时、失败、取消、启动错误、回调错误及清理。这证明 spike 行为，不证明完整生产隔离。

<a id="wi-005"></a>
## WI-005 — 文档健康第一阶段

- **结果：** 维护者于 2026-09-19 验收。纯技术仓库维护；未改变产品行为或 gate。
- **交付：** 双语治理指南、项目 documentation-health skill、只读 `docs:health`、生命周期元数据检查及测试。
- **限制：** 无调度器、自动语义审查、自动清理／修复、持久问题库、commit 或 PR 自动化。缺少生命周期元数据不证明新鲜；历史 ADR 仍为历史证据。
- **已记录产品讨论：** 维护者在 Draft PRD 中确认 D-01～D-04 首版方向：默认操作前询问并对范围内只读给出例外；非持久单次／当前存活会话授权；项目资源拒绝与工具审批分离；每窗口单本地目录与单活跃运行会话，显式有界文本上下文及诚实的修改归因。这些选择未批准具体实现 WI，也未把整份 PRD 变为 Accepted。

<a id="wi-006"></a>
## WI-006 — 工作区与项目资源选择 UI

- **批准范围：** 展示本地工作区资格，并记录可修改、仅内存的 allow/decline，不启动 pi。阻断无目录、多根、远程、非 file 及未信任工作区；提供原生目录／信任恢复。
- **安全／生命周期：** 宿主拥有身份与代次；拒绝 stale 消息；路径用 `textContent`；无 Webview 存储、pi trust 文件写入、密钥或运行时。视图重建保留选择；工作区／资格变化或扩展宿主重载清除。
- **修正：** 打开目录使用公开 `updateWorkspaceFolders`；编辑器标题明暗 Pi 图标恢复／聚焦现有视图，不切换隐藏。
- **验收：** provider/DOM/契约自动化通过。维护者验证项目显示、allow/decline、隐藏后恢复、独立 CLI profile 重载清空、未信任恢复与多根失效，并于 2026-09-21 按 F5 清单验收，未报告问题。
- **限制：** 未关闭 `gate-project-trust` 或 `gate-webview-trust`，未启动 pi，未证明剩余项目资源类别，也未交付完整 REQ-001。早期交接记录远程宿主及部分主题／辅助功能路径未全部独立取证；最终验收未报告问题，但未产生关 gate ADR。

<a id="wi-007"></a>
## WI-007 — 根据资源选择启动 pi RPC

- **批准范围：** eligible 工作区以 `--no-session` 和明确 `--approve`／`--no-approve` 启动固定 pi RPC；一次成功 `get_state` 作为 ready 证据；选择、工作区、资格或 dispose 变化前保持进程。
- **架构：** 宿主消费注入的 `PiRuntimeLifecycle`；扩展入口连接子进程 adapter；Webview 展示 `not-started`、`starting`、`ready`、`stopping` 或 `error`，不接收进程能力或凭证。
- **验证：** `npm test` 44/44，compile、lint、docs 检查通过。2026-09-21，维护者在受信任单根本地工作区观察到 `Runtime connected (RPC)` 与 `Choice recorded: allow project resources`，并声明 F5 验收通过。
- **限制：** 无聊天输入、流式、模型 UI、工具审批或会话列表。两个 trust gate 保持 Open；WI-003 未观察类别与隔离限制继续适用。

<a id="wi-004"></a>
## WI-004 — 首条端到端聊天（最小流式切片）

- **PRD：** REQ-004 最小 Draft 切片（用户文本 + 助手 `text_delta` 流式）；不交付 REQ-002/003/005/006/008 完整能力。
- **批准范围：** `runtime === ready` 后 `sendChat`；宿主 `prompt` + `--no-tools` RPC；`text_delta` 投影与 `agent_settled` 结束忙碌态；内存 transcript；双语 [`webview-messages`](../reference/webview-messages.zh.md) chat Outline。证据见 [WI-004 RPC（0.85.1）](../discussions/2026-09-21-wi-004-rpc-evidence-0.85.1.zh.md)。
- **Build 交付（2026-09-21）：** `PiRuntimeLifecycle.prompt`／事件订阅；`pi-rpc-runtime` 长生命周期 JSONL；读取 `~/.pi/agent/settings.json` 启动 `--model`；`chatModel` 展示；`auto_retry_end`／无回复时的有界 `chatError`。
- **验收：** 维护者 2026-09-21 声明关闭 WI-004。F5：助手文本快速逐字流式；Send → Sending… → Send；上游 503 时显示错误；在 pi 保存启动默认模型（如 gpt-5.6-luna）后扩展侧恢复正常。自动化 `npm test` 49/49、compile、lint、`docs:verify` 通过。
- **限制：** `gate-session-streaming`、`gate-webview-trust`、`gate-project-trust` 仍 Open；无扩展内模型选择（REQ-002）、Stop、工具审批、会话历史；provider 错误可能仍含简短 JSON 片段；模型依赖 pi 启动默认而非 TUI 临时切换。

## 跨会话维护记录

- 集成与 TypeScript playbook 已同步扩展中英文，补充可复用协议、生命周期、信任、隔离与升级规则。未经授权未修改生成模板指南或同级仓库。
- Windows 测试修复将 docs-health CLI 测试从 URL `.pathname` 改为 `fileURLToPath`，消除 `D:\\D:\\...` 路径失败。
- 禁用其他已安装扩展后，历史 DEP0169 输出不再出现；来源未证明，也从未声称由产品代码修复。

## 替代入口与未决上下文

当前 WI 范围与批准见 [`ACTIVE.md`](../../ACTIVE.md)。现行产品选择见 Draft [PRD](../product-requirements.zh.md)；结构所有权见[架构](../architecture/vscode-extension-architecture.zh.md)；真实 gate 状态见[架构 gate](../reference/architecture-gates.zh.md)。本归档合并多个已关闭 WI，不存在单一替代文档；以上链接是现行入口。
