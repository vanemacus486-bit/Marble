import { useState, useCallback } from 'react'
import { useEditorStore } from '../stores/editor-store'

export function useSplitPane(paneId: string) {
  const store = useEditorStore()
  const pane = store.splitPanes.find((p) => p.id === paneId)
  const [isDragging, setIsDragging] = useState(false)

  const resize = useCallback(
    (sizes: number[]) => {
      store.resizeSplit(paneId, sizes)
    },
    [store, paneId]
  )

  const close = useCallback(() => {
    store.closeSplit(paneId)
  }, [store, paneId])

  return {
    pane,
    isDragging,
    setIsDragging,
    resize,
    close,
  }
}
