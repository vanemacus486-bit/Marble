import { useRef, useEffect, useState } from 'react'
import { useSearch } from '../../hooks/useSearch'
import { useSearchStore } from '../../stores/search-store'
import { useEditorStore } from '../../stores/editor-store'
import SearchOperators from './SearchOperators'
import SearchResults from './SearchResults'

export default function SearchBar() {
  const {
    query,
    isSearching,
    isOpen,
    recentSearches,
    search,
    setOpen,
    clearRecentSearches,
  } = useSearch()

  const inputRef = useRef<HTMLInputElement>(null)
  const [showRecent, setShowRecent] = useState(false)
  const total = useSearchStore((s) => s.total)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleChange = (value: string) => {
    search(value)
    setShowRecent(false)
  }

  const handleClear = () => {
    search('')
    if (inputRef.current) {
      inputRef.current.value = ''
      inputRef.current.focus()
    }
  }

  const handleInsertOperator = (op: string) => {
    const current = inputRef.current?.value ?? ''
    const newQuery = current + (current && !current.endsWith(' ') ? ' ' : '') + op
    search(newQuery)
    if (inputRef.current) {
      inputRef.current.value = newQuery
      inputRef.current.focus()
    }
  }

  const selectedIndex = useSearchStore((s) => s.selectedIndex)
  const setSelectedIndex = useSearchStore((s) => s.setSelectedIndex)
  const results = useSearchStore((s) => s.results)

  const handleFocus = () => {
    setOpen(true)
    if (!query) {
      setShowRecent(true)
    }
  }

  const handleBlur = () => {
    // Delay to allow click on recent search item
    setTimeout(() => {
      setShowRecent(false)
    }, 200)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(Math.min(selectedIndex + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(Math.max(selectedIndex - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      const openNote = useEditorStore.getState().openNote
      openNote(results[selectedIndex].noteId)
      setOpen(false)
    }
  }

  const handleRecentClick = (recentQuery: string) => {
    search(recentQuery)
    if (inputRef.current) {
      inputRef.current.value = recentQuery
    }
    setShowRecent(false)
  }

  return (
    <div className="flex flex-col">
      <div className="relative flex items-center border-b border-[var(--color-border)] px-3 py-2">
        <svg
          className="mr-2 h-4 w-4 flex-shrink-0 text-[var(--color-text-muted)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none"
          placeholder="Search notes..."
          defaultValue={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
        {isSearching && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
        )}
        {query && !isSearching && (
          <button
            className="ml-1 flex-shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            onClick={handleClear}
            title="Clear search"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
        {total > 0 && !isSearching && (
          <span className="ml-2 flex-shrink-0 rounded-full bg-[var(--color-accent)] px-1.5 py-0.5 text-xs text-white">
            {total}
          </span>
        )}
      </div>

      {/* Operator hints */}
      <SearchOperators onInsert={handleInsertOperator} />

      {/* Recent searches */}
      {showRecent && recentSearches.length > 0 && !query && (
        <div className="border-b border-[var(--color-border)] px-3 py-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-text-muted)]">Recent</span>
            <button
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              onClick={clearRecentSearches}
            >
              Clear
            </button>
          </div>
          {recentSearches.map((sq) => (
            <button
              key={sq}
              className="block w-full truncate px-1 py-1 text-left text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              onMouseDown={(e) => {
                e.preventDefault()
                handleRecentClick(sq)
              }}
            >
              {sq}
            </button>
          ))}
        </div>
      )}

      {/* Search results */}
      {isOpen && <SearchResults />}
    </div>
  )
}
