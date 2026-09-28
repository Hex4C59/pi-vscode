# WI-014——显式上下文与附件历史验收

[English](2026-09-28-wi-014-attachment-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-28-wi-014-attachment-acceptance.md](2026-09-28-wi-014-attachment-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-28
- Type: Reference
- Status: Archived
- Created: 2026-09-28
- Authority: 历史限定委托验收；ACTIVE拥有剩余工作

## 委托验收与决定

2026年9月28日Asia/Shanghai，代理按本次委托完成评估并关闭WI-014已批准T014-01～05切片，不代表维护者亲自检查，不接受整份Draft PRD、WI-016／017、WI-010边界处置或广泛gates。

保留已有host权威draft、原生显式文本文件／选区捕获、逐项确认、公开pi投递及正式共享React上下文界面。单项256KiB UTF-8、合计1MiB、20项；活跃历史128快照及既有8MiB计费存储上限不变。这是接纳／呈现预算，不保证模型上下文足够。不新增输入类型或持久化。

根代理核对capture/revalidation、命名bridge动作、不可变接纳记录、有界预览／历史client、runtime投递及注册测试，发现一处丢失说明缺口：New／Restore清空已发送内存附件历史，但原生提示仅列未发送附件及grant／review快照。现明确列出该历史，经既有公开host意图→原生dialog边界对New／Restore取消做红→绿回归。不改变API、架构所有权或session存储访问；不是独立全仓复审。

## 验收证据

以下路径在dist/delegated-completion-20260928/；命令、失败、清理详见wi014-installed/EVIDENCE.md，原生对应证据在wi014-native/。

| 验收 | 实际证据 |
|---|---|
| 当前源码 | compile.log／lint.log／tests.log：compile、lint、661/661测试通过、零skip；disclosure-red.log→disclosure-green.log验证提示修复。确定性测试覆盖事务捕获、字节／历史预算、取消、过期上下文、受保护来源、不确定投递与晚结果，不冒称独立真实provider注入故障。 |
| 显式固定选区 | 安装660 report.json/run.log：实际编辑器选区、精确literal预览／Escape、unsaved编辑、确认旧快照不发请求、明确Send才送原文；disk不变、accepted/settled历史原文一致。 |
| 最新完整文件＋固定选区 | 两域660 mixed-report.json/run-mixed.log：真实native picker、顺序混合draft、分别确认、不因确认发送、实际provider接到原选区后接最新unsaved完整文件、disk不变。两域661视觉矩阵亦重跑同混合路径。 |
| 项数／历史／恢复 | 两域661最终capacity-report.json/run-capacity.log：20/20/20/20/20/20/8七批共128；再12条实际纯文本使首条正文离开32条live chat，旧附件仍可访问。第129条Send整体阻止、零请求、保留draft；首末页及最老精确预览可访问。New原生提示列明历史损失，Cancel保留128＋draft，确认New释放容量不重放，下一次明确附件发送成功。 |
| UTF-8／transport／完整预览 | 两域661 byte-boundary-report.json/run-byte-boundary.log：四文件各87381个“中”加x，精确262144 UTF-8字节；完整分块预览等于原文，Ctrl+End／Escape返焦点。多一字节原子拒绝；实际provider收到四份完整精确内容，共1048576附件字节、无截断。 |
| 异常／编辑恢复 | 两域661 edge-report.json/run-edge.log：native picker Cancel保draft、262145字节文件拒绝且不改已有附件、真实后续编辑版本须重新确认、来源缺失阻止Send且literal预览仍保留。Remove返Add-context焦点；明确纯文本Send仅含draft文本block，无旧附件。 |
| 短窗交互 | 两域661 visual-report.json/run-visual.log：三真实内置主题×双语、逐项Tab→Preview／Enter／Escape返焦点、保draft、无文档水平溢出、input在视口内。安装289×506，原生primary-sidebar fallback299×320，上下文局部滚动。已查看安装6原图及原生6原图联系图和单图；静态图不独自证明transport／生命周期。 |
| 安装产物 | wi013-package/pi-vscode-wi014-disclosure.vsix，14085条目及提取RPC就绪／私有gate握手；661-artifact-hashes.json核对六项实际安装产物。 |
| 清理 | 各轮关闭自有host／provider，独立End保留runtime、观察matching terminal receipt再recover；两域final-process-audit.json为空。 |

真实F5使用官方未修改Code1.105.1及隔离Debug Start/F5；安装Code1.139.1使用真实VSIX。两者均公开pi0.86.1→localhost合成provider、干净HOME/profile/workspace，无付费模型／真实凭证。660结果不改名冒充661重跑；后续唯一生产改动为提示文案，具备当前全量测试与661原生／安装恢复、视觉、transport证据。早期660与初版661容量记录独立保留。

## 失败证据与结论

保留失败探针。初始helper Escape收起编辑器选区；多余Control+w打开dirty-editor保存框；预览／移除断言早于host投影；pi纯文本内容为text-block数组而非string。修正仍断言精确内容／项数，并观察公开动作完成。外部disk改写后立即Send不能证明打开的编辑器已reload；需求是当前editor文本，故重复变更矩阵改用真实编辑器版本，不猜watcher延迟。打开editor后标题改变，resize使用当前development-page精确标题＋自有PID/root。不放宽进程目标或产品检查。

安装视觉记录为attachment-short-contact-sheet.png；原生接受依据attachment-short-six-originals.png。较早派生联系图误包含之前的派生图，不作为六样本接受记录；全部原始截图仍保留。原生fallback故意短小，部分metadata／动作需局部滚动，确认、键盘导航和输入仍可操作。

## 已替代提案与排除项

原ACTIVE提案要求显式文本文件／固定选区、混合顺序、unsaved不保存、逐项变化确认／取消／移除、完整literal预览及真实已发送历史；变化／不可用／超限整体阻止、不截断；历史超出有界chat仍可访问，满容量不驱逐，明确reset说明损失。要求F5、安装、实际provider内容、当前测试和短窗交互分别验证；本切片已满足。旧检查点待Q16正式接入已由已接受WI-019／015覆盖。

不接受图片／PDF／表格、递归目录、外部路径、自动附带无关编辑器、语法高亮、附件全历史持久化、回滚或模型上下文足够保证。共享New／Restore提示回归不关闭WI-017完整会话行为。[ACTIVE](../../ACTIVE.md)仍是WI-016／017及边界／gate工作的唯一入口。

## 保留与收尾检查

保留wi014-installed/、wi014-native/及所列包作为代理自有唯一证据及隔离复现profile；清理前保全通过／失败证据并确认无进程依赖，不按名称删除。edge测试仅删除本轮明确新建的单个合成文件以验证不可用。未修改用户状态或相邻仓库。没有暂存、Git提交、推送、合并、发布。收尾docs:verify／docs:health／diff-check记录在WI014根目录，不替代上述语义验收。
