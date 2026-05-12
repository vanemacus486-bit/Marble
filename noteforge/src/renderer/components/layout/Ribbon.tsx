import React from 'react'
import { Icons } from '../ui/marble-icons'

export type RibbonTab = 'files' | 'search' | 'graph' | 'comp' | 'data' | 'tags'

interface RibbonProps {
  active: RibbonTab
  onChange: (tab: RibbonTab) => void
}

const items: Array<[RibbonTab, React.ReactNode, string]> = [
  ['files',  Icons.files,  'Files'],
  ['search', Icons.search, 'Search'],
  ['graph',  Icons.graph,  'Graph'],
  ['comp',   Icons.comp,   'Components'],
  ['data',   Icons.data,   'Data'],
  ['tags',   Icons.tag,    'Tags'],
]

export default function Ribbon({ active, onChange }: RibbonProps) {
  return (
    <div style={{
      width: 44, flex: '0 0 44px',
      background: 'var(--m-bg-inset)',
      borderRight: '1px solid var(--m-line-soft)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', paddingTop: 8, gap: 2,
    }}>
      {items.map(([key, icon, label]) => (
        <button key={key}
          onClick={() => onChange(key)}
          title={label}
          style={{
            width: 30, height: 30, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: active === key ? 'var(--m-vein)' : 'var(--m-fg-3)',
            background: active === key ? 'var(--m-bg-2)' : 'transparent',
            position: 'relative',
          }}
          onMouseOver={e => { if (active !== key) e.currentTarget.style.color = 'var(--m-fg-1)' }}
          onMouseOut={e => { if (active !== key) e.currentTarget.style.color = 'var(--m-fg-3)' }}
        >
          {icon}
          {active === key && (
            <span style={{
              position: 'absolute', left: -1, top: 6, bottom: 6, width: 2,
              background: 'var(--m-vein)', borderRadius: 2,
            }}/>
          )}
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <button title="Settings" style={{
        width: 30, height: 30, borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--m-fg-3)', marginBottom: 8,
      }}
      onClick={() => window.dispatchEvent(new CustomEvent('marble:open-settings'))}
      onMouseOver={e => { e.currentTarget.style.color = 'var(--m-fg-1)' }}
      onMouseOut={e => { e.currentTarget.style.color = 'var(--m-fg-3)' }}
      >
        {Icons.settings}
      </button>
    </div>
  )
}
