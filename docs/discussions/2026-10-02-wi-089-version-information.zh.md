# WI-089 — PI-GAP-27 实际安装版本信息

[English](2026-10-02-wi-089-version-information.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-02-wi-089-version-information.md](2026-10-02-wi-089-version-information.md)
- 原文版本：5f2135f + current Prepare
- 最近同步：2026-10-02
- Type: Discussion
- Status: Active
- Created: 2026-10-02
- Authority: 有界 Prepare／Build 与证据，非验收
- Related: [ACTIVE](../../ACTIVE.md)、[八项Goal](2026-10-03-eight-gap-goal.zh.md)、[PRD](../product-requirements.zh.md)

## 范围与现状事实

本轮请求批准实际插件／内置pi版本与对应本地说明；缺失明确，不承诺最新，不隐式联网／更新／安装／依赖升级。WI-088公开installedVersions已提供有界实际manifest name／version；native TextDocumentContentProvider／showTextDocument匹配资源报告模式。尚无版本报告。源码插件0.0.1，既有packager映射后的archive插件0.86.1，pi0.86.1；不改打包版本以迎合notes，不把源码说成安装版本。根CHANGELOG含0.0.1与Unreleased、1581bytes；上游本地CHANGELOG569032bytes，开头精确0.86.1。根文件尚未被package files选择，仅新增该固定本地doc，不下载／市场扩张。只读取安装manifest及两份固定notes，上游只读。

## Prepare 设计与边界

宿主version-information模块复用公开installedVersions，固定路径、lazy native command。区分实际插件／pi／VS Code版本，缺失／非法unknown。每份notes最多64KiB前缀加一byte，精确单一版本heading，仅展示完整section<=8KiB；Unreleased／其他版本不当对应说明。匹配section不完整／预算超出、重复、缺失、不可读、版本unknown均本地化明确，不以其他版本回退。纯只读text，不Markdown／HTML执行／自动链接图像联网，不start／prompt／trust变化。单次冻结包快照、document<=20KiB、单opening owner，dispose迟到抑制，固定双语native失败可重试，不持久UI。安装0.86.1根notes可能缺失，诚实反馈而非编造说明，不因此改scope。

## 编码前失败方式

- 源码／依赖声明冒充实际；推测最新版／隐式更新联网。
- 错误或Unreleased说明冒充对应；缺失／重复／截断／过大误成功。
- 读取／渲染整份巨大日志，任意workspace路径、unsafe rich resource、error泄漏路径。
- dispose迟到打开、重叠、native失败不能恢复。
- packaging缺根notes、新增notes改变依赖／版本策略／交付范围。

## 批准、需求与证据

REQ-009本地支持信息，无架构／ADR／gate或重大trust／data取舍。本轮有界Goal批准Prepare后Build。预计host version-information／公共接线／command／package files、预写组合及打包notes断言、双语README／PRD／WI。先写生产组合失败：实际精确版本、不同版本／Unreleased排除、unknown／缺失／重复／巨大／截断／不可读、纯字面文档、dispose／重叠／open重试／不调用runtime；真实固定notes及archive证据与模拟native API分开。干净5f2135f1261基线通过。然后compile／lint／行为／文档、审查提交、干净候选／打包；native英中只读与安装显示独立必需。隔离Code绑定仍阻碍则不验收／关闭，八项目标native全部保留待完成。

有界方案Prepare完成，下一步预写组合red再实现。此点无版本报告／native验收。


六项生产组合先于应用代码编写，red因缺少公开version-information entry失败。重复检测限于扫描的有界前缀，不审计整份历史日志；当前完整章节后有下一heading即可用，即使旧尾部很大。不完整／前缀之外／过大明确unavailable。下一步focused与标准检查，无候选／native验收。


## 提交后候选与外部阻碍

实现 d3ff0ea4144280f32d2b14ffb4f5648f1195e3db 已审查，与ACTIVE分开提交。干净隔离候选compile／lint通过；前两次完整行为失败于未改的frozen-history全局last-message断言。修正generated bundle诊断插桩后replay通过，随后标准npm test重建未插桩bundle、1267通过。根因未确证，失败／诊断／最终标准log分留，不改history断言／行为。开发const／control-regex lint已修正。docs:verify（两个既有ADR warning）／docs:health／package:vsix通过。最终候选真实公开pi RPC资源报告／压缩／模型轮换及真实SDK／生产worker会话搜索通过，零真实／付费inference或账户；loopback压缩仅模拟inference。

实际archive包含固定根／上游notes。生产version owner配替代native APIs验证实际插件／pi0.86.1、对应插件说明缺失（既有打包映射不变）、精确上游0.86.1、无其他版本／Unreleased回退、英中有界output。可重复probe：node dist/goal-eight/wi089/verify-version-archive.mjs <clean candidate> <output>，须curated隔离env。candidate-identity.json／candidate-evidence保留身份／log／报告，提取非安装。前端Git tree自4eb8d38相同，旧浏览器矩阵仍为模拟宿主而非native。

八项native F5／安装验收仍阻塞。原用户Code存在（仅binary inventory，不读用户正文）；macOS CUA无法按PID／window安全绑定隔离实例。未退出／使用用户实例，不放宽签名／library validation。最小解锁：用户保存关闭原Code以绑定隔离签名实例，或工具增加安全PID／window绑定。未WI关闭／归档／Goal完成。


## 原生凭据隔离修复 Prepare — 2026年10月3日

Goal续跑确认原日常Code进程已退出，从干净d3ff0ea启动既有隔离F5 launcher；CUA路径及bundle-ID绑定均超时。维护者报告反复“keychain not found”；隔离日志显示内置GitHub认证读取钥匙串。弹窗准确来源／根因仍未确证。已终止本任务launcher并观察进程退出，未读取／修改用户钥匙串或配置。本轮新证据属于推进，不是native验收。

有界修复仅涉及native验证launcher，不修改产品SecretStorage。实际Code bundle声明`--use-inmemory-secretstorage`，将其boolean传入NativeSecretStorageService。F5父窗口、生成调试子窗口、安装CLI及安装启动均传入；交互fixture禁用内置GitHub／Microsoft认证扩展。保留curated HOME、空凭据与既有资源／信任fixture；不替换真实HOME、不重置／删除钥匙串、不降低OS安全、不索取密码。

编码前失败方式：任一路径遗漏flag、参数／环境传递丢失、验证driver误启动真实Code或读取用户状态、模拟检查冒充native／钥匙串修复验收。先写替代executable的子进程组合，实际运行launcher两种模式并检查生成F5参数；只证明参数接线，不证明弹窗消失。能无凭据提示地操作隔离native窗口前实际重试仍未验证；准确症状验证需要安全native观察或维护者证据。

两项launcher组合先于脚本修改编写，均因缺少内存flag失败（`dist/goal-eight/native-isolation/red.log`）。修复使每次调用均内存存储，交互fixture禁用两个内置账户扩展；未改产品代码／用户配置。两组合现通过（`green.log`），脚本语法／compile／lint通过。完整标准行为首次失败于既有未改frozen-history全局last-message断言（1268/1269），保留`test.log`；第二次未改标准运行1269通过（`test-recheck.log`）。文档verify／health通过。这仅为开发／脚本证据，不是native验收、弹窗消失、根因确认或系统钥匙串修复。下一步仅审查／提交本任务launcher／测试／记录，再隔离验证提交候选后决定是否安全native重试。
