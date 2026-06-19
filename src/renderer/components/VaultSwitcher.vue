<script setup>
import { computed, ref } from 'vue';
import { NIcon, NPopover, useMessage } from 'naive-ui';
import { ChevronDownOutline, CheckmarkOutline, CloseOutline, FolderOpenOutline } from '@vicons/ionicons5';
import { store, vaultName, recentVaults, switchVaultTo, forgetVault, chooseVault } from '../store';

const message = useMessage();
const popoverShow = ref(false);
const name = computed(() => vaultName());
const vaults = computed(() => recentVaults());

async function handleSwitch(path) {
  try {
    await switchVaultTo(path);
    popoverShow.value = false;
  } catch (e) {
    message.error(e.message || '切换失败');
  }
}

async function handleForget(path, e) {
  e.stopPropagation();
  try {
    await forgetVault(path);
  } catch (e2) {
    message.error(e2.message || '移除失败');
  }
}

async function handleOpenOther() {
  popoverShow.value = false;
  await chooseVault();
}
</script>

<template>
  <div class="vault-switcher">
    <n-popover
      v-model:show="popoverShow"
      trigger="click"
      placement="top-start"
      :width="260"
      style="padding: 0;"
    >
      <template #trigger>
        <div class="vault-name" title="切换笔记库">
          <n-icon :size="14" class="vault-chevron"><chevron-down-outline /></n-icon>
          {{ name }}
        </div>
      </template>

      <div class="vault-popover">
        <div class="vp-list">
          <div
            v-for="v in vaults"
            :key="v.path"
            class="vp-item"
            :class="{ current: v.current }"
            @click="v.current ? null : handleSwitch(v.path)"
          >
            <div class="vp-item-info">
              <div class="vp-item-name">{{ v.name }}</div>
              <div class="vp-item-path">{{ v.path }}</div>
            </div>
            <span v-if="v.current" class="vp-check">
              <n-icon :size="16"><checkmark-outline /></n-icon>
            </span>
            <button
              v-else
              class="vp-forget"
              title="从列表移除"
              @click="(e) => handleForget(v.path, e)"
            >
              <n-icon :size="12"><close-outline /></n-icon>
            </button>
          </div>
        </div>
        <div class="vp-divider"></div>
        <button class="vp-open" @click="handleOpenOther">
          <n-icon :size="16" class="vp-open-ic"><folder-open-outline /></n-icon>
          打开其他文件夹…
        </button>
      </div>
    </n-popover>
  </div>
</template>

<style scoped>
.vault-switcher {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 8px 0 6px;
  background: var(--panel);
  border-top: 1px solid var(--border);
  flex-shrink: 0;
  user-select: none;
}
.vault-name {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 3px;
  transition: color .12s;
  -webkit-app-region: no-drag;
}
.vault-name:hover { color: var(--accent); }
.vault-chevron { color: var(--dim); flex-shrink: 0; }
.vault-name:hover .vault-chevron { color: var(--accent); }

/* popover 内容 */
.vault-popover {
  background: var(--panel);
  border-radius: 8px;
  padding: 6px;
  min-width: 240px;
}
.vp-list { display: flex; flex-direction: column; gap: 2px; }
.vp-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background .1s;
}
.vp-item:hover { background: var(--hover); }
.vp-item.current { cursor: default; }
.vp-item-info { flex: 1; min-width: 0; }
.vp-item-name { font-size: 13px; font-weight: 500; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vp-item-path { font-size: 11px; color: var(--dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 1px; }
.vp-check { color: var(--accent); flex-shrink: 0; }
.vp-forget {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  color: var(--dim);
  cursor: pointer;
  border-radius: 4px;
  flex-shrink: 0;
  transition: background .1s, color .1s;
  opacity: 0;
}
.vp-item:hover .vp-forget { opacity: 1; }
.vp-forget:hover { background: var(--hover); color: var(--text); }

.vp-divider { height: 1px; background: var(--border); margin: 4px 0; }

.vp-open {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 8px;
  border: none;
  background: transparent;
  color: var(--text);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  border-radius: 6px;
  transition: background .1s;
}
.vp-open:hover { background: var(--hover); }
.vp-open-ic { color: var(--dim); flex-shrink: 0; }
</style>
