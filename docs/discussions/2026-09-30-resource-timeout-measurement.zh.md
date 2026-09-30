# 资源与期限测量

[English](2026-09-30-resource-timeout-measurement.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-resource-timeout-measurement.md](2026-09-30-resource-timeout-measurement.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：讨论
- 状态：Closed
- 创建：2026-09-30
- 权威：WI-052 证据；不是实施批准、ADR 或预算变更
- 相关：[工具链审查](2026-09-30-tooling-config-audit.zh.md)、[运行时 helper 审查](2026-09-30-runtime-helpers-audit.zh.md)
- 环境：Node v25.9.0，本工作树，2026-09-30。不是卡顿、耗尽或卡死事件。

## 问题

启动设置读取、诊断 stderr 累计、artifact inflate、以及同步 test／Git 调用，是否必须先加库内大小或时间预算再修？ARCH-08 流式／历史成本不在本切片。

## 启动设置

`readPiStartupModelArg` 对 `settings.json` 使用无字节上限的 `fs.readFileSync`。本机该文件 **355 字节**（0.23 ms）。合成 UTF-8 读取：1 KiB 0.03 ms，1 MiB 0.43 ms，8 MiB 3.6 ms。该路径上的巨大文件仍会整文件进入扩展宿主。已观察／典型成本不要求预算。不把未测量的恶意替换写成当前卡顿。

## 诊断 stderr

诊断探针把每个 `stderr` 块拼进字符串，只在返回 detail 时截 500 字符。`get_state` 等待与停止默认各 **5 s**。以 4 KiB 块拼接 1 MiB／8 MiB 耗时 0.63 ms／2.7 ms；成本是内存不是 CPU。等待窗口内的管道灌入可以无上限增长。

生产 RPC 不累计 stderr（`pi-rpc-runtime`／`child-link` 排空）。session-worker stderr 已有 **64 KiB** 上限。探针侧对齐该上限属于加固，不是已证实耗尽的修复。本切片不实施。

## Artifact 读取与 inflate

`verifyWebviewArchive` 整包读取，再用 ZIP 声明的未压缩 size 调用 `inflateRawSync(..., { maxOutputLength: size })`（uint32，理论上限 4 GiB−1）。当前 `dist/webview`：`webview.js` 423 654 字节，`webview.css` 70 867，`webview-pi.svg` 290。

`verify-vsix.mjs` 同样整文件读取，inflate **没有** `maxOutputLength`。本树 `dist/pi-vscode-validation.vsix` **149 811 688 字节**，15 535 个条目；`readFileSync` 39 ms。高可压缩 1 MiB／16 MiB 全零载荷有界或无界 inflate 为 0.4–11 ms。

独立的小输出预算会拒绝这份合法 VSIX。`verify-vsix` 的 ZIP 炸弹风险未被触发。不宣称耗尽。不加预算。

## 测试与 Git 超时

`executeTests` 用 `spawnSync` 跑 `node --test`，无 `timeout` 也无 `--test-timeout`。`commit-check` 同样 `spawnSync` git。挂起只能等操作系统或外层 job。

本次关闭的完整 `npm test` 为 **12 849 ms**（1016 通过）。空暂存上 `git diff --cached --name-status -z` 为 9 ms。CI `.github/workflows/ci.yml` 未设 `timeout-minutes`；GitHub 托管 job 默认 **6 小时**。以当前耗时，不需要库内 timeout。

## 结论

没有必须立刻加上的库内大小或时间预算来修复当前卡顿、耗尽或卡死。剩余加固（探针 stderr 上限、`verify-vsix` inflate 界限）是可选后续，与 ARCH-08 测量分开。
