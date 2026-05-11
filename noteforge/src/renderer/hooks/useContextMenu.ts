import { useCallback } from 'react'
import { useContextMenuContext } from '../components/ui/ContextMenu'
import type { ContextMenuItem, ContextMenuPosition } from '../components/ui/ContextMenu'

export function useContextMenu() {
  const { showMenu, hideMenu, isOpen } = useContextMenuContext()

  const contextMenuProps = {
    onContextMenu: useCallback(
      (e: React.MouseEvent, items: ContextMenuItem[]) => {
        e.preventDefault()
        e.stopPropagation()
        showMenu(items, { x: e.clientX, y: e.clientY })
      },
      [showMenu],
    ),
  }

  return {
    contextMenuProps,
    showMenu: (items: ContextMenuItem[], position: ContextMenuPosition) =>
      showMenu(items, position),
    hideMenu: hideMenu,
    isOpen,
  }
}
