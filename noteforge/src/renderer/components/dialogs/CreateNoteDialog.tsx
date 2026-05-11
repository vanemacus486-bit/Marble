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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onKeyDown={handleKeyDown}
    >
      <div
        className="w-full max-w-md rounded-lg bg-[var(--color-bg-primary)] p-6 shadow-2xl"
        role="dialog"
        aria-labelledby="create-note-title"
      >
        <h2 id="create-note-title" className="text-lg font-semibold text-[var(--color-text-primary)]">
          Create Note
        </h2>

        {error && (
          <div className="mt-3 rounded-md bg-red-50 p-2 text-sm text-[var(--color-danger)] dark:bg-red-900/20">
            {error}
          </div>
        )}

        {/* Note name */}
        <div className="mt-4">
          <label className="text-xs font-medium text-[var(--color-text-muted)]">Note Name</label>
          <input
            ref={inputRef}
            className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
            placeholder="my-note"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
          />
        </div>

        {/* Folder selector */}
        <div className="mt-3">
          <label className="text-xs font-medium text-[var(--color-text-muted)]">
            Folder
            {defaultFolder && <span className="ml-1">(default: {defaultFolder})</span>}
          </label>
          <select
            className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
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
        <div className="mt-3">
          <label className="text-xs font-medium text-[var(--color-text-muted)]">Template</label>
          <select
            className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
          >
            <option value="none">No template</option>
            <option value="daily">Daily Note</option>
            <option value="default">Default</option>
          </select>
        </div>

        {/* Actions */}
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-1.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-tertiary)]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="rounded-md bg-[var(--color-accent)] px-4 py-1.5 text-sm text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
            onClick={handleCreate}
            disabled={isCreating || !name.trim()}
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
