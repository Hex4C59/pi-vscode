# 设置界面重设计调研

[English](2026-09-29-settings-redesign-research.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-29-settings-redesign-research.md](2026-09-29-settings-redesign-research.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-29

- 类型：讨论
- 状态：调研与候选方向；不是正式产品验收
- 创建：2026-09-29
- 权威：**仅作上下文**——不覆盖 [ACTIVE](../../ACTIVE.md)、[PRD](../product-requirements.zh.md) 或架构
- 相关：[活跃运行会话模型与已保存默认](2026-09-29-live-session-saved-default.zh.md)

## 维护者决定 — 2026-09-29

维护者明确选择 **A：编辑区独立设置**，替代下文代理最初推荐的 B。WI-026 批准单实例设置页、分类／详情导航、输入区执行入口及宿主内存共享语言。既有凭据／默认／runtime 语义保持，不增加持久化语言偏好。这是研究中说明的原生 Settings 建议例外；选择候选与正式实现、F5 验收分开记录。

## 问题

维护者否定了继续小幅调整间距的做法，要求先调研，再从根本上重设计设置。提供的截图把语言、已保存默认模型、供应商凭据与执行配置全部放进狭窄的滚动弹窗。删除说明文字减少了文案，但信息架构没有改变。

## 一手证据

检索日期为 2026-09-29。以下是文档观察，不代表实际运行过这些产品或看过其当前截图。

| 来源 | 观察到的指导或行为 | 对 pi 的启示 |
|---|---|---|
| [VS Code Settings UX](https://code.visualstudio.com/api/ux-guidelines/settings)、[官方源码](https://github.com/microsoft/vscode-docs/blob/main/api/ux-guidelines/settings.md) | 推荐默认值、清楚的说明、复杂设置的文档链接以及具体设置 ID 链接；明确不推荐自建设置页／Webview 或冗长说明。 | 持久化扩展偏好以原生 Settings 为基线。自定义界面需要具体任务理由；竞品做法不是豁免依据。 |
| [VS Code Webviews UX](https://code.visualstudio.com/api/ux-guidelines/webviews)、[官方源码](https://github.com/microsoft/vscode-docs/blob/main/api/ux-guidelines/webviews.md) | 仅必要时使用 Webview，避免重复已有 Settings／配置功能；要求主题、键盘无障碍和合适的命令操作。 | 把同一表单搬进更宽的自定义编辑器标签页，不会自动成为好设计。 |
| [Claude Code in VS Code](https://code.claude.com/docs/en/vs-code) 的 “Use the prompt box” 与 “Configure settings” | 模型与权限模式入口位于输入区；扩展常规行为使用原生 VS Code Settings，和 CLI 共享的 runtime 设置另行管理。文档中的模型选择器也能保存按模型区分的思考强度默认值。 | 按任务与使用频率拆分入口。不能认为靠近输入区的控件都只作用于会话，也不能直接照搬 Claude 的持久化语义。 |
| [Cline Anthropic 配置](https://docs.cline.bot/provider-config/anthropic) | 文档流程为打开 Cline 设置、选择供应商、填写凭据，再选择模型；自定义 Base URL 为可选项。 | 供应商配置是完整任务，适合独立详情流程。该来源证明操作步骤，不证明视觉质量、布局尺寸或通用设计准则。 |

VS Code 页面读取自官方仓库 Markdown。Claude 读取了 HTML 页面并检查可读文本；其 `.md` 地址返回 HTTP 403。Cline 从官方 `llms.txt` 发现并读取 `.md` 页面；最初猜测的配置地址返回 HTTP 404。结论不依赖失败地址。另外实际查看了已有的 [Codex 设置本地截图](../../.agents/skills/pi-sidebar-ui/assets/references/local-codex-settings.png)：分类导航、独立主区域与自然宽度的尾部控件。其[来源记录](../../.agents/skills/pi-sidebar-ui/sources.md)不能证明所示版本或响应式行为；它不是本次在线新截取的图片。

## 诊断与方案

视觉问题有结构性原因：不同任务获得同等强调，所有控件同时展开，弹窗损失了侧栏本就有限的宽度，却保留整张设置表单。截图支持这一判断；这是本次设计分析，不是来源原话。

1. **原生设置加就近操作。** 持久化扩展偏好进入原生 Settings；模型／权限操作留在聊天附近，供应商管理按需打开。最贴近 VS Code 指导，但可能改变持久化、命令路由与入口，需要另行评估和批准。
2. **侧栏设置导航加聚焦详情。** 用原位设置页面替代整张弹窗表单。总览链接到模型与供应商、执行、语言；每个详情只呈现当前任务的控件。凭据属于供应商详情，不必始终伴随默认模型出现。保留单一返回／关闭层级。可逆候选可以在不改宿主的情况下验证；它仍是对原生设置建议的有意识偏离。
3. **宽版自定义设置编辑器。** 空间足以把标签与控件分列，但会增加界面并重复原生设置。当前几个控件不足以证明必要性；聚焦候选失败或设置规模扩大后再考虑。

## 当前倾向

先为方案 2 制作可直接查看和操作的候选，同时保留方案 1 作为更贴近平台的长期选择。根本变化是任务导航和渐进呈现，而不是给旧弹窗换边框。不要为了填满空间增加账户仪表盘、供应商卡片或状态摘要。

保留 pi 当前语义：已保存默认与活跃运行会话模型仍然不同；选择默认不启动会话。凭据仍归宿主管理，Webview 不接收密钥输入。执行切换保留仅空闲可用、进行中／错误／恢复状态及真实安全说明。关键安全区别须在选择前可见，不能只藏进 tooltip。当前 WI-026 批准本身不授权改变持久化或宿主协议。

## 未决问题与缺少的证据

- 维护者实际查看和操作 280/320/400px 候选后，是否认可聚焦导航方向？
- 持久化偏好将来是否进入原生 Settings？语言当前仅在页面生命周期内保存，迁移不能悄悄改变持久化规则。
- 候选的交互与主题检查仅证明预览。正式集成、键盘焦点、真实宿主行为和维护者验收仍需分别完成。

## 可查看候选

独立的[设置结构研究页](../../.agents/skills/pi-sidebar-ui/assets/settings-redesign-study.html)保留在已有视觉参考库中，不进入正式产品依赖图。以 `python3 -m http.server 8769 --bind 127.0.0.1 --directory .agents/skills/pi-sidebar-ui` 启动，再打开 `/assets/settings-redesign-study.html?variant=B`。

- **A — 自定义编辑区设置：** 分类导航与独立的模型／供应商页面，聊天保持可见。这是有意识地偏离原生 Settings 建议的对照方案，不是官方推荐。
- **B — 侧栏分层导航：** 全幅页面替代弹窗，总览 → 模型／供应商列表 → 供应商详情；模型与执行操作留在输入区附近。当前小规模设置优先推荐此候选；代价是部分操作增加点击。
- **原生 Settings：** 保留为平台基线，不伪装成 pi 已注册这些设置。把页面生命周期的语言选择迁入其中，需要明确的持久化决策。

两个候选均使用固定样本与内存状态，供应商操作不接收密钥。研究页有意不模拟默认模型成功应用到活跃会话、思考强度能力、真实 runtime 切换或正式焦点恢复；这些省略不授权移除已有行为。仅中文文案、静态编辑器／聊天上下文是设计辅助，不是正式实现。

Chrome 实际检查：A 的 320px 深色；B 的 320px 深色总览、280px 深色供应商列表、400px 浅色模型详情、280px 高对比执行菜单。实际操作模型搜索与选择、分类／详情导航及返回聊天。这是研究页抽样检查，不是完整主题／状态矩阵、系统 forced-colors、F5 或 VSIX 证据。
