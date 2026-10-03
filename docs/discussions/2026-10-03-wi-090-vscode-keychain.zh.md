# WI-090 — 日常 VS Code 与隔离钥匙串诊断

[English](2026-10-03-wi-090-vscode-keychain.md) | 中文

- 翻译状态：Machine Draft
- 权威原文：[2026-10-03-wi-090-vscode-keychain.md](2026-10-03-wi-090-vscode-keychain.md)
- 原文版本：Uncommitted baseline
- 最近同步：2026-10-03
- Type: Discussion
- Status: Active
- Created: 2026-10-03
- Authority: 本轮用户请求的本地诊断及有界可逆修复，不授权OS安全／凭据变更
- Related: [ACTIVE](../../ACTIVE.md)、[协作](../guides/agent-collaboration.zh.md)、[此前八项交接](../archive/2026-10-03-eight-gap-goal.zh.md)

## Prepare与批准

用户要求确认日常VS Code版本并解决反复keychain not found。范围：实际安装／profile metadata、相关脱敏错误、只读default-keychain metadata、正常空窗口启动、既有隔离launcher safeguards。无pi功能扩张／包升级／日常扩展安装／付费调用／登录账户操作／凭据lookup-export／keychain重置删除解锁／持久OS安全或加密修改／forcequit授权。用户请求常规可逆修复；之前八切片localcommit授权不覆盖新项，本轮不创建新提交。

PRD纯技术诊断：不改产品行为／需求／protocol／dependency／trust边界；gate none、decision none。保护既有三个unstaged用户修改：ACTIVE pending分组、双语feature-gap。单Agent／唯一WI；此前Goal已complete，不重新打开。

修复前区分原始GUI症状与邻近错误，核对profile/process；实际package/product manifest版本不猜最新；Security metadata不访问item；真实HOME与新空HOME对照。预先失败方式：错profile证据、混淆default keychain缺失与credential item缺失、secret进入log、全局memory/plaintext掩盖日常持久化、破坏keychain、丢未保存内容、metadata复现冒充历史GUI。可观察验收：日常正常启动／有界日志native观察、可重复HOME对照、现launcher契约、诚实剩余条件。没有可重复当前失败路径前不提production code/test修改。

## 实际调查 — 2026年10月3日20:28–20:35（Asia/Shanghai）

源码ee99df0c81887d6c89112cf628289bb8c2c8b4ba；实际macOS27.0.1 arm64。日常VSCode actual app manifests：1.140.0 stable，commit07f806f999227108933c2e30515b26eecc1fda74。默认extension registration无pi-vscode，与此前不同extensions目录的隔离VSIX验收不冲突；未升级版本或安装日常pi。

起初无Code进程／窗口。security default-keychain/list-keychains -d user指向存在login keychain，show-keychain-info为no-timeout。只读公开SecKeychainCopyDefault/GetStatus均0，flags7（解锁／可读／可写）；仅证明当前default lookup/status，不证明所有credential内容／完整性／全部旧弹窗原因。未item lookup／unlock／系统setting。

真实只读A/B/A：同一security default-keychain -d user在真实HOME成功；新空HOME失败“A default keychain could not be found.”；回到真实HOME再次成功。是实际metadata环境敏感失败，不mock、不冒充原始GUI复现；未改keychain或读取credential item。

真实HOME以--new-window --skip-welcome --skip-release-notes启动普通空Code（PID58328），不secret/password override，不传环境凭据。native显示空workbench，无keychain/password sheet/dialog。latest日常log20261003T202803有一次正常builtin auth reading-keychain info，在有界扫描日志中相关error为0。之前十个日常log目录也只见reading-session info，未见原始error。账户扩展读取自有storage不等于Agent凭据lookup；未账户登录动作／采集secret。日常argv/settings无keychain/password override且不改；空日常窗口保留，不forcequit或改用户工作。

当前隔离native launchers用空合成HOME，该环境normal default-keychain lookup不可用。既有修复（resource launcher585bd06、后续native propagated）将memory-only SecretStorage传parent/F5 child/installed CLI/window，interactive fixtures禁用builtin GitHub/Microsoft账户扩展，避免测试缺keychain环境影响真实持久凭据；不等于system repair，不允许把password-store=basic／memory全局用于日常。七组launcher契约重新运行36pass／0fail，仅synthetic process/observer，不冒充新七项nativeUI认证；旧原生证据保留源码身份及限制。

## 工件、处置及剩余验收

本地ignored dist/keychain-diagnosis-2026-10-03保留default-keychain-metadata、daily-start、有界脱敏log summary、filtered native state、reproduce-readonly.cjs／A/B/A结果、36契约log和summary.json。运行node dist/keychain-diagnosis-2026-10-03/reproduce-readonly.cjs重复只读对照；是临时诊断工件非产品修改／新测试tier。记录后docs verify/health须跑；仅文档修改不要求compile/lint/fullbehavior。

**已确认：** 日常1.140.0当前正常启动、login keychain存在且default metadata成功、空测试HOME复现default keychain找不到、现隔离防护36契约通过。**未确认：** 原始dialog/app/source，以及所有反复GUI提示消除。已知启动环境触发由既有隔离防护处理，不凭空宣称新OS修复。当前证据不支持改system／credential／daily argv／productcode，未授权新localcommit。

WI090对原始反复GUI症状继续未完成。如exactprompt当前存在或再次出现，最小补充是该dialog脱敏截图（app/title/error，遮密码／账户）及发生时间／上下文（日常启动还是隔离F5/test）。此前不破坏性修keychain，不弱化credential persistence造成功。不宣称维护者亲测／本轮新的代理验收。


检查点：36focused launcher契约全部通过；docs:verify／health零error及两个既有ADR0010 warning。首次ACTIVE metadata缺required fields／section headings失败，只修新记录，首个失败log保留。无应用代码变化／commit／staging。针对近12h keychain-not-found的OS log query在20s timeout；只请求／保留metadata，不提权或退回广泛私人log。该query证据不可用，不证明历史系统错误不存在。原始GUI症状仍未验证。
