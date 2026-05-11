import { useTranslation } from 'react-i18next'
import { useEditorStore } from '../../stores/editor-store'
import { useVaultStore } from '../../stores/vault-store'
import { getEffectiveShortcut, formatShortcutKeys } from '../../config/shortcuts'

export default function StatusBar() {
  const { t } = useTranslation()
  const activeTab = useEditorStore((s) => s.tabs.find((t) => t.id === s.activeTabId))
  const toggleEditMode = useEditorStore((s) => s.toggleEditMode)
  const vaultPath = useVaultStore((s) => s.vaultPath)
  const vaultName = useVaultStore((s) => s.vaultName)

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

  const editModeShortcut = getEffectiveShortcut('toggle-edit-mode')
  const editModeHint = editModeShortcut ? ` (${formatShortcutKeys(editModeShortcut)})` : ''

  const handleCycleEditMode = () => {
    if (activeTab) {
      toggleEditMode(activeTab.id)
    }
  }

  return (
    <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-0.5 text-xs text-[var(--color-text-muted)]">
      <div className="flex items-center gap-4">
        <span>{vaultName ?? t('statusbar.noVault')}</span>
        {activeTab && (
          <>
            <span>{t('statusbar.words', { count: wordCount })}</span>
            {readingTime && <span>{readingTime}</span>}
            <button
              className="cursor-pointer rounded px-1 hover:bg-[var(--color-bg-tertiary)]"
              onClick={handleCycleEditMode}
              title={`${t('commandPalette.toggleEditMode')}${editModeHint}`}
            >
              {activeTab.editMode === 'wysiwyg' ? 'WYSIWYG' : 'Source'}
            </button>
            {activeTab.isDirty && (
              <span className="rounded-full bg-[var(--color-warning)] px-2 py-0.5 text-xs text-white">{t('statusbar.unsaved')}</span>
            )}
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        {activeTab && <span>{activeTab.notePath}</span>}
        <span>{vaultPath ?? ''}</span>
      </div>
    </div>
  )
}
