# WI-015 — React／Vite 迁移验收

[English](2026-09-27-wi-015-react-acceptance.md) | 中文

- 翻译状态：Technically Verified
- 权威原文：[2026-09-27-wi-015-react-acceptance.md](2026-09-27-wi-015-react-acceptance.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-27

- Type: Reference
- Status: Archived
- Created: 2026-09-27
- Authority: 已关闭 WI 的限定历史；当前工作由 [ACTIVE](../../ACTIVE.md) 管理

## 批准范围与接受

代理按本次明确委托完成评估，关闭既有批准 WI-015 T015-01～06，并于 2026-09-27 UTC 接受 [ADR 0003](../decisions/0003-react-webview.zh.md)。不是维护者亲自操作。选择沿用已实现 React／TypeScript／Vite、host esbuild 与公开 client／bridge，而非重复迁移；正式展示沿 WI-019，业务与安全策略不变。此前 Q16／正式接入材料已归档，初始框架调查转为非权威历史。

## 实际证据

证据根为 dist/delegated-completion-20260928/。复用同一轮当前源码／包的 [WI-019 验证](2026-09-27-wi-019-formal-chat.zh.md)，不是引用前一轮历史通过：456 标准测试、compile／lint、当前安装9项哈希、JS／CSS／SVG 包资源、原生 F5 与安装版三主题双语／键盘／短窗及核心行为。补跑 host-chat-installed/installed-lifecycle-report.json 与 lifecycle.log 完整通过：实际 Developer Reload Webviews 在流式中重建 renderer，保留已确认草稿与 Stop 权威；核对自有 RPC 后终止，保留只读可选择草稿、阻断 Send；显式 Reload Window 后新任务成功。已看失联截图。F5 的失联／重载是另一次真实运行；renderer reload 不冒称 host onDidDispose，后者由适用确定性生命周期测试提供语义证据。

wi015-bundle-measurements.json 记录当前构建 Node、依赖和 JS／CSS／SVG 原始及 gzip 字节，ADR 逐项列出；不声称框架性能优越。新资源地址缺陷已经修复且真实宿主显示，不依赖预览服务。文档检查与资源定向审计在 ACTIVE 交接记录；不因机械检查自动接受 ADR。

## 保留限制与资源

只接受前端选型／迁移；完整 Draft PRD、WI-013、其他 WI 与广泛 gates 不随之关闭。实际 Windows 官方1.105.1 F5及1.139.1安装版不是所有声明版本／兼容 fork 的证明。renderer重建与host disposal不混淆，内存草稿不宣称持久化。当前权威为 Accepted ADR／架构／PRD 与 ACTIVE；此记录不作为新增实施授权。

沿 WI-019 保留自有证据、失败记录、隔离 profile、新包及外部固定 F5 工具；停止服务后，在后续 WI 不再需要且唯一证据已保留时清理。无额外用户环境安装，无提交／推送。
