import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PI_RENAME_PLAYWRIGHT ?? '/Users/hex4c59/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js');
const root = process.cwd(), output = path.join(root, 'dist/wi080');

async function mount(page, theme, locale) {
  await page.goto('http://127.0.0.1:5190/navigation-review.html?panel=true');
  await page.evaluate(async ({ root, theme, locale }) => {
    await import(`/@fs/${root}/src/webview/styles.css`); await import(`/@fs/${root}/src/webview/preview/preview.css`);
    const { mountChat, createUiLanguage } = await import(`/@fs/${root}/src/webview/chat/index.ts`);
    document.documentElement.dataset.theme = theme; document.body.innerHTML = '<div id="rename-root" style="height:100vh;display:flex"></div>';
    const listeners = new Set(), sent = [], envelope = { version: 3, viewId: 'rename-browser', generation: 1 };
    const state = { ...envelope, type: 'workspaceState', status: 'eligible', folder: { name: 'fixture', path: '/synthetic' }, choice: 'allow', busy: false, error: null,
      runtime: 'ready', runtimeDetail: null, messages: [{ role: 'user', text: 'Historical literal body' }, { role: 'assistant', text: 'Literal assistant body' }],
      chatBusy: false, chatError: null, chatModel: 'Synthetic model', thinkingLevel: 'off', thinkingLevels: ['off'], availableModels: [], pendingModel: null,
      pendingThinkingLevel: null, modelBusy: false, modelError: null, activities: [], approvals: [], grants: [], execution: 'idle', controlledExecution: true };
    let name = locale === 'zh-CN' ? '当前会话的长标题：检查重命名、键盘焦点和窄侧栏下的完整呈现' : 'Current conversation with a deliberately long title for narrow sidebar rename and keyboard focus';
    const session = () => ({ ...envelope, type: 'sessionState', phase: 'idle', loaded: true, error: null, page: 0, total: 1, current: { id: 'live', name },
      entries: [{ id: 'opaque-current', title: name.slice(0, 160), excerpt: 'Historical literal body', modified: '2026-10-02' }] });
    const receive = message => { for (const listener of listeners) listener(message); };
    const bridge = { subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }, postMessage(message) {
      sent.push(message);
      if (message.type === 'getWorkspaceState') queueMicrotask(() => {
        receive({ ...envelope, type: 'attachmentState', draft: { revision: 0, text: '', acceptedEditSequence: 0, attachments: [] }, preparation: 'idle', result: null, historyCount: 0, retainedBytes: 0, lastSubmission: null });
        receive(state); receive(session()); receive({ ...envelope, type: 'sessionRenameState', revision: 1, status: 'ready' });
      });
      if (message.type === 'renameSession') {
        receive({ ...envelope, type: 'sessionRenameState', revision: 2, status: 'renaming' });
        setTimeout(() => { name = locale === 'zh-CN' ? '已验证的新名称' : 'Verified new name'; receive(session()); receive({ ...envelope, type: 'sessionRenameState', revision: 3, status: 'ready' }); }, 80);
      }
    } };
    const language = createUiLanguage(); language.select(locale);
    mountChat(document.getElementById('rename-root'), bridge, { language });
    window.renameEvidence = { sent, receive, envelope, session };
  }, { root, theme, locale });
}

async function inspectCase(page, width, theme, locale) {
  await page.setViewportSize({ width, height: 600 }); await mount(page, theme, locale);
  const rename = page.locator('button[aria-label="' + (locale === 'zh-CN' ? '重命名当前对话' : 'Rename current conversation') + '"]');
  await rename.waitFor(); await page.locator('textarea').fill('Preserve browser draft');
  await rename.focus();
  const geometry = await rename.evaluate(button => ({ overflow: document.querySelector('.candidate').scrollWidth > document.querySelector('.candidate').clientWidth,
    ellipsis: getComputedStyle(button).textOverflow, focus: document.activeElement === button, outline: getComputedStyle(button).outlineStyle,
    width: button.getBoundingClientRect().width }));
  assert.equal(geometry.overflow, false); assert.equal(geometry.ellipsis, 'ellipsis'); assert.equal(geometry.focus, true);
  const image = `browser-${width}-${theme}-${locale}.png`; await page.locator('.candidate').screenshot({ path: path.join(output, image) });
  await rename.press('Enter'); await page.waitForFunction(() => !document.querySelector('.candidate__current')?.disabled);
  assert.equal(await page.locator('textarea').inputValue(), 'Preserve browser draft');
  assert.match(await page.locator('.candidate__messages').innerText(), /Historical literal body/);
  const intent = await page.evaluate(() => window.renameEvidence.sent.find(message => message.type === 'renameSession'));
  assert.deepEqual(Object.keys(intent).sort(), ['generation', 'type', 'version', 'viewId']);
  const current = await rename.textContent(); assert.equal(current, locale === 'zh-CN' ? '已验证的新名称' : 'Verified new name');
  await page.evaluate(() => { const f = window.renameEvidence; f.receive({ ...f.envelope, type: 'sessionRenameState', revision: 4, status: 'renaming' }); });
  assert.equal(await rename.isDisabled(), true);
  assert.equal(await page.locator('button[aria-label="' + (locale === 'zh-CN' ? '新建对话' : 'New conversation') + '"]').isDisabled(), true);
  return { width, theme, locale, image, ...geometry, keyboardRename: true, draftRetained: true, bodyRetained: true, payloadFree: true };
}

await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.PI_RENAME_CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
try {
  const page = await browser.newPage(); await page.emulateMedia({ reducedMotion: 'reduce' });
  const cases = [];
  for (const width of [280, 320, 400]) for (const theme of ['dark', 'light', 'high-contrast']) for (const locale of ['en', 'zh-CN']) cases.push(await inspectCase(page, width, theme, locale));
  await fs.writeFile(path.join(output, 'browser-matrix.json'), JSON.stringify({ schemaVersion: 1, status: 'passed', cases,
    evidence: 'installed Chrome; real production mountChat; external synthetic bridge', limits: ['No native input', 'Not F5', 'Not installed VSIX'] }, null, 2));
  console.log(`Passed ${cases.length} rename browser cases`);
} finally { await browser.close(); }
