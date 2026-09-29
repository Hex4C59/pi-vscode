# ADR 0005：在 models.json 中保存自定义 OpenAI 兼容端点

[English](0005-custom-endpoint-file.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[0005-custom-endpoint-file.md](0005-custom-endpoint-file.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-09-29

- 类型：ADR
- 状态：Draft
- 创建：2026-09-29
- 决定批准：2026-09-29，维护者确认 WI-030 实施计划
- 验证：维护者于 2026-09-29 确认设置页登录与添加端点。此前记录的 compile、lint、测试和文档检查本次未重跑。真实浏览器登录、真实端点调用和新的安装包仍未记录，因此本 ADR 保持 Draft。
- Gate：无。既有 `gate-webview-trust` 仍然适用：密钥不进入 Webview。
- 工作项：WI-030

## 背景

WI-024 通过公开的 `ModelRuntime.login` 把 API key 写入 pi 的 auth 存储，并把 OAuth 与自定义端点留在范围外。pi 0.86.1 把自定义 OpenAI 兼容供应商记录在 `~/.pi/agent/models.json`，并由 `ModelRuntime.refresh()` 重新加载。已安装的包没有该文件的公开写入 API。`ModelConfig` 只负责加载。

内置供应商的 OAuth 沿用与 API key 相同的 `login(..., "oauth")`，不是新的存储。

## 决定

1. **OAuth 使用现有登录。** 供应商公开 `auth.oauth.login` 时，宿主调用 `ModelRuntime.login(providerId, "oauth", interaction)`。宿主只打开不含用户信息的 http(s) 链接，在原生提示中显示设备码，不把令牌、验证码或授权 URL 放进 Webview 或日志。
2. **单一端点写入者。** 扩展宿主是产品里向 pi `models.json` 写入自定义端点的唯一写入者。每条记录为 `api: "openai-completions"`，加上显示名称、Base URL 和一个模型 id。不写 `apiKey`、请求头、shell 命令或环境变量插值。API key 仍经 `ModelRuntime.login(..., "api_key")` 进入 auth 存储。
3. **合并或拒绝。** 文件不存在时可以创建。安全的 JSON 对象在保留其他供应商的前提下重写。不是安全 JSON、超过 1 MiB，或某个供应商值不是对象的文件保持不变。不添加或删除内置供应商 id。删除只从该文件去掉一个非内置供应商对象，然后登出该供应商。

## 理由

RPC 子进程自行加载 `models.json`。只在内存里 `registerProvider` 无法在子进程或下次宿主启动后保留。写入文档化的文件、并且不把密钥写进去，保留单一凭据权威，也不重写 pi 的供应商栈。

## 考虑过的替代方案

- 继续让用户手工编辑该文件：维护者要求完成这项设置任务，因此不采用。
- 把 API key 写入 `models.json`：WI-024 已把密钥放在 pi auth 存储并排除在 Webview 之外，因此不采用。
- 平行 SecretStorage：WI-024 已拒绝，本次不变。
- 覆盖全部 API、请求头和兼容开关的完整 `models.json` 编辑器：不属于本切片。

## 影响

重写有效文件会改变 JSON 排版并丢掉注释，因为带注释的文件不能用 `JSON.parse` 安全地往返。仅含注释或无效的文件不会被重写。在记录真实浏览器登录和真实端点调用之前，本 ADR 保持 Draft。维护者确认设置页控件已关闭 WI-030；这不接受任何 gate。
