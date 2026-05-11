import { useVault } from '../../hooks/useVault'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { useFileWatcher } from '../../hooks/useFileWatcher'
import { useTheme } from '../../hooks/useTheme'
import { useUiStore } from '../../stores/ui-store'
import { useEditorStore } from '../../stores/editor-store'
import Sidebar from './Sidebar'
import TabBar from './TabBar'
import StatusBar from './StatusBar'
import WelcomeScreen from './WelcomeScreen'
import LoadingScreen from './LoadingScreen'
import QuickSwitcher from '../navigation/QuickSwitcher'
import CommandPalette from '../navigation/CommandPalette'
import SettingsDialog from '../dialogs/SettingsDialog'
import EditorWrapper from '../editor/EditorWrapper'
import EditorToolbar from '../editor/EditorToolbar'
import LinkAutocomplete from '../editor/LinkAutocomplete'
import SourceEditor from '../editor/SourceEditor'
import FindReplace from '../editor/FindReplace'
import TableMenu from '../editor/TableMenu'
import ImageUploader from '../editor/ImageUploader'
import NoteSandbox from './NoteSandbox'
import BacklinksPanel from '../panels/BacklinksPanel'
import OutlinePanel from '../panels/OutlinePanel'
import PropertiesPanel from '../panels/PropertiesPanel'
import { useState, useCallback } from 'react'

export default function AppShell() {
  const { isLoaded, isLoading } = useVault()
  useKeyboardShortcuts()
  useFileWatcher()
  useTheme()

  const activeTab = useEditorStore((s) => s.tabs.find((t) => t.id === s.activeTabId))
  const findReplaceVisible = useEditorStore((s) => s.findReplaceVisible)
  const leftSidebarOpen = useUiStore((s) => s.leftSidebarOpen)
  const rightSidebarOpen = useUiStore((s) => s.rightSidebarOpen)
  const rightSidebarTab = useUiStore((s) => s.rightSidebarTab)
  const setRightSidebarTab = useUiStore((s) => s.setRightSidebarTab)
  const quickSwitcherOpen = useUiStore((s) => s.quickSwitcherOpen)
  const commandPaletteOpen = useUiStore((s) => s.commandPaletteOpen)
  const settingsOpen = useUiStore((s) => s.settingsOpen)
  const toasts = useUiStore((s) => s.toasts)
  const removeToast = useUiStore((s) => s.removeToast)

  const [editor, setEditor] = useState<any>(null)

  const rightSidebarTabs = [
    { id: 'backlinks' as const, label: 'Backlinks' },
    { id: 'outline' as const, label: 'Outline' },
    { id: 'properties' as const, label: 'Properties' },
  ]

  if (isLoading) return <LoadingScreen />
  if (!isLoaded) return <WelcomeScreen />

  return (
    <div className="flex h-screen flex-col bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      <div className="flex flex-1 overflow-hidden">
        {leftSidebarOpen && <Sidebar />}
        <div className="flex flex-1 flex-col overflow-hidden">
          <TabBar />
          <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-1 flex-col overflow-hidden">
              {activeTab ? (
                <>
                  {activeTab.editMode !== 'preview' && <EditorToolbar editor={editor} />}
                  {findReplaceVisible && <FindReplace />}
                  <div className="flex-1 overflow-hidden">
                    {activeTab.editMode === 'source' ? (
                      <SourceEditor
                        content={activeTab.content ?? ''}
                        onChange={(c) => useEditorStore.getState().setContent(activeTab.id, c)}
                      />
                    ) : activeTab.editMode === 'preview' ? (
                      <NoteSandbox html={activeTab.content ?? ''} className="h-full overflow-y-auto" />
                    ) : (
                      <div className="h-full overflow-y-auto">
                        <EditorWrapper tabId={activeTab.id} content={activeTab.content ?? ''} editMode={activeTab.editMode} />
                        <LinkAutocomplete editor={editor} />
                        <TableMenu editor={editor} />
                        <ImageUploader editor={editor} />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-[var(--color-text-muted)]">
                  <p>Open a note to start editing</p>
                </div>
              )}
            </div>
            {rightSidebarOpen && (
              <div className="flex flex-col border-l border-[var(--color-border)] bg-[var(--color-bg-secondary)]" style={{ width: 300 }}>
                <div className="flex border-b border-[var(--color-border)]">
                  {rightSidebarTabs.map((t) => (
                    <button
                      key={t.id}
                      className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${
                        rightSidebarTab === t.id
                          ? 'border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]'
                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                      }`}
                      onClick={() => setRightSidebarTab(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto">
                  {rightSidebarTab === 'backlinks' && <BacklinksPanel />}
                  {rightSidebarTab === 'outline' && <OutlinePanel />}
                  {rightSidebarTab === 'properties' && <PropertiesPanel />}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <StatusBar />

      {quickSwitcherOpen && <QuickSwitcher />}
      {commandPaletteOpen && <CommandPalette />}
      {settingsOpen && <SettingsDialog onClose={() => useUiStore.getState().setSettingsOpen(false)} />}

      <div className="pointer-events-none fixed bottom-12 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-lg px-4 py-2 text-sm text-white shadow-lg ${
              toast.type === 'error' ? 'bg-red-600' : toast.type === 'warning' ? 'bg-yellow-600' : toast.type === 'success' ? 'bg-green-600' : 'bg-gray-700'
            }`}
            onClick={() => removeToast(toast.id)}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  )
}
