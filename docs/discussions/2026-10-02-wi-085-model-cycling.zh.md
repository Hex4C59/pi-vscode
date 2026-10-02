# WI-085 — 实际可用模型与思考级别轮换

[English](2026-10-02-wi-085-model-cycling.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-02-wi-085-model-cycling.md](2026-10-02-wi-085-model-cycling.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-02
- Type: Discussion
- Status: Blocked
- Created: 2026-10-02
- Authority: PI-GAP-14 有界 Prepare 与待完成证据
- Related: [ACTIVE](../../ACTIVE.md)、[有界 Goal](2026-10-03-eight-gap-goal.zh.md)、[需求](../product-requirements.zh.md)

## Prepare 与授权

当前有界 Goal 明确批准 PI-GAP-14 实施、验证、基于证据的代理验收与本地提交。WI-084 保留原生阻碍、未完成；本项为唯一当前 WI。编码前核对 ModelSettings、provider 准入、live catalogue／projection RPC 解析、命令 manifest 及既有 settings 组合 harness。现有选择器已验证实际可用模型／级别，运行时排队下一轮意图，串行修改并在失败后读回。模型身份为 provider + modelId，不是显示名。pi 保持声明的 0.86.1；不上游升级或自建 provider。

## 有界行为与架构方案

五项 native 命令：选择轮换子集、上／下一个模型、上／下一个思考级别。经标准 VS Code 键盘设置绑定，不安装默认快捷键，不改变既有选择器／默认值。子集仅内存、初始为空，限定当前工作区 generation／runtime session。native 多选仅显示当前实际可用 catalogue；明确确认（含空选择）才替换，取消保留。不写 settings／auth／session 文件，不收集凭据。空集合／失效项明确本地化提示，不自动请求 provider 或选替代模型。每次与实际 catalogue 取交集、按 catalogue 顺序首尾轮换；运行时以 pending 意图为锚，否则实际 applied 身份；未知锚 next 取首项、previous 取末项。沿用 ModelSettings 实际 projection／error，不将请求伪报已应用。

复用 ModelSettings.select 与完全相同 ready／blocked／modelBusy／chatBusy／stopping 规则；不绕忙碌、会话、信任及交互准入。由该 owner 暴露窄准入查询，不复制策略。native picker 单一 owner、2 分钟截止，确认时重验身份与准入，释放取消／失效／dispose 监听。选择集合时阻止重叠轮换；runtime／catalogue 或 pending／applied 状态变化则拒绝过期结果。仅 host 命令，无新增 Webview 资源／执行权限。PI-GAP-22 扩展 catalogue UI 不在本项。

## 编码前失败方式

轮换未配置／不可用项、显示名重复身份混淆、空集合／级别静默失败、单项重复修改、取消丢选择、持久集合跨工作区泄漏、过期 picker 改旧 runtime、busy／模型修改／交互／profile／会话／Stop 竞争、pending 锚错误、失败伪报成功、模型级别支持变化、命令重叠、picker 错误／超时／迟到／监听泄漏、翻译含糊、意外改变选择器与保存默认值。

## 可观察验收与工件

编码前准备 provider→ModelSettings→runtime 组合：集合确认／身份／首尾、空／取消／单项／不可用／失效／失败、忙碌 next-turn 与 Stop／settlement、原选择器保留、dispose／重叠。仅合成 catalogue／隔离状态，不用真实凭据或付费调用。按需隔离合成 loopback 验证公开 pi set_model／set_thinking_level，runtime 与模拟分别记录。compile、lint、标准行为／文档检查；完整 scoped diff、本地实现提交、干净候选与打包。F5／安装 VSIX 分别实际验证 native 多选、命令键盘及英中可读性；保留隔离 Code 绑定阻碍，不冒充通过。工件 `dist/goal-eight/wi085/`；Prepare 时无实现或验收。


## 开发检查点

编码前准备七项 provider-to-ModelSettings-to-runtime 组合，red 为缺少方法；现均通过：身份／首尾、初始／确认空／取消／单项、pending next-turn／settlement、实际级别／空、失败读回／成员移除、失效／dispose／重叠、替换／picker 错误。替换 fixture 改用真实 chooseResources decline／allow 而非未声明 restart 消息，失败 fixture 补齐 detail。未在代码后补单元测试。compile、lint、1242 标准检查、docs:verify、docs:health 通过。

真实 pi 0.86.1 公开 RPC 使用隔离 HOME／agent／project，验证重名合成模型修改／读回、high／off／medium 思考读回、缺失模型拒绝且旧模型不变、观察 child 关闭。推理请求／真实模型调用／凭据均为零。命令 node scripts/spikes/spike-model-cycling.mjs；工件 dist/goal-eight/wi085/（red.log、green.log、compile.log、lint.log、tests.log、docs.log、docs-health.log、runtime.log、runtime-model-cycling.json）。F5／安装 VSIX 受隔离窗口绑定阻碍未验证，无验收或关闭。下一步 scoped 本地实现提交／干净候选。本记录采用 2026 年 10 月 2 日 UTC；此前 10 月 3 日文件名为机器 Asia/Shanghai 当地日期，不是未来证据。


## 干净候选与保留阻碍

提交 `66ba52b0112bbbf72e98f5db55c6e6ff36c0055b` 在隔离干净候选执行 compile／lint／1242 检查／docs:verify／docs:health、真实 pi RPC 和 VSIX 打包通过，前后源码状态为空。工件 dist/goal-eight/wi085/candidate-evidence/ 与 candidate-identity.json；目录后续复用以保存身份为准。native 多选／键盘／英中 F5 及安装 VSIX 受既有隔离 Code 绑定阻碍未验证，无代理验收或关闭。保留 PI-GAP-14 未完成；下一独立重点 WI-086／PI-GAP-24。
