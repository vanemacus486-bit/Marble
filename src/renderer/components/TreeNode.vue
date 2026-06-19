<script setup>
import { ref, inject, computed } from 'vue';
import { NIcon } from 'naive-ui';
import { FolderOutline, FolderOpenOutline, DocumentTextOutline } from '@vicons/ionicons5';
import { store, openFile } from '../store';

defineOptions({ name: 'TreeNode' });
const props = defineProps({ node: { type: Object, required: true }, depth: { type: Number, default: 0 } });
const nodeContext = inject('nodeContext');
const open = ref(false);

function onClick() {
  if (props.node.type === 'folder') open.value = !open.value;
  else openFile(props.node);
}
function onCtx(e) {
  nodeContext(props.node, e);
}
const isActive = () =>
  props.node.type === 'file' && store.currentFile && store.currentFile.path === props.node.path;

const hasChildren = computed(() => props.node.type === 'folder' && props.node.children && props.node.children.length > 0);
</script>

<template>
  <div class="tree-node">
    <div
      class="row"
      :class="{ active: isActive() }"
      :style="{ paddingLeft: (depth * 17 + 6) + 'px' }"
      @click="onClick"
      @contextmenu.prevent.stop="onCtx"
    >
      <!-- 折叠三角 -->
      <span v-if="node.type === 'folder'" class="arrow" :class="{ expanded: open }">
        <svg width="10" height="10" viewBox="0 0 10 10">
          <polygon points="3,2 8,5 3,8" fill="currentColor"/>
        </svg>
      </span>
      <span v-else class="arrow-placeholder"></span>
      <!-- 图标 -->
      <n-icon size="14" class="ic">
        <component :is="node.type === 'folder' ? (open ? FolderOpenOutline : FolderOutline) : DocumentTextOutline" />
      </n-icon>
      <span class="name">{{ node.name }}</span>
    </div>
    <!-- 缩进引导线 + 子节点 -->
    <div v-if="node.type === 'folder' && open" class="children">
      <tree-node v-for="c in node.children" :key="c.path" :node="c" :depth="depth + 1" />
    </div>
  </div>
</template>

<style scoped>
.tree-node { position: relative; }

.row {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 6px;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  user-select: none;
  font-size: 13px;
  transition: background .1s;
  position: relative;
}
.row:hover { background: var(--hover); }
.row.active { background: var(--active); }

.arrow {
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dim);
  cursor: pointer;
  transition: transform .15s;
  border-radius: 3px;
}
.arrow:hover { background: var(--hover); color: var(--text); }
.arrow.expanded { transform: rotate(90deg); }
.arrow-placeholder { width: 12px; flex-shrink: 0; }

.ic { color: var(--dim); flex: none; }
.name { overflow: hidden; text-overflow: ellipsis; }

.children { position: relative; }
</style>
