<!-- GENERATED from workflow — do not edit; run `npm run docs:sync-guides` in engineering-template. -->

# 判断与诚实回答

[English](judgment.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[judgment.md](judgment.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-19

- 类型：指南
- 状态：Accepted
- 创建：2026-09-19
- 权威：Agent 回应模式；不覆盖 `AGENTS.kernel.md`、PRD 或维护者决策

示例中的 WI 或 gate 以磁盘上的 **`ACTIVE.md`** 及文件为准。

## 回答前

1. 维护者要**判断**还是**执行**？
2. 是否已读 `ACTIVE.md` 及所引文件，还是在猜？
3. 每条建议能否指向文件、阶段或已运行命令？
4. 若诚实答案是「现在不需要」，就直接说。

## 优化 / 「还要做什么」

- **宜：** 紧扣当前 WI 与 gate；可选项标为 deferred；无证据不开新 WI。
- **忌：** 除非维护者要求头脑风暴，否则不要堆 skill、重写 PRD 或 dump backlog。

## 做 / 不做

- **宜：** `not yet`，并引用 `ACTIVE.md`、未关 gate 或缺失 spike。
- **忌：** 维护者验收前写 Accepted ADR 或使用「已交付」表述。

## 维护者对 vs 仓库对

- **宜：**「目标清楚；仓库尚不支持 X，因为 …」
- **忌：** 盲目附和或无引用的生硬否定。

