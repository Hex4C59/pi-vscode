# WI-086 — 当前项目已保存会话搜索

[English](2026-10-02-wi-086-session-search.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-02-wi-086-session-search.md](2026-10-02-wi-086-session-search.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-02
- Type: Reference
- Status: Blocked
- Created: 2026-10-02
- Authority: PI-GAP-24 有界 Prepare；不宣称交付或验收
- Related: [ACTIVE](../../ACTIVE.md)、[Goal](2026-10-03-eight-gap-goal.zh.md)、[需求](../product-requirements.zh.md)

## Prepare、现状与授权

有界 Goal 批准当前项目搜索、命名筛选／排序，不做全局发现或自动恢复。WI-085 已提交、干净候选通过但保留原生阻碍，本项为唯一当前 WI。已核对 SessionBackend／worker protocol、公开 pi 0.86.1 SessionManager.list 签名、metadata／边界、host catalogue／恢复、client 分页与 CandidateSessions。worker 已用公开 SessionManager.list(cwd, undefined, progress, signal) 获取整个当前项目 catalogue，逐项核对 canonical cwd、投影有界名称／首条消息，再按 16 项 recent-first 分页。不用 listAll、不解析会话文件；保留恢复确认和 stop／inspect／start 顺序交接。

## 方案、合同与需求／架构影响

搜索整个批准 catalogue 的既有有界标题／名称与首条消息预览，不是当前页；明确 metadata 搜索，不宣称 transcript 全文。无 allMessagesText／整会话／正文索引／持久 query。字面 Unicode 规范化、不区分大小写；named-only 仅非空白名称；recent／oldest／name 排序、id 稳定决胜。先筛选排序再 16 项分页；total 为筛选计数，目录变化后超出页 clamp 至末页。query 最多 256 UTF-16 字符，固定 boolean／sort 枚举，host exact allowlist。

v3 具名 searchSavedSessions 仅传 query／named／sort，host 拥有已应用 criteria；新搜索重置 page／catalogue。既有刷新／分页／rename 刷新沿用 criteria。session state 增加可选 metadata DTO，保持旧 fixture／默认兼容。紧凑 form 显式 Search／Enter、Clear、命名 checkbox 与 sort；输入不自动请求或恢复。busy 禁用控制；无结果区别于无会话，错误可重试；新搜索失败不冒用旧行。工作区／generation 替换、取消／dispose 和恢复保持原串行 owner。

公开 progress／取消加返回数组校验，将完整枚举限制为 5000 项，保留既有 15 秒 worker 截止；超额／无法证实完成必须 catalogue-too-large／unavailable，不把截断搜索说成完整。无跨项目 list、新会话目录、正文搜索、资源同意或持久化变更。REQ-008/009 用户切片；worker 转换、host 状态准入、UI 仅展示，沿用 VS Code tokens。

## 编码前失败方式

仅筛当前页、旧 criteria 分页、总数／tie 错、越界页、命名空白、Unicode／大小写错、regex／脚本解释、超长／畸形／额外字段、超预算静默截断、取消／迟到覆盖、跨项目行泄漏、扫描错误说为空、新查询失败显示旧行、自动恢复、确认／Stop／rename 协调丢失、query 持久／日志或收集全文、Enter 误发 chat、翻译／窄／HC 裁切或焦点键盘不可用。

## 可观察验收与工件

编码前准备 worker→公开 SDK 边界组合（超过 16 项合成会话），跨页 query／named／sort／count／clamp、畸形 query／超过 5000 失败；provider→backend 搜索／分页／刷新／错误／迟到与恢复确认；mounted production 输入／应用／清空／控制／空／错误／键盘和具名 client intent。不在代码后补单元测试。compile／lint／npm test／docs:verify、提交后干净候选／打包；真实隔离 SDK worker 只读由公开 SessionManager 创建的合成会话，观察 child 关闭，留 JSON／TAP。真实浏览器英中、280／320／400、三主题／键盘仅合成 host 渲染；F5／安装 VSIX 单独要求项目搜索／筛选／排序／分页／恢复确认，隔离 Code 绑定仍受阻，不是验收。工件 dist/goal-eight/wi086/；Prepare 无实现或通过声明。


## 开发检查点

编码前准备六项 worker／host／mounted 场景。初始 host 与 mounted red 为有效缺失功能失败，worker fixture 最初参数顺序错误；修正后将已准备场景对归档的实现前 e4b3e35 重放，六项均因缺失搜索行为／schema 失败。red.log 与 red-corrected-baseline.log 分开，不把最初 worker 错误冒充功能证明。现六项通过，未在代码后补单元测试。标准检查发现旧 list 要求精确原 signal：保留旧请求原 signal，仅 search 请求组合预算取消。spike 转发器还须 windowsHide 显式放最后，已修正，未削弱策略测试。

compile／lint／1248 检查在受限环境、隔离 HOME、空 auth、独立 PI agent／tmp 下通过，无继承 tokens／proxy／options（compile-isolated.log、lint-isolated.log、tests-isolated.log、check-isolated-exit.txt）。更早标准运行继承 shell 环境，不作为隔离用户状态证据；后续干净候选也使用受限环境。worker／backend 为组合而非原生证据。node scripts/spikes/spike-session-search.mjs 使用公开 SessionManager 创建、生产 worker／backend：当前项目 40 合成会话及另一项目 sentinel，20 命名项、跨页匹配、排序／计数／页 clamp、无结果、>5000 明确拒绝。七个 owned workers 均观察关闭，无推理或真实账户。JSON／TAP 在 dist/goal-eight/wi086/。

真实浏览器英中、280／320／400、浅／深／HC 截图已覆盖；长暂存 query／命名／排序表单无横向溢出，中性 checkbox 与未应用提示明确旧结果／分页仍用已应用条件。PreviewBridge 尚未实现新搜索操作，截图仅证明控件渲染／暂存／焦点，不证明应用后结果；production mounted client／host／worker 证据分开。原生 F5／安装搜索、分页／恢复同意仍受隔离 Code 绑定阻碍，不豁免验收。实现未提交，下一步 scoped 审查／本地提交／干净候选。


## 提交候选与交接

实现 4bb653cfc6e01676183a5183de76aec10907ae1a；完整 scoped staged diff／commit:check 已审查，用户 gap 讨论／ACTIVE 分组保留。末次审查把 5000 上限限定为搜索，旧非搜索 list／inspect 语义不变。两次开发完整复查在未修改 frozen-history 的最后消息断言失败；聚焦、66ba52b 完整基线及随后当前完整运行通过。失败／聚焦／基线日志保留；间歇根因未确定，不放宽断言。

/tmp/pi-resource-candidate-vQqd8G 干净源码候选：curated env／隔离 HOME／空 auth／agent／tmp 下 compile／lint／1248／docs:verify（旧 ADR 两警告）／docs:health／实际 SDK／package:vsix 通过。前后 status 空，源码 SHA／命令／版本／日志在 dist/goal-eight/wi086/candidate-evidence/verified-candidate 与 candidate-identity.json。7 个 worker 实际关闭、零推理；打包不等于安装。候选英中 280px HC／键盘焦点证实暂存控件无溢出；旧 18 图开发矩阵分开，不是提交后矩阵。preview 不处理搜索操作。

本次授权下的代理验收：组合／公开 SDK 与有界候选检查支持该切片；native F5／安装搜索／筛排页／恢复确认／视觉仍未验证。不是维护者亲测，不关闭 WI。PI-GAP-24 保留阻塞待安全隔离 native app 绑定解锁；WIP=1 继续独立 Mermaid 调查。
