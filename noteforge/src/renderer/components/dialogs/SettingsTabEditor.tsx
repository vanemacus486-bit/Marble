import { useState, useEffect, useRef, useCallback } from 'react'
import { useVaultStore } from '../../stores/vault-store'
import { SettingRow, SectionHeading, NumberInput, SelectInput, ToggleInput } from './SettingsFormControls'
import type { VaultConfig } from '../../types'

interface Props {
  onSaved: (msg: string) => void
}

export default function SettingsTabEditor({ onSaved }: Props) {
  const config = useVaultStore((s) => s.config)
  const setConfig = useVaultStore((s) => s.setConfig)

  const [local, setLocal] = useState<VaultConfig['editor'] | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (config) setLocal({ ...config.editor })
  }, [config])

  const scheduleSave = useCallback(
    (updated: VaultConfig['editor']) => {
      if (!config) return
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(async () => {
        try {
          await setConfig({ ...config, editor: updated })
          onSaved('Saved')
        } catch {
          onSaved('Error saving')
        }
      }, 500)
    },
    [config, setConfig, onSaved],
  )

  const update = (field: string, value: unknown) => {
    if (!local) return
    const updated: VaultConfig['editor'] = { ...local, [field]: value as never }
    setLocal(updated)
    scheduleSave(updated)
  }

  if (!local) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        No vault open. Editor settings are unavailable.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <SectionHeading title="Editor Settings" />

      <SettingRow label="Font Size" description="Base editor font size in pixels (12-24)">
        <NumberInput
          value={local.fontSize}
          min={12}
          max={24}
          onChange={(v) => update('fontSize', v)}
        />
      </SettingRow>

      <SettingRow label="Font Family" description="Editor font family">
        <SelectInput
          value={local.fontFamily}
          options={[
            { value: 'system-ui, -apple-system, sans-serif', label: 'System UI' },
            { value: 'Georgia, serif', label: 'Serif' },
            { value: 'ui-monospace, monospace', label: 'Monospace' },
            { value: "'Source Serif Pro', Georgia, serif", label: 'Source Serif' },
          ]}
          onChange={(v) => update('fontFamily', v)}
        />
      </SettingRow>

      <SettingRow label="Line Height" description="Editor line height (1.0-3.0)">
        <NumberInput
          value={local.lineHeight}
          min={1.0}
          max={3.0}
          step={0.1}
          onChange={(v) => update('lineHeight', v)}
        />
      </SettingRow>

      <SettingRow label="Tab Size" description="Indentation width in spaces">
        <SelectInput
          value={String(local.tabSize)}
          options={[
            { value: '2', label: '2 spaces' },
            { value: '4', label: '4 spaces' },
            { value: '8', label: '8 spaces' },
          ]}
          onChange={(v) => update('tabSize', parseInt(v))}
        />
      </SettingRow>

      <SettingRow label="Spellcheck" description="Enable spellcheck in editor">
        <ToggleInput
          checked={local.spellcheck}
          onChange={(v) => update('spellcheck', v)}
        />
      </SettingRow>

      <SettingRow label="Auto-pair Brackets" description="Auto-close brackets and quotes">
        <ToggleInput
          checked={local.autoPairBrackets}
          onChange={(v) => update('autoPairBrackets', v)}
        />
      </SettingRow>

      <SettingRow label="Default Edit Mode" description="Default editing mode for new tabs">
        <SelectInput
          value={local.defaultEditMode}
          options={[
            { value: 'wysiwyg', label: 'WYSIWYG' },
            { value: 'source', label: 'Source' },
            { value: 'split', label: 'Split' },
            { value: 'preview', label: 'Preview' },
          ]}
          onChange={(v) => update('defaultEditMode', v)}
        />
      </SettingRow>
    </div>
  )
}
