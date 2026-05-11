<p align="center">
  <img src="noteforge/resources/icon.png" alt="Marble" width="128" height="128" onerror="this.style.display='none'">
</p>

<h1 align="center">Marble</h1>

<p align="center">
  <strong>HTML 原生的本地知识管理工具</strong>
</p>

<p align="center">
  <a href="README.en.md">📖 English</a>
  &nbsp;·&nbsp;
  <a href="#-概述">概述</a>
  &nbsp;·&nbsp;
  <a href="#-特性">特性</a>
  &nbsp;·&nbsp;
  <a href="#-快速开始">快速开始</a>
  &nbsp;·&nbsp;
  <a href="#-技术栈">技术栈</a>
  &nbsp;·&nbsp;
  <a href="#-项目结构">项目结构</a>
</p>

---

## 📖 概述

**Marble** 是一款**纯本地、HTML 原生**的桌面知识管理应用。你的笔记就是标准 `.html` 文件，直接存放在你电脑的文件夹中。无需导入，无需迁移，没有私有格式锁定。

> **没有云。没有锁定。你的数据，你的文件。**

### 为什么选择 HTML 而非 Markdown？

Markdown 表达能力有限——表格、嵌套任务列表、色彩标注、上下标等都需要 dialects 支持，跨工具兼容性差。HTML 是 web 的原生语言，天然支持富文本的全部表达能力，且任何浏览器都能直接打开。Marble 将 WYSIWYG 编辑的便利性与纯 HTML 文件的可移植性结合在一起。

### 核心理念

- **本地优先** —— 所有数据存储在本地文件夹（Vault），不上传任何服务器
- **HTML 原生** —— 笔记即 `.html` 文件，元数据以 `<meta>` 标签嵌入 `<head>`，标准且可移植
- **不锁定数据** —— 随时用浏览器或其他编辑器打开你的 HTML 文件
- **隐私至上** —— 完全离线，无账号系统，无遥测

---

## ✨ 特性

### 🖊️ 富文本编辑
基于 **TipTap**（ProseMirror）的强大编辑器，支持：

- 所见即所得（WYSIWYG）、源码、预览三种编辑模式
- 表格（可调整列宽）、嵌套任务列表、代码块（语法高亮）
- 文字颜色、字体、高亮、下划线、上下标、对齐
- 链接、图片、文本样式
- 多标签页编辑，支持标签拖拽排序
- 分屏编辑（左右 / 上下）

### 📂 文件管理
- 树形目录浏览，支持文件夹内联创建
- 右键上下文菜单：新建笔记/文件夹、重命名、删除、复制路径
- 行内重命名（Enter 确认，Escape 取消）
- 笔记创建、重命名、删除
- 文件变动自动监听（Chokidar），实时更新索引

### 🔍 全文搜索
基于 **FlexSearch** 的高性能搜索引擎：

- 字段级索引（标题、标签、正文、路径）
- 搜索运算符：`tag:设计` `folder:notes/` `title:README` `file:index`
- 防抖搜索（300ms），最近搜索记录

### 🕸️ 知识图谱
基于 **D3-force** 的力导向图可视化：

- 笔记为节点（大小反映被引用数，颜色反映文件夹）
- 链接为有向边
- 节点拖拽、缩放平移、节点固定、全局/局部模式
- 文件夹/标签过滤、全屏模式
- 点击节点直达笔记

### 🔗 双向链接
- 自动解析笔记间的 `[[wikilink]]` 风格链接
- 显示反向链接面板（谁链接了我）
- 支持链接导航历史（前进 / 后退）

### 📤 导出
- **纯文本**：剥离 HTML 标签
- **Markdown**：通过 Turndown 转换，方便迁移到其他平台
- HTML 本身就是原生格式，无需导出即可在任何浏览器查看

### 🎨 主题系统
- 亮色 / 暗色 / 跟随系统三种模式
- CSS 自定义属性驱动，易于扩展

### 🌐 多语言
- 支持中文（zh-CN）和英语（en-US）界面切换
- 基于 i18next 的完整国际化方案
- 语言设置持久化保存

### ⚙️ 增强设置
- 侧栏导航的五页签设置面板：关于、编辑器、文件与链接、外观、快捷键
- 编辑器：字体、字号、行高、Tab 大小、拼写检查、默认编辑模式
- 文件与链接：自动保存间隔、日记文件夹、文件监听、排除目录
- 外观：主题模式、语言切换、UI 字号、自定义 CSS
- 快捷键：可搜索筛选、录制模式重新绑定、冲突检测、重置默认

### ⌨️ 快捷键
| 快捷键 | 功能 |
|---|---|
| `Ctrl+P` | 快速切换笔记 |
| `Ctrl+Shift+P` | 命令面板 |
| `Ctrl+N` | 新建笔记 |
| `Ctrl+Shift+N` | 新建文件夹 |
| `Ctrl+\` | 侧栏切换 |
| `Ctrl+Shift+\` | 右侧面板切换 |
| `Ctrl+W` | 关闭当前标签 |
| `Ctrl+S` | 保存 |
| `Ctrl+E` | 循环编辑模式 |
| `Ctrl+F` | 查找替换 |
| `Ctrl+Shift+F` | 全文搜索 |
| `Ctrl+,` | 设置 |
| `Ctrl+Tab` / `Shift+Ctrl+Tab` | 切换标签页 |
| `F2` | 重命名 |
| `Delete` | 删除 |
| `Ctrl+Shift+G` | 知识图谱 |

---

## 🚀 快速开始

### 前提条件
- [Node.js](https://nodejs.org/) >= 18
- npm >= 9

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/vanemacus486-bit/marble.git
cd marble

# 安装依赖（自动安装 noteforge 子目录的依赖）
npm install

# 开发模式运行
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### 开发命令

```bash
npm run dev          # 启动 Electron 开发环境（热重载）
npm run build        # 构建生产版本
npm run preview      # 预览构建产物
npm run typecheck    # TypeScript 类型检查
npm test             # 运行单元测试
npm run test:watch   # 监听模式测试
npm run test:e2e     # 运行 E2E 测试
npm run lint         # 代码检查
```

---

## 🏗️ 技术栈

| 层 | 技术 |
|---|---|
| **桌面框架** | Electron 32 |
| **构建工具** | electron-vite 2.3 + Vite 5 |
| **渲染框架** | React 18 + TypeScript 5.5 |
| **状态管理** | Zustand 5 |
| **富文本编辑器** | TipTap 2.11（ProseMirror），30+ 扩展 |
| **国际化** | i18next + react-i18next |
| **样式** | Tailwind CSS v4（Vite 插件） |
| **HTML 解析** | htmlparser2 + domutils |
| **全文搜索** | FlexSearch 0.7 |
| **图谱可视化** | D3（d3-force, d3-selection, d3-zoom） |
| **文件监听** | Chokidar 4 |
| **数据校验** | Zod 3 |
| **HTML→Markdown** | Turndown 7 |
| **测试** | Vitest + Playwright + Testing Library |
| **打包** | electron-builder（Windows NSIS / macOS DMG / Linux AppImage） |
| **代码质量** | ESLint + Prettier + prettier-plugin-tailwindcss |

---

## 📁 项目结构

```
marble/
├── noteforge/
│   ├── src/
│   │   ├── main/              # Electron 主进程
│   │   │   ├── index.ts       # 入口：窗口创建、IPC 注册
│   │   │   └── services/      # 核心服务
│   │   │       ├── vault-service.ts      # Vault 文件管理
│   │   │       ├── index-builder.ts      # FlexSearch 索引构建
│   │   │       ├── note-parser.ts        # HTML 笔记解析
│   │   │       ├── search-engine.ts      # 搜索引擎
│   │   │       └── file-watcher.ts       # 文件变动监听
│   │   ├── preload/           # Electron 预加载脚本
│   │   │   └── index.ts       # contextBridge API 暴露
│   │   └── renderer/          # React 渲染进程
│   │       ├── index.html     # HTML 入口
│   │       ├── main.tsx       # React 入口
│   │       ├── App.tsx        # 根组件
│   │       ├── AppShell.tsx   # 主布局
│   │       ├── components/    # UI 组件
│   │       │   ├── editor/    # TipTap 编辑器、源码模式、预览
│   │       │   ├── sidebar/   # 文件浏览器、搜索面板
│   │       │   ├── graph/     # 知识图谱（D3 力导向图）
│   │       │   ├── navigation/ # 标签栏、面包屑、面板
│   │       │   └── ui/        # 通用 UI（对话框、Toast 等）
│   │       ├── stores/        # Zustand 状态管理
│   │       ├── hooks/         # React Hooks
│   │       ├── styles/        # 全局样式与主题
│   │       ├── types/         # TypeScript 类型定义
│   │       └── utils/         # 工具函数
│   ├── tests/                 # 测试
│   ├── resources/             # 应用图标等资源
│   ├── electron.vite.config.ts # electron-vite 构建配置
│   ├── electron-builder.yml   # electron-builder 打包配置
│   ├── tsconfig.json          # TypeScript 配置
│   └── vitest.config.ts       # 测试配置
├── package.json               # 工作区根配置
└── README.md                  # 你正在读这个文件
```

---

## 🤝 贡献

欢迎贡献！目前项目处于早期开发阶段（v0.1.0）。如果你有兴趣参与，请：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 开发环境

推荐使用 VS Code，配合以下扩展：
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript

代码风格由 ESLint + Prettier + prettier-plugin-tailwindcss 自动管理。提交前请运行 `npm run typecheck` 确保类型正确。

---

## 📄 许可证

MIT License

---

<p align="center">
  <sub>用 ❤️ 构建。你的数据，永远属于你。</sub>
</p>
