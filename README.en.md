<p align="center">
  <img src="noteforge/resources/icon.png" alt="Marble" width="128" height="128" onerror="this.style.display='none'">
</p>

<h1 align="center">Marble</h1>

<p align="center">
  <strong>HTML-Native Local Knowledge Management</strong>
</p>

<p align="center">
  <a href="README.md">📖 中文</a>
  &nbsp;·&nbsp;
  <a href="#-overview">Overview</a>
  &nbsp;·&nbsp;
  <a href="#-features">Features</a>
  &nbsp;·&nbsp;
  <a href="#-quick-start">Quick Start</a>
  &nbsp;·&nbsp;
  <a href="#-tech-stack">Tech Stack</a>
  &nbsp;·&nbsp;
  <a href="#-project-structure">Structure</a>
</p>

---

## 📖 Overview

**Marble** is a **local-first, HTML-native** desktop knowledge management application. Your notes are standard `.html` files stored directly in a folder on your computer. No import, no migration, no proprietary format lock-in.

> **No cloud. No lock-in. Your data, your files.**

### Why HTML instead of Markdown?

Markdown has limited expressiveness — tables, nested task lists, color annotations, subscripts/superscripts all require dialect support with poor cross-tool compatibility. HTML is the native language of the web, naturally supporting the full spectrum of rich text, and any browser can open it directly. Marble combines the convenience of WYSIWYG editing with the portability of plain HTML files.

### Core Philosophy

- **Local-first** — All data lives in a local folder (Vault); no data is ever uploaded to any server
- **HTML-native** — Notes are `.html` files; metadata embedded as `<meta>` tags in `<head>` — standard and portable
- **No lock-in** — Open your HTML files anytime with a browser or any other editor
- **Privacy-first** — Fully offline, no accounts, no telemetry

---

## ✨ Features

### 🖊️ Rich Text Editing
Powerful **TipTap** (ProseMirror) editor with:

- Three edit modes: WYSIWYG, Source, Preview
- Tables (resizable columns), nested task lists, code blocks (syntax highlighting)
- Text color, font family, highlight, underline, subscript, superscript, alignment
- Links, images, text styles
- Multi-tab editing with drag-to-reorder
- Split pane editing (horizontal / vertical)

### 📂 File Management
- Tree-based folder navigation with inline folder creation
- Note create, rename, delete
- Automatic file watching (Chokidar) with real-time index updates

### 🔍 Full-Text Search
High-performance search powered by **FlexSearch**:

- Field-level indexing (title, tags, content, path)
- Search operators: `tag:design` `folder:notes/` `title:README` `file:index`
- Debounced search (300ms), recent search history

### 🕸️ Knowledge Graph
Force-directed graph visualization with **D3-force**:

- Notes as nodes (sized by backlink count, colored by folder)
- Links as directed edges
- Node dragging, zoom/pan, node pinning, global/local mode
- Folder/tag filtering, fullscreen mode
- Click node to open note

### 🔗 Bi-directional Links
- Automatic parsing of `[[wikilink]]`-style links between notes
- Backlinks panel (who links to me)
- Navigation history (back / forward)

### 📤 Export
- **Plain text**: Strip HTML tags
- **Markdown**: Convert via Turndown for migration to other platforms
- HTML is already the native format — view in any browser without exporting

### 🎨 Theme System
- Light / Dark / System-follow three modes
- CSS custom properties driven, easy to extend

### ⌨️ Keyboard Shortcuts
| Shortcut | Action |
|---|---|
| `Ctrl+P` | Quick note switcher |
| `Ctrl+Shift+P` | Command palette |
| `Ctrl+\` | Toggle sidebar |
| `Ctrl+Shift+\` | Toggle right panel |
| `Ctrl+W` | Close current tab |
| `Ctrl+S` | Save |
| `Ctrl+E` | Cycle edit mode |
| `Ctrl+F` | Find & replace |
| `Ctrl+Shift+F` | Full-text search |
| `Ctrl+,` | Settings |
| `Ctrl+Tab` / `Shift+Ctrl+Tab` | Cycle tabs |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) >= 18
- npm >= 9

### Install & Run

```bash
# Clone the repository
git clone https://github.com/vanemacus486-bit/marble.git
cd marble

# Install dependencies (auto-installs noteforge subdirectory)
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Commands

```bash
npm run dev          # Start Electron dev environment (HMR)
npm run build        # Production build
npm run preview      # Preview production build
npm run typecheck    # TypeScript type checking
npm test             # Run unit tests
npm run test:watch   # Watch-mode tests
npm run test:e2e     # Run E2E tests
npm run lint         # Lint code
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Desktop Framework** | Electron 32 |
| **Build** | electron-vite 2.3 + Vite 5 |
| **Renderer** | React 18 + TypeScript 5.5 |
| **State Management** | Zustand 5 |
| **Rich Text Editor** | TipTap 2.11 (ProseMirror), 30+ extensions |
| **Styling** | Tailwind CSS v4 (Vite plugin) |
| **HTML Parsing** | htmlparser2 + domutils |
| **Full-Text Search** | FlexSearch 0.7 |
| **Graph Visualization** | D3 (d3-force, d3-selection, d3-zoom) |
| **File Watching** | Chokidar 4 |
| **Schema Validation** | Zod 3 |
| **HTML→Markdown** | Turndown 7 |
| **Testing** | Vitest + Playwright + Testing Library |
| **Packaging** | electron-builder (Windows NSIS / macOS DMG / Linux AppImage) |
| **Code Quality** | ESLint + Prettier + prettier-plugin-tailwindcss |

---

## 📁 Project Structure

```
marble/
├── noteforge/
│   ├── src/
│   │   ├── main/              # Electron main process
│   │   │   ├── index.ts       # Entry: window creation, IPC registration
│   │   │   └── services/      # Core services
│   │   │       ├── vault-service.ts      # Vault file management
│   │   │       ├── index-builder.ts      # FlexSearch index builder
│   │   │       ├── note-parser.ts        # HTML note parser
│   │   │       ├── search-engine.ts      # Search engine
│   │   │       └── file-watcher.ts       # File change watcher
│   │   ├── preload/           # Electron preload
│   │   │   └── index.ts       # contextBridge API
│   │   └── renderer/          # React renderer
│   │       ├── index.html     # HTML entry point
│   │       ├── main.tsx       # React entry point
│   │       ├── App.tsx        # Root component
│   │       ├── AppShell.tsx   # Main layout
│   │       ├── components/    # UI components
│   │       │   ├── editor/    # TipTap editor, source mode, preview
│   │       │   ├── sidebar/   # File explorer, search panel
│   │       │   ├── graph/     # Knowledge graph (D3 force)
│   │       │   ├── navigation/ # Tab bar, breadcrumbs, panels
│   │       │   └── ui/        # Shared UI (dialogs, toasts, etc.)
│   │       ├── stores/        # Zustand stores
│   │       ├── hooks/         # React hooks
│   │       ├── styles/        # Global styles & themes
│   │       ├── types/         # TypeScript type definitions
│   │       └── utils/         # Utility functions
│   ├── tests/                 # Tests
│   ├── resources/             # App icons & assets
│   ├── electron.vite.config.ts
│   ├── electron-builder.yml
│   ├── tsconfig.json
│   └── vitest.config.ts
├── package.json               # Workspace root config
└── README.md                  # You're reading this file
```

---

## 🤝 Contributing

Contributions are welcome! The project is in early development (v0.1.0). If you're interested:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Dev Environment

VS Code is recommended with these extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript

Code style is managed by ESLint + Prettier + prettier-plugin-tailwindcss. Run `npm run typecheck` before committing.

---

## 📄 License

MIT License

---

<p align="center">
  <sub>Built with ❤️. Your data, forever yours.</sub>
</p>
