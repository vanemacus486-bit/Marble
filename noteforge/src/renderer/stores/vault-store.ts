import { create } from 'zustand'
import type { FileEntry, FolderNode, VaultConfig, NoteIndex, Link } from '../types'

interface VaultState {
  vaultPath: string | null
  vaultName: string | null
  isLoaded: boolean
  isLoading: boolean
  notes: Map<string, NoteIndex>
  folders: FolderNode[]
  files: FileEntry[]
  config: VaultConfig | null
  error: string | null

  // Actions
  openVault: (path: string) => Promise<void>
  closeVault: () => void
  refreshFiles: () => Promise<void>
  updateNoteIndex: (id: string, index: Partial<NoteIndex>) => void
  removeNoteIndex: (id: string) => void
  addNoteIndex: (id: string, index: NoteIndex) => void
  setConfig: (config: Partial<VaultConfig>) => Promise<void>
  getNoteById: (id: string) => NoteIndex | undefined
  getBacklinks: (id: string) => Link[]
  getOutgoingLinks: (id: string) => Link[]
}

export const useVaultStore = create<VaultState>((set, get) => ({
  vaultPath: null,
  vaultName: null,
  isLoaded: false,
  isLoading: false,
  notes: new Map(),
  folders: [],
  files: [],
  config: null,
  error: null,

  openVault: async (path: string) => {
    set({ isLoading: true, error: null })
    try {
      await window.electronAPI.openVault(path)
      const config = await window.electronAPI.getVaultConfig()
      const files = await window.electronAPI.listFiles(path)
      const name = path.split(/[/\\]/).pop() || 'Untitled Vault'

      set({
        vaultPath: path,
        vaultName: name,
        isLoaded: true,
        isLoading: false,
        config,
        files,
      })
    } catch (e) {
      set({ error: `Failed to open vault: ${(e as Error).message}`, isLoading: false })
    }
  },

  closeVault: () => {
    set({
      vaultPath: null,
      vaultName: null,
      isLoaded: false,
      notes: new Map(),
      folders: [],
      files: [],
      config: null,
    })
  },

  refreshFiles: async () => {
    const { vaultPath } = get()
    if (!vaultPath) return
    const files = await window.electronAPI.listFiles(vaultPath)
    set({ files })
  },

  updateNoteIndex: (id, partial) => {
    const { notes } = get()
    const existing = notes.get(id)
    if (existing) {
      const updated = new Map(notes)
      updated.set(id, { ...existing, ...partial })
      set({ notes: updated })
    }
  },

  removeNoteIndex: (id) => {
    const updated = new Map(get().notes)
    updated.delete(id)
    set({ notes: updated })
  },

  addNoteIndex: (id, index) => {
    const updated = new Map(get().notes)
    updated.set(id, index)
    set({ notes: updated })
  },

  setConfig: async (partial) => {
    await window.electronAPI.setVaultConfig(partial)
    const config = await window.electronAPI.getVaultConfig()
    set({ config })
  },

  getNoteById: (id) => get().notes.get(id),

  getBacklinks: (id) => {
    const note = get().notes.get(id)
    return note?.backlinks ?? []
  },

  getOutgoingLinks: (id) => {
    const note = get().notes.get(id)
    return note?.links ?? []
  },
}))
