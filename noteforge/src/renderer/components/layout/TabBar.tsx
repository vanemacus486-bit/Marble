import { useEditorStore } from '../../stores/editor-store'
import { useUiStore } from '../../stores/ui-store'
import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Plus } from 'lucide-react'

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

  return (
    <>
      <div style={{
        display: 'flex',
        height: 30,
        background: 'var(--m-bg)',
        borderBottom: '1px solid var(--m-line-soft)',
      }}>
        <div style={{ display: 'flex', flex: 1, overflowX: 'auto' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                height: 30, padding: '0 10px', minWidth: 0, maxWidth: 220,
                fontSize: 12, cursor: 'pointer',
                background: tab.id === activeTabId ? 'var(--m-bg-1)' : 'transparent',
                color: tab.id === activeTabId ? 'var(--m-fg)' : 'var(--m-fg-2)',
                borderRight: '1px solid var(--m-line-soft)',
                borderTop: tab.id === activeTabId ? '1px solid var(--m-vein-dim)' : '1px solid transparent',
              }}
              title={tab.notePath}
              onClick={() => setActiveTab(tab.id)}
              onContextMenu={(e) => handleContextMenu(tab.id, e)}
            >
              {tab.isDirty && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--m-vein)', flex: '0 0 6px',
                }} />
              )}
              <span style={{
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                fontFamily: tab.notePath.endsWith('.html') ? 'var(--f-mono)' : undefined,
                fontSize: tab.notePath.endsWith('.html') ? '11.5px' : 12,
              }}>
                {tab.title}
              </span>
              <span
                style={{
                  marginLeft: 2, borderRadius: 3, padding: 2,
                  opacity: 0, color: 'var(--m-fg-3)',
                }}
                className="tab-close-btn"
                onClick={(e) => handleClose(tab.id, e)}
              >
                <X size={12} />
              </span>
            </button>
          ))}
        </div>
        <button
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, color: 'var(--m-fg-3)',
            borderLeft: '1px solid var(--m-line-soft)',
          }}
          onClick={() => {}}
          title="New note"
        >
          <Plus size={14} />
        </button>
      </div>

      <style>{`
        .tab-close-btn:hover { background: var(--m-bg-2); color: var(--m-fg-1); }
        button:hover .tab-close-btn { opacity: 1; }
      `}</style>

      {/* Tab context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{
            position: 'fixed', zIndex: 50, width: 160,
            left: contextMenu.x, top: contextMenu.y,
            borderRadius: 8, background: 'var(--m-bg-1)',
            border: '1px solid var(--m-line)',
            boxShadow: '0 8px 28px rgba(0,0,0,.4)',
            padding: 4,
          }}
        >
          {[
            ['Close', () => { handleClose(contextMenu.tabId, { stopPropagation: () => {} } as React.MouseEvent); setContextMenu(null) }],
            ['Close Others', () => { closeOtherTabs(contextMenu.tabId); setContextMenu(null) }],
            ['Close All', () => { closeAllTabs(); setContextMenu(null) }],
          ].map(([label, action]) => (
            <button
              key={label as string}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '7px 10px', borderRadius: 5,
                background: 'transparent', color: 'var(--m-fg-1)',
                fontSize: 13, fontWeight: 500,
              }}
              onClick={action as () => void}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--m-bg-2)' }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}
            >
              {label as string}
            </button>
          ))}
        </div>
      )}

      {/* Unsaved changes dialog */}
      {pendingCloseTabId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,.5)',
        }}>
          <div style={{
            width: 384, borderRadius: 10,
            background: 'var(--m-bg-1)', boxShadow: '0 20px 60px rgba(0,0,0,.5)',
            padding: 24,
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--m-fg)' }}>Unsaved changes</h3>
            <p style={{ marginTop: 8, fontSize: 13, color: 'var(--m-fg-2)' }}>
              You have unsaved changes. Save before closing?
            </p>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                style={{
                  borderRadius: 6, padding: '6px 14px', fontSize: 13,
                  color: 'var(--m-fg-2)',
                }}
                onClick={handleCancelClose}
              >
                Cancel
              </button>
              <button
                style={{
                  borderRadius: 6, padding: '6px 14px', fontSize: 13,
                  background: 'var(--c-red)', color: '#fff',
                }}
                onClick={() => handleDiscardAndClose(pendingCloseTabId!)}
              >
                Discard
              </button>
              <button
                style={{
                  borderRadius: 6, padding: '6px 14px', fontSize: 13,
                  background: 'var(--m-vein)', color: '#000',
                }}
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
