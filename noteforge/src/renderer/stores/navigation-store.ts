import { create } from 'zustand'

interface NavigationState {
  history: string[] // note paths
  historyIndex: number

  pushHistory: (notePath: string) => void
  goBack: () => string | null
  goForward: () => string | null
  canGoBack: () => boolean
  canGoForward: () => boolean
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  history: [],
  historyIndex: -1,

  pushHistory: (notePath: string) => {
    const { history, historyIndex } = get()
    const newHistory = history.slice(0, historyIndex + 1)
    if (newHistory[newHistory.length - 1] !== notePath) {
      newHistory.push(notePath)
      set({ history: newHistory, historyIndex: newHistory.length - 1 })
    }
  },

  goBack: () => {
    const { history, historyIndex } = get()
    if (historyIndex <= 0) return null
    const newIndex = historyIndex - 1
    set({ historyIndex: newIndex })
    return history[newIndex]
  },

  goForward: () => {
    const { history, historyIndex } = get()
    if (historyIndex >= history.length - 1) return null
    const newIndex = historyIndex + 1
    set({ historyIndex: newIndex })
    return history[newIndex]
  },

  canGoBack: () => get().historyIndex > 0,
  canGoForward: () => get().historyIndex < get().history.length - 1,
}))
