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
          n.id.toLowerCase().includes(query.toLowerCase()),
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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
        paddingTop: '20vh',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 500,
          borderRadius: 10,
          background: 'var(--m-bg-1)',
          border: '1px solid var(--m-line)',
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
        }}
      >
        <input
          ref={inputRef}
          placeholder="Search notes..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSelectedIndex(0)
          }}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: 14,
            border: 0,
            borderBottom: '1px solid var(--m-line-soft)',
            background: 'transparent',
            color: 'var(--m-fg)',
            outline: 0,
            fontFamily: 'var(--f-ui)',
          }}
        />
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {filtered.slice(0, 50).map((note, i) => {
            const isSelected = i === selectedIndex
            return (
              <button
                key={note.id}
                onClick={() => handleSelect(note.id)}
                style={{
                  display: 'flex',
                  width: '100%',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  fontSize: 12.5,
                  textAlign: 'left',
                  border: 0,
                  cursor: 'pointer',
                  background: isSelected ? 'var(--m-bg-2)' : 'transparent',
                  color: isSelected ? 'var(--m-fg)' : 'var(--m-fg-1)',
                  borderLeft: isSelected ? '2px solid var(--m-vein)' : '2px solid transparent',
                }}
              >
                <span style={{ fontWeight: 500 }}>{note.title}</span>
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--m-fg-3)',
                    fontFamily: 'var(--f-mono)',
                  }}
                >
                  {note.id}
                </span>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <p
              style={{
                padding: '14px 16px',
                fontSize: 12.5,
                color: 'var(--m-fg-3)',
                margin: 0,
              }}
            >
              No notes found
            </p>
          )}
        </div>
        <div
          style={{
            padding: '8px 14px',
            borderTop: '1px solid var(--m-line-soft)',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 10.5,
            color: 'var(--m-fg-3)',
            fontFamily: 'var(--f-mono)',
          }}
        >
          <span>&uarr;&darr; navigate &middot; &crarr; open</span>
          <span>esc to close</span>
        </div>
      </div>
    </div>
  )
}
