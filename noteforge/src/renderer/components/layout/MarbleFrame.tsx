import React from 'react'
import { Icons } from '../ui/marble-icons'

interface MarbleFrameProps {
  title?: string
  subtitle?: string
  right?: React.ReactNode
  children: React.ReactNode
}

function dotStyle(c: string) {
  return { width: 11, height: 11, borderRadius: '50%', background: c, display: 'inline-block' }
}

export default function MarbleFrame({ title, subtitle, right, children }: MarbleFrameProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%',
      background: 'var(--m-bg)',
    }}>
      {/* Title bar */}
      <div style={{
        display: 'flex', alignItems: 'center',
        height: 36, padding: '0 12px',
        background: 'var(--m-bg)',
        borderBottom: '1px solid var(--m-line-soft)',
        gap: 12, flex: '0 0 auto',
        WebkitAppRegion: 'drag' as any,
      }}>
        {/* Traffic lights */}
        <div style={{ display: 'flex', gap: 6, WebkitAppRegion: 'no-drag' as any }}>
          <span style={dotStyle('#ef5f56')} />
          <span style={dotStyle('#f4be4f')} />
          <span style={dotStyle('#5dca54')} />
        </div>
        {/* Nav buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8, color: 'var(--m-fg-2)' }}>
          {Icons.chevron && React.cloneElement(Icons.chevron as React.ReactElement<{style?: React.CSSProperties}>, { style: { transform: 'rotate(180deg)' } })}
          {Icons.chevron}
        </div>
        {/* Center title */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, color: 'var(--m-fg-1)' }}>
          <div className="marble-mark"></div>
          <div style={{ fontSize: '12.5px', fontWeight: 500 }}>{title || 'Marble'}</div>
          {subtitle && <div style={{ fontSize: 12, color: 'var(--m-fg-3)' }}>— {subtitle}</div>}
        </div>
        {/* Right toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--m-fg-2)' }}>
          {right}
        </div>
      </div>
      {/* Content area */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {children}
      </div>
    </div>
  )
}
