// In-memory visual specimens only. No extension bridge, storage or model calls.
const $ = (id) => document.getElementById(id);
const initial = { specimen: 'composer', width: 400, height: 480, shortcut: 'Enter', theme: 'dark', language: 'zh', guides: true, long: false, popup: null, model: 'Model A', effort: 2, usage: true, follow: 'queue', permission: 'ask', selected: 0, draft: '', message: '' };
let state = { ...initial };
const query = new URLSearchParams(location.search);
for (const [key, allowed] of Object.entries({ specimen: ['composer', 'settings', 'history'], width: ['280', '320', '400'], height: ['480', '640'], theme: ['dark', 'light', 'contrast'], language: ['zh', 'en'], popup: ['add', 'permission', 'effort', 'models', 'settings-menu'] })) {
  if (allowed.includes(query.get(key))) state[key] = ['width', 'height'].includes(key) ? Number(query.get(key)) : query.get(key);
}
if (query.get('long') === 'true') state.long = true;
if (query.get('guides') === 'false') state.guides = false;
let trigger = state.popup === 'models' ? 'effort' : state.popup;
// Lucide geometry; originals, pinned source and license: assets/icons/lucide/.
const paths = {
  "plus": "<path d=\"M5 12h14\" />\n  <path d=\"M12 5v14\" />",
  "down": "<path d=\"m6 9 6 6 6-6\" />",
  "right": "<path d=\"m9 18 6-6-6-6\" />",
  "back": "<path d=\"m12 19-7-7 7-7\" />\n  <path d=\"M19 12H5\" />",
  "send": "<path d=\"m5 12 7-7 7 7\" />\n  <path d=\"M12 19V5\" />",
  "history": "<circle cx=\"12\" cy=\"12\" r=\"10\" />\n  <path d=\"M12 6v6l4 2\" />",
  "settings": "<path d=\"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915\" />\n  <circle cx=\"12\" cy=\"12\" r=\"3\" />",
  "search": "<path d=\"m21 21-4.34-4.34\" />\n  <circle cx=\"11\" cy=\"11\" r=\"8\" />",
  "file": "<path d=\"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z\" />\n  <path d=\"M14 2v5a1 1 0 0 0 1 1h5\" />",
  "shield": "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\" />\n  <path d=\"m9 12 2 2 4-4\" />",
  "check": "<path d=\"M20 6 9 17l-5-5\" />",
  "close": "<path d=\"M18 6 6 18\" />\n  <path d=\"m6 6 12 12\" />",
  "keyboard": "<path d=\"M10 8h.01\" />\n  <path d=\"M12 12h.01\" />\n  <path d=\"M14 8h.01\" />\n  <path d=\"M16 12h.01\" />\n  <path d=\"M18 8h.01\" />\n  <path d=\"M6 8h.01\" />\n  <path d=\"M7 16h10\" />\n  <path d=\"M8 12h.01\" />\n  <rect width=\"20\" height=\"16\" x=\"2\" y=\"4\" rx=\"2\" />"
};
const icon = (name) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name] || paths.file}</svg>`;
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const t = (zh, en) => state.language === 'zh' ? zh : en;
const pin = (number) => `<span class="guide-pin" aria-hidden="true">${number}</span>`;
const action = (name, label, glyph) => `<button class="icon-button" data-action="${name}" aria-label="${label}" title="${label}" ${['add', 'settings-menu'].includes(name) ? `aria-expanded="${state.popup === name}"` : ''}>${icon(glyph)}</button>`;
const names = () => [t('改进插件 UI 设计审美', 'Refine the sidebar components'), t('修复无文件夹时的选择控件', 'Fix selectors without a folder'), t('调整历史列表与搜索区域', 'Align the history and search area'), t('检查模型选择器的键盘操作', 'Check keyboard model selection'), t('梳理当前仓库用途', 'Explore the repository'), t('整理设置页分组', 'Group the interface settings'), t('检查窄侧栏布局', 'Check the narrow sidebar layout'), t('改善长会话标题的显示', 'Improve long conversation titles'), t('实现输入框的附件预览', 'Add attachment previews'), t('验证浅色与高对比主题', 'Verify light and contrast themes'), t('对齐图标与文字基线', 'Align icons and text baselines'), t('检查历史会话空状态', 'Check empty history')];

function header() {
  const title = state.specimen === 'composer' ? t('新会话', 'New conversation') : state.specimen === 'settings' ? t('界面设置', 'Interface settings') : t('历史会话', 'Recent chats');
  return `<header class="surface-header">${state.specimen !== 'composer' ? action('back', t('返回', 'Back'), 'back') : ''}<strong>${title}</strong><div class="header-actions">${action('history', t('历史会话', 'Recent chats'), 'history')}${action('settings-menu', t('设置', 'Settings'), 'settings')}${action('new', t('新建会话', 'New conversation'), 'plus')}</div>${pin(1)}</header>`;
}
function row(label, glyph, detail = '', attrs = '') {
  return `<button class="menu-row" ${attrs}>${glyph ? icon(glyph) : ''}<span class="menu-copy">${label}${detail ? `<small>${detail}</small>` : ''}</span></button>`;
}
function popup() {
  if (!state.popup || state.popup === 'settings-menu') return '';
  let content = '';
  if (state.popup === 'add') content = `<h3>${t('添加', 'Add')}</h3>${row(t('文件与文件夹', 'Files and folders'), 'file', t('选择要附加的内容', 'Choose context to attach'), 'data-demo="attachment"')}${row(t('编辑器选区', 'Editor selection'), 'file', t('附加当前选中的文字', 'Attach selected text'), 'data-demo="selection"')}<h3 class="group-space">${t('最近使用', 'Recent')}</h3>${row('component-lab.css', 'file', '', 'data-demo="recent"')}`;
  if (state.popup === 'permission') content = `<h3>${t('权限选项 · 视觉演示', 'Permissions · visual demo')}</h3>${['ask', 'review'].map((value, index) => `<button class="menu-row" data-permission="${value}" aria-pressed="${state.permission === value}">${icon('shield')}<span class="menu-copy">${index ? t('查看权限', 'Inspect permissions') : t('逐次确认', 'Ask each time')}<small>${index ? t('在列表中查看已有授权。', 'Inspect existing grants in a list.') : t('重要操作执行前显示确认信息。', 'Show confirmation before consequential actions.')}</small></span><span class="check">${state.permission === value ? icon('check') : ''}</span></button>`).join('')}`;
  if (state.popup === 'effort') content = `<div class="effort"><strong id="effort-value">${efforts()[state.effort]}</strong><button data-action="models">${state.model}${icon('right')}</button><div class="effort-slider"><div class="effort-track" aria-hidden="true"><div class="effort-fill"></div><div class="effort-stops">${efforts().map((_, i) => `<i data-stop="${i}" class="${i === state.effort ? 'current' : ''}"></i>`).join('')}</div></div><div class="effort-thumb" aria-hidden="true"></div><input id="effort-range" type="range" min="0" max="4" step="1" value="${state.effort}" aria-label="${t('思考程度', 'Reasoning effort')}" aria-valuetext="${efforts()[state.effort]}"></div></div>`;
  if (state.popup === 'models') content = `<h3>${t('选择模型 · 示例名称', 'Select model · example names')}</h3>${['Model A', 'Model B', 'Model C'].map(model => `<button class="menu-row" data-model="${model}" aria-pressed="${state.model === model}"><span class="menu-copy">${model}</span><span class="check">${state.model === model ? icon('check') : ''}</span></button>`).join('')}`;
  return `<section class="popover" aria-label="${t('展开的控件', 'Expanded control')}">${content}</section>`;
}
let effortFrame = 0;
let effortPosition = 2;
let effortDrag = null;
new ResizeObserver(() => { if ($('effort-range')) paintEffort(effortPosition); }).observe($('surface'));
function paintEffort(position) {
  effortPosition = position;
  const slider = document.querySelector('.effort-slider');
  if (!slider) return;
  const fraction = position / 4;
  slider.style.setProperty('--effort-offset', `${fraction * (slider.getBoundingClientRect().width - 28)}px`);
  const palette = [[240,144,130],[159,149,161],[77,154,191],[159,172,140],[241,190,88]];
  slider.style.setProperty('--effort-track-width', `${slider.getBoundingClientRect().width}px`);
  const index = Math.min(3, Math.floor(position)), mix = position - index;
  const color = palette[index].map((v, i) => Math.round(v + (palette[index + 1][i] - v) * mix));
  slider.style.setProperty('--effort-color', `rgb(${color.join(' ')})`);
  slider.classList.toggle('is-maximum', state.effort === 4 && position >= 3.999);

  slider.closest('.effort').style.setProperty('--effort-title', `rgb(${color.join(' ')})`);
}
function moveEffort(position, animate = true) {
  cancelAnimationFrame(effortFrame);
  if (!animate || matchMedia('(prefers-reduced-motion: reduce)').matches) { paintEffort(position); return; }
  const from = effortPosition, start = performance.now();
  const frame = now => {
    const t = Math.min(1, (now - start) / 180);
    paintEffort(from + (position - from) * (1 - Math.pow(1 - t, 3)));
    if (t < 1 && $('effort-range')) effortFrame = requestAnimationFrame(frame);
  };
  effortFrame = requestAnimationFrame(frame);
}
function setEffort(value, animate = true) {
  const previous = state.effort;
  state.effort = Number(value);
  $('effort-range').value = String(state.effort);
  const title = $('effort-value');
  title.textContent = efforts()[state.effort];
  if (state.effort !== previous) {
    title.getAnimations().forEach(animation => animation.cancel());
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      title.animate([{ opacity: .4, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 160, easing: 'ease-out' });
    }
  }
  $('effort-range').setAttribute('aria-valuetext', efforts()[state.effort]);
  document.querySelectorAll('[data-stop]').forEach(dot => dot.classList.toggle('current', Number(dot.dataset.stop) === state.effort));
  moveEffort(state.effort, animate);
  updateState();
}
function efforts() { return state.language === 'zh' ? ['最低', '低', '中等', '高', '最高'] : ['Minimal', 'Low', 'Medium', 'High', 'Maximum']; }
function composer() {
  const modelLabel = state.long ? t('用于复杂任务的长名称示例模型', 'An example model with a very long name') : state.model;
  return `<div class="canvas"><div class="pi-mark" aria-hidden="true">π</div><p class="greeting">${t('我们来做点什么？', 'What should we work on?')}</p></div><div class="composer">${pin(2)}${popup()}<textarea id="draft" rows="3" aria-label="${t('消息草稿', 'Message draft')}" placeholder="${t('描述你想完成的任务', 'Describe what you want to do')}">${esc(state.draft)}</textarea><div class="toolbar">${pin(3)}${action('add', t('添加上下文', 'Add context'), 'plus')}<button class="selector" data-action="effort" aria-expanded="${['effort', 'models'].includes(state.popup)}"><span>${modelLabel}</span>${icon('down')}</button><button class="selector permission" data-action="permission" aria-label="${t('权限', 'Permissions')}" aria-expanded="${state.popup === 'permission'}">${icon('shield')}<span>${t('权限', 'Permissions')}</span>${icon('down')}</button><button class="icon-button send" data-action="send" aria-label="${t('发送示例', 'Send example')}" ${state.draft.trim() ? '' : 'disabled'}>${icon('send')}</button></div></div>`;
}
function setting(label, detail, control) { return `<div class="setting-row"><div class="setting-copy">${label}${detail ? `<small>${detail}</small>` : ''}</div><div class="setting-control">${control}</div></div>`; }
function settings() {
  return `<section class="settings-content"><h2>${t('通用', 'General')}</h2><div class="setting-group">${pin(2)}${setting(t('界面语言', 'Language'), t('此样板中的显示语言', 'Display language in this specimen'), `<select id="sample-language" aria-label="${t('界面语言', 'Language')}"><option value="zh" ${state.language === 'zh' ? 'selected' : ''}>简体中文</option><option value="en" ${state.language === 'en' ? 'selected' : ''}>English</option></select>`)}</div><h3>${t('输入与发送', 'Composer')}</h3><div class="setting-group">${pin(3)}${setting(t('显示上下文用量', 'Show context window usage'), '', `<button class="toggle" role="switch" aria-checked="${state.usage}" aria-label="${t('显示上下文用量', 'Show context window usage')}" data-action="usage"><span></span></button>`)}${setting(t('发送快捷键', 'Send shortcut'), state.long ? t('选择 Enter 是发送当前消息，还是在较长的多行草稿中插入新的一行。', 'Choose whether Enter sends the current message or inserts a new line while editing a longer multiline draft.') : t('选择 Enter 的行为', 'Choose what Enter does'), `<select id="shortcut" aria-label="${t('发送快捷键', 'Send shortcut')}"><option ${state.shortcut === 'Enter' ? 'selected' : ''}>Enter</option><option ${state.shortcut === '⌘ Enter' ? 'selected' : ''}>⌘ Enter</option></select>`)}${setting(t('后续消息', 'Follow-up behavior'), t('运行时将新消息排队，或用于调整当前任务。', 'Queue a message during a run, or use it to steer the current task.'), `<div class="segments">${['queue', 'steer'].map((value, i) => `<button data-follow="${value}" aria-pressed="${state.follow === value}">${i ? t('引导', 'Steer') : t('排队', 'Queue')}</button>`).join('')}</div>`)}</div></section>`;
}
function history() { return `<div class="history-body">${pin(2)}<label class="search-row">${icon('search')}<input type="search" id="search" placeholder="${t('搜索最近会话', 'Search recent chats')}" aria-label="${t('搜索最近会话', 'Search recent chats')}"></label><div class="history-list" id="history-list"></div></div>`; }
function historyRows(query = '') {
  const matches = names().map((name, index) => ({ name: state.long ? name + t('：在多个状态和窄窗口下检查完整呈现', ': check the complete presentation across states and narrow widths') : name, index })).filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
  $('history-list').innerHTML = matches.length ? matches.map(({ name, index }) => `<button class="history-row" data-session="${index}" aria-pressed="${state.selected === index}" title="${esc(name)}"><span class="title">${esc(name)}</span><span class="history-meta"><span>${index < 2 ? `${index * 7 + 1}m` : `${index - 1}h`}</span>${state.selected === index ? icon('check') : ''}</span></button>`).join('') : `<p class="history-empty">${t('没有匹配的会话，请尝试其他关键词。', 'No matching chats. Try another search.')}</p>`;
}
function render() {
  const focusAction = document.activeElement?.dataset.action;
  const focusId = document.activeElement?.id;
  const surface = $('surface');
  surface.style.width = `${state.width}px`;
  surface.style.height = `${state.height}px`;
  surface.dataset.theme = state.theme;
  surface.lang = state.language === 'zh' ? 'zh-CN' : 'en';
  surface.classList.toggle('guides', state.guides);
  surface.innerHTML = header() + (state.specimen === 'composer' ? composer() : state.specimen === 'settings' ? settings() : history()) + `<p class="surface-status" role="status">${esc(state.message)}</p>`;
  if ($('effort-range')) { cancelAnimationFrame(effortFrame); effortDrag = null; paintEffort(state.effort); }
  if (state.specimen === 'history') historyRows();
  if (state.popup === 'settings-menu') {
    const menu = document.createElement('section');
    menu.className = 'popover'; menu.style.cssText = 'top:48px;bottom:auto;left:8px;right:8px';
    menu.setAttribute('aria-label', t('设置菜单', 'Settings menu'));
    menu.innerHTML = row(t('界面设置', 'Interface settings'), 'settings', '', 'data-action="settings"') + row(t('键盘快捷键', 'Keyboard shortcuts'), 'keyboard', '', 'data-demo="shortcuts"');
    surface.append(menu);
  }
  $('dimension').textContent = `${state.width} × ${state.height} · ${t('独立样板', 'Isolated specimen')}`;
  const notes = {
    composer: ['一个容器，两层结构', ['① 顶栏保持标题与图标的稳定对齐。图标笔画与视觉大小协调。', '② 输入区和工具栏共用外轮廓。点击加号、模型、权限或设置，检查展开状态。', '③ 辅助控件紧凑，发送动作有清楚的形状。窄窗口与长文案不挤压按钮。']],
    settings: ['分组清楚，行内有秩序', ['① 当前设置类别有明确标题，返回入口与操作保持紧凑。', '② 相关设置共享一个边界，名称与说明共用左对齐线。', '③ 控件按内容定宽，说明决定行高。280px 下部分控件移到文字下方。']],
    history: ['轻量列表，稳定节奏', ['① 列表保留导航上下文。这里仅演示列表外观，不执行会话恢复。', '② 搜索融入列表顶部。输入不存在的标题可查看无匹配状态。', '③ 标题弹性占宽，时间与选中勾保持完整。试试长文案、滚动和键盘焦点。']],
  }[state.specimen];
  $('note-title').textContent = notes[0];
  $('note-list').innerHTML = notes[1].map(text => `<li>${text.replace(/^[①②③] /, '')}</li>`).join('');
  updateState();
  if (focusAction) surface.querySelector(`[data-action="${focusAction}"]`)?.focus({ preventScroll: true });
  else if (focusId) $(focusId)?.focus({ preventScroll: true });
}
function updateState() { const { draft, ...rest } = state; $('state').textContent = JSON.stringify({ ...rest, draftLength: draft.length }, null, 2); }
function syncControls() { for (const key of ['specimen', 'width', 'height', 'theme', 'language']) $(key).value = state[key]; $('guides').checked = state.guides; $('long-copy').checked = state.long; }
function openPopup(name) {
  state.popup = state.popup === name ? null : name;
  trigger = name === 'models' ? 'effort' : name;
  render();
  if (state.popup) $('surface').querySelector('.popover button, .popover input')?.focus({ preventScroll: true });
}
function closePopup(returnFocus = true) { state.popup = null; render(); if (!returnFocus) return; $('surface').querySelector(`[data-action="${trigger}"]`)?.focus({ preventScroll: true }); }

$('surface').addEventListener('click', event => {
  const target = event.target.closest('button'); if (!target) return;
  const actionName = target.dataset.action;
  if (['add', 'permission', 'effort', 'models', 'settings-menu'].includes(actionName)) { openPopup(actionName); return; }
  if (actionName === 'settings' || actionName === 'history' || actionName === 'back') { state.specimen = actionName === 'back' ? 'composer' : actionName; state.popup = null; syncControls(); render(); return; }
  if (actionName === 'new') { state.specimen = 'composer'; state.popup = null; state.draft = ''; state.message = ''; syncControls(); render(); return; }
  if (actionName === 'usage') { state.usage = !state.usage; render(); return; }
  if (actionName === 'send') { state.message = t('样板：消息未发送到任何服务。', 'Demo: no message was sent to any service.'); render(); return; }
  if (target.dataset.model) { state.model = target.dataset.model; state.popup = 'effort'; render(); $('surface').querySelector('[data-action="models"]')?.focus(); return; }
  if (target.dataset.permission) { state.permission = target.dataset.permission; closePopup(); return; }
  if (target.dataset.follow) { state.follow = target.dataset.follow; render(); $('surface').querySelector(`[data-follow="${state.follow}"]`)?.focus(); return; }
  if (target.dataset.session) { state.selected = Number(target.dataset.session); state.message = t('已选择示例会话，未加载真实记录。', 'Example selected; no real history loaded.'); const query = $('search').value; historyRows(query); $('surface').querySelector(`[data-session="${state.selected}"]`)?.focus(); $('surface').querySelector('.surface-status').textContent = state.message; updateState(); return; }
  if (target.dataset.demo) { state.message = t('此操作仅为视觉演示。', 'This action is a visual demonstration.'); closePopup(); }
});
function dragEffort(event) {
  const input = $('effort-range');
  const box = input.getBoundingClientRect();
  const position = Math.max(0, Math.min(4, (event.clientX - box.left - 14) / (box.width - 28) * 4));
  setEffort(Math.round(position), false);
  paintEffort(position);
}
$('surface').addEventListener('pointerdown', event => {
  if (event.target.id !== 'effort-range' || event.button !== 0 || !event.isPrimary) return;
  event.preventDefault();
  effortDrag = { id: event.pointerId, original: state.effort };
  event.target.closest('.effort-slider').classList.add('dragging');
  event.target.focus({ preventScroll: true });
  event.target.setPointerCapture(event.pointerId);
  dragEffort(event);
});
$('surface').addEventListener('pointermove', event => {
  if (effortDrag?.id === event.pointerId) dragEffort(event);
});
function finishEffort(event, cancelled = false) {
  if (effortDrag?.id !== event.pointerId) return;
  const original = effortDrag.original;
  if (!cancelled) dragEffort(event);
  effortDrag = null;
  document.querySelector('.effort-slider')?.classList.remove('dragging');
  setEffort(cancelled ? original : state.effort);
  if (event.target.hasPointerCapture(event.pointerId)) event.target.releasePointerCapture(event.pointerId);
}
$('surface').addEventListener('pointerup', event => finishEffort(event));
$('surface').addEventListener('pointercancel', event => finishEffort(event, true));
$('surface').addEventListener('lostpointercapture', event => {
  if (effortDrag?.id === event.pointerId) { effortDrag = null; document.querySelector('.effort-slider')?.classList.remove('dragging'); setEffort(state.effort); }
});
$('surface').addEventListener('input', event => {
  if (event.target.id === 'draft') { state.draft = event.target.value; $('surface').querySelector('[data-action="send"]').disabled = !state.draft.trim(); updateState(); }
  if (event.target.id === 'search') historyRows(event.target.value);
  if (event.target.id === 'effort-range') setEffort(event.target.value);
});
$('surface').addEventListener('change', event => { if (event.target.id === 'shortcut') { state.shortcut = event.target.value; updateState(); } if (event.target.id === 'sample-language') { state.language = event.target.value; syncControls(); render(); } });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && state.popup) { event.preventDefault(); closePopup(); }
  if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) && event.target.closest('.popover') && event.target.tagName === 'BUTTON') {
    const buttons = [...event.target.closest('.popover').querySelectorAll('button')];
    const index = buttons.indexOf(event.target);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
    event.preventDefault(); buttons[next]?.focus();
  }
});
document.addEventListener('click', event => { if (state.popup && !event.target.closest('.popover, [data-action]')) closePopup(false); });
for (const key of ['specimen', 'width', 'height', 'theme', 'language']) $(key).addEventListener('change', () => { state[key] = ['width', 'height'].includes(key) ? Number($(key).value) : $(key).value; state.popup = null; render(); });
$('guides').addEventListener('change', () => { state.guides = $('guides').checked; render(); });
$('long-copy').addEventListener('change', () => { state.long = $('long-copy').checked; render(); });
$('reset').addEventListener('click', () => { state = { ...initial }; syncControls(); render(); });
for (const button of document.querySelectorAll('[data-tab]')) button.addEventListener('click', () => {
  for (const tab of document.querySelectorAll('[data-tab]')) { if (tab === button) tab.setAttribute('aria-current', 'page'); else tab.removeAttribute('aria-current'); }
  $('specimens').hidden = button.dataset.tab !== 'specimens'; $('references').hidden = button.dataset.tab !== 'references';
});
async function loadReferences() {
  try {
    const response = await fetch('references/catalog.json'); if (!response.ok) throw new Error('catalog');
    const data = await response.json();
    const entries = Array.isArray(data) ? data : data.entries;
    $('reference-grid').innerHTML = entries.map(entry => `<article class="reference-card"><h3>${esc(entry.title)}</h3><p>${esc(Array.isArray(entry.coverage) ? entry.coverage.join(' · ') : entry.coverage)}</p>${entry.sourceKind === 'local-ui-capture' ? '<a href="../sources.md#local-vs-code-captures">本机实测截图 · 来源与裁切说明 ↗</a>' : `<a href="${esc(entry.pageUrl)}" target="_blank" rel="noreferrer">官方来源 ↗</a>`}${entry.annotated ? `<img src="references/${esc(entry.annotated)}" alt="${esc(entry.title)} — 结构标注"><details><summary>查看未标注来源图</summary><img loading="lazy" src="references/${esc(entry.file)}" alt="${esc(entry.title)}"></details>` : `<img loading="lazy" src="references/${esc(entry.file)}" alt="${esc(entry.title)}">`}<p>${esc(Array.isArray(entry.limits) ? entry.limits.join(' · ') : entry.limits)}</p></article>`).join('');
  } catch { $('reference-grid').innerHTML = '<p>请通过本地 HTTP 服务打开参考库，加载图片索引。启动方式见 visual-reference.md。</p>'; }
}
syncControls(); render(); loadReferences();
