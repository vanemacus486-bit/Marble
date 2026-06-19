// 视觉风格预设：每个风格给出 light / dark 两套 CSS 变量（应用外壳的配色），
// 外加卡片展示用的元信息（名称、标签、色板、描述）。
// 明暗由「主题」(auto/light/dark) 决定，配色族由「视觉风格」决定，二者正交组合。

export const VISUAL_STYLES = [
  {
    key: 'graphite', name: 'Graphite', cn: '石墨', tag: '利落',
    desc: '纸面白配石墨文字与橙色强调，利落、克制，贴近编辑器工作台。',
    swatches: ['#f3f1ec', '#ffffff', '#d2693f'],
    light: { '--bg': '#ffffff', '--panel': '#f6f5f2', '--elev': '#eceae5', '--border': '#e4e2dc', '--text': '#2b2a27', '--dim': '#6f6d66', '--hover': '#f0eee9', '--active': '#e7e4dd', '--accent': '#d2693f', '--scrollbar': 'rgba(0,0,0,.18)', '--scrollbar-hover': 'rgba(0,0,0,.32)' },
    dark: { '--bg': '#1e1e1e', '--panel': '#252526', '--elev': '#2d2d30', '--border': '#333333', '--text': '#d4d4d4', '--dim': '#8a8a8a', '--hover': '#2a2a2b', '--active': '#37373d', '--accent': '#c8704f', '--scrollbar': 'rgba(255,255,255,.16)', '--scrollbar-hover': 'rgba(255,255,255,.3)' },
  },
  {
    key: 'aurora', name: 'Aurora', cn: '柔雾极光', tag: '温润',
    desc: '柔紫底色融合极光蓝绿，半透明面板与弹性圆角，更轻盈、有呼吸感。',
    swatches: ['#ece8fb', '#ffffff', 'linear-gradient(135deg,#7c6cf0,#46c4c0)'],
    light: { '--bg': '#faf9ff', '--panel': '#f3f1fb', '--elev': '#eae7f5', '--border': '#e6e2f2', '--text': '#2a2740', '--dim': '#6d6a85', '--hover': '#efecf9', '--active': '#e6e1f4', '--accent': '#7c6cf0', '--scrollbar': 'rgba(70,50,130,.18)', '--scrollbar-hover': 'rgba(70,50,130,.32)' },
    dark: { '--bg': '#1b1a24', '--panel': '#232231', '--elev': '#2c2a3d', '--border': '#383650', '--text': '#d8d6e6', '--dim': '#8d8aa3', '--hover': '#28263a', '--active': '#353350', '--accent': '#8b7cf2', '--scrollbar': 'rgba(200,190,255,.16)', '--scrollbar-hover': 'rgba(200,190,255,.3)' },
  },
  {
    key: 'slate', name: 'Slate', cn: '精炼', tag: '原生',
    desc: '冷灰工作台配品牌蓝，发丝边框清晰，适合高密度扫描与专业操作。',
    swatches: ['#eef0f4', '#ffffff', '#3b6fd4'],
    light: { '--bg': '#ffffff', '--panel': '#f5f6f8', '--elev': '#eceef2', '--border': '#e1e4ea', '--text': '#1f2430', '--dim': '#687085', '--hover': '#eef0f4', '--active': '#e4e7ee', '--accent': '#3b6fd4', '--scrollbar': 'rgba(20,30,60,.18)', '--scrollbar-hover': 'rgba(20,30,60,.32)' },
    dark: { '--bg': '#1a1c20', '--panel': '#21242b', '--elev': '#2a2e37', '--border': '#343943', '--text': '#d3d7df', '--dim': '#868c99', '--hover': '#262a32', '--active': '#333845', '--accent': '#4a82e6', '--scrollbar': 'rgba(180,200,230,.16)', '--scrollbar-hover': 'rgba(180,200,230,.3)' },
  },
  {
    key: 'carbon', name: 'Carbon', cn: '深邃', tag: '高级',
    desc: '暖炭黑与米灰表面配青绿强调，质感厚、对比更足，适合长时间专注。',
    swatches: ['#f0efe9', '#ffffff', '#1f9d8f'],
    light: { '--bg': '#faf9f6', '--panel': '#f2f1ec', '--elev': '#e9e7e0', '--border': '#e2e0d8', '--text': '#26272a', '--dim': '#6c6d70', '--hover': '#efedea', '--active': '#e6e3da', '--accent': '#1f9d8f', '--scrollbar': 'rgba(0,0,0,.16)', '--scrollbar-hover': 'rgba(0,0,0,.3)' },
    dark: { '--bg': '#1a1b1a', '--panel': '#222321', '--elev': '#2a2c29', '--border': '#353633', '--text': '#d2d3cf', '--dim': '#888a85', '--hover': '#272826', '--active': '#343532', '--accent': '#2bab9a', '--scrollbar': 'rgba(220,225,215,.15)', '--scrollbar-hover': 'rgba(220,225,215,.3)' },
  },
  {
    key: 'nocturne', name: 'Nocturne', cn: '柔和', tag: '呼吸',
    desc: '柔紫夜色和云白表面配大圆角留白，阅读更安静，节奏更舒缓。',
    swatches: ['#ebe8fb', '#ffffff', 'linear-gradient(135deg,#7b68ee,#a78bfa)'],
    light: { '--bg': '#fbfaff', '--panel': '#f4f2fb', '--elev': '#ece9f6', '--border': '#e7e3f3', '--text': '#2b2840', '--dim': '#6f6c88', '--hover': '#f0edf9', '--active': '#e7e2f4', '--accent': '#7b68ee', '--scrollbar': 'rgba(70,50,130,.16)', '--scrollbar-hover': 'rgba(70,50,130,.3)' },
    dark: { '--bg': '#191824', '--panel': '#211f30', '--elev': '#29273b', '--border': '#36334e', '--text': '#d7d4e6', '--dim': '#8b88a2', '--hover': '#262338', '--active': '#34304c', '--accent': '#9b8bf2', '--scrollbar': 'rgba(200,190,255,.15)', '--scrollbar-hover': 'rgba(200,190,255,.3)' },
  },
  {
    key: 'amber', name: 'Amber', cn: '琥珀', tag: '暖阳',
    desc: '暖橙强调色，明亮亲和（含深色变体）。',
    swatches: ['#f2ede4', '#ffffff', '#e0792e'],
    light: { '--bg': '#fffdf9', '--panel': '#f8f4ec', '--elev': '#f0ebe0', '--border': '#ece5d7', '--text': '#2c2823', '--dim': '#726b60', '--hover': '#f4efe6', '--active': '#ebe4d6', '--accent': '#e0792e', '--scrollbar': 'rgba(70,45,0,.16)', '--scrollbar-hover': 'rgba(70,45,0,.3)' },
    dark: { '--bg': '#201d18', '--panel': '#292520', '--elev': '#322d26', '--border': '#3d372e', '--text': '#e0dad0', '--dim': '#948c7e', '--hover': '#2d2922', '--active': '#393227', '--accent': '#e8842f', '--scrollbar': 'rgba(255,235,210,.15)', '--scrollbar-hover': 'rgba(255,235,210,.3)' },
  },
  {
    key: 'obsidian', name: 'Obsidian', cn: '黑曜', tag: '专注',
    desc: '仿 Obsidian 默认暗色质感，紫罗兰强调色，沉浸式写作外壳。',
    swatches: ['#1e1e1e', '#171717', '#7c6cf0'],
    light: { '--bg': '#fcfcfc', '--panel': '#f0f0f0', '--elev': '#e6e6e6', '--border': '#dddddd', '--text': '#2c2c2c', '--dim': '#7a7a7a', '--hover': '#eaeaea', '--active': '#dedede', '--accent': '#7c6cf0', '--scrollbar': 'rgba(0,0,0,.16)', '--scrollbar-hover': 'rgba(0,0,0,.3)' },
    dark: { '--bg': '#1e1e1e', '--panel': '#171717', '--elev': '#262626', '--border': '#2a2a2a', '--text': '#dadada', '--dim': '#8a8a8a', '--hover': '#2a2a2a', '--active': '#363636', '--accent': '#7c6cf0', '--scrollbar': 'rgba(255,255,255,.14)', '--scrollbar-hover': 'rgba(255,255,255,.28)' },
  },
];

export const STYLE_MAP = Object.fromEntries(VISUAL_STYLES.map((s) => [s.key, s]));

// 界面字号 → webFrame 缩放系数（整体缩放，最稳，不破坏布局）
export const FONT_SIZE_ZOOM = { sm: 0.9, md: 1, lg: 1.1, xl: 1.25, xxl: 1.4 };

export const UI_FONTS = {
  system: '"Segoe UI", "Microsoft YaHei", system-ui, sans-serif',
  yahei: '"Microsoft YaHei", "微软雅黑", sans-serif',
  siyuan: '"Source Han Sans SC", "Noto Sans CJK SC", "思源黑体", sans-serif',
};
export const MONO_FONTS = {
  system: 'ui-monospace, Consolas, "Courier New", monospace',
  cascadia: '"Cascadia Code", "Cascadia Mono", Consolas, monospace',
};

export function resolveUiFont(a) {
  if (a.uiFont === 'custom') return (a.uiFontCustom && a.uiFontCustom.trim()) || UI_FONTS.system;
  return UI_FONTS[a.uiFont] || UI_FONTS.system;
}
export function resolveMonoFont(a) {
  if (a.monoFont === 'custom') return (a.monoFontCustom && a.monoFontCustom.trim()) || MONO_FONTS.system;
  return MONO_FONTS[a.monoFont] || MONO_FONTS.system;
}

// 颜色混合：把 Naive 组件的主色也设成当前风格的强调色（含 hover/pressed 派生）。
function mix(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const r = pa.map((x, i) => Math.round(x + (pb[i] - x) * t));
  return '#' + r.map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('');
}
export function accentOverrides(accent) {
  return {
    common: {
      primaryColor: accent,
      primaryColorHover: mix(accent, '#ffffff', 0.14),
      primaryColorPressed: mix(accent, '#000000', 0.16),
      primaryColorSuppl: mix(accent, '#ffffff', 0.1),
    },
  };
}
