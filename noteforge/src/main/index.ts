import { app, shell, BrowserWindow, session, ipcMain, dialog } from 'electron'
import { join, resolve as pathResolve } from 'path'
import fs from 'fs/promises'
import { VaultManager } from './services/vault-manager'
import { NoteParser } from './services/note-parser'
import { ConfigManager } from './services/config-manager'
import { SearchIndexer } from './services/search-indexer'
import { FileWatcher } from './services/file-watcher'
import { IndexBuilder } from './services/index-builder'
import { ExportService } from './services/export-service'
import { getDefaultTemplate } from './utils/template-service'
import { isPathWithinVault } from './utils/path-utils'
import { IPC_CHANNELS } from './types/ipc-channels'
import { defaultAppConfig } from './types/ipc-contracts'
import type { AppConfig, FileChangeEvent, SearchQuery, NoteProperties } from './types/ipc-contracts'
import { loadAppStore, saveAppStore } from './utils/app-store'
import type { AppStoreSchema } from './utils/app-store'

// ── Shared mutable state (services created on vault open) ──

let mainWindow: BrowserWindow | null = null
let vaultManager: VaultManager | null = null
let configManager: ConfigManager | null = null
let fileWatcher: FileWatcher | null = null
let indexBuilder: IndexBuilder | null = null

const noteParser = new NoteParser()
const searchIndexer = new SearchIndexer()
const exportService = new ExportService()
// template functions imported directly
let appStore: AppStoreSchema = { app: defaultAppConfig() }

const subscribedWindows = new Set<number>()

// ── Window ──

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 800, minHeight: 500,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    title: 'Marble',
    show: false
  })

  const isDev = !app.isPackaged
  const connectSrc = isDev ? "'self' ws://localhost:* ws://127.0.0.1:*" : "'self'"
  const scriptSrc = isDev ? "'self' 'unsafe-inline' 'unsafe-eval'" : "'self'"
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self'; font-src 'self' data:; connect-src ${connectSrc}; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`
        ]
      }
    })
  })

  mainWindow.webContents.on('will-navigate', (_event, url) => {
    if (!url.startsWith('file://') && !url.startsWith('devtools://')) {
      _event.preventDefault()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    const allowed = ['https:', 'http:', 'mailto:']
    try { const u = new URL(details.url); if (allowed.includes(u.protocol)) shell.openExternal(details.url) } catch {}
    return { action: 'deny' }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ── Vault lifecycle ──

function initVaultServices(vaultPath: string): void {
  vaultManager = new VaultManager(vaultPath)
  configManager = new ConfigManager(vaultPath)
  indexBuilder = new IndexBuilder(vaultManager, noteParser, searchIndexer)
  fileWatcher = new FileWatcher(vaultPath, ['.git', 'node_modules', '.marble'])
}

// ── IPC Registration ──

function registerAllIpc(): void {

  // Vault
  ipcMain.handle(IPC_CHANNELS.VAULT_OPEN_DIALOG, async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'], title: 'Select Vault Folder' })
    return result.canceled ? null : result.filePaths[0] ?? null
  })

  ipcMain.handle(IPC_CHANNELS.VAULT_OPEN, async (_e, vaultPath: string) => {
    initVaultServices(vaultPath)
  })

  ipcMain.handle(IPC_CHANNELS.VAULT_LIST_FILES, async (_e, dir?: string) => {
    if (!vaultManager) throw new Error('No vault open')
    const dirPath = dir ? vaultManager.resolvePath(dir) : undefined
    if (dirPath && !isPathWithinVault(vaultManager.getVaultRoot(), dirPath)) throw new Error('Path outside vault')
    return vaultManager.listFiles(dir)
  })

  ipcMain.handle(IPC_CHANNELS.VAULT_GET_CONFIG, async () => {
    if (!configManager) throw new Error('No vault open')
    return configManager.loadVaultConfig()
  })

  ipcMain.handle(IPC_CHANNELS.VAULT_SET_CONFIG, async (_e, config) => {
    if (!configManager) throw new Error('No vault open')
    const current = await configManager.loadVaultConfig()
    await configManager.saveVaultConfig({ ...current, ...config })
  })

  ipcMain.handle(IPC_CHANNELS.VAULT_RESOLVE_PATH, async (_e, relative: string) => {
    if (!vaultManager) throw new Error('No vault open')
    return vaultManager.resolvePath(relative)
  })

  // Note
  ipcMain.handle(IPC_CHANNELS.NOTE_READ, async (_e, path: string) => {
    if (!vaultManager) throw new Error('No vault open')
    return vaultManager.readNote(path)
  })

  ipcMain.handle(IPC_CHANNELS.NOTE_WRITE, async (_e, path: string, content: string) => {
    if (!vaultManager) throw new Error('No vault open')
    await vaultManager.writeNote(path, content)
  })

  ipcMain.handle(IPC_CHANNELS.NOTE_DELETE, async (_e, path: string) => {
    if (!vaultManager) throw new Error('No vault open')
    await vaultManager.deleteNote(path)
  })

  ipcMain.handle(IPC_CHANNELS.NOTE_RENAME, async (_e, oldPath: string, newPath: string) => {
    if (!vaultManager) throw new Error('No vault open')
    await vaultManager.renameNote(oldPath, newPath)
  })

  ipcMain.handle(IPC_CHANNELS.NOTE_CREATE, async (_e, path: string, tpl?: string) => {
    if (!vaultManager) throw new Error('No vault open')
    const content = tpl ?? getDefaultTemplate(path.split('/').pop()?.replace('.html', '') ?? 'Untitled')
    await vaultManager.createNote(path, content)
    return content
  })

  ipcMain.handle(IPC_CHANNELS.NOTE_MOVE, async (_e, source: string, target: string) => {
    if (!vaultManager) throw new Error('No vault open')
    await vaultManager.moveNote(source, target)
  })

  ipcMain.handle(IPC_CHANNELS.NOTE_GET_PROPERTIES, async (_e, path: string) => {
    if (!vaultManager) throw new Error('No vault open')
    const html = await vaultManager.readNote(path)
    const idx = noteParser.parseNote(html, path)
    return { title: idx.title, tags: idx.tags, created: idx.created, modified: idx.modified, metadata: idx.metadata }
  })

  ipcMain.handle(IPC_CHANNELS.NOTE_SET_PROPERTIES, async (_e, path: string, props: Partial<NoteProperties>) => {
    if (!vaultManager) throw new Error('No vault open')
    const html = await vaultManager.readNote(path)
    const updated = noteParser.updateProperties(html, props)
    await vaultManager.writeNote(path, updated)
  })

  // Folder
  ipcMain.handle(IPC_CHANNELS.FOLDER_CREATE, async (_e, path: string) => {
    if (!vaultManager) throw new Error('No vault open')
    await vaultManager.createFolder(path)
  })
  ipcMain.handle(IPC_CHANNELS.FOLDER_DELETE, async (_e, path: string) => {
    if (!vaultManager) throw new Error('No vault open')
    await vaultManager.deleteFolder(path)
  })
  ipcMain.handle(IPC_CHANNELS.FOLDER_RENAME, async (_e, oldPath: string, newPath: string) => {
    if (!vaultManager) throw new Error('No vault open')
    await vaultManager.renameFolder(oldPath, newPath)
  })

  // File watcher
  ipcMain.on(IPC_CHANNELS.FW_SUBSCRIBE, (event) => subscribedWindows.add(event.sender.id))
  ipcMain.on(IPC_CHANNELS.FW_UNSUBSCRIBE, (event) => subscribedWindows.delete(event.sender.id))

  // Search
  ipcMain.handle(IPC_CHANNELS.SEARCH_REBUILD_INDEX, async () => {
    if (!indexBuilder) throw new Error('No vault open')
    await indexBuilder.buildFull()
  })
  ipcMain.handle(IPC_CHANNELS.SEARCH_QUERY, async (_e, query: SearchQuery) => {
    return searchIndexer.search(query)
  })
  ipcMain.handle(IPC_CHANNELS.SEARCH_INDEX_STATUS, () => ({
    state: 'ready' as const, noteCount: searchIndexer.getDocumentCount()
  }))
  ipcMain.handle(IPC_CHANNELS.INDEX_BUILD, async () => {
    if (!indexBuilder) throw new Error('No vault open')
    for await (const _progress of indexBuilder.buildFullGenerator()) { /* progress handled in index-builder */ }
  })

  // Export
  ipcMain.handle(IPC_CHANNELS.EXPORT_PLAINTEXT, async (_e, html: string) => exportService.plaintext(html))
  ipcMain.handle(IPC_CHANNELS.EXPORT_MARKDOWN, async (_e, html: string) => exportService.markdown(html))
  ipcMain.handle(IPC_CHANNELS.EXPORT_HTML, async (_e, html: string, title?: string) => exportService.htmlPage(html, title))
  ipcMain.handle(IPC_CHANNELS.EXPORT_HTML_FILE, async (_e, html: string, title: string) => {
    const page = exportService.htmlPage(html, title)
    const result = await dialog.showSaveDialog(mainWindow!, {
      defaultPath: `${title || 'note'}.html`,
      filters: [{ name: 'HTML Files', extensions: ['html'] }],
    })
    if (!result.canceled && result.filePath) {
      await fs.writeFile(result.filePath, page, 'utf-8')
    }
    return !result.canceled
  })

  // System
  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_VERSION, () => app.getVersion())
  ipcMain.handle(IPC_CHANNELS.SYSTEM_OPEN_EXTERNAL, async (_e, url: string) => {
    const allowed = ['https:', 'http:', 'mailto:']
    try { const u = new URL(url); if (allowed.includes(u.protocol)) await shell.openExternal(url) } catch {}
  })
  ipcMain.handle(IPC_CHANNELS.SYSTEM_SHOW_IN_FOLDER, (_e, path: string) => {
    if (!vaultManager) throw new Error('No vault open')
    const fullPath = vaultManager.resolvePath(path)
    if (!isPathWithinVault(vaultManager.getVaultRoot(), fullPath)) throw new Error('Path outside vault')
    shell.showItemInFolder(fullPath)
  })
  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_APP_CONFIG, () => appStore.app)
  ipcMain.handle(IPC_CHANNELS.SYSTEM_SET_APP_CONFIG, async (_e, config: Partial<AppConfig>) => {
    appStore.app = { ...appStore.app, ...config }
    await saveAppStore(appStore)
  })
}

// ── Lifecycle ──

app.whenReady().then(async () => {
  appStore = await loadAppStore()
  createWindow()
  registerAllIpc()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
