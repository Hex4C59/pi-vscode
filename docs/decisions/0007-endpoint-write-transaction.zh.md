# ADR 0007：跨宿主 endpoint 文件事务

[English](0007-endpoint-write-transaction.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[0007-endpoint-write-transaction.md](0007-endpoint-write-transaction.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：ADR
- 状态：Draft
- 创建：2026-09-30
- 决定批准：维护者本次会话确认 WI-038 进入 Build，批准 ACTIVE 完整提案，包括外部写入限制与遗留锁保守恢复。
- 验证：实施、compile／lint 与 990 项测试已通过（新增 63 项），包括独立进程故障／清理、原生 FIFO 拒绝、宿主调用链结果门与初始化失败投影。全新 VSIX（149,815,375 字节、15,535 条目，pi 0.86.1）解包／RPC／gate 验证通过。macOS 开发宿主 F5 与（WI-039 修复既有组包缺陷、即 VSIX 缺 `@earendil-works/pi-ai`，见 ACTIVE 停车场 PACKAGE-01 之后）隔离安装版都取得两窗口真实占用错误与释放后串行提交并保留全部已提交条目的证据。最终 WI 接受未委托，本 ADR 保持 Draft。
- Gate：无新增；既有 `gate-webview-trust` 保持 ADR 0004 限定范围内的 Accepted。
- 工作项：WI-038／ARCH-05／REQ-002
- 相关：[ADR 0005](0005-custom-endpoint-file.zh.md)、[契约](../reference/webview-messages.zh.md#endpoint-写入事务wi-038已批准-build-契约)、[ACTIVE](../../ACTIVE.md)

## 背景

既有 endpoint writer 读取并合并 `models.json`，随后用临时文件 rename 替换。原子替换避免半份 JSON，却不能串行化两个宿主对相同旧版本的读取。`ProviderConfig.saving` 只保护单实例。ADR 0005 的文档化 endpoint 格式与凭据权威保持；其待补的真实登录／端点证据与本次并发修复分开。

## 决定

宿主 `models` 模块拥有规范化 `models.json` 旁的排他锁目录 `.models.json.pi-vscode.lock`。添加／删除在读取前只抢锁一次，持锁完成替换。争用立即失败，不排队等待、不自动重试修改。目录别名归入同一锁域；链接目标文件等不明确身份拒绝写入。锁元数据只含随机身份与 PID。

事务拥有临时输出，只释放自身匹配的锁。缺失文件可创建，既有普通文件权限保留。rename 前重新比较字节／身份以检测外部修改；不参与锁的外部写入仍可在最终检查与 rename 之间竞争，不承诺任意外部写入互斥。

结果区分未提交、干净提交、已提交但清理失败。只有干净提交继续供应商重载／登录／注销。已提交但清理失败报告实际保存／删除状态，要求显式后续处理，不回滚、不重放修改。未提交时的清理失败也可见。崩溃遗留锁继续阻挡写入，年龄或 PID 不构成删除授权；恢复要求关闭相关写入宿主并由维护者核对后手工清理。不新增 Webview 文件系统／解锁能力。

## 理由与替代方案

进程内 mutex 无法保护独立 VS Code 宿主。只重新读取不能使文件系统的读改写／rename 原子化。相邻排他锁使用标准 Node 文件系统操作，不增加依赖，事务责任仍在既有宿主 writer。争用拒绝无需引入等待队列。拒绝自动接管遗留锁，因为身份或活动写入不确定时可能允许重叠 writer；这一选择用自动崩溃恢复便利性换取保守保留。

## 影响与接受条件

崩溃 writer 或释放失败可能需要手工恢复；外部手工编辑应在扩展 writer 关闭时进行。替换不承诺目录 fsync 崩溃耐久性，也不防止恶意操纵锁。输出大小预算（ARCH-06）、供应商凭据存储、pi 版本、会话文件、运行时生命周期与 ADR 0005 接受均不在 WI-038 范围。

接受要求确定性的同进程及独立进程 add/add、add/remove、remove/remove；明确争用／冲突与清理结果；故障后续动作抑制；路径身份与遗留锁测试；compile／lint／完整测试／文档检查；以及分开记录的 macOS 开发／隔离安装宿主验证。批准确立决定，不代表尚未执行的检查结果；验证和明确接受记录齐备前，本 ADR 保持 Draft。
