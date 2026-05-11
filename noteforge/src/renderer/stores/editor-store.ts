import { create } from 'zustand'
import type { NoteProperties } from '../types'

interface EditorTab {
  id: string
  notePath: string
  title: string
  editMode: 'wysiwyg' | 'source'
  isDirty: boolean
  content: string | null
  savedContent: string | null
  scrollPosition: { top: number; left: number }
}

interface SplitPaneLayout {
  id: string
  orientation: 'horizontal' | 'vertical'
  sizes: number[]
  children: string[] // tab IDs in this pane
}

interface EditorState {
  tabs: EditorTab[]
  activeTabId: string | null
  splitPanes: SplitPaneLayout[]
  editorMetadata: Record<string, NoteProperties>
  findReplaceVisible: boolean
  pendingCloseTabId: string | null

  // Tab actions
  openNote: (notePath: string) => Promise<void>
  closeTab: (tabId: string) => boolean
  closeAllTabs: () => void
  closeOtherTabs: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  reorderTabs: (fromIndex: number, toIndex: number) => void

  // Content actions
  setContent: (tabId: string, content: string) => void
  saveNote: (tabId: string) => Promise<void>
  autoSave: (tabId: string) => Promise<void>

  // Mode
  setEditMode: (tabId: string, mode: 'wysiwyg' | 'source') => void
  toggleEditMode: (tabId: string) => void

  // Split pane
  createSplit: (tabId: string, orientation: 'horizontal' | 'vertical') => void
  closeSplit: (paneId: string) => void
  resizeSplit: (paneId: string, sizes: number[]) => void

  // Find/Replace
  showFindReplace: () => void
  hideFindReplace: () => void

  // Pending close (for unsaved changes dialog)
  setPendingCloseTabId: (tabId: string | null) => void

  // Computed helpers
  activeTab: () => EditorTab | undefined
  isNoteOpen: (notePath: string) => boolean
  hasUnsavedChanges: () => boolean
}

function generateTabId(): string {
  return crypto.randomUUID()
}

export const useEditorStore = create<EditorState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  splitPanes: [],
  editorMetadata: {},
  findReplaceVisible: false,
  pendingCloseTabId: null,

  openNote: async (notePath: string) => {
    const { tabs } = get()
    const existing = tabs.find((t) => t.notePath === notePath)
    if (existing) {
      set({ activeTabId: existing.id })
      return
    }
    const content = await window.electronAPI.readNote(notePath)
    const props = await window.electronAPI.getNoteProperties(notePath)
    const tab: EditorTab = {
      id: generateTabId(),
      notePath,
      title: (() => { const m = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i); return m ? m[1].trim() : (props.title || notePath.split('/').pop()?.replace('.html', '') || 'Untitled') })(),
      editMode: 'wysiwyg',
      isDirty: false,
      content,
      savedContent: content,
      scrollPosition: { top: 0, left: 0 },
    }
    set((s) => ({
      tabs: [...s.tabs, tab],
      activeTabId: tab.id,
      editorMetadata: { ...s.editorMetadata, [notePath]: props },
    }))
  },

  closeTab: (tabId: string) => {
    const tab = get().tabs.find((t) => t.id === tabId)
    if (tab?.isDirty && tab.content !== tab.savedContent) {
      set({ pendingCloseTabId: tabId })
      return false
    }
    const tabs = get().tabs.filter((t) => t.id !== tabId)
    const activeTabId =
      get().activeTabId === tabId
        ? tabs[Math.min(get().tabs.indexOf(tab), tabs.length - 1)]?.id ?? null
        : get().activeTabId
    set({ tabs, activeTabId })
    return true
  },

  closeAllTabs: () => set({ tabs: [], activeTabId: null }),

  closeOtherTabs: (tabId: string) => {
    set((s) => ({
      tabs: s.tabs.filter((t) => t.id === tabId),
      activeTabId: tabId,
    }))
  },

  setActiveTab: (tabId: string) => set({ activeTabId: tabId }),

  reorderTabs: (fromIndex, toIndex) => {
    set((s) => {
      const tabs = [...s.tabs]
      const [moved] = tabs.splice(fromIndex, 1)
      tabs.splice(toIndex, 0, moved)
      return { tabs }
    })
  },

  setContent: (tabId, content) => {
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === tabId
          ? { ...t, content, isDirty: content !== t.savedContent }
          : t
      ),
    }))
  },

  saveNote: async (tabId: string) => {
    const tab = get().tabs.find((t) => t.id === tabId)
    if (!tab || tab.content === null) return
    await window.electronAPI.writeNote(tab.notePath, tab.content)
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === tabId ? { ...t, isDirty: false, savedContent: t.content } : t
      ),
    }))
  },

  autoSave: async (tabId: string) => {
    const tab = get().tabs.find((t) => t.id === tabId)
    if (!tab || !tab.isDirty || tab.content === null) return
    await get().saveNote(tabId)
  },

  setEditMode: (tabId, mode) => {
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === tabId ? { ...t, editMode: mode } : t)),
    }))
  },

  toggleEditMode: (tabId: string) => {
    set((s) => ({
      tabs: s.tabs.map((t) => {
        if (t.id !== tabId) return t
        return { ...t, editMode: t.editMode === 'wysiwyg' ? 'source' : 'wysiwyg' }
      }),
    }))
  },

  createSplit: (tabId, orientation) => {
    const pane: SplitPaneLayout = {
      id: generateTabId(),
      orientation,
      sizes: [50, 50],
      children: [tabId],
    }
    set((s) => ({ splitPanes: [...s.splitPanes, pane] }))
  },

  closeSplit: (paneId: string) => {
    set((s) => ({ splitPanes: s.splitPanes.filter((p) => p.id !== paneId) }))
  },

  resizeSplit: (paneId, sizes) => {
    set((s) => ({
      splitPanes: s.splitPanes.map((p) =>
        p.id === paneId ? { ...p, sizes } : p
      ),
    }))
  },

  showFindReplace: () => set({ findReplaceVisible: true }),
  hideFindReplace: () => set({ findReplaceVisible: false }),

  setPendingCloseTabId: (tabId) => set({ pendingCloseTabId: tabId }),

  activeTab: () => {
    const { tabs, activeTabId } = get()
    return tabs.find((t) => t.id === activeTabId)
  },

  isNoteOpen: (notePath: string) => {
    return get().tabs.some((t) => t.notePath === notePath)
  },

  hasUnsavedChanges: () => {
    return get().tabs.some((t) => t.isDirty && t.content !== t.savedContent)
  },
}))
