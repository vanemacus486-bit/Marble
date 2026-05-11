import type {
  FileEntry,
  FileChangeEvent,
  SearchQuery,
  SearchResponse,
  NoteProperties,
  AppConfig,
  VaultConfig,
  IndexProgress,
} from '../../main/types/ipc-contracts'

export interface ElectronAPI {
  // Vault
  openVaultDialog(): Promise<string | null>
  openVault(path: string): Promise<void>
  listFiles(dir?: string): Promise<FileEntry[]>
  getVaultConfig(): Promise<VaultConfig>
  setVaultConfig(config: Partial<VaultConfig>): Promise<void>
  resolvePath(relative: string): Promise<string>

  // Note
  readNote(path: string): Promise<string>
  writeNote(path: string, content: string): Promise<void>
  deleteNote(path: string): Promise<void>
  renameNote(oldPath: string, newPath: string): Promise<void>
  createNote(path: string, template?: string): Promise<string>
  moveNote(sourcePath: string, targetFolder: string): Promise<void>
  getNoteProperties(path: string): Promise<NoteProperties>
  updateNoteProperties(path: string, properties: Partial<NoteProperties>): Promise<void>

  // Folder
  createFolder(path: string): Promise<void>
  deleteFolder(path: string): Promise<void>
  renameFolder(oldPath: string, newPath: string): Promise<void>

  // File watching
  subscribeToChanges(callback: (event: FileChangeEvent) => void): () => void

  // Search
  rebuildIndex(): Promise<void>
  search(query: SearchQuery): Promise<SearchResponse>
  getIndexStatus(): Promise<{ state: 'idle' | 'building' | 'ready'; noteCount: number }>

  // Index events
  buildIndex(): Promise<void>
  onIndexProgress(callback: (progress: IndexProgress) => void): () => void
  onIndexComplete(callback: () => void): () => void

  // Export
  exportPlaintext(html: string): Promise<string>

  // System
  getAppVersion(): Promise<string>
  openExternal(url: string): Promise<void>
  showInFolder(path: string): Promise<void>
  getAppConfig(): Promise<AppConfig>
  setAppConfig(config: Partial<AppConfig>): Promise<void>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
