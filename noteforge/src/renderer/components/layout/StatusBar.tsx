import { useEditorStore } from '../../stores/editor-store'
import { useVaultStore } from '../../stores/vault-store'

export default function StatusBar() {
  const activeTab = useEditorStore((s) => s.tabs.find((t) => t.id === s.activeTabId))
  const vaultPath = useVaultStore((s) => s.vaultPath)
  const vaultName = useVaultStore((s) => s.vaultName)

  const wordCount = activeTab?.content
    ? activeTab.content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length
    : 0

  return (
    <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-0.5 text-xs text-[var(--color-text-muted)]">
      <div className="flex items-center gap-4">
        <span>{vaultName ?? 'No vault'}</span>
        {activeTab && (
          <>
            <span>Words: {wordCount}</span>
            <span>{activeTab.editMode.toUpperCase()}</span>
            {activeTab.isDirty && (
              <span className="text-[var(--color-warning)]">Unsaved</span>
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
