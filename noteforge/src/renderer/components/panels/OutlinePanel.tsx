import { useMemo } from 'react'
import { useEditorStore } from '../../stores/editor-store'

interface HeadingEntry {
  level: number
  text: string
  id: string
}

const HEADING_REGEX = /<h([1-6])(?:\s+id="([^"]*)")?[^>]*>([\s\S]*?)<\/h[1-6]>/gi

function parseHeadings(html: string): HeadingEntry[] {
  const headings: HeadingEntry[] = []
  let match: RegExpExecArray | null

  while ((match = HEADING_REGEX.exec(html)) !== null) {
    const level = parseInt(match[1], 10)
    const id = match[2] ?? `heading-${headings.length}`
    const text = match[3]?.replace(/<[^>]*>/g, '').trim() ?? ''
    if (text) {
      headings.push({ level, text, id })
    }
  }

  return headings
}

export default function OutlinePanel() {
  const activeTab = useEditorStore((s) => s.activeTab())

  const headings = useMemo(() => {
    if (!activeTab?.content) return []
    return parseHeadings(activeTab.content)
  }, [activeTab])

  if (!activeTab) {
    return (
      <div className="p-3 text-center text-sm text-[var(--color-text-muted)]">
        No note selected
      </div>
    )
  }

  if (headings.length === 0) {
    return (
      <div className="p-3 text-center text-sm text-[var(--color-text-muted)]">
        No headings
      </div>
    )
  }

  const scrollToHeading = (headingId: string) => {
    const editorEl = document.querySelector('.ProseMirror')
    if (!editorEl) return
    const target = editorEl.querySelector(`#${CSS.escape(headingId)}`)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="flex flex-col">
      <div className="border-b border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)]">
        Outline ({headings.length})
      </div>
      <div className="py-1">
        {headings.map((h, i) => (
          <button
            key={`${h.id}-${i}`}
            className="w-full px-3 py-1 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)]"
            style={{ paddingLeft: `${12 + (h.level - 1) * 16}px` }}
            onClick={() => scrollToHeading(h.id)}
            title={h.text}
          >
            <span className="truncate text-[var(--color-text-secondary)]">{h.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
