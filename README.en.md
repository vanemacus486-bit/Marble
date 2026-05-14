<div align="center">
 
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/dd2f32a6-275d-47d0-b99b-11dc4f48e5b4" />

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/c003b5fe-4087-40c9-92b1-30469c62864f" />

# Marble
 
**HTML-native local knowledge management**
 
Your notes are `.html` files, stored on your own computer.
No cloud, no lock-in, no migration.
 
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)](https://github.com/vanemacus486-bit/Marble/releases)
[![Stars](https://img.shields.io/github/stars/vanemacus486-bit/Marble?style=social)](https://github.com/vanemacus486-bit/Marble/stargazers)
 
[**Download**](https://github.com/vanemacus486-bit/Marble/releases) · [中文](README.md) · [Report Issue](https://github.com/vanemacus486-bit/Marble/issues)
 
</div>
---
 
<!--
👇 Put your main screenshot or GIF here (editor + knowledge graph + dark marble theme).
Recommended size 1600×900, place at noteforge/resources/screenshot.png.
A README without a screenshot above the fold loses ~3× star conversion.
-->
 
<div align="center">
![Marble Screenshot](noteforge/resources/screenshot.png)
 
</div>
---
 
## Why not Markdown?
 
Markdown was designed in 2004 with one purpose: **to be a convenient way to write HTML**. It was never the destination — HTML was.
 
Twenty years later, we use Markdown for everything. The result: ugly tables, missing layouts, color via dialects, video via plugins, and cross-tool compatibility that doesn't actually exist. Every editor ships its own MD flavor — the "plain text" you wrote isn't really portable.
 
**HTML is the native language of the web** — it natively supports the full spectrum of rich text, layout, media, and interaction. Any browser can open it. It worked 30 years ago, and it will work 30 years from now.
 
Marble isn't here to replace Markdown. It's here for the people who've outgrown it: **write notes like writing HTML** — WYSIWYG, local-first, AI built in.
 
> No cloud. No lock-in. Your data, your files.
 
---
 
## ✨ Features
 
### 🔍 Source split-pane live preview

In source edit mode, toggle a split-pane preview — HTML on the left, rendered output on the right. Sandboxed iframe isolation, CSS variables auto-synced with the theme, 500ms debounce. Write and see what you get, instantly.

### 📄 Notes are HTML files
 
Every note is a standard `.html` file in a local folder (your Vault) of your choice. Metadata lives in `<meta>` tags in `<head>` — standard, portable, future-proof. Double-click to open in any browser. Edit in VS Code if you want. **No database, no proprietary format, no migration anxiety.**
 
### 🤖 AI assistant that works on your notes
 
A built-in AI panel that does more than chat: it reads your notes, searches your vault, creates or edits notes on request — and every write goes through a Diff preview before applying. Compatible with OpenAI, Anthropic, local Ollama, and anything else that speaks the OpenAI API. **Your API key, your bill, your privacy.**
 
### 🕸️ Knowledge graph + bi-directional links
 
D3-force directed graph with type-colored nodes and relationship-typed edges. `[[wikilink]]`-style links resolve automatically. Backlinks panel shows you who points where.
 
### 🎨 Dark marble theme
 
Designed in the modern `oklch()` color space. Cool gray surfaces with warm gold veining for focus accents. Geist UI + JetBrains Mono. Easy on the eyes for long writing sessions.
 
### ⚡ Engineer-grade full-text search
 
Field-level indexing via FlexSearch. Operators: `tag:design`, `folder:notes/`, `title:README`, `file:index`. 300ms debounce, recent searches, jump-on-hit.
 
### 🔒 100% local, 0% telemetry
 
No accounts. No cloud sync. No outbound requests (unless you configure AI yourself). Fully offline. **Your notes never leave your disk.**
 
---
 
## 📊 How it compares
 
| | **Marble** | Obsidian | Notion | Typora |
| --- | :---: | :---: | :---: | :---: |
| Note file format | **`.html`** | `.md` | Proprietary | `.md` |
| Local-first | ✅ | ✅ | ❌ | ✅ |
| Works fully offline | ✅ | ✅ | ❌ | ✅ |
| Rich-text expressiveness | **Full HTML** | MD + plugins | Strong | MD |
| Bi-directional links | ✅ | ✅ | Weak | ❌ |
| Knowledge graph | ✅ | ✅ | ❌ | ❌ |
| Native AI (operates on notes) | ✅ | Plugin | ✅ | ❌ |
| Open source | ✅ | ❌ | ❌ | ❌ |
| Price | **Free** | Free / paid sync | Subscription | $14.99 |
 
---
 
## 🚀 Quick start
 
### For users
 
Grab a build from [Releases](https://github.com/vanemacus486-bit/Marble/releases):
 
- **Windows**: `Marble-Setup-x.x.x.exe`
- **macOS**: `Marble-x.x.x.dmg`
- **Linux**: `Marble-x.x.x.AppImage`
On first launch, pick a folder as your Vault — that's where all your notes live.
 
### For developers
 
```bash
git clone https://github.com/vanemacus486-bit/Marble.git
cd Marble/noteforge
npm install
npm run dev                       # Dev mode (HMR)
npm run build                     # Production build
npx electron-builder --win portable   # Build Windows portable exe
```
 
Prerequisites: Node.js ≥ 18, npm ≥ 9.
 
---
 
## ⌨️ Keyboard shortcuts
 
| Shortcut | Action |
| --- | --- |
| `Ctrl+P` | Quick switch note |
| `Ctrl+Shift+P` | Command palette |
| `Ctrl+N` | New note |
| `Ctrl+E` | Cycle edit mode (Source / WYSIWYG / Reading) |
| `Ctrl+Shift+F` | Full-text search |
| `Ctrl+L` | Open AI panel |
| `Ctrl+Shift+G` | Knowledge graph |
| `Ctrl+,` | Settings |
 
Full list under **Settings → Shortcuts**, all rebindable.
 
---
 
## 🛠️ Tech stack
 
Electron 32 · React 18 · TypeScript 5.5 · Zustand 5 · TipTap (ProseMirror) · CodeMirror 6 · Tailwind CSS v4 · FlexSearch · D3-force · Chokidar · electron-builder
 
---
 
## 🗺️ Roadmap
 
- [x] HTML-native editor (Source / WYSIWYG / Reading + split live preview)
- [x] Sandboxed iframe preview + CSS variable theme sync
- [x] Bi-directional links + backlinks panel
- [x] Knowledge graph (D3-force)
- [x] Full-text search with operators
- [x] AI assistant (read/write notes, Diff confirmation)
- [x] Dark marble theme
- [ ] Plugin system
- [ ] Optional end-to-end encrypted sync
- [ ] Templates
- [ ] PDF / EPUB import
- [ ] Mobile / Web
---
 
## 🤝 Contributing
 
The project is in early stages. All contributions welcome:
 
- ⭐ Star the repo so more people find it
- 🐛 [Report a bug](https://github.com/vanemacus486-bit/Marble/issues)
- 💡 [Suggest a feature](https://github.com/vanemacus486-bit/Marble/issues)
- 🔧 Open a Pull Request
---
 
## 📄 License
 
[MIT](LICENSE) © Marble Contributors
 
---
 
<div align="center">
**Your notes. Forever yours.**
 
</div>
 
