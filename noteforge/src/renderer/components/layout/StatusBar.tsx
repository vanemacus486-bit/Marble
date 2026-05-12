import { useTranslation } from 'react-i18next'
import { useEditorStore } from '../../stores/editor-store'
import { useVaultStore } from '../../stores/vault-store'

export default function StatusBar() {
  const { t } = useTranslation()
  const activeTab = useEditorStore((s) => s.tabs.find((t) => t.id === s.activeTabId))
  const toggleEditMode = useEditorStore((s) => s.toggleEditMode)
  const enableWysiwyg = useVaultStore((s) => s.config?.editor?.enableWysiwyg) ?? false
  const vaultPath = useVaultStore((s) => s.vaultPath)

  const wordCount = activeTab?.content
    ? activeTab.content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length
    : 0

  const readingTime = activeTab?.content
    ? (() => {
        const text = activeTab.content.replace(/<[^>]+>/g, '')
        const cjkChars = (text.match(/[一-鿿㐀-䶿]/g) || []).length
        const englishText = text.replace(/[一-鿿㐀-䶿]/g, ' ')
        const englishWords = englishText.split(/\s+/).filter(Boolean).length
        const cjkMinutes = cjkChars / 300
        const englishMinutes = englishWords / 200
        const totalMinutes = Math.max(cjkMinutes, englishMinutes)
        return totalMinutes < 1 ? '<1 min read' : `${Math.ceil(totalMinutes)} min read`
      })()
    : ''

  const handleCycleEditMode = () => {
    if (activeTab) {
      toggleEditMode(activeTab.id, enableWysiwyg)
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 22, padding: '0 10px',
      background: 'var(--m-bg-inset)',
      borderTop: '1px solid var(--m-line-soft)',
      fontFamily: 'var(--f-mono)', fontSize: '10.5px',
      color: 'var(--m-fg-3)',
      flex: '0 0 auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ color: 'var(--c-green)' }}>●</span>
        <span>html valid</span>
        {activeTab && (
          <>
            <span>{t('statusbar.words', { count: wordCount })}</span>
            {readingTime && <span>{readingTime}</span>}
            <button
              style={{
                cursor: 'pointer', borderRadius: 3, padding: '0 4px',
                color: 'var(--m-fg-3)', fontFamily: 'var(--f-mono)', fontSize: '10.5px',
              }}
              onClick={handleCycleEditMode}
            >
              {activeTab.editMode === 'source' ? 'Source' : activeTab.editMode === 'wysiwyg' ? 'Edit' : 'Read'}
            </button>
            {activeTab.isDirty && (
              <span style={{
                borderRadius: 9, padding: '0 8px',
                background: 'var(--m-vein)', color: '#000',
                fontSize: 10,
              }}>
                {t('statusbar.unsaved')}
              </span>
            )}
          </>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {activeTab && <span style={{ color: 'var(--m-fg-3)' }}>{activeTab.notePath}</span>}
        <span style={{ color: 'var(--m-fg-3)' }}>{vaultPath ?? ''}</span>
        <span style={{ color: 'var(--m-vein)' }}>marble 0.4.0</span>
      </div>
    </div>
  )
}
