import { useCallback } from 'react'
import { useEditorStore } from '../stores/editor-store'
import { useNavigationStore } from '../stores/navigation-store'

export function useTabNavigation() {
  const store = useEditorStore()
  const { pushHistory, goBack, goForward } = useNavigationStore()

  const openNote = useCallback(
    async (notePath: string) => {
      await store.openNote(notePath)
      pushHistory(notePath)
    },
    [store, pushHistory]
  )

  const navigateBack = useCallback(() => {
    const path = goBack()
    if (path) store.openNote(path)
  }, [goBack, store])

  const navigateForward = useCallback(() => {
    const path = goForward()
    if (path) store.openNote(path)
  }, [goForward, store])

  return {
    tabs: store.tabs,
    activeTabId: store.activeTabId,
    openNote,
    closeTab: store.closeTab,
    closeAllTabs: store.closeAllTabs,
    closeOtherTabs: store.closeOtherTabs,
    setActiveTab: store.setActiveTab,
    reorderTabs: store.reorderTabs,
    navigateBack,
    navigateForward,
  }
}
