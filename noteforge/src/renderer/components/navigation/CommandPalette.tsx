import { useState, useEffect, useRef } from 'react'
import { useUiStore } from '../../stores/ui-store'
import { useEditorStore } from '../../stores/editor-store'
import { useGraphStore } from '../../stores/graph-store'
import { useSearchStore } from '../../stores/search-store'
import { getEffectiveShortcut, formatShortcutKeys } from '../../config/shortcuts'

interface Command {
  id: string
  label: string
  shortcutId?: string
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
    {
      id: 'toggle-sidebar', label: 'Toggle left sidebar', shortcutId: 'toggle-left-sidebar',
      action: () => useUiStore.getState().toggleLeftSidebar(),
    },
    {
      id: 'toggle-right-sidebar', label: 'Toggle right sidebar', shortcutId: 'toggle-right-sidebar',
      action: () => useUiStore.getState().toggleRightSidebar(),
    },
    {
      id: 'toggle-graph', label: 'Toggle graph view', shortcutId: 'toggle-graph',
      action: () => useGraphStore.getState().setVisible(!useGraphStore.getState().isVisible),
    },
    {
      id: 'save', label: 'Save current note', shortcutId: 'save',
      action: () => { const t = useEditorStore.getState().activeTab(); if (t) useEditorStore.getState().saveNote(t.id) },
    },
    {
      id: 'toggle-edit-mode', label: 'Toggle edit mode', shortcutId: 'toggle-edit-mode',
      action: () => { const t = useEditorStore.getState().activeTab(); if (t) useEditorStore.getState().toggleEditMode(t.id) },
    },
    {
      id: 'settings', label: 'Open settings', shortcutId: 'settings',
      action: () => useUiStore.getState().setSettingsOpen(true),
    },
    {
      id: 'close-tab', label: 'Close current tab', shortcutId: 'close-tab',
      action: () => { const t = useEditorStore.getState().activeTab(); if (t) useEditorStore.getState().closeTab(t.id) },
    },
    {
      id: 'new-note', label: 'New note', shortcutId: 'new-note',
      action: () => useUiStore.getState().addToast('Create a note from the file explorer', 'info'),
    },
    {
      id: 'new-folder', label: 'New folder', shortcutId: 'new-folder',
      action: () => useUiStore.getState().addToast('Create a folder from the file explorer', 'info'),
    },
    {
      id: 'find', label: 'Find in note', shortcutId: 'find',
      action: () => useEditorStore.getState().showFindReplace(),
    },
    {
      id: 'search', label: 'Global search', shortcutId: 'search',
      action: () => useSearchStore.getState().setOpen(true),
    },
    {
      id: 'export-html', label: 'Export current note as HTML',
      action: async () => {
        const tab = useEditorStore.getState().activeTab()
        if (tab) {
          await window.electronAPI.exportHtmlFile(tab.content || '', tab.title)
        }
        useUiStore.getState().setCommandPaletteOpen(false)
      },
    },
    {
      id: 'reveal-in-folder', label: 'Reveal in file explorer',
      action: () => {
        const tab = useEditorStore.getState().activeTab()
        if (tab) {
          window.electronAPI.showInFolder(tab.notePath)
        }
        useUiStore.getState().setCommandPaletteOpen(false)
      },
    },
  ]

  const getShortcutText = (shortcutId?: string): string => {
    if (!shortcutId) return ''
    const keys = getEffectiveShortcut(shortcutId)
    return keys ? formatShortcutKeys(keys) : ''
  }

  const fuzzyMatch = (query: string, label: string): boolean => {
    const q = query.toLowerCase()
    const l = label.toLowerCase()
    let qi = 0
    for (let i = 0; i < l.length && qi < q.length; i++) {
      if (l[i] === q[qi]) qi++
    }
    return qi === q.length
  }

  const filtered = query
    ? commands.filter((c) => fuzzyMatch(query, c.label))
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
          {filtered.map((cmd, i) => {
            const shortcutText = getShortcutText(cmd.shortcutId)
            return (
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
                {shortcutText && (
                  <span className="ml-2 text-xs opacity-60">{shortcutText}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
