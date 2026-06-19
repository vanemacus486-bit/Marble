<script setup>
import { computed } from 'vue';
import { NButton, NIcon, NEmpty } from 'naive-ui';
import { DocumentTextOutline, ChevronBackOutline, ChevronForwardOutline } from '@vicons/ionicons5';
import { store, wrapDoc, stripFences, injectScrollbar, switchPage, canPrevPage, canNextPage, pageInfo } from '../store';

const srcdoc = computed(() =>
  store.docHtml && store.docHtml.trim() ? injectScrollbar(wrapDoc(stripFences(store.docHtml))) : ''
);
const title = computed(() => (store.currentFile ? store.currentFile.name : '未打开笔记'));
const emptyText = computed(() =>
  store.currentFile
    ? '这篇还是空的，在右侧告诉 AI 想写什么'
    : '从左侧选择或新建一篇笔记，再到右侧让 AI 来写'
);
const pInfo = computed(() => pageInfo());
</script>

<template>
  <main class="docpane">
    <div class="topbar">
      <span class="title">{{ title }}</span>
      <span class="spacer"></span>
      <span class="ro">只读 · AI 生成</span>
    </div>
    <div class="body">
      <iframe v-if="srcdoc" class="frame" sandbox :srcdoc="srcdoc"></iframe>
      <div v-else class="empty">
        <n-empty :description="emptyText">
          <template #icon><n-icon><document-text-outline /></n-icon></template>
        </n-empty>
      </div>
    </div>
    <!-- 页导航 -->
    <div v-if="pInfo && store.plugins.pagination" class="page-nav">
      <n-button
        quaternary size="tiny"
        :disabled="!canPrevPage()"
        @click="switchPage(-1)"
      >
        <template #icon><n-icon :size="14"><chevron-back-outline /></n-icon></template>
        上一页
      </n-button>
      <span class="page-indicator">第 {{ pInfo.current }} / {{ pInfo.total }} 页</span>
      <n-button
        quaternary size="tiny"
        :disabled="!canNextPage()"
        @click="switchPage(1)"
      >
        下一页
        <template #icon><n-icon :size="14"><chevron-forward-outline /></n-icon></template>
      </n-button>
    </div>
  </main>
</template>

<style scoped>
.docpane { display: flex; flex-direction: column; min-width: 0; background: var(--bg); }
.topbar {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 14px;
  border-bottom: 1px solid var(--border);
  gap: 8px;
  flex-shrink: 0;
}
.title { font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.spacer { flex: 1; }
.ro { font-size: 11px; color: var(--dim); white-space: nowrap; }
.body { position: relative; flex: 1; min-height: 0; }
.frame { width: 100%; height: 100%; border: none; background: #fff; display: block; }
.empty { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--dim); padding: 0 24px; text-align: center; }

/* 页导航 */
.page-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 30px;
  border-top: 1px solid var(--border);
  background: var(--panel);
  padding: 0 12px;
  flex-shrink: 0;
}
.page-indicator { font-size: 11px; color: var(--dim); white-space: nowrap; }
</style>
