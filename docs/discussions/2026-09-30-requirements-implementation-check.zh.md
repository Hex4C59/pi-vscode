# 需求实现核对（2026-09-30）

[English](2026-09-30-requirements-implementation-check.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-requirements-implementation-check.md](2026-09-30-requirements-implementation-check.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30
- 类型：讨论
- 状态：Draft
- 创建：2026-09-30
- 权威：仅源码及证据观察；不是新需求、Build 授权或 Accepted PRD／ADR／gate 决定变更
- 相关：[PRD](../product-requirements.zh.md)、[ACTIVE](../../ACTIVE.md)

## Question and method

当前入口记录无未完成任务后，维护者追问需求文档中要的功能是否全部实现。本次读取需求、正式界面组合、相关实现接缝及既有验收记录，未改代码，未运行行为测试或原生宿主。Accepted 标签或空 WI 队列不能证明条文实际实现。

## Confirmed implementation gap

**REQ-001：拒绝项目资源后的可见状态缺失。** PRD 要求受信工作区在不加载 pi 项目级资源时继续会话，并显示明确提示。[ProjectResourceConsent](../../src/webview/chat/project-resource-consent.tsx) 将已记录选择的合格工作区归为 settled，既不显示选择的策略，也不显示拒绝资源提示。正式 [Candidate](../../src/webview/chat/candidate.tsx) 挂载该组件，而不是仍保留选择状态文案的旧 [WorkspaceSetup](../../src/webview/components/workspace-setup.tsx)。[MessageComposer](../../src/webview/chat/message-composer.tsx) 的“权限”显示执行配置和授权，这与项目资源同意是两个维度。已检查的正式路径因此在拒绝后遗漏所需状态提示。

项目身份展示也较弱：[ProjectResourcesPrompt](../../src/webview/chat/project-resources-prompt.tsx) 只在选择前、默认折叠的详情里提供文件夹路径；[SessionNavigation](../../src/webview/chat/session-navigation.tsx) 显示对话名。这是否满足“执行任务前显示当前文件夹”仍需针对条文核对。它是可见性疑点，不是宿主实际在错误目录执行的证据。

**REQ-002：活跃模型身份歧义。** [运行时模型解析](../../src/adapter/runtime/pi-rpc-model-parse.ts) 优先取显示名称，丢掉 provider／id 身份。[ModelPickerView](../../src/webview/components/model-picker.tsx) 再从该字符串恢复身份；若两个已配置供应商使用同一显示名，没有唯一匹配，所有菜单项都不会标为已应用，当前 chip 也没有供应商身份可显示。该场景不满足当前 provider／模型可见性及 PRD 同名选择表述；它不是运行时选错模型的证据。[WI-042 记录](../archive/2026-09-30-wi-042-macos-acceptance.zh.md)与[已有挂载用例](../../src/webview/tests/model-selection.spec.ts)验证的是当前模型字符串已为规范身份时的同名情形，同时明确宿主仍投影显示标签。本次未运行新的复现测试。

## Acceptance evidence gap

**REQ-009：所引记录未证明当前 macOS 五类完整验证。** PRD 的平台要求明确规定，在 macOS 本机 VS Code 完成五类成功／失败、核心编程闭环与恢复验证，并包含一个真实扩展。其[组合验收引用](../archive/2026-09-28-wi-010-goal-closure.zh.md)，特别是资源调用补证据，记录的是原 Windows 目标及 Windows 原生／安装宿主；底层[可信扩展](../archive/2026-09-28-wi-013-acceptance.zh.md)、[审阅](../archive/2026-09-28-wi-016-review-acceptance.zh.md)和[会话](../archive/2026-09-28-wi-017-session-acceptance.zh.md)证据也属于较早平台范围。

后续 [macOS 组包评估](../archive/2026-09-30-wi-034-macos-evaluation.zh.md) 明确排除完整 REQ-009 验收。[macOS 验证记录](../archive/2026-09-30-macos-verification-acceptance.zh.md) 补了双窗口所有权、崩溃清理、端点调用与设备码／浏览器 OAuth 交互，但没有记录完整的资源／扩展／表单／审阅／会话代表性成功失败矩阵。对当前文档的针对性搜索也未找到覆盖该余项的独立 macOS 矩阵。这是已查记录的证据缺口，不是这些功能失败或不存在未记录跑次的证明。历史 Windows 通过仍须保留为 Windows 事实。

## Further requirement checks

REQ-008 已实现恢复、分页及历史工具通用展示；PRD 还要求在能识别时披露缺失能力。[SavedHistory](../../src/webview/components/saved-history.tsx) 提供“历史工具不代表当前已加载”的通用警告；[历史投影](../../src/adapter/sessions/session-history-projection.ts) 显示历史名称／状态，没有与当前工具清单比较。具体缺失能力披露仍需针对性评估，不能先认定该句已完全满足。完整依赖检测明确不是要求。

模型／thinking、附件事务、流式执行、Stop／恢复、覆盖范围内审批、只读审阅和保存会话等核心流程，有正式实现路径及限定历史验收。本次未认证每个分支，也未重跑这些记录。可信扩展代表性兼容仅限已记录目标和公开 pi 版本；通用生态兼容、丰富附件、remote／multi-root、跳过审批与公开发布仍是独立非目标。

中文 REQ-009 还保留可信选择、Stop 未确认恢复及标准表单的旧 Prepare／待验证措辞；英文需求与 WI-013／ADR 0002 已记录其限定验收。这是翻译／状态漂移，不是新增实现缺项。把旧句转为任务前，应对照权威英文文本核对双语版本。

## Current leaning and next steps

项目已实现核心工作流，且存在历史受托验收；但“范围内每条需求细节及当前 macOS 验收条件均满足”的更强结论没有充分支持。将已确认 REQ-001／002 缺项及 REQ-009 证据余项写回 ACTIVE。后续限定提案应补资源状态提示和无歧义的活跃模型身份、评估项目／缺失能力可见性，并查找或补跑 macOS 代表性矩阵。本调查不批准新 WI 或实现，不静默改产品需求，也不改写历史通过。
