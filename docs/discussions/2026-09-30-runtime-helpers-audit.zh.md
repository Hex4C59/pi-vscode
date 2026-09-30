# 运行时辅助模块审查：仅检查新文件

[English](2026-09-30-runtime-helpers-audit.md) | 中文

- Type: Discussion
- Status: Draft
- 翻译状态: Machine Draft
- 权威原文: [English](2026-09-30-runtime-helpers-audit.md)
- 原文版本: Uncommitted baseline
- 最近同步: 2026-09-30
- Scope: 继续检查此前未审查的代码；不重新打开前几轮已检查的文件，包括只检查部分区段的文件。
- Authority: 仅记录证据和候选后续。先完成代码审查，再实施修复；本记录不批准实施、新建 WI、接受 ADR 或提交 Git。

此前发现仍保存在[架构待办](../../ACTIVE.md)与 [UI 审查](2026-09-30-ui-components-audit.zh.md)。本报告新增记录，不修改那些旧记录。

## 确认问题

### RUNTIME-01／P1：流式脱敏丢失敏感上下文

[ActivityProjection](../../src/adapter/runtime/activityProjection.ts#L18)把新的 thinking delta 拼到 item map 内已经脱敏的显示文本后。[保存步骤](../../src/adapter/runtime/activityProjection.ts#L38)在下一段到达前替换了原始文本。

使用真实[凭据脱敏函数](../../src/extension/contracts/credentialText.ts#L19)，合成样本产生以下结果：

- 第一段 `Bearer SYNTHETIC_PREFIX` 变为 `Bearer [redacted]`；再拼 `_SYNTHETIC_TAIL` 后，返回 `Bearer [redacted]_SYNTHETIC_TAIL`。
- 私钥头标记变为 `[redacted]`；再拼合成私钥内容后，返回 `[redacted]SYNTHETIC_PRIVATE_PAYLOAD`。

抑制凭据值所需的上下文已经丢失。最终 thinking 内容可能再次脱敏，但这不能证明此前投影未暴露内容。本轮确认的是模块输出；没有启动真实宿主，也没有回查此前审查过的 host／UI 传递模块。

候选后续：采用有界、保留必要上下文的增量脱敏；显示文本不能同时充当原始增量输入缓存。回归覆盖分片边界及私钥内容延续，不能通过取消内存限制修复。

### RUNTIME-02／P1：引号内的凭据值只被部分遮盖

[字段值替换](../../src/extension/contracts/credentialText.ts#L23)即使处于引号内，也在空白处停止。

完整、有效的 JSON 输入 `{"password":"SYNTHETIC_ALPHA SYNTHETIC_BETA"}` 被识别为凭据文本，却变成 `{"password":"[redacted] SYNTHETIC_BETA"}`。密码的后一段仍可见。不需要流式输出也会出现，与 RUNTIME-01 是不同问题。

候选后续：结构化凭据值在展示前整体脱敏；非结构化文本中的引号值采用明确、保守的处理规则。回归覆盖空白及转义引号。探针没有使用真实凭据。

### RUNTIME-03／P2：诊断进程的异步错误绕过失败结果返回

[runPiRuntimeProbe](../../src/adapter/runtime/rpc/pi-rpc-probe.ts#L63)没有安装 child `error` 监听器。异步 spawn 错误不会被外层 `try`／`catch` 捕获。

隔离 Node 探针使用确认不存在的工作目录及 dummy CLI 路径调用真实 helper。启动失败产生未处理的 `ENOENT`，测试进程以状态 1 退出，而不是返回 `ok: false`；没有启动 pi CLI。未测量 VS Code extension-host 对该事件的全局错误处理，不据此宣称实际扩展宿主一定崩溃。

候选后续：管理 child 与 pipe 错误事件，使诊断只结算一次，清理也具有有界失败路径。

### RUNTIME-04／P2：没有观察到进程退出，也会报告诊断成功

[stopChildProcess](../../src/adapter/runtime/rpc/pi-rpc-probe.ts#L153)在期限到达时发送 SIGKILL 并立即 resolve，没有确认退出，也不检查 kill 是否被接受。[调用方](../../src/adapter/runtime/rpc/pi-rpc-probe.ts#L118)随后丢弃 child 引用，并报告进程在期限内退出。

合成 child 返回成功 RPC 回复，拒绝两次 kill，没有发出 exit，退出码与信号码保持 null。触发注入的截止时间后，真实 helper 仍返回 `ok: true`，detail 为 `process exited within timeout`。

候选后续：区分 RPC 回复成功、尝试终止与实际观察到退出。无法证明终止时，不能产生“有界退出成功”的证据。此项针对诊断 helper，不是此前审查过的生产所有权／恢复实现。

### RUNTIME-05／P2：诊断回复按 truthiness 判断成功

[回复准入](../../src/adapter/runtime/rpc/pi-rpc-probe.ts#L95)匹配 type／id／command，但不要求 `success` 为 boolean。[结果判断](../../src/adapter/runtime/rpc/pi-rpc-probe.ts#L111)会接受非 boolean 的 truthy 值。

合成回复的 `success` 为字符串 `"false"`，随后确实观察到合成 child 退出，helper 仍返回 `ok: true`。这是独立于 RUNTIME-04 的另一条误报成功路径。

候选后续：确认公共 RPC 回复形状并使用严格 boolean 判断，之后才能报告诊断 round-trip 成功。该探针不证明正常 pi 会输出这种畸形回复。

## 未量测的资源风险

- [启动模型设置](../../src/adapter/runtime/piStartupModel.ts#L26)同步读取，且没有读取大小预算。
- [诊断 stderr](../../src/adapter/runtime/rpc/pi-rpc-probe.ts#L70)无限累计；只截断最终返回 detail，并不能限制累计时的内存。

这是实现观察，不是已量测的用户可见回归。应先确认调用范围、正常开销及必要预算，不与五项确认故障混为同一状态。

## 新增覆盖清单

本轮检查 11 个新的实现文件、3 个新的测试文件。这批小文件的返回内容完整，但不表示覆盖所有分支与集成。按照维护者当前规则，下一轮也应排除本表中的每个文件。

| 本轮新文件 | 审查／证据 |
|---|---|
| [interaction-writer](../../src/adapter/runtime/rpc/interaction-writer.ts) | 交付、背压及监听器清理；运行已有测试 |
| [command-classification](../../src/adapter/runtime/command-classification.ts) | 有界命令目录及 slash 派发判断 |
| [runtime-errors](../../src/adapter/runtime/runtime-errors.ts) | 有界详情及固定用户错误分类 |
| [pi-rpc-model-parse](../../src/adapter/runtime/rpc/pi-rpc-model-parse.ts) | 标签、身份、thinking levels 及目录解析 |
| [rpc-replies](../../src/adapter/runtime/rpc/rpc-replies.ts) | 身份匹配、超时、暂停／恢复及清理；运行已有测试 |
| [child-link](../../src/adapter/runtime/process/child-link.ts) | 传输监听器、lost 回调及 abandon 行为 |
| [activityProjection](../../src/adapter/runtime/activityProjection.ts) | 有界投影及真实增量脱敏探针 |
| [extension-feedback](../../src/adapter/runtime/extension-feedback.ts) | own data property 校验、替换及容量限制 |
| [piStartupModel](../../src/adapter/runtime/piStartupModel.ts) | 全局设置路径、读取及 fallback |
| [pi-rpc-probe](../../src/adapter/runtime/rpc/pi-rpc-probe.ts) | 路径解析、诊断、回复及终止；隔离探针 |
| [credentialText](../../src/extension/contracts/credentialText.ts) | 共享检测／脱敏规则；真实合成值探针 |
| [rpc-replies 测试](../../src/adapter/runtime/rpc/tests/rpc-replies.spec.ts) | 阅读并运行 14 项已有测试 |
| [activity-projection 测试](../../src/adapter/runtime/tests/activity-projection.spec.ts) | 阅读现有覆盖；因 decoder 依赖此前已检查，本轮不运行 |
| [interaction-writer 测试](../../src/adapter/runtime/rpc/tests/interaction-writer.spec.ts) | 阅读并运行 3 项已有测试 |

## 验证与限制

- 五项发现均有复现；流式脱敏分别覆盖 Bearer 后续片段与私钥后续片段。
- 已有 reply／writer 测试：17 项通过、0 项失败。通过内存构建运行，不是仓库完整测试入口。
- esbuild 使用 `write: false`；每个 bundle 的 source inputs 都经过本轮新文件严格允许清单校验。没有遍历此前检查过的 shared contracts 或 JSONL helper：只解析本轮新读的凭据实现，诊断探针的 JSONL 依赖使用 stub。
- 投影探针直接使用规范化事件对象，不为此前检查过的 event decoder 新增验证声明。诊断 mock 是 helper 级证据，不是实际 pi 退出验收。
- 没有修改应用代码、读取真实 pi 设置、访问网络、调用付费 API 或启动 pi 运行时。异步启动失败使用一个隔离 Node 测试进程，该进程按断言退出。没有落盘探针文件；假计时器已消费，真实 helper 计时器通过结束路径清理。
- 没有运行完整测试、compile／lint、F5、安装 VSIX 或浏览器验证。旧覆盖缺口仍是缺口，不标记为完整审查。
- 仓库只新增这份报告的英中版本。文档检查结果在交接回复单独报告。
