# WI-019 — Q16 与正式聊天界面收尾

[English](2026-09-27-wi-019-formal-chat.md) | 中文

- 翻译状态：Technically Verified
- 权威原文：[2026-09-27-wi-019-formal-chat.md](2026-09-27-wi-019-formal-chat.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-27

- Type: Reference
- Status: Archived
- Created: 2026-09-27
- Authority: 限定评估证据；实施与关闭由 [ACTIVE](../../ACTIVE.md) 管理

## 最终限定验收与归档

2026-09-27 UTC，代理按本次委托完成评估并关闭 WI-019：Q1–Q16／UIP-01～07 正式展示已经接入真实 bridge，不是维护者亲自操作的验收。保留以下早期评估与失败检查点以追溯，不将其中“尚未关闭”当作当前状态。当前工作由 [ACTIVE](../../ACTIVE.md) 管理；WI-015／ADR 0003 与其他 WI／gates 仍须分别核对，不随此关闭。

最终源码 compile／lint 通过，production-tests-final.log 为 456/456，无跳过；生产依赖图排除 preview／tests，webview 目录和新包的 JS／CSS／SVG 校验与 SHA-256 绑定通过，host-chat-installed/current-install-hashes.json 的 9 项实际安装产物匹配当前编译树。Standards 原类型契约 P2 解除，浮层与打包追加复核零发现，Spec 零发现。

真实宿主证据分开记录：host-chat/ 主矩阵；host-chat-lifecycle/f5-report.json 的任务／失联／显式重载断言；f5-visual-report.json 与 f5-short-report.json 的三主题×双语／键盘／保留草稿；f5-continuity-report.json 的真实编辑器选择→源变化→旧快照逐项确认→独立发送→历史，以及 New Cancel／New 清理／公开 SDK Restore／原文预览。continuity-custom-dialog.log、visual-native-theme.log、visual-short-filtered.log 完整通过。

安装版 host-chat-installed/installed-compaction-report.json 独立跑主矩阵；pi-vscode-wi019-relative-assets.vsix 重新安装后的 installed-visual-report.json、installed-short-report.json、installed-continuity-report.json 分别验证修正资源、主题／语言／焦点／键盘与真实附件／会话连续性。visual-relative-assets.log、visual-short-hidden-title.log、continuity.log 完整通过。截图已实际查看：实机窄栏审阅／权限、明暗与高对比、中文、Pi 标记恢复、短窗权限几何，以及附件历史和恢复历史原文。截图不是 RPC／持久化证明；对应断言和实际公开 API 流程才支撑行为结论。

短窗由核对自有 Code PID／命令行后调整其唯一匹配窗口至 1100×620，未移动用户窗口。F5 使用真实原生调试启动；安装版独立 profile，不互相替代。早期主题探针、CDP resize 不支持、隐藏安装窗口／虚拟列表定位失败均保留，最终改用精确自带主题选项、受支持隔离设置及核对窗口后原生 resize；未安装主题、未接受第三方发布者提示。

本轮资源保留于 dist/delegated-completion-20260928/；新增 host-chat、host-chat-lifecycle、host-chat-installed、permissions-layout、formal-* helper 与包由代理所有，用于复核与后续已授权验证。服务已退出；保留 profile、失败／成功日志与截图，不删除唯一证据。无进程依赖且后续 WI 不再需要、复核材料已保留后才清理。固定官方 F5 宿主的外部路径和清理条件沿 WI-021 归档。未暂存、未提交、未推送。归档后的 docs 检查在 ACTIVE 记录。

### 原批准提案（历史）

**正在做（WIP=1）**

| 字段 | 内容 |
|------|------|
| **ID** | WI-019 |
| **标题** | 完整候选 Q16 委托评估与正式侧栏接入 |
| **阶段** | Build；UIP-01～07 已有技术实现，本轮 Q16 已由代理按委托评估通过；正式接入已实现；新 F5／安装主矩阵已有，正在修复实机发现的浮层与资源地址并复验；不并行实施 WI-013 |
| **PRD 判定** | 用户可见；沿 Q1–Q16 及 REQ-001～008 既有批准体验，无新增聊天／权限／会话语义 |
| **授权** | 本次维护者明确委托代理实际执行视觉／交互／功能评估、修复、条件满足后正式接入及新 F5／安装验证；不冒称维护者亲自确认 |
| **Gate ID** | gate-webview-trust、gate-session-streaming；保持 Open 直至各自完整 ADR 条件满足 |
| **Decision** | none：沿用 React／client／host 权威；ADR 0003 在真实体验与验证齐备后单独评估接受 |

**目标与范围**

先在实际浏览器逐项评估完整候选：新建／会话／执行／审批／附件变化／错误，280／320／360／400／600px、短视口、三主题、英中语言、键盘焦点与滚动、菜单遮挡、权限／审阅／输入组合。代理按本次委托已记录 [Q16 通过与正式化选择](2026-09-27-wi-019-formal-chat.zh.md)；不以截图证明异步、权限、持久化。发现缺陷沿现有公开 Seam 红→绿修复，不重复实现已有功能。通过后将候选展示正式接入真实 bridge，隔离合成 preview、fixture 和开发 toolbar；保持单一 host/client 业务权威，再构建并分别进行原生 F5／安装版验证。

**方案与架构核对**

选择最小正式化路径：优先复用已实现候选展示，移出生产所需纯展示／语言状态，生产 entry 不依赖合成 bridge 或 scenarios。语言仍沿已确认界面设置语义，不暗增宿主全局偏好持久化。精确拆分以源码依赖核对为准；重大边界变化先记 ADR，不借委托越过工程规则。

**验收**

验收要求：Q16 的完整状态和窄栏／短视口／主题／语言已截图且实际查看；发送／Stop／模型／thinking／附件逐项确认／会话 New Restore／审批撤销／readonly diff／失联恢复有实际操作与状态断言；正式 bundle 不含 preview runtime。compile／lint／标准测试／verify:webview、当前合成真实 pi、原生 F5 和新安装包分别取证。双轴复审、双语权威文档、docs:verify／docs:health／diff 检查及资源关闭齐备后才收尾，不把技术测试自动当 Q16。

**范围外与批准边界**

WI-021 已按本次委托关闭，限定范围见[归档](2026-09-27-wi-021-execution-closure.zh.md)，不重开 WI-020，不复用 WI-018。WI-013 trusted loading／一般交互选择与实现随后串行；不新增图片／PDF／表格／语法高亮／回滚、panel、框架更换、发布或付费模型。本轮无 Git 提交／推送。既有归档压缩与全部证据保留；当前失败／成功记录集中在 dist/delegated-completion-20260928/，不另建任务账本。


## 决定

代理按本次委托完成 Q16 评估，接受候选设计进入正式接入。不冒称维护者亲验，不代表生产宿主验收、WI 或 gate 关闭。保留已确认 Q1–Q15 及 UIP-02／图标／无文件夹限定决定。

## 实际证据与修复

证据在 dist/delegated-completion-20260928/（机器本地运行目录；9 月 27 日 UTC 已跨到 Asia/Shanghai 的 9 月 28 日）。q16-browser/ 验证流式／目录／审批／审阅／Stop 组合及 9 个尺寸主题语言样本；q16-attachments/ 验证键盘／Escape／焦点、最新文件与旧选区确认、取消／失败／容量／不确定投递、原文分页历史、会话确认及 Reset／晚回复。两者 page errors 与外部请求均零。

q16-visual/ 验证 180 个产品画布状态：新建、对话、执行、审批、源变化与 runtime 错误；280～600px 五宽度、三主题、英中、500px 高。另在 280×360 实际 Enter 发送、模型选择、键盘 End 选当前模型支持的最高 thinking、Escape／焦点返回、Stop 与附件菜单；模型／thinking 在稳定结束前保持下一轮，新草稿保留。已查看新建／对话／流式／审批／源变化五宽度拼图、中文高对比审批、审阅审批组合、修正后的浅色中文错误态及稳定后的 thinking／菜单截图。长内容局部滚动，Stop／审批决策／输入可达；菜单遮挡属于有意弹层，不隐藏不可逆决策控制。

接受前发现并修复两项：runtime 丢失时隐藏旧对话且草稿无法选择；默认跟随到底又隐藏恢复错误。公共挂载回归证明对话保留、草稿只读且可聚焦／选择、禁止发送，错误首次出现滚到顶部而不覆盖后续用户阅读。红绿日志保留，修复后标准测试 452 项通过。初始截图在动画中抓取及夹具误期望 xhigh 已通过等待稳定绘制、核对当前支持最大值修正，未为探针改变产品。

## 正式接入选择与排除

纯聊天展示／语言移至生产所有目录，以小挂载接口供生产和 preview 共用；仅 preview 拥有合成 bridge／scenarios／toolbar 及模拟警示。分页值复用当前 host/client 常量，不取 fixture 常量；真实版本化 bridge 与 host 策略不变。语言仍为挂载页面内状态，不新增秘密存储或全局偏好持久化。旧组合仅可作为明确命名的测试夹具保留共享控件契约回归，不是第二生产 root 或当前 UI 验收。

WI-019／ADR 0003 收尾前仍须实际生产 Webview、原生 F5、新安装 VSIX、生命周期、打包及独立复审。安全 Markdown、审批／附件原文、源码导航和原生 captured diff 沿既有批准语义，不因本决定新增 provider／session engine 或任意宿主命令。

## 正式接入验证检查点（尚未关闭）

正式 mount 已经使用共享 chat，预览／测试依赖图隔离检查通过；旧 App 明确移到 tests 夹具。Standards 发现缺少 chat/types.ts，已补有实际消费者的语言与挂载契约；Spec 零发现。补新资源检查后全套 455 项通过，compile、lint、docs:verify 与 docs:health 通过（4 个已有 Draft ADR 提示）；后续资源修复仍须重跑最终检查。

本轮 host-chat/ 与 host-chat-installed/ 分别运行真实原生 F5 与新正式 VSIX 主矩阵：完成／Stop／retry／错误、下一轮模型、真实批准 write、captured diff、grant 撤销、compaction／Stop。host-chat-lifecycle/ 的 f5-report.json 逐项记录 retry Stop、核对自有 RPC 后终止、只读保留新草稿及显式 Reload 后恢复；追加视觉脚本失败不抹除这些断言，也不冒称整段脚本通过。

真实宿主截图发现两处预览未暴露的问题：权限浮层按 viewport 而非 composer 限宽，遇宿主 body 留白左侧裁切；Pi 标记 CSS 输出 /webview-pi.svg 绝对地址，宿主无法加载。分别以 permissions-layout/ 的真实 Chrome 几何红→绿和打包 CSS URL 红→绿修复；浮层绑定 composer，Vite base 改为相对路径，新 SVG 纳入必需资源与哈希。重新构建的 pi-vscode-wi019-relative-assets.vsix 正在独立安装／原生 F5 复验，未据旧包通过关闭。

主题探针先前错误选择命令／标签进入主题 Marketplace 查询，未安装额外扩展、未接受发布者提示；该失败保留。不继续猜测标签，改为读取宿主自带 theme-defaults 的公开 ID，在仅自有 profile／workspace 写受支持的 workbench.colorTheme，再断言真实 Webview theme class 并截图。此前安装版三主题×双语、Escape 焦点、保留草稿、权限几何、键盘 thinking／Enter 已通过，但原生 F5 的设置 owner 差异及标记修复要求继续新验证。
