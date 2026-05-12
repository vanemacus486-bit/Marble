// IPC request/response type contracts — shared between main, preload, and renderer

// ---- Vault ----
export interface FileEntry {
  name: string
  path: string // relative to vault root, forward slashes
  isDirectory: boolean
  size: number
  modified: Date
}

export interface VaultConfig {
  vaultVersion: number
  theme: string
  themeSource: 'system' | 'light' | 'dark'
  customCss: string[]
  editor: {
    fontSize: number
    fontFamily: string
    lineHeight: number
    tabSize: number
    spellcheck: boolean
    autoPairBrackets: boolean
    enableWysiwyg: boolean
    defaultEditMode: 'source' | 'wysiwyg' | 'read'
  }
  graph: {
    showArrows: boolean
    physicsEnabled: boolean
    nodeSizeBy: 'links' | 'wordCount' | 'none'
    filterFolders: string[]
    filterTags: string[]
    maxNodes: number
  }
  search: {
    includeTags: boolean
    includeContent: boolean
    fuzzyThreshold: number
  }
  features: {
    dailyNotes: boolean
    dailyNotesFolder: string
    dailyNotesTemplate: string
    autoSaveInterval: number
  }
  system: {
    excludeFolders: string[]
    fileWatcher: boolean
  }
  shortcuts: Record<string, { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean } | undefined>
}

export function defaultVaultConfig(): VaultConfig {
  return {
    vaultVersion: 1,
    theme: 'system',
    themeSource: 'system',
    customCss: [],
    editor: {
      fontSize: 16,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      lineHeight: 1.6,
      tabSize: 2,
      spellcheck: true,
      autoPairBrackets: true,
      enableWysiwyg: false,
      defaultEditMode: 'source',
    },
    graph: {
      showArrows: true,
      physicsEnabled: true,
      nodeSizeBy: 'links',
      filterFolders: [],
      filterTags: [],
      maxNodes: 5000,
    },
    search: {
      includeTags: true,
      includeContent: true,
      fuzzyThreshold: 0.4,
    },
    features: {
      dailyNotes: false,
      dailyNotesFolder: 'Daily',
      dailyNotesTemplate: '',
      autoSaveInterval: 2000,
    },
    system: {
      excludeFolders: ['.git', 'node_modules', '.marble'],
      fileWatcher: true,
    },
    shortcuts: {},
  }
}

export interface FolderNode {
  name: string
  path: string
  children: FolderNode[]
  noteCount: number
}

// ---- Notes ----

export interface Link {
  source: string
  target: string
  displayText: string
  context?: string
}

export interface NoteIndex {
  id: string
  title: string
  tags: string[]
  links: Link[]
  backlinks: Link[]
  created: Date
  modified: Date
  metadata: Record<string, string>
  wordCount: number
  firstHeading: string | null
  headings: Array<{ level: number; text: string; id: string }>
}

export interface NoteProperties {
  title: string
  tags: string[]
  created: Date
  modified: Date
  metadata: Record<string, string>
}

// ---- File Watcher ----

export type FileChangeType = 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir'

export interface FileChangeEvent {
  type: FileChangeType
  path: string
  oldPath?: string // for rename events
}

// ---- Search ----

export interface SearchQuery {
  text: string
  operators: Record<string, string> // e.g., { tag: 'research', folder: 'projects' }
  fuzzyThreshold?: number
  limit?: number
  offset?: number
}

export interface SearchResult {
  noteId: string
  title: string
  path: string
  snippet: string
  matchType: 'title' | 'content' | 'tag' | 'path'
  score: number
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  time: number // ms
}

// ---- Index ----

export interface IndexProgress {
  current: number
  total: number
  phase: 'scanning' | 'parsing' | 'indexing' | 'complete'
}

// ---- App Config ----

export interface AppConfig {
  recentVaults: string[]
  lastVaultPath: string | null
  theme: 'light' | 'dark' | 'system'
  windowBounds: { x: number; y: number; width: number; height: number } | null
  locale: string
}

export function defaultAppConfig(): AppConfig {
  return {
    recentVaults: [],
    lastVaultPath: null,
    theme: 'system',
    windowBounds: null,
    locale: 'en-US',
  }
}
