import { useMemo } from 'react'
import { useEditorStore } from '../../stores/editor-store'
import { useVaultStore } from '../../stores/vault-store'
import type { Link } from '../../types'

export default function BacklinksPanel() {
  const activeTab = useEditorStore((s) => s.activeTab())
  const notes = useVaultStore((s) => s.notes)
  const getBacklinks = useVaultStore((s) => s.getBacklinks)
  const openNote = useEditorStore((s) => s.openNote)

  const notePath = activeTab?.notePath ?? null

  const backlinks: Link[] = useMemo(() => {
    if (!notePath) return []
    return getBacklinks(notePath)
  }, [notePath, getBacklinks])

  // Unlinked mentions: notes that contain the current note's title but aren't linked
  const unlinkedMentions = useMemo(() => {
    if (!notePath || !activeTab) return []
    const title = activeTab.title.toLowerCase()
    const currentId = notePath

    return Array.from(notes.values())
      .filter((note) => {
        if (note.id === currentId) return false
        const isBacklinked = backlinks.some((bl) => bl.source === note.id)
        if (isBacklinked) return false
        return note.title.toLowerCase().includes(title) || note.id.toLowerCase().includes(title)
      })
      .slice(0, 20)
  }, [notePath, activeTab, notes, backlinks])

  if (!notePath) {
    return (
      <div className="p-3 text-center text-sm text-[var(--color-text-muted)]">
        No note selected
      </div>
    )
  }

  if (backlinks.length === 0 && unlinkedMentions.length === 0) {
    return (
      <div className="p-3 text-center text-sm text-[var(--color-text-muted)]">
        No backlinks
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Backlinks count */}
      <div className="border-b border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)]">
        Backlinks ({backlinks.length})
      </div>

      {backlinks.length > 0 && (
        <div className="py-1">
          {backlinks.map((link) => {
            const sourceNote = notes.get(link.source)
            return (
              <button
                key={`${link.source}-${link.target}`}
                className="w-full px-3 py-1.5 text-left transition-colors hover:bg-[var(--color-bg-tertiary)]"
                onClick={() => openNote(link.source)}
              >
                <div className="text-sm font-medium text-[var(--color-text-primary)]">
                  {sourceNote?.title ?? link.source}
                </div>
                {link.context && (
                  <div className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-muted)] line-clamp-2">
                    {link.context}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Unlinked mentions */}
      {unlinkedMentions.length > 0 && (
        <>
          <div className="border-b border-t border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)]">
            Unlinked Mentions ({unlinkedMentions.length})
          </div>
          <div className="py-1">
            {unlinkedMentions.map((note) => (
              <button
                key={note.id}
                className="w-full px-3 py-1.5 text-left transition-colors hover:bg-[var(--color-bg-tertiary)]"
                onClick={() => openNote(note.id)}
              >
                <div className="text-sm text-[var(--color-text-primary)]">{note.title}</div>
                <div className="mt-0.5 text-xs text-[var(--color-text-muted)] truncate">
                  {note.id}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
