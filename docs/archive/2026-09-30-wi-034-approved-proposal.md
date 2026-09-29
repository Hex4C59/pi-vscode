# WI-034 批准提案与实现交接历史

- Type: Reference
- Status: Archived
- Created: 2026-09-30
- Authority: historical original Chinese ACTIVE proposal; not current work

因 WI-034 经代理受托接受并关闭而原样保留，不是新建造授权。原提案为 ACTIVE 单语材料，没有既有翻译。当前授权见 [ACTIVE](../../ACTIVE.md)，接受范围与证据见[关闭记录](2026-09-30-wi-034-macos-evaluation.zh.md)。

## 正在做（WIP=1）

维护者于 2026-09-30 批准新 WI-034：新增 VSIX 组包能力，保持 WIP=1。WI-033 实现及自动检查已完成，转为待接受，见下方当前焦点。

| 字段 | 内容 |
|---|---|
| **ID** | WI-034 |
| **阶段** | 建造 |
| **Gate ID** | 无 |
| **Decision** | none |
| **PRD 判定** | 纯技术：新增组包脚本与 npm 脚本，不改变任何用户可见行为、宿主策略或数据格式，也不新增 REQ。本 WI 不使 REQ-009 的"已安装 VSIX"验收成立。 |

### 目标与范围

提供一个确定性组包入口，从 `package.json` 的 `files` 白名单与生产依赖树组装可安装 VSIX，并新增 npm 脚本作为入口。

已核实的输出契约（`scripts/packaging/verify-vsix.mjs` 第 20～22、33 行定义）：归档根为 `extension/`；必须包含 `extension/package.json`、`extension/dist/extension.js`、`extension/dist/runtime-supervisor.mjs`、`extension/dist/session-worker.mjs`、`extension/dist/approval-gate.mjs`、`extension/node_modules/@earendil-works/pi-coding-agent/dist/bundle/cli.js` 及其 `package.json`（版本须为 0.86.1），且必须存在 `extension/node_modules/@earendil-works/pi-coding-agent/node_modules/` 下的传递依赖。已核实锁文件中嵌套传递依赖 185 条，其中 pi-coding-agent 占 143 条。

范围包含：`scripts/packaging/` 下的组包脚本；同目录 `*.spec.mjs` 规范测试；`package.json` 新增一个组包脚本条目；README 双语补充可生成已安装包的说明。范围不包含：安装到维护者既有 profile、发布、签名、Marketplace／Open VSX、实现 ADR 0006、改动生产运行时代码。

### 方案与架构核对

组包为构建工具，位于 `scripts/packaging/`，与既有 `verify-vsix.mjs`、`verify-webview-assets.mjs` 同目录，遵循测试指南的既有用途划分。运行时不导入该脚本，因此不进入扩展边界，也不改变 host／adapter／webview 依赖方向。

技术选择（维护者 2026-09-30 确认选 A：手写清单，零新依赖）：用系统 `zip` 生成归档。已实测 `zip -X` 两次输出 SHA-256 完全一致（字节确定），归档内使用相对路径，避免自写 ZIP writer 的缺陷风险。手写 `extension.vsixmanifest` 并由隔离安装验证兜住清单正确性；`vsce` 不需要 `[Content_Types].xml`。

架构核对（结论：不触碰层边界；Decision：none）：

| 维度 | 状态与证据 | 限制／处理 |
|---|---|---|
| 模块／接口／依赖／所有者 | pass：新增脚本归 `scripts/packaging/`，不改 `src/` 任何层；不新增运行时依赖 | 纯构建工具 |
| 需求／状态／并发／恢复／清理 | pass：不涉及产品状态机；脚本须清理临时目录并在失败时报错 | 无并发语义 |
| 安全／可观察性／边界限制 | pass：沿用 `files` 白名单，显式排除 `.local-env/`、`*.vsix`、`skills-lock.json`、`.git`；失败须报错而非产出半包 | 不声称包内容无秘密；需一次性核对 |
| 测试／兼容／交付 | pass：新增脚本 spec 覆盖必需条目、路径逃逸与排除项 | 限制：`zip` 缺失时须明确报错；Windows 范围外 |
| 持久化迁移／UI 布局 | N/A：不改存储、跨层协议或界面布局 | 既有恢复状态仍适用 |

### 验收

组包脚本须能实际产出一个 VSIX，并通过四层验证：

1. 规范测试（`scripts/**/*.spec.mjs`，由 `npm test` 收集）覆盖：必需条目齐备、禁止路径逃逸、显式排除项、传入路径参数。
2. `node scripts/packaging/verify-vsix.mjs <out.vsix>` 通过——含解包后真实 RPC 就绪与 gate 握手、pi 0.86.1 版本断言。
3. **隔离安装验证**：用一次性 `--extensions-dir` 调用 `code --install-extension <out.vsix>`，证明清单真实可被 VS Code 接受；不写入维护者既有 profile。
4. 运行 `npm run compile`、`npm run lint`、`npm test`、`npm run docs:verify`、`git diff --check`。

须如实区分：CLI 隔离安装证明可安装性与清单有效性，**不等于** macOS 宿主实际激活／运行或完整 REQ-009 验收。Windows 已按下方 2026-09-30 决定移出验收范围。

### 范围外与批准边界

不安装进维护者既有 profile、不发布、不签名、不改生产运行时代码、不升级依赖、不引入新依赖、不实现 ADR 0006、不提交 Git。工作树既有 `src/adapter/runtime/` 等未提交改动属 WI-033，本项保留不改。

已记录一次越界事故：本 WI 准备期间用 `npm install @vscode/vsce` 在一次性目录做探测，npm 向上解析到仓库根并把 96 个包装入根 `node_modules`。已用 `npm prune` 完全清除（extraneous 归 0，`package.json` 与 `package-lock.json` 未改动，`npm run compile` 实测通过）。教训：本仓库内不可靠 `cd` 子目录隔离 npm 安装。本项不采用 vsce 路线。
