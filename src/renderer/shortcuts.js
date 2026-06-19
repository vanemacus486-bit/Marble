import { store } from './store';

export default function registerShortcuts() {
  function handler(e) {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;

    const key = e.key.toLowerCase();

    // 设置打开时跳过 n/f 避免在弹窗后面误触发
    if (store.settingsOpen && key !== ',') return;

    if (key === 'n') {
      e.preventDefault();
      store.newNoteRequest = true;
    } else if (key === 'f') {
      if (store.plugins.search) {
        e.preventDefault();
        store.searchFocus = true;
      }
    } else if (key === ',') {
      e.preventDefault();
      store.settingsOpen = true;
    }
  }

  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}
