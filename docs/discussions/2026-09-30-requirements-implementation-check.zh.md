# 需求实现核对（2026-09-30）

[English](2026-09-30-requirements-implementation-check.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-requirements-implementation-check.md](2026-09-30-requirements-implementation-check.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01
- 类型：讨论
- 状态：Draft；REQ-001 拒绝提示缺口已由 WI-068 关闭，REQ-002 同名身份已由 WI-069 关闭，REQ-009 macOS 五类余项已由 WI-070 于 2026-10-01 关闭
- 创建：2026-09-30
- 权威：仅源码及证据观察；不是新需求、Build 授权或 Accepted PRD／ADR／gate 决定变更
- 相关：[PRD](../product-requirements.zh.md)、[ACTIVE](../../ACTIVE.md)、[WI-068](../archive/2026-10-01-wi-068-acceptance.zh.md)、[WI-069](../archive/2026-10-01-wi-069-acceptance.zh.md)、[WI-070](../archive/2026-10-01-wi-070-acceptance.zh.md)

## Question and method

当前入口记录无未完成任务后，维护者追问需求文档中要的功能是否全部实现。本次读取需求、正式界面组合、相关实现接缝及既有验收记录，未改代码，未运行行为测试或原生宿主。Accepted 标签或空 WI 队列不能证明条文实际实现。

## Confirmed implementation gap

**REQ-001：拒绝项目资源后的可见状态（已由 WI-068 关闭）。** 2026-09-30 检查发现 settled 的 `ProjectResourceConsent` 没有提示。WI-068 在拒绝后增加 `#declined-resources`。任务前的文件夹身份披露仍是独立可见性疑点，不是宿主实际在错误目录执行的证据。

项目身份展示也较弱：[ProjectResourcesPrompt](../../src/webview/chat/project-resources-prompt.tsx) 只在选择前、默认折叠的详情里提供文件夹路径；[SessionNavigation](../../src/webview/chat/session-navigation.tsx) 显示对话名。这是否满足“执行任务前显示当前文件夹”仍需针对条文核对。它是可见性疑点，不是宿主实际在错误目录执行的证据。

**REQ-002：活跃模型身份歧义（已由 WI-069 关闭）。** 2026-09-30 检查发现运行时解析优先显示名，同名标签可能没有已应用 radio。WI-069 投影 `provider / modelId`。目录标签与作曲区芯片仍只是展示。这不是运行时选错模型的证据。

## Acceptance evidence gap

**REQ-009：当前 macOS 五类验证（已由 WI-070 关闭，限制见记录）。** 2026-09-30 检查发现所引记录是 Windows 或不完整的 macOS 双窗口／OAuth 证据。WI-070 在 Darwin 27／VS Code 1.139.1 上跑隔离安装包，记录五类表、一次发送／流式／完成回合与自有 child 恢复，含已核对的 `pi-system-prompt-manager` 0.1.1。历史 Windows 通过仍是 Windows。skill 正文调用、附件／审阅与终端顺序交接未在该主机重跑；见 [WI-070 限制](../archive/2026-10-01-wi-070-acceptance.zh.md)。

## Further requirement checks

REQ-008 已实现恢复、分页及历史工具通用展示；PRD 还要求在能识别时披露缺失能力。[SavedHistory](../../src/webview/components/saved-history.tsx) 提供“历史工具不代表当前已加载”的通用警告；[历史投影](../../src/adapter/sessions/session-history-projection.ts) 显示历史名称／状态，没有与当前工具清单比较。具体缺失能力披露仍需针对性评估，不能先认定该句已完全满足。完整依赖检测明确不是要求。

模型／thinking、附件事务、流式执行、Stop／恢复、覆盖范围内审批、只读审阅和保存会话等核心流程，有正式实现路径及限定历史验收。本次未认证每个分支，也未重跑这些记录。可信扩展代表性兼容仅限已记录目标和公开 pi 版本；通用生态兼容、丰富附件、remote／multi-root、跳过审批与公开发布仍是独立非目标。

中文 REQ-009 还保留可信选择、Stop 未确认恢复及标准表单的旧 Prepare／待验证措辞；英文需求与 WI-013／ADR 0002 已记录其限定验收。这是翻译／状态漂移，不是新增实现缺项。把旧句转为任务前，应对照权威英文文本核对双语版本。

## Current leaning and next steps

项目已实现核心工作流，且存在历史受托验收。REQ-001 拒绝资源可见性已由 WI-068 关闭。REQ-002 同名身份已由 WI-069 关闭。REQ-009 当前 macOS 安装包五类余项已由 WI-070 在该记录限制内关闭。其余停车场是目录整理，不是该矩阵。
