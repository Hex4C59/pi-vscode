# 作曲区模型芯片文案工艺

[English](2026-10-01-model-chip-label.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-01-model-chip-label.md](2026-10-01-model-chip-label.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-01

- 类型：讨论
- 状态：停车场方向；不是 Build 授权或 PRD 验收
- 创建：2026-10-01
- 权威：**仅作上下文**——不覆盖 [`ACTIVE.md`](../../ACTIVE.md)、[PRD](../product-requirements.zh.md) 或架构
- 相关：REQ-002、[WI-042](../archive/2026-09-30-wi-042-macos-acceptance.zh.md)、[`ModelPickerView`](../../src/webview/components/model-picker.tsx)

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

[`ModelPickerView`](../../src/webview/components/model-picker.tsx) 在触发器上直接打印 `state.chatModel`。宿主投影为 `provider / modelId`（测试与实机 `hellocode / gpt-6-sol`）。已知 thinking 档位走 `t(level)`，英文界面是小写 `off`／`low`／`medium`；中文已是关闭／低／中／高／最高。

[WI-042](../archive/2026-09-30-wi-042-macos-acceptance.zh.md) 用稳定的 `provider:modelId` 标记已应用 **radio**，再用唯一显示标签。该身份规则保持。本停车场项改**作曲区模型控件展示**（收起芯片＋打开弹层），不是改运行时选型。

REQ-002 仍要求用户能分辨当前选中的已配置模型。芯片和列表上省略供应商是明确的展示选择；唯一性仍靠选择器 radio 与宿主身份。[实现核对](2026-09-30-requirements-implementation-check.zh.md) 里跨供应商同名缺口不由本工艺切片假装修掉。

## 停放切片

| 顺序 | 切片 | 范围内 | 范围外 |
|------:|------|--------|--------|
| 1 | 作曲区模型控件 | 收起芯片、打开弹层标题与列表行：格式化 **model id**（无供应商）；连字符规则同上；英文推理强度 Title Case。打开面板：无 Model／Thinking level／Open provider settings；居中的名称＋强度是模型列表触发器；滑条只改推理 | 不改 provider／model 身份协议；不跳过审批；不重写目录；不做插件清单 |

**未知片段默认：** 字母段 Title Case。不要在代码里堆无限品牌词表；专用缩写须在 WI 提案中列出（已确认 `gpt`；其他仅在维护者点名后加入）。

## 2026-10-01 已确认

点击居中的名称＋强度会**弹出模型列表**。列表行**不显示供应商**，并用同一套 id 格式化。

## Prepare 仍待决

- **设置页默认模型**是否同一规则？
- 英文 `xhigh`：`Xhigh` 还是 `XHigh`？（中文「最高」不变。）
- 芯片上的下一轮待应用模型／thinking：是否同样格式化？

## 倾向

在 Webview 展示层从 `provider / modelId`（或目录 `modelId`）格式化，不改宿主 `chatModel` 身份字符串。保持 WI-042 radio 身份。与本机插件清单独立排队。
