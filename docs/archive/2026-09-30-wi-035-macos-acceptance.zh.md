# WI-035：macOS 评估与验收

[English](2026-09-30-wi-035-macos-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-035-macos-acceptance.md](2026-09-30-wi-035-macos-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：Archived
- 创建：2026-09-30
- 处置：2026-09-30 代理依据本次委托接受并关闭
- 权威：本批准切片的历史证据，不接受整份 PRD、公开发布或其他 WI
- 范围：[批准提案](2026-09-30-wi-035-approved-proposal.zh.md)、REQ-005／REQ-006 与 [ADR 0006](../decisions/0006-owned-runtime-handoff.zh.md)
- 验收身份：代理依据维护者 2026-09-30 明确委托，不伪称维护者亲自执行测试

## 批准行为与实现

Provider 构造时先自动交接前任宿主失去所有者后遗留的运行，再准入替代运行。空域／验证退休后正常显示，无 End／Recover。只观察控制区分另一活宿主；打开窗口或尝试启动都不结束其运行。失败／未确认交接保留 fence 和既有显式恢复。会话内 Stop／协议不确定性和共享单运行时限制不变。

ownership 校验有界精确 run 控制响应，观察持久精确子进程终态回执并只退休该运行。managed-process 与 cleanup 串行，保护活跃／在途启动及更新代际。Provider 等待交接、重验 disposal／工作区／资源状态，抑制失效恢复控件。后来取得自己的运行会清除 elsewhere-owner 标记，使本宿主后续故障仍显示恢复。不改 Webview DTO、预览夹具、存储 schema 或 pi 版本。

## 自动化验证

| 检查 | 实际结果 | 范围 |
|---|---|---|
| `npm run compile` | pass | 生产产物与 TypeScript |
| `npm run lint` | pass | 静态检查 |
| `npm test` | 895／895 pass | 完整套件，含 ownership 判定表、真实只观察 supervisor、进程串行化与宿主启动回归 |
| `npm run package:vsix -- --out dist/delegated-macos-20260930/wi-035/pi-vscode.vsix` | pass | 用于隔离安装的新鲜归档 |
| `node scripts/packaging/verify-vsix.mjs dist/delegated-macos-20260930/wi-035/pi-vscode.vsix` | pass，15,535 条目 | 锁定发行 pi、依赖树与解包后的真实 RPC readiness／gate 握手 |
| `npm run docs:verify`、`npm run docs:i18n:check`、`npm run docs:health`、`git diff --check` | pass，零错误 | 结构、双语／链接、健康与空白检查，不是行为证据 |

新增回归覆盖空域／终态／活所有者／owner-lost／不可达／未确认／无效交接、异 run／child 证据、被替换 fence 和并发退休；交接与活跃／在途启动；迟到资源／工作区／disposal；失效页面清理与之后同宿主不确定性。退休失败方可能失败后观察到空域，不声称所有并发调用成功。

## 原生环境与来源

macOS 27.0.1（26A434）、arm64，VS Code 1.139.1，发行 pi 0.86.1。自有短根 `/tmp/pi-w035-jBboSE` 下分别放置开发／安装的 user-data、extensions、shared-data 与空 agent 配置。未激活或改变普通 VS Code profile 的历史恢复 fence。未使用凭据、prompt、模型推理、资源加载、工具或工作区写入。

从隔离父窗口以指向本扩展源码的 scratch launch 配置真实触发 F5。Extension Development Host 最初无文件夹；位置参数／folder-URI 尝试未绑定预期 scratch 文件夹。原生 Open folder 流程得到 Untitled Workspace，真实投影中的文件夹是既有 `playground`，不是预期 scratch B。资源选择 decline，未添加附件或发送任务，未编辑该文件夹文件。这是应用／配置隔离的真实 F5 证据，不声称预期 scratch 工作区或仓库默认 launch 参数原样生效。

安装版使用新打包 VSIX 和独立隔离安装。首次 `/tmp` 别名启动未就绪，canonical `/private/tmp/pi-w035-jBboSE/B` 达到就绪。首次失败不算通过，也不声称修复一般路径别名问题。包 SHA-256：`d059140ba451a041a1db85006d8b3addfe872e62b33e55e30fa219f2a849ac83`；归档字节数 149,812,635。

## 实际交接证据

| 路径 | 原 run／精确 child | 确认 owner loss 与交接 | 新替代运行 |
|---|---|---|---|
| F5 | `8b3f636c-d64a-4e2c-872b-1192958dc377`／`92bd0dc6-dc45-433a-8335-1d62d9b11392`；owner 8338、supervisor 8458、pi 8460 | 仅 SIGKILL 经核验隔离 owner，观察 owner-lost、child 仍存活且无 end 请求。开发宿主不自行重启，以原生 Developer: Reload Window 重新激活；匹配 child-exited 回执 code 143、fence 退休、旧 child／supervisor 不在；空侧栏无恢复条／操作 | `f7a08431-80f0-42bb-bc11-17a664aff2ef`／`336e5895-3b31-4d43-abbf-5f392d3d3402`；supervisor 9699、pi 9700；新的 decline 资源选择后真实 ready 投影 |
| 安装版 | `6c4677ea-1626-49f3-9d83-89ceac7952c7`／`87611c88-6661-4e4f-b359-ce5100697317`；owner 7791、supervisor 7948、pi 7954 | 仅 SIGKILL 经核验隔离 owner，观察 owner-lost、child 存活且无 end 请求。VS Code 重启宿主；匹配 child-exited 回执 code 143、fence 退休、旧 child／supervisor 不在；无恢复条／操作 | `30b604f5-71a6-4c36-81df-04db83f9d815`／`676a9df4-40bd-4712-8146-d09160626030`；supervisor 8374、pi 8375；新的资源选择后真实 ready 投影 |

安装版活所有者安全在**相同安装 user-data 恢复域**第二窗口验证。无 End／Recover。尝试启动只报告域占用；原 fence／run 与 owner／supervisor／child PID 不变，控制观察仍为 `owned`、`endRequested:false`。这不是每窗口独立恢复域证据。

本地原始证据留存于 [WI-035 取证](../../dist/delegated-macos-20260930/wi-035/setup.json)：`dev-first*.json`、`dev-after-handoff-empty.json`、`dev-replacement*.json`、`installed-canonical*.json`、`installed-after-second-window.json`、`installed-occupied-attempt.json`、`installed-after-occupied-attempt.json`、`installed-after-handoff-empty.json`、`installed-replacement*.json` 与 `cleanup.json`。这些被 Git 忽略的本地产物不等于提交了原始证据；上方身份、观察和限制是持久摘要。实际截图：[F5 空页](../../dist/delegated-macos-20260930/wi-035/dev-after-handoff.png)、[安装版活所有者第二窗口](../../dist/delegated-macos-20260930/wi-035/installed-live-owner-second-window.png)、[安装版交接后](../../dist/delegated-macos-20260930/wi-035/installed-after-handoff.png)。

## 失败、清理与限制

- 首次原生配置／路径和证据工具假设失败；修正 pi process-title 识别与动态 Webview context 寻找。失败断言不计为通过。
- 空安装夹具交接前后另显示 “Could not load provider configuration”，不是恢复条。真实 runtime 就绪后显示未配置模型。不声称修复 provider 配置或安装页完全无错误。
- Browser.close 结束开发应用但丢失 CDP 确认，过期安装窗口的关闭尝试也不是清理证据。实际核对 main 退出与精确身份；安装窗口关闭后结束其精确隔离 main。只在已捕获 owner 消失、匹配 fence 未变后用生产 owner handoff API 清理。两个替代运行域均为空，已捕获 owner／supervisor／child 均不存在；清理不冒充之前的原生 UI 交接证据。
- 不可达／无回执／损坏与同宿主协议／Stop 分支有自动化回归，未原生复现。未接受 Windows、fork／remote／multi-root 执行、模型调用、后代终止或文件回滚。
- WI-036 的独立域和 owner-loss 当场清理未实现。ADR 0005 与整份 Draft PRD 保持原状态。未 Git 提交或推送。

## 最终处置

代理依据维护者 2026-09-30 明确委托接受并关闭 WI-035，将 ADR 0006 转 Accepted。实现、完整自动化检查、分别捕获的 macOS 实际 F5／安装交接、活所有者安全与自有资源清理满足本批准切片。文档验证／健康及空白检查通过。只取代 ADR 0002 的启动仪式，其他需求、gate、会话内恢复和 WI-036 不变。未 Git 提交或推送。
