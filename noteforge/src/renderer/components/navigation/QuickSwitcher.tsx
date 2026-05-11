import { useState, useEffect, useRef } from 'react'
import { useUiStore } from '../../stores/ui-store'
import { useVaultStore } from '../../stores/vault-store'
import { useEditorStore } from '../../stores/editor-store'

export default function QuickSwitcher() {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const close = () => useUiStore.getState().setQuickSwitcherOpen(false)
  const notes = useVaultStore((s) => s.notes)
  const openNote = useEditorStore((s) => s.openNote)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const noteList = Array.from(notes.values())

  const filtered = query
    ? noteList.filter(
        (n) =>
          n.title.toLowerCase().includes(query.toLowerCase()) ||
          n.id.toLowerCase().includes(query.toLowerCase())
      )
    : noteList

  const handleSelect = (path: string) => {
    openNote(path)
    close()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) handleSelect(filtered[selectedIndex].id)
    } else if (e.key === 'Escape') {
      close()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-[20vh]">
      <div className="w-full max-w-lg rounded-lg bg-[var(--color-bg-primary)] shadow-2xl">
        <input
          ref={inputRef}
          className="w-full rounded-t-lg border-b border-[var(--color-border)] bg-transparent px-4 py-3 text-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none"
          placeholder="Search notes..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
          onKeyDown={handleKeyDown}
        />
        <div className="max-h-80 overflow-y-auto">
          {filtered.slice(0, 50).map((note, i) => (
            <button
              key={note.id}
              className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                i === selectedIndex
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
              onClick={() => handleSelect(note.id)}
            >
              <span className="font-medium">{note.title}</span>
              <span className="ml-2 text-xs opacity-60">{note.id}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-4 py-4 text-sm text-[var(--color-text-muted)]">
              No notes found
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
