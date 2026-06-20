<script setup>
import { computed, onMounted, onUnmounted } from 'vue';
import {
  NConfigProvider, NMessageProvider, NDialogProvider, NGlobalStyle,
  darkTheme, zhCN, dateZhCN,
} from 'naive-ui';
import { store, bootApp } from './store';
import { STYLE_MAP, accentOverrides } from './themes';
import WelcomeScreen from './components/WelcomeScreen.vue';
import TitleTabBar from './components/TitleTabBar.vue';
import RibbonBar from './components/RibbonBar.vue';
import SideBar from './components/SideBar.vue';
import DocViewer from './components/DocViewer.vue';
import GraphView from './components/GraphView.vue';
import AiPanel from './components/AiPanel.vue';
import StatusBar from './components/StatusBar.vue';
import SettingsModal from './components/SettingsModal.vue';
import registerShortcuts from './shortcuts';

const theme = computed(() => (store.theme === 'dark' ? darkTheme : null));
// 让 Naive 组件的主色跟随当前视觉风格的强调色
const themeOverrides = computed(() => {
  const s = STYLE_MAP[store.appearance.style] || STYLE_MAP.graphite;
  const accent = (s[store.theme] || s.dark)['--accent'];
  return accentOverrides(accent);
});
onMounted(() => {
  bootApp();
  const off = registerShortcuts();
  onUnmounted(off);
});
</script>

<template>
  <n-config-provider :theme="theme" :theme-overrides="themeOverrides" :locale="zhCN" :date-locale="dateZhCN">
    <n-global-style />
    <n-message-provider>
      <n-dialog-provider>
        <div class="root" :class="store.theme">
          <!-- 启动占位：配置加载完成前显示纯色背景，消除 WelcomeScreen 闪烁 -->
          <div v-if="!store.booted" class="boot-placeholder"></div>
          <welcome-screen v-else-if="!store.ready" />
          <div v-else class="app-shell" :class="{ 'sidebar-collapsed': store.sidebarCollapsed }">
            <!-- 顶部通栏（tabbar） -->
            <title-tab-bar />
            <!-- 左侧 ribbon -->
            <ribbon-bar />
            <!-- 侧栏文件树 -->
            <side-bar />
            <!-- 编辑区 -->
            <graph-view v-if="store.graphVisible" />
            <doc-viewer v-else />
            <!-- AI 面板 -->
            <ai-panel />
            <!-- 底部状态栏 -->
            <status-bar />
          </div>
          <settings-modal />
        </div>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<style>
/* Obsidian 骨架栅格 */
.app-shell {
  display: grid;
  grid-template-columns: 44px 248px 1fr 372px;
  grid-template-rows: 40px 1fr 22px;
  grid-template-areas:
    "tabbar tabbar  tabbar tabbar"
    "ribbon sidebar editor ai"
    "status status  status status";
  height: 100%;
  min-height: 0;
}
.app-shell > header { grid-area: tabbar; }
.app-shell > nav { grid-area: ribbon; }
.app-shell > aside.sidebar { grid-area: sidebar; }
.app-shell > main { grid-area: editor; }
.app-shell > aside.ai { grid-area: ai; }
.app-shell > footer { grid-area: status; }

/* 侧栏折叠：把 sidebar 列设为 0 */
.app-shell.sidebar-collapsed {
  grid-template-columns: 44px 0px 1fr 372px;
}
.app-shell.sidebar-collapsed > aside.sidebar {
  overflow: hidden;
}

/* 全局滚动条薄化 */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-thumb { background: var(--scrollbar); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-hover); }
::-webkit-scrollbar-track { background: transparent; }

/* 启动占位：配置加载时的中性纯色背景，不渲染任何内容 */
.boot-placeholder {
  width: 100%;
  height: 100%;
  background: #1e1e1e;
}
</style>
