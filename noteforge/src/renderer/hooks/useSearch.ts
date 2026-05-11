import { useCallback, useEffect, useRef } from 'react'
import { useSearchStore } from '../stores/search-store'

export function useSearch() {
  const store = useSearchStore()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const search = useCallback(
    (query: string) => {
      store.setQuery(query)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        store.executeSearch(query)
      }, 300)
    },
    [store]
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return {
    query: store.query,
    results: store.results,
    total: store.total,
    isSearching: store.isSearching,
    isOpen: store.isOpen,
    selectedIndex: store.selectedIndex,
    recentSearches: store.recentSearches,
    search,
    setOpen: store.setOpen,
    setSelectedIndex: store.setSelectedIndex,
    clearRecentSearches: store.clearRecentSearches,
  }
}
