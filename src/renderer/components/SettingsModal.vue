<script setup>
import { ref, computed, watch } from 'vue';
import {
  NModal, NButton, NInput, NSelect, NScrollbar, NTag, NCheckbox, NSpin,
  NRadioGroup, NRadioButton, NIcon, useDialog, useMessage,
} from 'naive-ui';
import { CheckmarkCircle, CloseOutline } from '@vicons/ionicons5';
import { NSwitch } from 'naive-ui';
import {
  store, saveWriting, saveAppearance, chooseVault,
  saveProviders, setDefaultModel, fetchModelsFor, savePlugin,
} from '../store';
import { VISUAL_STYLES } from '../themes';
import { HTML_STYLES } from '../html-styles';

const message = useMessage();
const dialog = useDialog();

const cats = [
  { key: 'model', label: '模型' },
  { key: 'appearance', label: '外观' },
  { key: 'plugins', label: '插件' },
  { key: 'shortcuts', label: '快捷键' },
  { key: 'about', label: '关于' },
  { divider: true },
  { key: 'vault', label: '存储' },
  { key: 'writing', label: 'AI' },
];
const cat = computed({
  get: () => store.settingsCat,
  set: (v) => { store.settingsCat = v; },
});
// 外观：任意一项变更都即时生效并持久化
function onAppr(key, val) { saveAppearance({ [key]: val }); }

// ============ 模型 ============
const modelTab = ref('use'); // 'use' | 'access'
const providers = computed(() => (store.config && store.config.providers) || []);

// 使用页：默认模型下拉（按供应商分组，只列已启用模型）
const enabledModelOptions = computed(() =>
  providers.value
    .map((p) => ({
      type: 'group',
      label: p.name,
      key: p.id,
      children: (p.models || []).map((m) => ({ label: m, value: `${p.id}::${m}` })),
    }))
    .filter((g) => g.children.length)
);
const defaultModelKey = computed({
  get() {
    const dm = store.config && store.config.defaultModel;
    return dm && dm.providerId ? `${dm.providerId}::${dm.model}` : null;
  },
  set(v) {
    if (!v) return;
    const i = v.indexOf('::');
    setDefaultModel({ providerId: v.slice(0, i), model: v.slice(i + 2) });
  },
});

// 接入页：供应商配置弹窗（新增 / 编辑）
const provShow = ref(false);
const provIsNew = ref(false);
const provDraft = ref({ id: '', name: '', baseUrl: '', apiKey: '', builtin: false });

function addProvider() {
  provIsNew.value = true;
  provDraft.value = { id: '', name: '', baseUrl: 'https://', apiKey: '', builtin: false };
  provShow.value = true;
}
function configProvider(p) {
  provIsNew.value = false;
  provDraft.value = { id: p.id, name: p.name, baseUrl: p.baseUrl, apiKey: p.apiKey || '', builtin: !!p.builtin };
  provShow.value = true;
}
async function saveProvider() {
  const d = provDraft.value;
  const name = (d.name || '').trim();
  const baseUrl = (d.baseUrl || '').trim().replace(/\/+$/, '');
  if (!name) return message.warning('请填写名称');
  if (!baseUrl) return message.warning('请填写接口地址');
  const list = providers.value.map((x) => ({ ...x }));
  if (provIsNew.value) {
    list.push({
      id: 'p_' + Date.now().toString(36),
      name,
      builtin: false,
      protocol: 'openai',
      baseUrl,
      apiKey: (d.apiKey || '').trim(),
      models: [],
    });
  } else {
    const t = list.find((x) => x.id === d.id);
    if (t) { t.name = name; t.baseUrl = baseUrl; t.apiKey = (d.apiKey || '').trim(); }
  }
  await saveProviders(list);
  provShow.value = false;
  message.success('已保存');
}
function removeProvider(p) {
  dialog.warning({
    title: '移除接入',
    content: `确定移除「${p.name}」吗？它启用的模型也会一起移除。`,
    positiveText: '移除',
    negativeText: '取消',
    onPositiveClick: async () => {
      const list = providers.value.filter((x) => x.id !== p.id);
      const dm = store.config.defaultModel || {};
      let nextDefault;
      if (dm.providerId === p.id) {
        const first = list.find((x) => (x.models || []).length);
        nextDefault = first
          ? { providerId: first.id, model: first.models[0] }
          : { providerId: list[0] ? list[0].id : '', model: '' };
      }
      await saveProviders(list, nextDefault);
    },
  });
}

// 接入页：刷新 / 启用模型弹窗
const modelsShow = ref(false);
const modelsProv = ref(null);
const modelsFetched = ref([]);
const modelsChecked = ref([]);
const modelsLoading = ref(false);
const modelsErr = ref('');
// 复选框列表 = 拉取到的 ∪ 原本已启用的（失败时也能保留旧选择）
const modelChoices = computed(() => {
  const base = modelsProv.value ? modelsProv.value.models || [] : [];
  return [...new Set([...modelsFetched.value, ...base])];
});

async function refreshProvider(p) {
  modelsProv.value = p;
  modelsChecked.value = [...(p.models || [])];
  modelsFetched.value = [];
  modelsErr.value = '';
  modelsShow.value = true;
  if (!p.apiKey) { modelsErr.value = '该供应商还没有 API Key，请先「配置」。'; return; }
  modelsLoading.value = true;
  try {
    modelsFetched.value = await fetchModelsFor({ baseUrl: p.baseUrl, apiKey: p.apiKey });
    if (!modelsFetched.value.length) modelsErr.value = '接口未返回任何模型。';
  } catch (e) {
    modelsErr.value = '拉取失败：' + (e.message || e);
  } finally {
    modelsLoading.value = false;
  }
}
function toggleModel(m, checked) {
  const s = new Set(modelsChecked.value);
  if (checked) s.add(m); else s.delete(m);
  modelsChecked.value = [...s];
}
async function saveModels() {
  const p = modelsProv.value;
  if (!p) return;
  const list = providers.value.map((x) =>
    x.id === p.id ? { ...x, models: [...modelsChecked.value] } : { ...x }
  );
  // 默认模型若被取消启用，自动改到一个仍启用的模型
  const dm = store.config.defaultModel || {};
  let nextDefault;
  const stillOk = list.some((x) => x.id === dm.providerId && (x.models || []).includes(dm.model));
  if (!stillOk) {
    const first = list.find((x) => (x.models || []).length);
    if (first) nextDefault = { providerId: first.id, model: first.models[0] };
  }
  await saveProviders(list, nextDefault);
  modelsShow.value = false;
  message.success('已保存');
}

// ============ 写作偏好 / 关于 ============
const userName = ref('');
const style = ref('');
const currentHtmlStyle = computed(() =>
  (store.config.writing && store.config.writing.htmlStyle) || 'clean'
);
function onPickHtmlStyle(key) {
  saveWriting({ htmlStyle: key });
}
const about = ref({ version: '', buildTime: null });
const changelog = ref('');

watch(() => store.settingsOpen, (open) => { if (open) fill(); });
watch(cat, (c) => { if (c === 'about') loadAbout(); });

function fill() {
  const c = store.config || {};
  userName.value = (c.writing && c.writing.userName) || '';
  style.value = (c.writing && c.writing.stylePrompt) || '';
  if (store.settingsCat === 'about') loadAbout();
}
async function onSaveWriting() {
  await saveWriting({ userName: userName.value.trim(), stylePrompt: style.value });
  message.success('已保存');
}
async function onSwitchVault() { await chooseVault(); message.success('已切换'); }

async function loadAbout() {
  about.value = await window.api.app.buildInfo();
  changelog.value = mdLite(await window.api.app.changelog());
}
const buildTimeText = computed(() =>
  about.value.buildTime ? new Date(about.value.buildTime).toLocaleString('zh-CN') : '（开发模式）'
);
const vaultPath = computed(() => (store.config && store.config.vaultPath) || '（未选择）');

function mdLite(md) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s) => s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>');
  let html = '';
  let inList = false;
  const close = () => { if (inList) { html += '</ul>'; inList = false; } };
  for (const line of esc(md || '').split('\n')) {
    let m;
    if ((m = line.match(/^###\s+(.*)/))) { close(); html += '<h4>' + inline(m[1]) + '</h4>'; }
    else if ((m = line.match(/^##\s+(.*)/))) { close(); html += '<h3>' + inline(m[1]) + '</h3>'; }
    else if ((m = line.match(/^#\s+(.*)/))) { close(); html += '<h2>' + inline(m[1]) + '</h2>'; }
    else if ((m = line.match(/^\s*[-*]\s+(.*)/))) { if (!inList) { html += '<ul>'; inList = true; } html += '<li>' + inline(m[1]) + '</li>'; }
    else if (line.trim() === '') { close(); }
    else { close(); html += '<p>' + inline(line) + '</p>'; }
  }
  close();
  return html;
}

// ---- 左侧导航 ----
import {
  CubeOutline, ColorPaletteOutline, ExtensionPuzzleOutline,
  KeypadOutline, InformationCircleOutline, FolderOpenOutline, SparklesOutline,
} from '@vicons/ionicons5';

const navIconMap = {
  model: CubeOutline,
  appearance: ColorPaletteOutline,
  plugins: ExtensionPuzzleOutline,
  shortcuts: KeypadOutline,
  about: InformationCircleOutline,
  vault: FolderOpenOutline,
  writing: SparklesOutline,
};

const navGroups = [
  { label: '选项', items: ['model', 'writing', 'appearance', 'plugins', 'shortcuts', 'vault', 'about'] },
];

const navLabelMap = Object.fromEntries(cats.filter(c => !c.divider).map(c => [c.key, c.label]));

const PLUGIN_LIST = [
  { key: 'roam',       name: '漫游笔记', desc: '工具栏随机打开一则笔记的按钮' },
  { key: 'search',     name: '搜索',     desc: '侧边栏搜索输入框' },
  { key: 'graph',      name: '关系图谱', desc: '工具栏图谱按钮，可视化笔记间链接关系' },
  { key: 'pagination', name: '翻页',     desc: '多页笔记的上下翻页导航' },
];
</script>

<template>
  <n-modal v-model:show="store.settingsOpen" style="width: 940px; max-width: 94vw;">
    <div class="settings-card" :class="store.theme">
      <!-- 左侧导航 -->
      <aside class="settings-nav">
        <div v-for="group in navGroups" :key="group.label" class="nav-group">
          <div class="nav-group-label">{{ group.label }}</div>
          <button
            v-for="key in group.items"
            :key="key"
            class="nav-item"
            :class="{ active: cat === key }"
            @click="cat = key"
          >
            <n-icon :size="16" class="nav-item-ic">
              <component :is="navIconMap[key]" />
            </n-icon>
            <span>{{ navLabelMap[key] }}</span>
          </button>
        </div>
      </aside>

      <!-- 右侧内容 -->
      <div class="settings-main">
        <button class="settings-close" title="关闭" @click="store.settingsOpen = false">
          <n-icon :size="18"><close-outline /></n-icon>
        </button>
        <n-scrollbar class="content" content-style="padding: 26px 30px 40px;">
          <!-- 模型 -->
          <section v-if="cat === 'model'">
            <h3 class="ptitle">模型</h3>
            <div class="subtabs">
              <button class="subtab" :class="{ active: modelTab === 'use' }" @click="modelTab = 'use'">使用</button>
              <button class="subtab" :class="{ active: modelTab === 'access' }" @click="modelTab = 'access'">接入</button>
            </div>

            <!-- 使用 -->
            <template v-if="modelTab === 'use'">
              <div class="setting-row">
                <div class="srow-label">
                  <div class="srow-name">默认模型</div>
                  <div class="srow-desc">生成笔记时使用的模型，只能从下方已接入供应商的「已启用模型」里选。</div>
                </div>
                <n-select
                  v-model:value="defaultModelKey"
                  :options="enabledModelOptions"
                  placeholder="选择模型"
                  style="width: 260px"
                />
              </div>
              <p v-if="!enabledModelOptions.length" class="hint">还没有可用模型。请到「接入」配置供应商并启用模型。</p>
            </template>

            <!-- 接入 -->
            <template v-else>
              <div class="access-head">
                <p class="desc">添加官方或自定义供应商（OpenAI 兼容）后在这里管理。会话只会用到已启用的模型。</p>
                <n-button size="small" @click="addProvider">＋ 添加模型服务</n-button>
              </div>
              <div v-for="p in providers" :key="p.id" class="pcard">
                <div class="pc-head">
                  <div class="pc-name">
                    {{ p.name }}
                    <n-tag size="small" :bordered="false">{{ p.builtin ? '内置' : '自定义' }}</n-tag>
                    <n-tag size="small" :bordered="false" :type="p.apiKey ? 'success' : 'warning'">
                      {{ p.apiKey ? '已设密钥' : '未设密钥' }}
                    </n-tag>
                  </div>
                  <div class="pc-btns">
                    <n-button size="tiny" tertiary @click="configProvider(p)">配置</n-button>
                    <n-button size="tiny" tertiary @click="refreshProvider(p)">刷新模型</n-button>
                    <n-button size="tiny" tertiary @click="removeProvider(p)">移除接入</n-button>
                  </div>
                </div>
                <div class="pc-meta">{{ p.protocol || 'openai' }} · {{ p.baseUrl }}</div>
                <div class="pc-models">
                  <span class="pc-mlabel">已启用模型</span>
                  <n-tag v-for="m in p.models" :key="m" size="small" :bordered="false">{{ m }}</n-tag>
                  <span v-if="!(p.models && p.models.length)" class="dim">未启用，点「刷新模型」选择</span>
                </div>
              </div>
            </template>
          </section>

          <!-- AI（称呼 + 自定义系统提示词） -->
          <section v-else-if="cat === 'writing'">
            <h3 class="ptitle">AI</h3>

            <div class="setting-row">
              <div class="srow-label">
                <div class="srow-name">Marble 应该如何称呼你？</div>
                <div class="srow-desc">用于对话窗口的个性化问候（留空使用通用问候）</div>
              </div>
              <n-input v-model:value="userName" placeholder="你的名字" style="width: 200px" />
            </div>

            <div class="writing-block">
              <div class="srow-name">自定义系统提示词</div>
              <div class="srow-desc" style="margin: 4px 0 12px">附加到默认系统提示词的额外指令，每次生成笔记时自动带上（统一排版、配色和语气）。</div>
              <n-input
                v-model:value="style"
                type="textarea"
                :autosize="{ minRows: 7, maxRows: 16 }"
                placeholder="例如：&#10;- 浅色护眼背景，正文最大宽度 720px 居中&#10;- 标题用衬线字体，配色低饱和、克制&#10;- 语气简洁专业，多用小标题和列表"
              />
            </div>

            <div class="html-style-block">
              <div class="srow-name">笔记默认风格</div>
              <div class="srow-desc" style="margin: 4px 0 14px">AI 生成 HTML 笔记时使用的默认视觉风格。你仍然可以在对话中临时要求不同风格。</div>
              <div class="hstyle-grid">
                <button
                  v-for="s in HTML_STYLES"
                  :key="s.key"
                  type="button"
                  class="hstyle-card"
                  :class="{ active: currentHtmlStyle === s.key }"
                  @click="onPickHtmlStyle(s.key)"
                >
                  <div class="hsc-name">{{ s.name }} <span class="dim">{{ s.cn }}</span></div>
                  <span class="hsc-tag">{{ s.tag }}</span>
                  <div class="hsc-swatches">
                    <span class="sw" :style="{ background: s.swatches[0] }"></span>
                    <span class="sw" :style="{ background: s.swatches[1] }"></span>
                    <span class="sw" :style="{ background: s.swatches[2] }"></span>
                  </div>
                  <div class="hsc-desc">{{ s.desc }}</div>
                </button>
              </div>
            </div>

            <div class="actions"><n-button type="primary" @click="onSaveWriting">保存</n-button></div>
          </section>

          <!-- 存储 -->
          <section v-else-if="cat === 'vault'">
            <h3 class="ptitle">存储</h3>
            <div class="setting-row">
              <div class="srow-label">
                <div class="srow-name">笔记库路径</div>
                <div class="srow-desc">{{ vaultPath }}</div>
              </div>
              <n-button size="small" @click="onSwitchVault">切换库</n-button>
            </div>
          </section>

          <!-- 外观 -->
          <section v-else-if="cat === 'appearance'">
            <h3 class="ptitle">外观</h3>

            <div class="appr-block">
              <div class="srow-name" style="margin-bottom: 12px;">视觉风格</div>
              <div class="style-grid">
                <button
                  v-for="s in VISUAL_STYLES"
                  :key="s.key"
                  type="button"
                  class="style-card"
                  :class="{ active: store.appearance.style === s.key }"
                  @click="onAppr('style', s.key)"
                >
                  <div class="sc-check" v-if="store.appearance.style === s.key">
                    <n-icon :size="20"><checkmark-circle /></n-icon>
                  </div>
                  <div class="sc-name">{{ s.name }} <span class="dim">{{ s.cn }}</span></div>
                  <span class="sc-tag">{{ s.tag }}</span>
                  <div class="sc-swatches">
                    <span class="sw" :style="{ background: s.swatches[0] }"></span>
                    <span class="sw" :style="{ background: s.swatches[1] }"></span>
                    <span class="sw" :style="{ background: s.swatches[2] }"></span>
                  </div>
                  <div class="sc-desc">{{ s.desc }}</div>
                </button>
              </div>
            </div>

            <!-- 明暗主题 -->
            <div class="setting-row">
              <div class="srow-label">
                <div class="srow-name">明暗主题</div>
              </div>
              <n-radio-group :value="store.appearance.theme" size="small" @update:value="(v) => onAppr('theme', v)">
                <n-radio-button value="light">浅色</n-radio-button>
                <n-radio-button value="dark">深色</n-radio-button>
                <n-radio-button value="auto">自动</n-radio-button>
              </n-radio-group>
            </div>

            <!-- 界面字号 -->
            <div class="setting-row">
              <div class="srow-label">
                <div class="srow-name">界面字号</div>
                <div class="srow-desc">整体缩放界面（与 Ctrl +/- 一致，含中间文档）</div>
              </div>
              <n-radio-group :value="store.appearance.fontSize" size="small" @update:value="(v) => onAppr('fontSize', v)">
                <n-radio-button value="sm">小</n-radio-button>
                <n-radio-button value="md">默认</n-radio-button>
                <n-radio-button value="lg">大</n-radio-button>
                <n-radio-button value="xl">特大</n-radio-button>
                <n-radio-button value="xxl">超大</n-radio-button>
              </n-radio-group>
            </div>

            <!-- 界面字体 -->
            <div class="setting-row">
              <div class="srow-label">
                <div class="srow-name">界面字体</div>
              </div>
              <n-radio-group :value="store.appearance.uiFont" size="small" @update:value="(v) => onAppr('uiFont', v)">
                <n-radio-button value="system">系统默认</n-radio-button>
                <n-radio-button value="yahei">微软雅黑</n-radio-button>
                <n-radio-button value="siyuan">思源黑体</n-radio-button>
                <n-radio-button value="custom">自定义</n-radio-button>
              </n-radio-group>
            </div>
            <div v-if="store.appearance.uiFont === 'custom'" class="custom-font">
              <n-input
                :value="store.appearance.uiFontCustom"
                size="small"
                placeholder="字体名，如 LXGW WenKai"
                @update:value="(v) => onAppr('uiFontCustom', v)"
              />
            </div>

            <!-- 等宽字体 -->
            <div class="setting-row">
              <div class="srow-label">
                <div class="srow-name">等宽字体</div>
              </div>
              <n-radio-group :value="store.appearance.monoFont" size="small" @update:value="(v) => onAppr('monoFont', v)">
                <n-radio-button value="system">系统等宽</n-radio-button>
                <n-radio-button value="cascadia">Cascadia</n-radio-button>
                <n-radio-button value="custom">自定义</n-radio-button>
              </n-radio-group>
            </div>
            <div v-if="store.appearance.monoFont === 'custom'" class="custom-font">
              <n-input
                :value="store.appearance.monoFontCustom"
                size="small"
                placeholder="等宽字体名，如 JetBrains Mono"
                @update:value="(v) => onAppr('monoFontCustom', v)"
              />
            </div>
          </section>

          <!-- 插件 -->
          <section v-else-if="cat === 'plugins'">
            <h3 class="ptitle">插件</h3>
            <p class="desc">开启或关闭功能模块，关闭后对应按钮和界面元素将隐藏。</p>

            <div class="plugin-list">
              <div
                v-for="p in PLUGIN_LIST"
                :key="p.key"
                class="plugin-item"
              >
                <div class="srow-label">
                  <div class="srow-name">{{ p.name }}</div>
                  <div class="srow-desc">{{ p.desc }}</div>
                </div>
                <n-switch
                  :value="store.plugins[p.key]"
                  size="small"
                  @update:value="(v) => savePlugin(p.key, v)"
                />
              </div>
            </div>
          </section>

          <!-- 快捷键 -->
          <section v-else-if="cat === 'shortcuts'">
            <h3 class="ptitle">快捷键</h3>
            <p class="desc">当前应用的默认快捷键（暂不可自定义）。</p>
            <div class="shortcuts-table">
              <div class="sc-row"><span class="sc-key">Ctrl + N</span><span class="sc-action">新建笔记</span></div>
              <div class="sc-row"><span class="sc-key">Ctrl + F</span><span class="sc-action">搜索笔记</span></div>
              <div class="sc-row"><span class="sc-key">Ctrl + ,</span><span class="sc-action">打开设置</span></div>
              <div class="sc-row"><span class="sc-key">Ctrl + Enter</span><span class="sc-action">AI 输入框发送</span></div>
              <div class="sc-row"><span class="sc-key">Enter</span><span class="sc-action">AI 输入框发送</span></div>
              <div class="sc-row"><span class="sc-key">Shift + Enter</span><span class="sc-action">AI 输入框换行</span></div>
            </div>
          </section>

          <!-- 关于 -->
          <section v-else-if="cat === 'about'">
            <h3 class="ptitle">关于</h3>
            <div class="about-meta">
              <div><span class="ak">版本</span><span>{{ about.version || '—' }}</span></div>
              <div><span class="ak">构建时间</span><span>{{ buildTimeText }}</span></div>
            </div>
            <h4 class="csub">更新日志</h4>
            <div class="changelog" v-html="changelog"></div>
          </section>
        </n-scrollbar>
      </div>
    </div>
  </n-modal>

  <!-- 供应商配置弹窗 -->
  <n-modal
    v-model:show="provShow"
    preset="card"
    :title="provIsNew ? '添加模型服务' : '配置 · ' + provDraft.name"
    style="width: 460px"
    :class="store.theme"
  >
    <div class="field">
      <label>名称</label>
      <n-input v-model:value="provDraft.name" :disabled="provDraft.builtin" placeholder="例如 DeepSeek 官方" />
    </div>
    <div class="field">
      <label>接口地址 (Base URL)</label>
      <n-input v-model:value="provDraft.baseUrl" placeholder="https://api.example.com/v1" />
    </div>
    <div class="field">
      <label>API Key</label>
      <n-input v-model:value="provDraft.apiKey" type="password" show-password-on="click" placeholder="sk-..." />
    </div>
    <p class="hint">OpenAI 兼容接口。保存后点该供应商的「刷新模型」拉取并启用模型。</p>
    <template #footer>
      <div class="modal-footer">
        <n-button @click="provShow = false">取消</n-button>
        <n-button type="primary" @click="saveProvider">保存</n-button>
      </div>
    </template>
  </n-modal>

  <!-- 启用模型弹窗 -->
  <n-modal
    v-model:show="modelsShow"
    preset="card"
    :title="'启用模型' + (modelsProv ? ' · ' + modelsProv.name : '')"
    style="width: 460px"
    :class="store.theme"
  >
    <n-spin :show="modelsLoading">
      <div class="models-box">
        <div v-if="modelsErr" class="warn">{{ modelsErr }}</div>
        <div v-if="modelChoices.length" class="models-grid">
          <n-checkbox
            v-for="m in modelChoices"
            :key="m"
            :checked="modelsChecked.includes(m)"
            @update:checked="(v) => toggleModel(m, v)"
          >{{ m }}</n-checkbox>
        </div>
        <div v-else-if="!modelsLoading && !modelsErr" class="dim">未返回任何模型。</div>
      </div>
    </n-spin>
    <template #footer>
      <div class="modal-footer">
        <span class="dim" style="flex: 1">已选 {{ modelsChecked.length }} 个</span>
        <n-button @click="modelsShow = false">取消</n-button>
        <n-button type="primary" :disabled="modelsLoading" @click="saveModels">保存</n-button>
      </div>
    </template>
  </n-modal>
</template>

<style scoped>
.settings-card {
  width: 940px;
  max-width: 94vw;
  height: 78vh;
  max-height: 720px;
  display: flex;
  flex-direction: row;
  border-radius: 12px;
  overflow: hidden;
  background: var(--panel);
  color: var(--text);
}

/* ── 左侧导航 ── */
.settings-nav {
  width: 216px;
  flex-shrink: 0;
  background: var(--bg);
  border-right: 1px solid var(--border);
  padding: 16px 8px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.settings-nav::-webkit-scrollbar { width: 4px; }
.settings-nav::-webkit-scrollbar-thumb { background: var(--scrollbar); border-radius: 2px; }

.nav-group { display: flex; flex-direction: column; gap: 2px; }
.nav-group-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--dim);
  text-transform: uppercase;
  letter-spacing: .4px;
  padding: 0 10px;
  margin-bottom: 4px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: none;
  background: transparent;
  color: var(--dim);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  border-radius: 6px;
  text-align: left;
  transition: background .12s, color .12s;
  position: relative;
}
.nav-item:hover { background: var(--hover); color: var(--text); }
.nav-item.active {
  background: var(--active);
  color: var(--text);
  font-weight: 500;
}
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 2px;
  background: var(--accent);
  border-radius: 1px;
}
.nav-item-ic { flex-shrink: 0; }

/* ── 右侧内容 ── */
.settings-main {
  flex: 1;
  min-width: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.settings-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  width: 28px;
  height: 28px;
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
}
.settings-close:hover { background: var(--hover); color: var(--text); }

.content { flex: 1; min-height: 0; }

.ptitle { margin: 0 0 18px; font-size: 18px; }
.desc { color: var(--dim); font-size: 13px; line-height: 1.6; margin: -6px 0 14px; }
.field { margin-bottom: 14px; }
.field label { display: block; font-size: 12px; color: var(--dim); margin-bottom: 6px; }
.actions { margin-top: 8px; }
.hint { font-size: 12px; color: var(--dim); line-height: 1.6; margin-top: 14px; }
.hint code { background: var(--bg); padding: 1px 5px; border-radius: 4px; }
.dim { color: var(--dim); font-size: 12px; }
.warn { color: #d6953f; font-size: 13px; line-height: 1.6; margin-bottom: 10px; }
.setting-row { display: flex; align-items: center; gap: 16px; padding: 14px 0; border-bottom: 1px solid var(--border); }
.srow-label { flex: 1; min-width: 0; }
.srow-name { font-size: 14px; margin-bottom: 4px; }
.srow-desc { font-size: 12px; color: var(--dim); line-height: 1.5; word-break: break-all; }

/* 外观 · 视觉风格卡片 */
.appr-block { padding: 16px 0; border-bottom: 1px solid var(--border); }
.style-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.style-card { position: relative; text-align: left; background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 14px; cursor: pointer; font-family: inherit; color: var(--text); transition: border-color .15s, box-shadow .15s; }
.style-card:hover { border-color: var(--dim); }
.style-card.active { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
.sc-check { position: absolute; top: 12px; right: 12px; color: var(--accent); font-size: 20px; }
.sc-name { font-size: 14px; margin-bottom: 8px; padding-right: 22px; }
.sc-name .dim { font-weight: 400; }
.sc-tag { display: inline-block; font-size: 11px; color: var(--dim); border: 1px solid var(--border); border-radius: 20px; padding: 1px 9px; margin-bottom: 11px; }
.sc-swatches { display: flex; gap: 6px; margin-bottom: 10px; }
.sc-swatches .sw { flex: 1; height: 30px; border-radius: 7px; border: 1px solid var(--border); }
.sc-swatches .sw:last-child { flex: 1.5; }
.sc-desc { font-size: 12px; color: var(--dim); line-height: 1.6; }
.writing-block { padding-top: 16px; }
.html-style-block { padding: 20px 0; border-top: 1px solid var(--border); margin-top: 16px; }
.hstyle-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.hstyle-card { position: relative; text-align: left; background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 14px; cursor: pointer; font-family: inherit; color: var(--text); transition: border-color .15s, box-shadow .15s; }
.hstyle-card:hover { border-color: var(--dim); }
.hstyle-card.active { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
.hsc-name { font-size: 14px; margin-bottom: 6px; }
.hsc-name .dim { font-weight: 400; }
.hsc-tag { display: inline-block; font-size: 11px; color: var(--dim); border: 1px solid var(--border); border-radius: 20px; padding: 1px 9px; margin-bottom: 10px; }
.hsc-swatches { display: flex; gap: 6px; margin-bottom: 10px; }
.hsc-swatches .sw { flex: 1; height: 30px; border-radius: 7px; border: 1px solid var(--border); }
.hsc-swatches .sw:last-child { flex: 1.5; }
.hsc-desc { font-size: 12px; color: var(--dim); line-height: 1.6; }
.custom-font { display: flex; justify-content: flex-end; padding: 12px 0 2px; }
.custom-font :deep(.n-input) { width: 320px; }

/* 模型 · 子标签 */
.subtabs { display: flex; gap: 2px; margin: 0 0 18px; border-bottom: 1px solid var(--border); }
.subtab { background: transparent; border: none; color: var(--dim); padding: 8px 14px; font-size: 14px; cursor: pointer; font-family: inherit; border-bottom: 2px solid transparent; margin-bottom: -1px; }
.subtab:hover { color: var(--text); }
.subtab.active { color: var(--text); border-bottom-color: var(--accent); }

/* 模型 · 接入 */
.access-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
.access-head .desc { margin: 0; flex: 1; }
.pcard { border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; background: var(--bg); }
.pc-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 9px; }
.pc-name { display: flex; align-items: center; gap: 8px; font-weight: 600; min-width: 0; }
.pc-btns { display: flex; gap: 6px; flex: none; }
.pc-meta { font-size: 12px; color: var(--dim); font-family: var(--mono-font); word-break: break-all; margin-bottom: 10px; }
.pc-models { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
.pc-mlabel { font-size: 12px; color: var(--dim); margin-right: 4px; }

/* 弹窗 */
.modal-footer { display: flex; align-items: center; gap: 8px; justify-content: flex-end; }
.models-box { min-height: 60px; }
.models-grid { display: flex; flex-direction: column; gap: 12px; max-height: 340px; overflow: auto; padding: 2px; }

/* 关于 */
.about-meta { display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px; }
.about-meta > div { display: flex; gap: 12px; }
.ak { width: 80px; color: var(--dim); font-size: 13px; }

/* 插件 */
.plugin-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); }

/* 快捷键 */
.shortcuts-table { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.sc-row { display: flex; align-items: center; padding: 10px 14px; border-bottom: 1px solid var(--border); gap: 16px; }
.sc-row:last-child { border-bottom: none; }
.sc-key { font-family: var(--mono-font); font-size: 13px; background: var(--bg); padding: 2px 8px; border-radius: 4px; min-width: 120px; }
.sc-action { font-size: 13px; color: var(--dim); }
.csub { margin: 0 0 8px; font-size: 13px; color: var(--dim); }
.changelog { font-size: 13px; line-height: 1.7; }
.changelog :deep(h2) { font-size: 15px; margin: 14px 0 6px; }
.changelog :deep(h3) { font-size: 14px; margin: 12px 0 6px; }
.changelog :deep(ul) { padding-left: 20px; }
</style>
