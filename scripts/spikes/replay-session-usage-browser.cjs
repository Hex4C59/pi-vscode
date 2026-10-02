const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const { chromium } = require('/Users/hex4c59/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js');
(async () => {
  const output = path.resolve('dist/wi079-session-usage'); await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const cases = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
    await page.goto(`http://127.0.0.1:5189/@fs${path.resolve('scripts/spikes/session-usage-browser.html')}`);
    await page.emulateMedia({ reducedMotion: 'reduce' }); await page.locator('textarea').waitFor();
    for (const width of [280, 320, 400]) for (const theme of ['dark', 'light', 'high-contrast']) for (const locale of ['en', 'zh-CN']) {
      await page.evaluate(({ width, theme, locale }) => { document.getElementById('app').style.width = `${width}px`; document.documentElement.dataset.theme = theme; window.usageLanguage.select(locale); }, { width, theme, locale });
      const usageLabel = locale === 'en' ? 'Usage' : '用量';
      const refreshLabel = locale === 'en' ? 'Refresh usage' : '刷新用量';
      const closeLabel = locale === 'en' ? 'Close usage' : '关闭用量';
      await page.locator('textarea').fill('browser unsent draft');
      await page.locator('#model-effort-trigger').click();
      const trigger = page.getByRole('button', { name: usageLabel, exact: true });
      await trigger.click();
      const panel = page.getByRole('dialog', { name: usageLabel, exact: true }); await panel.waitFor();
      assert.equal(await page.locator('#model-popover').isVisible(), false);
      assert.match(await panel.textContent(), /321/); assert.match(await panel.textContent(), /2[, ]?110/); assert.match(await panel.textContent(), /0\.000157/);
      assert.equal(await trigger.evaluate(e => e.scrollWidth <= e.clientWidth), true, 'Usage label must fit');
      assert.equal(await page.getByRole('button', { name: closeLabel, exact: true }).evaluate(e => getComputedStyle(e).borderRadius), '6px');
      const geometry = await page.evaluate(() => {
        const candidate = document.querySelector('.candidate'), panel = document.querySelector('.session-usage__panel'), composer = document.querySelector('.candidate__composer');
        const p = panel.getBoundingClientRect(), c = composer.getBoundingClientRect();
        return { candidateWidth: candidate.getBoundingClientRect().width, panelTop: p.top, panelBottom: p.bottom, composerTop: c.top,
          candidateOverflow: candidate.scrollWidth > candidate.clientWidth, panelOverflow: panel.scrollWidth > panel.clientWidth };
      });
      assert.equal(geometry.candidateOverflow, false); assert.equal(geometry.panelOverflow, false); assert.ok(geometry.panelTop >= 0); assert.ok(geometry.panelBottom <= geometry.composerTop);
      await page.getByRole('button', { name: refreshLabel, exact: true }).click();
      assert.equal(await page.locator('textarea').inputValue(), 'browser unsent draft');
      assert.equal(await page.evaluate(() => window.usageEvidence.prompts), 0);
      const image = `browser-${width}-${theme}-${locale}.png`; await page.locator('.candidate').screenshot({ path: path.join(output, image) });
      await panel.press('Escape'); assert.equal(await panel.count(), 0); assert.equal(await trigger.evaluate(e => e === document.activeElement), true);
      await trigger.press('Enter'); await panel.waitFor(); await page.getByRole('button', { name: closeLabel, exact: true }).click();
      assert.equal(await trigger.evaluate(e => e === document.activeElement), true);
      cases.push({ width, theme, locale, image, ...geometry, refreshPreservedDraft: true, popupExclusive: true, keyboardFocusReturned: true });
    }
    await fs.writeFile(path.join(output, 'browser-matrix.json'), JSON.stringify({ status: 'passed', evidence: 'installed-Chrome-mounted-production-composition', cases,
      limits: ['synthetic bridge and numbers', 'not native F5 or installed VSIX', 'no paid provider'] }, null, 2));
    console.log(`PASS ${cases.length} production UI browser cases`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
