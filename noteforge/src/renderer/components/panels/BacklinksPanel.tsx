import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '../../stores/editor-store'
import { useVaultStore } from '../../stores/vault-store'
import type { Link } from '../../types'

export default function BacklinksPanel() {
  const { t } = useTranslation()
  const activeTab = useEditorStore((s) => s.activeTab())
  const notes = useVaultStore((s) => s.notes)
  const getBacklinks = useVaultStore((s) => s.getBacklinks)
  const openNote = useEditorStore((s) => s.openNote)
  const notePath = activeTab?.notePath ?? null

  const backlinks: Link[] = useMemo(() => {
    if (!notePath) return []
    return getBacklinks(notePath)
  }, [notePath, getBacklinks])

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
      }).slice(0, 20)
  }, [notePath, activeTab, notes, backlinks])

  if (!notePath) {
    return <div style={{ padding: 12, textAlign: 'center', fontSize: 13, color: 'var(--m-fg-3)' }}>{t('backlinks.noNoteSelected')}</div>
  }
  if (backlinks.length === 0 && unlinkedMentions.length === 0) {
    return <div style={{ padding: 12, textAlign: 'center', fontSize: 13, color: 'var(--m-fg-3)' }}>{t('backlinks.noBacklinks')}</div>
  }

  return (
    <div>
      {backlinks.length > 0 && (
        <div>
          {backlinks.map((link) => {
            const sourceNote = notes.get(link.source)
            return (
              <button
                key={`${link.source}-${link.target}`}
                onClick={() => openNote(link.source)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '8px 10px', marginBottom: 8,
                  background: 'var(--m-bg-2)', borderRadius: 6,
                  border: '1px solid var(--m-line-soft)',
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'var(--m-bg-3)' }}
                onMouseOut={e => { e.currentTarget.style.background = 'var(--m-bg-2)' }}
              >
                <div style={{ fontSize: '11.5px', fontFamily: 'var(--f-mono)', color: 'var(--m-fg)' }}>
                  {sourceNote?.title ?? link.source}
                </div>
                {link.context && (
                  <div style={{ marginTop: 4, fontSize: '11.5px', lineHeight: 1.45, color: 'var(--m-fg-2)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {link.context}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {unlinkedMentions.length > 0 && (
        <div style={{ borderTop: '1px solid var(--m-line-soft)', paddingTop: 8, marginTop: 8 }}>
          <div style={{ padding: '0 4px 4px', fontSize: '10.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--m-fg-3)' }}>
            {t('backlinks.unlinkedMentions', { count: unlinkedMentions.length })}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 4px' }}>
            {unlinkedMentions.map((note) => (
              <button key={note.id} onClick={() => openNote(note.id)}
                className="m-chip mono" style={{ cursor: 'pointer' }}>
                {note.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
