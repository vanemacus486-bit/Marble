import { useMemo, useState } from 'react'
import { useVaultStore } from '../../stores/vault-store'
import { useSearchStore } from '../../stores/search-store'
import SideHead from '../layout/SideHead'

interface TagEntry { name: string; count: number; children: TagEntry[] }

function buildTagTree(tagCounts: Map<string, number>): TagEntry[] {
  const tree: TagEntry[] = []
  const tagMap = new Map<string, TagEntry>()
  const sorted = [...tagCounts.entries()].sort((a, b) => b[1] - a[1])
  for (const [name, count] of sorted) {
    const parts = name.split('/')
    let currentLevel = tree
    let accumulated = ''
    for (const part of parts) {
      accumulated = accumulated ? `${accumulated}/${part}` : part
      if (!tagMap.has(accumulated)) {
        const entry: TagEntry = { name: part, count: 0, children: [] }
        tagMap.set(accumulated, entry); currentLevel.push(entry)
      }
      const entry = tagMap.get(accumulated)!; entry.count += count
      currentLevel = entry.children
    }
  }
  return tree
}

interface TagRowProps { entry: TagEntry; depth: number; onTagClick: (tag: string) => void }

function TagRow({ entry, depth, onTagClick }: TagRowProps) {
  const [expanded, setExpanded] = useState(depth < 1)
  const hasChildren = entry.children.length > 0

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
        padding: '2px 10px', paddingLeft: 12 + depth * 16,
        height: 22, borderRadius: 4, fontSize: '12.5px',
        color: 'var(--m-fg-1)',
      }}
      onMouseOver={e => { e.currentTarget.style.background = 'oklch(0.20 0.006 260)' }}
      onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}>
        {hasChildren ? (
          <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
            style={{ color: 'var(--m-fg-3)', display: 'flex' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ transform: expanded ? 'rotate(90deg)' : '', transition: 'transform .12s' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : <div style={{ width: 12, flex: '0 0 12px' }} />}
        <button
          style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--m-fg-1)', fontSize: '12.5px' }}
          onClick={() => onTagClick(entry.name)}>
          <span style={{ color: 'var(--m-vein)' }}>#</span>{entry.name}
        </button>
        <span style={{ fontSize: 10, color: 'var(--m-fg-3)', fontFamily: 'var(--f-mono)' }}>{entry.count}</span>
      </div>
      {hasChildren && expanded && entry.children.map((child) => (
        <TagRow key={child.name} entry={child} depth={depth + 1} onTagClick={onTagClick} />
      ))}
    </div>
  )
}

export default function TagPanel() {
  const notes = useVaultStore((s) => s.notes)
  const setOpen = useSearchStore((s) => s.setOpen)
  const setQuery = useSearchStore((s) => s.setQuery)

  const tagTree = useMemo(() => {
    const tagCounts = new Map<string, number>()
    for (const note of notes.values()) {
      for (const tag of note.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
    }
    return buildTagTree(tagCounts)
  }, [notes])

  const handleTagClick = (tag: string) => { setOpen(true); setQuery(`tag:${tag}`) }

  if (tagTree.length === 0) {
    return (
      <div style={{ padding: 12, textAlign: 'center', fontSize: 13, color: 'var(--m-fg-3)' }}>No tags</div>
    )
  }

  return (
    <div>
      <SideHead>Tags</SideHead>
      {tagTree.map((entry) => (
        <TagRow key={entry.name} entry={entry} depth={0} onTagClick={handleTagClick} />
      ))}
    </div>
  )
}
