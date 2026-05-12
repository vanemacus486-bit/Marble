import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Info, FileText, FolderOpen, Palette, Keyboard, X, Sparkles } from 'lucide-react'
import SettingsTabAbout from './SettingsTabAbout'
import SettingsTabEditor from './SettingsTabEditor'
import SettingsTabFilesLinks from './SettingsTabFilesLinks'
import SettingsTabAppearance from './SettingsTabAppearance'
import SettingsTabShortcuts from './SettingsTabShortcuts'
import SettingsTabAI from './SettingsTabAI'

interface SettingsDialogProps {
  onClose: () => void
}

type SettingsTab = 'about' | 'editor' | 'files-links' | 'appearance' | 'shortcuts' | 'ai'

export default function SettingsDialog({ onClose }: SettingsDialogProps) {
  const { t } = useTranslation()

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'about', label: t('settings.about'), icon: <Info style={{ width: 16, height: 16 }} /> },
    { id: 'editor', label: t('settings.editor'), icon: <FileText style={{ width: 16, height: 16 }} /> },
    { id: 'files-links', label: t('settings.filesAndLinks'), icon: <FolderOpen style={{ width: 16, height: 16 }} /> },
    { id: 'appearance', label: t('settings.appearance'), icon: <Palette style={{ width: 16, height: 16 }} /> },
    { id: 'shortcuts', label: t('settings.keyboardShortcuts'), icon: <Keyboard style={{ width: 16, height: 16 }} /> },
    { id: 'ai', label: t('settings.ai'), icon: <Sparkles style={{ width: 16, height: 16 }} /> },
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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        style={{
          display: 'flex',
          height: 550,
          width: 750,
          overflow: 'hidden',
          borderRadius: 10,
          background: 'var(--m-bg-1)',
          border: '1px solid var(--m-line)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
        }}
        role="dialog"
        aria-labelledby="settings-title"
        tabIndex={-1}
      >
        {/* Left Sidebar */}
        <div
          style={{
            width: 200,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--m-line-soft)',
            background: 'var(--m-bg)',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--m-line-soft)',
            }}
          >
            <h2
              id="settings-title"
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--m-fg)',
                margin: 0,
              }}
            >
              {t('settings.title')}
            </h2>
          </div>
          <nav style={{ flex: 1, overflowY: 'auto', paddingTop: 4 }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 16px',
                    fontSize: 12.5,
                    textAlign: 'left',
                    border: 0,
                    background: isActive ? 'var(--m-bg-2)' : 'transparent',
                    color: isActive ? 'var(--m-fg)' : 'var(--m-fg-1)',
                    cursor: 'pointer',
                    borderLeft: isActive ? '2px solid var(--m-vein)' : '2px solid transparent',
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      width: 22,
                      height: 22,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 4,
                      background: isActive ? 'var(--m-vein-bg)' : 'var(--m-bg-2)',
                      color: isActive ? 'var(--m-vein)' : 'var(--m-fg-3)',
                      fontSize: 11,
                    }}
                  >
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Right Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 20px',
              borderBottom: '1px solid var(--m-line-soft)',
            }}
          >
            <h3
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--m-fg)',
                margin: 0,
              }}
            >
              {activeTabMeta?.label}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {savedIndicator && (
                <span
                  style={{
                    fontSize: 10.5,
                    color: 'var(--m-vein)',
                    fontFamily: 'var(--f-mono)',
                  }}
                >
                  {savedIndicator}
                </span>
              )}
              <button
                onClick={onClose}
                style={{
                  display: 'flex',
                  width: 22,
                  height: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 5,
                  border: 0,
                  color: 'var(--m-fg-3)',
                  cursor: 'pointer',
                }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {activeTab === 'about' && <SettingsTabAbout />}
            {activeTab === 'editor' && <SettingsTabEditor onSaved={showSaved} />}
            {activeTab === 'files-links' && <SettingsTabFilesLinks onSaved={showSaved} />}
            {activeTab === 'appearance' && <SettingsTabAppearance onSaved={showSaved} />}
            {activeTab === 'shortcuts' && <SettingsTabShortcuts />}
            {activeTab === 'ai' && <SettingsTabAI onSaved={showSaved} />}
          </div>
        </div>
      </div>
    </div>
  )
}
