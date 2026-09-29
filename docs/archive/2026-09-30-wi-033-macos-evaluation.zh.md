# WI-033 macOS 代理受托协议评估

[English](2026-09-30-wi-033-macos-evaluation.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-033-macos-evaluation.md](2026-09-30-wi-033-macos-evaluation.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30

- 类型：Reference
- 状态：Archived
- 创建：2026-09-30
- 权威：限定切片的代理受托接受与关闭历史；现行工作见 [ACTIVE](../../ACTIVE.md)

## 2026-09-30 最终委托接受

维护者在初次证据交接后明确要求「你帮我审查完就不要我来独立接受了」，将 WI-032／WI-033／WI-034 的最终判断委托给代理。本记录自此为**代理受托接受并关闭**，不是维护者亲自测试，不再等待其独立接受。此前仅评估／待接受措辞在下方保留为初次取证时的历史，不是当前阻塞。因 WI 已关闭，双语记录成对从 discussions 归档。

接受并关闭已批准的运行时报文校验切片。维护者明确允许捕获真实 pi 字节后经既有生产 harness 验证；原帧通过，匹配的 command 错配／非布尔 success 撤销连接。截断非 JSON 依保留的兼容规则忽略，不伪报为关闭连接。原生活跃宿主坏帧注入未执行，保留为证据限制，不再挂成待维护者签认。若改为所有坏字节均停用连接，须另作范围决定。

只接受本 WI 的批准切片，不接受整份 Draft PRD，不改 gate／ADR，不提交 Git；原生未验证项不会因委托而变成通过。


## 结论与身份

本项依据 9 月 30 日 macOS 授权作**代理受托评估**，不是维护者接受或 WI 关闭。真实 pi 0.86.1 字节通过生产 reader／runtime harness。匹配的 command 错配及非布尔 success 关闭能力。截断 JSON 被丢弃，**不是**连接致命协议故障，后续合法帧仍被接受。这符合[保留提案](2026-09-30-wi-033-pending-acceptance.md) 的非 JSON 忽略规则，但不证明“所有坏字节序列都须撤销连接”的更强要求。

## 实际注入

命令：`node dist/delegated-macos-20260930/wi-033/inject.mjs`；修正 harness 启动 ID 后退出 0。真实 CLI 公共入口为 `node_modules/@earendil-works/pi-coding-agent/dist/bundle/cli.js`，参数 `--mode rpc --offline --no-tools --no-extensions --no-approve`。沿用 `isolatedFixture` 隔离 HOME、agent 目录、临时目录与环境。不调用模型、不用用户凭据、不运行项目扩展；`withProcess` 等待实际子进程 close 后才删除夹具。

真实请求 ID 为 `pi-vscode-get-state-2`，匹配 `start()` 内先调用 `stop()` 后的实际启动代际。`real-get-state.jsonl` 保存未经改写的 stdout 原始行字节。真实会话 ID／路径只来自公开 `get_state`，没有检查会话文件。原字节经 `createMemoryConnection().stdout` 进入实际 `createPiRpcRuntime`／`attachJsonlLineReader`。只替代传输所有权及 gate hello；这是**真实捕获字节回放，不是正在运行的真实 pi 子进程或原生宿主内的故障注入**。

| 变体 | 实际结果 |
|---|---|
| 原始字节 | `start().ok=true`，session 2，无 uncertain release |
| 同一回包，`command=set_model` | `ok=false`，session 0，恰好一次 `uncertain` release；stdout reader 已解绑；无隐式进程 End |
| 同一回包，`success="true"` | 同样关闭能力 |
| 截断 JSON + LF，再送原字节 | 截断行忽略、原帧接受；`ok=true`，session 2，reader 保持连接 |

本地可复跑产物：`dist/delegated-macos-20260930/wi-033/inject.mjs`、`harness.cjs`、`real-get-state.jsonl`、`results.json`。最初 harness 因捕获 ID 用代际 1 而 runtime 发代际 2 失败，已定位修正；不算产品失败或通过检查。

## macOS 宿主证据与限制

[WI-034](2026-09-30-wi-034-macos-evaluation.zh.md) 独立记录当前构建的原生 F5、隔离安装版激活与渲染，截图已查看，日志已保存；compile／lint／867 项测试通过。那些窗口包含当前 WI-033 代码，但没有向其活跃宿主运行时注入坏帧。完整自动套件包含已有 runtime 协议矩阵。不能把原生 smoke 截图改称为原生故障路径验证。

维护者接受仍待定。若要求截断非 JSON 也立即停用连接，会改变保留的兼容规则，需要明确范围决定；本次评估未改生产行为。PRD、gate、ADR 与 Git 提交不变。
