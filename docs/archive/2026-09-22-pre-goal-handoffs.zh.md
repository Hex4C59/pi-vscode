# 工作区恢复所替代的 Goal 前交接

[English](2026-09-22-pre-goal-handoffs.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-22-pre-goal-handoffs.md](2026-09-22-pre-goal-handoffs.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-22
- 类型：参考
- 状态：Archived
- 创建：2026-09-22
- 权威：仅历史证据；当前范围与批准归 [ACTIVE](../../ACTIVE.md)

## 替代理由

长期 Goal 与直接工作区恢复已替代旧 Prepare-only、永久暂停、尚未测试等交接。此归档不关闭 WI-008／009／013／014／015，不接受 Draft PRD／ADR，不关闭 gate。仍有效需求及验收保留在 ACTIVE 与 PRD。

WI-015 六项由候选转为明确批准 Build；WI-014 首片先后获得实现、无秘密传输及隔离实机／安装验证授权。旧证据只覆盖当时观察，RPC 拒绝后 waiting 缺陷由后续 Goal 恢复修复；不追溯改写旧失败。WI-008／009 的维护者确认不扩大为故障矩阵；WI-010／012 仍仅原限定关闭范围。以下为历史原始中文记录，仅修复相对链接；英文原文概括其状态与限制。完整归档前 ACTIVE 另保留为忽略的 `dist/goal-evidence-20260923/pre-consolidation-ACTIVE.md.snapshot`，审阅与证据保留完成后可清理，无临时 worktree／提交。

## 原始中文交接（历史记录）

**WI-015 /to-tickets 交接（2026-09-22）：** 六项本地候选写入既有双语前端讨论，包含完整结果／验收、REQ 关联、限制及七条直接依赖；提出 preview-first expand–contract，保留旧产品至最终切换以防中途缺功能，尚待维护者确认粒度／依赖／临时共存顺序。WI-015 保持 Prepare，WI-014 Paused，ADR／gate 状态不变。本轮 concern 仅 ACTIVE 与双语讨论三文件 hunks，既有改动保留、index 开工为空；不安装、改代码、运行产品、发布、暂存或提交，无临时工作区。依赖核对通过：6 节点／7 条直接边，无未知 ID／环／冗余边，双语 ID 一致；docs:verify 通过（0 errors，保留 ACTIVE 长度和两个 Draft ADR 的 5 条提示，i18n 0 warnings／stale），diff --check 通过。未运行应用测试／compile／lint／F5／VSIX，未归档或关闭 WI。

**WI-015 /to-spec 交接（2026-09-22）：** 已将确认设计综合为本文件的限定 Draft：REQ-001–006 既有切片追溯、用户／开发者故事、组件／桥／host／构建职责、五个行为验证接缝、排除项及依赖／性能／实机缺口。双语 PRD 补 WI-015 追溯、修正 WI-014 为 Paused；既有双语讨论改为证据／测试先例／未决依据，框架理由继续归 ADR 0003。grilling 共同理解保持，不重复访谈或推定 Build。当前 concern 仅这五个既有文档的相关 hunks；其他脏改动保留、index 开工为空，不暂存／提交，无临时工作区。本轮 docs:verify 通过：structure 0 errors／5 warnings（ACTIVE 长度及两个 Draft ADR 的既有类别提示），i18n 0 errors／warnings／stale；diff --check 通过。未归档或关闭 WI，未运行 docs:health；未运行应用 compile／lint／tests、runtime／probe／F5／VSIX，无凭证读取、依赖安装或发布。

**实机 UI 验证进行中（2026-09-22 22:02 授权）：** 本机 VS Code 1.138.0（7debcd0e2acdea1c52de81bf9ee1620444407dda，x64）；缓存 `npm exec --offline --yes --package=@vscode/vsce@4.0.0 -- vsce --version` 成功，先前“vsce 不可用”已被新证据取代。独立 user-data／extensions／HOME／PI_CODING_AGENT_DIR，环境白名单不继承 provider keys，禁更新／遥测；没有 OS 级网络隔离，不声称零后台流量。通过命令行 development path 启动真实 Extension Development Host，并用其回环 CDP 与进程定向 Windows UI Automation 操作，未执行仓库原 F5 launch 配置。原生 Attach picker 成功；未保存文本完整预览且磁盘原文未变；来源变化后发送显示须重附并保留正文；移除再附得到 dirty 快照。无模型配置下提交被 RPC 拒绝，历史 `rpc-rejected / failed` 保留原快照，后续编辑再预览不变；不代表成功推理历史链路。真实 Webview 浅／深主题均观察；frame 定向 Tab→Preview、Enter 激活、Escape 关闭模型面板通过，非完整键盘矩阵。截图及测试助手在 `D:\DevCaches\pi-vscode-ui-20260922`，不进入产品包。

**本轮发现（未修复）：** RPC 拒绝后 history 为 failed，但 execution 长时间仍为 `Waiting for response…`，Stop 隐藏且 Send 可用；错误文案却要求 Stop／restart。`piChatViewProvider.ts` 的非 rpc-accepted 分支仅改 chatBusy／chatError，没有同步 execution，实机观察与源码一致，安装态亦复现。本轮仅验证，不改产品源码，不关闭 WI／gate。

**安装版实机补验（同轮）：** 离线 compile／VSCE 4.0.0 打包通过；产物 `D:\DevCaches\pi-vscode-ui-20260922\package-6e948d8a\pi-vscode-0.0.1.vsix`，SHA-256 `dd7cea59efdcb2569187b2c392c7d0d4e9776be12e45a750b0a39f06dfaec68c`，146,505,843 bytes／14,080 entries（VSCE 文件数／体积警告）。静态检查确认当前 bundles 相同、包含 pi 0.86.1、排除本地 env／已知凭证路径。已真实安装至独立 installed-extensions，CLI 列出 `pi-vscode-dev.pi-vscode@0.0.1`；普通 VS Code 窗口无 development path，Pi 激活且隔离 runtime Connected。原生 picker、dirty 完整预览且磁盘不保存、变化后发送阻止／草稿保留、移除重附均通过；失败提交历史为 `rpc-rejected / failed`，后续编辑后重读历史仍保留提交时 83-byte 原文。Tab→Preview、Enter 打开／关闭、Escape 关闭模型面板及真实 Light 2026／Dark 2026 Webview 主题传播均通过；截图为缓存目录的 installed-light-history.png／installed-dark-history.png。成功推理历史、原 F5 调试启动配置及完整键盘／生命周期矩阵仍未验证，不宣称整体验收。安装窗口另出现 `argv.json contains errors` 宿主警告，未调查或修改用户 argv 配置；不将其归因扩展。没有读取保存 key 或付费推理。

**T014-01 验证交接（2026-09-22 21:57）：** 本次新跑 compile／lint 通过，`npm test` 124/124、0 skipped；不是复用历史结果。新增仅两个 `scripts/spikes/` 窄 helper，无产品源码／依赖／package／CI 修改；`node --check` 与 production adapter bundle 构建通过。WSL nobody＋隔离 user/net namespace 中真实 pi 0.86.1、Node v24.12.0 通过启用模板正对照、三个恰好 256 KiB Unicode／control／quoting 附件原文到 provider 输入一致、冻结后原对象变更不影响已准备 frame、token 不重放及 +1 byte 零写入。实测 frame 262425／1835289／334745 bytes，均 <4 MiB。合成 provider 仅替代推理，不调用真实服务；RPC SIGTERM 后实际 close code 143，worker exit 0、临时目录清理通过。命令／证据边界见[消息契约验证节](../reference/webview-messages.zh.md#可复现无密钥运行时验证2026-09-22)。首次 docs:verify／docs:health／diff check 通过，0 errors，保留 ACTIVE 长度与两个 Draft ADR 既有警告；最终文档复查见报告。未读 `.local-env`，未用密钥／网络／付费模型／用户扩展／session 文件，未暂存提交。

**仍待实机验收：** Windows F5／安装版 VSIX UI 及 Windows 原生 runtime 未执行；本会话没有真实 VS Code UI 操作工具，不自动启动用户配置。`vsce` 不在 PATH，项目与已知 npm-global 未发现 vsce 包，`dist/` 无 VSIX；未安装工具／联网，也未伪造打包或安装通过。人工应在独立非秘密测试工作区与明确隔离配置下启动开发宿主，运行 `pi: Focus Chat`，检查 `Attach file` → dirty 标记／`Preview` 原文（磁盘不保存）→ `Remove`；附加后编辑再发送应保留草稿并要求重附；合成或另行明确授权的 provider 下发送后查 `Attachment history`，再次编辑不改变旧预览；重建视图、Stop、键盘／浅深色主题单列记录。默认 `.vscode/launch.json` 的固定 `/tmp` user-data-dir 和真实用户 pi 配置不构成本次安全隔离，不能直接当作无凭证验收；真实模型／费用须另批。已安装 VSIX 必须待安全构建产物可用后在隔离 profile 安装并重复上述步骤、单列宿主版本与结果。WI 保持 Build 未验收，gate Open，不提升 ADR／PRD。

**父会话审查修复（2026-09-22）：** 两项实跑 red→green：stdin error 先使 session=0 时旧 child 不退出；preparing 草稿被 edit/remove supersede 后 UI submitted 不退休。Adapter 改 captured child 清理、同步 detach／共享 shutdown await、迟到 startup guard，不以 activeSession 判断清理所有权；关闭 5s 升级＋5s 最终观察，无关闭则阻止 replacement 并要求手动清理／reload。VM 根据 host idle 新 revision 退休旧提交，不清较新正文／自动重放；host edit/remove preparing 回归证明零旧 dispatch、可主动下一次发送。Preview counter 到安全整数上限显式拒绝，workspace generation／runtime session／所有 prompt/RPC request IDs 增补 fail-closed guards。新增实际 observed-close、无 close fake-clock shutdown、VM 解锁与 host supersede 回归；124/124、compile／lint 已通过，最终文档／全套复查见本轮报告；不关闭 WI 或扩大实机验收。

**T014-01 Build 进行中交接（2026-09-22）：** 已先记录本轮明确批准，再实现 host 单文件 capture／revision 草稿／不可变 admission／有界历史、全桥 v2、原生文件控件／literal 分块预览／移除／历史、adapter plain/enriched 编码及 callback+drain／ACK 限时一次发送。新增 `src/extension/fileAttachment.ts`（[当前位置](../../src/extension/draft/fileAttachment.ts)）、owner-local `file-attachment.spec.ts`、`attachment-transport.spec.ts`；改既有 provider／runtimeLifecycle／validator／HTML／harness 与协议回归。初始 serializer tracer 实跑 red（缺导出）→green；后续主路径、dirty 不保存、变化恢复仍拒绝、Stop／view／workspace picker 取消、pre-open 1 MiB、dummy 敏感来源、UTF-8、128 records／8 MiB、早 ACK／drain／close、UI literal 分块／较新草稿／40 历史条目覆盖已跑。最新完整检查 112/112、0 skipped；compile／lint 通过，docs:verify／docs:health 0 errors，保留既有三项文档警告；diff check 首次发现 harness 尾空格，已修，复查见后续记录。没有真实 pi／模型／探针／网络／F5／VSIX、凭证读取或暂存提交；compile 仅生成构建产物。

**继续 Build 补强（2026-09-22）：** 已补 node:test fake timers 的 5s write／30s 总 ACK（4s flush 后剩余 26s）、callback error／write throw、Stop 绕过待 drain、一次 token 及停止后零 write；补 attachment 自身 Windows device／ADS／drive-relative、真实 junction 越界、长 metadata、关闭重开／删除／磁盘变化、pending preview busy／view replacement、document-load Stop／edit／view／resources 取消和精确逻辑载荷断言。Attachment cancellation 改对象身份避免计数溢出；draft revision 饱和后拒绝全部变更，UI sequence 与 adapter request exhaustion fail closed。历史 charge 改精确不可变 snapshot metadata（双语 reference 明列六字段；delivery/outcome 为有界 record-state overhead），不再最坏状态保守预留。上一段 112 为此前检查；最终 120/120、0 skipped；compile／lint／docs:verify／docs:health／diff check 全通过，文档保留同三项结构警告。父会话继续独立审查，不声称穷尽每个 await 的组合；打开历史更新、UI 取消恢复与全部生命周期仍须审查。实机 Windows VS Code F5、安装 VSIX、真实 pi literal framing 均按授权限制 Not run。WI 保持 Build，未关闭，不提升 gate／ADR／PRD。开工所有无关脏文件保持用户所有，本轮文档仅批准／状态 hunks。

**T014-01 契约交接（2026-09-22）：** 按本轮明确文档授权，仅更新 ACTIVE、双语消息 reference／PRD／既有兼容性调查，共七个既有文档；形成可一次批准的首片范围及实现／验收契约，不再拆票。只读核对 host／adapter／UI／harness／validator／VM tests、当前 0.86.1 公开 RPC docs／types；RPC 无 `expandPromptTemplates`，采用非 slash 前缀＋JSON context。所有预算是待批准建议，解析 frame 上界非运行证据。开工全部脏修改按用户所有保留，当前 concern 仅上述文档新增／修订 hunks；index 开工／检查时为空，不暂存／提交。`npm run docs:verify`／`npm run docs:health`／`git diff --check` 已通过：0 errors、i18n 0 warnings／stale、health 0 review notices；保留 ACTIVE 长度和既有两项 Draft ADR 结构警告、`.gitignore` CRLF 提示。未读 `.local-env`／凭证，未运行源码 tests／compile／lint、runtime／probe／model／network／F5／VSIX，不改源码／依赖／CI／相邻仓库。Build 尚待父会话一次批准；实机／真实 runtime 证据待另批，不提升 gate／ADR／整体 PRD。

**本轮 /to-tickets 交接（2026-09-22）：** 仅在既有双语兼容性调查新增五个 WI-014 垂直候选及无环直接依赖、前置契约缺口、逐片可观察验收／安装版证据与 REQ-003 覆盖，当前区留紧凑指针。未提升 Prepare／PRD／ADR／gate，未恢复 WI-013；维护者随后确认五项颗粒度／串行依赖；后续 Build 仍待单独批准。开工既有修改均视为用户所有保留，当前 concern 仅此文件新增指针／交接和双语调查候选节，不暂存／提交；index 开工为空。本轮 `npm run docs:verify` 通过（0 errors，i18n 0 warnings／stale notices）；保留 ACTIVE 215 行长度及既有两项 Draft ADR 结构警告。`git diff --check` 通过，保留既有 `.gitignore` CRLF 提示，index 仍空；未归档，未另跑 docs:health。不运行产品测试／编译／lint／F5／VSIX、runtime／探针／模型，不读凭证，不改源码／依赖／CI／其他脏文档。

### 本轮 /to-spec 交接（2026-09-22）

已按维护者请求暂停 WI-013（不关闭），将完整目标／批准／方案／架构缺口／验收／范围外移入既有双语兼容性调查，保留 Draft ADR 和 Planned 契约；ACTIVE 改为唯一 WI-014 Prepare 文件／选区切片。只读核对 host／adapter／UI／tests 与已安装 pi 0.86.1 公开 prompt 文档，区分实现／有限 F5／缺失及正文、审批、投影、JSONL 各自预算；新增测试只是建议。开工全部既有修改按用户所有保留，本轮 concern 仅 ACTIVE 与相关双语文档 hunks，未暂存／提交；开工 index 为空。本轮 `npm run docs:verify`／`npm run docs:health`／`git diff --check` 通过：0 errors／stale notices／review notices；首次检查发现提案标题及新增交接层级不符，已修正复查。保留 ACTIVE 211 行长度警告（开工 223；未扩大无关历史清理）与既有两个 Draft ADR 非 Accepted 表／状态警告；0002 已在 Draft 索引，不为消警接受 ADR。Git 保留既有 `.gitignore` CRLF 提示，index 仍空。不读凭证、不运行探针／模型／产品 tests／compile／lint／F5／VSIX，不改代码／依赖／CI 或相邻仓库。

**同日此前产品讨论与文档审阅（历史记录）**

以下“当前 WI-013”均为原时点记录，现由上方 WI-014／WI-013 Paused 取代；检查结果保留历史含义，不是本轮重跑。未借此任务进行无关批量历史清理。

**本轮目标澄清交接：** 已将维护者明确目标记录为双语 PRD 的既有／AI 编写 pi 扩展加载方向，修订 ADR 0002、调查、架构及 Planned 契约的整体阻塞表述；不改核心，先评估当前发行版限定路径，上游增强可选。WI-013 唯一 Prepare、PRD／ADR Draft、三个 gate Open；下一候选是加载＋单个 confirm 的有限提案，未获 Build 批准。开工全部已有修改按用户所有保留，暂存区为空；本轮只改文档，不读取凭证、不运行产品／探针／模型／网络、不改相邻仓库、不提交。本轮 `npm run docs:verify`／`npm run docs:health`／`git diff --check` 通过：0 errors／stale notices／review notices；保留 ACTIVE 223 行长度警告、两个因 Draft ADR 未列 Accepted 表／状态非 Accepted 的结构警告，以及既有 `.gitignore` CRLF 提示。0002 已在 Draft 索引，不为消警接受 ADR。未运行应用测试／compile／lint／F5／VSIX，文档检查不等于产品验收。

**此前路线文档交付交接：** 已形成双语 Planned 本地契约、既有调查内本地未发布上游最小提案、ADR 0002 Draft 与双语索引。路线批准不等于字段／预算或 Build 接受，三个 gate Open、WI-010 pending ADR 保留。开工脏修改均按用户所有保留；当前任务仅文档 hunks，不暂存／提交，暂存区开工为空。本轮 `npm run docs:verify`／`npm run docs:health`／`git diff --check` 通过，0 errors／stale notices／review notices；保留 ACTIVE 长度警告及检查器仅识别 Accepted 表导致的两个 Draft ADR 警告（0002 已在 Draft 索引中，不为消警而接受 ADR），另有既有 `.gitignore` CRLF 提示。无源码／脚本／依赖变更，无运行时／探针／模型／F5／VSIX，无凭证读取、相邻仓库修改或发布。

**此前 WI-013 接口提案交接（路线选择前）：** 仅更新既有双语兼容性调查与本文件，完整方案集中在调查顶部；历史执行／确认选择保留，并标明此前过强需求解释已被纠正。`npm run docs:verify`、`npm run docs:health`、`git diff --check` 均通过，0 errors／stale notices／review notices；保留 ACTIVE 超过 180 行指导的既有类别警告和 `.gitignore` CRLF 提示。新增链接的目标与章节已核对；未运行代码测试／compile／lint／F5／VSIX、探针／运行时／模型，未读凭证、修改相邻仓库、发布或提交。暂存区为空，开工既有改动按用户所有保留；仅文档检查不算产品验收，路线／范围批准与远端能力、恢复及真实扩展证据仍待完成。

**WI-012 限定收尾与 WI-013 Prepare（2026-09-22）**

按维护者明确请求，仅关闭最小探针切片；批准提案、14:59／补充授权、执行与证据限制归入既有[双语归档](../archive/2026-09-21-closed-wi-history.zh.md)。P1／P2 通过限定合成边界，P3 不证明扩展代码停止；103／9 tests、16:20 WSL 运行与五脚本语法均为历史，未重跑。完整 CF 矩阵继续留在活跃调查。原 14:50 WI-011 收尾／WI-012 Prepare 与本地规格交接已被本次转换替代，历史授权／限制见归档与调查。

WI-013 为唯一当前 Prepare：标准交互、操作级不支持与未确认停止的宿主失败状态／手动恢复提案。只读核对 adapter／host／DTO 和相关 tests，可靠操作分离、独立完成信号及恢复路径仍阻塞 Build。仅修改文档，不读凭证、运行探针／模型、修改产品或提交；已有修改视为用户所有并保留，暂存区开工为空。本次 `npm run docs:verify`／`npm run docs:health` 与 `git diff --check` 通过：0 errors／stale notices／review notices；保留 ACTIVE 197 行超过 180 行指导的警告（原 210 行，仅压缩本切片失效交接，不扩大清理）。Git 另提示既有 `.gitignore` CRLF 将转 LF，未修改该文件。未运行应用 tests／compile／lint／F5／VSIX；暂存区仍为空。

**Skills 仓库适配（2026-09-22）**

维护者批准先适配通用技能。保留现有 docs 结构，domain-modeling 使用根目录双语 CONTEXT 词汇表及现有 docs/decisions；路由技能不假定存在 Skill 工具，grilling 优先使用结构化选择窗口。规格／票据／实施技能对齐 PRD 单一需求来源、ACTIVE 当前 WI 与批准、WIP=1、显式发布及 Git 授权，不再默认发布 ready-for-agent 或自动提交。未选择外部 tracker，未发布 Issue、运行探针、改变产品 Build 或创建提交；新词汇表不提升产品状态。文档检查通过，技能实际宿主发现／自动调用仍未验证。`git check-ignore` 确认适配的 `.agents/skills` 文件被当前忽略规则排除，修改仅在本地，未调整 `.gitignore` 或强制暂存；需纳入版本管理时另行明确。

**产品方向重新审视（讨论进行中）**

第十三轮选择已同步双语 PRD REQ-007／008 与夹具草案：审阅快照仅保证活跃运行会话内保留，后续文件变化保留历史差异并提示；超长历史向前分批加载；历史附件限公开 API 保留原文，不以当前文件替代，不新增持久化保证。具体展示预算与 API 能力待验证，未运行新增夹具。

- **权威与范围：** 已确认行为归入双语 [PRD](../product-requirements.zh.md) REQ-003／REQ-006–009；研究依据与具体夹具草案归入双语[兼容性调查](../discussions/2026-09-22-pi-compatibility.zh.md)。目标是 Windows 本地 VS Code 上维护者自用的已安装 VSIX；Cursor 尽力兼容、证据单列。保留单本地文件夹与已有 pi 凭证，不扩大远程／多根或全生态兼容。
- **仍有效决定：** 扩展加载与工具审批独立；默认受控，显式信任加载仍保留受覆盖调用审批，跳过审批延期而非永久取消。配置仅空闲切换，忙碌先 Stop 并等稳定；失败未就绪、保留对话／草稿、不重放／静默回退。终端会话顺序交接、退出确认不等于独占锁；标准交互取消不等于 Stop，Stop 后迟到答案失效；缺失扩展历史安全通用展示、不自动加载。附件预算／变化确认、脏编辑器保护及诚实差异归因以 PRD 为准，不重新开放已解决问题。
- **本次文档跟进：** CF-01–CF-08 草案覆盖五类兼容、UTF-8 附件边界／变更、脏写入／差异及生命周期；各项含输入、操作、预期和失败证据，全部 **Not run**。不将既有实现测试或只读 pi 0.86.1 研究算作夹具通过／可行性证明；合成隔离、公开会话 API、无真实密钥／网络／模型／意外用户扩展执行的边界见调查。真实扩展选择由后续证据收集提出，维护者现在无需指定，但自用安装版验收仍必须含至少一个真实扩展。
- **顺序与授权（历史讨论时点）：** 当时 WI-011 尚待收尾；如今 WI-012 最小探针已关闭、WI-013 Prepare 为唯一当前项。完整矩阵仍非并行 Build、探针或模型调用授权。当前只改讨论文档与此块交接，不改代码／创建提交，不提升 PRD／ADR／gate 或既有切片验收。必需 API 缺口须带证据协商，不自动删需求／换架构。
- **真正待定：** 已确认活跃运行会话内差异保留、后续编辑保留历史差异及历史向前分批加载；具体展示预算／溢出导航及实现机制仍待证据；API 集成、拦截、资源加载、传输上限及真实扩展选择属于待收集证据，不要求维护者猜技术答案。本次文档检查由主 Agent 汇总运行，未运行应用测试／探针／模型。

**此前文档审阅交接**

维护者明确要求按 `writing-for-agents` 全面审阅并修正文档，授权范围为本项目文档维护；不新增并行产品 WI。已逐份审阅 59 个 Markdown（含双语、隐藏技能与 PR 模板），另检查两个 Issue 表单及 LICENSE；排除依赖包与生成产物。交叉核对 package／CI、消息类型、宿主与 adapter、测试收集及历史验收；未重做产品运行验证。

以下问题均为 `confirmed`，已在本次文档授权内修复；每个键由规则／路径／主题构成，可供后续复查：

| 发现键 | 原问题与依据 | 处置 |
|--------|--------------|------|
| freshness/README.md/status | 首页仍称只有占位 UI；与源码及当前 WI 验收冲突 | 分开说明已实现切片、验收与发布缺口，同步 CHANGELOG |
| freshness/docs/product-requirements.md/deferred-selection | PRD／消息契约仍写延后选择待 F5；ACTIVE 已记录 19:44 确认 | 同步主路径确认，保留边界手测及收尾缺口 |
| hierarchy/docs/guides/architecture-governance.md/checklist | 603 行混合重复索引、示例与本仓不存在的路径；凭证 UI 条目不符产品 L0 | 保留 19 维度，集中完成条件与证据，使用真实入口并遵循 L0 |
| duplication/docs/product-requirements.md/evidence | PRD／架构／契约重复测试数、包大小及收尾日志 | 原始结果留在历史，现行文档链接证据；PRD 保留需求，架构保留所有权，契约保留语义 |
| workflow/docs/guides/agent-collaboration.md/completion | 提案步骤过密，Git 隔离规则多处维护 | 明确阶段完成条件，提交分支详规集中到提交指南；同步本文件契约 |
| routing/docs/guides/agent/pi-integration.md/version | 历史无聊天结论与当前实现混排；信任探针硬性限定 0.85.1、当前 pin 0.86.1 | 区分版本与证据，明确该探针未对当前版本通过 |
| hierarchy/docs/guides/agent/testing.md/tiers | 当前收集与未启用测试层级重复穿插 | 当前规则与新增层级分支分开，保留后缀含义、收集及证据要求 |
| security/SECURITY.md/contact | 漏洞报告引用不存在的 README 私密渠道，行为准则使用 noreply | 按本次维护者答复统一为 GitHub 私密报告链接，并同步 Issue 表单 |
| routing/docs/README.md/pointers | 索引指向宽泛目录，部分日期仍为模板占位 | 改为具体文档入口，移除未知创建日期占位，记录实际翻译同步日期 |
| scope/.agents/skills/documentation-health/SKILL.md/acceptance | 工具验收分支容易被普通文档审阅误执行 | 仅工具变更走该分支；文案修复运行文档检查 |
| portability/.agents/skills/writing-for-agents/SKILL-MECHANICS.md/invocation | 将特定宿主的调用开关和引用限制写成通用事实 | 改为按宿主 schema 核对；保留既有调用策略，补齐技能描述触发范围 |

本次验证：`npm run docs:verify` 与 `npm run docs:health` 均通过，0 errors／warnings／stale notices／review notices；两项技能 `quick_validate.py` 均通过，两个 Issue 表单 YAML 解析通过。补充检查覆盖全部 59 个 Markdown 的 559 个本地链接／锚点，均有效；`git diff --check` 通过，暂存区仍为空。本次不运行应用测试／编译／lint／F5／VSIX，因为没有应用或工具实现改动。安全报告链接由维护者指定；外部服务可用性未作提交报告验证。模板来源的架构治理／判断指南现注明本地修订与未同步状态；engineering-template 和其他相邻仓库未改。保留开工时已有修改，不创建 Git commit；没有创建临时工作区。

**此前交接（WI-011 及相关文档维护，保留原验证时点）：**

- 共享内核可读性整理（2026-09-22）：按维护者批准的 `writing-for-agents` 审阅建议同步双语 `AGENTS.kernel`，明确职责与优先级、合并事实判断和开工流程、澄清只读问答例外、修正可选优化示例、改写安全／架构术语和可核对的交付条件；同步产品入口中的章节引用。保留提交授权、安全禁令、审批及基础阅读要求。本次仅修改本仓副本，engineering-template 未同步；未改变 WI／Gate 状态或生产代码。

- Agent 入口规则可读性补强（2026-09-22）：按维护者明确请求，将双语 `AGENTS` 的压缩“权威栈”改写为“文档职责与冲突优先级”，逐项说明规则／Accepted PRD／架构／ACTIVE／历史材料的职责，定义真实冲突与互补关系并给出处理步骤；把加载地图的术语标签改为实际任务描述，使用中文路线并说明一项任务可匹配多行，加入 Webview 前端工程化示例，并将双语加载地图中的文档路径、架构文档引用及索引统一为可点击的相对 Markdown 链接（不加章节锚点）；再将抽象“上游指针”改为 pi 集成参考与规则，分别说明只读源码、集成指南、当前版本事实、升级重验和既有 RPC 决策边界；将过时“任务完成”短句改为“交付前检查”，按文档／代码／真实宿主列出检查及证据报告要求，区分检查通过与 WI／Gate 验收。随后按 `writing-for-agents` 审阅获批范围清理 WI-001 过时条件、合并开工指引、替换不存在的 boundaries 引用、澄清 Draft PRD 单独获批切片并集中 pi 集成规则，保留安全禁令与审批边界。不改变原优先级、加载义务、依赖版本、安全规则、产品／架构状态或生产代码。

- Gate 参考文档可读性补强（2026-09-22）：按维护者明确请求扩展双语 `architecture-gates`，解释 Gate 与测试／spike／WI／人工验收／ADR 的关系、`Open`／`In spike`／`Accepted` 语义，并为六个 Gate 补充问题、证据和“不代表”边界；随后补充新增 gate 的准入、去重、命名、证据／排除项、ACTIVE 关联、初始状态、ADR 及替代历史规则。未改变任何 Gate 状态、ADR、当前 WI 范围或生产代码。

- 架构文档局部纠偏（2026-09-21）：同步双语 §5，区分 Webview 释放仅清理视图与 provider 释放请求停止运行时；同步 §7／§8 的 19:44 延后选择主路径 F5 确认，保留边界矩阵未完整手测、WI 待收尾及 gate Open。仅修改文档，不改变当前 WI 范围或生产行为。

- 提交隔离工作流补强：双语协作／提交规范现要求开工基线分类、临时 commit map、实现提交排除 `ACTIVE.md`、当前 WI 固定 `docs(active)`、无关维护独立提交及重叠 hunk 的非破坏恢复。新增 `npm run commit:check`，只读检查暂存清单、whitespace，并机械拒绝 `ACTIVE.md` 与实现／构建／CI 路径同批暂存；不安装 hook，也不声称识别语义。10 个隔离 git 仓库回归覆盖空暂存、docs-only、混合路径、rename／Unicode、whitespace、非根 cwd 与 git 失败。全套 `npm test` 94/94（新增 10）、compile／lint／docs:verify／docs:health／diff check 均通过；文档 0 errors／warnings／stale notices。真实暂存区为空时 `commit:check` 按设计失败且不修改 index。

- WI-011 的批准提案、测试迁移／scripts 分组交接及历史检查已随 2026-09-22 收尾移入[双语归档](../archive/2026-09-21-closed-wi-history.zh.md)。其 84/84 与后续独立维护 94/94 均为历史记录，不是当前会话重跑。

### 先前交接（2026-09-21）

**WI-010 限定切片收尾**

- 预览链接兼容修正（2026-09-21）：按维护者反馈，仅移除完成索引 8 个“记录”链接的章节锚点，保留相对路径与历史内容；绕过当前 Cursor 对带锚点相对链接的处理问题。实际预览点击待维护者复验，不改变 WI／gate 状态。

- 按维护者四项 F5 确认及“进入收尾吧”关闭 WI-010；长提案、批准、既有自动化／打包证据和旧交接并入既有双语历史，更新归档索引与完成索引；同步双语 PRD／架构／消息契约的状态与最终范围。
- 未将四项检查扩大为已安装 VSIX 或完整审批矩阵验收；WI-008／WI-009 延后设置待验收，基础 UI／空闲切换验收保留。PRD Draft、架构 Proposed／Direction、契约 Outline、gate Open、ADR pending 均不提升。
- 本次仅文档，不改源码、package、已批准计划或 Git commit。语义核对覆盖 WI-010 相关文档、状态与活动 DTO／测试；仓库 README 的旧脚手架状态另记为待后续文档同步，不在本次限定归档中扩大修改。
- 本次 `npm run docs:verify` 通过：structure／i18n 均 0 errors、0 warnings、0 stale notices；`npm run docs:health` 通过：combined errors 0、review notices 0，扫描 29 文件。首次检查提示空闲交接缺当前项字段，已补齐未指定／未授权的 Prepare 入口后复查通过；未伪造新 WI。此前 73/73、compile／lint、审批／offline／VSIX 均为已有报告，非本次重跑。

**测试约定采用与后缀补齐**

- 维护者批准双语 [testing playbook](../guides/agent/testing.zh.md)、加载地图／索引／TypeScript 指引及后缀解释；纯技术文档，不新增并行 WI，不关闭 gate。保留当前 `*.test.ts`／`*.test.mjs` 布局与 runner，不新增 Cursor rules，不迁移框架。
- 指南区分当前收集与未来模块内 tests 迁移；解释 `.spec`、`.e2e`、`.expected.e2e`、`.snapshot`、`.bench`、`.perf` 及 host/client/compat，未来端到端统一 `.e2e.ts`；明确收集排除、前置条件、首次启用／跳过证据。此前 61/61、compile／lint／docs 检查通过，后缀纯文档会话未重跑代码测试／F5。此前 ACTIVE 长度警告是历史检查结果，后续压缩重复内容已处理。
