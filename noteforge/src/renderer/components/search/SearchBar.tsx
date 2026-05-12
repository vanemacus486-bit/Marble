import { useRef, useEffect, useState } from 'react'
import { useSearch } from '../../hooks/useSearch'
import { useSearchStore } from '../../stores/search-store'
import { useEditorStore } from '../../stores/editor-store'
import SearchOperators from './SearchOperators'
import SearchResults from './SearchResults'
import { Icons } from '../ui/marble-icons'
import SideHead from '../layout/SideHead'

export default function SearchBar() {
  const { query, isSearching, recentSearches, search, clearRecentSearches } = useSearch()
  const total = useSearchStore((s) => s.total)
  const inputRef = useRef<HTMLInputElement>(null)
  const [showRecent, setShowRecent] = useState(false)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleChange = (value: string) => { search(value); setShowRecent(false) }
  const handleClear = () => { search(''); if (inputRef.current) { inputRef.current.value = ''; inputRef.current.focus() } }
  const handleFocus = () => { if (!query) setShowRecent(true) }
  const handleBlur = () => { setTimeout(() => setShowRecent(false), 200) }
  const handleInsertOperator = (op: string) => {
    const current = inputRef.current?.value ?? ''
    const newQuery = current + (current && !current.endsWith(' ') ? ' ' : '') + op
    search(newQuery)
    if (inputRef.current) { inputRef.current.value = newQuery; inputRef.current.focus() }
  }

  const selectedIndex = useSearchStore((s) => s.selectedIndex)
  const setSelectedIndex = useSearchStore((s) => s.setSelectedIndex)
  const results = useSearchStore((s) => s.results)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(Math.min(selectedIndex + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(Math.max(selectedIndex - 1, 0)) }
    else if (e.key === 'Enter' && results[selectedIndex]) { e.preventDefault(); useEditorStore.getState().openNote(results[selectedIndex].noteId) }
  }

  const handleRecentClick = (recentQuery: string) => {
    search(recentQuery)
    if (inputRef.current) inputRef.current.value = recentQuery
    setShowRecent(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <SideHead action={total > 0 ? <span className="m-chip mono">{total}</span> : undefined}>Search</SideHead>

      <div style={{ display: 'flex', alignItems: 'center', padding: '4px 10px', borderBottom: '1px solid var(--m-line-soft)' }}>
        <span style={{ color: 'var(--m-fg-3)', display: 'flex', marginRight: 8 }}>{Icons.search}</span>
        <input
          ref={inputRef}
          style={{
            flex: 1, background: 'transparent', border: 0, outline: 'none',
            fontSize: 13, color: 'var(--m-fg)', fontFamily: 'var(--f-ui)',
          }}
          placeholder="Search notes..."
          defaultValue={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus} onBlur={handleBlur} onKeyDown={handleKeyDown}
        />
        {isSearching && (
          <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--m-line)', borderTopColor: 'var(--m-vein)', animation: 'spin .6s linear infinite' }} />
        )}
        {query && !isSearching && (
          <button onClick={handleClear} style={{ color: 'var(--m-fg-3)', padding: 2 }}
            onMouseOver={e => { e.currentTarget.style.color = 'var(--m-fg-1)' }}
            onMouseOut={e => { e.currentTarget.style.color = 'var(--m-fg-3)' }}
          >
            {Icons.close}
          </button>
        )}
      </div>

      <SearchOperators onInsert={handleInsertOperator} />

      {showRecent && recentSearches.length > 0 && !query && (
        <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--m-line-soft)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--m-fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recent</span>
            <button onClick={clearRecentSearches} style={{ fontSize: 10.5, color: 'var(--m-fg-3)' }}>Clear</button>
          </div>
          {recentSearches.map((sq) => (
            <button key={sq}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '2px 4px', fontSize: '12.5px', color: 'var(--m-fg-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderRadius: 3 }}
              onMouseDown={(e) => { e.preventDefault(); handleRecentClick(sq) }}
              onMouseOver={e => { e.currentTarget.style.color = 'var(--m-fg-1)' }}
              onMouseOut={e => { e.currentTarget.style.color = 'var(--m-fg-2)' }}
            >{sq}</button>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <SearchResults />
    </div>
  )
}
