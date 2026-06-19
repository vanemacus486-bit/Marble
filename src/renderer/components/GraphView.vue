<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { NButton, NIcon, NEmpty } from 'naive-ui';
import { CloseOutline, GitNetworkOutline } from '@vicons/ionicons5';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import 'vis-network/styles/vis-network.css';
import { store, openFile, toggleGraph, buildGraph } from '../store';

const container = ref(null);
const loading = ref(true);
const hasData = ref(false);
let network = null;

function initGraph() {
  if (!container.value) return false;
  if (network) { network.destroy(); network = null; }

  const rawNodes = store.graphData.nodes;
  const rawEdges = store.graphData.edges;
  if (!rawNodes || rawNodes.length === 0) return false;

  const nodes = new DataSet(rawNodes.map(n => ({
    id: n.id,
    label: n.label,
    path: n.path,
    shape: 'dot', size: 14, borderWidth: 0,
    font: { size: 13, color: '#c8c8c8', face: 'system-ui' },
    color: { background: '#c8704f', border: '#c8704f', highlight: { background: '#e09070', border: '#e09070' } },
  })));

  const edges = new DataSet(rawEdges.map(e => ({
    from: e.from, to: e.to,
    color: { color: '#444', highlight: '#c8704f', hover: '#888' },
    width: 1.2, smooth: { type: 'continuous' },
  })));

  try {
    network = new Network(container.value, { nodes, edges }, {
      physics: {
        stabilization: { iterations: 300 },
        barnesHut: { gravitationalConstant: -4000, springConstant: 0.005, springLength: 160 },
      },
      interaction: { hover: true, tooltipDelay: 200, navigationButtons: false, keyboard: false },
      layout: { improvedLayout: true },
    });
    network.on('click', (params) => {
      if (params.nodes && params.nodes.length > 0) {
        const nodeData = rawNodes.find(n => n.id === params.nodes[0]);
        if (nodeData) {
          toggleGraph(); // 关闭图谱回到笔记
          openFile({ path: nodeData.path, name: nodeData.label });
        }
      }
    });
    return true;
  } catch (e) {
    console.error('[GraphView] vis-network init failed:', e);
    return false;
  }
}

onMounted(async () => {
  // 等数据到齐
  if (!store.graphData.nodes || !store.graphData.nodes.length) {
    await buildGraph();
  }
  hasData.value = !!(store.graphData.nodes && store.graphData.nodes.length);
  loading.value = false;

  if (hasData.value) {
    // 等 DOM 稳定后再画
    requestAnimationFrame(() => requestAnimationFrame(() => initGraph()));
  }
});

onUnmounted(() => {
  if (network) { network.destroy(); network = null; }
});
</script>

<template>
  <main class="graph-pane">
    <div class="graph-topbar">
      <n-icon size="18" class="ic"><git-network-outline /></n-icon>
      <span class="title">关系图谱</span>
      <span class="node-count">共 {{ store.graphData.nodes.length }} 篇笔记</span>
      <span class="spacer"></span>
      <n-button quaternary circle size="small" title="关闭图谱" @click="toggleGraph">
        <template #icon><n-icon><close-outline /></n-icon></template>
      </n-button>
    </div>
    <div class="graph-body">
      <!-- 空态提示 -->
      <div v-if="!loading && !hasData" class="graph-status">
        <n-empty description="笔记之间还没有链接关系&#10;写笔记时可以用 [[笔记名]] 来创建链接">
          <template #icon><n-icon size="40"><git-network-outline /></n-icon></template>
        </n-empty>
      </div>
      <div v-if="loading" class="graph-status">正在构建图谱…</div>
      <!-- vis-network 画板 -->
      <div ref="container" class="graph-canvas" v-show="!loading && hasData"></div>
    </div>
  </main>
</template>

<style scoped>
.graph-pane { display: flex; flex-direction: column; min-width: 0; min-height: 0; background: var(--bg); }
.graph-topbar { display: flex; align-items: center; height: 44px; padding: 0 18px; border-bottom: 1px solid var(--border); gap: 8px; flex-shrink: 0; }
.graph-topbar .ic { color: var(--accent); }
.graph-topbar .title { font-weight: 600; }
.graph-topbar .node-count { font-size: 12px; color: var(--dim); }
.graph-topbar .spacer { flex: 1; }
.graph-body { flex: 1; min-height: 0; position: relative; }
.graph-canvas { position: absolute; inset: 0; background: var(--bg); }
.graph-canvas :deep(canvas) { outline: none; display: block; }
.graph-status { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; white-space: pre-line; color: var(--dim); }
</style>