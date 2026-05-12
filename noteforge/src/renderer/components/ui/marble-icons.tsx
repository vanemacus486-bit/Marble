import React from 'react'

interface IconProps {
  size?: number
  stroke?: number
  fill?: string
  style?: React.CSSProperties
}

function Icon({ d, size = 14, stroke = 1.6, fill = 'none', style }: IconProps & { d: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={style}>{d}</svg>
  )
}

export const Icons = {
  files:   <Icon d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></>} />,
  search:  <Icon d={<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>} />,
  graph:   <Icon d={<><circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="M8 17 16 7"/><path d="M18 8.4v7.2"/></>} />,
  comp:    <Icon d={<><path d="M12 3 4 7v10l8 4 8-4V7z"/><path d="M4 7l8 4 8-4"/><path d="M12 11v10"/></>} />,
  data:    <Icon d={<><ellipse cx="12" cy="5" rx="8" ry="2.5"/><path d="M4 5v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V5"/><path d="M4 11v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-6"/></>} />,
  tag:     <Icon d={<><path d="M20 12 12 20l-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.2" fill="currentColor"/></>} />,
  settings:<Icon d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>} />,
  chevron: <Icon d={<path d="m9 18 6-6-6-6"/>} />,
  chevronDown: <Icon d={<path d="m6 9 6 6 6-6"/>} />,
  folder:  <Icon d={<path d="M3 7v12a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-9l-2-2H4a1 1 0 0 0-1 1z"/>} />,
  file:    <Icon d={<><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></>} />,
  html:    <Icon d={<><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 15v-3M16 15v-3M10 13.5h4M7 18h10" strokeWidth="1.2"/></>} />,
  plus:    <Icon d={<><path d="M12 5v14"/><path d="M5 12h14"/></>} />,
  close:   <Icon d={<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>} />,
  code:    <Icon d={<><path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/></>} />,
  eye:     <Icon d={<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>} />,
  link:    <Icon d={<><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 1 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 1 0 7 7l1-1"/></>} />,
  bolt:    <Icon d={<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>} />,
  ai:      <Icon d={<><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/><circle cx="12" cy="12" r="3"/></>} />,
  hash:    <Icon d={<><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></>} />,
  pin:     <Icon d={<><path d="M12 2v7l4 4-2 2h-4l-2-2 4-4V2z"/><path d="M12 15v7"/></>} />,
}
