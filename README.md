# Marble

「AI 写、你看」的桌面笔记应用。你只在右侧对 AI 说话，AI 写出**完整 HTML 网页**直接渲染在中间只读展示区；左侧是 AI 文档的文件树。外观仿 Obsidian 桌面风格。

基于 Electron + Vue 3.5 + Naive UI，AI 接入 OpenAI Chat Completions 兼容网关（默认 [Agnes](https://agnes-ai.com/) 免费 API）。

## 截图

![Marble 截图](docs/screenshot.png)

## 运行（开发）

```bash
npm install      # 安装依赖
npm start        # 启动应用（自动构建渲染层 + 启动 Electron）
```

首次启动会让你选择一个文件夹作为「笔记库（vault）」，之后每篇笔记都是该文件夹里的真实 `.html` 文件。

## 用法

1. 点击左侧「＋」新建笔记（或直接对 AI 说话，会自动新建）
2. 右侧对 AI 说「写一篇关于 X 的笔记」「再短一点」「加一节定价」……
3. AI 生成的 HTML 实时渲染在中间，并写盘为当前 `.html` 文件
4. 「设置 → 模型」填入 API Key（Agnes 接口地址 `https://apihub.agnes-ai.com/v1`、模型 `agnes-2.0-flash` 已预填）

## 快捷键

| 快捷键 | 作用 |
|--------|------|
| `Ctrl + N` | 新建笔记 |
| `Ctrl + F` | 聚焦搜索框 |
| `Ctrl + ,` | 打开设置 |
| `Ctrl + Enter` / `Enter` | AI 输入框发送 |
| `Shift + Enter` | AI 输入框换行 |

## 功能

- **AI 写作** — 对话式指令 → 流式 HTML 生成 → 实时预览 → 落盘为 `.html` 文件
- **翻页系统** — AI 产出多页笔记时，中间栏底部显示页码导航
- **关系图谱** — 笔记间 `[[链接]]` 的图谱可视化（基于 vis-network）
- **多标签页** — 同时打开多篇笔记，标签条管理
- **多库切换** — 记忆已打开的笔记库列表，点底部库名弹出下拉切换
- **快捷键** — 全局 Ctrl+N/F/, 等快捷操作
- **视觉主题** — 6 套配色方案（石墨/柔雾极光/精炼/深邃/柔和/琥珀 + Obsidian），明暗主题随系统
- **视觉风格** — 界面字号/字体自定义

## 打包成 Windows 安装包

```bash
npm run dist     # 产物在 dist/
```

## 目录结构

```
src/
  main/                    Electron 主进程
    main.js                App 生命周期 + IPC 注册
    preload.js             contextBridge → window.api
    config.js              配置读写 (config.json)
    vault.js               文件系统操作（树/CRUD/路径安全）
    ai.js                  OpenAI 兼容流式请求 (SSE)
  renderer/                Vue 渲染层（Vite 打包）
    App.vue                根组件 — Obsidian 骨架栅格布局
    store.js               全局 reactive 状态 + 业务函数
    themes.js              6+1 套视觉风格色板 + 字体解析
    shortcuts.js           全局键盘快捷键注册
    components/
      TitleTabBar.vue      顶部通栏（标签 + 窗口控制三键）
      RibbonBar.vue        左侧 44px 活动栏图标列
      SideBar.vue          文件树 + 搜索
      TreeNode.vue         树节点（折叠三角 + 缩进引导线）
      VaultSwitcher.vue    底部库切换器（下拉弹出历史库列表）
      DocViewer.vue        中间只读文档渲染（沙箱 iframe）
      GraphView.vue        关系图谱（vis-network）
      AiPanel.vue          右侧 AI 对话面板（Claudian 风格输入卡片）
      StatusBar.vue        底部通栏状态栏
      SettingsModal.vue    设置弹窗（左右双栏导航）
      WelcomeScreen.vue    首次启动欢迎页（选择 vault）
scripts/                   gen-build-info.js（生成构建时间）
```

## 技术栈

| 层 | 技术 |
|----|------|
| 窗口 | Electron 31 (main process) |
| UI 框架 | Vue 3.5 (Composition API + `<script setup>`) |
| 构建 | Vite 5 |
| 组件库 | Naive UI (n-config-provider / n-scrollbar / n-modal / n-switch …) |
| 图标 | @vicons/ionicons5 |
| 图谱 | vis-network + vis-data |
| 打包 | electron-builder (NSIS) |
| AI 协议 | OpenAI Chat Completions 兼容 (SSE 流式) |
