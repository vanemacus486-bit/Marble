import { useState, useEffect, useRef } from 'react'
import { useUiStore } from '../../stores/ui-store'
import { useEditorStore } from '../../stores/editor-store'
import { useGraphStore } from '../../stores/graph-store'

interface Command {
  id: string
  label: string
  shortcut?: string
  action: () => void
}

export default function CommandPalette() {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const close = () => useUiStore.getState().setCommandPaletteOpen(false)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const commands: Command[] = [
    { id: 'toggle-sidebar', label: 'Toggle left sidebar', shortcut: 'Ctrl+\\', action: () => useUiStore.getState().toggleLeftSidebar() },
    { id: 'toggle-right-sidebar', label: 'Toggle right sidebar', shortcut: 'Ctrl+Shift+\\', action: () => useUiStore.getState().toggleRightSidebar() },
    { id: 'toggle-graph', label: 'Toggle graph view', shortcut: 'Ctrl+Shift+M', action: () => useGraphStore.getState().setVisible(!useGraphStore.getState().isVisible) },
    { id: 'save', label: 'Save current note', shortcut: 'Ctrl+S', action: () => { const t = useEditorStore.getState().activeTab(); if (t) useEditorStore.getState().saveNote(t.id) }},
    { id: 'toggle-edit-mode', label: 'Toggle edit mode', shortcut: 'Ctrl+E', action: () => { const t = useEditorStore.getState().activeTab(); if (t) useEditorStore.getState().toggleEditMode(t.id) }},
    { id: 'settings', label: 'Open settings', shortcut: 'Ctrl+,', action: () => useUiStore.getState().setSettingsOpen(true) },
    { id: 'close-tab', label: 'Close current tab', shortcut: 'Ctrl+W', action: () => { const t = useEditorStore.getState().activeTab(); if (t) useEditorStore.getState().closeTab(t.id) }},
  ]

  const filtered = query
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      filtered[selectedIndex]?.action()
      close()
    } else if (e.key === 'Escape') { close() }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-[20vh]">
      <div className="w-full max-w-lg rounded-lg bg-[var(--color-bg-primary)] shadow-2xl">
        <input
          ref={inputRef}
          className="w-full rounded-t-lg border-b border-[var(--color-border)] bg-transparent px-4 py-3 text-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none"
          placeholder="Type a command..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
          onKeyDown={handleKeyDown}
        />
        <div className="max-h-80 overflow-y-auto">
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors ${
                i === selectedIndex
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
              onClick={() => { cmd.action(); close() }}
            >
              <span>{cmd.label}</span>
              {cmd.shortcut && (
                <span className="ml-2 text-xs opacity-60">{cmd.shortcut}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
