# UI 子模块审查：仅检查新文件

[English](2026-09-30-ui-components-audit.md) | 中文

- Type: Discussion
- Status: Draft
- 翻译状态: Machine Draft
- 权威原文: [English](2026-09-30-ui-components-audit.md)
- 原文版本: Uncommitted baseline
- 最近同步: 2026-09-30
- Scope: 维护者要求继续审查代码；排除前两轮已检查的文件。
- Authority: 仅记录发现和候选后续，不批准实施、新建 WI、接受 ADR 或提交 Git。

## 发现

### UI-01／P2：显示标签被当作模型身份

[ModelPickerView](../../src/webview/chat/composer/model-picker.tsx#L201)在当前模型等于 provider／model-id 组合或显示标签时，都把条目标记为已应用。这个判断不保证唯一选中。

隔离 React 渲染中，当前模型为 `provider-a / id-a`，条目 A 的身份就是该组合，条目 B 的显示标签也为 `provider-a / id-a`，结果同时产生两个 `aria-checked="true"` 单选条目。另一项相同显示标签探针也产生两个选中条目。这证明展示身份存在歧义，不证明发送给运行时的模型错误；模型回调仍携带 provider 和 model-id。

候选后续：区分稳定的已应用身份与显示文本，不通过标签猜身份来隐式兼容。回归应覆盖相同标签及标签与另一模型 canonical 组合碰撞。本记录不批准协议变更。

### UI-02／P2：Escape 被处理两次，焦点返回错误区域

[ModelPickerView](../../src/webview/chat/composer/model-picker.tsx#L52)的 window 级 Escape 监听器不检查事件是否已被其他处理器消费。[CandidateContext](../../src/webview/chat/composer/candidate-context.tsx#L203)在关闭自己的预览／历史时使用 `preventDefault`；附件菜单处理也会在本地消费 Escape。两者都不能保证模型监听器随后不再处理。

隔离挂载组合先打开模型弹层，再打开 Add context 菜单。在附件菜单按 Escape 后，该菜单关闭，但模型弹层也关闭，焦点转到 `model-effort-trigger`，覆盖附件菜单自己的焦点返回。两项组件使用真实实现；通往旧模块的共享导出入口替换为仅提供翻译的 stub，避免载入此前审查过的应用模块。

候选后续：统一事件消费约定，明确 `defaultPrevented` 与输入法组合事件的处理；回归覆盖非模态区域重叠及焦点返回。这是 jsdom 组件复现，不是实机浏览器验收。

### UI-03／P3：缺失路径正文绕过翻译

[ReviewEntry](../../src/webview/chat/execution/change-review.tsx#L49)对缺失路径 tooltip 使用翻译，但正文 fallback 直接渲染英文 `Path unavailable`。

隔离翻译 provider 下 tooltip 已翻译，正文仍为英文。这是小范围、已确认的本地化不一致，不是授权或文件访问问题。候选后续：两处 fallback 使用同一个翻译函数。

## 额外设计观察

[MessageComposer](../../src/webview/chat/composer/message-composer.tsx#L8)同时接收 workspace 状态、多组派生准入标记及较多回调；类型允许状态和标记互相矛盾。这增加组合层的理解成本，但本轮没有复现生产状态不一致。不把它计为第四项已确认故障，也不单凭 props 数量建议大规模重构。

## 新增覆盖清单

前两轮的文件继续排除，包括只检查过部分区段的文件。本表同时供下一轮排除使用。列出文件不等于穷尽所有分支；部分长响应发生内容截断，检查聚焦于已返回的实现区段。

| 本轮新文件 | 覆盖 |
|---|---|
| [model-picker](../../src/webview/chat/composer/model-picker.tsx) | 状态、选择、键盘／焦点及 range 控件；重点区段与探针 |
| [saved-history](../../src/webview/chat/sessions/saved-history.tsx) | 完整返回的组件 |
| [message-composer](../../src/webview/chat/composer/message-composer.tsx) | 组合／输入区段；长响应部分截断 |
| [chat-dialog](../../src/webview/ui/chat-dialog.tsx) | 完整返回的实现 |
| [ui-language](../../src/webview/i18n/ui-language.ts) | 完整返回的实现 |
| [session-navigation](../../src/webview/chat/sessions/session-navigation.tsx) | 完整返回的组件 |
| [candidate-context](../../src/webview/chat/composer/candidate-context.tsx) | 附件／菜单／焦点区段及隔离组合探针 |
| [project-resource-consent](../../src/webview/chat/workspace/project-resource-consent.tsx) | 完整返回的实现 |
| [approvals](../../src/webview/chat/execution/approvals.tsx) | 返回的审批、时间及授权区段；长响应部分截断 |
| [change-review](../../src/webview/chat/execution/change-review.tsx) | 返回的审阅区段及本地化探针 |
| [candidate-sessions](../../src/webview/chat/sessions/candidate-sessions.tsx) | 完整返回的组件 |
| [select-extension](../../src/extension/extension-loading/select-extension.ts) | 完整返回的实现 |
| [no-folder-prompt](../../src/webview/chat/workspace/no-folder-prompt.tsx) | 完整返回的组件 |
| [project-resources-prompt](../../src/webview/chat/workspace/project-resources-prompt.tsx) | 完整返回的组件 |
| [ui-text](../../src/webview/i18n/ui-text.tsx) | 翻译函数完整实现及部分消息标识联合类型 |
| [task-status](../../src/webview/chat/execution/task-status.tsx) | 完整返回的实现 |
| [workspace-setup](../../src/webview/chat/workspace/workspace-setup.tsx) | 完整返回的组件 |
| [session-icon](../../src/webview/chat/sessions/session-icon.tsx) | 完整返回的组件 |
| [composer-icon](../../src/webview/chat/composer/composer-icon.tsx) | 完整返回的组件 |
| [pi-welcome-mark](../../src/webview/chat/conversation/pi-welcome-mark.tsx) | 完整返回的动画实现 |
| [chat-preview](../../src/webview/ui/chat-preview.tsx) | 完整返回的实现 |

## 证据与限制

- 四个场景实际复现：模型标签相同、canonical 身份与显示标签碰撞、Escape 双重处理、缺失路径正文未翻译。
- esbuild 使用 `write: false`；对 metafile 执行本轮新文件的严格允许清单断言，此前审查过的导出入口被 stub 替换，没有遍历。
- 第一次探针的 VM context 缺少 DOM 全局变量；第二次使用了错误的触发按钮选择器。这些是探针设置问题，不作为应用发现。修正后的组合探针与 canonical 身份变体均完成，断言成立。
- 没有修改应用代码、访问真实 pi 配置、启动运行时、访问网络或调用付费 API。挂载 root 与 jsdom window 已清理，没有生成磁盘探针样本。
- 没有复查旧测试，没有运行完整测试、浏览器截图或 F5／安装 VSIX 验证；本报告不是每文件／每分支质量认证。
- 本轮只新增这份讨论的双语文档，没有重新打开或改写旧待办。文档检查结果在交接回复单独报告。
