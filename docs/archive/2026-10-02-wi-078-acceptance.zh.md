# WI-078：作曲区命令发现验收

[English](2026-10-02-wi-078-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-02-wi-078-acceptance.md](2026-10-02-wi-078-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-02

- 类型：参考
- 状态：Archived
- 创建：2026-10-02
- 权威：限定历史证据，不是整个 PI-GAP-02 交付

## 结论

2026-10-02 Agent 依据持续 goal 关闭，不是维护者亲测。[批准方案](2026-10-02-wi-078-approved-proposal.zh.md)。实现含 a927a91、b2e84b7、bdc9f5b，实现提交不含 ACTIVE。没有关闭 gate／改变 ADR；实际加载报告继续停车。空格歧义先确认再实现：裸补全恰好一个空格，既有后缀逐字保留。

## 分层证据与重放

pi **0.86.1**、VS Code **1.140.0**、Darwin **27.0.0 arm64**；原生隔离 HOME／配置／工作区与 loopback 合成 provider。VSIX SHA-256 `fa61b6b435d2d2f3da3e364cfc66e2c2208fd25c9299677790e6800631cc08a3`。以下工件在 Git 忽略的 dist；源回归测试提交。

| 层级 | 实际观察 | 工件／入口 |
|---|---|---|
| 宿主／client composition 与生产 mounted UI | `/fi`→`/fix-tests `；tabs/newlines 原样；重复 no-op；不 prompt／queue；revision 守卫；键盘、合成 IME、互斥、空／失败／过期 | `src/extension/tests/command-discovery.spec.ts`、`src/webview/tests/command-discovery-{client,mounted}.spec.ts`；`wi078-command-catalogue/{completion-space,client-host-roundtrip,mounted-discovery,mounted-empty-exclusive}.json` |
| 真实已安装 Chrome 预览 | 18 组：280／320／400、暗／亮／高对比、中英；三来源、不溢出；键盘裸补全、后缀、零匹配 Enter 不发、Escape 保留 | `wi078-command-catalogue/{replay-browser.cjs,browser-matrix.json,browser-space-log.txt}` 与截图，loopback 5188 |
| 真实 pi＋生产 adapter | Controlled 拒绝／同意、Trusted 显式夹具命令、替换回拒绝；无路径投影；显式无害命令 prompt 被 RPC 接受且保留参数，发现不执行；4 启动／4 已观察 close，夹具删除 | `wi078-command-catalogue/{runtime-replay.mjs,runtime-report.json,runtime-space-log.txt}`；由 `wi078-runtime-entry.ts` 重建 `wi078-command-probe.cjs` |
| 安装 VSIX | 三行与来源／位置；`/dis`→`/discover `，`/dis keep arguments`→`/discover keep arguments`；provider 数量不变；零匹配 Enter 不发，Escape 保留 `/`；cleanup 空 | `wi078-native/{installed-space-report.json,installed-bare-completed.png,installed-commands.png,installed-completed.png,installed-no-match.png}` |
| macOS F5 | 真正 `[Extension Development Host] A` 与 Webview parent 对应；同样裸／后缀／零匹配／Escape；F5 已发，cleanup 空 | `wi078-native/{f5-space-report.json,f5-bare-completed.png,f5-commands.png,f5-completed.png,f5-no-match.png}` |

重放：compile、lint、npm test；启动 loopback 5188 预览后运行 browser replay，使用本机 Chrome／Playwright，不下载。esbuild 重建 runtime probe，再从根目录运行 runtime replay。package:vsix 后 `ACCEPT_PHASE=queue node dist/wi078-native/run.mjs` 验安装，`ACCEPT_PHASE=queue-f5 node dist/wi078-native/run.mjs` 验 F5。runner staging／验证私用本地 VSIX并复制分层报告，不公开发布；runner／机器路径是本地工件，不是可移植 CI 入口。

## 失败尝试与纠正

保留的 wi078-space-red bundles 可重现缺空格（actual `/fix-tests`、expected `/fix-tests `），现行收集测试通过。先前浏览器重放在后缀选择超时；本次完成 18 组。

本次两轮 F5 等菜单超时。仪器确认正确开发宿主 Webview、草稿 `/`、菜单关闭。harness 聚焦开发宿主后给**父窗口** user-data 发送 CLI 聚焦，抢回焦点。仅去掉 F5 此 fallback 后闭环恢复，最终 ok true；失败保存在 f5-space-failed-report.json、f5-space-second-failed-report.json，cleanup 均空。未增加产品 workaround 或伪造 focus／menu 事件。

## 检查与语义核对

compile（三个 TypeScript 配置）、lint、**1157 tests**通过，无 failed／cancelled／skipped；打包与解包验证通过，浏览器 18／18、runtime 4 close、两路原生通过，diff --check 通过。关闭 docs:verify／health 零错误；保留 Draft ADR 0010 两条旧提示，不以接受 ADR 消除。

核对受影响 PRD、Living Webview 契约、控件目录证据、归档索引；空格和验收状态一致，旧 WI／runtime 保留历史限制。REQ-008／中文 REQ-009 漂移不是新实现范围。

## 限制与交接

不是维护者亲测、真实／付费模型、OS IME、任意第三方兼容或额外宿主／平台验收；合成 IME 不能升级成 OS IME。无 AGENTS.md 加载报告、下载、存储／信任扩张或 sibling pi 修改。PI-GAP-01 附件／slash 与 PI-GAP-02 加载报告余量仍停车；下一可执行候选为只读用量（PI-GAP-03），新切片单独批准 PRD 和取证，不继承本次验收。
