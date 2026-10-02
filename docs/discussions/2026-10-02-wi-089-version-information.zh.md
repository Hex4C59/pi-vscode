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
