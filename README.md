<div align="center">
<img src="noteforge/resources/icon.png" width="120" alt="Marble" />
# Marble
 
**HTML 原生的本地知识管理工具**
 
你的笔记是 `.html` 文件，存在你自己的电脑里。
没有云，没有锁定，没有迁移。
 
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)](https://github.com/vanemacus486-bit/Marble/releases)
[![Stars](https://img.shields.io/github/stars/vanemacus486-bit/Marble?style=social)](https://github.com/vanemacus486-bit/Marble/stargazers)
 
[**下载**](https://github.com/vanemacus486-bit/Marble/releases) · [English](README.en.md) · [反馈问题](https://github.com/vanemacus486-bit/Marble/issues)
 
</div>
---
 
<!--
👇 强烈建议在这里放一张主截图或 GIF（编辑器 + 知识图谱 + 暗色大理石主题）。
建议尺寸 1600×900，放在 noteforge/resources/screenshot.png。
README 顶部有没有截图,star 转化率差 3 倍以上。
-->
 
<div align="center">
![Marble Screenshot](noteforge/resources/screenshot.png)
 
</div>
---
 
## 为什么不是 Markdown？
 
Markdown 在 2004 年被设计出来时，**初衷就是为了方便地生成 HTML**。它从来不是终点，HTML 才是。
 
20 年过去了，我们却用 Markdown 写一切——结果是：表格难看、布局缺失、想加点颜色要靠方言、想嵌入视频得装扩展，跨工具兼容性形同虚设。每个编辑器对 MD 都有自己的"私货"，所谓的纯文本最终并不可移植。
 
**HTML 是 Web 的母语**——原生支持完整的富文本表达、布局、媒体、交互。任何浏览器都能打开，30 年前的能开，30 年后还能开。
 
Marble 不是要替代 Markdown，而是给那些被 Markdown 局限住的人一个选择：**像写笔记一样写 HTML**，所见即所得，本地优先，AI 内置。
 
> 没有云。没有锁定。你的数据，你的文件。
 
---
 
## ✨ 核心特性
 
### 📄 笔记即 HTML 文件
 
每条笔记都是一个标准 `.html` 文件，存在你指定的本地文件夹（Vault）里。元数据以 `<meta>` 标签嵌入 `<head>`——标准、可移植、永不过时。用浏览器双击就能打开，用 VS Code 也能改。**没有数据库，没有私有格式，没有迁移焦虑。**
 
### 🤖 AI 助手能直接操作你的笔记
 
内置 AI 对话面板，**不是简单的聊天**：它能读你的笔记、按需搜索 Vault、按要求创建或修改笔记，所有写操作 Diff 预览后由你确认。兼容 OpenAI / Anthropic / 本地 Ollama 等所有 OpenAI 协议的模型。**API Key 你自己的，账单你自己的，隐私你自己的。**
 
### 🕸️ 知识图谱 + 双向链接
 
基于 D3-force 的力导向图，节点按类型着色，边按关系区分。`[[wikilink]]` 风格的双向链接自动解析，反向链接面板帮你看清想法之间的关系。
 
### 🎨 暗色大理石主题
 
基于 `oklch()` 现代色彩空间设计的暗色主题。冷灰底色 + 暖金纹理强调，长时间编辑不刺眼。Geist UI 字体 + JetBrains Mono 等宽字体，每个像素都讲究。
 
### ⚡ 工程师级的全文搜索
 
基于 FlexSearch 的字段级索引，支持运算符：`tag:设计`、`folder:notes/`、`title:README`、`file:index`。300ms 防抖，最近搜索记录，命中即跳。
 
### 🔒 100% 本地，0% 遥测
 
没有账号系统。没有云同步。没有任何外发请求（除非你自己配 AI）。完全离线可用。**你的笔记从不离开你的硬盘。**
 
---
 
## 📊 和你熟悉的工具比
 
| | **Marble** | Obsidian | Notion | Typora |
| --- | :---: | :---: | :---: | :---: |
| 笔记文件格式 | **`.html`** | `.md` | 私有数据库 | `.md` |
| 本地优先 | ✅ | ✅ | ❌ | ✅ |
| 完全离线可用 | ✅ | ✅ | ❌ | ✅ |
| 富文本表达力 | **HTML 全集** | MD + 插件 | 强 | MD |
| 双向链接 / 反向链接 | ✅ | ✅ | 弱 | ❌ |
| 知识图谱 | ✅ | ✅ | ❌ | ❌ |
| 原生 AI 助手（能操作笔记）| ✅ | 需插件 | ✅ | ❌ |
| 开源 | ✅ | ❌ | ❌ | ❌ |
| 价格 | **免费** | 免费 / 同步付费 | 订阅制 | $14.99 |
 
---
 
## 🚀 快速开始
 
### 普通用户
 
前往 [Releases](https://github.com/vanemacus486-bit/Marble/releases) 下载对应平台的安装包：
 
- **Windows**：`Marble-Setup-x.x.x.exe`
- **macOS**：`Marble-x.x.x.dmg`
- **Linux**：`Marble-x.x.x.AppImage`
首次启动时选择一个文件夹作为你的 Vault——它就是你所有笔记的"家"。
 
### 开发者
 
```bash
git clone https://github.com/vanemacus486-bit/Marble.git
cd Marble/noteforge
npm install
npm run dev                       # 开发模式
npm run build                     # 构建生产版本
npx electron-builder --win portable   # 打包 Windows exe
```
 
---
 
## ⌨️ 常用快捷键
 
| 快捷键 | 功能 |
| --- | --- |
| `Ctrl+P` | 快速切换笔记 |
| `Ctrl+Shift+P` | 命令面板 |
| `Ctrl+N` | 新建笔记 |
| `Ctrl+E` | 切换编辑模式（源码 / 所见即所得 / 阅读）|
| `Ctrl+Shift+F` | 全文搜索 |
| `Ctrl+L` | 打开 AI 对话面板 |
| `Ctrl+Shift+G` | 打开知识图谱 |
| `Ctrl+,` | 设置 |
 
完整快捷键见**设置 → 快捷键**，全部支持自定义重绑。
 
---
 
## 🛠️ 技术栈
 
Electron 32 · React 18 · TypeScript 5.5 · Zustand 5 · TipTap (ProseMirror) · CodeMirror 6 · Tailwind CSS v4 · FlexSearch · D3-force · Chokidar · electron-builder
 
---
 
## 🗺️ Roadmap
 
- [x] HTML 原生编辑器（源码 / 所见即所得 / 阅读 三模式）
- [x] 双向链接 + 反向链接面板
- [x] 知识图谱（D3-force）
- [x] 全文搜索 + 运算符
- [x] AI 助手（读写笔记、Diff 确认）
- [x] 暗色大理石主题
- [ ] 插件系统
- [ ] 端到端加密的可选同步
- [ ] 模板系统
- [ ] PDF / EPUB 导入
- [ ] 移动端 / Web 版
---
 
## 🤝 参与贡献
 
项目处于早期阶段，欢迎任何形式的参与：
 
- ⭐ Star 这个仓库，让更多人看到
- 🐛 [报告 bug](https://github.com/vanemacus486-bit/Marble/issues)
- 💡 [建议新功能](https://github.com/vanemacus486-bit/Marble/issues)
- 🔧 提交 Pull Request
---
 
## 📄 License
 
[MIT](LICENSE) © Marble Contributors
 
---
 
<div align="center">
**你的笔记，永远是你的。**
 
</div>
