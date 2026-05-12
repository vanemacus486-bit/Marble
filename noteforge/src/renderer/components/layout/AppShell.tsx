import { useVault } from '../../hooks/useVault'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { useFileWatcher } from '../../hooks/useFileWatcher'
import { useTheme } from '../../hooks/useTheme'
import { useUiStore } from '../../stores/ui-store'
import { useEditorStore } from '../../stores/editor-store'
import { useVaultStore } from '../../stores/vault-store'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight, Eye, Pencil, Code2 } from 'lucide-react'
import MarbleFrame from './MarbleFrame'
import Ribbon from './Ribbon'
import TabBar from './TabBar'
import StatusBar from './StatusBar'
import WelcomeScreen from './WelcomeScreen'
import LoadingScreen from './LoadingScreen'
import QuickSwitcher from '../navigation/QuickSwitcher'
import CommandPalette from '../navigation/CommandPalette'
import SettingsDialog from '../dialogs/SettingsDialog'
import EditorWrapper from '../editor/EditorWrapper'
import EditorToolbar from '../editor/EditorToolbar'
import SourceEditor from '../editor/SourceEditor'
import ReadOnlyView from '../editor/ReadOnlyView'
import LinkAutocomplete from '../editor/LinkAutocomplete'
import FindReplace from '../editor/FindReplace'
import TableMenu from '../editor/TableMenu'
import ImageUploader from '../editor/ImageUploader'
import FileExplorer from '../vault/FileExplorer'
import SearchBar from '../search/SearchBar'
import TagPanel from '../panels/TagPanel'
import BacklinksPanel from '../panels/BacklinksPanel'
import OutlinePanel from '../panels/OutlinePanel'
import PropertiesPanel from '../panels/PropertiesPanel'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { ContextMenuProvider } from '../ui/ContextMenu'
import type { EditMode } from '../../stores/editor-store'
import type { LeftSidebarTab } from '../../stores/ui-store'

export default function AppShell() {
  const { isLoaded, isLoading } = useVault()
  useKeyboardShortcuts()
  useFileWatcher()
  useTheme()
  const { t } = useTranslation()

  const activeTab = useEditorStore((s) => s.tabs.find((t) => t.id === s.activeTabId))
  const findReplaceVisible = useEditorStore((s) => s.findReplaceVisible)
  const leftSidebarOpen = useUiStore((s) => s.leftSidebarOpen)
  const leftSidebarTab = useUiStore((s) => s.leftSidebarTab)
  const setLeftSidebarTab = useUiStore((s) => s.setLeftSidebarTab)
  const rightSidebarOpen = useUiStore((s) => s.rightSidebarOpen)
  const rightSidebarWidth = useUiStore((s) => s.rightSidebarWidth)
  const quickSwitcherOpen = useUiStore((s) => s.quickSwitcherOpen)
  const commandPaletteOpen = useUiStore((s) => s.commandPaletteOpen)
  const settingsOpen = useUiStore((s) => s.settingsOpen)
  const toasts = useUiStore((s) => s.toasts)
  const removeToast = useUiStore((s) => s.removeToast)
  const vaultName = useVaultStore((s) => s.vaultName)

  const [editor, setEditor] = useState<any>(null)
  const toggleEditMode = useEditorStore((s) => s.toggleEditMode)
  const enableWysiwyg = useVaultStore((s) => s.config?.editor?.enableWysiwyg) ?? false
  const [rightSections, setRightSections] = useState<Record<string, boolean>>({
    backlinks: true,
    outline: true,
    properties: false,
  })

  // Listen for settings open from ribbon
  useEffect(() => {
    const handler = () => useUiStore.getState().setSettingsOpen(true)
    window.addEventListener('marble:open-settings', handler)
    return () => window.removeEventListener('marble:open-settings', handler)
  }, [])

  const modeOrder: EditMode[] = useMemo(
    () => (enableWysiwyg ? ['source', 'wysiwyg', 'read'] : ['source', 'read']),
    [enableWysiwyg],
  )

  const modeIcons: Record<EditMode, typeof Eye> = {
    source: Code2,
    wysiwyg: Pencil,
    read: Eye,
  }
  const modeLabels: Record<EditMode, string> = {
    source: 'Source',
    wysiwyg: 'Edit',
    read: 'Read',
  }

  const getNextMode = (current: EditMode): EditMode => {
    const idx = modeOrder.indexOf(current)
    return modeOrder[(idx + 1) % modeOrder.length]
  }

  const handleToggleMode = (tabId: string, current: EditMode) => {
    toggleEditMode(tabId, enableWysiwyg)
  }

  const toggleSection = (id: string) => {
    setRightSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const rightSidebarSections = [
    { id: 'backlinks', label: t('appshell.backlinks'), Panel: BacklinksPanel },
    { id: 'outline', label: t('appshell.outline'), Panel: OutlinePanel },
    { id: 'properties', label: t('appshell.properties'), Panel: PropertiesPanel },
  ]

  const handleEditorReady = useCallback((editorInstance: any) => {
    setEditor(editorInstance)
  }, [])

  if (isLoading) return <LoadingScreen />
  if (!isLoaded) return <WelcomeScreen />

  const currentMode = activeTab?.editMode ?? 'source'
  const NextModeIcon = modeIcons[getNextMode(currentMode)]
  const nextModeLabel = modeLabels[getNextMode(currentMode)]

  const renderSidebarPanel = () => {
    if (!leftSidebarOpen) return null
    return (
      <div style={{
        width: 244, flex: '0 0 244px',
        background: 'var(--m-bg-1)',
        borderRight: '1px solid var(--m-line-soft)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {leftSidebarTab === 'files' && <FileExplorer />}
        {leftSidebarTab === 'search' && <SearchBar />}
        {leftSidebarTab === 'tags' && <TagPanel />}
        {leftSidebarTab === 'graph' && (
          <div className="flex items-center justify-center h-full text-sm text-[var(--m-fg-3)]">
            Graph controls here
          </div>
        )}
        {leftSidebarTab === 'comp' && (
          <div className="flex items-center justify-center h-full text-sm text-[var(--m-fg-3)]">
            Components panel
          </div>
        )}
        {leftSidebarTab === 'data' && (
          <div className="flex items-center justify-center h-full text-sm text-[var(--m-fg-3)]">
            Data panel
          </div>
        )}
      </div>
    )
  }

  return (
    <ContextMenuProvider>
      <MarbleFrame
        title={vaultName || 'Marble'}
        subtitle={activeTab?.title}
      >
        <Ribbon active={leftSidebarTab} onChange={(tab: LeftSidebarTab) => setLeftSidebarTab(tab)} />

        {renderSidebarPanel()}

        {/* Main content area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <TabBar />
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Editor area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {activeTab ? (
                <>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {currentMode === 'wysiwyg' && (
                      <>
                        <EditorToolbar editor={editor} />
                        {findReplaceVisible && <FindReplace />}
                      </>
                    )}
                    {currentMode === 'source' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 28, fontSize: 11, color: 'var(--m-fg-3)' }}>
                        <Code2 size={14} />
                        <span>HTML</span>
                      </div>
                    )}
                    <button
                      style={{
                        position: 'absolute', right: 8, top: 4, zIndex: 10,
                        borderRadius: 4, padding: 4,
                        color: 'var(--m-fg-3)', opacity: 0.4,
                      }}
                      onClick={() => handleToggleMode(activeTab.id, currentMode)}
                      title={nextModeLabel}
                    >
                      <NextModeIcon size={16} />
                    </button>
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    {currentMode === 'source' && (
                      <SourceEditor
                        content={activeTab.content ?? ''}
                        onChange={(c) => useEditorStore.getState().setContent(activeTab.id, c)}
                      />
                    )}
                    {currentMode === 'wysiwyg' && (
                      <div style={{ height: '100%', overflowY: 'auto' }}>
                        <EditorWrapper
                          tabId={activeTab.id}
                          content={activeTab.content ?? ''}
                          editMode="wysiwyg"
                          onEditorReady={handleEditorReady}
                        />
                        <LinkAutocomplete editor={editor} />
                        <TableMenu editor={editor} />
                        <ImageUploader editor={editor} />
                      </div>
                    )}
                    {currentMode === 'read' && (
                      <ReadOnlyView content={activeTab.content ?? ''} />
                    )}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--m-fg-3)' }}>
                  <p>{t('appshell.openNote')}</p>
                </div>
              )}
            </div>

            {/* Right sidebar */}
            {rightSidebarOpen && (
              <div style={{
                width: rightSidebarWidth, flex: '0 0 ' + rightSidebarWidth + 'px',
                display: 'flex', flexDirection: 'column',
                borderLeft: '1px solid var(--m-line-soft)',
                background: 'var(--m-bg-1)',
              }}>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {rightSidebarSections.map(({ id, label, Panel }) => (
                    <div key={id} style={{ borderBottom: '1px solid var(--m-line-soft)' }}>
                      <button
                        style={{
                          display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 12px', fontSize: 11, fontWeight: 500,
                          color: 'var(--m-fg-3)',
                          background: 'none', border: 0, cursor: 'pointer',
                        }}
                        onClick={() => toggleSection(id)}
                        onMouseOver={e => { e.currentTarget.style.background = 'var(--m-bg-2)' }}
                        onMouseOut={e => { e.currentTarget.style.background = 'none' }}
                      >
                        <span>{label}</span>
                        {rightSections[id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      {rightSections[id] && (
                        <div style={{ padding: '0 8px 8px' }}>
                          <Panel />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </MarbleFrame>

      <StatusBar />

      {quickSwitcherOpen && <QuickSwitcher />}
      {commandPaletteOpen && <CommandPalette />}
      {settingsOpen && <SettingsDialog onClose={() => useUiStore.getState().setSettingsOpen(false)} />}

      {/* Toast notifications */}
      <div style={{ position: 'fixed', bottom: 48, right: 16, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto', borderRadius: 6, padding: '8px 16px', fontSize: 13,
              color: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,.4)',
              background: toast.type === 'error' ? 'var(--c-red)' :
                toast.type === 'warning' ? '#d97706' :
                toast.type === 'success' ? 'var(--c-green)' : 'var(--m-bg-2)',
            }}
            onClick={() => removeToast(toast.id)}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ContextMenuProvider>
  )
}
