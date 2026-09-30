# WI-072: Runtime RPC grouping acceptance

[English](2026-10-01-wi-072-acceptance.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-wi-072-acceptance.md](2026-10-01-wi-072-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01

- 类型：参考
- 状态：Archived
- 创建：2026-10-01
- 权威：历史切片记录；不构成新的实现或产品授权

## 结论与验收身份

2026-10-01 Agent 按本轮切片交付授权关闭，不代表维护者亲测。实现 `5f020b5`；[批准提案](2026-10-01-wi-072-approved-proposal.zh.md)与验收归档；ACTIVE 仅晋升 DOC-NAV-01。

## 分组与检查

八个 helper、十二个已有 spec 移入 runtime/rpc；根协调文件 pi-rpc-runtime.ts／rpc-frames.ts 与排除的协作者保留同目录。公共入口、行为、RPC／打包语义不变。完整 staged 内容核对仅路径变更；未补写单元测试。

- compile、lint 通过；npm test 最终复跑 1064 通过，0 失败／取消／跳过。
- docs:verify 与关闭 docs:health 均 0 错误；各保留 Draft ADR 0010 两条既有警告／提示。
- 提交前 commit:check、完整 cached 内容审查通过。

首次十文件尝试触发跨根 helper import，保留两协调文件后通过，未放宽检查。同一首次运行有未触及的默认保存模型断言 null／old-model 失败，复跑通过；仅记录瞬时观察，不宣称已诊断或修复产品 bug。

## 限制

未做也不声称 F5、安装 VSIX、runtime spike、Windows 或产品验收。历史文档仅修复定位链接，不改历史结论。PI-GAP-01–28 未启动，ADR 状态不变。
