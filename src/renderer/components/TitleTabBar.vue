<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { NButton, NIcon } from 'naive-ui';
import {
  MenuOutline, ChevronBackOutline, ChevronForwardOutline,
  AddOutline, CloseOutline, DocumentTextOutline,
  EllipsisHorizontalOutline,
} from '@vicons/ionicons5';
import { store, switchTab, closeTab, navBack, navForward, canGoBack, canGoForward, createNote } from '../store';

const win = window.api.win;
const isMax = ref(false);

let unsub = null;
onMounted(async () => {
  try { isMax.value = await win.isMaximized(); } catch { /* ignore */ }
  unsub = win.onMaximizeChange((v) => { isMax.value = v; });
});
onUnmounted(() => { if (unsub) unsub(); });

function toggleSidebar() {
  store.sidebarCollapsed = !store.sidebarCollapsed;
}
function handleNewTab() {
  createNote(store.root, '未命名');
}
</script>

<template>
  <header class="title-tab-bar drag-region">
    <!-- 左侧：侧栏折叠 + 前进/后退 -->
    <div class="left-actions no-drag">
      <n-button quaternary circle size="tiny" title="切换侧栏" @click="toggleSidebar">
        <template #icon><n-icon :size="16"><menu-outline /></n-icon></template>
      </n-button>
      <n-button quaternary circle size="tiny" :disabled="!canGoBack()" title="上一步" @click="navBack">
        <template #icon><n-icon :size="14"><chevron-back-outline /></n-icon></template>
      </n-button>
      <n-button quaternary circle size="tiny" :disabled="!canGoForward()" title="下一步" @click="navForward">
        <template #icon><n-icon :size="14"><chevron-forward-outline /></n-icon></template>
      </n-button>
    </div>

    <!-- 中间：标签条 -->
    <div class="tabs-area no-drag">
      <div
        v-for="(tab, i) in store.tabs"
        :key="tab.path"
        class="tab"
        :class="{ active: i === store.activeTabIdx }"
        @click="switchTab(i)"
      >
        <n-icon :size="13" class="tab-icon"><document-text-outline /></n-icon>
        <span class="tab-name">{{ tab.name }}</span>
        <n-button
          quaternary circle size="tiny"
          class="tab-close"
          @click.stop="closeTab(i)"
        >
          <template #icon><n-icon :size="10"><close-outline /></n-icon></template>
        </n-button>
      </div>
      <n-button quaternary circle size="tiny" class="tab-add" title="新建笔记" @click="handleNewTab">
        <template #icon><n-icon :size="14"><add-outline /></n-icon></template>
      </n-button>
    </div>

    <!-- 右侧：视图操作 + 窗口控制 -->
    <div class="right-actions no-drag">
      <n-button quaternary circle size="tiny" title="更多">
        <template #icon><n-icon :size="16"><ellipsis-horizontal-outline /></n-icon></template>
      </n-button>
      <div class="win-btns">
        <button class="win-btn win-min" title="最小化" @click="win.minimize">
          <svg width="10" height="10" viewBox="0 0 10 10"><rect x="1" y="4.5" width="8" height="1" fill="currentColor"/></svg>
        </button>
        <button class="win-btn win-max" :title="isMax ? '还原' : '最大化'" @click="win.toggleMaximize">
          <svg v-if="!isMax" width="10" height="10" viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8" rx="1" fill="none" stroke="currentColor" stroke-width="1"/></svg>
          <svg v-else width="10" height="10" viewBox="0 0 10 10">
            <rect x="2.5" y="0" width="7" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1"/>
            <rect x="0" y="2.5" width="7" height="7" rx="1" fill="var(--bg)" stroke="currentColor" stroke-width="1"/>
          </svg>
        </button>
        <button class="win-btn win-close" title="关闭" @click="win.close">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" stroke-width="1.2"/>
            <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" stroke-width="1.2"/>
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.title-tab-bar {
  display: flex;
  align-items: center;
  height: 40px;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  padding: 0 4px 0 8px;
  gap: 4px;
  user-select: none;
}
.drag-region { -webkit-app-region: drag; }
.no-drag, .no-drag * { -webkit-app-region: no-drag; }

/* 左：导航按钮 */
.left-actions { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }

/* 中间：标签条 */
.tabs-area {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  height: 100%;
  padding: 0 4px;
}
.tabs-area::-webkit-scrollbar { height: 2px; }
.tabs-area::-webkit-scrollbar-thumb { background: var(--dim); border-radius: 2px; }

.tab {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 6px 0 10px;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  font-size: 12px;
  color: var(--dim);
  white-space: nowrap;
  flex-shrink: 0;
  max-width: 160px;
  position: relative;
  transition: background .15s, color .15s;
}
.tab:hover { background: var(--hover); color: var(--text); }
.tab.active {
  background: var(--panel);
  color: var(--text);
  font-weight: 500;
}
.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 8px;
  right: 8px;
  height: 2px;
  background: var(--accent);
  border-radius: 1px;
}
.tab-icon { flex-shrink: 0; color: var(--dim); }
.tab.active .tab-icon { color: var(--accent); }
.tab-name { overflow: hidden; text-overflow: ellipsis; }
.tab-close { opacity: 0; flex-shrink: 0; transition: opacity .12s; }
.tab:hover .tab-close { opacity: .6; }
.tab-close:hover { opacity: 1 !important; }
.tab.active .tab-close { opacity: .5; }
.tab-add { flex-shrink: 0; color: var(--dim); margin-left: 2px; }

/* 右侧 */
.right-actions { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }

/* 窗口控制三键 */
.win-btns { display: flex; align-items: center; margin-left: 4px; }
.win-btn {
  -webkit-app-region: no-drag;
  background: transparent;
  border: none;
  color: var(--dim);
  width: 36px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background .12s, color .12s;
  font-family: inherit;
  border-radius: 0;
}
.win-btn:hover { background: var(--hover); color: var(--text); }
.win-close:hover { background: #e81123; color: #fff; }
</style>
