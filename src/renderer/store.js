import { reactive } from 'vue';
import { STYLE_MAP, FONT_SIZE_ZOOM, resolveUiFont, resolveMonoFont } from './themes';

const api = window.api;

export const store = reactive({
  config: null,
  booted: false,
  ready: false,
  root: null,
  tree: [],
  // 标签页系统
  tabs: [],               // { path, name, html, docHtml }[]
  activeTabIdx: -1,        // -1 表示没有打开标签页
  // 向后兼容 —— 以下三个字段通过 syncActiveTab() 从活动标签同步
  currentFile: null,
  currentHtml: '',
  docHtml: '',
  chat: [], // { role, content, status }
  chatHistory: [], // { id, title, ts, messages[] }
  searchQuery: '',
  searchResults: [], // { path, name, snippet, matchType }
  graphVisible: false,
  graphData: { nodes: [], edges: [] },
  plugins: {
    roam: true,
    search: true,
    graph: true,
    pagination: true,
  },
  // 导航历史（上一步/下一步）
  navHistory: [], // { path, name }
  navIndex: -1,
  aiBusy: false,
  theme: 'dark',
  appearance: {
    theme: 'dark',
    style: 'graphite',
    fontSize: 'md',
    uiFont: 'system',
    uiFontCustom: '',
    monoFont: 'system',
    monoFontCustom: '',
  },
  settingsOpen: false,
  settingsCat: 'model',
  sidebarCollapsed: false,
  searchFocus: false,
  newNoteRequest: false,
});

export function stripFences(s) {
  let t = (s || '').trim();
  t = t.replace(/^```(?:html)?\s*/i, '');
  t = t.replace(/\s*```$/, '');
  return t;
}

export function wrapDoc(html) {
  if (/<html[\s>]/i.test(html)) return html;
  return (
    '<!doctype html><html><head><meta charset="utf-8"><style>' +
    'body{font-family:system-ui,"Microsoft YaHei",sans-serif;max-width:760px;margin:40px auto;padding:0 24px;line-height:1.7;color:#222;background:#fff;}' +
    'h1,h2,h3{line-height:1.3} a{color:#c8704f} img{max-width:100%}' +
    'pre{background:#f5f5f5;padding:12px;border-radius:6px;overflow:auto} code{background:#f0f0f0;padding:1px 4px;border-radius:4px}' +
    'table{border-collapse:collapse} td,th{border:1px solid #ddd;padding:6px 10px}' +
    'blockquote{border-left:3px solid #ddd;margin:0;padding-left:14px;color:#555}' +
    '</style></head><body>' + html + '</body></html>'
  );
}

// 给渲染进 iframe 的文档注入细滚动条样式：iframe 是 sandbox，父级 CSS 进不去，
// 只能写进文档本身。AI 常产出完整 <html>，wrapDoc 会原样返回，所以这里统一兜底注入。
const SCROLLBAR_STYLE =
  '<style>' +
  '::-webkit-scrollbar{width:12px;height:12px}' +
  '::-webkit-scrollbar-thumb{background:rgba(136,136,136,.55);border-radius:8px;border:3px solid transparent;background-clip:padding-box}' +
  '::-webkit-scrollbar-thumb:hover{background:rgba(136,136,136,.8);background-clip:padding-box}' +
  '::-webkit-scrollbar-track{background:transparent}' +
  '</style>';

export function injectScrollbar(html) {
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, () => SCROLLBAR_STYLE + '</head>');
  if (/<body[^>]*>/i.test(html)) return html.replace(/<body[^>]*>/i, (m) => m + SCROLLBAR_STYLE);
  return SCROLLBAR_STYLE + html;
}

// ---- 翻页系统 ----

// 从完整 HTML 中提取 <head> 内部内容
export function extractHead(fullHtml) {
  const m = fullHtml.match(/<head>([\s\S]*?)<\/head>/i);
  return m ? m[1].trim() : '';
}

// 从完整 HTML 中提取 <body> 内部内容
export function extractBody(fullHtml) {
  const m = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return m ? m[1].trim() : fullHtml;
}

// 解析完整 HTML 为页面数组（body-only 内容）
export function parseAllPages(fullHtml) {
  if (!fullHtml) return [''];
  const re = /<div\s+class="marble-page"\s+data-page="(\d+)"[^>]*>([\s\S]*?)<\/div>/gi;
  const pages = [];
  let match;
  while ((match = re.exec(fullHtml)) !== null) {
    pages[parseInt(match[1])] = match[2].trim();
  }
  if (pages.length > 0) return pages;
  // 无分页标记：整个 body 作为一页
  return [extractBody(fullHtml)];
}

// 把页面数组合并为完整 HTML（用 marble-page div 包裹）
export function combineAllPages(fullHtml, pages) {
  if (!pages || pages.length <= 1) {
    // 单页：不加包裹，保持原样（但用新内容替换 body）
    const headContent = extractHead(fullHtml);
    return `<!doctype html>\n<html>\n<head>${headContent}</head>\n<body>\n${pages[0] || ''}\n</body>\n</html>`;
  }
  const headContent = extractHead(fullHtml);
  const bodyParts = pages.map((content, i) =>
    `<div class="marble-page" data-page="${i}">\n${content}\n</div>`
  );
  return `<!doctype html>\n<html>\n<head>${headContent}</head>\n<body>\n${bodyParts.join('\n')}\n</body>\n</html>`;
}

// 构建当前页的渲染用 HTML（页内容 + 原头部样式）
export function buildPageDoc(tab) {
  if (!tab.pages || tab.pages.length === 0) return tab.html || '';
  if (tab.pages.length <= 1) return tab.html || '';  // 单页直接返回原 HTML
  const body = tab.pages[tab.currentPage] || '';
  const head = extractHead(tab.html);
  return `<!doctype html>\n<html>\n<head>${head}</head>\n<body>\n${body}\n</body>\n</html>`;
}

function resolveMode(theme) {
  if (theme === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme === 'light' ? 'light' : 'dark';
}

// 把当前 appearance 落到 DOM：明暗 class + 风格调色板（CSS 变量）+ 字体 + 整体缩放。
function applyAppearance() {
  const a = store.appearance;
  const mode = resolveMode(a.theme);
  store.theme = mode;
  const el = document.documentElement;
  el.classList.remove('dark', 'light');
  el.classList.add(mode);
  const style = STYLE_MAP[a.style] || STYLE_MAP.graphite;
  const pal = style[mode] || style.dark;
  for (const k in pal) el.style.setProperty(k, pal[k]);
  el.style.setProperty('--ui-font', resolveUiFont(a));
  el.style.setProperty('--mono-font', resolveMonoFont(a));
  try { api.app.setZoom(FONT_SIZE_ZOOM[a.fontSize] || 1); } catch { /* 旧版 preload 无 setZoom */ }
}

export async function bootApp() {
  try {
    store.config = await api.config.get();
    store.appearance = { ...store.appearance, ...(store.config.appearance || {}) };
    applyAppearance();
    // 「自动」主题时跟随系统明暗变化
    if (!bootApp._mq) {
      bootApp._mq = window.matchMedia('(prefers-color-scheme: dark)');
      bootApp._mq.addEventListener('change', () => {
        if (store.appearance.theme === 'auto') applyAppearance();
      });
    }
    if (store.config.vaultPath) {
      store.ready = true;
      await loadTree();
    }
    // 加载插件配置
    store.plugins = { ...store.plugins, ...(store.config.plugins || {}) };
  } finally {
    store.booted = true;
  }
}

export async function chooseVault() {
  const p = await api.vault.choose();
  if (!p) return;
  store.config = await api.config.get();
  store.ready = true;
  clearDoc();
  await loadTree();
}

export async function loadTree() {
  const { root, tree } = await api.vault.tree();
  store.root = root;
  store.tree = tree;
}

// 搜索笔记（基于 api.vault.search）
let searchTimer = null;
export function searchNotes(query) {
  store.searchQuery = query;
  if (searchTimer) clearTimeout(searchTimer);
  if (!query || !query.trim()) {
    store.searchResults = [];
    return;
  }
  searchTimer = setTimeout(async () => {
    try {
      store.searchResults = await api.vault.search(query);
    } catch {
      store.searchResults = [];
    }
  }, 300); // 防抖 300ms
}

// 随机打开一则笔记（漫游）
export function roamNote() {
  const files = [];
  function walk(nodes) {
    for (const n of nodes) {
      if (n.type === 'file') files.push(n);
      else if (n.children) walk(n.children);
    }
  }
  walk(store.tree);
  if (!files.length) return;
  const pick = files[Math.floor(Math.random() * files.length)];
  openFile(pick);
}

// ---- 导航历史（上一步/下一步）----

let _navSkipPush = false;

export function canGoBack() {
  return store.navIndex > 0;
}
export function canGoForward() {
  return store.navIndex < store.navHistory.length - 1;
}
export function navBack() {
  if (store.navIndex <= 0) return;
  store.navIndex--;
  const entry = store.navHistory[store.navIndex];
  _navSkipPush = true;
  openFile({ path: entry.path, name: entry.name });
  _navSkipPush = false;
}
export function navForward() {
  if (store.navIndex >= store.navHistory.length - 1) return;
  store.navIndex++;
  const entry = store.navHistory[store.navIndex];
  _navSkipPush = true;
  openFile({ path: entry.path, name: entry.name });
  _navSkipPush = false;
}

// ---- 关系图谱 ----

export async function buildGraph() {
  try {
    store.graphData = await api.vault.graph();
  } catch {
    store.graphData = { nodes: [], edges: [] };
  }
}

export function toggleGraph() {
  store.graphVisible = !store.graphVisible;
}

export async function savePlugin(key, enabled) {
  store.plugins[key] = enabled;
  store.config = await api.config.set({ plugins: { ...store.plugins } });
}

export function clearDoc() {
  store.currentFile = null;
  store.currentHtml = '';
  store.docHtml = '';
  store.activeTabIdx = -1;
  store.tabs = [];
}

// ---- 标签页系统 ----

// 把 idx 指向的标签同步到 currentFile / currentHtml / docHtml
function syncActiveTab(idx) {
  if (idx >= 0 && idx < store.tabs.length) {
    const t = store.tabs[idx];
    store.currentFile = { path: t.path, name: t.name };
    store.currentHtml = t.html;
    store.docHtml = buildPageDoc(t);
    store.activeTabIdx = idx;
  }
}

export function switchTab(idx) {
  if (idx < 0 || idx >= store.tabs.length) return;
  syncActiveTab(idx);
}

export function closeTab(idx) {
  if (store.tabs.length <= 1) {
    // 最后一个标签不关闭，只清空内容
    clearDoc();
    return;
  }
  store.tabs.splice(idx, 1);
  // 切到相邻标签
  const next = Math.min(idx, store.tabs.length - 1);
  syncActiveTab(next);
}

// 添加或复用一个标签：先查是否已存在相同 path，存在则切换；否则新建
function ensureTab(path, name, html) {
  const existing = store.tabs.findIndex((t) => t.path === path);
  if (existing >= 0) {
    syncActiveTab(existing);
    return;
  }
  const pages = parseAllPages(html);
  store.tabs.push({ path, name, html, docHtml: html, pages, currentPage: 0 });
  syncActiveTab(store.tabs.length - 1);
}

export async function openFile(node) {
  const html = await api.vault.read(node.path);
  ensureTab(node.path, node.name, html);
  // 导航历史
  if (!_navSkipPush) {
    if (store.navIndex < store.navHistory.length - 1) {
      store.navHistory = store.navHistory.slice(0, store.navIndex + 1);
    }
    store.navHistory.push({ path: node.path, name: node.name });
    store.navIndex = store.navHistory.length - 1;
  }
}

export async function createNote(dirPath, name) {
  const p = await api.vault.createNote(dirPath || store.root, name);
  await loadTree();
  // 读出内容（空文档）
  const html = await api.vault.read(p);
  ensureTab(p, name || '未命名', html);
  return p;
}

export function newTab() {
  // 在弹出命名弹窗后由 createNote 完成
}

// ---- 翻页系统 ----

export function switchPage(delta) {
  const idx = store.activeTabIdx;
  if (idx < 0) return;
  const tab = store.tabs[idx];
  if (!tab.pages || tab.pages.length <= 1) return; // 单页不可翻
  const next = tab.currentPage + delta;
  if (next < 0 || next >= tab.pages.length) return;
  tab.currentPage = next;
  syncActiveTab(idx);
}

export function canPrevPage() {
  const idx = store.activeTabIdx;
  if (idx < 0) return false;
  const tab = store.tabs[idx];
  return tab.pages && tab.pages.length > 1 && tab.currentPage > 0;
}

export function canNextPage() {
  const idx = store.activeTabIdx;
  if (idx < 0) return false;
  const tab = store.tabs[idx];
  return tab.pages && tab.pages.length > 1 && tab.currentPage < tab.pages.length - 1;
}

export function pageInfo() {
  const idx = store.activeTabIdx;
  if (idx < 0) return null;
  const tab = store.tabs[idx];
  if (!tab.pages || tab.pages.length <= 1) return null;
  return { current: tab.currentPage + 1, total: tab.pages.length };
}

// 续写：调用 AI 生成下一页，追加到当前标签
export async function continuePage() {
  const idx = store.activeTabIdx;
  if (idx < 0 || store.aiBusy) return;
  const tab = store.tabs[idx];
  if (!tab.pages || tab.pages.length === 0) return;

  const prov = defaultProvider();
  if (!prov || !prov.apiKey) throw new Error('NO_KEY');

  const t = '继续往下写，和前面的内容自然衔接，保持风格一致，形成新的一页。';
  store.chat.push({ role: 'user', content: t });

  // 用完整 HTML 做上下文
  const fullHtml = combineAllPages(tab.html, tab.pages);
  const context = { name: tab.name, content: fullHtml };
  const history = [{ role: 'user', content: t }];
  // 如果当前对话有历史，发给 AI 做参考（不带大段 HTML）
  if (store.chat.length > 1) {
    history.unshift({ role: 'assistant', content: '（已更新当前笔记）' });
  }

  const len = store.chat.push({ role: 'assistant', content: '正在续写，请看中间…', status: 'pending' });
  const assistant = store.chat[len - 1];
  store.aiBusy = true;

  let acc = '';
  let last = 0;
  try {
    const full = await api.ai.chat({ history, context }, (delta) => {
      acc += delta;
      const now = Date.now();
      if (now - last > 250) {
        last = now;
        // 流式预览：提取 body 实时显示
        const preview = extractBody(acc);
        store.docHtml = `<!doctype html><html><head>${extractHead(tab.html)}</head><body>${preview}</body></html>`;
        if (store.activeTabIdx >= 0) store.tabs[store.activeTabIdx].docHtml = store.docHtml;
      }
    });
    const newBody = extractBody(stripFences(full || acc));
    // 追加为新页
    tab.pages.push(newBody);
    tab.currentPage = tab.pages.length - 1;
    tab.html = combineAllPages(tab.html, tab.pages);
    // 写盘
    await api.vault.write(tab.path, tab.html);
    syncActiveTab(idx);
    assistant.content = `已续写第 ${tab.currentPage + 1} 页`;
    assistant.status = 'done';
  } catch (err) {
    assistant.content = '出错了：' + (err && err.message ? err.message : err);
    assistant.status = 'error';
  } finally {
    store.aiBusy = false;
  }
}

export async function createFolder(dirPath, name) {
  await api.vault.createFolder(dirPath || store.root, name);
  await loadTree();
}

export async function renameNode(node, newName, isFolder) {
  const np = await api.vault.rename(node.path, newName, isFolder);
  if (!isFolder) {
    // 同步标签系统
    for (const tab of store.tabs) {
      if (tab.path === node.path) {
        tab.path = np;
        tab.name = newName;
      }
    }
    if (store.currentFile && store.currentFile.path === node.path) {
      store.currentFile = { path: np, name: newName };
    }
  }
  await loadTree();
}

export async function removeNode(node) {
  await api.vault.remove(node.path);
  // 关闭相关标签
  for (let i = store.tabs.length - 1; i >= 0; i--) {
    if (store.tabs[i].path === node.path || store.tabs[i].path.startsWith(node.path + '\\') || store.tabs[i].path.startsWith(node.path + '/')) {
      if (store.tabs.length <= 1) {
        clearDoc();
      } else {
        store.tabs.splice(i, 1);
        if (i <= store.activeTabIdx) store.activeTabIdx = Math.max(0, store.activeTabIdx - 1);
      }
      break;
    }
  }
  if (store.tabs.length > 0) syncActiveTab(store.activeTabIdx);
  await loadTree();
}

export function clearChat() {
  // 保存到历史
  if (store.chat.length > 0) {
    const firstUser = store.chat.find((m) => m.role === 'user');
    const title = firstUser ? firstUser.content.slice(0, 40) : '对话';
    store.chatHistory.push({
      id: Date.now().toString(),
      title,
      ts: Date.now(),
      messages: JSON.parse(JSON.stringify(store.chat)),
    });
  }
  store.chat = [];
}

export function restoreChat(item) {
  store.chat = JSON.parse(JSON.stringify(item.messages));
}

export function removeHistory(id) {
  const idx = store.chatHistory.findIndex((h) => h.id === id);
  if (idx >= 0) store.chatHistory.splice(idx, 1);
}

export async function sendAi(text) {
  if (store.aiBusy) return;
  const t = (text || '').trim();
  if (!t) return;
  const prov = defaultProvider();
  if (!prov || !prov.apiKey) {
    throw new Error('NO_KEY');
  }
  if (!store.currentFile) {
    const name = (t.split('\n').find((l) => l.trim()) || '未命名').trim().slice(0, 20) || '未命名';
    await createNote(store.root, name);
  }

  store.chat.push({ role: 'user', content: t });
  // 发给 AI 的历史：用户指令 + 助手的简短标记（不带大段 HTML，省 token）
  const history = store.chat
    .filter((m) => m.role === 'user' || (m.role === 'assistant' && m.status === 'done'))
    .map((m) => ({ role: m.role, content: m.role === 'assistant' ? '（已更新当前笔记）' : m.content }));

  const len = store.chat.push({ role: 'assistant', content: '正在生成，请看中间…', status: 'pending' });
  const assistant = store.chat[len - 1]; // 取响应式代理，后续改它才会触发更新
  store.aiBusy = true;

  const context = { name: store.currentFile.name, content: store.currentHtml || '' };
  let acc = '';
  let last = 0;
  try {
    const full = await api.ai.chat({ history, context }, (delta) => {
      acc += delta;
      const now = Date.now();
      if (now - last > 250) {
        last = now;
        store.docHtml = acc; // 节流地实时渲染到中间
        if (store.activeTabIdx >= 0) store.tabs[store.activeTabIdx].docHtml = acc;
      }
    });
    const finalHtml = stripFences(full || acc);
    await api.vault.write(store.currentFile.path, finalHtml);
    store.currentHtml = finalHtml;
    store.docHtml = finalHtml;
    // 同步到标签
    if (store.activeTabIdx >= 0) {
      const tab = store.tabs[store.activeTabIdx];
      tab.html = finalHtml;
      tab.docHtml = finalHtml;
      // 更新翻页数据
      tab.pages = parseAllPages(finalHtml);
      tab.currentPage = 0;
    }
    assistant.content = '已写入《' + store.currentFile.name + '》';
    assistant.status = 'done';
  } catch (err) {
    assistant.content = '出错了：' + (err && err.message ? err.message : err);
    assistant.status = 'error';
    store.docHtml = store.currentHtml; // 出错恢复原内容
  } finally {
    store.aiBusy = false;
  }
}

export async function saveWriting(partial) {
  store.config = await api.config.set({ writing: partial });
  return store.config;
}
// 更新外观（主题/视觉风格/字号/字体），立即生效并持久化。
export async function saveAppearance(partial) {
  store.appearance = { ...store.appearance, ...partial };
  applyAppearance();
  store.config = await api.config.set({ appearance: store.appearance });
  return store.config;
}

// ---- 模型 / 供应商 ----
// 当前默认模型所属的供应商（解析 defaultModel.providerId）。
export function defaultProvider() {
  const c = store.config;
  if (!c || !Array.isArray(c.providers)) return null;
  const dm = c.defaultModel || {};
  return c.providers.find((p) => p.id === dm.providerId) || c.providers[0] || null;
}
// 保存供应商列表，可同时更新默认模型（一次写盘）。
export async function saveProviders(providers, defaultModel) {
  const partial = { providers };
  if (defaultModel) partial.defaultModel = defaultModel;
  store.config = await api.config.set(partial);
  return store.config;
}
export async function setDefaultModel(defaultModel) {
  store.config = await api.config.set({ defaultModel });
  return store.config;
}
// 针对某个供应商（可能是尚未保存的草稿）拉取可用模型列表。
export async function fetchModelsFor({ baseUrl, apiKey }) {
  return api.ai.models({ baseUrl, apiKey });
}

export function vaultName() {
  const p = store.config && store.config.vaultPath;
  if (!p) return '笔记库';
  return p.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || '笔记库';
}

export function recentVaults() {
  const c = store.config;
  if (!c || !Array.isArray(c.vaults)) return [];
  const current = c.vaultPath;
  return c.vaults.map((p) => ({
    path: p,
    name: p.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || p,
    current: p === current,
  }));
}

export async function switchVaultTo(path) {
  const r = await api.vault.switchTo(path);
  if (!r || !r.ok) throw new Error((r && r.error) || '切换失败');
  store.config = await api.config.get();
  store.ready = true;
  clearDoc();
  await loadTree();
}

export async function forgetVault(path) {
  await api.vault.forget(path);
  store.config = await api.config.get();
}
