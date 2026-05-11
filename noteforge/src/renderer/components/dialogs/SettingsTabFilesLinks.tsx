import { useState, useEffect, useRef, useCallback } from 'react'
import { useVaultStore } from '../../stores/vault-store'
import { SettingRow, SectionHeading, NumberInput, TextInput, ToggleInput } from './SettingsFormControls'
import type { VaultConfig } from '../../types'

interface Props {
  onSaved: (msg: string) => void
}

export default function SettingsTabFilesLinks({ onSaved }: Props) {
  const config = useVaultStore((s) => s.config)
  const setConfig = useVaultStore((s) => s.setConfig)

  const [local, setLocal] = useState<VaultConfig | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (config) setLocal({ ...config })
  }, [config])

  const scheduleSave = useCallback(
    (updated: VaultConfig) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(async () => {
        try {
          await setConfig(updated)
          onSaved('Saved')
        } catch {
          onSaved('Error saving')
        }
      }, 500)
    },
    [setConfig, onSaved],
  )

  const updateEditor = (path: string[], value: unknown) => {
    if (!local) return
    const updated = structuredClone(local) as Record<string, unknown>
    let obj = updated
    for (let i = 0; i < path.length - 1; i++) {
      obj = (obj as Record<string, unknown>)[path[i]] as Record<string, unknown>
    }
    ;(obj as Record<string, unknown>)[path[path.length - 1]] = value
    setLocal(updated as VaultConfig)
    scheduleSave(updated as VaultConfig)
  }

  if (!config || !local) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        No vault open. Files & Links settings are unavailable.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <SectionHeading title="Files & Links" />

      <SettingRow label="Auto-save Interval" description="Auto-save delay in seconds (0.5-30)">
        <NumberInput
          value={local.features.autoSaveInterval / 1000}
          min={0.5}
          max={30}
          step={0.5}
          onChange={(v) => updateEditor(['features', 'autoSaveInterval'], Math.round(v * 1000))}
        />
      </SettingRow>

      <SettingRow label="Daily Notes Folder" description="Folder to store daily notes">
        <TextInput
          value={local.features.dailyNotesFolder}
          placeholder="Daily"
          onChange={(v) => updateEditor(['features', 'dailyNotesFolder'], v)}
        />
      </SettingRow>

      <SettingRow label="Daily Notes Template" description="Template file for daily notes">
        <TextInput
          value={local.features.dailyNotesTemplate}
          placeholder="daily-template"
          onChange={(v) => updateEditor(['features', 'dailyNotesTemplate'], v)}
        />
      </SettingRow>

      {local.features.dailyNotes && (
        <div className="rounded-md bg-[var(--color-bg-secondary)] p-3 text-xs text-[var(--color-text-muted)]">
          Daily notes are auto-created in the specified folder with today&apos;s date as filename.
        </div>
      )}

      <SettingRow label="File Watcher" description="Watch files for external changes">
        <ToggleInput
          checked={local.system.fileWatcher}
          onChange={(v) => updateEditor(['system', 'fileWatcher'], v)}
        />
      </SettingRow>

      <SettingRow label="Excluded Folders" description="Folders excluded from the vault (comma-separated)">
        <TextInput
          value={local.system.excludeFolders.join(', ')}
          placeholder=".git, node_modules"
          onChange={(v) =>
            updateEditor(
              ['system', 'excludeFolders'],
              v.split(',').map((s) => s.trim()).filter(Boolean),
            )
          }
        />
      </SettingRow>
    </div>
  )
}
