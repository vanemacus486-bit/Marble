<script setup>
import { computed } from 'vue';
import { store } from '../store';

// 从当前文档 HTML 去标签统计字数
function countWords(html) {
  if (!html) return 0;
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length;
}
function countChars(html) {
  if (!html) return 0;
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, '')
    .trim();
  return text.length;
}

const wordCount = computed(() => countWords(store.docHtml));
const charCount = computed(() => countChars(store.docHtml));
const backlinks = computed(() => 0); // 占位，后续可接真实反链数据
const status = computed(() => store.aiBusy ? '○ 生成中…' : '● 就绪');
</script>

<template>
  <footer class="status-bar drag-region">
    <div class="spacer"></div>
    <div class="items no-drag">
      <span class="item">{{ backlinks }} 反链</span>
      <span class="item">{{ wordCount }} 字</span>
      <span class="item">{{ charCount }} 字符</span>
      <span class="item status-dot" :class="{ busy: store.aiBusy }">{{ status }}</span>
    </div>
  </footer>
</template>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  height: 22px;
  padding: 0 10px;
  background: var(--bg);
  border-top: 1px solid var(--border);
  gap: 8px;
  user-select: none;
}
.drag-region { -webkit-app-region: drag; }
.no-drag { -webkit-app-region: no-drag; }
.spacer { flex: 1; }
.items { display: flex; align-items: center; gap: 12px; -webkit-app-region: no-drag; }
.item { font-size: 11px; color: var(--dim); white-space: nowrap; }
.status-dot { color: #6c6; }
.status-dot.busy { color: var(--accent); }
</style>
