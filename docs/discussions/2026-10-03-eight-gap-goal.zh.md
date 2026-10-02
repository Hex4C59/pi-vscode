# 八项有界交付目标

[English](2026-10-03-eight-gap-goal.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-03-eight-gap-goal.md](2026-10-03-eight-gap-goal.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-03
- Type: Reference
- Status: Active
- Created: 2026-10-03
- Authority: 本聊天 2026-10-03 `/goal` 的有界授权和恢复入口；不替代单项 Prepare 或证据

## 授权和恢复

维护者明确批准 PI-GAP-02、04、06、14、21、24、26（仅可审查、可取消的本地诊断导出）、27 在 ACTIVE 边界内串行实施、实际验证、代理验收及本地提交。一个 Agent、一个当前 WI，WIP=1；先完成每项 Prepare，再 Build。常规可逆细节已委托；重大产品、安全、信任、持久化取舍仍须另批。不 push、发布、合并、改写提交、升级上游、扩展平台、使用真实凭据或新增付费调用。诊断上传、完整会话／源码／凭据收集不在目标内。

恢复时读取 goal 状态、[ACTIVE](../../ACTIVE.md)、当前 WI、协作指南及工作区。八项都实际实现、验证、提交并满足关闭条件才能 complete；任何阻塞／缺证据仍未完成。代理验收必须标注“本次授权下的代理验收”，不是维护者亲自测试。模拟、真实 runtime、F5、安装 VSIX 分别取证。常规失败继续诊断，确实阻塞时保留未完成并按协作指南切换独立项。

## 初始状态和顺序

起点 `bc1a2d7`，分支 `master`。已声明／安装 pi 均为 `0.86.1`。暂存区为空。ACTIVE 与功能差距讨论英中两份既有未提交修改视作用户所有，不能顺带提交。原始补丁和状态保存在 Git 忽略的 `dist/goal-eight/startup/`；这是本地恢复工件，不是产品证据。

先做 [WI-082 / PI-GAP-02](2026-10-03-wi-082-resource-report.zh.md)，后续按依赖考虑 04、06、14、24、21、26、27；未调查项的可行性和验收均未证明。当前状态和未完成边界只在 ACTIVE 维护，已关闭记录经归档索引检索。


## 八切片实现检查点——验收未完成（2026-10-02 UTC）

八项批准实现均有本地提交，均未本轮代理验收／关闭：PI02 d03d7c4+0633e9f；PI04 77ca3c2；PI06 fa1d18d；PI14 66ba52b；PI24 4bb653c；PI21 4eb8d38；PI26本地5f2135f；PI27 d3ff0ea。最终干净d3ff0ea检查及真实RPC／SDK见WI089，两次history断言失败分留。浏览器仍模拟宿主，非native。26上传／敏感收集未批准且待完成；用户分组／gap改动未暂存。

实现后阻碍audit1：Goal turn01a0fdf1-76fa-7a42-b37c-2ec4e5947748。原用户Code存在，无安全隔离CUA PID／window绑定，无其他独立批准实现剩余。最小解锁为用户保存关闭原Code或工具安全绑定。Goal保持active，非complete；仅不同后续Goal turn增加audit，不计压缩或重复工具。连续三turn且无法有意义推进时按规则blocked；用户resume重启audit。当前WI089及前七native阻碍仍在ACTIVE。
