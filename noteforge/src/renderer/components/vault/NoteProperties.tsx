import { useState, useEffect } from 'react'
import { useEditorStore } from '../../stores/editor-store'
import { useVaultStore } from '../../stores/vault-store'
import type { NoteProperties as NotePropertiesType } from '../../types'

export default function NoteProperties() {
  const activeTab = useEditorStore((s) => s.activeTab())
  const metadata = activeTab ? useEditorStore((s) => s.editorMetadata[activeTab.notePath]) : undefined
  const updateNoteProperties = useEditorStore((s) => s.updateNoteProperties)

  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (metadata) {
      setTitle(metadata.title ?? '')
      setTags(metadata.tags?.join(', ') ?? '')
    }
  }, [metadata])

  if (!activeTab || !metadata) return null

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const props: Partial<NotePropertiesType> = {
        title,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      }
      await window.electronAPI.updateNoteProperties(activeTab.notePath, props)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-3 p-3">
      <div>
        <label className="text-xs font-medium text-[var(--color-text-muted)]">Title</label>
        <input
          className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2 py-1 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--color-text-muted)]">Tags</label>
        <input
          className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2 py-1 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          onBlur={handleSave}
          placeholder="tag1, tag2, tag3"
        />
      </div>
      <div className="text-xs text-[var(--color-text-muted)]">
        <p>Created: {new Date(metadata.created).toLocaleString()}</p>
        <p>Modified: {new Date(metadata.modified).toLocaleString()}</p>
      </div>
    </div>
  )
}
