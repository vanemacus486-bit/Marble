import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { DEFAULT_SHORTCUTS, formatShortcutKeys } from '../../config/shortcuts'
import type { ShortcutDefinition, ShortcutKey } from '../../config/shortcuts'
import { useVaultStore } from '../../stores/vault-store'
import { useUiStore } from '../../stores/ui-store'

interface SettingsTabShortcutsProps {
  onSaved?: (msg: string) => void
}

const CATEGORY_ORDER: ShortcutDefinition['category'][] = ['general', 'navigation', 'editor', 'file', 'view']

const CATEGORY_LABELS: Record<ShortcutDefinition['category'], string> = {
  general: 'General',
  navigation: 'Navigation',
  editor: 'Editor',
  file: 'File',
  view: 'View',
}

const CATEGORY_COLORS: Record<ShortcutDefinition['category'], string> = {
  general: 'bg-gray-500',
  navigation: 'bg-blue-500',
  editor: 'bg-green-500',
  file: 'bg-purple-500',
  view: 'bg-orange-500',
}

export default function SettingsTabShortcuts({ onSaved }: SettingsTabShortcutsProps) {
  const config = useVaultStore((s) => s.config)
  const setConfigAction = useVaultStore((s) => s.setConfig)
  const addToast = useUiStore((s) => s.addToast)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [recordingId, setRecordingId] = useState<string | null>(null)
  const [localOverrides, setLocalOverrides] = useState<Record<string, ShortcutKey>>({})

  const hasChanges = useRef(false)

  useEffect(() => {
    if (config?.shortcuts && !hasChanges.current) {
      setLocalOverrides({ ...config.shortcuts })
    }
  }, [config?.shortcuts])

  // Capture keypress when recording
  const handleKeyCapture = useCallback(
    (e: KeyboardEvent) => {
      if (!recordingId) return

      e.preventDefault()
      e.stopPropagation()

      if (e.key === 'Escape') {
        setRecordingId(null)
        return
      }

      const newKeys: ShortcutKey = {
        key: e.key,
        ctrl: e.ctrlKey || e.metaKey,
        shift: e.shiftKey,
        alt: e.altKey,
      }

      if (!newKeys.ctrl && !newKeys.alt && !newKeys.shift) {
        addToast('Shortcuts must include a modifier key (Ctrl, Alt, or Shift)', 'warning')
        return
      }

      hasChanges.current = true
      setLocalOverrides((prev) => ({ ...prev, [recordingId]: newKeys }))
      setRecordingId(null)
    },
    [recordingId, addToast]
  )

  useEffect(() => {
    if (recordingId) {
      window.addEventListener('keydown', handleKeyCapture, true)
      return () => window.removeEventListener('keydown', handleKeyCapture, true)
    }
  }, [recordingId, handleKeyCapture])

  const getEffectiveKey = useCallback(
    (def: ShortcutDefinition): ShortcutKey => {
      return localOverrides[def.id] ?? def.defaultKeys
    },
    [localOverrides]
  )

  // Detect conflicts
  const conflictKeys = useMemo(() => {
    const keyUsage = new Map<string, string[]>()
    for (const def of DEFAULT_SHORTCUTS) {
      const keys = getEffectiveKey(def)
      const repr = formatShortcutKeys(keys)
      const existing = keyUsage.get(repr) ?? []
      existing.push(def.id)
      keyUsage.set(repr, existing)
    }
    const conflicts = new Set<string>()
    for (const [repr, ids] of keyUsage) {
      if (ids.length > 1) conflicts.add(repr)
    }
    return conflicts
  }, [getEffectiveKey])

  const categories = useMemo(
    () => ['All', ...CATEGORY_ORDER.map((c) => CATEGORY_LABELS[c])],
    []
  )

  const filtered = useMemo(() => {
    return DEFAULT_SHORTCUTS.filter((s) => {
      if (categoryFilter !== 'All' && CATEGORY_LABELS[s.category] !== categoryFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          s.label.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [search, categoryFilter])

  const handleReset = (id: string) => {
    hasChanges.current = true
    setLocalOverrides((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const handleResetAll = () => {
    if (Object.keys(localOverrides).length === 0) {
      addToast('All shortcuts are already at defaults', 'info')
      return
    }
    hasChanges.current = true
    setLocalOverrides({})
    addToast('All shortcuts reset to defaults', 'info')
  }

  const handleSave = async () => {
    if (!config) return
    try {
      await setConfigAction({ ...config, shortcuts: localOverrides })
      hasChanges.current = false
      addToast('Shortcuts saved', 'success')
      onSaved?.('Shortcuts saved')
    } catch {
      addToast('Failed to save shortcuts', 'error')
    }
  }

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Search + Filter */}
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-1.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
          placeholder="Search shortcuts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2 py-1 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Shortcuts list */}
      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-[var(--color-border)]">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
            No shortcuts match your search.
          </div>
        ) : (
          CATEGORY_ORDER.map((category) => {
            const catShortcuts = filtered.filter((s) => s.category === category)
            if (catShortcuts.length === 0) return null

            return (
              <div key={category}>
                <div className="sticky top-0 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  {CATEGORY_LABELS[category]}
                </div>
                {catShortcuts.map((def) => {
                  const keys = getEffectiveKey(def)
                  const repr = formatShortcutKeys(keys)
                  const hasConflict = conflictKeys.has(repr)
                  const isOverridden = localOverrides[def.id] !== undefined
                  const isRecording = recordingId === def.id

                  return (
                    <div
                      key={def.id}
                      className={`flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2 text-sm last:border-b-0 ${
                        hasConflict
                          ? 'bg-red-900/10'
                          : 'hover:bg-[var(--color-bg-tertiary)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-[var(--color-text-primary)]">
                          {def.label}
                        </span>
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium text-white ${CATEGORY_COLORS[def.category]}`}
                        >
                          {CATEGORY_LABELS[def.category]}
                        </span>
                        {hasConflict && (
                          <span className="text-xs text-red-400" title="This shortcut conflicts with another action">
                            Conflict
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          className={`rounded-md border px-2 py-0.5 font-mono text-xs transition-colors ${
                            isRecording
                              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)] animate-pulse'
                              : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'
                          }`}
                          onClick={() => setRecordingId(isRecording ? null : def.id)}
                          title="Click to change shortcut"
                        >
                          {isRecording ? (
                            <span className="flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] animate-ping" />
                              Press keys...
                            </span>
                          ) : (
                            <kbd className="font-mono">{repr}</kbd>
                          )}
                        </button>
                        {isOverridden && (
                          <button
                            className="rounded p-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
                            onClick={() => handleReset(def.id)}
                            title="Reset to default"
                          >
                            ↺
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <button
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-tertiary)]"
          onClick={handleResetAll}
        >
          Reset All to Defaults
        </button>
        <button
          className="rounded-md bg-[var(--color-accent)] px-4 py-1.5 text-sm text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
          onClick={handleSave}
          disabled={!config}
        >
          Save Shortcuts
        </button>
      </div>
    </div>
  )
}
