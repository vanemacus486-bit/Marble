import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../main/types/ipc-channels'
import type { FileChangeEvent } from '../main/types/ipc-contracts'

const api = {
  // Vault
  openVaultDialog: (): Promise<string | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.VAULT_OPEN_DIALOG),
  openVault: (path: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.VAULT_OPEN, path),
  listFiles: (dir?: string): Promise<import('../main/types/ipc-contracts').FileEntry[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.VAULT_LIST_FILES, dir),
  getVaultConfig: (): Promise<import('../main/types/ipc-contracts').VaultConfig> =>
    ipcRenderer.invoke(IPC_CHANNELS.VAULT_GET_CONFIG),
  setVaultConfig: (config: Partial<import('../main/types/ipc-contracts').VaultConfig>): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.VAULT_SET_CONFIG, config),
  resolvePath: (relative: string): Promise<string> =>
    ipcRenderer.invoke(IPC_CHANNELS.VAULT_RESOLVE_PATH, relative),

  // Note
  readNote: (path: string): Promise<string> =>
    ipcRenderer.invoke(IPC_CHANNELS.NOTE_READ, path),
  writeNote: (path: string, content: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.NOTE_WRITE, path, content),
  deleteNote: (path: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.NOTE_DELETE, path),
  renameNote: (oldPath: string, newPath: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.NOTE_RENAME, oldPath, newPath),
  createNote: (path: string, template?: string): Promise<string> =>
    ipcRenderer.invoke(IPC_CHANNELS.NOTE_CREATE, path, template),
  moveNote: (sourcePath: string, targetFolder: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.NOTE_MOVE, sourcePath, targetFolder),
  getNoteProperties: (path: string): Promise<import('../main/types/ipc-contracts').NoteProperties> =>
    ipcRenderer.invoke(IPC_CHANNELS.NOTE_GET_PROPERTIES, path),
  updateNoteProperties: (path: string, properties: Partial<import('../main/types/ipc-contracts').NoteProperties>): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.NOTE_SET_PROPERTIES, path, properties),

  // Folder
  createFolder: (path: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.FOLDER_CREATE, path),
  deleteFolder: (path: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.FOLDER_DELETE, path),
  renameFolder: (oldPath: string, newPath: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.FOLDER_RENAME, oldPath, newPath),

  // File watching — IPC delivers batched FileChangeEvent[]; unwrap so callback receives one event at a time
  subscribeToChanges: (callback: (event: FileChangeEvent) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, events: FileChangeEvent[]) => {
      events.forEach(callback)
    }
    ipcRenderer.on(IPC_CHANNELS.FW_FILE_CHANGED, handler)
    ipcRenderer.send(IPC_CHANNELS.FW_SUBSCRIBE)
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.FW_FILE_CHANGED, handler)
      ipcRenderer.send(IPC_CHANNELS.FW_UNSUBSCRIBE)
    }
  },

  // Search
  rebuildIndex: (): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.SEARCH_REBUILD_INDEX),
  search: (query: import('../main/types/ipc-contracts').SearchQuery): Promise<import('../main/types/ipc-contracts').SearchResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.SEARCH_QUERY, query),
  getIndexStatus: (): Promise<{ state: 'idle' | 'building' | 'ready'; noteCount: number }> =>
    ipcRenderer.invoke(IPC_CHANNELS.SEARCH_INDEX_STATUS),

  // Index events
  buildIndex: (): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.INDEX_BUILD),
  onIndexProgress: (callback: (progress: import('../main/types/ipc-contracts').IndexProgress) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: import('../main/types/ipc-contracts').IndexProgress) => callback(progress)
    ipcRenderer.on(IPC_CHANNELS.INDEX_PROGRESS, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.INDEX_PROGRESS, handler)
  },
  onIndexComplete: (callback: () => void): (() => void) => {
    ipcRenderer.on(IPC_CHANNELS.INDEX_COMPLETE, callback)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.INDEX_COMPLETE, callback)
  },

  // Export
  exportPlaintext: (html: string): Promise<string> =>
    ipcRenderer.invoke(IPC_CHANNELS.EXPORT_PLAINTEXT, html),
  exportHtmlFile: (html: string, title: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.EXPORT_HTML_FILE, html, title),

  // System
  getAppVersion: (): Promise<string> =>
    ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_VERSION),
  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_OPEN_EXTERNAL, url),
  showInFolder: (path: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_SHOW_IN_FOLDER, path),
  getAppConfig: (): Promise<import('../main/types/ipc-contracts').AppConfig> =>
    ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_APP_CONFIG),
  setAppConfig: (config: Partial<import('../main/types/ipc-contracts').AppConfig>): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_SET_APP_CONFIG, config),
}

contextBridge.exposeInMainWorld('electronAPI', api)
