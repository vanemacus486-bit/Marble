import { useEffect, useCallback, useRef } from 'react'
import { useUiStore } from '../stores/ui-store'
import { useEditorStore } from '../stores/editor-store'
import { useVaultStore } from '../stores/vault-store'
import { useSearchStore } from '../stores/search-store'
import { useGraphStore } from '../stores/graph-store'
import { DEFAULT_SHORTCUTS, formatShortcutKeys } from '../config/shortcuts'
import type { ShortcutKey } from '../config/shortcuts'

interface ResolvedShortcut {
  id: string
  keys: ShortcutKey
  action: () => void
}

export function useKeyboardShortcuts() {
  const ui = useUiStore()
  const editor = useEditorStore()
  const vault = useVaultStore()
  const search = useSearchStore()

  // Track user overrides from vault config
  const configOverrides = vault.config?.shortcuts ?? {}

  const resolveShortcuts = useCallback((): ResolvedShortcut[] => {
    const actions: Record<string, () => void> = {
      'quick-switcher': () => ui.setQuickSwitcherOpen(true),
      'command-palette': () => ui.setCommandPaletteOpen(true),
      'toggle-left-sidebar': () => ui.toggleLeftSidebar(),
      'toggle-right-sidebar': () => ui.toggleRightSidebar(),
      'close-tab': () => {
        const tab = editor.activeTab()
        if (tab) editor.closeTab(tab.id)
      },
      'save': () => {
        const tab = editor.activeTab()
        if (tab) editor.saveNote(tab.id)
      },
      'toggle-edit-mode': () => {
        const tab = editor.activeTab()
        if (tab) editor.toggleEditMode(tab.id)
      },
'find': () => editor.showFindReplace(),
      'search': () => { search.setOpen(true) },
      'settings': () => ui.setSettingsOpen(true),
      'next-tab': () => {
        const tabs = editor.tabs
        const idx = tabs.findIndex((t) => t.id === editor.activeTabId)
        if (idx < tabs.length - 1) editor.setActiveTab(tabs[idx + 1].id)
      },
      'prev-tab': () => {
        const tabs = editor.tabs
        const idx = tabs.findIndex((t) => t.id === editor.activeTabId)
        if (idx > 0) editor.setActiveTab(tabs[idx - 1].id)
      },
      'new-note': () => {
        vault.refreshFiles()
      },
      'new-folder': () => {
        vault.refreshFiles()
      },
      'toggle-graph': () => {
        useGraphStore.getState().setVisible(!useGraphStore.getState().isVisible)
      },
    }

    return DEFAULT_SHORTCUTS
      .filter((s) => s.id !== 'rename' && s.id !== 'delete') // handled by FileExplorer internally
      .map((def) => {
        const override = configOverrides[def.id]
        const keys: ShortcutKey = override ?? def.defaultKeys
        return {
          id: def.id,
          keys,
          action: actions[def.id] ?? (() => {}),
        }
      })
  }, [configOverrides, ui, editor, vault, search])

  const shortcutsRef = useRef<ResolvedShortcut[]>([])

  // Commit resolved shortcuts to a ref so handleKeyDown is always fresh but stable
  shortcutsRef.current = resolveShortcuts()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const shortcuts = shortcutsRef.current

      // Check for conflicts first — warn in dev
      if (process.env.NODE_ENV === 'development') {
        const keyMap = new Map<string, string[]>()
        for (const sc of shortcuts) {
          const repr = formatShortcutKeys(sc.keys)
          const existing = keyMap.get(repr)
          if (existing) {
            existing.push(sc.id)
            console.warn(
              `[KeyboardShortcuts] Conflict: "${repr}" is bound to both "${existing[0]}" and "${sc.id}"`
            )
          } else {
            keyMap.set(repr, [sc.id])
          }
        }
        // Only warn once by clearing the env
        ;(handleKeyDown as any)._conflictChecked = true
      }

      for (const sc of shortcuts) {
        const ctrl = e.ctrlKey || e.metaKey
        if (
          e.key === sc.keys.key &&
          ctrl === !!sc.keys.ctrl &&
          e.shiftKey === !!sc.keys.shift &&
          e.altKey === !!sc.keys.alt
        ) {
          e.preventDefault()
          sc.action()
          return
        }
      }

      // Escape handling
      if (e.key === 'Escape') {
        if (ui.commandPaletteOpen) ui.setCommandPaletteOpen(false)
        else if (ui.quickSwitcherOpen) ui.setQuickSwitcherOpen(false)
        else if (ui.settingsOpen) ui.setSettingsOpen(false)
        else if (search.isOpen) search.setOpen(false)
        else editor.hideFindReplace()
      }
    },
    [ui, editor, search]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

/**
 * Update a shortcut's key binding and persist to config.
 */
export async function updateShortcut(id: string, newKeys: ShortcutKey): Promise<void> {
  const config = useVaultStore.getState().config
  if (!config) return

  const shortcuts = { ...(config.shortcuts ?? {}), [id]: newKeys }
  await useVaultStore.getState().setConfig({ ...config, shortcuts })
}

/**
 * Reset a single shortcut to its default key binding.
 */
export async function resetShortcut(id: string): Promise<void> {
  const config = useVaultStore.getState().config
  if (!config) return

  const shortcuts = { ...(config.shortcuts ?? {}) }
  delete shortcuts[id]
  await useVaultStore.getState().setConfig({ ...config, shortcuts })
}

/**
 * Reset all shortcuts to defaults.
 */
export async function resetAllShortcuts(): Promise<void> {
  const config = useVaultStore.getState().config
  if (!config) return

  await useVaultStore.getState().setConfig({ ...config, shortcuts: {} })
}
