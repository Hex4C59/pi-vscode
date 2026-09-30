# WI-038：macOS 评估与验收

[English](2026-09-30-wi-038-macos-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-038-macos-acceptance.md](2026-09-30-wi-038-macos-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：参考
- 状态：已归档
- 创建：2026-09-30
- 处置：2026-09-30 由代理依据本会话完成 ACTIVE 剩余任务、写收尾并提交的要求接受并关闭；ADR 0007 提升为 Accepted
- 权威：本批准并发切片的历史证据；不是整份 PRD、发布、gate 或 ADR 0005 的接受
- 范围：[批准提案](2026-09-30-wi-038-approved-proposal.zh.md)、REQ-002／ARCH-05、[ADR 0007](../decisions/0007-endpoint-write-transaction.zh.md)
- 验收身份：代理依据维护者 2026-09-30 完成 ACTIVE 剩余任务、写收尾并在每项后提交的要求；不伪称维护者亲自重跑这些检查

## 批准行为与实现

宿主 `models` 模块拥有规范化 `models.json` 旁的 `.models.json.pi-vscode.lock`。添加／删除在读取前只抢锁一次，持锁完成替换。争用立即失败。只有干净提交继续供应商重载／登录／注销。已提交但清理失败报告实际保存／删除状态，不继续凭据动作、不重试修改。遗留锁不按年龄或 PID 删除。未新增 Webview 文件系统或解锁能力。

实现提交为 `d485cc4`（`feat(host): serialize models.json writes across hosts`）。

## 自动化验证

Build 记录 990 项测试（新增 63 项），包括独立进程故障／清理、原生 FIFO 拒绝、宿主调用链结果门与初始化失败投影。本次关闭在 WI-039 组包落地后的当前工作树上重跑 compile、lint 与完整套件。

| 检查 | 实际结果 | 范围 |
|---|---|---|
| `npm run compile`／`npm run lint` | 通过 | 生产 bundle 与静态检查 |
| `npm test` | 993 通过，0 失败／跳过 | 含 WI-038 事务套件与 WI-039 组包回归 |
| 实现提交 | `d485cc4` | `endpointFileTransaction.ts`、ProviderConfig 结果门、宿主调用链 |

## 原生环境与出处

macOS 27.0.0（arm64）；发行版 pi 0.86.1。隔离自有根 `/private/tmp/pi-w038-4cmFzI`，独立父／开发／安装 user-data。仅合成 endpoint；无真实登录、模型或付费调用。安装版证据使用 WI-039 归档 `pi-vscode-final.vsix`（149,921,300 字节，SHA-256 `1a70dd777a92fbcf5205d3f927e87482e347835b23130e3caa123b93ab22f6c9`），因修复前包阻断了供应商加载。本地报告：`dist/wi038-native/report-pi-w038-4cmFzI.json`。

## 实际双窗口证据

两宿主均观察到固定占用文本：`The endpoint file is locked. Try again after the other write finishes. If this persists, close writing windows and verify the leftover lock before clearing it.`

| 宿主 | 争用 | 持锁期间文件 | 释放后 |
|---|---|---|---|
| 开发宿主 F5 | 添加与删除两窗都返回占用错误 | `ids: ["fixture-endpoint"]` | 添加重试保留 `fixture-endpoint`、`development-holder`、`development-add-0`、`development-add-1`；删除重试另保留 `development-holder-2` |
| 隔离安装版 | `provider-loaded: true` 后同样的添加／删除占用错误 | `ids: ["fixture-endpoint"]` | 添加重试保留 `fixture-endpoint`、`installed-holder`、`installed-add-0`、`installed-add-1`；删除重试另保留 `installed-holder-2` |

`failures` 为空。自有进程已清理（`cleanupRemaining: []`）。隔离 agent 目录只留下合成 endpoint，`auth.json` 为 `{}`。

开发宿主添加重试在干净提交后用原生密码提示 Escape 取消登录。这不是真实凭据、模型或付费调用通过。

## 失败、清理与限制

- WI-039 之前的安装版证据不是通过。
- 不参与锁协议的外部写入仍可在最终检查与 rename 之间竞争。
- ARCH-06 输出预算、ADR 0005 真实登录／端点调用、自动接管遗留锁仍范围外。
- 未关闭 gate。未推送。

## 最终处置

代理依据本会话完成 ACTIVE 剩余任务、写收尾并提交的要求，接受并关闭 WI-038，并将 ADR 0007 提升为 Accepted。实现、993 项自动化测试，以及分开记录的 macOS 开发宿主与隔离安装版双窗口争用／串行提交证据，满足该批准切片。只接受跨宿主写入互斥。
