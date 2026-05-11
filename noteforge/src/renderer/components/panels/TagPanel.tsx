import { useMemo, useState } from 'react'
import { useVaultStore } from '../../stores/vault-store'
import { useSearchStore } from '../../stores/search-store'

interface TagEntry {
  name: string
  count: number
  children: TagEntry[]
}

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
        tagMap.set(accumulated, entry)
        currentLevel.push(entry)
      }
      const entry = tagMap.get(accumulated)!
      entry.count += count
      currentLevel = entry.children
    }
  }

  return tree
}

interface TagRowProps {
  entry: TagEntry
  depth: number
  onTagClick: (tag: string) => void
}

function TagRow({ entry, depth, onTagClick }: TagRowProps) {
  const [expanded, setExpanded] = useState(depth < 1)
  const hasChildren = entry.children.length > 0

  const fullTag = useMemo(() => {
    // Reconstruct full tag path by traversing up
    return entry.name
  }, [entry.name])

  return (
    <div>
      <div
        className="flex cursor-pointer items-center gap-1 px-3 py-1 text-sm transition-colors hover:bg-[var(--color-bg-tertiary)]"
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {hasChildren && (
          <button
            className="flex-shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
          >
            <svg
              className={`h-3 w-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {!hasChildren && <div className="w-3 flex-shrink-0" />}
        <button
          className="flex-1 truncate text-left text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]"
          onClick={() => onTagClick(fullTag)}
        >
          <span className="text-[var(--color-accent)]">#</span>
          {entry.name}
        </button>
        <span className="flex-shrink-0 text-xs text-[var(--color-text-muted)]">{entry.count}</span>
      </div>
      {hasChildren && expanded && (
        <div>
          {entry.children.map((child) => (
            <TagRow key={child.name} entry={child} depth={depth + 1} onTagClick={onTagClick} />
          ))}
        </div>
      )}
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
      for (const tag of note.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
      }
    }
    return buildTagTree(tagCounts)
  }, [notes])

  const handleTagClick = (tag: string) => {
    setOpen(true)
    setQuery(`tag:${tag}`)
  }

  if (tagTree.length === 0) {
    return (
      <div className="p-3 text-center text-sm text-[var(--color-text-muted)]">
        No tags
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="border-b border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)]">
        Tags
      </div>
      <div className="py-1">
        {tagTree.map((entry) => (
          <TagRow key={entry.name} entry={entry} depth={0} onTagClick={handleTagClick} />
        ))}
      </div>
    </div>
  )
}
