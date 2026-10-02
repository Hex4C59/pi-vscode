# WI-086 — 当前项目已保存会话搜索

[English](2026-10-02-wi-086-session-search.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-02-wi-086-session-search.md](2026-10-02-wi-086-session-search.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-02
- Type: Reference
- Status: Active
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
