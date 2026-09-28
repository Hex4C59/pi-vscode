# ADR 0002：受信扩展交互与自有runtime恢复

[English](0002-interaction-contract-route.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[0002-interaction-contract-route.md](0002-interaction-contract-route.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-28

- Type: ADR
- Status: Accepted
- Created: 2026-09-22
- Decision approval: 2026-09-27 UTC，维护者明确委托本次范围内的方案选择、实施与证据验收
- Verification: 2026-09-28 Asia/Shanghai，代理按本次委托完成评估；[验收范围与分层证据](../archive/2026-09-28-wi-013-acceptance.zh.md)
- Related gates: [Webview信任、会话流与项目信任](../reference/architecture-gates.zh.md)仍为Open，不能由本切片自动关闭
- Work item: WI-013 已限定关闭；不是维护者亲自操作的声明

> 2026-09-28 后续处置：下列早期「gates Open」描述保留原切片决定时点；三个广泛边界现已另由 [ADR0004](0004-trust-and-lifecycle.zh.md) 接受，不由本 ADR 自动推出。

## 背景与范围

REQ-006／009要求在未修改的发行版pi上显式加载受信扩展、呈现标准交互，并保留工具审批和诚实Stop／恢复边界。公开RPC没有通用远端消费、关闭或来源认证事实；本地generation、一次答复尝试与owned-child exit不能被夸大成那些事实。仍沿用[ADR0001](0001-build-baseline.zh.md)的subprocess RPC，不替换agent loop／provider／compaction。

[已替代候选](../archive/2026-09-28-wi-013-superseded-candidates.zh.md)保留9月22日route1＋route3及Prepare语境。上游增强不再是交付前置；以下选定方案及公开证据拥有当前意义，精确DTO只在[消息契约](../reference/webview-messages.zh.md)维护。
## 当前发行版的已接受决定

代理按维护者9月27日UTC委托选择并实施以下有界方案；恢复、DTO及工具覆盖均已在当前契约明确，最终验收与证据边界分别记录，不把方案批准等同运行通过。

1. 保持pi0.86.1公开CLI／RPC，不fork或替换agent loop。仅在空闲显式确认后加载用户选定本地扩展入口，自动发现保持禁用。代表目标为MIT的pi-system-prompt-manager0.1.1，commit9c8f546b875f929ad5d573fe30e7a7fd6e3ae924；正常四类表单支持同时实现select／confirm／input／editor。不加入自动下载、marketplace或任意TUI renderer。
2. 一个active加最多七个queued表单。单interaction JSON frame最多65,536 UTF-8字节，text／answer最多32,768字节，title最多512字节；select最多64项，每项1,024字节且受总frame限制。不截断可操作标签或答案。真实目标已观察frame为148～315字节、菜单五项，所选预算留有充分余量且最多保留八个frame。通用RPC reader仍有独立边界；不谎称partial-frame buffer已是64KiB，也不缩减附件／模型payload契约。解码、framing与独立预算须由回归证据维护。
3. 溢出新请求在可行时用公开response取消，不驱逐已准入表单；滚动十秒内五次溢出使交互准入失效并保持可见失败barrier，不自动杀进程／重启、不声称远端工作停止。普通人工答复无随意倒计时；已准入startup dialog暂停剩余15秒readiness-response预算，不暂停Stop观察。reply transport最多16个in-flight write，共享listeners，callback与drain须五秒内确认；不确定则阻塞，不重试或自动终止。peer timeout采用明确标为接收时起算的本地cutoff，不冒充远端deadline，出队／view重建不重置。Stop独立观察预算五秒，到期未决仍阻塞，不宣称已停止。
4. 每连接精确保留最多65,536个远端open ID，每个最多200 UTF-8字节；即使诊断记录被驱逐也绝不重新准入同ID。独立256条不含内容的诊断环不是交互配额。显式身份预算耗尽后停止新准入，须在settlement／exit后有意安全重建连接；不wrap或静默驱逐重放保护。这一较高但有限的异常上限优于无界内存或概率式重放拒绝，须可见并测试边界。
5. host UI ID、adapter一次性reply token及当前runtime／view generation只保证至多一次本地答复尝试，不是扩展来源认证或远端exactly-once。表单／反馈按literal呈现并在投影前受既有credential-like内容拒绝规则约束。工具授权独立，一般confirm不授予工具权限。精确DTO、文本反馈保留与custom-tool覆盖由当前消息契约定义。
6. 对精确分派且命中当前catalogue的扩展slash命令单独追踪pending handler lease。安装0.86.1公开RPC背后的源码证明matching prompt response在awaited handler settled之后，包括拒绝被捕获并独立发extension_error。它是版本固定证据，不是跨版本RPC承诺，也不证明执行成功、detached work完成或agent静止。普通prompt／template／skill仍区分准入与agent settlement；独立呈现错误，abort ACK不能释放command lease。runtime替换仍须观察owned child退出，不用自动终止把Stop不兼容操作变成兼容。
7. 新intent／projection已将Webview协议从v2迁移至v3；拒绝旧frame并让重建view同步，不再把当前v2 consumer写成v1，不混合envelope，不用兼容shim接受过期授权。

证据及限制见[目标调查与实际探针](../archive/2026-09-27-wi-013-target-research.zh.md)；精确安装版命令分派链记录于dist/delegated-completion-20260928/wi013-command-semantics.txt（公开rpc.md／extension声明，以及发行实现rpc-mode.js→agent-session.js→awaited registered handler）。宿主丢失可行性仍不等于选定生产持久化／准入方案。本节不接受应用行为、gate或WI。

## 已接受所有权丢失恢复边界

代理选择被动exact-child supervisor及持久准入fence。纯内存reload barrier无法跨越它要防护的宿主丢失；仅有marker能禁止工作，却不能积极证明丢失后的恢复条件。PID轮询／用户断言不是退出见证，断连自动kill又改变已确认的Stop兼容规则。独立Windows公开runtime探针证明观察者可独立存活，不是完整实现。

**恢复域与权衡：** 以扩展实际globalStorageUri目录作为本地恢复域，共享该目录的窗口同时只准入一个Pi runtime。这是个人Windows目标的明确保守产品限制，不是机器级mutex、终端session锁或沙箱。第二个窗口显示已占用／旧runtime未知原因且不spawn。这样避免虚构稳定window identity、换workspace逃逸或未验证的多owner恢复registry。本片不支持同storage域并发独立runtime；其他VSCode profile／安装／terminal进程在所有权边界外。受信加载前与启动失败UI须披露此限制和恢复后果。这是本次委托下的产品／架构决定，不冒称维护者亲自选择或检查。

**owner与存储：** host拥有准入及显式恢复；adapter映射公开RPC；独立打包Node supervisor直接spawn并持有精确pi child。仅在globalStorageUri/recovery-v1存固定生命周期metadata：schema版本、新run／host／supervisor／child身份、时间、disposition和观察到的exit code／signal。不存provider配置、凭证、prompt、answer、扩展源码、transcript或session文件内容。每份固定record最多4KiB；host先exclusive创建并flush fence再启动，supervisor是matching terminal receipt唯一writer。覆盖host进程单独崩溃，不宣称断电持久性、磁盘损坏、同用户恶意篡改或observer同时丢失。格式／大小／版本／run不符拒绝；fence不能持久化则不spawn。缺失／不确定证据保持阻塞，不自动过期／驱逐。安全退休后仅保留当前run及最多16条已解决且无内容的诊断；不为容量删除未决证据。

**丢失与终止：** owner丢失时撤销产品transport／答复准入，继续精确child观察，有界drain／丢弃输出，不以关闭pi stdin暗中终止。Stop超时／不兼容不自动kill。另提供明确“结束自有runtime”操作及副作用不可撤销警告，只路由到保留的owner capability，不接受任意PID／shell。该操作可SIGTERM，五秒未退出再SIGKILL，再五秒仍无exit则终止未确认。child exit与stream close分开，后代可能持有pipe；signal发送／transport丢失不是exit。receipt标明所持child实际退出，或被积极证明的初始化never-spawned。退出不证明后代终止、回滚或命令成功。

**恢复：** 不确定之后必须同时具备matching terminal receipt及有意恢复。“恢复受控执行”只退休精确旧run，创建新runtime／view／reply身份，清临时grant与交互状态，保留host仍有的draft／dialogue，不重放任务、不静默恢复受信扩展。完整host崩溃仍丢失纯内存未发送草稿；本片不添加草稿持久化。正常用户确认的空闲profile／session切换可在该既有显式操作内退休已干净观察退出的前任。单独reload、PID不存在、新ready进程或用户断言都不能退休不确定fence。supervisor在持久证据前死亡则恢复不可用，诚实提示，不提供“清空unknown”绕过。删storage／卸载不是产品恢复操作。

此有界设计及精确DTO／覆盖契约已按委托接受。验收记录区分确定性崩溃窗口／存储／receipt测试与真实pi、目标、同域第二窗口、observer丢失、显式终止／恢复、原生F5和安装版证据。本限定决定不关闭广泛gate。

主能力来源：[VS Code存储能力](https://code.visualstudio.com/api/extension-capabilities/common-capabilities)定义globalStorageUri为跨workspace可用的扩展自有存储；[Node child-process文档](https://nodejs.org/api/child_process.html)区分detached生存及exit／close。这些API不证明所选存储协议或已交付恢复行为，本地证据见目标调查。

## 选定空闲profile重启检查点

安装实测发现pi 0.86.1延迟持久化：fresh session已有identity／path，但存在assistant entry前尚未持久化。不放宽恢复身份校验，不强加合成消息，不检查session文件。更改执行profile前，adapter调用公开get_state → get_session_stats → get_state，每次最多五秒。验证精确当前identity／path、空闲／无待处理工作及稳定活动branch消息数；统计计数必须非负安全整数。stats覆盖全部entry，不与compaction后活动branch计数强行等同。从未resume、未受操作影响且两种计数均零的会话，可以新空会话替换，保留host未发送草稿。此前已验证saved resume或assistant entry计数大于零，则保持严格id／path恢复。非空未持久化或不确定状态在retire前拒绝切换，保留旧ready runtime及草稿。无需内容大小的get_messages回复，避免仅因历史体积令空闲profile切换失败。此保守拒绝优于静默丢失；不承诺跨重启保留第三方私有内存状态。这是委托下的纠正选择，新包与原生F5实际证据见验收记录。

**上游初始化限制：** pi 0.86.1公开RPC在挂接stdin JSONL reader之前await扩展绑定（安装包rpc-mode.js）。因此在session_start内部await UI答复的扩展，通常不能通过该启动次序正常服务；实际隔离无handler探针观察到child退出而非ready成功。adapter暂停人工等待计时不修复上游次序，不得这样宣称。选定真实目标只在startup发送status，必需表单由注册命令发起。保持该已核对目标范围，诚实报告readiness失败并保留所有权／恢复证据，不补丁修改pi私有启动内部或伪造答复成功。这是明确兼容限制及失败路径，不缩减选定目标必需流程。

## WI-008委托恢复修正——限定接受

2026年9月28日的实际干净profile验证发现，新建pi会话即使没有配置模型也可能有identity却未持久化；观察owned child退出后resume该未使用identity会严格校验失败。按已有委托选择狭窄host事实：新启动的**受控**、非resume且尚未接纳用户提交的会话，在有意受控恢复时可替换为新空会话。仅模型设置变化不等于已提交会话。保留草稿，不重放。受信、已恢复、已提交或其他不确定会话仍严格resume，不在resume失败后fallback；不增加session文件访问或持久化保证，不放宽terminal receipt条件。本狭窄修正已于2026年9月28日按委托评估：公开seam回归及dist/delegated-completion-20260928/wi008-readiness-native/、wi008-readiness/的原生F5／安装版干净profile证据证明未使用空会话恢复。已提交或不确定的缺文件场景仍无resume fallback；显式New conversation沿用既有丢失披露。WI-008整体验收仍由ACTIVE管理，此前接受范围仍受原归档限制。

## WI-010委托清理修正——限定接受

2026年9月28日实际原生撤销信任发现：UI显示End／Recover可用，但host在工作区无执行资格时拒绝两者。按已有委托，区分**对确切已保留运行的清理权限**与**启动工作区执行的权限**。受限／无文件夹／多根状态允许显式原生确认的End及匹配terminal receipt后的有意恢复；保留generation／view校验、独立恢复动作及全部回执规则。恢复不授予工作区信任、不选择资源、不启动无资格runtime；正常启动仍要求资格及新的资源选择。拒绝要求用户仅为终止已拥有子进程而重新信任内容；也拒绝撤销信任即自动kill，因为这违反已接受的owner-loss契约。

代理按本次委托完成该修正评估，不冒称维护者亲自检查：两个公开host seam回归在修复前失败、修复后通过；标准665／665、compile／lint通过。实际Code 1.139.1隔离安装VSIX与官方Code 1.105.1原生F5均执行active stream期间Don't Trust、禁止准入、显式End并观察子进程退出、独立Recover且不启动runtime、原生Trust、重新资源选择，以及allow／decline后covered工具仍审批。证据：dist/delegated-completion-20260928/wi010-installed/和wi010-native/的trust-report.json、run-trust-fixed.log；当前包wi013-package/pi-vscode-wi010-restricted-cleanup.vsix。早期错误自动退出预期与实际产品失败分别保留。此修正不自动接受任何广泛gate。
