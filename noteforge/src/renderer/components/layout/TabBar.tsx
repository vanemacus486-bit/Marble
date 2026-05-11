import { useEditorStore } from '../../stores/editor-store'
import { useVaultStore } from '../../stores/vault-store'
import { useUiStore } from '../../stores/ui-store'

export default function TabBar() {
  const tabs = useEditorStore((s) => s.tabs)
  const activeTabId = useEditorStore((s) => s.activeTabId)
  const setActiveTab = useEditorStore((s) => s.setActiveTab)
  const closeTab = useEditorStore((s) => s.closeTab)
  const pendingCloseTabId = useEditorStore((s) => s.pendingCloseTabId)
  const setPendingCloseTabId = useEditorStore((s) => s.setPendingCloseTabId)
  const saveNote = useEditorStore((s) => s.saveNote)
  const addToast = useUiStore((s) => s.addToast)

  const handleClose = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const result = closeTab(tabId)
    if (result === false) {
      // Unsaved changes — show confirmation dialog
      showUnsavedDialog(tabId)
    }
  }

  const handleSaveAndClose = (tabId: string) => {
    saveNote(tabId).then(() => {
      useEditorStore.getState().closeTab(tabId)
      setPendingCloseTabId(null)
      addToast('Note saved', 'success')
    })
  }

  const handleDiscardAndClose = (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId)
    if (tab) {
      useEditorStore.setState((s) => ({
        tabs: s.tabs.map((t) =>
          t.id === tabId ? { ...t, isDirty: false, content: t.savedContent } : t
        ),
      }))
    }
    useEditorStore.getState().closeTab(tabId)
    setPendingCloseTabId(null)
  }

  const handleCancelClose = () => {
    setPendingCloseTabId(null)
  }

  if (tabs.length === 0) return null

  return (
    <>
      <div className="flex border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="flex flex-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`group flex items-center gap-1.5 border-r border-[var(--color-border)] px-3 py-1.5 text-sm transition-colors ${
                tab.id === activeTabId
                  ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.isDirty && (
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
              )}
              <span className="truncate max-w-40">{tab.title}</span>
              <span
                className="ml-1 rounded p-0.5 opacity-0 hover:bg-[var(--color-bg-tertiary)] group-hover:opacity-100"
                onClick={(e) => handleClose(tab.id, e)}
              >
                ✕
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Unsaved changes dialog */}
      {pendingCloseTabId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-lg bg-[var(--color-bg-primary)] p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Unsaved changes</h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              You have unsaved changes. Save before closing?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded-md px-3 py-1.5 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)]"
                onClick={handleCancelClose}
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
                onClick={() => handleDiscardAndClose(pendingCloseTabId!)}
              >
                Discard
              </button>
              <button
                className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm text-white hover:bg-[var(--color-accent-hover)]"
                onClick={() => handleSaveAndClose(pendingCloseTabId!)}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
