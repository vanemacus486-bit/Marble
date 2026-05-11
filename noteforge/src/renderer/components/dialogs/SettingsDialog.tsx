import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Info, FileText, FolderOpen, Palette, Keyboard, X } from 'lucide-react'
import SettingsTabAbout from './SettingsTabAbout'
import SettingsTabEditor from './SettingsTabEditor'
import SettingsTabFilesLinks from './SettingsTabFilesLinks'
import SettingsTabAppearance from './SettingsTabAppearance'
import SettingsTabShortcuts from './SettingsTabShortcuts'

interface SettingsDialogProps {
  onClose: () => void
}

type SettingsTab = 'about' | 'editor' | 'files-links' | 'appearance' | 'shortcuts'

export default function SettingsDialog({ onClose }: SettingsDialogProps) {
  const { t } = useTranslation()

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'about', label: t('settings.about'), icon: <Info className="h-4 w-4" /> },
    { id: 'editor', label: t('settings.editor'), icon: <FileText className="h-4 w-4" /> },
    { id: 'files-links', label: t('settings.filesAndLinks'), icon: <FolderOpen className="h-4 w-4" /> },
    { id: 'appearance', label: t('settings.appearance'), icon: <Palette className="h-4 w-4" /> },
    { id: 'shortcuts', label: t('settings.keyboardShortcuts'), icon: <Keyboard className="h-4 w-4" /> },
  ]

  const [activeTab, setActiveTab] = useState<SettingsTab>('about')
  const [savedIndicator, setSavedIndicator] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  const showSaved = (msg: string) => {
    setSavedIndicator(msg)
    setTimeout(() => setSavedIndicator(null), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }

  const activeTabMeta = tabs.find((t) => t.id === activeTab)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        className="flex h-[550px] w-[750px] overflow-hidden rounded-lg bg-[var(--color-bg-primary)] shadow-2xl"
        role="dialog"
        aria-labelledby="settings-title"
        tabIndex={-1}
      >
        {/* Left Sidebar */}
        <div className="flex w-[200px] flex-shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <div className="border-b border-[var(--color-border)] px-4 py-3">
            <h2 id="settings-title" className="text-base font-semibold text-[var(--color-text-primary)]">
              {t('settings.title')}
            </h2>
          </div>
          <nav className="flex-1 overflow-y-auto py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-r-2 border-[var(--color-accent)] bg-[var(--color-bg-tertiary)] text-[var(--color-accent)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded text-xs ${activeTab === tab.id ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'}`}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header row */}
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              {activeTabMeta?.label}
            </h3>
            <div className="flex items-center gap-3">
              {savedIndicator && (
                <span className="animate-pulse text-xs text-[var(--color-text-muted)]">
                  {savedIndicator}
                </span>
              )}
              <button
                className="flex h-6 w-6 items-center justify-center rounded text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]"
                onClick={onClose}
                aria-label={t('settings.close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === 'about' && <SettingsTabAbout />}
            {activeTab === 'editor' && <SettingsTabEditor onSaved={showSaved} />}
            {activeTab === 'files-links' && <SettingsTabFilesLinks onSaved={showSaved} />}
            {activeTab === 'appearance' && <SettingsTabAppearance onSaved={showSaved} />}
            {activeTab === 'shortcuts' && <SettingsTabShortcuts />}
          </div>
        </div>
      </div>
    </div>
  )
}
