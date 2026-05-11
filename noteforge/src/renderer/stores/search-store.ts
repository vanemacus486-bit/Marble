import { create } from 'zustand'
import type { SearchResult } from '../types'

interface SearchState {
  query: string
  results: SearchResult[]
  total: number
  isSearching: boolean
  isOpen: boolean
  selectedIndex: number
  recentSearches: string[]

  setQuery: (query: string) => void
  setResults: (results: SearchResult[], total: number) => void
  setSearching: (searching: boolean) => void
  setOpen: (open: boolean) => void
  setSelectedIndex: (index: number) => void
  addRecentSearch: (query: string) => void
  clearRecentSearches: () => void
  executeSearch: (query: string) => Promise<void>
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  results: [],
  total: 0,
  isSearching: false,
  isOpen: false,
  selectedIndex: 0,
  recentSearches: [],

  setQuery: (query) => set({ query }),

  setResults: (results, total) => set({ results, total, isSearching: false }),

  setSearching: (searching) => set({ isSearching: searching }),

  setOpen: (open) => set({ isOpen: open }),

  setSelectedIndex: (index) => set({ selectedIndex: index }),

  addRecentSearch: (query) => {
    const trimmed = query.trim()
    if (!trimmed) return
    set((s) => ({
      recentSearches: [trimmed, ...s.recentSearches.filter((q) => q !== trimmed)].slice(0, 10),
    }))
  },

  clearRecentSearches: () => set({ recentSearches: [] }),

  executeSearch: async (query: string) => {
    if (query.length < 2) {
      set({ results: [], total: 0, isSearching: false })
      return
    }
    set({ isSearching: true, query })
    try {
      const operators = parseOperators(query)
      const text = stripOperators(query)
      const response = await window.electronAPI.search({
        text,
        operators,
        limit: 100,
      })
      set({ results: response.results, total: response.total, isSearching: false })
      get().addRecentSearch(query)
    } catch {
      set({ isSearching: false })
    }
  },
}))

function parseOperators(raw: string): Record<string, string> {
  const operators: Record<string, string> = {}
  const patterns = ['tag', 'folder', 'file', 'path', 'title']
  for (const op of patterns) {
    const match = raw.match(new RegExp(`${op}:("[^"]*"|'[^']*'|\\S+)`))
    if (match) {
      operators[op] = match[1].replace(/['"]/g, '')
    }
  }
  return operators
}

function stripOperators(raw: string): string {
  return raw.replace(/(tag|folder|file|path|title):("[^"]*"|'[^']*'|\S+)\s*/g, '').trim()
}
