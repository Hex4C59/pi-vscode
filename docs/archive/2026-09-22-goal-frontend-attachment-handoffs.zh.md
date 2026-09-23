# Goal 前端与附件检查点

[English](2026-09-22-goal-frontend-attachment-handoffs.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-22-goal-frontend-attachment-handoffs.md](2026-09-22-goal-frontend-attachment-handoffs.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-22
- 类型：参考
- 状态：Superseded
- 创建：2026-09-22
- 替代：[当前工作](../../ACTIVE.md)
- 权威：仅历史证据，不是实施授权或维护者接受

## 保留原因

Goal 已完成前端迁移与 WI-014 附件切片的代码和可执行验证，唯一 Build 接续 WI-016。此记录替代原 Build／进度交接，**不**关闭维护者接受、Draft ADR 或 Open gate。当前需求、范围、未决项仍在 ACTIVE 及其权威链接。以下日期为 09-22 UTC，测试机 +08:00 为 09-23。

## 共同证据边界

Goal 使用原生 Windows Node 24.12.0、npm 11.6.2、原生 esbuild 与声明的 pi 0.86.1。HEAD 保持 `4bbf9ec923f2499a88f52a29b8439fb9d9d5396c`，index 为空，既有用户修改保留。未读取用户凭证／.local-env，未用付费 provider，未修改相邻仓库、提交或发布。真实 pi 仅连接隔离 loopback 合成 provider，不是真实模型质量或维护者接受证据。

忽略的证据根为 `dist/goal-evidence-20260923/`，包含固定文件审查基线、红绿日志、包哈希、浏览器／原生截图、隔离 profile／配置及自有夹具。维护者接受且证据保留期结束、唯一证据已保存后才清理，不能凭目录名删除。较早保留的 `dist/wi015-evidence/`、`dist/component-check/`、`D:/DevCaches/pi-vscode-ui-20260922` 继续沿用其原审查用途及清理条件。

## 已验证检查点

| 检查点 | 当时实际执行的证据 | 保留范围／限制 |
|---|---|---|
| WI-015 前端 | 149/149；compile、lint、文档、diff；90 组浏览器、实际 F5、普通已安装 VSIX；Standards／Spec 无未解决项 | React／Vite 整合完成，不是全产品交付；ADR 0003／维护者体验接受待定 |
| T014-02 最新整文件 | 157/157；浏览器、实际 F5／安装版合成推理；两次编辑／确认、键盘、精确 Unicode、历史不变／不保存 | 显式刷新确认、不自动发送；来源变化、Stop、迟到回答保护 |
| T014-03 固定选区 | 173/173；18 组浏览器及短视口；修复后最终代码重复实际 F5／安装版 | 保留原字节／范围及来源变化后的旧快照选择；捕获前文档有效性与独立 composer 滚动修复 |
| T014-04 混合向量 | 189/189；9 组 20 项浏览器；F5／安装版多项确认、原生 20／21 和 1 MiB；真实 pi 最坏转义帧 | 一次有序原子集合，无成功前缀接纳／发送；128 快照／8 MiB 逻辑保留、正文只计一次；1 MiB NUL 生成 7,340,524-byte 帧且仅一次 prompt |
| T014-05 历史 | 197/197；compile／typecheck／lint；9 组浏览器、480px 短视口与流式；独立最终 F5／安装版长历史／容量／恢复 | 本地每页 16 快照、提交续页、可选完整预览；不持久化／自动重置；超过 32 条聊天后旧历史可达；128 条溢出完整保留草稿 |

每个检查点通过仅属于当时版本，不是后续版本的当前通过。浏览器、实际 F5、安装包、合成 runtime 分列。根目录最初包 SHA 为 `e964ae4729ff546732373d4e2dc95d4fbd815652b25a26eb6e1d99b8d32014a2`，后续切片包如下。

| 切片包 | SHA-256 | 字节 |
|---|---|---|
| `wi014-t02/pi-vscode-t01402.vsix` | `43c54fce4fef1f8845814dd6803eaf39e27aed5642544f39d5e77b454caecb24` | 146580792 |
| `wi014-t03/pi-vscode-t01403.vsix` | `1e93469c722ed93a6fe2bd92205edcc00e08d67f44035406feac586934a3ef59` | 146582328 |
| `wi014-t04/pi-vscode-t01404.vsix` | `343720223b6818ff93e997027183f33375c6183666fea56ec838962356a1cb42` | 146583104 |
| `wi014-t05/pi-vscode-t01405.vsix` | `8294095c52efa3e961732c84cc87b24b0eb7d90b170ebf02a0e5def96fbb42a0` | 146583653 |

各附件检查点包为 14,082 entries。package-content 比对本地／归档／安装的 host、bundled gate、Webview JS/CSS 及安装 manifest（排除安装器元数据）。VSCE 会改写 README 相对链接，不声称 README 字节相同。包排除 preview server、证据与秘密配置，生产资源不依赖 Vite。

## 修复与证据导航

- WI-015 修复严格 host／approval 投影、runtime 拒绝、settlement 早于 ACK、断连后迟到 ACK、Stop 重同步、审批到期刷新、启动／错误 UI、高对比用户消息及夹具／进程时序。根下 `tests-final.log`、`browser-check.json`、`browser-hmr.json`、`f5-evidence.json` 与安装版记录拥有实际观察。
- T014-02 的 `wi014-t02/` 保留整文件变化证据及 Stop 准备阶段 revision／重放修复；最终 README-only 重打包与原生可执行验证有明确区分。
- T014-03 的 `wi014-t03/` 保留 `capture-boundary-red.log`、173 测试最终日志、`browser-preview.json`、`browser-compact.json`、`f5-final-evidence.json`、`installed-final-evidence.json` 与 `package-content.json`。早期 provisional 证据仍有标签；文档有效性／composer 布局修复后再次运行最终实机。选区示例 `中🐱 chosen\nsecond selected` 为 30 UTF-8 字节、原零基范围 1:0→2:15。合成 preview 的选区与严格意图有测试，不是模型证据。
- T014-04 的 `wi014-t04/` 保留捕获／发送删除竞态红测试、混合向量／预算测试及 `review-unrelated-final-green.log`。Standards P2 修复无关文档事件重复广播，同时让全部匹配条目共同失效。`runtime-vector-evidence.json`、`browser-mixed.json`、分别的 `*-mixed-evidence.json`／`*-count-evidence.json`／`*-aggregate-evidence.json` 及包哈希构成完整证据链。原生 picker 仅使用 allowlist 自有夹具与文件名控件精确回读，不伪造 host 意图。
- T014-05 的 `wi014-t05/` 保留分页／预览／恢复文案红测试、`tests-preview-green.log`（197）、`host-long-history-green.log`（37）、`browser-history.json`、短视口／流式记录及 `f5-evidence.json`／`installed-evidence.json`。浏览器发现历史卡片 flex 压缩到 14px client height 而内容需 193px；局部不收缩规则修复。长合成预览使用 surrogate-safe 16,384 单元分块，合成流式也遵守 32 条消息上限；这些 fixture 修复不冒充生产 runtime 证明。两种实机均验证 33 条快照在旧聊天移出 32 条窗口后可达、键盘导航、自有源删除／恢复后的精确预览、流式页码／焦点／滚动、Stop 保留草稿、128 条溢出以及主动 Reload Window 的明确丢失／恢复。
- 原生 **Reload Webviews** 重载 renderer，host viewId 保持不变，不是新的 provider 实例或 extension-host 重启。新 provider-view 身份和旧 view 拒绝由 host 回归单独覆盖。主动 **Reload Window** 则实测重新选择资源、聊天／历史／草稿清空和新 viewId，不混用证据。

## 环境失败、审查与清理

F5 偶发在 extension-host 日志产生前 code134 崩溃。T03 保留 3 次失败，缩窄隔离 outFiles 后曾成功；T04 保留 3 次，禁用 sourceMaps 后曾成功；T05 即便禁用仍失败 2 次，第 3 次启用隔离 debug trace 后成功。根因**未知**，两种规避都不是已证实根因修复，也不证明仓库原 launch 配置通过。各片保留失败日志／隔离配置副本，临时 launch 原配置均恢复。

T02 记录 34 个原生后代加 provider 清理；T03 记录重复轮次共 112 个进程；T04／T05 最终各记录 45 个自有进程。cleanup 确认无存活／端口监听，夹具回退或恢复，临时配置恢复。T05 尝试的 Luna/max UI 委派未产出修改／检查，已中断；主代理实现并整合。Terra/high Standards／Spec 最终无未解决项，其自行运行的聚焦检查与主代理全量／实机证据分列。

此归档不关闭维护者接受、Draft ADR／Open gate 或其余 REQ-001～009。Goal 仍未达成，下一授权切片见 ACTIVE。
