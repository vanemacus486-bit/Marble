import { useEffect, useRef } from 'react'
import { useEditorStore } from '../../stores/editor-store'
import { useSearchStore } from '../../stores/search-store'
import SearchResultItem from './SearchResultItem'

export default function SearchResults() {
  const results = useSearchStore((s) => s.results)
  const total = useSearchStore((s) => s.total)
  const isSearching = useSearchStore((s) => s.isSearching)
  const selectedIndex = useSearchStore((s) => s.selectedIndex)
  const setOpen = useSearchStore((s) => s.setOpen)
  const openNote = useEditorStore((s) => s.openNote)

  const selectedRef = useRef<HTMLButtonElement>(null)

  // Scroll selected item into view
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const handleClick = (noteId: string) => {
    openNote(noteId)
    setOpen(false)
  }

  // Loading state
  if (isSearching) {
    return (
      <div className="px-3 py-4 text-center text-sm text-[var(--color-text-muted)]">
        Searching...
      </div>
    )
  }

  // No results after search
  if (results.length === 0) {
    return (
      <div className="px-3 py-6 text-center text-sm text-[var(--color-text-muted)]">
        No results found
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="border-b border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)]">
        Showing {results.length}
        {results.length < total ? ` of ${total}` : ''} results
      </div>
      <div className="max-h-[50vh] overflow-y-auto">
        {results.map((result, i) => (
          <div key={result.noteId} ref={i === selectedIndex ? selectedRef : undefined}>
            <SearchResultItem
              result={result}
              isSelected={i === selectedIndex}
              onClick={() => handleClick(result.noteId)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
