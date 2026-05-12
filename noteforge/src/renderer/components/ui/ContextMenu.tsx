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

  // Smart positioning
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

  // Keyboard navigation
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
      role="menu"
      style={{
        position: 'fixed',
        zIndex: 100,
        minWidth: 180,
        borderRadius: 6,
        border: '1px solid var(--m-line)',
        background: 'var(--m-bg-1)',
        padding: '4px 0',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        left: adjustedPos.x,
        top: adjustedPos.y,
      }}
    >
      {items.map((item, index) => {
        if (isSeparator(item)) {
          return (
            <div
              key={`sep-${index}`}
              role="separator"
              style={{
                margin: '3px 0',
                borderTop: '1px solid var(--m-line-soft)',
              }}
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
    <div style={{ position: 'relative' }}>
      <button
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
        style={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          gap: 8,
          padding: '5px 12px',
          fontSize: 12.5,
          textAlign: 'left',
          border: 0,
          cursor: item.disabled ? 'default' : 'pointer',
          opacity: item.disabled ? 0.4 : 1,
          color: item.danger ? 'var(--c-red)' : 'var(--m-fg)',
          background: isFocused && !item.disabled ? 'var(--m-bg-2)' : 'transparent',
        }}
      >
        <span style={{ display: 'flex', width: 16, height: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {item.icon}
        </span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.label}
        </span>
        {item.shortcut && (
          <span className="m-kbd" style={{ marginLeft: 8 }}>
            {item.shortcut}
          </span>
        )}
        {hasSubmenu && (
          <ChevronRight style={{ width: 12, height: 12, color: 'var(--m-fg-3)', flexShrink: 0 }} />
        )}
      </button>

      {/* Submenu */}
      {hasSubmenu && isSubmenuOpen && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            left: '100%',
            top: 0,
            zIndex: 101,
            minWidth: 160,
            borderRadius: 6,
            border: '1px solid var(--m-line)',
            background: 'var(--m-bg-1)',
            padding: '4px 0',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            marginLeft: 2,
          }}
        >
          {item.children!.map((child, ci) => {
            if (isSeparator(child)) {
              return (
                <div
                  key={`sub-sep-${ci}`}
                  role="separator"
                  style={{
                    margin: '3px 0',
                    borderTop: '1px solid var(--m-line-soft)',
                  }}
                />
              )
            }
            return (
              <button
                key={child.id}
                disabled={child.disabled}
                role="menuitem"
                onClick={() => {
                  if (child.disabled) return
                  child.onClick()
                  onClose()
                }}
                style={{
                  display: 'flex',
                  width: '100%',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 12px',
                  fontSize: 12.5,
                  textAlign: 'left',
                  border: 0,
                  cursor: child.disabled ? 'default' : 'pointer',
                  opacity: child.disabled ? 0.4 : 1,
                  color: child.danger ? 'var(--c-red)' : 'var(--m-fg)',
                  background: 'transparent',
                }}
              >
                <span style={{ display: 'flex', width: 16, height: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {child.icon}
                </span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {child.label}
                </span>
                {child.shortcut && (
                  <span className="m-kbd" style={{ marginLeft: 8 }}>
                    {child.shortcut}
                  </span>
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
