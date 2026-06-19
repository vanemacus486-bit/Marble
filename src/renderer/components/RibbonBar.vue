<script setup>
import { NIcon } from 'naive-ui';
import {
  MenuOutline, AddOutline, SearchOutline,
  ShuffleOutline, GitNetworkOutline,
  HelpBuoyOutline, SettingsOutline,
} from '@vicons/ionicons5';
import { store, createNote, roamNote, toggleGraph, searchNotes } from '../store';

function toggleSidebar() {
  store.sidebarCollapsed = !store.sidebarCollapsed;
}
function handleSearch() {
  // 聚焦侧栏搜索框 — 通过向 store 发信号通知 SideBar
  store.searchFocus = true;
}
function openSettings() {
  store.settingsCat = 'model';
  store.settingsOpen = true;
}
function newNote() {
  createNote(store.root, '未命名');
}
</script>

<template>
  <nav class="ribbon">
    <div class="ribbon-top">
      <button class="rb-btn" :class="{ active: !store.sidebarCollapsed }" title="切换侧栏" @click="toggleSidebar">
        <n-icon :size="18"><menu-outline /></n-icon>
      </button>
      <button class="rb-btn" title="新建笔记" @click="newNote">
        <n-icon :size="18"><add-outline /></n-icon>
      </button>
      <button class="rb-btn" title="搜索" @click="handleSearch">
        <n-icon :size="18"><search-outline /></n-icon>
      </button>
      <button v-if="store.plugins.roam" class="rb-btn" title="漫游笔记" @click="roamNote">
        <n-icon :size="18"><shuffle-outline /></n-icon>
      </button>
      <button v-if="store.plugins.graph" class="rb-btn" :class="{ active: store.graphVisible }" title="关系图谱" @click="toggleGraph">
        <n-icon :size="18"><git-network-outline /></n-icon>
      </button>
    </div>
    <div class="ribbon-bot">
      <button class="rb-btn" title="帮助">
        <n-icon :size="18"><help-buoy-outline /></n-icon>
      </button>
      <button class="rb-btn" title="设置" @click="openSettings">
        <n-icon :size="18"><settings-outline /></n-icon>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.ribbon {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 44px;
  background: var(--panel);
  border-right: 1px solid var(--border);
  padding: 4px 0;
  gap: 2px;
  user-select: none;
}
.ribbon-top { display: flex; flex-direction: column; align-items: center; gap: 2px; flex: 1; }
.ribbon-bot { display: flex; flex-direction: column; align-items: center; gap: 2px; padding-bottom: 4px; }
.rb-btn {
  -webkit-app-region: no-drag;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--dim);
  cursor: pointer;
  border-radius: 6px;
  transition: background .12s, color .12s;
  font-family: inherit;
  position: relative;
}
.rb-btn:hover { background: var(--hover); color: var(--text); }
.rb-btn.active {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
}
.rb-btn.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 2px;
  background: var(--accent);
  border-radius: 1px;
}
</style>
