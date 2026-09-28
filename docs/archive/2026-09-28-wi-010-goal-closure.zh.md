# WI-010 — 剩余边界与委托 Goal 收尾

[English](2026-09-28-wi-010-goal-closure.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-28-wi-010-goal-closure.md](2026-09-28-wi-010-goal-closure.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-28
- Type: Reference
- Status: Archived
- Created: 2026-09-28
- Authority: 已完成批准范围、委托评估及证据；[ACTIVE](../../ACTIVE.md) 是唯一当前入口

## 批准、范围与验收

维护者9月27日UTC的明确委托覆盖原ACTIVE队列的实现、必要修复、产品／架构选择、实际视觉／交互评估及WI／ADR／gate收尾。**代理按本次委托完成评估，不冒称维护者亲自检查。** 不授权Git暂存／提交／推送／合并／历史重写、发布、付费模型、凭证、邻仓修改或改变强制安全／已接受需求。

最终WI-010提案覆盖剩余完整Webview信任边界，workspace／资源／工具consent分离，以及会话接纳／settled／retry／compaction／Stop／替换／失败／清理。要求核对源码／测试／批准范围，为每个gate准确问题提供实际分层证据，按正常治理接受ADR，同步双语文档，复核原Goal完整性，清理资源／进程并执行适用检查。明确排除重复实现已接受WI、WI-018、重开WI-020、整份Draft PRD接受、全生态／provider／平台认证、sandbox／回滚／全部后代保证及发布。这些是原批准边界，不是新延期的未完成事项。

提案原663测试检查点经必要有界修复达到671。历史日期、失败和旧验收条件保留归档，不改称本轮通过。[ADR0004](../decisions/0004-trust-and-lifecycle.zh.md)记录准确决定、替代方案、19维审查、证据版本和限制，并独立接受gate-webview-trust、gate-project-trust、gate-session-streaming；此前WI关闭不能自动推出该结论。

## 原未完成范围逐项处置

| 原事项 | 已完成结果与证据权威 |
|---|---|
| WI-021 | [执行／原生F5收尾](2026-09-27-wi-021-execution-closure.zh.md)：retry／compaction／终态／Stop实际矩阵、focus回退修复；官方1.105.1真实F5与1.139.1安装分别取证 |
| WI-019 Q16及正式接入 | [委托视觉／交互评估与正式chat](2026-09-27-wi-019-formal-chat.zh.md)，打开查看实际页面／宿主截图、必要布局修复、新原生／安装验证 |
| WI-015 | [React／TypeScript／Vite验收](2026-09-27-wi-015-react-acceptance.zh.md)、ADR0003 Accepted；renderer重建／断开／reload证据 |
| WI-013／REQ-006、009 | [受信加载／交互／恢复](2026-09-28-wi-013-acceptance.zh.md)、ADR0002 Accepted；合法固定版本代表目标、标准表单、custom tools、有界队列／溢出、exact-owned恢复与多窗口 |
| WI-008／009／REQ-002 | [模型／就绪](2026-09-28-wi-008-model-acceptance.zh.md)及[thinking](2026-09-28-wi-009-thinking-acceptance.zh.md)：无模型／错误安全、实际applied／pending readback、能力／Stop／焦点修复 |
| WI-014／REQ-003 | [全部批准附件切片](2026-09-28-wi-014-attachment-acceptance.zh.md)：文件／选区、逐项显式确认、1MiB实际混合投递、预览、128项容量／历史／丢失恢复 |
| WI-016／REQ-007 | [dirty保护与诚实审阅](2026-09-28-wi-016-review-acceptance.zh.md)：原生readonly捕获diff、observed与tool归因、来源修改／删除、分页／生命周期及短窗修复 |
| WI-017／REQ-008 | [公开API保存会话](2026-09-28-wi-017-session-acceptance.zh.md)：真实CLI-origin目录、顺序交接、渐进原文历史、缺失会话／错误恢复、controlled默认重置修复 |
| WI-010剩余／REQ-001、004、005、009边界 | ADR0004及新WI-010 trust／CSP／workspace／streaming／bounds矩阵，三项剩余gate接受；不降级为旧受控工具切片 |

旧CF-01～08研究草案是历史，不是第二任务账本。批准的行为类别依次映射WI008／009；WI010资源／信任；WI013加载／工具；WI013标准交互；WI017会话；WI014附件；WI016 dirty／审阅；WI013／017／021／010组合生命周期。不把每个历史synthetic marker配方重新标为已执行，不以归档旧候选夹具代替批准行为交付。

## 最后修复与分层证据

本地详证位于dist/delegated-completion-20260928/。wi010-installed/EVIDENCE.md及ADR0004区分665／669／671版本、功能JS字节身份及最终仅CSS包差异。实际原生F5使用未修改官方Code1.105.1，安装版使用官方Code1.139.1。pi0.86.1在隔离无秘密配置与localhost合成推理下运行。不声称现代debugger attach缺陷已upstream修好，CLI development host不替代原生F5。

必要最后修复：资格丢失后仍可清理exact-owned End／Recover但不授予启动；final／activity脱敏扩张后再限长；model fallback和仅展示原生metadata有界；长model摘要／菜单不再破坏窄短composer布局。保留red测试证据，实际宿主增加三主题／两语言、键盘／焦点／菜单／视口断言。静态截图不证明持久化／权限／时序／进程退出，这些由公开readback、断言、源码审查和实际close观察证明。

当前包：dist/delegated-completion-20260928/wi013-package/pi-vscode-wi010-producer-menu.vsix。共14085项，包括重新审查的14070固定依赖项；声明产物与安装manifest语义分别核对。保留解压包公开启动／审批handshake与renderer验证。不发布，不安装到用户原有profile。


**REQ-009五类组合验收补证据：** 最终复核没有把资源发现当作调用生效。wi010-installed/resource-report.json及resource-decline-report.json是在当前实际安装包下新跑的allow／decline矩阵：project prompt精确展开正文和参数，显式skill调用传入原文及参数，AGENTS进入实际system message，独立global template有独立标记。decline排除project模板展开（未知slash保留literal输入），保留上游规定的AGENTS及global模板；skill发现排除另由公开六场景矩阵证明。断言检查实际localhost provider输入，不靠模型回声；两张实际截图已打开查看。对应run-resources*.log、resource-*-provider-input.jsonl与两份End→terminal→Recover回执保留。此证据与WI008／009模型、WI013命令／工具／hooks／标准交互、WI017会话以及WI014／016／021核心闭环和故障恢复共同满足原批准Windows自用安装包五类目标，代理按委托接受组合范围；不声称全部生态、Cursor、theme／package或其他OS。

## 文档处置

现行v3-only消息契约为Living；过期v1／v2／单文件提案保存在[契约快照](2026-09-28-webview-contract-history.zh.md)。PRD仍Draft，批准切片追踪已链接实际验收而非旧等待条件。架构／ADR／gates限定接受范围，不声称普遍交付。已解决[兼容性](2026-09-22-pi-compatibility.zh.md)、[目标调查](2026-09-27-wi-013-target-research.zh.md)、[原生F5诊断](2026-09-27-wi-021-native-f5.zh.md)连同翻译移入归档并修复链接；历史pending明确保留当时时点。ACTIVE只保留当前状态与完成索引，不再追加长证据日志。

## 资源处置与复现

retained-resources.json是精确本地路径／所有权／清理清单；goal-final-process-audit.json覆盖原Goal／本次委托根目录及六个明确记录的外部trust夹具。产品清理证据仍是End→匹配终止回执→Recover，与OS进程审计分离。最终扩大审计发现五个早期原Goal F5失败遗留的paused inspector，匹配profile／创建身份、确认原父进程不存在且无子进程后才终止。goal-inspector-cleanup-before／after.json记录操作，不影响用户进程或pi fence。

隔离官方宿主解压目录D:/Users/hex4c59/Temp/pi-vscode-delegated-f5-1.105.1-20260928已**删除**：全部2506文件逐字节hash匹配保留的官方ZIP且无进程依赖。证明见official-host-cleanup.json；ZIP／hash及唯一宿主诊断保留。旧归档称仍需该解压目录是其历史时点。

保留组：dist/delegated-completion-20260928/（含包、profile、脚本、截图、失败与起点基线）；dist/authorized-completion-20260927/；旧dist/goal-evidence-20260923/；定向dist/wi013-checkpoint-evidence/、dist/wi013-answer-ui-tests/、dist/wi013-runtime-review-tests/。六个外部初次失败夹具的精确路径仍在dist/authorized-completion-20260927/project-trust/first-run-retained-fixtures.json及最终清单；它们保存唯一原始探针状态，没有运行中服务。保留为证据，不是等待常规维护者接受。只有唯一证据不再需要或已可靠保存且重查精确进程依赖后才删除，绝不按名称删除。未创建worktree或修改邻接checkout。

## 检查与最终结果

最终本地日志位于dist/delegated-completion-20260928/，前缀final-goal-：compile、lint、test（671／671，零跳过）、docs-verify、docs-health和diff-check。文档检查采用既有显式preload避免遍历禁区.local-env，不削弱checker规则。新增翻译metadata／移动链接等中间失败检查先保留，再修复重跑。后续文档编辑未改变最终代码产物。

列明检查通过后，代理按本次委托接受并关闭WI-010剩余范围。原ACTIVE未完成事项已完成必要实现、决定、实际验证与记录，批准范围内无剩余外部硬阻塞。整份PRD Draft、不支持的生态／平台及发布认证不是新增延期任务。HEAD仍59dbb09f6514d50c58b26ea3625c99b780b5bac4，index为空，既有及新增修改全部未提交／未推送，起点ACTIVE压缩已保留。最终Git快照与资源／检查回执随本记录保存。
