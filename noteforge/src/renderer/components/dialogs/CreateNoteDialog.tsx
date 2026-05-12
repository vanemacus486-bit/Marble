import { useState, useEffect, useRef, useMemo } from 'react'
import { useVaultStore } from '../../stores/vault-store'
import { useEditorStore } from '../../stores/editor-store'

interface CreateNoteDialogProps {
  onClose: () => void
  defaultFolder?: string
}

export default function CreateNoteDialog({ onClose, defaultFolder }: CreateNoteDialogProps) {
  const [name, setName] = useState('')
  const [selectedFolder, setSelectedFolder] = useState(defaultFolder ?? '')
  const [selectedTemplate, setSelectedTemplate] = useState('none')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshFiles = useVaultStore((s) => s.refreshFiles)
  const openNote = useEditorStore((s) => s.openNote)
  const inputRef = useRef<HTMLInputElement>(null)

  const folders = useMemo(() => {
    const set = new Set<string>()
    for (const note of useVaultStore.getState().notes.values()) {
      const folder = note.id.includes('/') ? note.id.substring(0, note.id.lastIndexOf('/')) : ''
      if (folder) set.add(folder)
    }
    return [...set].sort()
  }, [])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleCreate = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Note name is required')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const notePath = selectedFolder
        ? `${selectedFolder}/${trimmedName}.html`
        : `${trimmedName}.html`

      const template: string | undefined =
        selectedTemplate !== 'none' ? selectedTemplate : undefined

      await window.electronAPI.createNote(notePath, template)
      await refreshFiles()
      openNote(notePath)
      onClose()
    } catch (e) {
      setError(`Failed to create note: ${(e as Error).message}`)
    } finally {
      setIsCreating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Enter' && !isCreating) {
      handleCreate()
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 10,
          background: 'var(--m-bg-1)',
          border: '1px solid var(--m-line)',
          padding: 24,
          boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
        }}
        role="dialog"
        aria-labelledby="create-note-title"
      >
        <h2
          id="create-note-title"
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--m-fg)',
            margin: 0,
          }}
        >
          Create Note
        </h2>

        {error && (
          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              borderRadius: 6,
              background: 'oklch(0.32 0.05 25 / 0.18)',
              color: 'var(--c-red)',
              fontSize: 12,
              border: '1px solid var(--m-line-soft)',
            }}
          >
            {error}
          </div>
        )}

        {/* Note name */}
        <div style={{ marginTop: 16 }}>
          <label
            style={{
              fontSize: 10.5,
              fontWeight: 500,
              color: 'var(--m-fg-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Note Name
          </label>
          <input
            ref={inputRef}
            placeholder="my-note"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
            style={{
              marginTop: 6,
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid var(--m-line)',
              background: 'var(--m-bg)',
              color: 'var(--m-fg)',
              fontSize: 13,
              fontFamily: 'var(--f-mono)',
              outline: 0,
            }}
          />
        </div>

        {/* Folder selector */}
        <div style={{ marginTop: 12 }}>
          <label
            style={{
              fontSize: 10.5,
              fontWeight: 500,
              color: 'var(--m-fg-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Folder
            {defaultFolder && (
              <span style={{ fontWeight: 400, marginLeft: 4 }}>
                (default: {defaultFolder})
              </span>
            )}
          </label>
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            style={{
              marginTop: 6,
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid var(--m-line)',
              background: 'var(--m-bg)',
              color: 'var(--m-fg)',
              fontSize: 12.5,
              outline: 0,
            }}
          >
            <option value="">Root</option>
            {folders.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Template selector */}
        <div style={{ marginTop: 12 }}>
          <label
            style={{
              fontSize: 10.5,
              fontWeight: 500,
              color: 'var(--m-fg-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Template
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            style={{
              marginTop: 6,
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid var(--m-line)',
              background: 'var(--m-bg)',
              color: 'var(--m-fg)',
              fontSize: 12.5,
              outline: 0,
            }}
          >
            <option value="none">No template</option>
            <option value="daily">Daily Note</option>
            <option value="default">Default</option>
          </select>
        </div>

        {/* Actions */}
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: '1px solid var(--m-line)',
              background: 'transparent',
              color: 'var(--m-fg-1)',
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || !name.trim()}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: 0,
              background: 'var(--m-vein)',
              color: 'var(--m-bg)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              opacity: isCreating || !name.trim() ? 0.5 : 1,
            }}
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
