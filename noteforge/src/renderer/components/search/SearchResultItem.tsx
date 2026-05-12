import type { SearchResult } from '../../types'

interface Props { result: SearchResult; isSelected: boolean; onClick: () => void }

export default function SearchResultItem({ result, isSelected, onClick }: Props) {
  const highlightText = (text: string, maxLen = 200): string =>
    text.length > maxLen ? text.substring(0, maxLen) + '...' : text

  return (
    <button
      onClick={onClick}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        padding: '8px 12px',
        background: isSelected ? 'var(--m-bg-2)' : 'transparent',
        color: isSelected ? 'var(--m-fg)' : 'var(--m-fg-1)',
        position: 'relative',
        transition: 'background .12s',
        borderBottom: '1px solid var(--m-line-soft)',
      }}
      onMouseOver={e => { if (!isSelected) e.currentTarget.style.background = 'oklch(0.20 0.006 260)' }}
      onMouseOut={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
    >
      {isSelected && (
        <span style={{ position: 'absolute', left: 0, top: 4, bottom: 4, width: 2, background: 'var(--m-vein)', borderRadius: 2 }} />
      )}
      <div style={{ fontSize: 13, fontWeight: 500, color: isSelected ? 'var(--m-fg)' : 'var(--m-fg-1)' }}>
        {result.title}
        {result.matchType === 'title' && (
          <span style={{ marginLeft: 6, fontSize: 10, color: isSelected ? 'var(--m-fg-2)' : 'var(--m-vein)' }}>(title match)</span>
        )}
      </div>
      {result.path !== result.title && (
        <div style={{ marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11, color: 'var(--m-fg-3)' }}>
          {result.path}
        </div>
      )}
      {result.snippet && (
        <div style={{ marginTop: 4, fontSize: 11, lineHeight: 1.45, color: 'var(--m-fg-2)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {highlightText(result.snippet)}
        </div>
      )}
    </button>
  )
}
