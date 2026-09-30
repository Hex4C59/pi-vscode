# 工具链与配置审查

[English](2026-09-30-tooling-config-audit.md) | 中文

- Type: Discussion
- Status: Draft
- 翻译状态: Machine Draft
- 权威原文: [English](2026-09-30-tooling-config-audit.md)
- 原文版本: Uncommitted baseline
- 最近同步: 2026-09-30
- Scope: 此前未检查的 6 个工具脚本、7 个构建／调试配置。不检查 HTML/CSS 文件，不重新打开前轮实现。
- Authority: 仅审查证据，不批准实施、接受 WI／ADR 或提交 Git。先完成审查再修复。

跟踪：[审查进度](code-audit-progress.json)。前轮：[核心边界](2026-09-30-core-boundaries-audit.zh.md)。

## 确认问题

### TOOL-01／P2：提交路径分类漏掉实际的 Vite 构建配置

[isImplementationPath](../../scripts/testing/commit-check.mjs#L34)把 esbuild、TypeScript 和 ESLint 等根目录构建输入归为 implementation，却漏掉 [vite.config.mts](../../vite.config.mts)。该文件控制生产 Webview 的入口、target、输出与资源命名。

隔离检查输入合法的模拟 Git name-status 记录，包含 ACTIVE.md 与 vite.config.mts，返回 ok true，并提示 ACTIVE 只与文档变更配对。对照中，ACTIVE 与 tsconfig.json 或 src 文件配对会返回 ok false；ACTIVE 与 README 仍允许。

确认的是机械分类缺陷，不代表可以实际提交，也不绕过维护者批准。没有执行 Git 命令、暂存或提交。

候选后续：把仓库实际使用的 Vite 配置纳入构建输入分类，覆盖新增、修改、删除及重命名记录。文档混合允许规则与人工语义审查应继续区分。

## 未来覆盖风险，不是已漏跑现有测试

### TOOL-02／P3：若允许 TSX 规格，JSX 测试发现和构建路径映射不完整

[discoverTests](../../scripts/testing/test-runner-lib.mjs#L33)只发现 .spec.ts 应用测试。[构建路径映射](../../scripts/testing/test-runner-lib.mjs#L92)同样只替换 .ts 后缀。[测试类型检查配置](../../tsconfig.tests.json#L6)包含 TSX 文件，[Webview 编译配置](../../tsconfig.webview.json#L7)也支持 JSX。

模拟文件系统同时包含 plain.spec.ts 和 jsx.spec.tsx 时，只发现前者。文件名清单确认当前 src 没有 .spec.tsx，因此不宣称已有测试被漏跑。该风险以允许 TSX 规格为条件；宽泛的 TSX 类型检查 include 本身不证明命名约定。

候选后续：明确限制规格命名，或者同时支持 TSX 发现与输出路径映射。只修改发现正则会留下错误构建路径。没有恢复逐断言审计，也没有运行现有完整测试。

## 观察与未验证边界

- 测试执行使用当前 Node executable、shell false、Windows hidden execution，复制环境后删除 NODE_TEST_CONTEXT，并拒绝空清单、启动错误、信号与非零退出。隔离检查通过，父环境未修改。
- 测试清理检查 dist 与 dist/tests 是否为符号链接／非目录，输出限制在传入 root 下。本轮没有执行清理与实际构建，也不宣称形成抵抗文件系统竞态的安全边界。
- 资源验证检查必需文件的唯一性／非空、archive payload 大小／压缩方法、不期望的 archive frontend 文件，以及与本地构建的 SHA-256 一致性。没有打开实际样式表、图片或 archive。检查的是 JavaScript 包装逻辑，不是排除的 CSS 文件。
- Archive 和本地文件读取没有独立应用字节预算。inflate 输出以 ZIP metadata 声明的 size 为上限，而不是另行确定的资源预算。畸形／巨大 artifact 成本未测量，不是已演示资源耗尽。
- 同步 test／Git 执行没有库内单次 timeout。没有回查外层 CI 限制或测试 timeout 覆盖，不宣称当前已经卡死。
- 构建／调试配置仅作配置审查，不推导 compile、lint、F5、attach debugger、安装 VSIX 或最低宿主兼容性验收。

## 新增覆盖

本轮 13 个新文件均完整返回源码，下一轮排除。没有沿导出行为回查此前实现。

| 文件 | 覆盖 |
|---|---|
| [run-tests](../../scripts/testing/run-tests.mjs) | 入口与失败退出处理 |
| [test-runner-lib](../../scripts/testing/test-runner-lib.mjs) | 发现、清理、构建选项、子进程执行；隔离发现／执行检查 |
| [commit-check](../../scripts/testing/commit-check.mjs) | NUL 解析、分类、暂存检查、格式与 CLI 身份；mock Git 分类探针 |
| [verify-webview-assets-lib](../../scripts/packaging/verify-webview-assets-lib.mjs) | Archive／目录检查与 hash 对照；不读取真实资源 |
| [verify-webview-assets](../../scripts/packaging/verify-webview-assets.mjs) | CLI 参数、报告与失败退出 |
| [docs-verify](../../scripts/docs/docs-verify.mjs) | 报告组合与错误退出；不重新打开旧 i18n 实现 |
| [ESLint 配置](../../eslint.config.mjs) | Recommended rules、source glob 与明确的脚本排除 |
| [Vite 配置](../../vite.config.mts) | Preview root、生产入口、target 与输出约定 |
| [host TS 配置](../../tsconfig.json) | Node target／resolution、strictness 与排除 |
| [test TS 配置](../../tsconfig.tests.json) | 测试 include 与 ambient types |
| [Webview TS 配置](../../tsconfig.webview.json) | Browser typing、JSX 与排除 |
| [debug launch 配置](../../.vscode/launch.json) | Extension host launch／attach 与默认构建任务 |
| [build task 配置](../../.vscode/tasks.json) | npm compile 任务与 matcher |

## 验证

TOOL-01 与条件性 TSX 发现反例使用真实新 helper 代码复现。Git 与文件系统清单为 mock；esbuild runner 探针使用 write false、external dependencies 和单一 source 允许清单。没有实际测试子进程、构建、清理、pi、凭据、pi 配置或会话存储访问。没有运行新增仓库测试，没有修改应用文件。文档与进度一致性结果在交接回复报告。
