import React from 'react'

interface TreeRowProps {
  depth?: number
  icon: React.ReactNode
  name: string
  ext?: string
  active?: boolean
  badge?: string | number
  dim?: boolean
  color?: string
  onClick?: () => void
}

export default function TreeRow({ depth = 0, icon, name, ext, active, badge, dim, color, onClick }: TreeRowProps) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '2px 8px 2px 0',
      paddingLeft: 8 + depth * 12,
      height: 22, borderRadius: 4, cursor: 'pointer',
      background: active ? 'var(--m-bg-2)' : 'transparent',
      color: active ? 'var(--m-fg)' : (dim ? 'var(--m-fg-3)' : 'var(--m-fg-1)'),
      fontSize: '12.5px',
      position: 'relative',
    }}
    onMouseOver={e => { if (!active) e.currentTarget.style.background = 'oklch(0.20 0.006 260)' }}
    onMouseOut={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      {active && <span style={{ position: 'absolute', left: 0, top: 3, bottom: 3, width: 2, background: 'var(--m-vein)', borderRadius: 2 }}/>}
      <span style={{ color: color || 'var(--m-fg-3)', flex: '0 0 auto', display: 'flex' }}>{icon}</span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}{ext && <span style={{ color: 'var(--m-fg-3)' }}>{ext}</span>}</span>
      {badge && <span style={{ fontSize: 10, color: 'var(--m-fg-3)', fontFamily: 'var(--f-mono)' }}>{badge}</span>}
    </div>
  )
}
