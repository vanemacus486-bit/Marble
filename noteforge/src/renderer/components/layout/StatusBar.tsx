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
            <button
              className="cursor-pointer rounded px-1 hover:bg-[var(--color-bg-tertiary)]"
              onClick={handleCycleEditMode}
              title={`${t('commandPalette.toggleEditMode')}${editModeHint}`}
            >
              {activeTab.editMode.toUpperCase()}
            </button>
            {activeTab.isDirty && (
              <span className="text-[var(--color-warning)]">{t('statusbar.unsaved')}</span>
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
