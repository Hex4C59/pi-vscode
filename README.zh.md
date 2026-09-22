# pi VS Code

[English](README.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[README.md](README.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-22

面向 [pi](https://github.com/earendil-works/pi) coding agent 的 VS Code 扩展：边写代码边在侧栏聊天。左侧保留 Explorer，Pi 优先使用右侧辅助侧栏。

本项目独立维护，按 [MIT](LICENSE) 开源。pi 是独立的上游产品。

## 当前状态

开发版本已实现工作区／资源选择、文本流式、模型／thinking 选择、思考／工具卡、执行审批和 Stop。这些属于限定范围的开发能力；验收与未完成工作见 [`ACTIVE.md`](ACTIVE.md)。

- WI-010 经维护者四项 F5 确认后关闭；已安装 VSIX 激活及剩余审批／生命周期矩阵仍未验证。
- WI-008／WI-009 的空闲选择及下一轮生效主路径已确认，最终收尾仍待完成。
- 编辑器附件、修改后审查和会话历史 UI 仍为提案。[PRD](docs/product-requirements.zh.md) 保持 Draft，三个[架构 Gate](docs/reference/architecture-gates.zh.md) 保持 Open。

仓库尚无 Marketplace 或 Open VSX 发布验收记录。[历史](docs/archive/2026-09-21-closed-wi-history.zh.md)中的验证 VSIX 仅通过解压包检查，不等于已安装包验收。

## 从源码运行

按 [`package.json`](package.json) 声明的 Node 与 VS Code 版本范围准备环境，然后执行：

```bash
git clone https://github.com/Hex4C59/pi-vscode.git
cd pi-vscode
npm ci
npm run compile
```

在本地 VS Code 窗口打开仓库，按 **F5**（Run Extension）。在扩展开发宿主中通过命令面板运行 **pi: Focus Chat**，或使用编辑器标题栏的 Pi 图标。

打开一个可信本地文件夹，选择是否允许 pi 项目级资源。宿主启动 pi 并显示就绪状态或有界错误。聊天复用已有 pi provider 配置与凭证；真实 provider 请求可能按其规则计费。无目录、多根、远程和未信任工作区不能启动运行时。

受控配置在覆盖范围内的操作前询问，仅自动允许 canonical 路径位于工作区内的普通文件读取。资源同意与工具授权独立。Stop 请求取消，不撤销已完成的修改；扩展不是沙箱。具体限制见[已批准的执行切片](docs/product-requirements.zh.md#req-006--执行审批策略)。

## 开发与验证

按[贡献指南](CONTRIBUTING.zh.md)选择与改动匹配的检查。集成探针须遵守 [pi 集成指南](docs/guides/agent/pi-integration.zh.md)，与默认自动化测试分开执行。

## 文档

- 当前工作与验收：[`ACTIVE.md`](ACTIVE.md)
- 贡献者与 Agent：[`CONTRIBUTING.zh.md`](CONTRIBUTING.zh.md)、[`AGENTS.zh.md`](AGENTS.zh.md)
- 安全报告：[`SECURITY.zh.md`](SECURITY.zh.md)
- 按任务导航：[文档索引](docs/README.zh.md)
- 变更历史：[`CHANGELOG.md`](CHANGELOG.md)

## 侧栏兼容性

manifest 将 Pi Webview View 注册到 `secondarySidebar`。宿主／兼容编辑器支持须独立验证，版本声明本身不证明侧栏位置可用。回退方向是在主侧栏显示同一视图，并在支持时移到右侧；不代表所有宿主已有经验证的自动回退。

## 许可证

[MIT](LICENSE) — Copyright (c) 2026 Hex4C59
