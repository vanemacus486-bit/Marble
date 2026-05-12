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

  useEffect(() => { selectedRef.current?.scrollIntoView({ block: 'nearest' }) }, [selectedIndex])

  const handleClick = (noteId: string) => { openNote(noteId); setOpen(false) }

  if (isSearching) {
    return <div style={{ padding: '12px', textAlign: 'center', fontSize: 13, color: 'var(--m-fg-3)' }}>Searching...</div>
  }

  if (results.length === 0) {
    return <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: 13, color: 'var(--m-fg-3)' }}>No results found</div>
  }

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <div style={{
        padding: '6px 10px', fontSize: '10.5px', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--m-fg-3)',
        borderBottom: '1px solid var(--m-line-soft)',
      }}>
        Showing {results.length}{results.length < total ? ` of ${total}` : ''} results
      </div>
      {results.map((result, i) => (
        <div key={result.noteId} ref={i === selectedIndex ? selectedRef : undefined}>
          <SearchResultItem result={result} isSelected={i === selectedIndex} onClick={() => handleClick(result.noteId)} />
        </div>
      ))}
    </div>
  )
}
