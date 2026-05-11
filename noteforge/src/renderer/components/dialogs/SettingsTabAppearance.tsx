import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useVaultStore } from '../../stores/vault-store'
import { useUiStore } from '../../stores/ui-store'
import { SettingRow, SectionHeading, SelectInput, TextAreaInput } from './SettingsFormControls'
import type { VaultConfig } from '../../types'

interface Props {
  onSaved: (msg: string) => void
}

const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const

const localeOptions = [
  { value: 'en-US', label: 'English (en-US)' },
  { value: 'zh-CN', label: '中文 (zh-CN)' },
] as const

const uiFontSizeOptions = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
] as const

type UiFontSize = 'small' | 'medium' | 'large'

const FONT_SIZE_VALUES: Record<UiFontSize, string> = {
  small: '13px',
  medium: '14px',
  large: '16px',
}

const SWATCH_COLORS = [
  { label: 'Background', varName: '--color-bg-primary' },
  { label: 'Secondary BG', varName: '--color-bg-secondary' },
  { label: 'Tertiary BG', varName: '--color-bg-tertiary' },
  { label: 'Text', varName: '--color-text-primary' },
  { label: 'Muted Text', varName: '--color-text-muted' },
  { label: 'Border', varName: '--color-border' },
  { label: 'Accent', varName: '--color-accent' },
]

export default function SettingsTabAppearance({ onSaved }: Props) {
  const { i18n } = useTranslation()
  const currentTheme = useUiStore((s) => s.theme)
  const setTheme = useUiStore((s) => s.setTheme)
  const config = useVaultStore((s) => s.config)
  const setConfig = useVaultStore((s) => s.setConfig)

  const [localTheme, setLocalTheme] = useState(currentTheme)
  const [locale, setLocale] = useState('en-US')
  const [uiFontSize, setUiFontSize] = useState<UiFontSize>('medium')
  const [customCss, setCustomCss] = useState<string[]>([])
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    setLocalTheme(currentTheme)
  }, [currentTheme])

  useEffect(() => {
    window.electronAPI.getAppConfig().then((appCfg) => {
      setLocale(appCfg.locale || 'en-US')
    }).catch(() => {})
    try {
      const stored = localStorage.getItem('noteforge:ui-font-size') as UiFontSize | null
      if (stored && ['small', 'medium', 'large'].includes(stored)) {
        setUiFontSize(stored)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (config) {
      setCustomCss(config.customCss ?? [])
    }
  }, [config])

  const scheduleAppConfigSave = useCallback(
    (updates: Record<string, unknown>) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(async () => {
        try {
          await window.electronAPI.setAppConfig(updates)
          onSaved('Saved')
        } catch {
          onSaved('Error saving')
        }
      }, 500)
    },
    [onSaved],
  )

  const handleThemeChange = (value: string) => {
    const theme = value as 'light' | 'dark' | 'system'
    setLocalTheme(theme)
    setTheme(theme)
    scheduleAppConfigSave({ theme })
  }

  const handleLocaleChange = (value: string) => {
    setLocale(value)
    i18n.changeLanguage(value)
    scheduleAppConfigSave({ locale: value })
  }

  const handleUiFontSizeChange = (value: string) => {
    const size = value as UiFontSize
    setUiFontSize(size)
    try {
      localStorage.setItem('noteforge:ui-font-size', size)
      document.documentElement.style.fontSize = FONT_SIZE_VALUES[size]
    } catch {}
  }

  const handleCustomCssChange = (value: string) => {
    if (!config) return
    // Split by comma or newline, trim
    const snippets = value.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
    setCustomCss(snippets)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      try {
        await setConfig({ ...config, customCss: snippets })
        onSaved('Saved')
      } catch {
        onSaved('Error saving')
      }
    }, 500)
  }

  return (
    <div className="space-y-5">
      <SectionHeading title="Appearance" />

      {/* Theme */}
      <SettingRow label="Color Theme" description="Choose light, dark, or system theme">
        <div className="flex gap-2">
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              className={`rounded-md border px-4 py-1.5 text-sm transition-colors ${
                localTheme === opt.value
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

      {/* Language */}
      <SettingRow label="Language" description="UI display language">
        <SelectInput
          value={locale}
          options={[...localeOptions]}
          onChange={handleLocaleChange}
        />
      </SettingRow>

      {/* UI Font Size */}
      <SettingRow label="UI Font Size" description="Interface font size">
        <div className="flex gap-2">
          {uiFontSizeOptions.map((opt) => (
            <button
              key={opt.value}
              className={`rounded-md border px-3 py-1 text-sm transition-colors ${
                uiFontSize === opt.value
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
              onClick={() => handleUiFontSizeChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </SettingRow>

      {/* Custom CSS */}
      <SettingRow
        label="Custom CSS"
        description="CSS snippet filenames (comma or newline separated)"
      >
        <TextAreaInput
          value={customCss.join('\n')}
          placeholder="snippets/dark-theme.css"
          rows={3}
          onChange={handleCustomCssChange}
        />
      </SettingRow>

      {/* Theme Preview */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-text-primary)]">
          Theme Preview
        </label>
        <div className="flex flex-wrap gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
          {SWATCH_COLORS.map((swatch) => (
            <div key={swatch.varName} className="flex flex-col items-center gap-1">
              <div
                className="h-8 w-8 rounded-md border border-[var(--color-border)]"
                style={{ backgroundColor: `var(${swatch.varName})` }}
                title={swatch.label}
              />
              <span className="text-[10px] text-[var(--color-text-muted)]">{swatch.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
