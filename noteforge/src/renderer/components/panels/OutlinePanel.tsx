import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '../../stores/editor-store'

interface HeadingEntry { level: number; text: string; id: string }

const HEADING_REGEX = /<h([1-6])(?:\s+id="([^"]*)")?[^>]*>([\s\S]*?)<\/h[1-6]>/gi

function parseHeadings(html: string): HeadingEntry[] {
  const headings: HeadingEntry[] = []
  let match: RegExpExecArray | null
  while ((match = HEADING_REGEX.exec(html)) !== null) {
    const level = parseInt(match[1], 10)
    const id = match[2] ?? `heading-${headings.length}`
    const text = match[3]?.replace(/<[^>]*>/g, '').trim() ?? ''
    if (text) headings.push({ level, text, id })
  }
  return headings
}

export default function OutlinePanel() {
  const { t } = useTranslation()
  const activeTab = useEditorStore((s) => s.activeTab())

  const headings = useMemo(() => {
    if (!activeTab?.content) return []
    return parseHeadings(activeTab.content)
  }, [activeTab])

  if (!activeTab) {
    return <div style={{ padding: 12, textAlign: 'center', fontSize: 13, color: 'var(--m-fg-3)' }}>{t('outline.noNoteSelected')}</div>
  }
  if (headings.length === 0) {
    return <div style={{ padding: 12, textAlign: 'center', fontSize: 13, color: 'var(--m-fg-3)' }}>{t('outline.noHeadings')}</div>
  }

  const scrollToHeading = (headingId: string) => {
    const editorEl = document.querySelector('.ProseMirror')
    if (!editorEl) return
    const target = editorEl.querySelector(`#${CSS.escape(headingId)}`)
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div>
      {headings.map((h, i) => (
        <button
          key={`${h.id}-${i}`}
          onClick={() => scrollToHeading(h.id)}
          title={h.text}
          style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '3px 8px', paddingLeft: 8 + (h.level - 1) * 14,
            fontSize: 12, lineHeight: 1.6, borderRadius: 3,
            color: h.level <= 2 ? 'var(--m-fg-1)' : 'var(--m-fg-2)',
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'oklch(0.20 0.006 260)' }}
          onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
            <span style={{ color: 'var(--m-fg-3)', marginRight: 6 }}>#</span>
            {h.text}
          </span>
        </button>
      ))}
    </div>
  )
}
