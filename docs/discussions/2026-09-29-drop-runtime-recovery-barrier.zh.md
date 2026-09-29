# 去掉自有运行时恢复门槛

[English](2026-09-29-drop-runtime-recovery-barrier.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-29-drop-runtime-recovery-barrier.md](2026-09-29-drop-runtime-recovery-barrier.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-29

- 类型：讨论
- 状态：维护者确认先结束遗留的自有运行时，再进入下一次对话。记录为 Draft [ADR 0006](../decisions/0006-owned-runtime-handoff.zh.md)。不做 Build。
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

## 未决

- 没有工作项。取证时 WI-032 为当前项，现已关闭；未授权替代方案建造。
- 结束遗留子进程后没有观察到退出时显示什么，尚未规定。
- ADR 0002 的恢复规则仍是已接受规则时，不实现。
