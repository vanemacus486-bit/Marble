import React from 'react'

interface SideHeadProps {
  children: React.ReactNode
  action?: React.ReactNode
}

export default function SideHead({ children, action }: SideHeadProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 10px 4px', fontSize: 10.5,
      textTransform: 'uppercase', letterSpacing: '0.08em',
      color: 'var(--m-fg-3)', fontWeight: 600,
    }}>
      <span>{children}</span>
      {action && <span style={{ color: 'var(--m-fg-3)' }}>{action}</span>}
    </div>
  )
}
