# WI-022：默认CLI规避（已关闭）

[English](2026-09-28-wi-022-background-consoles.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-28-wi-022-background-consoles.md](2026-09-28-wi-022-background-consoles.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-28
- Type: Discussion
- Status: Historical
- Created: 2026-09-28
- Authority: 已采用 CLI 规避的历史证据；WI 收尾见 [2026-09-28-wi-022-closure.zh.md](../archive/2026-09-28-wi-022-closure.zh.md)

## 当前决定

用户要求默认no-daemon启动在PowerShell -NoProfile下也生效，并询问WI-022归档。保留NoProfile，不加载或修改私人PowerShell profile。在已有且优先于npm的D:/Users/hex4c59/bin放置codex.ps1、codex.cmd，由codex-local-launcher/launch.cjs转发至未修改的官方npm CLI，仅添加一次--no-daemon。本轮未改PATH、注册表、Codex源码／二进制、凭证或daemon状态。npm CLI现实际报告0.158.0，不与此前运行的0.157.1 daemon混为一谈。

只覆盖经这些入口解析的启动。现有会话、桌面／IDE客户端、显式codex.exe路径和显式remote／共享服务不自动转换。--remote与agents不兼容此默认方式；有意使用共享服务须显式调用原npm入口。不承诺全客户端补丁。

## 证据与边界

证据在dist/wi022-hidden-process-20260928/default-cli-launcher/。5项参数保留断言通过（含resume、重复选项与参数终止符）；PowerShell5／7的NoProfile及CMD版本检查通过；resume帮助通过；非法选项保持exit2。实际隔离VS Code NoProfile终端分别解析到本地CMD及最终PowerShell入口，准确readback codex-cli0.158.0并exit0；两份自有Code均exit0。未调用模型或付费服务。这证明入口解析／参数转发，不是新的交互模型turn或现有客户端全部闪窗验收。

初始隐藏测试进程继承PATHEXT=.CPL，系统值则含正常可执行扩展名，导致空的原生命令输出；未将这些检查判为通过。已使用含正常扩展名的合成环境及真实终端重测。失败的实验PowerShell包装和中间路径转义错误已撤下；最终部署是简单转发脚本。未修改系统PATHEXT。

## 保留与回退

长期自有文件：D:/Users/hex4c59/bin/codex.ps1、codex.cmd、codex-local-launcher/launch.cjs与OWNERSHIP.json。需要规避时保留；回退先确认无启动进程依赖，再仅移除这些自有文件，不能删整个用户bin，原npm入口即可重新被解析。证据含失败观测与隔离profile，保留至不再需要或可靠归档，清理前复查自有进程；较早大证据目录与源码引用沿用已有清理条件。

## 归档结论

[长调查与已放弃源码修复路线](../archive/2026-09-28-wi-022-background-consoles.zh.md)仍作为诊断历史保留。2026-09-28 维护者确认 WI-022 已解决并要求更新 ACTIVE；工作项按[维护者确认收尾](../archive/2026-09-28-wi-022-closure.zh.md)关闭。ACTIVE 不再将 WI-022 作为当前项。本文保留规避证据与边界，不宣称上游 Codex 根治 ADR 或产品 gate 变更。
