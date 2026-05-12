<p align="center">
  <h1 align="center">◆ Marble</h1>
</p>

<p align="center">
  <strong>HTML 原生的本地知识管理工具 · 暗色大理石主题</strong>
</p>

<p align="center">
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

## 概述

**Marble** 是一款**纯本地、HTML 原生**的桌面知识管理应用。你的笔记就是标准 `.html` 文件，直接存放在你电脑的文件夹中。无需导入，无需迁移，没有私有格式锁定。

> **没有云。没有锁定。你的数据，你的文件。**

### 核心理念

- **本地优先** -- 所有数据存储在本地文件夹（Vault），不上传任何服务器
- **HTML 原生** -- 笔记即 `.html` 文件，元数据以 `<meta>` 标签嵌入 `<head>`，标准且可移植
- **不锁定数据** -- 随时用浏览器或其他编辑器打开你的 HTML 文件
- **隐私至上** -- 完全离线，无账号系统，无遥测

---

## 特性

### 暗色大理石主题 (v0.4.0)
基于 **oklch()** 色彩空间的暗色大理石设计系统：

- 多层暗色表面 (`--m-bg` -> `--m-bg-inset`)，冷灰色调
- 暖金色纹理强调 (`--m-vein`)，用于激活态指示器、链接、交互反馈
- `.m-chip` 语义标签芯片、`.m-kbd` 键盘快捷键徽章、`.marble-vein-bg` 背景纹理
- Geist UI 字体 + JetBrains Mono 等宽字体

### Ribbon 垂直导航
- **44px 图标条**：Files / Search / Graph / Components / Data / Tags，替代旧的文字标签页
- **2px 金色左侧指示器**：激活项的脉纹标记
- 悬停高亮，即时反馈

### 编辑器
三种模式，一键切换：

- **源码模式**（默认）：CodeMirror 6，暗色大理石内嵌背景
- **WYSIWYG 模式**（插件）：TipTap（ProseMirror），30+ 扩展
- **阅读模式**：大理石排版，14.5px 正文，金色链接，青色内联代码
- 30px 标签栏，激活态金色顶部边框，未保存标记

### 文件管理
- 树形目录浏览，Inline Rename
- 右键上下文菜单：新建笔记/文件夹、重命名、删除、复制路径
- 文件变动自动监听（Chokidar），实时更新索引

### 全文搜索
基于 **FlexSearch** 的高性能搜索引擎：

- 字段级索引（标题、标签、正文、路径）
- 搜索运算符：`tag:设计` `folder:notes/` `title:README` `file:index`
- 防抖搜索（300ms），最近搜索记录

### 知识图谱
基于 **D3-force** 的力导向图可视化：

- 节点按类型着色（data=金 / spec=蓝 / dash=品红 / runbook=红 / doc=紫 / comp=青）
- 边按类型区分：数据流=金色实线，组件使用=青色虚线，链接=灰色细线
- 选中节点发光滤镜 + 脉冲动画
- 节点拖拽、缩放平移、全局/局部模式

### 右侧信息面板
- 三个可折叠分区：反向链接 / 大纲 / 属性
- 反向链接卡片式展示，大理石卡片样式
- 未链接提及自动发现

### 双向链接
- 自动解析笔记间的 `[[wikilink]]` 风格链接
- 显示反向链接面板
- 未链接提及自动发现

### 导出
- **独立 HTML 文件**：右键任意笔记导出自包含网页
- **纯文本** + **Markdown**：通过 Turndown 转换
- HTML 本身就是原生格式，无需导出即可在任何浏览器查看

### 主题系统
- 暗色大理石主题（默认）
- CSS 自定义属性驱动，易于扩展

### 多语言
- 中文（zh-CN）和英语（en-US），基于 i18next

### AI 助手 (v0.5.0)
基于 OpenAI 兼容 API 的内置 AI 对话面板：

- **Chat 界面**：侧边栏对话面板，支持流式输出
- **Vault 感知**：AI 可直接读取、搜索、创建、编辑你的笔记
- **工具调用**：list_files / read_note / search_notes / create_note / edit_note / delete_note / rename_note
- **Diff 预览**：AI 编辑笔记时展示更改差异，需用户确认后应用
- **安全模式**：写操作需用户批准，读操作自动执行
- **多模型支持**：兼容 OpenAI / Anthropic / 本地模型（Ollama 等），在设置中配置

### 增强设置
- 六页签设置面板：关于、编辑器、文件与链接、外观、AI、快捷键
- 可搜索筛选的快捷键重新绑定

### 快捷键
| 快捷键 | 功能 |
|---|---|
| `Ctrl+P` | 快速切换 |
| `Ctrl+Shift+P` | 命令面板 |
| `Ctrl+N` | 新建笔记 |
| `Ctrl+E` | 切换编辑模式 |
| `Ctrl+F` | 查找替换 |
| `Ctrl+Shift+F` | 全文搜索 |
| `Ctrl+S` | 保存 |
| `Ctrl+W` | 关闭标签 |
| `Ctrl+,` | 设置 |
| `Ctrl+L` | AI 对话面板 |

---

## 快速开始

```bash
git clone https://github.com/vanemacus486-bit/marble.git
cd marble/noteforge
npm install
npm run dev       # 开发模式
npm run build     # 构建生产版本
npx electron-builder --win portable  # 打包 Windows exe
```

### 开发命令

```bash
npm run dev          # 启动 Electron 开发环境
npm run build        # 构建生产版本
npm run typecheck    # TypeScript 类型检查
npm test             # 运行单元测试
npm run lint         # 代码检查
```

---

## 技术栈

| 层 | 技术 |
|---|---|
| **桌面框架** | Electron 32 |
| **构建工具** | electron-vite 2.3 + Vite 5 |
| **渲染框架** | React 18 + TypeScript 5.5 |
| **状态管理** | Zustand 5 |
| **编辑器** | CodeMirror 6 + TipTap 2.11 / ProseMirror |
| **AI 集成** | OpenAI SDK (兼容 Anthropic / Ollama 等) |
| **国际化** | i18next + react-i18next |
| **样式** | Tailwind CSS v4 + oklch() CSS 自定义属性 |
| **全文搜索** | FlexSearch 0.7 |
| **图谱可视化** | D3 (d3-force, d3-selection, d3-zoom) |
| **文件监听** | Chokidar 4 |
| **测试** | Vitest + Playwright |
| **打包** | electron-builder |

---

## 许可证

MIT License
