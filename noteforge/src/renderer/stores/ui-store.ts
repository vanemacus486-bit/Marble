import { create } from 'zustand'

export type LeftSidebarTab = 'files' | 'search' | 'graph' | 'comp' | 'data' | 'tags' | 'ai'
type RightSidebarTab = 'backlinks' | 'outline' | 'properties'

interface UiState {
  leftSidebarOpen: boolean
  rightSidebarOpen: boolean
  leftSidebarWidth: number
  rightSidebarWidth: number
  leftSidebarTab: LeftSidebarTab
  rightSidebarTab: RightSidebarTab
  theme: 'light' | 'dark' | 'system'
  locale: string
  commandPaletteOpen: boolean
  quickSwitcherOpen: boolean
  settingsOpen: boolean
  toasts: Array<{ id: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }>

  toggleLeftSidebar: () => void
  toggleRightSidebar: () => void
  setLeftSidebarWidth: (width: number) => void
  setRightSidebarWidth: (width: number) => void
  setLeftSidebarTab: (tab: LeftSidebarTab) => void
  setRightSidebarTab: (tab: RightSidebarTab) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setLocale: (locale: string) => void
  setCommandPaletteOpen: (open: boolean) => void
  setQuickSwitcherOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  addToast: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void
  removeToast: (id: string) => void
}

function generateId(): string {
  return crypto.randomUUID()
}

export const useUiStore = create<UiState>((set) => ({
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  leftSidebarWidth: 280,
  rightSidebarWidth: 300,
  leftSidebarTab: 'files',
  rightSidebarTab: 'backlinks',
  theme: 'system',
  locale: 'en-US',
  commandPaletteOpen: false,
  quickSwitcherOpen: false,
  settingsOpen: false,
  toasts: [],

  toggleLeftSidebar: () =>
    set((s) => ({ leftSidebarOpen: !s.leftSidebarOpen })),
  toggleRightSidebar: () =>
    set((s) => ({ rightSidebarOpen: !s.rightSidebarOpen })),
  setLeftSidebarWidth: (width) => set({ leftSidebarWidth: width }),
  setRightSidebarWidth: (width) => set({ rightSidebarWidth: width }),
  setLeftSidebarTab: (tab) => set({ leftSidebarTab: tab }),
  setRightSidebarTab: (tab) => set({ rightSidebarTab: tab }),
  setTheme: (theme) => {
    set({ theme })
    document.documentElement.classList.toggle('dark', theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))
  },
  setLocale: (locale) => {
    set({ locale })
    window.electronAPI.setAppConfig({ locale }).catch(() => {})
  },
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setQuickSwitcherOpen: (open) => set({ quickSwitcherOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  addToast: (message, type) => {
    const id = generateId()
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
