# pi-vscode — 当前工作（跨会话入口）

本文件是唯一当前工作入口，不是需求／架构权威或追加日志。规则见 [AGENTS](AGENTS.zh.md)、[内核](AGENTS.kernel.zh.md)与[协作指南](docs/guides/agent-collaboration.zh.md)。原起点压缩与长交接保存在[9月27日检查点](docs/archive/2026-09-27-active-checkpoint-history.zh.md)，本次整体收尾见[WI-010归档](docs/archive/2026-09-28-wi-010-goal-closure.zh.md)。

## Agent 会话契约（摘要）

| 步骤 | Agent |
|---|---|
| 开场 | 必要阅读、Git基线、当前WI／批准／Gate／PRD与验收核对；不把历史提案当当前授权。 |
| 提案 | Prepare保留范围与PRD判定；新增Build范围须批准；WIP最多1。 |
| 建造 | 按批准实现并实际验证；模拟／runtime／F5／安装分别取证，不虚报接受。 |
| 收尾 | 对照批准、记录代理或维护者的实际验收身份；正常ADR／gate、双语归档、检查与资源清理。 |

## 正在做（WIP=1）

| 字段 | 内容 |
|---|---|
| **ID** | WI-025 |
| **标题** | 侧栏视觉工艺：空白会话与封闭 token 阶梯 |
| **阶段** | Build；维护者 2026-09-28 在任务消息中授权本次 Build（「本消息即维护者对本次 Build 的授权」） |
| **PRD 判定** | 用户可见：新增 PRD「侧栏视觉工艺切片（WI-025）」双语段落与追溯行；视觉主切片及本次明确授权的准备阶段交互修正；沿用 REQ-001／002／003 的宿主准入、既有消息与审批语义 |
| **Gate ID** | 无；不触及 runtime／信任／生命周期 gate，ADR0003 React 前端方向不变 |
| **Decision** | none |
| **批准范围** | `theme.css` 增 `--ui-brand` 与间距／字号／圆角／阴影 token；候选空白会话、会话栏、作曲区重排；候选已有表面（会话历史、消息、activity、审批、change review、附件芯片、设置／交接对话框、无文件夹／无模型／runtime 错误、权限入口）收进封闭阶梯；中英 UI 字符串同步；更新测试与预览检查。2026-09-28 维护者追加：整个 UI 改灰白单色、重做设置对话框版式、修复作曲区「+」与模型选择器不可点（WI-024 未提交宿主改动的调度回归，只改执行顺序，不改消息契约）。本次反馈「未打开文件夹时…帮我解决」追加授权：无文件夹的 + 可展开并引导打开文件夹；模型入口使用已有全局配置选择默认模型，不启动 runtime、不改信任／附件准入。本次维护者另授权缩小编辑器标题栏打开 Pi 的入口图标：深／浅色 SVG 各增加对称留白，图案缩至原来的 80%，点击区域保持宿主尺寸。2026-09-29 维护者授权修复打开文件夹后的大段资源说明与作曲区禁用：初次资源选择移至首次发送／添加附件的简短对话框，完整说明折叠；准备阶段可编辑草稿、打开附件菜单和选择全局默认模型。保留显式 allow／decline、宿主准入和再次发送／添加动作，不自动加载资源或重放任务。**不**授权新功能、宿主消息、密钥、审批语义、pi runtime、布局容器、OAuth、Plan 模式、全窗聊天、自定义皮肤、插画、提交／推送 |

### 目标与范围

空闲空白会话看起来像随时能开工的编程工具：元素很少、位置准、间距只来自 token，有 π 的辨识度但不打扰读代码。依据 skill [pi-sidebar-ui](.agents/skills/pi-sidebar-ui/SKILL.md) 与 [tokens](.agents/skills/pi-sidebar-ui/tokens.md)；讨论见 [UI 规则](docs/discussions/2026-09-28-agent-ui-rules.zh.md)。

1. **Token 先行**：`--ui-brand` = 宿主前景色（灰白单色，维护者 2026-09-28 否决珊瑚橘；高对比下作曲区焦点退回 `--ui-focus`），按钮 `--ui-accent*` 用宿主次级按钮色、`--ui-space-1..5`（4／8／12／16／24）、`--ui-font-chrome／body／empty`（12／13／17）、`--ui-radius`（6）与 `--ui-radius-lg`（8）、`--ui-shadow`（`--vscode-widget-shadow`）。移除 `--ui-gap: 10px`。
2. **空白会话**：顶栏左标题、右细线历史／新建／设置；画布中心略偏下 36px 单色 π（`assets/pi.svg` 蒙版）+ 一句问候（skill 允许的可选光标在 Critique 中移除，见交接）；删除副标题 “Ask a question or describe a change.” 及中文。
3. **作曲区**：底部 8px inset，比页面略深（`--ui-bg` 混黑一步，高对比用 `--ui-input`），1px 边框，8px 圆角；上输入、下工具栏（附件＋｜模型｜权限｜发送），权限入口改入工具栏流式布局，不再绝对定位压住输入。发送 `--ui-brand` 实心；禁用时退为中性；Stop 同位实心方块图标。
4. **其余表面**：只替换间距／字号／圆角／阴影数值为 token，不改 DOM 语义与行为；审批（警告边）、错误（危险底＋左边线）、Stop 保持比空闲铬件醒目。

### 方案与架构核对

- 只动 `src/webview/**` CSS／TSX 与 UI 字符串；宿主、契约、runtime 不变。
- 解释口径：4px 仅用于芯片、图标及紧凑控件（按钮、菜单行、披露行）内边距；布局间距用 8／12／16／24。尺寸（宽高、定位偏移）不属间距阶梯。
- 保留例外：PRD 已确认的 thinking 滑条（蓝色渐变、胶囊轨道）不改；仅 baseline 测试夹具使用的旧样式（`layout.css`、`sessions.css`、`attachment-panel.css`、`conversation.css`、`responsive.css`）不在候选表面，不动。
- 风险：字号 10–11→12 增高审批／短视口预算；需在 280px 与短视口目视确认 Stop／审批仍可达。工作区已有 WI-024 未提交改动与本 WI 同文件（`candidate.css`），提交时需按 hunk 分开。

### 验收

| 项 | 可观察标准 |
|---|---|
| 空白会话 | 只一句问候（无副标题）；π 用 `--ui-brand`；无推荐问题／功能介绍／发光 |
| 作曲区 | 底部钉住；280／320／400px 工具栏不重叠、无整页横滚；发送为 brand 实心，Stop 醒目 |
| Token | 改动的候选 CSS 不含 3／5／6／7／10／11px 间距或字号；圆角只 6／8；发布样式无色相（警告／错误除外） |
| 设置对话框 | 标题栏＋细线分区；刷新为标题行图标；供应商状态无嵌套框；按钮中性 |
| 作曲区可用 | 供应商刷新挂住时 runtime 仍发布就绪、会话切换回到 idle；无文件夹时 + 展开并提供文件夹恢复、默认模型可选 |
| 主题 | light／dark／high-contrast 同一布局；焦点可见；`prefers-reduced-motion` 生效 |
| 回归 | `compile`／`lint`／相关 `npm test`／`verify:webview`；`preview:webview` 截图核对 |
| 待维护者 | F5 实机目视（未验收，不写成已接受） |

### 范围外与批准边界

不做新功能、不改宿主消息／密钥／审批语义／pi runtime／辅助侧栏容器；不做 OAuth、Plan 模式、全窗聊天、自定义暗色皮肤、插画；不抄其他产品吉祥物或欢迎文案；不提交、不推送。不把 WI-023／WI-024 的 F5 写成已验收。

## 当前焦点与未决项

- [x] WI-025 Prepare 写入 ACTIVE；维护者任务消息授权 Build。
- [x] PRD 双语切片段落与追溯行。
- [x] Token → 空白会话／作曲区 → 其余表面实现。
- [x] Critique 清单逐项核对；首稿后摘掉一件装饰（π 旁光标）。
- [x] 测试与检查：`compile`／`lint`／`npm test`（无新增失败，见交接）／`verify:webview`／`docs:verify`。
- [x] `preview:webview` 280／320／400 × light／dark／high-contrast 目视（合成宿主，非 F5）。
- [ ] 维护者 F5（待确认；未验收）。

## 最近交接

2026-09-29 提交交接：维护者明确授权提交全部剩余改动，宿主模型同步与侧栏实现已分组提交，当前记录独立提交；未推送。此次重新运行 compile、lint、verify:webview、docs:verify、docs:health 均通过（文档保留既有中英文代码块数量警告）；npm test 为 702 项、681 通过、21 失败，涉及 supervisor／session worker 夹具、路径与脚本测试，完整日志为本机 `/tmp/pi-remaining-tests.log`。不据历史结果认定这些失败已排除；F5 与安装包验收仍待办。

2026-09-29 强度条正式接入授权：维护者确认增强流水样板，并明确要求替换正式插件原控件。本次范围为现有模型弹层中的推理强度条：24px 三色轨道、28px 圆形滑块、按模型能力生成档位刻度、最高档 1.8 秒向右流水亮带，无曲线或下方五档文字。保留当前生效／下一轮待生效提示及宿主提交、禁用、焦点恢复语义。仅此控件取代旧单色要求。compile、lint、116 项相关测试通过；Chrome 正式组件预览已检查最高档外观与键盘 End，确认四档模型按能力显示刻度。完整宽度主题矩阵与 F5 另验。

2026-09-29 最高档流水：维护者要求最高档从左向右动态流水，样板采用三色渐变无缝循环；维护者反馈不明显后，加快至 1.8 秒、色带周期缩至轨道宽度 65%、增加柔和移动亮带并提高不透明度，离开最高档立即移除；不恢复曲线／线条，减少动态效果及强制配色保持静态。仅独立样板，正式控件不变。

2026-09-29 强度条简化：维护者否决最高档线条与动画，已移除样板曲线、循环流动和扫光，保留 Pi 三色渐变、档位刻度、跟手拖动及吸附。仅独立样板；JS 语法、docs:verify、diff 检查通过（已有双语代码块警告 1）。

2026-09-29 强度样板配色：依维护者要求改为 Pi 珊瑚红 #F09082 → 蓝 #4D9ABF → 金 #F1BE58；渐变固定在整条轨道坐标，随滑块逐步显露，未填充部分中性，最高档流动曲线保留。仅独立样板，正式 thinking 控件未改。

2026-09-29 Pi 点击重播：维护者追加授权中央标志点击重播，已改为带中英名称的按钮，原生 Enter／空格可触发；播放中忽略重复点击，减少动态效果保持静态，卸载取消。7 项相关测试通过，覆盖重播／重复点击／减少动态效果／卸载；compile、lint、资源和文档校验通过（已有双语警告 1）。F5 未验。

2026-09-29 欢迎标志：维护者明确要求中央 Pi 使用官网三色及相同入场方式，授权本次正式 UI 修改。仅欢迎标志采用底座、蓝、红、黄依次落下／底行消除／静态落定；减少动态效果直接静态，卸载取消。其他控件与宿主入口配色不变。此局部例外取代旧单色标志规则；实现已接入正式共享组件。本轮 compile、lint、6 项相关测试、verify:webview、docs:verify、diff 检查通过（已有双语代码块警告 1）；Chrome 深色预览已确认最终三色形状。完整宽度／主题矩阵与 F5 未验。预览服务 127.0.0.1:5173 为本次交付保留。

2026-09-29 图标规则固化：维护者要求避免 agent 自绘粗糙图标；skill 入口已加入图标任务路由，组件规则规定优先复用本地 Lucide、缺项从官方同库获取、保留来源版本和许可证、统一尺寸笔画并实际目视。仅文档更新；docs:verify、skill 校验与 diff 检查通过（已有双语代码块警告 1）。

2026-09-29 图标素材：维护者要求从网上找更精细图标；独立组件样板已替换为 13 个官方 Lucide SVG，固定来源版本、原始素材与 LICENSE 保存在 skill 的 assets/icons/lucide。统一 24 单位画布／1.75 笔画，标题栏 20px、常规 16px，保留按钮命名与操作。正式插件及已确认模型菜单未改。JS 语法、SVG 解析与 docs:verify／diff 检查通过（已有双语代码块警告 1）；Chrome 已刷新并目视检查 320 深色标题栏与输入区图标；完整主题尺寸矩阵未验，视觉接受仍待维护者确认。

2026-09-29 Codex 官方素材重试：维护者开启 TUN 后，IDE 概览／features 请求均返回 HTTP 200，重定向到新官方文档页。已下载并目视核对 1600×900 原图，新增侧栏标注裁图并更新参考库索引、组件契约与[来源记录](.agents/skills/pi-sidebar-ui/sources.md)。展开菜单／完整设置／历史原图缺口仍保留；本次不改样板交互或产品代码。检查：原图／标注目视、在线画廊索引及全部素材引用、docs:verify、git diff --check 通过；保留已有双语代码块警告 1。

2026-09-29 可视化参考库：维护者追加授权将 skill 升级为图片标注＋交互样板＋结构化契约，并查找网上参考。已保存两张 Claude Code 官方原图及两张标注裁图，出处／Codex 获取缺口见 [sources](.agents/skills/pi-sidebar-ui/sources.md)；[组件参考库](.agents/skills/pi-sidebar-ui/assets/component-lab.html)演示菜单、模型／思考选择、设置、历史，支持宽高／主题／语言／长文案。应用源码、产品范围与验收状态不变，候选审美待确认。检查：原图与标注目视，Safari 深色 400px 作曲区／添加菜单、280px 长模型菜单及设置抽查；jsdom 样板交互／状态／焦点／图片引用检查、JS 语法、skill 校验、docs:verify、diff 检查通过（已有双语代码块警告 1）。未完成全部宽度×主题浏览器矩阵，非 F5／产品验收。为交付保留 127.0.0.1:8768 本地样板服务；运行／停止说明见 [visual-reference](.agents/skills/pi-sidebar-ui/visual-reference.md)。未提交。

2026-09-29 滑条动态修正：维护者要求渐变随拖动出现并改善生硬跳档；样板现为中性未填充轨道、到滑块为止的动态渐变，连续指针位置与离散档位分离，松手／标签／键盘采用 180ms 缓出，新操作中断旧动画，reduced-motion 直接落位。Chrome 已实际拖动至两档之间并确认吸附；正式插件未改，具体手感待维护者确认。

2026-09-29 曲线修正：依维护者要求，柔和曲线仅到达最高档后显示，以 5s／6s 周期缓慢流动；离开最高档立即隐藏并停动，减少动态效果时显示静态曲线。仅独立样板。

2026-09-29 样板换稿：维护者否决精密刻线／π 滑块方向；现为柔和流体光带候选，保留银金色系、圆形滑块与五档圆点，已填充区域内加入两条交叠曲线，切档单次高光（普通 380ms／最高 680ms）。无下方文字及焦点外框。Chrome 320 深色最高档与键盘 End 已检查，JS 语法、docs:verify、diff 检查通过（已有双语代码块警告 1）；其他尺寸主题本轮未验，新稿待维护者确认。

2026-09-29 样板简化：依维护者要求移除滑条焦点外框和下方五档文字，保留轨道刻度、上方当前强度及原生键盘／无障碍值语义。仅修改独立样板。

2026-09-29 推理强度样板修订：维护者否决蓝紫配色，选择 pi 自有灰银→香槟金方向并授权先做动效样板。现保留粗轨道、五档标签与连续拖动／180ms 吸附，新增悬停放大／拖动按压、160ms 文字轻移及最高档一次 680ms 金属高光；切换档位中断旧动效，reduced-motion 简化。Chrome 已检查 320 深色最高档外观与点击切换；jsdom 检查最高档高光触发、切换取消、reduced-motion 与配色终点通过。JS 语法、skill 校验、docs:verify、diff 检查通过（保留已有双语代码块警告 1）。本轮未完成全部尺寸／主题矩阵或正式插件 F5；样板视觉与动效待维护者确认。

2026-09-29 实机素材补全：依维护者请求，将 Computer Use 捕获的 9 类 Codex／Claude Code 组件裁切图及编号标注接入 skill 图库与 specimens 引用，补齐 Codex 弹层／设置／历史的可见素材缺口；完整窗口留在本机 Pictures，历史标题在库内遮盖。新增按信息量选择行密度／宽度、独立状态标记、容器与分组层级的规则；窄屏／其他主题与行为未从截图推断。保留已确认模型样板及 WI-025 待验收边界，仅修改 skill 与记录，未改正式 UI。 本次检查：9 张标注汇总图目视、12 组来源／标注图片尺寸与框选／引用校验、图库 12 卡片与 24 图片 HTTP 加载、JS 语法、skill quick_validate、docs:verify 与 diff --check 通过（保留已有中英代码块警告 1）；Safari 本轮未取得窗口，未作本轮图库浏览器目视验收。

2026-09-29 单组件精修：依维护者“精修一个组件”请求，新增 skill 内的[模型菜单交互对照](.agents/skills/pi-sidebar-ui/assets/model-picker-study.html)，收紧菜单宽度、对齐入口、分离选中／悬停／键盘焦点；原样板结构仅作静态对照。Safari 目视 320 深色、280 浅色长名称、400 高对比长名称，检查点击切换、方向键、Enter 与 Escape 返回。维护者随后明确反馈“可以，非常不错，精修稿我很满意”，此独立精修模型菜单已确认为 skill 的视觉基准；其他样板及正式插件集成未随之验收，WI-025 继续待验收。本次仅记录确认并同步 skill 入口／样板标记，未修改正式插件代码。

2026-09-29 skill 文档补充：维护者明确要求将本次 Codex／Claude Code 截图讨论融入 [pi-sidebar-ui](.agents/skills/pi-sidebar-ui/SKILL.md)。新增按需加载的[组件工艺](.agents/skills/pi-sidebar-ui/components.md)，覆盖作曲区小控件、弹层、选择器、设置与历史列表，补充实际截图评审；依据记录在[UI 规则讨论](docs/discussions/2026-09-28-agent-ui-rules.zh.md)。仅更新文档，不增加产品实现范围，不改 token／配色，不改变 WI-025 待验收状态。检查：docs:verify 0 错误（保留已有 .agents/README 中英代码块数量警告 1）；skill quick_validate 与 git diff --check 通过。仅文档变更，未运行应用构建或 UI 验证，未提交。

### 2026-09-29 — 初次打开文件夹的准备交互修复

- **本次反馈／根因**：旧 WorkspaceSetup 把长资源说明卡片直接放进画布；`choice === null` 使会话未启动，附件／模型／草稿同时按会话未就绪禁用。新增正式挂载测试首次运行 3/3 红，修改后绿。
- **行为**：符合条件但尚未选择资源的文件夹显示正常欢迎画布；可编辑草稿、展开 + 和选择全局默认模型。发送或选择文件／选区时才显示简短“设置此项目”对话框；路径与完整边界说明收进折叠项。右上角关闭／Escape 不授予资源同意，保留草稿；显式 allow／decline 后沿用宿主启动，仍须再次发送或添加，不自动重放。其他受限状态、loading／error、消息契约与宿主未修改；PRD 双语同步。
- **本次验证**：最终 compile／lint／verify:webview／git diff --check 通过。最终正式准备阶段、无文件夹、候选预览 102/102 通过；完整 npm test 于对话框最终排版修整前运行 700 项，679 通过、21 失败，与前次日志失败项一致（未重跑 HEAD 对照）。Chrome 原生 UI 操作、合成宿主、360px dark：已目视正常欢迎页、打开文件夹后 + 菜单、首次资源对话框／折叠细节、草稿保留、模型选项可达；目视发现正文贴边后已补内边距并复查。预览默认模型写回尚无合成处理，选择请求以正式挂载测试为证；不将该预览冒充真实 provider／VS Code 证据。其余尺寸／主题、真实 F5／安装未复验。预览服务已停止；未提交。

#### 2026-09-28 — 入口图标缩小、无文件夹控件补修与设置

- **入口图标缩小（本次）**：依维护者参考图调整 `assets/pi-light.svg`／`assets/pi-dark.svg`，画布从紧贴图案的 560×560 改为带对称留白的 700×700，图案视觉边长为原来的 80%；标准 intrinsic 尺寸 16×16。仅编辑器标题栏打开 Pi 的命令入口使用这两个资源；欢迎页与侧栏容器共用的 `pi.svg` 保持原样。已核对 SVG 几何／两主题一致性、资源引用、git diff --check 与 docs:verify；本次未作真实宿主目视，不声称与参考产品像素一致。

- **本次无文件夹反馈与修复**：正式挂载新测试复现 + 不展开、模型无选项（2 红→2 绿）。根因与此前启动等待不同：附件入口要求附件状态／会话准入；ModelPicker 要求 runtime ready。现在 + 可展开，选择文件／选区显示打开文件夹恢复对话框，取消保留草稿；无文件夹模型入口展示已有 providerConfig 目录并发送既有 setDefaultModel，不伪造 runtime ready，不发送 setChatModel。加载／空目录／错误提供设置入口；其他受限工作区守卫保留。无宿主／协议／runtime 修改。PRD 双语已记录本次明确授权的可见行为。
- **本次检查**：compile、lint、verify:webview、git diff --check 通过；正式挂载新增 4 项与候选／供应商／工作区相关测试共 98/98。全量 npm test 在新增前两项时运行：691 项，670 通过、21 失败（进程／会话夹具、路径／脚本检查；与此前交接记录失败范围一致，未在本次重跑 HEAD 对照）。docs:verify 0 错误；已有 .agents/README 中英 code-fence-count 警告 1。未作本次浏览器布局／F5／安装包验证，保留待验；未提交。

- **维护者反馈（F5）**：UI 应为灰白色而非橙色；设置对话框未改且难看；作曲区「+」与模型选择器点不了。
- **不可点根因**：WI-024 未提交改动让 runtime 启动后先 `await` 模型加载与供应商刷新（进程内 SDK `getAvailable()`，可能很慢或不返回）再发布最终状态；期间会话阶段停在 `switching`，前端据此禁用附件与模型，默认模型补设也因“忙”跳过而显示“未配置模型”。`getWorkspaceState` 还会在回复前等待同步并可能重启 runtime。**修复**：就绪状态先发布，模型／供应商同步移到后台 `loadStartupModels`（带 reconcile token 守卫）；`getWorkspaceState` 立即回复、不再同步或重启；显式供应商操作重启后的默认模型由启动同步统一处理。新回归测试「刷新永不返回也不挂住会话切换与作曲区」在旧写法下红、修复后绿。
- **灰白单色**：`--ui-brand` = `--ui-fg`；`--ui-accent*` = 宿主 secondary 按钮；作曲区焦点 = `--ui-muted`（高对比 `--ui-focus`）；thinking 滑条、选中勾、审批选中框、链接、执行配置徽章去蓝；键盘焦点环保留宿主焦点色（可访问性）。skill、tokens、PRD 双语、讨论记录已改为现行规则。
- **设置对话框**：标题栏＋细线分区；分区标题强、字段标签弱；刷新改为标题行图标按钮；供应商状态为圆点＋一行文字＋紧凑中性按钮（去嵌套框与虚线按钮）；执行配置标题行右侧显示当前配置，按钮中性。预览桥补合成的供应商／执行配置状态以便检查。
- **检查（本次实际运行）**：`compile` 0、`lint` 0；`npm test` 689 项 21 失败，与 HEAD 基线逐条一致（此前 WI-024 带来的 16 项会话失败已消失）；预览核对深／浅／高对比的空白会话、设置对话框与模型浮层。**F5 未做**：请维护者 Reload Extension Host 后确认作曲区可用、配色与设置。

### 2026-09-28 — WI-025 Build 完成，待维护者 F5

- **改动**：`theme.css`／`preview.css` 新 token；`candidate.tsx` 空白会话只留 π＋问候、权限入口移入工具栏、Stop 改 SVG 方块；中英字符串删副标题；`candidate.css`、`candidate-review.css`、`controls.css`、`activity.css`、`composer.css`（芯片段）、`model-picker.css`、`change-review.css`、`saved-history.css`、`extension-interactions.css` 数值收进 token。顺手修两处 ID 选择器盖过候选覆盖的旧问题：改动审阅不再框中框，展开内容与标题对齐；无模型提示与触发器文字对齐；权限浮层在作曲区上方打开，不再压草稿。
- **Critique**：一块表面、作曲区唯一成形物 ✓；π 珊瑚小号、问候一行 ✓；会话栏左标题右细线图标 ✓；新 CSS 扫描无 3／5／6／7／10／11px、圆角只 6／8、hex 只有两个 brand ✓；brand 只在 π／焦点／发送／Stop／进行中圆点 ✓；280px 无横滚、工具栏不重叠（模型名截断） ✓；三主题同布局，高对比焦点退回 `--ui-focus` ✓；焦点可见，动效沿用既有 reduced-motion 规则 ✓；摘掉一件：π 右腿旁的光标读成“多一条腿”，已删 ✓。
- **检查（本次实际运行）**：`compile` 0、`lint` 0、`verify:webview` PASS；新 `sidebar-craft.spec.ts` 4／4 通过。`npm test` 687 项 37 失败，全部落在对照组内：HEAD 基线本身 21 项失败（esbuild supervisor 夹具 SyntaxError、`/private/tmp` 路径）；HEAD＋仅 WI-024 未提交宿主文件（`piChatViewProvider.ts`、`modelSettings.ts` 及测试）为 38 项，多出约 16 项会话交接／历史失败来自 **WI-024 模型同步修复**；WI-025 新增 0。
- **预览证据**：280／320／400 × 三主题空白会话几何无重叠；320 审批、runtime 错误、无模型、历史列表、附件菜单、改动审阅；280×480 八条待审批时审批按钮与 Stop 均在视口内；设置对话框按计算样式核对（6px 圆角、16px 内边距、轻阴影）。
- **保留／未验**：thinking 滑条与仅 baseline 夹具用的旧 CSS 未动（见方案核对）；无文件夹提示主按钮沿用 VS Code 按钮主题色。**F5 未做**：待维护者在真实 VS Code 深／浅／高对比下目视，不写成已接受。
- **隔离**：`candidate.css` 同时含 WI-024 未提交 hunk 与本 WI 改动，提交时需按 hunk 分开；未提交、未推送。
- WI-024 暂停移入停车场，提案与旧交接归档至 [WI-024 暂停提案](docs/archive/2026-09-28-wi-024-paused-proposal.zh.md)；其 F5 与 WI-023 F5 仍待办。

## 停车场

额外扩展生态、编辑区panel／Chat Participant、remote／multi-root支持、额外平台、无产品依据的delta优化、全局启动默认持久化、跳过审批、图片／PDF／表格／语法高亮、历史回滚、框架更换及发布不属于本次批准队列；不得据此自动新建或实施WI。OAuth 订阅登录与自定义 OpenAI-compatible 端点属 WI-024 后续候选，不自动开工。对照 Claude Code 的侧栏质感见[讨论](docs/discussions/2026-09-28-claude-code-ui-comparison.zh.md)。侧栏视觉规则已收入 skill [pi-sidebar-ui](.agents/skills/pi-sidebar-ui/SKILL.md)，现由 WI-025 实施；依据见[讨论](docs/discussions/2026-09-28-agent-ui-rules.zh.md)。

**WI-024（暂停，未关闭）**：扩展内 API Key＋默认模型已实现并提交，混合布局／模型同步修复已于 2026-09-29 分组提交（`bed0e8d`／`2149560`）；批准边界与交付见[暂停提案](docs/archive/2026-09-28-wi-024-paused-proposal.zh.md)。待办：维护者 F5 确认设置分区（渐进展开）、Add key、模型选择器恢复；WI-023 F5（设置布局／模型选择器可见）另行待办。恢复前不得并入 WI-025 验收。

## 已完成 WI 索引

为兼容当前 Cursor 预览，链接直接打开归档文件。表中早期 gate Open／待决描述是相应验收日期的历史，不是当前状态；当前全部六项 gate Accepted，见 ADR0001／0004。

| WI | 结果 | 完成／验收 | 历史 |
|----|------|------------|------|
| WI-001 | 扩展壳、辅助侧栏与 RPC 探针；ADR 0001 | 2026-09-19 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-002 | 版本化 ping/pong Webview 桥 | 2026-09-19 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-003 | Project trust 技术 spike；gate 仍 Open | 2026-09-19 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-004 | REQ-004 最小流式聊天；gate 仍 Open | 2026-09-21 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-005 | 文档健康第一阶段 | 2026-09-19 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-006 | 工作区与项目资源选择 UI | 2026-09-21 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-007 | 根据资源选择启动 pi RPC | 2026-09-21 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-010 | thinking／受控工具／Stop 四项 F5 已确认；限定切片关闭，ADR pending／gate Open | 2026-09-21 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-011 | 模块内测试迁移、递归 runner 与 scripts 分组；限定技术切片收尾 | 2026-09-22 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-012 | 最小 P1–P3 探针切片关闭；P3／完整兼容缺口保留，不是产品验收 | 2026-09-22 | [记录](docs/archive/2026-09-21-closed-wi-history.zh.md) |
| WI-020 | 跨模块公共入口与模块类型契约；唯一 P2 已修复，双轴零发现 | 2026-09-26 维护者技术验收；ADR／gate 不变 | [记录](docs/archive/2026-09-26-wi-020-public-entries.zh.md) |
| WI-021 | REQ-004 retry／compaction／可靠终态与必要 focus 回退修复；原生 F5／安装分别验证 | 2026-09-27 UTC 代理按本次委托完成评估；gates 不变 | [记录](docs/archive/2026-09-27-wi-021-execution-closure.zh.md) |
| WI-019 | Q16 委托评估、共享正式 chat、实机浮层／资源修复与独立 F5／安装验收 | 2026-09-27 UTC 代理按本次委托完成评估；ADR／gates 不自动关闭 | [记录](docs/archive/2026-09-27-wi-019-formal-chat.zh.md) |
| WI-015 | React／TypeScript／Vite 迁移验收；ADR 0003 Accepted | 2026-09-27 UTC 代理按本次委托完成评估；广泛 gates 保持 Open | [记录](docs/archive/2026-09-27-wi-015-react-acceptance.zh.md) |
| WI-013 | 受信扩展加载、标准交互、工具审批与自有runtime恢复；ADR0002 Accepted | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；广泛gates保持Open | [记录](docs/archive/2026-09-28-wi-013-acceptance.zh.md) |
| WI-008 | 模型选择／就绪、故障／审批／Stop、认证错误安全与必要实机修复 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；WI-009及广泛gates不自动关闭 | [记录](docs/archive/2026-09-28-wi-008-model-acceptance.zh.md) |
| WI-009 | thinking能力／下一轮意图、审批／Stop／退出恢复、键盘焦点与短窗错误修复 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；完整REQ／广泛gates不自动关闭 | [记录](docs/archive/2026-09-28-wi-009-thinking-acceptance.zh.md) |
| WI-014 | 显式文件／选区混合附件、逐项确认、完整预览／历史／容量恢复与丢失提示 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；审阅／会话及广泛gates不自动关闭 | [记录](docs/archive/2026-09-28-wi-014-attachment-acceptance.zh.md) |
| WI-016 | 受控dirty保护／准确readonly历史diff、分页及丢失恢复；短窗裁切红→绿 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；WI-017与广泛gates仍独立 | [记录](docs/archive/2026-09-28-wi-016-review-acceptance.zh.md) |
| WI-017 | 当前项目／CLI-origin会话、顺序交接、原文历史与异常恢复；trusted默认重置红→绿 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估；广泛gates独立 | [记录](docs/archive/2026-09-28-wi-017-session-acceptance.zh.md) |
| WI-010 剩余边界／原Goal | 三项剩余gate、ADR0004、Living契约、实际分层验证与全局收尾 | 2026-09-28 Asia/Shanghai 代理按本次委托完成评估 | [记录](docs/archive/2026-09-28-wi-010-goal-closure.zh.md) |
| WI-022 | Windows后台终端闪现；默认CLI `--no-daemon` 规避，维护者确认关闭 | 2026-09-28 维护者确认已解决 | [记录](docs/archive/2026-09-28-wi-022-closure.zh.md) |
