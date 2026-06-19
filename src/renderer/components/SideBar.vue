<script setup>
import { ref, computed, nextTick, provide, watch } from 'vue';
import { NButton, NIcon, NScrollbar, NDropdown, NModal, NInput, useDialog, useMessage } from 'naive-ui';
import { SearchOutline, AddOutline, FolderOutline, SettingsOutline, DocumentTextOutline } from '@vicons/ionicons5';
import { store, loadTree, createNote, createFolder, renameNode, removeNode, vaultName, searchNotes, openFile } from '../store';
import TreeNode from './TreeNode.vue';
import VaultSwitcher from './VaultSwitcher.vue';

const dialog = useDialog();
const message = useMessage();

// 搜索
const searchRef = ref('');

function onSearchInput(val) {
  searchNotes(val);
}

function clearSearch() {
  searchRef.value = '';
  store.searchQuery = '';
  store.searchResults = [];
}

function openResult(item) {
  clearSearch();
  openFile({ path: item.path, name: item.name });
}

// 响应 ribbon 搜索请求
watch(() => store.searchFocus, (val) => {
  if (val) {
    // 展开侧栏
    store.sidebarCollapsed = false;
    nextTick(() => {
      // 让搜索框获得焦点
      const el = document.querySelector('.sidebar .n-input input');
      if (el) el.focus();
    });
    store.searchFocus = false;
  }
});

// 响应 Ctrl+N 新建请求
watch(() => store.newNoteRequest, (val) => {
  if (val) {
    newNoteRoot();
    store.newNoteRequest = false;
  }
});

// 右键菜单
const ctxShow = ref(false);
const ctxX = ref(0);
const ctxY = ref(0);
const ctxNode = ref(null);
provide('nodeContext', (node, e) => {
  ctxNode.value = node;
  ctxX.value = e.clientX;
  ctxY.value = e.clientY;
  ctxShow.value = false;
  nextTick(() => { ctxShow.value = true; });
});
const ctxOptions = computed(() => {
  const n = ctxNode.value;
  if (!n) return [];
  const arr = [];
  if (n.type === 'folder') {
    arr.push({ label: '新建笔记', key: 'note' });
    arr.push({ label: '新建文件夹', key: 'folder' });
  }
  arr.push({ label: '重命名', key: 'rename' });
  arr.push({ label: '删除', key: 'delete' });
  return arr;
});
function onCtxSelect(key) {
  ctxShow.value = false;
  const n = ctxNode.value;
  if (!n) return;
  if (key === 'note') promptName('新建笔记', '未命名', (name) => createNote(n.path, name));
  else if (key === 'folder') promptName('新建文件夹', '新文件夹', (name) => createFolder(n.path, name));
  else if (key === 'rename') promptName('重命名', n.name, (name) => renameNode(n, name, n.type === 'folder'));
  else if (key === 'delete') confirmDelete(n);
}

// 名称输入弹窗
const nameShow = ref(false);
const nameTitle = ref('');
const nameValue = ref('');
let nameCb = null;
function promptName(title, def, cb) {
  nameTitle.value = title;
  nameValue.value = def;
  nameCb = cb;
  nameShow.value = true;
}
async function confirmName() {
  const cb = nameCb;
  const val = nameValue.value.trim();
  nameShow.value = false;
  if (cb && val) {
    try { await cb(val); } catch (e) { message.error(e.message); }
  }
}

function confirmDelete(n) {
  dialog.warning({
    title: '删除',
    content: `确定删除「${n.name}」吗？${n.type === 'folder' ? '（含其中所有内容）' : ''}`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => removeNode(n).catch((e) => message.error(e.message)),
  });
}

// 树顶操作
function newNoteRoot() { promptName('新建笔记', '未命名', (name) => createNote(store.root, name)); }
function newFolderRoot() { promptName('新建文件夹', '新文件夹', (name) => createFolder(store.root, name)); }
function collapseAll() {
  // 通过派发折叠信号 — 用自定义事件冒泡或重置 open 状态
  // 简化实现：重新加载树会重置所有展开状态
  loadTree();
}

const name = computed(() => vaultName());
</script>

<template>
  <aside class="sidebar">
    <!-- 搜索框 -->
    <div class="search-row" v-if="store.plugins.search">
      <n-input
        v-model:value="searchRef"
        placeholder="搜索笔记…"
        size="small"
        clearable
        @update:value="onSearchInput"
        @clear="clearSearch"
      >
        <template #prefix>
          <n-icon :size="14"><search-outline /></n-icon>
        </template>
      </n-input>
    </div>

    <!-- 搜索结果 -->
    <div v-if="store.searchQuery && store.searchResults.length" class="search-results">
      <n-scrollbar class="results-scroll">
        <div
          v-for="r in store.searchResults"
          :key="r.path"
          class="result-item"
          @click="openResult(r)"
        >
          <div class="result-name">
            <n-icon :size="13" class="doc-ic"><document-text-outline /></n-icon>
            {{ r.name }}
          </div>
          <div class="result-snippet">{{ r.snippet }}</div>
        </div>
      </n-scrollbar>
    </div>
    <div v-else-if="store.searchQuery && !store.searchResults.length" class="search-empty">
      无匹配结果
    </div>
    <template v-else>
      <!-- 文件头：库名 + 操作 -->
      <div class="tree-header">
        <span class="header-title">文件列表</span>
        <div class="header-actions">
          <button class="th-btn" title="新建笔记" @click="newNoteRoot">
            <n-icon :size="14"><add-outline /></n-icon>
          </button>
          <button class="th-btn" title="新建文件夹" @click="newFolderRoot">
            <n-icon :size="14"><folder-outline /></n-icon>
          </button>
          <button class="th-btn" title="折叠全部" @click="collapseAll">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="2" y1="4" x2="12" y2="4"/><line x1="2" y1="7" x2="12" y2="7"/><line x1="2" y1="10" x2="12" y2="10"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 文件树 -->
      <n-scrollbar class="tree">
        <tree-node v-for="n in store.tree" :key="n.path" :node="n" :depth="0" />
        <div v-if="!store.tree.length" class="empty">还没有笔记，点 ＋ 新建</div>
      </n-scrollbar>
    </template>

    <!-- 库切换器（侧栏底部） -->
    <vault-switcher />

    <!-- 右键菜单 -->
    <n-dropdown
      trigger="manual"
      placement="bottom-start"
      :show="ctxShow"
      :x="ctxX"
      :y="ctxY"
      :options="ctxOptions"
      @select="onCtxSelect"
      @clickoutside="ctxShow = false"
    />

    <!-- 命名弹窗 -->
    <n-modal v-model:show="nameShow" preset="card" :title="nameTitle" style="width: 380px">
      <n-input v-model:value="nameValue" autofocus @keyup.enter="confirmName" />
      <template #footer>
        <div class="modal-footer">
          <n-button @click="nameShow = false">取消</n-button>
          <n-button type="primary" @click="confirmName">确定</n-button>
        </div>
      </template>
    </n-modal>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--panel);
  border-right: 1px solid var(--border);
  overflow: hidden;
  transition: width .2s ease;
}
.search-row { padding: 6px 8px 4px; flex-shrink: 0; }

/* 树头部 */
.tree-header {
  display: flex;
  align-items: center;
  height: 30px;
  padding: 0 10px 0 12px;
  gap: 4px;
  flex-shrink: 0;
}
.header-title { font-size: 11px; font-weight: 700; color: var(--dim); text-transform: uppercase; letter-spacing: .4px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.header-actions { display: flex; align-items: center; gap: 2px; }
.th-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--dim);
  cursor: pointer;
  border-radius: 4px;
  transition: background .12s, color .12s;
  font-family: inherit;
}
.th-btn:hover { background: var(--hover); color: var(--text); }

.tree { flex: 1; padding: 2px 6px 4px; }
.empty { color: var(--dim); font-size: 12px; padding: 16px 8px; text-align: center; }
.modal-footer { display: flex; gap: 8px; justify-content: flex-end; }

/* 搜索结果 */
.search-results { flex: 1; min-height: 0; }
.results-scroll { height: 100%; padding: 4px 8px; }
.result-item { padding: 5px 8px; border-radius: 4px; cursor: pointer; margin-bottom: 1px; }
.result-item:hover { background: var(--hover); }
.result-name { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 500; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.doc-ic { color: var(--dim); flex-shrink: 0; }
.result-snippet { font-size: 11px; color: var(--dim); margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-left: 18px; }
.search-empty { flex: 1; display: flex; align-items: center; justify-content: center; font-size: 12px; color: var(--dim); padding: 24px; }
</style>
