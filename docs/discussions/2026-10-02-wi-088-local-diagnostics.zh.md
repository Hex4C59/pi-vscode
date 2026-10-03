# WI-088 — PI-GAP-26 有界本地诊断导出

[English](2026-10-02-wi-088-local-diagnostics.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-02-wi-088-local-diagnostics.md](2026-10-02-wi-088-local-diagnostics.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-03
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


预写六项组合因缺少公开 diagnostics entry 正确 red，随后通过生产 owner 与隔离 fs 转绿。unique URI 保留最多八个冻结预览，过期读取明确 unavailable，不用其他报告替换。取消／dispose 在独占原子发布请求前撤权；一旦发出不可逆请求不承诺撤回。当前标准检查进行中，尚无候选／native 验收。


## 提交后候选交接——native 待完成

实现5f2135f95329cdbdd4b4c3e230f2a627f70d4e42已审查、与ACTIVE分开提交。当前开发与干净隔离提交候选 compile／lint／1261行为／docs:verify（两个既有ADR warning）／docs:health／package:vsix通过。candidate-evidence保留精确已审查／已导出JSON、取消／重叠／不覆盖／恢复组合、生成VSIX提取的固定manifest。实际archive插件／pi均0.86.1，因为既有packager以dependencyVersion生成插件manifest；源码插件仍0.0.1。按实际manifest报告，不替换为源码或声明版本；提取非安装。native只读审查／非模态通知／save取消／真实宿主视觉仍因隔离Code绑定限制未验证，未本轮代理验收或关闭。

冻结预览最多8，过期明确unavailable。发布成功后的cleanup失败明确已导出，不误说无文件；发布前失败可重试。开发lint发现unsafe-finally throw，修正且未改测试断言，失败与最终log分留。无敏感收集／上传／模型调用。本地切片保留待完成，上传另行未批准，串行转入独立PI-GAP-27。


## 重新原生Prepare — 2026-10-03

WI087关闭35fefec，仅WI088仍在原本地授权。核对LocalDiagnostics／diagnosticSnapshot／packageVersions／排他发布及注册；保留固定安装manifest、枚举／布尔projection、<=4096bytes、唯一不可变只读preview、八份上限、单操作、显式非模态review再native本地Save、新文件排他发布清理。导出不启动runtime／grant；F5源码0.0.1与实际包0.86.1分别核对。无包／API／依赖／权限变更。

普通observer仅公开VS Code文档打开事件观察隔离诊断scheme及固定安装manifest，把确切allowlist preview作为工件，不替换API／自动同意导出／启动runtime／读取用户文档。新隔离空auth／HOME／agent，禁账户扩展与memory SecretStorage，无provider／模型服务。源码／env sentinel仅自有合成，应不出现在报告，不真实secret。native十案：eligible not-started metadata、只读preview、review取消、Save取消、重叠命令无第二preview、英文冻结bytes相等导出、重复恢复、中文review取消、中文Save相等导出、英中native键盘视觉。F5与安装独立检查只读editor／非模态反馈／save；既有不覆盖／symlink／错误／dispose竞态独立composition／fs证据，不批准原生Replace／删除prompt或虚报逆境UI通过。

工具编码前契约：缺逐案review／实际进程非零／安装失败／隔离错误／无普通observer／导出篡改／report形状非法拒绝，并在synthetic VS Code边界证明preview-export identity。review50分钟／自有wrapper60分钟，正常UI退出，不强杀用户进程／绕过锁屏。精确SHA／VSIX摘要、导出bytes／hash／mode／size、native截图AX／只读prompt、取消后自有输出目录为空、实际manifest与零推理留证。验证工具Prepare完成，下一先RED后Build。


八项先行subprocess／普通observer契约缺工具RED后通过：隔离／F5／安装失败、缺真实review、确切有效preview-export、篡改导出与敏感extra拒绝。仅synthetic工具边界非native验收。无provider；driver仅观察实际诊断文档事件，<=8份及确切英中导出0600。下一干净候选／实际F5安装；日志dist/goal-eight/wi088/native-harness/。
