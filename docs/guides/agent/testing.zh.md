# 测试 Agent Playbook

[English](testing.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[testing.md](testing.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-21

- 类型：指南
- 状态：Accepted
- 创建：2026-09-21
- 权威：项目内测试组织、命名、收集与验证证据

## 何时加载

在修改行为、修复回归、添加或移动测试、修改测试收集／构建配置之前，阅读本指南。先检查受影响实现、现有测试和当前 `package.json` 脚本。本指南拥有测试文件策略；[TypeScript](typescript.zh.md) 拥有语言／工具链规则，[pi 集成](pi-integration.zh.md) 拥有运行时隔离规则。本指南不授权迁移测试框架或扩大当前任务。

## 所有权与文件位置

- 应用测试放在所属模块的 `tests/` 目录：`src/extension/tests/**/*.spec.ts`、`src/adapter/tests/**/*.spec.ts` 或 `src/webview/tests/**/*.spec.ts`。生产源码保持原位；例如 `src/extension/webviewMessages.ts` 由 `src/extension/tests/webview-messages.spec.ts` 覆盖。不要引入 `src/__tests__/` 或仓库级混杂的 `test/` 目录。
- Node 脚本测试紧邻脚本，使用 `scripts/**/*.spec.mjs`。
- 使用 kebab-case 的模块或可观察行为名。一个测试文件可以覆盖跨模块的内聚行为，不强制源码与测试一一对应。
- 可复用初始化放在 `harness.ts` 或 `<subject>.test-support.ts` 等普通文件中，不放在另一个被收集的 `*.spec.ts` 中。导入测试文件可能再次注册和执行其用例。
- fixture 输入与预期输出放在测试所属位置（需要时使用所属区域内的 `fixtures/` 或 `expected/` 目录）。不要建立空基础设施目录。按预期行为审查预期输出变更，不能仅为让测试通过而重新生成。
- `dist/tests/` 是生成产物，不是测试源码。不要手改，也不能将陈旧 bundle 当作当前源码已执行的证据。

脚本按用途分组：`scripts/docs/` 负责文档检查及其辅助模块／配置；`scripts/testing/` 负责测试 runner 与收集辅助模块；`scripts/spikes/` 负责集成探针与项目信任辅助模块；`scripts/packaging/` 负责 VSIX 验证。`*.spec.mjs` 紧邻其覆盖的脚本。这些用途目录不再嵌套 `src/` 或 `tests/` 子目录；应用测试保留上述所属模块内布局。

## 命名与收集是一份约定

当前自动化 runner 是 `node:test`，不是 Vitest。应用测试使用 `*.spec.ts`，脚本测试使用 `*.spec.mjs`。后缀只有结合 runner 的实际收集规则才有意义；仅重命名文件不会创建测试层级。

`npm test` 调用 `scripts/testing/run-tests.mjs`，由可安全导入的 `scripts/testing/test-runner-lib.mjs` 提供支持。它从上述所属位置递归发现并排序确切的应用与脚本测试清单，跳过符号链接及名为 `fixtures` 或 `expected` 的目录，任一清单为空即失败。辅助文件与其他测试层级后缀不作为入口。

runner 只清理 `dist/tests/`，保留 `dist/` 下其他 bundle，再用 esbuild 打包应用 spec 并保留相对于源码根目录的层级：`src/extension/tests/webview-messages.spec.ts` 输出为 `dist/tests/extension/tests/webview-messages.spec.js`。它只将确切的编译输出清单与发现的脚本 spec 传给 `node:test`，cwd 为仓库根目录；陈旧 bundle 和宽泛输出 glob 不作为执行输入。构建或测试进程失败会使命令失败。

现有 TypeScript 与 lint 配置已覆盖嵌套的 `src/**/*.ts`；脚本 `.mjs` 仍不在 lint 范围内。CI 保持现有 compile／lint 与显式文档 spec 检查；本次迁移不把 `npm test` 加入 CI，也不新增矩阵。

添加、移动或重命名测试之前：

1. 明确所有者与证据层级。
2. 检查源码文件是否被构建、适用的类型／lint 检查以及测试收集覆盖。
3. 若需修改收集规则，将必要且有界的 runner／配置变更纳入已批准任务；否则将漏收集报告为阻塞，不能宣称已经覆盖。
4. 执行相关命令并确认新增用例确实运行。确保删除或重命名的测试不会继续从陈旧生成产物中执行。

后续测试移动与重命名仍须限定范围，同时更新收集与验证。下面的后缀分类不授权新增层级或切换到 Vitest。

## 测试后缀分类与启用状态

目录表示归属，后缀表示证据类别，runner 配置决定实际执行。已实现的布局是在模块内部使用 `src/extension/tests/`、`src/adapter/tests/` 与 `src/webview/tests/`，生产文件保持原位，脚本测试仍紧邻脚本。未来端到端套件可以共用所属模块的目录，但当前只收集普通 spec。不要建立空基础设施目录。

### 普通测试：`*.spec.ts` / `*.spec.mjs`

它们替代 `*.test.ts` / `*.test.mjs`，覆盖模块行为与受控的多模块组合。使用 kebab-case 的模块或行为名，例如 `webview-messages.spec.ts` 或 `model-selection.spec.ts`。优先使用确定的真实实现，可以 mock 窄外部接口；spec 不限于只测一个函数。

`npm test` 收集这些文件，不需要密钥，不调用付费模型。`.spec` 后缀不要求 Vitest：`node:test` 执行显式传入的已编译 spec 文件。现有 mock provider 与基于 VM 的 Webview 脚本测试属于此类，而非浏览器 e2e。

### 端到端：`*.e2e.ts`

验证明确的真实入口路径，例如真实 pi 子进程或 VS Code 测试宿主，并断言外部可观察结果。未来的 `runtime-startup.e2e.ts` 可以不调用模型，仅验证启动。e2e 不意味着付费模型调用，也不证明所有产品界面：RPC 进程证据不能证明 VS Code UI 正确。应说明哪个入口是真实的，以及是否替换了哪些外部服务。

引入该层级时使用 `.e2e.ts`，不再使用此前建议的 `.e2e.test.ts`。拟议命令为 `npm run test:e2e`，当前尚不存在。其收集器必须与默认 spec 分离，并记录构建／运行前置条件、超时、隔离与清理。现有 `spike:*` 脚本与手工 F5 检查保持各自证据身份；仅重命名不能建立自动化 e2e 套件。

### 所属位置的预期输出：`*.expected.e2e.ts`

在 DeepSeek Harness 中，此后缀表示不依赖录制会话回放的组装进程／CLI 预期输出测试。驱动执行行为，与所属区域附近（通常是 `tests/expected/`）提交的输出比较。`*.expected.json` 等预期数据文件用于对比，不是可执行测试。普通 spec 也可以断言黄金输出，仅此并不构成 e2e。

本仓尚未启用此层级。如果将其引入为独立套件，须定义命令并从通用 e2e 收集器中排除：`*.expected.e2e.ts` 同样匹配 `*.e2e.ts`。每个文件必须有明确的预期执行套件，不能意外重复执行。

### 录制会话回放：`*.snapshot.ts`

DeepSeek Harness 将此后缀保留给录制会话驱动的回放，并非所有含快照断言或截图的测试。本仓没有此类套件。不要复制其顶层会话语料目录或 pi 会话文件内部细节。引入回放基础设施需要独立获批设计、文档化公开 API、录制／回放规则、秘密处理与经审查的 fixture 更新。

### 性能：`*.bench.ts` / `*.perf.ts`

参考仓库用 `.bench.ts` 表示性能预算／门禁，用 `.perf.ts` 表示默认测试清单之外的诊断性性能运行。本仓两者均未启用。未来基准须定义负载、环境、指标和失败阈值；诊断须明确其不是门禁。不能仅因宽泛 glob 匹配就把它们纳入默认行为测试。

### 可选主题限定词与辅助文件

- `.host.spec.ts` / `.client.spec.ts` 标明被测端，`.compat.spec.ts` 标明兼容性行为；它们仍是普通 spec。限定词不会自动选择 Node、DOM 环境或浏览器，运行环境须由初始化与 runner 配置提供。只有实际存在需要澄清的区别时才使用限定词。
- `.bench.client.ts` / `.perf.client.ts` 同样是在参考仓库中限定客户端性能主题，不代表本仓已有执行能力。
- `harness.ts`、fixture 辅助模块与预期数据不得被收集为测试入口。不要导入被收集的 `.spec.ts` 或 `.e2e.ts` 来共享初始化。

### 新层级启用前的要求

1. 同一次已批准变更中加入真实代表用例、runner 命令及显式包含／排除规则。更新本指南的状态与命令，不能将未来命令宣传为已可用。
2. 声明依赖、构建产物、被测入口、凭证策略、超时与资源清理。即使是 e2e，付费调用仍须维护者明确批准。
3. 检查递归发现、辅助文件排除、后缀重叠、陈旧生成产物与失败退出码。确认目标用例实际运行且没有重复注册。
4. 分别报告通过、失败、跳过与不可用的证据。定义缺少前置条件时是让必需测试通道失败，还是明确跳过可选测试；全部跳过的套件不能视为验收通过。

当前只启用普通 spec 层级。其他后缀仅定义含义与启用要求：未安装 `test:e2e`、预期输出、快照或性能命令。

## 证据层级与安全

- **自动化测试（`npm test`）：** 可重复、无密钥的行为与回归检查。优先使用真实且确定的实现，只替换 VS Code API、进程、时钟、RPC 等窄外部接口。覆盖相关畸形输入、错误、取消、迟到完成、代次变化与资源清理。断言可观察输出与副作用，而不只是 mock 调用次数或复刻实现的字符串。
- **运行时／项目信任探针（`spike:*`）：** 遵循 [pi 集成指南](pi-integration.zh.md) 的显式、隔离集成证据。mock RPC 测试不能证明已安装 pi 进程具有相同行为。
- **手工宿主验收（F5）：** 真实扩展生命周期与 Webview 交互，包括适用的键盘、焦点、主题和失败行为。HTML／CSP 断言与脚本化 UI 测试有价值，但不能证明真实宿主渲染或交互正确。

Node 测试 harness 与 Webview 运行时代码保持分离：测试宿主 HTML builder 不代表允许 Webview 访问 Node 或 pi。保持 host／adapter／UI 所有权；跨层行为测试不授权改变生产依赖。

自动化测试不要使用真实用户状态、秘密、不可控网络调用或付费模型 API。付费调用例外须按[贡献指南](../../../CONTRIBUTING.zh.md) 获得维护者明确授权。临时目录、监听器、子进程在成功与失败时都应清理；避免共享可预测路径或以固定等待作为同步。不要将 pi 会话存储内部细节复制到测试基础设施。

## Agent 收尾检查

- 说明哪些变更行为由哪些文件与命令覆盖。无需新增行为测试时解释原因（例如纯文档变更）。
- 分别报告已执行、跳过和未验证的检查。明确缺少的前置条件与待 F5 验收；mock、探针和手工检查不能互相冒充。
- 使用当前仓库命令：相关的 `npm test`、`npm run compile`、`npm run lint`；文档变更运行 `npm run docs:verify`，协作收尾／维护规则要求时运行 `npm run docs:health`。检查实际范围；命令成功不能证明未被收集的测试已经运行。
- 测试布局或收集规则获批变更时，同步更新本指南及译文。临时结果放在现有交接，不写入本策略。测试通过不代表产品需求已验收或架构 gate 已关闭。

## 采用范围

维护者于 2026-09-21 批准 playbook 加加载地图方案。本指南借鉴 [DeepSeek Harness 测试策略](https://github.com/Hex4C59/deepseek-harness/blob/master/docs/testing.md) 的所有权、显式收集与证据分层，不迁移其 monorepo 布局、runner、付费 API 策略、会话快照基础设施或逐文件 100% 覆盖率门禁。

历史说明：最初的纯文档采用保留了紧邻源码的 `*.test.ts`、脚本 `*.test.mjs` 与仅覆盖平面 extension 测试的收集命令。随后获批的 WI-011 迁移实现了上述模块内 `.spec` 布局与递归 runner，保留 `node:test` 和 esbuild，不启用额外证据层级。
