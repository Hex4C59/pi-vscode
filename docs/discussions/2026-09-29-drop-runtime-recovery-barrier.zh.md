# 去掉自有运行时恢复门槛

[English](2026-09-29-drop-runtime-recovery-barrier.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-29-drop-runtime-recovery-barrier.md](2026-09-29-drop-runtime-recovery-barrier.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-29

- 类型：讨论
- 状态：WI-035 于 2026-09-30 依据明确代理委托接受并关闭，[ADR 0006](../decisions/0006-owned-runtime-handoff.zh.md) 已 Accepted。[实际 macOS F5／隔离安装证据与限制](../archive/2026-09-30-wi-035-macos-acceptance.zh.md)。
- 创建：2026-09-29
- 权威：**仅作上下文**——不覆盖 [`ACTIVE.md`](../../ACTIVE.md)、PRD 或 ADR 0002
- 相关：[ADR 0002](../decisions/0002-interaction-contract-route.zh.md)

## 背景

2026-09-29 维护者要求侧栏行为对齐 Claude Code 和 Codex：不要「运行时结果不确定」黄条，也不要「结束自有运行时／恢复受控执行」。维护者不需要这套流程。

当天 VS Code 用户全局存储 `pi-vscode-dev.pi-vscode/recovery-v1/fence.json` 于 18:05:37 写下，且没有退出回执。当时由此仓库的 `dist/runtime-supervisor.mjs` 启动的 `pi` 子进程，工作目录是 `/Users/hex4c59/Downloads`。约 22:07 该子进程仍在运行，原来的扩展宿主已经不在。之后没打开文件夹的窗口仍显示黄条，因为这份 fence 还在。没打开文件夹不会创建 fence。宿主只在「已打开受信任的本地文件夹并选择过项目资源」之后启动运行时才会写它。模型和登录仍在 `~/.pi/agent`。fence 不是已保存会话。

## 约束

ADR 0002 接受这份 fence。重新加载和「看不到进程」都不能清除它，扩展也不会自动结束子进程。只藏起黄条、规则仍在时，下一次启动仍会被挡住。对齐 Claude Code 和 Codex 要取代这条恢复规则，并需要一份新 ADR。在新 ADR 被接受之前，ADR 0002 保持 Accepted。

## 候选

1. **只隐藏黄条。** fence 仍挡住下一次运行时。这不符合要求。
2. **宿主启动时结束上一个自有子进程，退休 fence，并显示正常的空对话或无文件夹页。** 不再有结束／恢复两步。仍在运行的子进程可能未经对话框就被停止。
3. **忽略 fence，旧进程继续运行。** 空页面会马上出现。两个 `pi` 进程可能同时改文件。

## 已确认

2026-09-29 维护者选择候选 2：先结束遗留的自有子进程，再进入对话。候选 1 和 3 关闭。Draft ADR 0006 记录该选择。在它标为 Accepted 之前，不取代 ADR 0002。

## 后续解决与 Codex 对照

前述约束和确认保留 2026-09-29 决定时点。2026-09-30 维护者批准 WI-035 并委托依据证据验收。[ADR 0006](../decisions/0006-owned-runtime-handoff.zh.md) 补齐活所有者安全与失败诚实：只自动结束失去所有者的运行，退休仍需精确回执，无法确认清理时保留既有显式恢复页。[验收记录](../archive/2026-09-30-wi-035-macos-acceptance.zh.md) 区分自动化分支与实际 F5／安装证据，并披露初始原生／工具失败。ADR 0002 的共享域、直接子进程证据与会话内不确定性规则仍保留；只有启动仪式在 ADR 0006 Accepted 时被替代。

Codex 只读取证使用本地源码 commit `58ac2a8773da0ac6eb21471e6d3da5744d9e9e0c`（2026-03-18）、已安装 CLI 0.156.1 与 VS Code 扩展 26.917.62051。这是三个版本事实，不是同一构建。[spawn.rs](https://github.com/openai/codex/blob/58ac2a8773da0ac6eb21471e6d3da5744d9e9e0c/codex-rs/core/src/spawn.rs#L81-L124) 使用 `kill_on_drop(true)`，且**仅 Linux** 请求父进程死亡 SIGTERM；该条件不能证明 macOS 崩溃清理或所有后代终止。已安装扩展拥有内存中的子进程，并执行 teardown／kill 检查，被中断请求仍按 outcome-unknown 处理。app-server EOF／ConnectionClosed 单独不能证明完整进程树停止。不能据此声称 Codex 普遍无遗留、跨窗口协调保证，或 Claude Code 实现事实。

维护者后续 Codex 型方向作为 WI-036 留在 ACTIVE：owner-loss 当场清理和可能的每窗口独立域属于未来问题，不是 WI-035 改动。其准入、失败和旧记录迁移取舍仍须明确批准。本讨论或对照不授权这些实施或任意删除记录。
