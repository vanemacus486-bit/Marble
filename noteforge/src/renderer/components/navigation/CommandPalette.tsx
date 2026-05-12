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
    <div onClick={close} style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.45)',
      backdropFilter: 'blur(2px)',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      paddingTop: 120,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 520,
        background: 'var(--m-bg-1)',
        border: '1px solid var(--m-line)',
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: '0 30px 80px rgba(0,0,0,0.50)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px',
          borderBottom: '1px solid var(--m-line-soft)',
        }}>
          <input
            ref={inputRef}
            style={{
              flex: 1, background: 'none', border: 0, outline: 0,
              color: 'var(--m-fg)', fontSize: 14, fontFamily: 'var(--f-ui)',
            }}
            placeholder="Type a command..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
            onKeyDown={handleKeyDown}
          />
          <span className="m-kbd">esc</span>
        </div>
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {filtered.map((cmd, i) => {
            const shortcutText = getShortcutText(cmd.shortcutId)
            return (
              <button
                key={cmd.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '9px 14px', fontSize: 13,
                  background: i === selectedIndex ? 'var(--m-bg-2)' : 'transparent',
                  color: i === selectedIndex ? 'var(--m-fg)' : 'var(--m-fg-1)',
                  borderLeft: i === selectedIndex ? '2px solid var(--m-vein)' : '2px solid transparent',
                  cursor: 'pointer', textAlign: 'left',
                  borderRight: 0, borderTop: 0, borderBottom: 0,
                  transition: 'all .1s',
                }}
                onClick={() => { cmd.action(); close() }}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <span style={{ flex: 1 }}>{cmd.label}</span>
                {shortcutText && (
                  <span className="m-kbd">{shortcutText}</span>
                )}
              </button>
            )
          })}
        </div>
        <div style={{
          padding: '8px 14px', borderTop: '1px solid var(--m-line-soft)',
          fontSize: 11, color: 'var(--m-fg-3)', fontFamily: 'var(--f-mono)',
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>up/down navigate &middot; enter run</span>
          <span>{commands.length} commands</span>
        </div>
      </div>
    </div>
  )
}
