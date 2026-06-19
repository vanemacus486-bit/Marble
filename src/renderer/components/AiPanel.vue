<script setup>
import { ref, computed, nextTick, watch } from 'vue';
import { NButton, NInput, NScrollbar, NIcon, NSpin, NModal, NEmpty, useMessage } from 'naive-ui';
import {
  ChatbubbleEllipsesOutline, CreateOutline, ArrowForwardOutline,
  TimeOutline, AddOutline, SendOutline,
  DocumentTextOutline, CloseOutline,
} from '@vicons/ionicons5';
import { store, sendAi, clearChat, restoreChat, removeHistory, continuePage, defaultProvider, createNote } from '../store';

const message = useMessage();
const text = ref('');
const scroller = ref(null);
const historyShow = ref(false);

// 对话窗口空态的个性化问候
const greeting = computed(() => {
  const h = new Date().getHours();
  const part = h < 6 ? '凌晨好' : h < 11 ? '早上好' : h < 13 ? '中午好' : h < 19 ? '下午好' : '晚上好';
  const name = store.config && store.config.writing && store.config.writing.userName;
  return name ? `${part}，${name}` : part;
});

// 当前文件名（用于 chip）
const currentFileName = computed(() => {
  if (!store.currentFile) return null;
  return store.currentFile.name;
});

// 文件 chip 是否已解除绑定（视觉上用灰态表示）
const chipDismissed = ref(false);
function dismissChip() {
  chipDismissed.value = true;
}
const showChip = computed(() => currentFileName.value && !chipDismissed.value);

// 当前模型名（用于模型 pill）
const currentModel = computed(() => {
  const c = store.config;
  if (!c) return '';
  const dm = c.defaultModel;
  if (dm && dm.model) return dm.model;
  const prov = defaultProvider();
  if (prov && prov.models && prov.models.length > 0) return prov.models[0];
  return '';
});

function openModelSettings() {
  store.settingsCat = 'model';
  store.settingsOpen = true;
}

// 历史记录按时间倒序
const sortedHistory = computed(() => {
  return [...store.chatHistory].sort((a, b) => b.ts - a.ts);
});

function formatTs(ts) {
  const d = new Date(ts);
  return d.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function handleNewTab() {
  // 用对话的第一条用户消息做文件名
  const firstUser = store.chat.find((m) => m.role === 'user');
  const name = firstUser ? firstUser.content.split('\n')[0].trim().slice(0, 20) || '未命名' : '未命名';
  try {
    await createNote(store.root, name);
  } catch (e) {
    message.error(e.message);
  }
}

function handleNewChat() {
  clearChat();
  chipDismissed.value = false;
}

async function handleContinue() {
  try {
    await continuePage();
  } catch (e) {
    if (e.message === 'NO_KEY') message.warning('请先在 设置 → 模型 配置 API Key');
    else message.error(e.message || String(e));
  }
  scrollBottom();
}

function handleRestore(item) {
  restoreChat(item);
  historyShow.value = false;
}

async function send() {
  const t = text.value.trim();
  if (!t || store.aiBusy) return;
  text.value = '';
  chipDismissed.value = false;
  try {
    await sendAi(t);
  } catch (e) {
    if (e.message === 'NO_KEY') message.warning('请先在 设置 → 模型 配置 API Key');
    else message.error(e.message || String(e));
  }
  scrollBottom();
}

function onKey(e) {
  if ((e.key === 'Enter' && !e.shiftKey) || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) {
    e.preventDefault();
    send();
  }
}

function scrollBottom() {
  nextTick(() => {
    if (scroller.value) scroller.value.scrollTo({ top: 9e9 });
  });
}
watch(() => store.chat.length, scrollBottom);
watch(() => store.chat.map((m) => m.content).join('|'), scrollBottom);
</script>

<template>
  <aside class="ai">
    <!-- 顶部：标题 + 动作图标 -->
    <div class="head">
      <n-icon size="16" class="head-ic"><chatbubble-ellipses-outline /></n-icon>
      <span class="title">AI 助手</span>
      <span class="spacer"></span>
      <div class="head-actions">
        <n-button
          quaternary circle size="tiny"
          title="新对话"
          @click="handleNewChat"
        >
          <template #icon><n-icon :size="15"><create-outline /></n-icon></template>
        </n-button>
        <n-button
          quaternary circle size="tiny"
          title="续写下一页"
          :disabled="!store.currentFile || store.aiBusy"
          @click="handleContinue"
        >
          <template #icon><n-icon :size="15"><arrow-forward-outline /></n-icon></template>
        </n-button>
        <n-button
          quaternary circle size="tiny"
          title="历史记录"
          @click="historyShow = true"
        >
          <template #icon><n-icon :size="15"><time-outline /></n-icon></template>
        </n-button>
        <n-button
          quaternary circle size="tiny"
          title="新建笔记标签页"
          @click="handleNewTab"
        >
          <template #icon><n-icon :size="15"><add-outline /></n-icon></template>
        </n-button>
      </div>
    </div>

    <!-- 消息区 / 空态 -->
    <div v-if="!store.chat.length" class="greet">
      <div class="greet-text">{{ greeting }}</div>
      <div class="greet-sub">让 AI 帮你写点什么，它会生成在中间文档区</div>
    </div>
    <n-scrollbar v-else ref="scroller" class="msgs">
      <div
        v-for="(m, i) in store.chat"
        :key="i"
        class="msg"
        :class="[m.role, m.status]"
      >
        <div class="role">{{ m.role === 'user' ? '你' : 'AI' }}</div>
        <div class="bubble">
          <n-spin v-if="m.status === 'pending'" :size="14" />
          <span>{{ m.content }}</span>
        </div>
      </div>
    </n-scrollbar>

    <!-- 输入卡片 -->
    <div class="composer">
      <!-- 上下文 chip -->
      <div v-if="showChip" class="composer-chip">
        <n-icon :size="13" class="chip-icon"><document-text-outline /></n-icon>
        <span class="chip-name">{{ currentFileName }}</span>
        <button class="chip-dismiss" title="取消绑定" @click="dismissChip">
          <n-icon :size="11"><close-outline /></n-icon>
        </button>
      </div>

      <!-- textarea -->
      <n-input
        v-model:value="text"
        type="textarea"
        :autosize="{ minRows: 2, maxRows: 8 }"
        placeholder="让 AI 写点什么……"
        @keydown="onKey"
        class="composer-input"
      />

      <!-- 底部工具条 -->
      <div class="composer-bar">
        <button class="model-pill" title="切换模型" @click="openModelSettings">
          <span class="model-pill-label">模型</span>
          <span class="model-pill-name">{{ currentModel || '选择模型' }}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" class="model-pill-chevron">
            <polygon points="2,3 8,3 5,7" />
          </svg>
        </button>
        <n-button
          type="primary"
          size="small"
          :loading="store.aiBusy"
          :disabled="!text.trim()"
          @click="send"
          class="composer-send"
        >
          <template #icon><n-icon :size="15"><send-outline /></n-icon></template>
        </n-button>
      </div>
    </div>

    <!-- 历史记录弹窗 -->
    <n-modal v-model:show="historyShow" preset="card" title="对话历史" style="width: 480px; max-height: 70vh;">
      <div v-if="!store.chatHistory.length" class="history-empty">
        <n-empty description="暂无历史对话" />
      </div>
      <n-scrollbar v-else style="max-height: 50vh;">
        <div
          v-for="item in sortedHistory"
          :key="item.id"
          class="history-item"
        >
          <div class="history-body" @click="handleRestore(item)">
            <div class="history-title">{{ item.title }}</div>
            <div class="history-ts">{{ formatTs(item.ts) }} · {{ item.messages.length }} 条消息</div>
          </div>
          <n-button
            quaternary circle size="tiny"
            title="删除"
            @click="removeHistory(item.id)"
          >
            <template #icon><n-icon :size="14"><close-outline /></n-icon></template>
          </n-button>
        </div>
      </n-scrollbar>
    </n-modal>
  </aside>
</template>

<style scoped>
.ai {
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--panel);
  border-left: 1px solid var(--border);
}

/* 顶部 */
.head {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 8px 0 12px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.head-ic { color: var(--dim); margin-right: 6px; flex-shrink: 0; }
.title { font-size: 13px; font-weight: 600; }
.spacer { flex: 1; }
.head-actions { display: flex; align-items: center; gap: 1px; }

/* 消息区 */
.msgs { flex: 1; padding: 8px 10px; }

/* 空态 */
.greet {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 28px;
  text-align: center;
  min-height: 0;
}
.greet-text { font-size: 28px; font-weight: 300; color: var(--text); letter-spacing: .3px; line-height: 1.4; }
.greet-sub { font-size: 13px; color: var(--dim); line-height: 1.5; max-width: 260px; }

/* 气泡 */
.msg { display: flex; flex-direction: column; gap: 3px; margin-bottom: 10px; }
.role { font-size: 11px; color: var(--dim); }
.bubble {
  padding: 7px 10px;
  border-radius: 8px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  background: var(--elev);
  font-size: 13px;
}
.msg.pending .bubble { display: flex; align-items: center; gap: 8px; color: var(--dim); }
.msg.user .bubble { background: color-mix(in srgb, var(--accent) 16%, var(--elev)); }
.msg.error .bubble { background: #3a2222; color: #f0b0b0; }

/* ── 输入卡片 ── */
.composer {
  margin: 8px 10px 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg);
  padding: 6px 8px 4px;
  transition: border-color .2s, box-shadow .2s;
}
.composer:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent);
}

/* 文件 chip */
.composer-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px 2px 6px;
  margin-bottom: 6px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--accent) 12%, var(--panel));
  font-size: 11px;
  max-width: 100%;
  cursor: default;
  color: var(--text);
}
.chip-icon { color: var(--accent); flex-shrink: 0; }
.chip-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chip-dismiss {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  background: transparent;
  color: var(--dim);
  cursor: pointer;
  border-radius: 3px;
  padding: 0;
  flex-shrink: 0;
  transition: background .1s, color .1s;
}
.chip-dismiss:hover { background: var(--hover); color: var(--text); }

/* Naive textarea 去边框 */
.composer-input { width: 100%; }
.composer-input :deep(.n-input) {
  --n-border: none !important;
  --n-box-shadow: none !important;
  background: transparent !important;
}
.composer-input :deep(.n-input__textarea-el) {
  padding: 2px 0 !important;
  font-size: 13px;
  line-height: 1.6;
}
.composer-input :deep(.n-input__border) { display: none; }
.composer-input :deep(.n-input__state-border) { display: none; }

/* 底部工具条 */
.composer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid transparent;
}

/* 模型 pill */
.model-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: transparent;
  color: var(--dim);
  cursor: pointer;
  font-family: inherit;
  font-size: 11px;
  transition: border-color .15s, color .15s, background .15s;
}
.model-pill:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}
.model-pill-label { opacity: .6; }
.model-pill-name { font-weight: 500; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.model-pill-chevron { opacity: .5; flex-shrink: 0; }

/* 发送按钮 */
.composer-send { flex-shrink: 0; }

/* 历史记录 */
.history-empty { padding: 32px 0; }
.history-item { display: flex; align-items: center; gap: 8px; padding: 8px 4px; border-bottom: 1px solid var(--border); }
.history-item:last-child { border-bottom: none; }
.history-body { flex: 1; cursor: pointer; min-width: 0; }
.history-body:hover .history-title { color: var(--accent); }
.history-title { font-size: 14px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.history-ts { font-size: 11px; color: var(--dim); margin-top: 2px; }
</style>
