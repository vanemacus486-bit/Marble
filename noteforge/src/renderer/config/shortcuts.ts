export interface ShortcutKey {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
}

export interface ShortcutDefinition {
  id: string
  label: string
  defaultKeys: ShortcutKey
  category: 'navigation' | 'editor' | 'file' | 'view' | 'general'
  description: string
}

export const DEFAULT_SHORTCUTS: ShortcutDefinition[] = [
  // ---- General ----
  { id: 'command-palette', label: 'Command palette', defaultKeys: { key: 'P', ctrl: true, shift: true }, category: 'general', description: 'Open the command palette' },
  { id: 'quick-switcher', label: 'Quick switcher', defaultKeys: { key: 'p', ctrl: true }, category: 'general', description: 'Quickly switch between notes' },
  { id: 'settings', label: 'Settings', defaultKeys: { key: ',', ctrl: true }, category: 'general', description: 'Open settings dialog' },

  // ---- Navigation ----
  { id: 'toggle-left-sidebar', label: 'Toggle left sidebar', defaultKeys: { key: '\\', ctrl: true }, category: 'navigation', description: 'Show or hide the left sidebar' },
  { id: 'toggle-right-sidebar', label: 'Toggle right sidebar', defaultKeys: { key: '\\', ctrl: true, shift: true }, category: 'navigation', description: 'Show or hide the right sidebar' },
  { id: 'next-tab', label: 'Next tab', defaultKeys: { key: 'Tab', ctrl: true }, category: 'navigation', description: 'Switch to the next tab' },
  { id: 'prev-tab', label: 'Previous tab', defaultKeys: { key: 'Tab', ctrl: true, shift: true }, category: 'navigation', description: 'Switch to the previous tab' },
  { id: 'close-tab', label: 'Close tab', defaultKeys: { key: 'w', ctrl: true }, category: 'navigation', description: 'Close the current tab' },

  // ---- Editor ----
  { id: 'save', label: 'Save note', defaultKeys: { key: 's', ctrl: true }, category: 'editor', description: 'Save the current note' },
  { id: 'toggle-edit-mode', label: 'Toggle edit mode', defaultKeys: { key: 'e', ctrl: true }, category: 'editor', description: 'Cycle through editor modes' },
  { id: 'find', label: 'Find in note', defaultKeys: { key: 'f', ctrl: true }, category: 'editor', description: 'Search within the current note' },
  { id: 'search', label: 'Global search', defaultKeys: { key: 'F', ctrl: true, shift: true }, category: 'editor', description: 'Search across all notes' },

  // ---- File ----
  { id: 'new-note', label: 'New note', defaultKeys: { key: 'n', ctrl: true }, category: 'file', description: 'Create a new note' },
  { id: 'new-folder', label: 'New folder', defaultKeys: { key: 'n', ctrl: true, shift: true }, category: 'file', description: 'Create a new folder' },
  { id: 'rename', label: 'Rename', defaultKeys: { key: 'F2' }, category: 'file', description: 'Rename the selected file or folder' },
  { id: 'delete', label: 'Delete', defaultKeys: { key: 'Delete' }, category: 'file', description: 'Delete the selected file or folder' },

  // ---- View ----
  { id: 'toggle-graph', label: 'Toggle graph view', defaultKeys: { key: 'G', ctrl: true, shift: true }, category: 'view', description: 'Show or hide the graph view' },
]

export function getShortcutById(id: string): ShortcutDefinition | undefined {
  return DEFAULT_SHORTCUTS.find((s) => s.id === id)
}

export function getShortcutsByCategory(category: ShortcutDefinition['category']): ShortcutDefinition[] {
  return DEFAULT_SHORTCUTS.filter((s) => s.category === category)
}

import { useVaultStore } from '../stores/vault-store'

export function getEffectiveShortcut(id: string): ShortcutKey | undefined {
  const def = getShortcutById(id)
  if (!def) return undefined
  const config = useVaultStore.getState().config
  const override = config?.shortcuts?.[id]
  return override ?? def.defaultKeys
}

export function formatShortcutKeys(keys: ShortcutKey): string {
  const parts: string[] = []
  if (keys.ctrl) parts.push('Ctrl')
  if (keys.alt) parts.push('Alt')
  if (keys.shift) parts.push('Shift')
  parts.push(keys.key.length === 1 ? keys.key.toUpperCase() : keys.key)
  return parts.join('+')
}
