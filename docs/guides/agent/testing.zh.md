# 测试 Agent Playbook

[English](testing.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[testing.md](testing.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-23

- 类型：指南
- 状态：Accepted
- 创建：2026-09-21
- 权威：项目内测试组织、命名、收集与验证证据

## 何时加载

在修改行为、修复回归、添加或移动测试、修改测试收集／构建配置之前，阅读本指南。先检查受影响实现、现有测试和当前 `package.json` 脚本。本指南拥有测试文件策略；[TypeScript](typescript.zh.md) 拥有语言／工具链规则，[pi 集成](pi-integration.zh.md) 拥有运行时隔离规则。本指南不授权迁移测试框架或扩大当前任务。

## 所有权与文件位置

- 应用测试放在 `src/extension/`、`src/adapter/` 或 `src/webview/` 下的 `tests/` 目录。功能测试紧邻其模块（例如 `src/extension/draft/tests/`）；跨模块组合测试及共享宿主夹具保留在层级 `tests/`。`src/extension/bridge/webviewMessages.ts` 由 `src/extension/bridge/tests/webview-messages.spec.ts` 覆盖。不要引入 `src/__tests__/` 或仓库级混杂的 `test/` 目录。
- Node 脚本测试紧邻脚本，使用 `scripts/**/*.spec.mjs`。
- 使用 kebab-case 的模块或可观察行为名。一个测试文件可以覆盖跨模块的内聚行为，不强制源码与测试一一对应。
- 可复用初始化放在 `harness.ts` 或 `<subject>.test-support.ts` 等普通文件中，不放在另一个被收集的 `*.spec.ts` 中。导入测试文件可能再次注册和执行其用例。
- fixture 输入与预期输出放在测试所属位置（需要时使用所属区域内的 `fixtures/` 或 `expected/` 目录）。不要建立空基础设施目录。按预期行为审查预期输出变更，不能仅为让测试通过而重新生成。
- `dist/tests/` 是生成产物，不是测试源码。不要手改，也不能将陈旧 bundle 当作当前源码已执行的证据。

脚本按用途分组：`scripts/docs/` 负责文档检查及其辅助模块／配置；`scripts/testing/` 负责测试 runner 与收集辅助模块；`scripts/spikes/` 负责集成探针与项目信任辅助模块；`scripts/packaging/` 负责 VSIX 验证。`*.spec.mjs` 紧邻其覆盖的脚本。这些用途目录不再嵌套 `src/` 或 `tests/` 子目录；应用测试保留上述所属模块内布局。

## 命名与收集是一份约定

当前自动化 runner 是 `node:test`，不是 Vitest。应用测试使用 `*.spec.ts`，脚本测试使用 `*.spec.mjs`。后缀只有结合 runner 的实际收集规则才有意义；仅重命名文件不会创建测试层级。

`npm test` 调用 `scripts/testing/run-tests.mjs`，由可安全导入的 `scripts/testing/test-runner-lib.mjs` 提供支持。它从上述层级及模块内位置递归发现并排序确切的应用与脚本测试清单，跳过符号链接及名为 `fixtures` 或 `expected` 的目录，任一清单为空即失败。辅助文件与其他测试层级后缀不作为入口。

runner 只清理 `dist/tests/`，保留 `dist/` 下其他 bundle，再用 esbuild 打包应用 spec 并保留相对于源码根目录的层级：`src/extension/bridge/tests/webview-messages.spec.ts` 输出为 `dist/tests/extension/bridge/tests/webview-messages.spec.js`。它只将确切的编译输出清单与发现的脚本 spec 传给 `node:test`，cwd 为仓库根目录；陈旧 bundle 和宽泛输出 glob 不作为执行输入。构建或测试进程失败会使命令失败。

Webview 应用 spec 通过 `mountApp`、jsdom 和 synthetic bridge/host 挂载 React 前端。它们沿用浏览器预览使用的应用入口，检查 host projection、展示状态和命名出站 intent。已移除的内联字符串 VM harness 不属于当前测试路径；新的 Webview 行为应写在已挂载 React/jsdom 的 `*.spec.ts` 用例中。

类型／lint 范围从仓库配置核对；脚本 `.mjs` 当前不在 lint 范围。实际 CI 检查由 [workflow](../../../.github/workflows/ci.yml) 定义，不能从本地 runner 推断 CI 执行全部测试。

## 前端与打包检查

使用浏览器预览观察外观和交互，使用已挂载的 spec 检查可重复行为：

```bash
npm run preview:webview
npm run compile
npm test
npm run build:webview
npm run verify:webview
```

`npm run preview:webview` 使用 synthetic host fixture 提供 React 应用和浏览器热刷新；不会启动 pi，也不提供 VS Code 宿主证据。`npm run compile` 使用 esbuild 构建 extension host，使用 Vite 构建 Webview，并运行严格的 host、浏览器和测试 TypeScript 配置。`npm run watch` 监视 host/gate 构建并重建生产 Webview，与浏览器预览服务器分开。

`npm run build:webview` 将本地生产资源写入 `dist/webview`。`npm run verify:webview` 检查非空的静态 `webview.js` 和 `webview.css` 输出。使用 `npm run verify:webview -- path/to/pi-vscode.vsix` 传入 VSIX 路径后，还会检查归档内的 `extension/dist/webview/webview.js` 和 `extension/dist/webview/webview.css`。这些检查不会安装 VSIX、启动开发服务器或运行 pi；生产环境必须在没有开发服务器时加载打包的本地资源。

添加、移动或重命名测试之前：

1. 明确所有者与证据层级。
2. 检查源码文件是否被构建、适用的类型／lint 检查以及测试收集覆盖。
3. 若需修改收集规则，将必要且有界的 runner／配置变更纳入已批准任务；否则将漏收集报告为阻塞，不能宣称已经覆盖。
4. 执行相关命令并确认新增用例确实运行。确保删除或重命名的测试不会继续从陈旧生成产物中执行。

后续测试移动与重命名仍须限定范围，同时更新收集与验证。下面的后缀分类不授权新增层级或切换到 Vitest。

## 测试后缀与新增层级

目录表示归属，后缀表示证据类别，runner 决定实际执行。**当前只收集普通 `.spec`**；其余行仅在提议新层级时适用，不授权创建空目录或新套件。

| 后缀 | 含义与启用边界 |
|------|----------------|
| `*.spec.ts`／`*.spec.mjs` | 模块行为或受控多模块组合；当前 `npm test` 收集。已挂载的 React/jsdom Webview spec、host 测试和窄 provider seam 属于此类；spec 不限于单函数，也不要求 Vitest。 |
| `*.e2e.ts` | 经过声明的真实入口，验证外部可观察结果；说明哪个入口真实、哪些服务被替换。RPC 证据不证明 VS Code UI，e2e 也不意味着付费调用。引入时使用 `.e2e.ts`，不使用 `.e2e.test.ts`。拟议 `test:e2e` 尚不存在，收集须与默认 spec 分离。 |
| `*.expected.e2e.ts` | 组装进程／CLI 与所属位置的已审查预期输出比较，不是会话回放；`*.expected.json` 是数据。此后缀也匹配 `.e2e.ts`，引入独立套件时须从一般 e2e 排除。普通 spec 的黄金断言本身不构成 e2e。 |
| `*.snapshot.ts` | 预留给录制会话回放，不泛指快照断言或截图。启用须独立设计公开 API、录制／回放、密钥处理及 fixture 审查；不能复制 pi 会话存储内部格式或直接搬入外部语料目录。 |
| `*.bench.ts`／`*.perf.ts` | 分别预留给有失败阈值的性能预算与非门禁诊断；声明负载、环境和测量。两者均未启用，也不属于默认行为测试。 |

`.host.spec.ts`／`.client.spec.ts`／`.compat.spec.ts` 可用于明确被测端或兼容主题，仍是普通 spec；`.bench.client.ts`／`.perf.client.ts` 仅限定性能主题。限定词不会自动提供 Node、DOM 或浏览器环境。共享初始化使用普通 helper，不导入被收集的测试。

### 新层级的完成条件

1. 同一次已批准变更包含代表用例、真实 runner 命令及明确包含／排除规则，并同步本指南；未来命令继续标为未启用。
2. 前置条件覆盖依赖、构建产物、真实入口、凭证策略、超时和清理。付费调用仍需明确授权。
3. 验证递归发现、helper 排除、后缀重叠、旧产物与失败退出码；目标用例确实运行且未重复注册。
4. 分开报告通过、失败、跳过和不可用。缺少前置条件时按通道约定失败或显式跳过；全跳过不算验收通过。

## 证据层级与安全

- **自动化测试（`npm test`）：** 可重复、无密钥的行为与回归检查。优先使用真实且确定的实现，只替换 VS Code API、进程、时钟、RPC 和浏览器 host 边界等窄外部接口。已挂载的 React/jsdom Webview spec 覆盖 projection、交互与清理，但不声称证明浏览器布局或 VS Code 宿主行为。覆盖相关畸形输入、错误、取消、迟到完成、代次变化与资源清理。断言可观察输出与副作用，而不只是 mock 调用次数或复刻实现的字符串。
- **运行时／项目信任探针（`spike:*`）：** 遵循 [pi 集成指南](pi-integration.zh.md) 的显式、隔离集成证据。mock RPC 测试不能证明已安装 pi 进程具有相同行为。
- **手工宿主验收（F5）：** 真实扩展生命周期与 Webview 交互，包括适用的键盘、焦点、主题和失败行为。HTML／CSP 断言与脚本化 UI 测试有价值，但不能证明真实宿主渲染或交互正确。

Node 测试 harness 与 Webview 运行时代码保持分离：测试宿主 HTML builder 不代表允许 Webview 访问 Node 或 pi。保持 host／adapter／UI 所有权；跨层行为测试不授权改变生产依赖。

自动化测试不要使用真实用户状态、秘密、不可控网络调用或付费模型 API。付费调用例外须按[贡献指南](../../../CONTRIBUTING.zh.md) 获得维护者明确授权。临时目录、监听器、子进程在成功与失败时都应清理；避免共享可预测路径或以固定等待作为同步。不要将 pi 会话存储内部细节复制到测试基础设施。

## Agent 收尾检查

- 说明哪些变更行为由哪些文件与命令覆盖。无需新增行为测试时解释原因（例如纯文档变更）。
- 分别报告已执行、跳过和未验证的检查。明确缺少的前置条件与待 F5 验收；mock、探针和手工检查不能互相冒充。
- 按[贡献指南](../../../CONTRIBUTING.zh.md)选择适用命令，并核对实际收集清单；命令成功不能证明未收集的测试运行过。
- 测试布局或收集规则获批变更时，同步更新本指南及译文。临时结果放在现有交接，不写入本策略。测试通过不代表产品需求已验收或架构 gate 已关闭。

## 采用范围

维护者于 2026-09-21 批准 playbook 加加载地图方案。本指南借鉴 [DeepSeek Harness 测试策略](https://github.com/Hex4C59/deepseek-harness/blob/master/docs/testing.md) 的所有权、显式收集与证据分层，不迁移其 monorepo 布局、runner、付费 API 策略、会话快照基础设施或逐文件 100% 覆盖率门禁。

历史说明：最初的纯文档采用保留了紧邻源码的 `*.test.ts`、脚本 `*.test.mjs` 与仅覆盖平面 extension 测试的收集命令，其中包含旧的内联字符串 VM Webview harness。随后获批的 WI-011 迁移实现了上述模块内 `.spec` 布局与递归 runner；WI-015 用已挂载的 React/jsdom spec 替换该 Webview harness，同时保留 `node:test` 和 esbuild，不启用额外证据层级。
