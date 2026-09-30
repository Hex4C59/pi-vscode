# 作曲区模型芯片文案工艺

[English](2026-10-01-model-chip-label.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-model-chip-label.md](2026-10-01-model-chip-label.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01

- 类型：讨论
- 状态：WI-066 已交付芯片／列表展示；WI-067 已交付模型选择器与执行配置互斥
- 创建：2026-10-01
- 权威：**仅作上下文**——不覆盖 [`ACTIVE.md`](../../ACTIVE.md)、[PRD](../product-requirements.zh.md) 或架构
- 相关：REQ-002、[WI-042](../archive/2026-09-30-wi-042-macos-acceptance.zh.md)、[WI-066](../archive/2026-10-01-wi-066-acceptance.zh.md)、[WI-067](../archive/2026-10-01-wi-067-acceptance.zh.md)、[`ModelPickerView`](../../src/webview/components/model-picker.tsx)

## 问题

维护者认为收起的作曲区芯片和打开后的模型弹层难看。示例：`hellocode / gpt-6-sol · low`。已确认展示：

1. 本控件内**不要**显示供应商名（芯片、弹层标题、列表行都不要 `hellocode`）。
2. 模型 id 里的专用缩写全大写（`gpt` → `GPT`）。
3. 普通名词片段首字母大写（`sol` → `Sol`）。
4. 英文推理强度首字母大写（`low` → `Low`）。
5. 去掉打开面板上的 **Model**、**Thinking level**、**Open provider settings**。
6. 格式化后的模型名和推理强度**放在一起、居中**。这一块是同一命中区：**点击弹出模型列表**（不是循环切到下一个）。
7. **下面的滑条**只改推理强度。
8. 列表行用同一套格式化 id，也不显示供应商。

该例应读作 **`GPT-6-Sol · Low`**。供应商设置仍走侧栏齿轮，不进这个弹层。

本记录不是 Build。晋升仍须 Prepare 提案与维护者确认。决策类：`none`（不应改宿主身份字符串）。

## 当前行为

[`ModelPickerView`](../../src/webview/components/model-picker.tsx) 在 Webview 层格式化模型 id（`displayModelId`／`formatModelId`），英文思考强度 Title Case。宿主投影仍是 `provider / modelId`。中文思考标签仍是关闭／低／中／高／最高。

[WI-042](../archive/2026-09-30-wi-042-macos-acceptance.zh.md) 仍用稳定的 `provider:modelId` 标记已应用 **radio**。WI-066 未改该身份规则。

REQ-002 仍要求用户能分辨当前选中的已配置模型。芯片和列表上省略供应商是明确的展示选择；唯一性仍靠选择器 radio 与宿主身份。[实现核对](2026-09-30-requirements-implementation-check.zh.md) 里跨供应商同名缺口仍在。

## WI-066 已交付

切片 1（作曲区模型控件）已实现：格式化 id、无供应商、英文思考 Title Case、无打开面板标题或 Open provider settings、居中名称＋强度打开列表、滑条只改思考。设置默认模型共用 `ModelPickerView`。英文 `xhigh` 为 `Xhigh`。下一轮待应用文案用同一套格式化。

## 仍停放

本讨论无剩余项。REQ-002 同名身份仍是 ACTIVE 里的独立停车场项。

## 倾向

在 Webview 展示层从 `provider / modelId`（或目录 `modelId`）格式化，不改宿主 `chatModel` 身份字符串。保持 WI-042 radio 身份。互斥是后续作曲区本地 WI（已由 WI-067 交付）。
