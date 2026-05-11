import { useState, useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { useVaultStore } from '../../stores/vault-store'

interface LinkAutocompleteProps {
  editor: Editor | null
}

export default function LinkAutocomplete({ editor }: LinkAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const notes = useVaultStore((s) => s.notes)
  const noteList = Array.from(notes.values())

  useEffect(() => {
    if (!editor) return

    const handleText = () => {
      const { from } = editor.state.selection
      const textBefore = editor.state.doc.textBetween(Math.max(0, from - 50), from)
      const match = textBefore.match(/\[\[([^\]]*)$/)

      if (match) {
        setQuery(match[1])
        setIsOpen(true)
        setSelectedIndex(0)

        const { view } = editor
        const coords = view.coordsAtPos(from)
        setPosition({
          top: coords.bottom + 5,
          left: coords.left,
        })
      } else {
        setIsOpen(false)
      }
    }

    editor.on('update', handleText)
    editor.on('selectionUpdate', handleText)

    return () => {
      editor.off('update', handleText)
      editor.off('selectionUpdate', handleText)
    }
  }, [editor])

  if (!isOpen) return null

  const filtered = query
    ? noteList.filter(
        (n) =>
          n.title.toLowerCase().includes(query.toLowerCase()) ||
          n.id.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
    : noteList.slice(0, 10)

  const handleSelect = (note: { id: string; title: string }) => {
    if (!editor) return
    const { from } = editor.state.selection
    const textBefore = editor.state.doc.textBetween(Math.max(0, from - 50), from)
    const bracketPos = textBefore.lastIndexOf('[[')

    editor
      .chain()
      .focus()
      .deleteRange({ from: from - textBefore.length + bracketPos, to: from })
      .insertContent(
        `<a href="${note.id}" data-internal-link="true">${note.title}</a>`
      )
      .run()

    setIsOpen(false)
  }

  return (
    <div
      className="absolute z-40 max-h-48 w-64 overflow-y-auto rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      {filtered.length === 0 ? (
        <div className="px-3 py-2 text-xs text-[var(--color-text-muted)]">
          {query ? 'No matching notes' : 'No notes in vault'}
        </div>
      ) : (
        filtered.map((note, i) => (
          <button
            key={note.id}
            className={`w-full px-3 py-2 text-left text-sm transition-colors ${
              i === selectedIndex
                ? 'bg-[var(--color-accent)] text-white'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
            }`}
            onClick={() => handleSelect(note)}
          >
            <span className="font-medium">{note.title}</span>
            <span className="ml-2 text-xs opacity-60">{note.id}</span>
          </button>
        ))
      )}
    </div>
  )
}
