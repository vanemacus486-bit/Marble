import { useState, useEffect, useRef } from 'react'
import { useVaultStore } from '../../stores/vault-store'
import { useUiStore } from '../../stores/ui-store'
import type { VaultConfig } from '../../types'

interface SettingsDialogProps {
  onClose: () => void
}

type SettingsTab = 'editor' | 'theme' | 'features'

export default function SettingsDialog({ onClose }: SettingsDialogProps) {
  const config = useVaultStore((s) => s.config)
  const setConfig = useVaultStore((s) => s.setConfig)
  const currentTheme = useUiStore((s) => s.theme)
  const setTheme = useUiStore((s) => s.setTheme)

  const [activeTab, setActiveTab] = useState<SettingsTab>('editor')
  const [isSaving, setIsSaving] = useState(false)
  const [localConfig, setLocalConfig] = useState<VaultConfig | null>(null)
  const [cssSnippets, setCssSnippets] = useState<string[]>([])
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (config) {
      setLocalConfig({ ...config })
    }
    // Load available CSS snippets
    loadCssSnippets()
    dialogRef.current?.focus()
  }, [config])

  const loadCssSnippets = async () => {
    // CSS snippets from user's .marble/snippets/ folder via IPC
    try {
      const snippets = await window.electronAPI.getVaultConfig()
      setCssSnippets(snippets.customCss ?? [])
    } catch {
      setCssSnippets([])
    }
  }

  const updateLocal = (path: string[], value: unknown) => {
    if (!localConfig) return
    const updated = structuredClone(localConfig) as Record<string, unknown>
    let obj = updated
    for (let i = 0; i < path.length - 1; i++) {
      obj = (obj as Record<string, unknown>)[path[i]] as Record<string, unknown>
    }
    ;(obj as Record<string, unknown>)[path[path.length - 1]] = value
    setLocalConfig(updated as VaultConfig)
  }

  const handleSave = async () => {
    if (!localConfig) return
    setIsSaving(true)
    try {
      await setConfig(localConfig)
      useUiStore.getState().addToast('Settings saved', 'success')
      onClose()
    } catch (e) {
      useUiStore.getState().addToast(`Failed to save settings: ${(e as Error).message}`, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }

  if (!localConfig) {
    return null
  }

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'editor', label: 'Editor' },
    { id: 'theme', label: 'Theme' },
    { id: 'features', label: 'Features' },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        className="flex h-[80vh] w-full max-w-2xl overflow-hidden rounded-lg bg-[var(--color-bg-primary)] shadow-2xl"
        role="dialog"
        aria-labelledby="settings-title"
        tabIndex={-1}
      >
        {/* Sidebar tabs */}
        <div className="flex w-44 flex-shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <div className="border-b border-[var(--color-border)] px-4 py-3">
            <h2 id="settings-title" className="text-base font-semibold text-[var(--color-text-primary)]">
              Settings
            </h2>
          </div>
          <nav className="flex-1 overflow-y-auto py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-r-2 border-[var(--color-accent)] bg-[var(--color-bg-tertiary)] text-[var(--color-accent)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === 'editor' && (
              <EditorSettings localConfig={localConfig} updateLocal={updateLocal} />
            )}
            {activeTab === 'theme' && (
              <ThemeSettings
                localConfig={localConfig}
                updateLocal={updateLocal}
                currentTheme={currentTheme}
                setTheme={setTheme}
                cssSnippets={cssSnippets}
              />
            )}
            {activeTab === 'features' && (
              <FeatureSettings localConfig={localConfig} updateLocal={updateLocal} />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-5 py-3">
            <button
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-1.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-tertiary)]"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="rounded-md bg-[var(--color-accent)] px-4 py-1.5 text-sm text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---- Editor Settings ---- */
function EditorSettings({
  localConfig,
  updateLocal,
}: {
  localConfig: VaultConfig
  updateLocal: (path: string[], value: unknown) => void
}) {
  return (
    <div className="space-y-5">
      <SectionHeading title="Editor Settings" />

      <SettingRow label="Font Size" description="Base editor font size in pixels">
        <NumberInput
          value={localConfig.editor.fontSize}
          min={10}
          max={32}
          onChange={(v) => updateLocal(['editor', 'fontSize'], v)}
        />
      </SettingRow>

      <SettingRow label="Font Family" description="Editor font family">
        <SelectInput
          value={localConfig.editor.fontFamily}
          options={[
            { value: 'system-ui, -apple-system, sans-serif', label: 'System UI' },
            { value: 'Georgia, serif', label: 'Serif' },
            { value: 'ui-monospace, monospace', label: 'Monospace' },
            { value: "'Source Serif Pro', Georgia, serif", label: 'Source Serif' },
          ]}
          onChange={(v) => updateLocal(['editor', 'fontFamily'], v)}
        />
      </SettingRow>

      <SettingRow label="Line Height" description="Editor line height">
        <NumberInput
          value={localConfig.editor.lineHeight}
          min={1}
          max={2.5}
          step={0.1}
          onChange={(v) => updateLocal(['editor', 'lineHeight'], v)}
        />
      </SettingRow>

      <SettingRow label="Tab Size" description="Indentation width in spaces">
        <NumberInput
          value={localConfig.editor.tabSize}
          min={1}
          max={8}
          onChange={(v) => updateLocal(['editor', 'tabSize'], v)}
        />
      </SettingRow>

      <SettingRow label="Spellcheck" description="Enable spellcheck in editor">
        <ToggleInput
          checked={localConfig.editor.spellcheck}
          onChange={(v) => updateLocal(['editor', 'spellcheck'], v)}
        />
      </SettingRow>

      <SettingRow label="Auto-pair Brackets" description="Auto-close brackets and quotes">
        <ToggleInput
          checked={localConfig.editor.autoPairBrackets}
          onChange={(v) => updateLocal(['editor', 'autoPairBrackets'], v)}
        />
      </SettingRow>

      <SettingRow label="Default Edit Mode" description="Default editing mode for new tabs">
        <SelectInput
          value={localConfig.editor.defaultEditMode}
          options={[
            { value: 'wysiwyg', label: 'WYSIWYG' },
            { value: 'source', label: 'Source' },
            { value: 'split', label: 'Split' },
            { value: 'preview', label: 'Preview' },
          ]}
          onChange={(v) => updateLocal(['editor', 'defaultEditMode'], v)}
        />
      </SettingRow>
    </div>
  )
}

/* ---- Theme Settings ---- */
function ThemeSettings({
  localConfig,
  updateLocal,
  currentTheme,
  setTheme,
  cssSnippets,
}: {
  localConfig: VaultConfig
  updateLocal: (path: string[], value: unknown) => void
  currentTheme: string
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  cssSnippets: string[]
}) {
  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ] as const

  const handleThemeChange = (value: string) => {
    const theme = value as 'light' | 'dark' | 'system'
    setTheme(theme)
    updateLocal(['themeSource'], theme)
  }

  return (
    <div className="space-y-5">
      <SectionHeading title="Theme" />

      <SettingRow label="Color Theme" description="Choose light, dark, or system theme">
        <div className="flex gap-2">
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                localConfig.themeSource === opt.value
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
              onClick={() => handleThemeChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </SettingRow>

      <SettingRow
        label="Custom CSS Snippets"
        description="Toggle CSS snippet files from .marble/snippets/"
      >
        <div className="mt-1 space-y-1">
          {cssSnippets.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)]">No CSS snippets found</p>
          )}
          {cssSnippets.map((snippet) => (
            <label
              key={snippet}
              className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-text-secondary)]"
            >
              <input
                type="checkbox"
                className="accent-[var(--color-accent)]"
                checked={localConfig.customCss.includes(snippet)}
                onChange={(e) => {
                  const updated = e.target.checked
                    ? [...localConfig.customCss, snippet]
                    : localConfig.customCss.filter((s) => s !== snippet)
                  updateLocal(['customCss'], updated)
                }}
              />
              <span>{snippet}</span>
            </label>
          ))}
        </div>
      </SettingRow>
    </div>
  )
}

/* ---- Feature Settings ---- */
function FeatureSettings({
  localConfig,
  updateLocal,
}: {
  localConfig: VaultConfig
  updateLocal: (path: string[], value: unknown) => void
}) {
  return (
    <div className="space-y-5">
      <SectionHeading title="Features" />

      <SettingRow
        label="Daily Notes"
        description="Enable daily note creation and quick access"
      >
        <ToggleInput
          checked={localConfig.features.dailyNotes}
          onChange={(v) => updateLocal(['features', 'dailyNotes'], v)}
        />
      </SettingRow>

      {localConfig.features.dailyNotes && (
        <>
          <SettingRow label="Daily Notes Folder" description="Folder to store daily notes">
            <TextInput
              value={localConfig.features.dailyNotesFolder}
              placeholder="Daily"
              onChange={(v) => updateLocal(['features', 'dailyNotesFolder'], v)}
            />
          </SettingRow>

          <SettingRow label="Daily Notes Template" description="Template file for daily notes">
            <TextInput
              value={localConfig.features.dailyNotesTemplate}
              placeholder="daily-template"
              onChange={(v) => updateLocal(['features', 'dailyNotesTemplate'], v)}
            />
          </SettingRow>

          <div className="mt-2 rounded-md bg-[var(--color-bg-secondary)] p-3 text-xs text-[var(--color-text-muted)]">
            Daily notes are auto-created in the specified folder with today's date as filename.
          </div>
        </>
      )}

      <SettingRow label="Auto-save Interval" description="Auto-save delay in milliseconds">
        <NumberInput
          value={localConfig.features.autoSaveInterval}
          min={500}
          max={30000}
          step={500}
          onChange={(v) => updateLocal(['features', 'autoSaveInterval'], v)}
        />
      </SettingRow>
    </div>
  )
}

/* ---- Reusable sub-components ---- */

function SectionHeading({ title }: { title: string }) {
  return (
    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
      {title}
    </h3>
  )
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <label className="text-sm font-medium text-[var(--color-text-primary)]">{label}</label>
        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{description}</p>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function NumberInput({
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}) {
  return (
    <input
      type="number"
      className="w-20 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2 py-1 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(parseFloat(e.target.value))}
    />
  )
}

function TextInput({
  value,
  placeholder,
  onChange,
}: {
  value: string
  placeholder?: string
  onChange: (value: string) => void
}) {
  return (
    <input
      type="text"
      className="w-48 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2 py-1 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function SelectInput({
  value,
  options,
  onChange,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <select
      className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2 py-1 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

function ToggleInput({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      className={`relative h-5 w-9 rounded-full transition-colors ${
        checked ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'
      }`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
