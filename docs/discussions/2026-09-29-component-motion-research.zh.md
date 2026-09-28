# 侧栏 UI skill 的组件动效调研

[English](2026-09-29-component-motion-research.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[English](2026-09-29-component-motion-research.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-29
- 类型：讨论
- 状态：调研完成；更新 skill 指导，不代表正式 UI 验收
- 创建：2026-09-29
- 权威：**仅上下文**——外部证据与设计建议，不覆盖 PRD、[`ACTIVE.md`](../../ACTIVE.md) 或维护者已确认的视觉选择
- 相关：[UI 工艺讨论](2026-09-28-agent-ui-rules.zh.md)、[pi-sidebar-ui skill](../../.agents/skills/pi-sidebar-ui/SKILL.md)

## 问题与范围

维护者要求先调研互联网，再改进 skill 的组件动画指导。主要补充是可复用的动效契约：目的、触发条件、时长／缓动、中断、减少动态效果时的回退与验证。本次不全面审计正式组件，也不授权替换已确认的 Pi 图标重播和最高推理强度流水效果。

## 一手证据

以下来源均于 2026-09-29 获取并阅读。Carbon 网站返回 HTTP 403，改读其官方仓库的页面源码；其余链接页面获取成功。这些是来源观察，不是插件的性能测量。

| 来源 | 支持的结论 | 对 Pi 的意义 |
|---|---|---|
| [Carbon 动效概览官方源码](https://github.com/carbon-design-system/carbon-website/blob/main/src/pages/elements/motion/overview.mdx) | 区分克制、响应迅速的生产性动效与偶尔使用的表达性动效；标准、入场、退场缓动不同，时长受距离与尺寸影响 | 菜单和按钮保持轻快；品牌动画限定范围 |
| [Fluent 2 motion](https://fluent2.microsoft.design/motion) | 强调功能性、自然、一致与吸引力；长距离需要更多时间；顶层导航宜快速淡变，动效集中在关注元素附近 | 窄侧栏采用局部小幅变化，避免大面板长距离移动及逐行入场 |
| [web.dev：高性能 CSS 动画](https://web.dev/articles/animations-guide) | 优先考虑 transform 和 opacity；检查布局、绘制、丢帧；谨慎使用 will-change | 可试验平移并裁切渐变层，但必须实测，不能由 CSS 写法推断合成性能 |
| [MDN：prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) | 系统偏好用于减少、移除或替换非必要运动；大幅缩放和平移可能引起不适 | 装饰动效提供真实的静态最终状态，保留数值、文本与操作 |
| [MDN：matchMedia](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia) | matches 可读当前偏好，并可监听 change 事件 | JS／Canvas 动画需处理挂载期间的偏好变化 |
| [MDN：Animation.cancel](https://developer.mozilla.org/en-US/docs/Web/API/Animation/cancel) | 取消会终止播放并清除效果；运行中的 finished promise 会以 AbortError 拒绝 | 中断时保留正确底层状态，处理取消及过期完成回调 |
| [WAI-ARIA APG：模态对话框](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) | 打开时移入焦点，Escape 关闭，通常返回触发器；模态语义必须对应实际模态行为 | 动画不能延迟或破坏焦点；这些规则不自动适用于所有弹层 |
| [WCAG 2.2 理解 2.2.2：暂停、停止、隐藏](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) | 自动开始、持续超过五秒且与其他内容并行出现的移动信息，除必要情况外需可暂停／停止／隐藏；直接有意触发与自动或间接触发不同 | 应分别分析主动选择最高档和恢复已保存最高档；仅支持减少动态效果不能证明全部要求都满足 |

Carbon 的时长 token 为 **70、110、150、240、400、700ms**。其生产性标准曲线为 cubic-bezier(0.2, 0, 0.38, 0.9)，入场为 cubic-bezier(0, 0, 0.38, 0.9)，退场为 cubic-bezier(0.2, 0, 1, 0.9)。这些是 Carbon 的设计值，不是通用无障碍规定。Fluent 页面提供时序原则，不规定下列 Pi 时长。

## 建议的 skill 改进

以下为 **Pi 自有起点提案**，需在侧栏中校准，不能归为官方强制参数：

| 组件 | 提案 | 完成与中断 |
|---|---|---|
| 图标按钮／选中行 | 100–120ms 颜色／透明度反馈，保持几何和点击区域稳定 | 新悬停／按压状态立即替代旧状态 |
| 锚定菜单／弹层 | 入场 150–180ms，退场 90–120ms，淡变和不超过 4px 的位移 | Escape／外部点击即时响应；重新打开取消旧退场清理 |
| 设置／历史表面 | 180–220ms 短淡变，保留方向感与滚动位置 | 搜索导航立即可用，不随每次输入重播列表入场 |
| 推理强度条 | 拖动直接跟随指针，仅松手或键盘离散切换使用 160–180ms 吸附 | 新输入从当前视觉状态接管；保持已有值与提交时机契约 |
| 流式内容／状态 | 稳定布局和少量局部反馈 | 不逐 token 重播入场，不以动画作为唯一状态信号 |

组件配方应含“触发 → 动画属性 → 最终状态 → 取消 → 减少动态效果回退”。业务状态独立于动画结束：跳过或取消动画时仍须正确关闭菜单、应用设置。若退场短暂保留视觉节点，应阻止其接收焦点／点击，并防止旧清理回调影响重新打开的组件。这是基于平台 API 和 APG 的工程建议，不是逐字引用。

已确认的 Pi 图标重播与最高档流水是表达性例外。保留其身份与触发范围，同时要求静态回退、销毁清理、隐藏时停止。持续动画须按实际触发情境评估后才能声称无障碍合规。限制播放时长或新增暂停按钮属于另一个产品改动，不能由本次调研自动决定。

## 验证与未决问题

截图只能证明几何与颜色，不能证明动效质量。应检查快速开关重开、中断滑条吸附、纯键盘操作、打开前和运行中切换减少动态效果，以及隐藏／卸载清理。引入持续或重绘密集的效果时，用性能 trace 或绘制／帧诊断检查，记录实际宿主；构建通过不等于顺滑。

实现使用满足需求的最小机制：简单状态反馈用 CSS transition，需要显式播放／取消时考虑 Web Animations API，交互或绘制确需逐帧处理时再用 requestAnimationFrame／Canvas。调研不要求引入新动画库。现有流水是否重绘过多、各组件中断是否正确，仍待专项实现检查和运行验证。
