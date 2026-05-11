import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight } from 'lucide-react'

/* ---- Types ---- */

export type ContextMenuActionItem = {
  id: string
  label: string
  icon?: ReactNode
  shortcut?: string
  disabled?: boolean
  danger?: boolean
  onClick: () => void
  children?: ContextMenuItem[]
}

export type ContextMenuSeparator = { type: 'separator' }

export type ContextMenuItem = ContextMenuActionItem | ContextMenuSeparator

export interface ContextMenuPosition {
  x: number
  y: number
}

interface ContextMenuState {
  isOpen: boolean
  position: ContextMenuPosition
  items: ContextMenuItem[]
}

/* ---- Context ---- */

interface ContextMenuContextValue {
  showMenu: (items: ContextMenuItem[], position: ContextMenuPosition) => void
  hideMenu: () => void
  isOpen: boolean
}

const ContextMenuCtx = createContext<ContextMenuContextValue | null>(null)

export function useContextMenuContext(): ContextMenuContextValue {
  const ctx = useContext(ContextMenuCtx)
  if (!ctx) {
    throw new Error('useContextMenuContext must be used within a ContextMenuProvider')
  }
  return ctx
}

/* ---- Provider ---- */

export function ContextMenuProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ContextMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    items: [],
  })

  const showMenu = useCallback(
    (items: ContextMenuItem[], position: ContextMenuPosition) => {
      setState({ isOpen: true, position, items })
    },
    [],
  )

  const hideMenu = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  return (
    <ContextMenuCtx.Provider value={{ showMenu, hideMenu, isOpen: state.isOpen }}>
      {children}
      {state.isOpen && (
        <ContextMenuPortal
          items={state.items}
          position={state.position}
          onClose={hideMenu}
        />
      )}
    </ContextMenuCtx.Provider>
  )
}

/* ---- Portal (actual rendered menu) ---- */

function ContextMenuPortal({
  items,
  position,
  onClose,
}: {
  items: ContextMenuItem[]
  position: ContextMenuPosition
  onClose: () => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [adjustedPos, setAdjustedPos] = useState<ContextMenuPosition>(position)
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Delay so the right-click event itself doesn't trigger close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeSubmenu) {
          setActiveSubmenu(null)
        } else {
          onClose()
        }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose, activeSubmenu])

  // Smart positioning – flip when near viewport edges
  useEffect(() => {
    const el = menuRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    let { x, y } = position
    if (x + rect.width > vw) {
      x = Math.max(0, vw - rect.width - 8)
    }
    if (y + rect.height > vh) {
      y = Math.max(0, vh - rect.height - 8)
    }
    setAdjustedPos({ x, y })
  }, [position])

  // Keyboard navigation (arrow keys, Enter)
  const [focusedIndex, setFocusedIndex] = useState(0)
  const visibleIndices = items
    .map((item, i) => (isSeparator(item) ? -1 : i))
    .filter((i) => i !== -1)

  useEffect(() => {
    const handleKeyNav = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIndex((prev) => {
          const idx = visibleIndices.indexOf(prev)
          return visibleIndices[(idx + 1) % visibleIndices.length]
        })
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIndex((prev) => {
          const idx = visibleIndices.indexOf(prev)
          return visibleIndices[(idx - 1 + visibleIndices.length) % visibleIndices.length]
        })
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const item = items[focusedIndex]
        if (!isSeparator(item) && !item.disabled) {
          if (item.children?.length) {
            setActiveSubmenu(activeSubmenu === item.id ? null : item.id)
          } else {
            item.onClick()
            onClose()
          }
        }
      }
    }
    document.addEventListener('keydown', handleKeyNav)
    return () => document.removeEventListener('keydown', handleKeyNav)
  }, [items, focusedIndex, visibleIndices, onClose, activeSubmenu])

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[180px] rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] py-1 shadow-lg"
      style={{ left: adjustedPos.x, top: adjustedPos.y }}
      role="menu"
    >
      {items.map((item, index) => {
        if (isSeparator(item)) {
          return (
            <div
              key={`sep-${index}`}
              className="my-1 border-t border-[var(--color-border)]"
              role="separator"
            />
          )
        }
        return (
          <ContextMenuItemRow
            key={item.id}
            item={item}
            index={index}
            isFocused={focusedIndex === index}
            onHover={() => setFocusedIndex(index)}
            onClose={onClose}
            activeSubmenu={activeSubmenu}
            setActiveSubmenu={setActiveSubmenu}
          />
        )
      })}
    </div>,
    document.body,
  )
}

/* ---- Menu Item Row ---- */

function ContextMenuItemRow({
  item,
  index,
  isFocused,
  onHover,
  onClose,
  activeSubmenu,
  setActiveSubmenu,
}: {
  item: ContextMenuActionItem
  index: number
  isFocused: boolean
  onHover: () => void
  onClose: () => void
  activeSubmenu: string | null
  setActiveSubmenu: (id: string | null) => void
}) {
  const hasSubmenu = item.children && item.children.length > 0
  const isSubmenuOpen = activeSubmenu === item.id

  return (
    <div className="relative">
      <button
        className={`flex w-full items-center gap-3 px-3 py-1.5 text-left text-sm transition-colors ${
          item.danger
            ? 'text-[var(--color-danger)]'
            : 'text-[var(--color-text-primary)]'
        } ${
          item.disabled
            ? 'cursor-default opacity-50'
            : isFocused
              ? 'bg-[var(--color-bg-tertiary)]'
              : 'hover:bg-[var(--color-bg-tertiary)]'
        }`}
        disabled={item.disabled}
        role="menuitem"
        onClick={() => {
          if (item.disabled) return
          if (hasSubmenu) {
            setActiveSubmenu(isSubmenuOpen ? null : item.id)
          } else {
            item.onClick()
            onClose()
          }
        }}
        onMouseEnter={() => {
          onHover()
          if (hasSubmenu) {
            setActiveSubmenu(item.id)
          }
        }}
      >
        <span className="flex h-4 w-4 items-center justify-center">{item.icon}</span>

        <span className="flex-1 truncate">{item.label}</span>

        {item.shortcut && (
          <span className="ml-4 text-xs text-[var(--color-text-muted)]">{item.shortcut}</span>
        )}

        {hasSubmenu && <ChevronRight className="ml-1 h-3 w-3 text-[var(--color-text-muted)]" />}
      </button>

      {/* Submenu */}
      {hasSubmenu && isSubmenuOpen && (
        <div
          className="absolute left-full top-0 z-[101] min-w-[160px] rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] py-1 shadow-lg"
          style={{ marginLeft: 2 }}
          role="menu"
        >
          {item.children!.map((child, ci) => {
            if (isSeparator(child)) {
              return (
                <div
                  key={`sub-sep-${ci}`}
                  className="my-1 border-t border-[var(--color-border)]"
                  role="separator"
                />
              )
            }
            return (
              <button
                key={child.id}
                className={`flex w-full items-center gap-3 px-3 py-1.5 text-left text-sm transition-colors ${
                  child.danger
                    ? 'text-[var(--color-danger)]'
                    : 'text-[var(--color-text-primary)]'
                } ${
                  child.disabled
                    ? 'cursor-default opacity-50'
                    : 'hover:bg-[var(--color-bg-tertiary)]'
                }`}
                disabled={child.disabled}
                role="menuitem"
                onClick={() => {
                  if (child.disabled) return
                  child.onClick()
                  onClose()
                }}
              >
                <span className="flex h-4 w-4 items-center justify-center">{child.icon}</span>
                <span className="flex-1 truncate">{child.label}</span>
                {child.shortcut && (
                  <span className="ml-4 text-xs text-[var(--color-text-muted)]">{child.shortcut}</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ---- Helpers ---- */

export function isSeparator(item: ContextMenuItem): item is ContextMenuSeparator {
  return 'type' in item && item.type === 'separator'
}
