# WI-088 — PI-GAP-26 有界本地诊断导出

[English](2026-10-02-wi-088-local-diagnostics.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-02-wi-088-local-diagnostics.md](2026-10-02-wi-088-local-diagnostics.md)
- 原文版本：4eb8d38 + current Prepare
- 最近同步：2026-10-02
- Type: Discussion
- Status: Active
- Created: 2026-10-02
- Authority: 有界 Prepare／Build 与证据，非验收
- Related: [ACTIVE](../../ACTIVE.md)、[八项 Goal](2026-10-03-eight-gap-goal.zh.md)、[PRD](../product-requirements.zh.md)

## 批准与范围

本轮用户执行请求仅批准 PI-GAP-26 可审查、可取消、有界本地导出。不上传、不源码／完整会话／凭据／新增敏感内容收集；委托常规可逆细节与本地提交，native 验收独立。上传继续未批准待完成。本记录用当前 UTC 日期，旧 Goal 文件保留本地日期。

## Prepare——现状与公开 API

Provider 已持有 lifecycle flags 及 native 只读资源报告，尚无 exporter。已检查 activation、provider、resourceReport、host harness。实际插件／runtime manifest 固定在安装根下（本源码4870／4041 bytes），不从 dependency 声明推断实际版本。VS Code 公开 TextDocumentContentProvider／showTextDocument 提供冻结只读快照；非模态 showInformationMessage action 允许先审查后显式导出，showSaveDialog 可取消目的地。Node fs 固定 manifest 与独占本地原子发布足够，不 RPC／账户／模型／工作区读取／Webview protocol 改动。

## 有界设计与归属

宿主 diagnostics 仅投影 allowlist 实际 package／host 版本（缺失／非法 null）、platform／arch 与既有固定状态 enum／boolean：工作区资格、runtime、task／model／session busy、controlled profile、错误存在 flags。排除名称／标识／路径／正文／endpoint／错误与日志正文／env／plugin inventory／provider与model／对话细节。JSON schema <=4096 bytes。预览精确冻结 bytes，Export reviewed snapshot 或 Cancel 后本地 file-only 目的地；拒绝既有文件／symlink；选定目录私有临时文件后独占原子 link，清理自有临时数据。取消在最终发布前生效，不承诺撤回已发布文件。Dispose 撤权、单 owner 拒绝重叠；失败固定双语提示、重新运行恢复，不泄漏 exception。无后台收集／持久化，只写所选本地工件；remote host 排除。

## 编码前失败方式

- 缺失／非法版本误当实际；manifest／读取路径无界。
- 序列化状态正文／错误／会话／model／源码／路径／凭据或对象额外字段。
- 未真正审查先导出、同意后更换 bytes、可编辑预览与导出错配。
- review／save／dispose 取消后仍写，重叠覆盖快照，非本地目的地。
- 覆盖既有／symlink、部分发布、临时遗留、敏感 exception 提示。
- 触发 runtime start／send／stop／授权／新收集、缺少双语取消与失败恢复。

## 需求／架构与可观察验收

REQ-009 有界支持诊断，无新增 trust／data／upload／adapter 决策。命令面板 native flow，不改 settings／Webview 视觉。预写组合经生产 owner 与 native API seams、真实隔离 fs：敏感 sentinel 不出现、preview/export 精确相同、两取消／dispose／重叠、版本 unknown、file-only／既有目的地／写失败恢复／临时清理、无 runtime 调用，保留 JSON／log。compile／lint／行为／文档、审查提交、干净提交候选／打包；真实 native review／save取消／导出另证。现有隔离 Code 绑定阻碍不能当验收；若仍阻塞，串行继续 PI-GAP-27。

预计写 diagnostics、provider／activation／command manifests、编码前 host composition、双语 PRD／README／WI。禁止编码后补单测。干净4eb8d38基线通过，diagnostics 测试尚未编写／运行。

此有界方案 Prepare 完成；下一步预写组合 red，再按本轮批准 Build。此点无实现／验收。
