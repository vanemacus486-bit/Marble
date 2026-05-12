import { useState, useEffect } from 'react'
import { useEditorStore } from '../../stores/editor-store'
import type { NoteProperties as NotePropertiesType } from '../../types'

export default function NoteProperties() {
  const activeTab = useEditorStore((s) => s.activeTab())
  const metadata = activeTab ? useEditorStore((s) => s.editorMetadata[activeTab.notePath]) : undefined

  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (metadata) { setTitle(metadata.title ?? ''); setTags(metadata.tags?.join(', ') ?? '') }
  }, [metadata])

  if (!activeTab || !metadata) return null

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const props: Partial<NotePropertiesType> = { title, tags: tags.split(',').map((t) => t.trim()).filter(Boolean) }
      await window.electronAPI.updateNoteProperties(activeTab.notePath, props)
    } finally { setIsSaving(false) }
  }

  const inputStyle = {
    marginTop: 4, width: '100%', borderRadius: 6,
    border: '1px solid var(--m-line)',
    background: 'var(--m-bg)', padding: '6px 10px',
    fontSize: 13, color: 'var(--m-fg)',
    fontFamily: 'var(--f-ui)', outline: 'none',
  }

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={{ fontSize: '10.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--m-fg-3)' }}>Title</label>
        <input style={inputStyle} value={title}
          onChange={(e) => setTitle(e.target.value)} onBlur={handleSave} />
      </div>
      <div>
        <label style={{ fontSize: '10.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--m-fg-3)' }}>Tags</label>
        <input style={inputStyle} value={tags}
          onChange={(e) => setTags(e.target.value)} onBlur={handleSave} placeholder="tag1, tag2, tag3" />
      </div>
      <div style={{ fontSize: '10.5px', color: 'var(--m-fg-3)', fontFamily: 'var(--f-mono)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Created</span><span style={{ color: 'var(--m-fg-2)' }}>{new Date(metadata.created).toLocaleString()}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Modified</span><span style={{ color: 'var(--m-fg-2)' }}>{new Date(metadata.modified).toLocaleString()}</span></div>
      </div>
    </div>
  )
}
