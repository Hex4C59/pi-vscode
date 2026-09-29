# WI-032 macOS 代理受托凭据规则评估

[English](2026-09-30-wi-032-macos-evaluation.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-09-30-wi-032-macos-evaluation.md](2026-09-30-wi-032-macos-evaluation.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-30

- 类型：Reference
- 状态：Archived
- 创建：2026-09-30
- 权威：限定切片的代理受托接受与关闭历史；现行工作见 [ACTIVE](../../ACTIVE.md)

## 2026-09-30 最终委托接受

维护者在初次证据交接后明确要求「你帮我审查完就不要我来独立接受了」，将 WI-032／WI-033／WI-034 的最终判断委托给代理。本记录自此为**代理受托接受并关闭**，不是维护者亲自测试，不再等待其独立接受。此前仅评估／待接受措辞在下方保留为初次取证时的历史，不是当前阻塞。因 WI 已关闭，双语记录成对从 discussions 归档。

接受并关闭已批准的六入口凭据规则收敛切片。源码追踪、定向 139 项测试、当前完整 867 项测试及 macOS F5／安装版 smoke 证据足以支持本技术切片。没有逐入口原生敏感交互重放，保留为证据限制，不伪报通过，也不再挂成待维护者签认。任意秘密识别与历史会话打码仍在范围外。

只接受本 WI 的批准切片，不接受整份 Draft PRD，不改 gate／ADR，不提交 Git；原生未验证项不会因委托而变成通过。


## 结论

本项是**代理受托评估**，不是维护者接受或 WI 关闭。源码追踪确认六处入口使用同一份宿主纯规则，经 [contracts](../../src/extension/contracts/index.ts) 导出。当前构建定向测试 139 通过、0 失败／跳过。评估未改生产代码或测试，没有恢复已停止的通用逐断言审查。

三类共用合成样例为私钥标记、凭据字段赋值及 Bearer 值；纯规则还覆盖空赋值与 Authorization／Bearer 重叠。普通文本不变，私钥展示隐藏整段，字段／Bearer 展示保留普通上下文。识别仍是尽力保护，不证明任意秘密均可被识别。

## 六入口追踪与证据

| 入口 | 源码与本轮测试结果 |
|---|---|
| RPC 对话 | [rpc-dialogs](../../src/adapter/runtime/rpc-dialogs.ts) 元数据使用 `containsCredentialLikeText`；三类样例取消且不发表单，普通文本打开；[测试](../../src/adapter/runtime/tests/rpc-dialogs.spec.ts) 保留用户主动填写 input／editor 的字面回答与 32 KiB 回答上限 |
| 扩展反馈 | [extension-feedback](../../src/adapter/runtime/extension-feedback.ts) 共用拒收规则检查文本与 key；[测试](../../src/adapter/runtime/tests/extension-feedback.spec.ts) 只投影固定安全句，拒绝时不改变 keyed 状态，UTF-8／帧限制不变 |
| 活动与最终文字 | [activityProjection](../../src/adapter/runtime/activityProjection.ts) 的 `displayText` 调用 `redactCredentialLikeText`；[活动测试](../../src/adapter/runtime/tests/activity-projection.spec.ts) 覆盖三类和打码后的 16,384 字符截断；[RPC 帧测试](../../src/adapter/runtime/tests/rpc-frames.spec.ts) 覆盖最终／增量打码后预算及私钥整段隐藏 |
| 工具审批 | [toolApproval](../../src/extension/editor-tools/toolApproval.ts) 在策略与卡片生成前检查序列化 input；[测试](../../src/extension/editor-tools/tests/tool-approval.spec.ts) 三类均拒绝且零卡片，再证明普通输入可产生卡片，既有大小／生命周期检查通过 |
| 变更审阅 | [changeReview](../../src/extension/editor-tools/changeReview.ts) 对有界解码后的磁盘文字调用共用拒收规则；[测试](../../src/extension/editor-tools/tests/change-review.spec.ts) 三类均为 `sensitive-source`／diff unavailable，保留不安全字节为零，普通文本 unchanged；路径规则独立保留 |
| 文件／选区附件 | [fileAttachment](../../src/extension/draft/fileAttachment.ts) 的 `checkedText` 调用共用规则；[测试](../../src/extension/draft/tests/file-attachment.spec.ts) 三类逐一检查文件／选区 `sensitive-source`、不入附件、不写 runtime，并接纳普通文本，源身份与大小规则不变 |

当前完整 `npm test` 已重建精确源码相对测试清单后执行：

```bash
node --test dist/tests/extension/contracts/tests/credential-text.spec.js dist/tests/adapter/runtime/tests/rpc-dialogs.spec.js dist/tests/adapter/runtime/tests/extension-feedback.spec.js dist/tests/adapter/runtime/tests/activity-projection.spec.js dist/tests/adapter/runtime/tests/rpc-frames.spec.js dist/tests/extension/editor-tools/tests/tool-approval.spec.js dist/tests/extension/editor-tools/tests/change-review.spec.js dist/tests/extension/draft/tests/file-attachment.spec.js
```

## 宿主证据与限制

[WI-034 证据](2026-09-30-wi-034-macos-evaluation.zh.md) 证明当前构建的 macOS 原生 F5、独立隔离安装版激活与渲染，截图已查看，激活日志真实存在。那些宿主包含 WI-032 代码；属于 smoke 证据，不是六种敏感输入路径的原生交互重放。上表使用生产函数与合成 host／transport 夹具，适用的磁盘用例实际操作一次性文件系统。

本轮 compile／lint、完整 867 项测试通过。历史会话打码、认证分类、模型设置与任意秘密识别仍在范围外。Windows 在验收范围外。维护者接受及额外原生六入口交互证据是独立事项；不改变 PRD／ADR／gate，不提交。
