import { useEffect, useCallback } from 'react'
import { useUiStore } from '../stores/ui-store'
import { useEditorStore } from '../stores/editor-store'
import { useVaultStore } from '../stores/vault-store'
import { useSearchStore } from '../stores/search-store'

interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
}

export function useKeyboardShortcuts() {
  const ui = useUiStore()
  const editor = useEditorStore()
  const vault = useVaultStore()
  const search = useSearchStore()

  const shortcuts: KeyboardShortcut[] = [
    { key: 'p', ctrl: true, action: () => ui.setQuickSwitcherOpen(true) },
    { key: 'P', ctrl: true, shift: true, action: () => ui.setCommandPaletteOpen(true) },
    { key: '\\', ctrl: true, action: () => ui.toggleLeftSidebar() },
    { key: '\\', ctrl: true, shift: true, action: () => ui.toggleRightSidebar() },
    { key: 'w', ctrl: true, action: () => {
      const tab = editor.activeTab()
      if (tab) editor.closeTab(tab.id)
    }},
    { key: 's', ctrl: true, action: () => {
      const tab = editor.activeTab()
      if (tab) editor.saveNote(tab.id)
    }},
    { key: 'e', ctrl: true, action: () => {
      const tab = editor.activeTab()
      if (tab) editor.toggleEditMode(tab.id)
    }},
    { key: 'f', ctrl: true, action: () => editor.showFindReplace() },
    { key: 'F', ctrl: true, shift: true, action: () => { search.setOpen(true) }},
    { key: ',', ctrl: true, action: () => ui.setSettingsOpen(true) },
    { key: 'Tab', ctrl: true, action: () => {
      const tabs = editor.tabs
      const idx = tabs.findIndex((t) => t.id === editor.activeTabId)
      if (idx < tabs.length - 1) editor.setActiveTab(tabs[idx + 1].id)
    }},
    { key: 'Tab', ctrl: true, shift: true, action: () => {
      const tabs = editor.tabs
      const idx = tabs.findIndex((t) => t.id === editor.activeTabId)
      if (idx > 0) editor.setActiveTab(tabs[idx - 1].id)
    }},
  ]

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      for (const sc of shortcuts) {
        const ctrl = e.ctrlKey || e.metaKey
        if (
          e.key === sc.key &&
          ctrl === !!sc.ctrl &&
          e.shiftKey === !!sc.shift &&
          e.altKey === !!sc.alt
        ) {
          e.preventDefault()
          sc.action()
          return
        }
      }
      // Escape
      if (e.key === 'Escape') {
        if (ui.commandPaletteOpen) ui.setCommandPaletteOpen(false)
        else if (ui.quickSwitcherOpen) ui.setQuickSwitcherOpen(false)
        else if (ui.settingsOpen) ui.setSettingsOpen(false)
        else if (search.isOpen) search.setOpen(false)
        else editor.hideFindReplace()
      }
    },
    [shortcuts, ui, editor, search]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
