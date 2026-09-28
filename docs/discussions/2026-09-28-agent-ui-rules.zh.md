# 把 UI 工艺写成 Code Agent 能执行的规则

[English](2026-09-28-agent-ui-rules.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-28-agent-ui-rules.md](2026-09-28-agent-ui-rules.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-29
- Type: Discussion
- Status: Adopted into skill; implementation in WI-025
- Created: 2026-09-28
- Authority: **仅作上下文** — 不覆盖 Draft PRD 视觉简报、[`ACTIVE.md`](../../ACTIVE.md) 或架构
- Related: [对照 Claude Code](2026-09-28-claude-code-ui-comparison.zh.md)

## 问题

UI 设计能不能写成 Code Agent **可检查的规则**，而不是「再有质感一点」？

能。有效形态是 **token 表 + 禁止清单 + 自检清单**，不是情绪板。编不成数字或名字的品味，每个会话都会漂。

## 来源（一手）

- Anthropic Claude Code **frontend-design** skill：[raw SKILL.md](https://raw.githubusercontent.com/anthropics/claude-code/main/plugins/frontend-design/skills/frontend-design/SKILL.md)。流程：简报 → 紧凑 token 计划（色／字／布局／原则）→ 独特性审查 → 再写代码。另：一个签名元素；复杂度匹配愿景；出门前摘掉一件配饰。校准：奶油底+陶土色、黑底荧光、报纸版、同一套 SaaS 卡片都是*默认*，不是选择。
- VS Code Webview 主题：[extension-guides/webview](https://code.visualstudio.com/api/extension-guides/webview)。body 类 `vscode-light`／`vscode-dark`／`vscode-high-contrast`；颜色 `--vscode-*`；界面字体 `--vscode-font-family/size/weight`（宿主默认 **13px**）；编辑器字体另算。
- WCAG 2.2：[1.4.3](https://www.w3.org/TR/2023/REC-WCAG22-20231005/) 正文对比 **4.5:1**（大字 3:1）；[1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) 控件／焦点／图标相对相邻色 **3:1**。
- Material Design 3 间距：[styles/spacing](https://m3.material.io/styles/spacing)。基准 `space100` = **8dp**；布局用 8；组件内才用 4（以及 2／6／10）。padding／gap／margin 分开命名。
- Material 2 间距方法：[8dp 网格／4dp 字](https://m2.material.io/design/layout/spacing-methods.html)。48dp 触控目标是**手机**下限；280–400px IDE 侧栏是紧凑密度，不是手机。

## 两类规则（不要混）

| 家族 | 编码什么 | 适合 Pi？ |
|------|----------|-----------|
| **审美方向**（Anthropic skill） | 独特身份、自定义字体、不对称、「不要 Inter／system-ui」 | **不能当默认。** 本产品简报是 IDE 原生，必须用 VS Code 字体／颜色。那份 skill 会和 PRD 打架，侧栏里会像外来应用。 |
| **约束／token／清单** | 具名角色、数字阶梯、对比下限、密度、一种强调色、「不许再发明第 7 种灰」 | **适合。** Agent 就是靠这个才不会写出 11px 铬件、10px 间隙、每个控件一个圆角。 |

Claude Code 自己的界面更接近家族 1（品牌全窗）。Pi 已接受的简报是家族 2，外加维护者日后若允许的*有界*品牌叠加（一种强调色）。

## Agent 真正跟得住的东西

Agent 跟得住 **具名、数字、或是否** 的规则。跟不住「更有质感」和「像 Claude Code」。

一套适合 Pi 的包装应有四层：

1. **产品画框（PRD 已有）：** 辅助侧栏 280–400px；VS Code 主题底与字体；浅／深／高对比；作曲区始终可及；Codex 式简洁，不是独立聊天画布。
2. **Token 表（今天缺的是*角色*）：** `theme.css` 已经映射 VS Code，但 `--ui-radius: 6px` 和 `--ui-gap: 10px` 并不是封闭阶梯。间距应是列表（4／8／12／16／24），不是随手的 3／5／7／10。字体应是角色（chrome／body／empty-title），不是每个选择器 10／11／12／13／19。
3. **硬约束：** 除可选 Pi 强调色外不许新 hex；不许新 font-family；280px 无整页横滚；`prefers-reduced-motion`；焦点可见；正文 4.5:1、控件 3:1。
4. **批评循环（Anthropic skill 里可用的部分）：** 先计划 token；截图；「摘掉一件配饰」；一个签名对象（对 Pi：作曲区），其余安静。

## 规则草案（提案，未批准）

不是实现授权。数字是日后视觉工艺 WI 的起点。

| 规则 | 可检查形态 |
|------|------------|
| 间距 | 只用 4、8、12、16、24px。4 仅用于芯片／图标*内部*。新 CSS 不得引入 3、5、6、7、10、11。 |
| 字体角色 | `chrome` 12／400，`body` 13／400 lh 1.5，`title` 16–20／550。不要把 10–11px 当默认语气。 |
| 圆角 | 铬件 6、控件 8、作曲区／空状态卡 12。不要每个控件一个新圆角。 |
| 颜色 | 底来自 `--vscode-*`。最多 **一种** 产品强调色，只用在空状态标志 + 作曲区焦点 + 发送。 |
| 密度 | 空闲空状态：导航图标 + 作曲区。审批／错误／Stop 出现时仍要醒目。 |
| 动效 | 仅响应用户动作（开关 popover）。尊重 `prefers-reduced-motion`。 |
| 文案 | 空状态是行动邀请；错误要写出怎么修。句首大写／中文不用标题大小写游戏。 |
| 主题 | 浅／深／高对比同一布局；强调色是带回退的 token，永不写死珊瑚色。 |

当前 `candidate.css` 在很多地方违反间距规则（3、5、7、10、11px）。全窗品牌应用显得「被设计过」、这条侧栏显得「拼起来的」，原因就是 Agent（和人）没有封闭阶梯。

## 不要从 Anthropic skill 照搬的部分

- 禁止系统字体／Inter —— 这里宿主字体**就是**产品。
- 「每一页都要独特身份」—— VS Code 扩展应该像 VS Code，最多一个签名。
- 奶油底+陶土或荧光绿默认 —— skill 自己把陶土（约 #D97757）标成 Claude 交互的识别特征。
- 最大化动效和自定义展示字体。

只拿走：**先写 token 再写 CSS**、**一个签名**、**自检**、**文案也是设计**。

## Skill（2026-09-28）

维护者选择独立 skill。Codex 空白会话简报已收入 [pi-sidebar-ui](../../.agents/skills/pi-sidebar-ui/SKILL.md) 与 [tokens.md](../../.agents/skills/pi-sidebar-ui/tokens.md)。

| Codex 条目 | 处理 |
|------------|------|
| 安静、有工具感、窄栏优先；不复制他产品标志／吉祥物／欢迎文案 | 采纳 |
| π 标志、可选光标、珊瑚橘为唯一强调、小巧不做海报 | 采纳（`--ui-brand`） |
| 一整块工作表面；标题在左；历史／新建细线图标；欢迎略偏下；一句问候 | 采纳 |
| 作曲区略深、细边框、约 8px 圆角；上输入下工具栏；换行不挤压 | 采纳（8px 取代先前 12px 作曲区提案） |
| 中性炭灰、柔和文字、无渐变／玻璃／厚阴影 | 作为**深色回退**采纳；浅色／高对比仍跟 `--vscode-*` |
| 优先 VS Code 色／图标；珊瑚橘只用于品牌和少数状态 | 采纳 |

不按原文照搬：把界面锁成一块设计过的深色画布（与 IDE 原生主题简报冲突）。会话栏设置齿轮仍允许（产品需要）。写 skill **不**授权实现空状态；当前仍是 WI-024 F5。

## 截图组件参考（2026-09-29）

维护者提供 Codex／Claude Code 截图，并明确要求把讨论融入现有 skill。本次偏好是组件比例与精细程度，对比暂不考虑颜色。采纳的操作规则统一放在[组件工艺](../../.agents/skills/pi-sidebar-ui/components.md)：作曲区控件、随内容选择结构的菜单／选择器、成组设置行，以及功能已获批准时的紧凑可搜索历史列表。

本次在数字 token 之外补充实际渲染后的间距、对齐、层级与状态对照。“作曲区是唯一成形物”限定于空闲画布，不禁止菜单的功能边界或获批设置分组。pi 现有 token 与配色决策继续有效。截图像素和未观察到的交互行为不是实现证据。本次仅更新 skill／文档；参考图不授权编辑器标签页设置、搜索、新审批模式或历史导航改动。应用 UI 验收仍以 ACTIVE 的待办为准。

## 可视化参考库补充（2026-09-29）

维护者随后授权制作可视化组件参考库，并要求寻找更合适的网上图片。已下载、裁切并标注两张 Claude Code 官方文档图片，出处保存在[来源记录](../../.agents/skills/pi-sidebar-ui/sources.md)。Codex 文档请求超时，官方 Marketplace 页面未找到可用截图；尚未取得能替代维护者 Codex 弹层／设置／历史截图的在线素材。这不否定维护者参考图的价值，也不证明官方图片不存在。

skill 现在引导 agent 实际查看图片、打开本地交互式[组件样板](../../.agents/skills/pi-sidebar-ui/assets/component-lab.html)，并读取[结构化组件契约](../../.agents/skills/pi-sidebar-ui/specimens.json)。样板包含原创 pi 候选形态，可切换宽度／高度／主题／语言，展开菜单，查看设置行和模拟可搜索历史。它们仅是隔离的内存演示，不是已交付 UI、真实权限或会话操作，审美确认仍待维护者反馈。[运行与检查说明](../../.agents/skills/pi-sidebar-ui/visual-reference.md)区分官方证据、候选解释和产品批准。

后续补充：维护者开启 TUN 后，两个 Codex IDE 文档请求成功，并取得一张 1600 × 900 的官方 IDE 截图。原图、侧栏标注裁图和出处已加入同一参考库。图片覆盖标题栏、成组文件行和收起状态的输入区控件；展开菜单、完整设置页和历史列表仍缺少在线原图。重定向与剩余限制见更新后的来源记录。

## 未决问题

1. ~~skill 还是塞进 AGENTS.md~~ → skill，外加一行 load-map。
2. ~~纯宿主色还是一种强调色~~ → 一种 `--ui-brand` 叠加。**2026-09-28 已被取代：** 维护者在 F5 看到珊瑚橘后决定，整个 UI 必须是灰白色（pi 自身的颜色）。`--ui-brand` 现为宿主前景色，按钮用宿主次级样式，除警告与错误外不再有色相。上表中的珊瑚橘条目仅作历史；现行规则以 skill 与 PRD 为准。
3. ~~是否等 WI-024 F5 后再 Prepare 视觉工艺／空白会话 Build？~~ → 否。2026-09-28 维护者直接授权 WI-025 Build，WI-024 F5 另放停车场；范围见 [`ACTIVE.md`](../../ACTIVE.md) 与 PRD「侧栏视觉工艺切片」。

2026-09-29：维护者明确满意模型菜单精修稿，右侧精修组件现为[已确认视觉基准](../../.agents/skills/pi-sidebar-ui/visual-reference.md#approved-model-picker-visual-baseline)；其他样板及正式插件集成仍需分别验收。

2026-09-29: 本机 Computer Use 截图现已补齐 Codex 弹层、设置与历史的可见素材缺口：9 类组件裁切图附编号标注与来源，并接入组件契约。历史标题已遮盖，完整窗口原图保留本机。组件规则补充按信息量选择密度、按内容决定宽度、选中与悬停独立、容器层级等知识；不据此认定未验证的响应式／键盘行为，也不扩大其他 pi 样板的验收。

2026-09-29: 维护者否决细白推理滑条，要求加粗、浅到深渐变及全部档位可见。独立样板现提案为 24px 蓝色渐变胶囊、28px 滑块与五档可点击标签；具体蓝色处理待目视确认。例外仅限样板，不修改正式 UI 配色或已确认模型菜单基准。

2026-09-29 后续：维护者否决单纯蓝色配色，要求参考 Codex Ultra。新候选采用靛蓝／薰衣草紫／柔紫、中部柔光、稀疏静态星点和白色滑块；中档以上逐渐增强，装饰只出现在已填充区域，保留连续拖动与缓动吸附。Ultra 参考来自本次对话，不是新下载或独立实机捕获的素材。此前蓝色提案已被取代，新独立样板仍待目视确认。

2026-09-29: 维护者随后否决类似 Codex 的蓝紫方向，授权制作 pi 自有灰银／香槟金动效样板。候选增加滑块悬停／按压反馈、档位文字切换及最高档单次金属高光，保留连续填充、离散标签和缓动吸附，切换时取消旧动画并遵循减少动态效果。此方向取代星空候选；视觉确认与正式插件集成仍待定。

## 动效指导更新（2026-09-29）

根据维护者要求，[一手来源调研](2026-09-29-component-motion-research.zh.md)已转化为新的[动效规范](../../.agents/skills/pi-sidebar-ui/motion.md)，包含本地时长默认值、状态过渡契约、中断、减少动态效果与生命周期检查；不能只凭截图验证。保留欢迎标志／推理条例外，区分样板文字动画与正式实现。本次只更新 skill 指导，不修改应用代码或改变验收状态。
