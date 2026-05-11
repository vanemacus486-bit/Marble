import { useEditorStore } from '../../stores/editor-store'
import { useVaultStore } from '../../stores/vault-store'
import { useUiStore } from '../../stores/ui-store'
import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Plus } from 'lucide-react'
import { getEffectiveShortcut, formatShortcutKeys } from '../../config/shortcuts'

export default function TabBar() {
  const tabs = useEditorStore((s) => s.tabs)
  const activeTabId = useEditorStore((s) => s.activeTabId)
  const setActiveTab = useEditorStore((s) => s.setActiveTab)
  const closeTab = useEditorStore((s) => s.closeTab)
  const closeAllTabs = useEditorStore((s) => s.closeAllTabs)
  const closeOtherTabs = useEditorStore((s) => s.closeOtherTabs)
  const pendingCloseTabId = useEditorStore((s) => s.pendingCloseTabId)
  const setPendingCloseTabId = useEditorStore((s) => s.setPendingCloseTabId)
  const saveNote = useEditorStore((s) => s.saveNote)
  const addToast = useUiStore((s) => s.addToast)

  const [contextMenu, setContextMenu] = useState<{ tabId: string; x: number; y: number } | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return
    const handleClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    const handleScroll = () => setContextMenu(null)
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('scroll', handleScroll, true)
    }
  }, [contextMenu])

  const handleContextMenu = (tabId: string, e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ tabId, x: e.clientX, y: e.clientY })
  }

  const handleClose = useCallback((tabId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    closeTab(tabId)
  }, [closeTab])

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

  const handleCreateNote = () => {
    const vaultStore = useVaultStore.getState()
    vaultStore.refreshFiles()
  }

  const newNoteShortcut = getEffectiveShortcut('new-note')
  const newNoteHint = newNoteShortcut ? ` (${formatShortcutKeys(newNoteShortcut)})` : ''

  return (
    <>
      <div className="flex border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="flex flex-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`group relative flex items-center gap-1.5 border-r border-[var(--color-border)] px-3 py-1.5 text-sm transition-colors ${
                tab.id === activeTabId
                  ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
              title={tab.notePath}
              onClick={() => setActiveTab(tab.id)}
              onContextMenu={(e) => handleContextMenu(tab.id, e)}
            >
              {tab.isDirty && (
                <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
              )}
              <span className="truncate max-w-40">{tab.title}</span>
              <span
                className="ml-1 rounded p-0.5 opacity-0 hover:bg-[var(--color-bg-tertiary)] group-hover:opacity-100"
                onClick={(e) => handleClose(tab.id, e)}
              >
                <X className="h-3 w-3" />
              </span>
            </button>
          ))}
        </div>
        {/* New note button */}
        <button
          className="flex items-center border-l border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)]"
          onClick={handleCreateNote}
          title={`New note${newNoteHint}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Tab context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 w-40 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] py-1 shadow-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="flex w-full items-center px-3 py-1.5 text-left text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
            onClick={() => {
              handleClose(contextMenu.tabId, { stopPropagation: () => {} } as React.MouseEvent)
              setContextMenu(null)
            }}
          >
            Close
          </button>
          <button
            className="flex w-full items-center px-3 py-1.5 text-left text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
            onClick={() => {
              closeOtherTabs(contextMenu.tabId)
              setContextMenu(null)
            }}
          >
            Close Others
          </button>
          <button
            className="flex w-full items-center px-3 py-1.5 text-left text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
            onClick={() => {
              closeAllTabs()
              setContextMenu(null)
            }}
          >
            Close All
          </button>
        </div>
      )}

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

