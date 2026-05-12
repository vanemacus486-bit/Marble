import { useEffect, useCallback, useRef } from 'react'
import { useEditorStore } from '../stores/editor-store'
import { useNavigationStore } from '../stores/navigation-store'

export function useNote(notePath: string | null) {
  const store = useEditorStore()
  const { pushHistory } = useNavigationStore()
  const loadedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!notePath || loadedRef.current === notePath) return
    loadedRef.current = notePath
    store.openNote(notePath)
    pushHistory(notePath)
  }, [notePath, store, pushHistory])

  const activeTab = store.activeTab()
  const tab = notePath ? store.tabs.find((t) => t.notePath === notePath) : undefined

  const setContent = useCallback(
    (content: string) => {
      if (tab) store.setContent(tab.id, content)
    },
    [tab, store]
  )

  const save = useCallback(async () => {
    if (tab) await store.saveNote(tab.id)
  }, [tab, store])

  return {
    content: activeTab?.content ?? null,
    isLoading: !tab,
    isDirty: tab?.isDirty ?? false,
    editMode: tab?.editMode ?? 'source',
    setContent,
    save,
    setEditMode: tab ? (mode: 'source' | 'wysiwyg' | 'read') => store.setEditMode(tab.id, mode) : undefined,
    toggleEditMode: tab ? () => store.toggleEditMode(tab.id) : undefined,
  }
}
