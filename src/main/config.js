// 配置读写：保存在 Electron 用户数据目录下的 config.json
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

function configPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

const AGNES_ID = 'agnes-official';

// 模型接入采用「供应商列表 + 默认模型指针」的结构：
//   providers: [{ id, name, builtin, protocol, baseUrl, apiKey, models[] }]
//   defaultModel: { providerId, model }  —— 生成笔记时实际使用的模型
const DEFAULTS = {
  vaultPath: null,
  vaults: [],
  providers: [
    {
      id: AGNES_ID,
      name: 'Agnes 官方',
      builtin: true,
      protocol: 'openai',
      baseUrl: 'https://apihub.agnes-ai.com/v1',
      apiKey: '',
      models: ['agnes-2.0-flash'],
    },
  ],
  defaultModel: { providerId: AGNES_ID, model: 'agnes-2.0-flash' },
  writing: {
    userName: '', // 称呼：对话窗口个性化问候用（留空用通用问候）
    stylePrompt: '', // 默认文档要求，每次生成都附加给 AI
  },
  appearance: {
    theme: 'dark', // 'auto' | 'light' | 'dark'（明暗）
    style: 'graphite', // 视觉风格 key（见 renderer/themes.js）
    fontSize: 'md', // 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
    uiFont: 'system', // 'system' | 'yahei' | 'siyuan' | 'custom'
    uiFontCustom: '',
    monoFont: 'system', // 'system' | 'cascadia' | 'custom'
    monoFontCustom: '',
  },
};

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// 旧版只有单一 config.ai = {apiKey, baseUrl, model}，迁移成 providers/defaultModel。
function migrate(parsed) {
  if (Array.isArray(parsed.providers)) return parsed;
  const ai = parsed.ai || {};
  let model = ai.model || 'agnes-2.0-flash';
  if (model === 'Agnes-2.0-Flash') model = 'agnes-2.0-flash'; // 兼容旧版误填的大小写
  parsed.providers = [
    {
      id: AGNES_ID,
      name: 'Agnes 官方',
      builtin: true,
      protocol: 'openai',
      baseUrl: ai.baseUrl || DEFAULTS.providers[0].baseUrl,
      apiKey: ai.apiKey || '',
      models: model ? [model] : [],
    },
  ];
  parsed.defaultModel = { providerId: AGNES_ID, model };
  return parsed;
}

function read() {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(configPath(), 'utf8'));
  } catch {
    return clone(DEFAULTS);
  }
  parsed = migrate(parsed);
  const merged = {
    ...DEFAULTS,
    ...parsed,
    vaults: Array.isArray(parsed.vaults) ? parsed.vaults : [],
    providers: Array.isArray(parsed.providers) ? parsed.providers : DEFAULTS.providers,
    defaultModel: { ...DEFAULTS.defaultModel, ...(parsed.defaultModel || {}) },
    writing: { ...DEFAULTS.writing, ...(parsed.writing || {}) },
    appearance: { ...DEFAULTS.appearance, ...(parsed.appearance || {}) },
  };
  // 确保当前库在 vaults 列表中
  if (merged.vaultPath && !merged.vaults.includes(merged.vaultPath)) {
    merged.vaults.unshift(merged.vaultPath);
  }
  delete merged.ai; // 旧字段不再使用
  return merged;
}

function write(partial) {
  const current = read();
  const p = partial || {};
  const next = {
    ...current,
    ...p,
    providers: p.providers !== undefined ? p.providers : current.providers,
    defaultModel: p.defaultModel ? { ...current.defaultModel, ...p.defaultModel } : current.defaultModel,
    writing: { ...current.writing, ...(p.writing || {}) },
    appearance: { ...current.appearance, ...(p.appearance || {}) },
  };
  delete next.ai;
  fs.writeFileSync(configPath(), JSON.stringify(next, null, 2), 'utf8');
  return next;
}

module.exports = { read, write, configPath };
