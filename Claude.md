# Marble

「AI 写、你看」桌面笔记应用 — Electron + Vue 3 + Naive UI，AI 生成完整 HTML 笔记并落盘为真实 `.html` 文件。

## Project

- **Stack**: Electron 31 (主进程) + Vue 3.5 (渲染进程, Vite 5 打包) + Naive UI
- **Entry points**: `src/main/main.js` (Electron), `src/renderer/main.js` (Vue)
- **Build output**: `out/renderer/` (Vite 产物), `dist/` (electron-builder NSIS 安装包)
- **Config storage**: `%APPDATA%/Marble/config.json` (Electron userData)
- **AI provider**: OpenAI Chat Completions 兼容网关，默认 Agnes (`apihub.agnes-ai.com/v1`)

## Commands

```bash
npm install              # 安装依赖
npm start                # 开发模式启动 Electron
npm run dev:renderer     # 仅启动 Vite 热更新（调试渲染层）
npm run build:renderer   # 仅构建 Vue 渲染层到 out/renderer/
npm run gen:buildinfo    # 生成 build-info.json（版本号 + 构建时间）
npm run dist             # 打包 Windows NSIS 安装包 → dist/
```

## Architecture

### Electron 主进程 (`src/main/`)

| File | Role |
|------|------|
| `main.js` | App lifecycle + IPC handler registration (config/vault/ai/app) |
| `preload.js` | Context bridge — exposes `window.api` (config, vault, app, ai) |
| `config.js` | JSON 配置文件读写，含旧版 `ai` → `providers/defaultModel` 迁移 |
| `vault.js` | 文件系统操作：目录树构建、笔记 CRUD，含 `ensureInside` 路径越界防护 |
| `ai.js` | 流式 OpenAI 兼容请求 (SSE)，SYSTEM_PROMPT 约束纯 HTML 输出，`listModels` |

### Vue 渲染层 (`src/renderer/`)

| File/Dir | Role |
|----------|------|
| `App.vue` | 根组件 — `n-config-provider` (Naive UI) + 三栏 grid 布局 (248px / 1fr / 372px) |
| `store.js` | 全局 `reactive` 状态 — 配置、目录树、当前文档、AI 对话历史、`sendAi()` 核心流程 |
| `themes.js` | 6 套视觉风格 (CSS 变量色板) + 字号缩放映射 + 字体解析 |
| `components/SideBar.vue` | 左侧文件树（文件夹/`.html` 笔记，支持创建/重命名/删除） |
| `components/DocViewer.vue` | 中间只读文档渲染（sandbox iframe） |
| `components/AiPanel.vue` | 右侧 AI 对话面板（指令 → 流式 HTML → 渲染 → 落盘） |
| `components/SettingsModal.vue` | 设置弹窗（模型/供应商、写作偏好、外观主题） |
| `components/WelcomeScreen.vue` | 初始欢迎页（选择 vault） |

### 关键流程

1. **AI 写作**: `store.sendAi()` → `api.ai.chat()` (主进程 SSE) → 节流更新 `store.docHtml` → `stripFences` → `api.vault.write()` 落盘
2. **配置**: 旧版 `config.ai` 自动迁移到 `config.providers[]` + `config.defaultModel`
3. **安全**: 主进程 `ensureInside()` 校验所有 vault 路径不越界；渲染层 iframe sandbox 隔离 AI 产出的 HTML

## Conventions

- **IPC 命名**: `namespace:action` 格式（如 `vault:tree`, `ai:chat`）
- **路径安全**: 所有 vault 文件操作必须先过 `ensureInside(root, target)`
- **SSE 流式**: 渲染层通过 `requestId` 匹配 chunk 回调，`finally` 清理 listener
- **HTML 输出**: AI 必须输出完整自包含 HTML（含 `<style>` 内联），不输出 Markdown fence
- **视觉风格**: 主题（明暗）与风格（色板）正交；`appearance.theme` → `resolveMode()` → `store.theme`
- **Naive UI**: 中文 locale (`zhCN`/`dateZhCN`)，主题色跟随当前风格 `--accent`
- **文件命名**: 笔记以 `.html` 结尾；目录树显示时去掉扩展名

## Notes

